import { ApiError, apiRequest } from '@/src/services/api/client';
import { getAudioUploadInfo } from '@/src/features/ai/voice.utils';
import { File } from 'expo-file-system';
function firstText(...values) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return '';
}
export function normalizeAiReply(data) {
  if (typeof data === 'string' && data.trim()) {
    return data.trim();
  }

  const text = firstText(
    data?.reply,
    data?.response,
    data?.answer,
    data?.message,
    data?.text,
    data?.content,
    data?.output,
    data?.assistant?.content,
    data?.assistant?.message,
    data?.result?.reply,
    data?.result?.response,
    data?.result?.content,
    data?.data?.reply,
    data?.data?.content,
  );

  if (!text) {
    throw new ApiError(
      'SaqtauAI returned an unsupported response format.',
      0,
      data,
    );
  }

  return text;
}
export function normalizeAiIntent(data) {
  const raw = firstText(
    data?.intent,
    data?.action,
    data?.type,
    data?.result?.intent,
    data?.result?.action,
    data?.data?.intent,
  );

  return raw.toLowerCase().replace(/[\s-]+/g, '_');
}
export async function sendAiMessage({ message, lang = 'en', context, history = [] }) {
  const data = await apiRequest('/ai/chat/', {
    method: 'POST',
    body: {
      message,
      lang,
      ...(context ? { context } : {}),
      ...(history.length ? { history } : {}),
    },
  });

  return {
    raw: data,
    text: normalizeAiReply(data),
  };
}
export async function classifyAiIntent(message, lang = 'en') {
  const data = await apiRequest('/ai/intent/', {
    method: 'POST',
    body: { message, lang },
  });

  return {
    raw: data,
    intent: normalizeAiIntent(data),
  };
}
export async function transcribeAiAudio({ uri, lang } = {}) {
  if (!uri) {
    throw new ApiError(
      'The voice recording is missing.',
      0,
      null,
    );
  }

  const audioFile = new File(uri);

  // console.log('[VOICE FILE]', {
  //   uri: audioFile.uri,
  //   name: audioFile.name,
  //   type: audioFile.type,
  //   size: audioFile.size,
  // });

  const form = new FormData();

  form.append('audio', audioFile);

  const normalizedLang =
    String(lang || '').toLowerCase();

  if (['ru', 'kk', 'en'].includes(normalizedLang)) {
    form.append('lang', normalizedLang);
  }

  let data;

  try {
    data = await apiRequest('/ai/transcribe/', {
      method: 'POST',
      body: form,
      timeout: 120000,
    });
  } catch (error) {
    if (
      error instanceof ApiError &&
      [404, 405].includes(error.status)
    ) {
      const legacyFile = new File(uri);

      const legacyForm = new FormData();

      legacyForm.append(
        'audio',
        legacyFile,
      );

      if (
        ['ru', 'kk', 'en'].includes(
          normalizedLang,
        )
      ) {
        legacyForm.append(
          'lang',
          normalizedLang,
        );
      }

      data = await apiRequest(
        '/kids/voice/',
        {
          method: 'POST',
          body: legacyForm,
          timeout: 120000,
        },
      );
    } else {
      throw error;
    }
  }

  console.log(
    '[VOICE TRANSCRIBE RESPONSE]',
    JSON.stringify(data, null, 2),
  );
  const transcript = firstText(
  data?.transcript,
  data?.transcription,
  data?.text,
  data?.recognized_text,
  data?.recognizedText,

  data?.result?.transcript,
  data?.result?.transcription,
  data?.result?.text,
  data?.result?.recognized_text,

  data?.data?.transcript,
  data?.data?.transcription,
  data?.data?.text,
  data?.data?.recognized_text,

  data?.response?.transcript,
  data?.response?.text,
  );

  if (!transcript) {
    throw new ApiError(
      'SaqtauAI could not transcribe this recording.',
      0,
      data,
    );
  }

  return {
    raw: data,
    transcript,
  };
}
// export async function transcribeAiAudio({ uri, lang } = {}) {
//   if (!uri) {
//     throw new ApiError('The voice recording is missing.', 0, null);
//   }

//   const file = getAudioUploadInfo(uri);
//   const form = new FormData();

//   form.append('audio', {
//     uri,
//     name: file.fileName,
//     type: file.mimeType,
//   });
//   if (['ru', 'kk', 'en'].includes(String(lang || '').toLowerCase())) {
//     form.append('lang', String(lang).toLowerCase());
//   }

//   let data;

//   try {
//     data = await apiRequest('/ai/transcribe/', {
//       method: 'POST',
//       body: form,
//     });
//   } catch (error) {
//     // The original API contract exposes /ai/transcribe/. An older supplied
//     // Django snapshot exposes the same STT implementation at /kids/voice/.
//     // Only fall back when the primary route itself is unavailable.
//     if (error instanceof ApiError && [404, 405].includes(error.status)) {
//       const legacyForm = new FormData();
//       legacyForm.append('audio', {
//         uri,
//         name: file.fileName,
//         type: file.mimeType,
//       });
//       if (['ru', 'kk', 'en'].includes(String(lang || '').toLowerCase())) {
//         legacyForm.append('lang', String(lang).toLowerCase());
//       }
//       data = await apiRequest('/kids/voice/', {
//         method: 'POST',
//         body: legacyForm,
//       });
//     } else {
//       throw error;
//     }
//   }

//   const transcript = firstText(
//     data?.transcript,
//     data?.text,
//     data?.result?.transcript,
//     data?.data?.transcript,
//   );

//   if (!transcript) {
//     throw new ApiError('SaqtauAI could not transcribe this recording.', 0, data);
//   }

//   return {
//     raw: data,
//     transcript,
//   };
// }
