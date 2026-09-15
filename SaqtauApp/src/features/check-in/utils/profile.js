export const PROFILE_LIMITS = {
  metric: {
    height: { min: 50, max: 250 },
    weight: { min: 10, max: 350 },
  },
  imperial: {
    height: { min: 20, max: 100 },
    weight: { min: 20, max: 770 },
  },
};

export function roundToOne(value) {
  return Math.round(value * 10) / 10;
}

export function heightToCm(value, units) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return null;
  }

  return units === 'imperial' ? roundToOne(number * 2.54) : roundToOne(number);
}

export function weightToKg(value, units) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return null;
  }

  return units === 'imperial'
    ? roundToOne(number * 0.45359237)
    : roundToOne(number);
}

export function heightFromCm(value, units) {
  if (!Number.isFinite(Number(value))) {
    return '';
  }

  return units === 'imperial'
    ? String(roundToOne(Number(value) / 2.54))
    : String(roundToOne(Number(value)));
}

export function weightFromKg(value, units) {
  if (!Number.isFinite(Number(value))) {
    return '';
  }

  return units === 'imperial'
    ? String(roundToOne(Number(value) / 0.45359237))
    : String(roundToOne(Number(value)));
}

export function parseLocalDate(value) {
  if (!value) {
    return null;
  }

  const [year, month, day] = value.split('-').map(Number);

  if (!year || !month || !day) {
    return null;
  }

  return new Date(year, month - 1, day, 12, 0, 0);
}

export function toLocalDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function formatDate(value) {
  const date = parseLocalDate(value);

  if (!date) {
    return '';
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}
