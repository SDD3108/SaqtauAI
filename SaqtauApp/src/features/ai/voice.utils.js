export const MAX_VOICE_DURATION_MS = 120000;

export function formatVoiceDuration(milliseconds) {
  const totalSeconds = Math.max(0, Math.floor((Number(milliseconds) || 0) / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function getAudioUploadInfo(uri) {
  const cleanUri = String(uri || '').split('?')[0];
  const extension = cleanUri.match(/\.([a-zA-Z0-9]+)$/)?.[1]?.toLowerCase() || 'm4a';

  const mimeByExtension = {
    m4a: 'audio/m4a',
    mp4: 'audio/mp4',
    aac: 'audio/aac',
    caf: 'audio/x-caf',
    wav: 'audio/wav',
    webm: 'audio/webm',
  };

  return {
    extension,
    mimeType: mimeByExtension[extension] || 'audio/m4a',
    fileName: `saqtau-voice.${extension}`,
  };
}

export function meteringToLevel(metering) {
  if (!Number.isFinite(metering)) return 0.22;
  const clamped = Math.max(-60, Math.min(0, metering));
  return Math.max(0.12, Math.min(1, (clamped + 60) / 60));
}
