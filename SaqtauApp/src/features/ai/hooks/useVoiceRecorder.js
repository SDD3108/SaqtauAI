// import {
//   AudioModule,
//   RecordingPresets,
//   setAudioModeAsync,
//   useAudioRecorder,
//   useAudioRecorderState,
// } from 'expo-audio';
// import * as FileSystem from 'expo-file-system/legacy';
// import { useCallback, useEffect, useRef, useState } from 'react';
// import { AppState } from 'react-native';

// import { MAX_VOICE_DURATION_MS } from '@/src/features/ai/voice.utils';

// const RECORDING_OPTIONS = {
//   ...RecordingPresets.HIGH_QUALITY,
//   directory: 'cache',
//   isMeteringEnabled: true,
// };

// async function setRecordingAudioMode(enabled) {
//   await setAudioModeAsync({
//     allowsRecording: enabled,
//     playsInSilentMode: true,
//     shouldRouteThroughEarpiece: false,
//   });
// }

// export async function deleteVoiceRecording(uri) {
//   if (!uri) return;

//   try {
//     await FileSystem.deleteAsync(uri, { idempotent: true });
//   } catch {
//     // The cache file may already have been removed by the OS/audio module.
//   }
// }

// export default function useVoiceRecorder({ autoStart = true } = {}) {
//   const recorder = useAudioRecorder(RECORDING_OPTIONS);
//   const recorderState = useAudioRecorderState(recorder, 80);
//   const [phase, setPhase] = useState('idle');
//   const [uri, setUri] = useState('');
//   const [error, setError] = useState('');
//   const didAutoStart = useRef(false);
//   const stopping = useRef(null);
//   const uriRef = useRef('');
//   const phaseRef = useRef('idle');

//   useEffect(() => {
//     uriRef.current = uri;
//   }, [uri]);

//   useEffect(() => {
//     phaseRef.current = phase;
//   }, [phase]);

//   const start = useCallback(async () => {
//     if (phase === 'requesting' || phase === 'recording') return;

//     setError('');
//     setPhase('requesting');

//     try {
//       const permission = await AudioModule.requestRecordingPermissionsAsync();

//       if (!permission.granted) {
//         setPhase('denied');
//         return;
//       }

//       if (uriRef.current) {
//         await deleteVoiceRecording(uriRef.current);
//         uriRef.current = '';
//         setUri('');
//       }

//       await setRecordingAudioMode(true);
//       await recorder.prepareToRecordAsync();
//       recorder.record();
//       setPhase('recording');
//     } catch (recordingError) {
//       setPhase('error');
//       setError(recordingError?.message || 'Could not start voice recording.');
//       await setRecordingAudioMode(false).catch(() => {});
//     }
//   }, [phase, recorder]);

//   const pause = useCallback(() => {
//     if (phase !== 'recording') return;
//     recorder.pause();
//     setPhase('paused');
//   }, [phase, recorder]);

//   const resume = useCallback(() => {
//     if (phase !== 'paused') return;
//     recorder.record();
//     setPhase('recording');
//   }, [phase, recorder]);

//   const stop = useCallback(async () => {
//     if (phase === 'ready' && uriRef.current) {
//       return uriRef.current;
//     }

//     if (stopping.current) {
//       return stopping.current;
//     }

//     const job = (async () => {
//       try {
//         if (phase === 'recording' || phase === 'paused' || recorder.isRecording) {
//           await recorder.stop();
//         }

//         const status = await recorder.getStatus().catch(() => null);
//         const nextUri = recorder.uri || status?.url || recorderState?.url || '';

//         if (!nextUri) {
//           throw new Error('The recording file was not created.');
//         }

//         uriRef.current = nextUri;
//         setUri(nextUri);
//         setPhase('ready');
//         await setRecordingAudioMode(false).catch(() => {});
//         return nextUri;
//       } catch (stopError) {
//         setPhase('error');
//         setError(stopError?.message || 'Could not finish voice recording.');
//         await setRecordingAudioMode(false).catch(() => {});
//         return '';
//       } finally {
//         stopping.current = null;
//       }
//     })();

//     stopping.current = job;
//     return job;
//   }, [phase, recorder, recorderState?.url]);

//   const discard = useCallback(
//     async (explicitUri) => {
//       const currentUri = explicitUri || uriRef.current;

