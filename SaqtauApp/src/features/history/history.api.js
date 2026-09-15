import { apiRequest } from '@/src/services/api/client';

function normalizeMeasurementsResponse(data) {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.results)) {
    return data.results;
  }

  if (Array.isArray(data?.measurements)) {
    return data.measurements;
  }

  return [];
}

export async function getMeasurementsHistory() {
  const data = await apiRequest('/measurements/');
  return normalizeMeasurementsResponse(data);
}

export function getServerTrends(period = '7d') {
  return apiRequest(`/trends?period=${encodeURIComponent(period)}`);
}
