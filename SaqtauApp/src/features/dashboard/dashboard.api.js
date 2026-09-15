import { ApiError, apiRequest } from '@/src/services/api/client';

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

export async function getDashboardSummary() {
  try {
    return await apiRequest('/dashboard/summary/');
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }

    throw error;
  }
}

export async function getDashboardMeasurements() {
  const data = await apiRequest('/measurements/');
  return normalizeMeasurementsResponse(data);
}
