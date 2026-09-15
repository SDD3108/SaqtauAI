import { API_URL } from '@/src/constants/config';
import {
  ApiError,
  apiRequest,
  getApiToken,
} from '@/src/services/api/client';

function parseResponseBody(text) {
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function getUploadErrorMessage(data, status) {
  if (typeof data === 'string' && data.trim()) {
    return data;
  }

  if (data?.detail) {
    return data.detail;
  }

  if (data?.source_video) {
    const value = Array.isArray(data.source_video)
      ? data.source_video[0]
      : data.source_video;

    if (value) {
      return value;
    }
  }

  return `Upload failed with status ${status}`;
}

function getVideoFileName(videoUri) {
  const cleanUri = String(videoUri || '').split('?')[0];
  const match = cleanUri.match(/\.([a-zA-Z0-9]+)$/);
  const extension = match?.[1]?.toLowerCase();
  const supported = ['mp4', 'mov', 'm4v', 'webm'];
  const safeExtension = supported.includes(extension)
    ? extension
    : 'mp4';

  return `saqtau-checkin-${Date.now()}.${safeExtension}`;
}

export function uploadCameraMeasurement({
  videoUri,
  onProgress,
}) {
  let xhr = null;

  const promise = new Promise((resolve, reject) => {
    xhr = new XMLHttpRequest();

    xhr.open('POST', `${API_URL}/measurements/`);
    xhr.setRequestHeader('Accept', 'application/json');

    const token = getApiToken();

    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable || !onProgress) {
        return;
      }

      onProgress(
        Math.min(1, event.loaded / event.total),
      );
    };

    xhr.onerror = () => {
      reject(
        new ApiError(
          'Network request failed while uploading your check-in.',
        ),
      );
    };

    xhr.onabort = () => {
      reject(
        new ApiError('Check-in upload was cancelled.'),
      );
    };

    xhr.onload = () => {
      const data = parseResponseBody(xhr.responseText);

      if (xhr.status < 200 || xhr.status >= 300) {
        reject(
          new ApiError(
            getUploadErrorMessage(data, xhr.status),
            xhr.status,
            data,
          ),
        );
        return;
      }

      onProgress?.(1);
      resolve(data);
    };

    const formData = new FormData();

    formData.append('source_type', 'camera_rppg');
    formData.append('source_video', {
      uri: videoUri,
      name: getVideoFileName(videoUri),
      type: videoUri?.toLowerCase().includes('.mov')
        ? 'video/quicktime'
        : 'video/mp4',
    });

    xhr.send(formData);
  });

  return {
    promise,
    abort: () => xhr?.abort(),
  };
}

export function getMeasurement(measurementId) {
  return apiRequest(
    `/measurements/${measurementId}/`,
  );
}

export function deleteMeasurement(measurementId) {
  return apiRequest(
    `/measurements/${measurementId}/`,
    {
      method: 'DELETE',
    },
  );
}
