import { ApiError, apiRequest } from '@/src/services/api/client';
import { File } from 'expo-file-system';
function firstText(...values) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return '';
}
// Provider credentials and the trusted wellness context belong to Django only.
export async function sendAiMessage(turn) {
  const data = await apiRequest('/ai/chat/', { method: 'POST', body: turn, timeout: 60000 });
  if (data?.request_id !== turn.request_id || typeof data?.reply !== 'string' ||
      !data.reply.trim() || data.reply.length > 6000) {
    throw new ApiError('Invalid chat response', 502);
  }
  return {
    text: data.reply.trim(),
    intent: ['start_checkin', 'view_trends'].includes(data.intent) ? data.intent : '',
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