//       if (phase === 'recording' || phase === 'paused' || recorder.isRecording) {
//         try {
//           await recorder.stop();
//         } catch {
//           // Safe cleanup path.
//         }
//       }

//       const finalUri = currentUri || recorder.uri || '';
//       await deleteVoiceRecording(finalUri);
//       uriRef.current = '';
//       setUri('');
//       setPhase('idle');
//       await setRecordingAudioMode(false).catch(() => {});
//     },
//     [phase, recorder],
//   );

//   useEffect(() => {
//     if (!autoStart || didAutoStart.current) return;
//     didAutoStart.current = true;
//     start();
//   }, [autoStart, start]);

//   useEffect(() => {
//     if (
//       phase === 'recording' &&
//       Number(recorderState?.durationMillis || 0) >= MAX_VOICE_DURATION_MS
//     ) {
//       stop();
//     }
//   }, [phase, recorderState?.durationMillis, stop]);

//   useEffect(() => {
//     const subscription = AppState.addEventListener('change', (nextState) => {
//       if (nextState !== 'active' && phase === 'recording') {
//         pause();
//       }
//     });

//     return () => subscription.remove();
//   }, [pause, phase]);

//   useEffect(
//     () => () => {
//       const cleanup = async () => {
//         try {
//           if (
//             phaseRef.current === 'recording' ||
//             phaseRef.current === 'paused' ||
//             recorder.isRecording
//           ) {
//             await recorder.stop();
//           }
//         } catch {
//           // Recorder may already be stopped/disposed during navigation.
//         }

//         await deleteVoiceRecording(uriRef.current || recorder.uri || '');
//         await setRecordingAudioMode(false).catch(() => {});
//       };

//       cleanup();
//     },
//     [recorder],
//   );

//   return {
//     phase,
//     uri,
//     error,
//     recorderState,
//     start,
//     pause,
//     resume,
//     stop,
//     discard,
//     setError,
//   };
// }

import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import * as FileSystem from 'expo-file-system/legacy';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { MAX_VOICE_DURATION_MS } from '@/src/features/ai/voice.utils';

const RECORDING_OPTIONS = {
  ...RecordingPresets.HIGH_QUALITY,
  directory: 'cache',
  isMeteringEnabled: true,
};

async function setRecordingAudioMode(enabled) {
  await setAudioModeAsync({
    allowsRecording: enabled,
    playsInSilentMode: true,
    shouldRouteThroughEarpiece: false,
  });
}

export async function deleteVoiceRecording(uri) {
  if (!uri) return;

  try {
    await FileSystem.deleteAsync(uri, {
      idempotent: true,
    });
  } catch {
    // File may already be removed.
  }
}

