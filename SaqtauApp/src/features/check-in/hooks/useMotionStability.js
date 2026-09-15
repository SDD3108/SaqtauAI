import { useEffect, useState } from 'react';
import { Accelerometer } from 'expo-sensors';

const UPDATE_INTERVAL_MS = 20;
const UI_INTERVAL_MS = 200;
const STABLE_THRESHOLD = 0.045;

export default function useMotionStability(enabled) {
  const [state, setState] = useState({
    available: true,
    stable: true,
    motionLevel: 0,
  });

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    let subscription = null;
    let cancelled = false;
    let previous = null;
    let smoothedMotion = 0;
    let lastUiUpdate = 0;

    async function start() {
      const available =
        await Accelerometer.isAvailableAsync();

      if (cancelled) {
        return;
      }

      if (!available) {
        setState({
          available: false,
          stable: false,
          motionLevel: 1,
        });
        return;
      }

      Accelerometer.setUpdateInterval(
        UPDATE_INTERVAL_MS,
      );

      subscription = Accelerometer.addListener(
        ({ x, y, z }) => {
          if (previous) {
            const dx = x - previous.x;
            const dy = y - previous.y;
            const dz = z - previous.z;

            const motion = Math.sqrt(
              dx * dx + dy * dy + dz * dz,
            );

            smoothedMotion =
              smoothedMotion * 0.82 +
              motion * 0.18;
          }

          previous = { x, y, z };

          const now = Date.now();

          if (
            now - lastUiUpdate <
            UI_INTERVAL_MS
          ) {
            return;
          }

          lastUiUpdate = now;

          setState({
            available: true,
            stable:
              smoothedMotion <=
              STABLE_THRESHOLD,
            motionLevel: smoothedMotion,
          });
        },
      );
    }

    start();

    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, [enabled]);

  return state;
}
