import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Animated, AppState, Pressable, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';

import Logo from '@/assets/images/Logo.svg';
import Cigarette from '@/assets/images/cigarette.svg';
import useI18n from '@/src/features/localization/hooks/useI18n';
import { advance, jump, newRun, OBSTACLE_SIZE, PLAYER_SIZE, PLAYER_X } from '../utils/runner';

const FLOOR = 13;
function WaitingRunner() {
  const { t } = useI18n();
  const [width, setWidth] = useState(0);
  const [mode, setMode] = useState('idle');
  const [score, setScore] = useState(0);
  const run = useRef(null);
  const [x] = useState(() => new Animated.Value(0));
  const [y] = useState(() => new Animated.Value(0));

  useEffect(() => {
    run.current = newRun(width);
    x.setValue(width - 37);
    y.setValue(0);
    setScore(0);
    setMode('idle');
  }, [width, x, y]);

  useFocusEffect(useCallback(() => {
    if (mode !== 'playing' || !width) return undefined;
    let frame = null;
    let previous = null;
    function tick(time) {
      const state = run.current;
      const oldScore = state.score;
      advance(state, width, previous === null ? 0 : (time - previous) / 1000);
      previous = time;
      x.setValue(state.x);
      y.setValue(-state.y);
      if (state.score !== oldScore) setScore(state.score);
      if (state.over) {
        setMode('over');
        return;
      }
      frame = requestAnimationFrame(tick);
    }
    function stop() {
      if (frame !== null) cancelAnimationFrame(frame);
      frame = null;
      previous = null;
    }
    function resume(state) {
      stop();
      if (state === 'active') frame = requestAnimationFrame(tick);
    }
    resume(AppState.currentState || 'active');
    const sub = AppState.addEventListener('change', resume);
    return () => { stop(); sub.remove(); };
  }, [mode, width, x, y]));

  function tap() {
    if (!width || !run.current) return;
    if (mode !== 'playing') {
      run.current = newRun(width);
      setScore(0);
      x.setValue(run.current.x);
      setMode('playing');
    }
    jump(run.current);
  }
  const hint = t(mode === 'over' ? 'checkin.runnerRetry' : mode === 'playing' ? 'checkin.runnerJump' : 'checkin.runnerStart');
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={hint}
      accessibilityValue={{ text: t('checkin.runnerScore', { score }) }}
      onPress={tap} className="w-full rounded-[22px] bg-white px-4 pb-3 pt-4">
      <View className="flex-row items-center justify-between gap-3">
        <Text className="flex-1 font-inter-semibold text-[15px] text-[#181027]">{t('checkin.runnerTitle')}</Text>
        <Text className="font-inter-semibold text-[13px] text-[#654E9A]">{t('checkin.runnerScore', { score })}</Text>
      </View>
      <View onLayout={e => setWidth(e.nativeEvent.layout.width)}
        style={{ height: 125, overflow: 'hidden' }} pointerEvents="none">
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: FLOOR - 1, height: 2, backgroundColor: '#C8C1D6' }} />
        <Animated.View style={{ position: 'absolute', left: PLAYER_X, bottom: FLOOR, transform: [{ translateY: y }] }}>
          <Logo width={PLAYER_SIZE} height={PLAYER_SIZE}/>
        </Animated.View>
        {width > 0 && <Animated.View style={{ position: 'absolute', left: -OBSTACLE_SIZE / 2, bottom: FLOOR - 3, transform: [{ translateX: x }] }}>
          <View style={{ transform: [{ rotate: '90deg' }] }}><Cigarette width={OBSTACLE_SIZE} height={OBSTACLE_SIZE}/></View>
        </Animated.View>}
      </View>
      <Text className="text-center font-inter-medium text-[13px] leading-[19px] text-[#625B70]">{hint}</Text>
    </Pressable>
  );
}
export default memo(WaitingRunner);