export default function useVoiceRecorder({ autoStart = true } = {}) {
  const recorder = useAudioRecorder(RECORDING_OPTIONS);
  const recorderState = useAudioRecorderState(recorder, 80);

  const [phase, setPhase] = useState('idle');
  const [uri, setUri] = useState('');
  const [error, setError] = useState('');

  const didAutoStart = useRef(false);
  const stopping = useRef(null);

  const uriRef = useRef('');
  const phaseRef = useRef('idle');

  useEffect(() => {
    uriRef.current = uri;
  }, [uri]);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  const start = useCallback(async () => {
    if (
      phaseRef.current === 'requesting' ||
      phaseRef.current === 'recording'
    ) {
      return;
    }

    setError('');
    setPhase('requesting');

    try {
      const permission =
        await AudioModule.requestRecordingPermissionsAsync();

      if (!permission.granted) {
        setPhase('denied');
        return;
      }

      if (uriRef.current) {
        await deleteVoiceRecording(uriRef.current);

        uriRef.current = '';
        setUri('');
      }

      await setRecordingAudioMode(true);

      await recorder.prepareToRecordAsync();

      recorder.record();

      setPhase('recording');
    } catch (recordingError) {
      console.error('Recording start error:', recordingError);

      setPhase('error');

      setError(
        recordingError?.message ||
          'Could not start voice recording.',
      );

      await setRecordingAudioMode(false).catch(() => {});
    }
  }, [recorder]);

  const pause = useCallback(() => {
    if (phaseRef.current !== 'recording') return;

    try {
      recorder.pause();
      setPhase('paused');
    } catch (pauseError) {
      console.error('Recording pause error:', pauseError);

      setError(
        pauseError?.message ||
          'Could not pause voice recording.',
      );
    }
  }, [recorder]);

  const resume = useCallback(() => {
    if (phaseRef.current !== 'paused') return;

    try {
      recorder.record();
      setPhase('recording');
    } catch (resumeError) {
      console.error('Recording resume error:', resumeError);

      setError(
        resumeError?.message ||
          'Could not resume voice recording.',
      );
    }
  }, [recorder]);

  const stop = useCallback(async () => {
    if (
      phaseRef.current === 'ready' &&
      uriRef.current
    ) {
      return uriRef.current;
    }

    if (stopping.current) {
      return stopping.current;
    }

    const job = (async () => {
      try {
        const currentPhase = phaseRef.current;

        if (
          currentPhase === 'recording' ||
          currentPhase === 'paused'
        ) {
          await recorder.stop();
        }

        /*
         * IMPORTANT:
         *
         * getStatus() is synchronous in expo-audio.
         *
         * Do NOT do:
         *
         * recorder.getStatus().catch(...)
         */

        let nextUri = '';

        try {
          nextUri = recorder.uri || '';
        } catch (uriError) {
          console.warn(
            'Could not read recorder URI:',
            uriError,
          );
        }

        /*
         * useAudioRecorderState already gives us a JS-side
         * status object, so use its URL as a fallback.
         */
        if (!nextUri) {
          nextUri = recorderState?.url || '';
        }

        if (!nextUri) {
          throw new Error(
            'The recording file was not created.',
          );
        }

        uriRef.current = nextUri;

        setUri(nextUri);
        setPhase('ready');

        await setRecordingAudioMode(false).catch(() => {});

        return nextUri;
      } catch (stopError) {
        console.error('Recording stop error:', stopError);

        setPhase('error');

        setError(
          stopError?.message ||
            'Could not finish voice recording.',
        );

        await setRecordingAudioMode(false).catch(() => {});

        return '';
      } finally {
        stopping.current = null;
      }
    })();

    stopping.current = job;

    return job;
  }, [recorder, recorderState?.url]);

  const discard = useCallback(
    async (explicitUri) => {
      const currentUri =
        explicitUri || uriRef.current;

      try {
        if (
          phaseRef.current === 'recording' ||
          phaseRef.current === 'paused'
        ) {
          await recorder.stop();
        }
      } catch (stopError) {
        console.warn(
          'Recorder was already stopped:',
          stopError,
        );
      }

      let recorderUri = '';

      try {
        recorderUri = recorder.uri || '';
      } catch {
        /*
         * Recorder may already have been disposed.
         * This is safe to ignore.
         */
      }

      const finalUri =
        currentUri ||
        recorderUri ||
        recorderState?.url ||
        '';

      await deleteVoiceRecording(finalUri);

      uriRef.current = '';

      setUri('');
      setPhase('idle');

      await setRecordingAudioMode(false).catch(() => {});
    },
    [recorder, recorderState?.url],
  );

  useEffect(() => {
    if (!autoStart || didAutoStart.current) {
      return;
    }

    didAutoStart.current = true;

    start();
  }, [autoStart, start]);

  useEffect(() => {
    if (
      phase === 'recording' &&
      Number(recorderState?.durationMillis || 0) >=
        MAX_VOICE_DURATION_MS
    ) {
      stop();
    }
  }, [
    phase,
    recorderState?.durationMillis,
    stop,
  ]);

  useEffect(() => {
    const subscription = AppState.addEventListener(
      'change',
      (nextState) => {
        if (
          nextState !== 'active' &&
          phaseRef.current === 'recording'
        ) {
          pause();
        }
      },
    );

    return () => {
      subscription.remove();
    };
  }, [pause]);

  /*
   * IMPORTANT:
   *
   * useAudioRecorder manages the native recorder lifecycle.
   *
   * On unmount DON'T access:
   *
   * recorder.uri
   * recorder.isRecording
   * recorder.stop()
   * recorder.getStatus()
   *
   * because the SharedObject can already be disposed.
   */
  useEffect(() => {
    return () => {
      const savedUri = uriRef.current;

      if (savedUri) {
        deleteVoiceRecording(savedUri);
      }

      setRecordingAudioMode(false).catch(() => {});
    };
  }, []);

  return {
    phase,
    uri,
    error,
    recorderState,

    start,
    pause,
    resume,
    stop,
    discard,

    setError,
  };
}