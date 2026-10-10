import { getCurrentLocale, tNow } from '@/src/features/localization/localization.store';

function firstValue(...values) {
  return values.find(
    (value) => value !== undefined && value !== null && value !== '',
  );
}

export function normalizeFamilyMember(member) {
  if (!member) return null;

  const account = member.account || member.member || {};
  const last =
    member.latest_measurement || member.latest || member.last || member.measurement || null;

  return {
    ...member,
    accountId: String(
      firstValue(member.account_id, account.id, member.id, member.accountId) || '',
    ),
    name: String(
      firstValue(
        member.name,
        member.display_name,
        account.display_name,
        account.name,
        account.email,
        tNow('common.familyMember'),
      ),
    ),
    role: String(
      firstValue(member.role, member.invited_role, member.relationship, 'family'),
    ).toLowerCase(),
    last: normalizeLastMeasurement(last),
  };
}

export function normalizeFamilyResponse(payload) {
  const rawMembers = Array.isArray(payload)
    ? payload
    : payload?.members || payload?.results || [];

  return {
    members: rawMembers.map(normalizeFamilyMember).filter(Boolean),
    max: Number(payload?.max || 5),
  };
}

export function normalizeLastMeasurement(last) {
  if (!last) return null;

  return {
    ...last,
    bpm: firstValue(last.bpm, last.heart_rate, last.heartRate),
    stress: firstValue(last.stress, last.stress_level, last.stressLevel),
    quality: firstValue(last.quality, last.signal_quality, last.signalQuality),
    at: firstValue(
      last.at,
      last.processed_at,
      last.processedAt,
      last.created_at,
      last.createdAt,
    ),
  };
}

export function normalizeInvite(invite) {
  return {
    ...invite,
    id: String(invite?.id || ''),
    direction: invite?.direction || 'incoming',
    counterpartId: String(invite?.counterpart_id || ''),
    counterpartName:
      invite?.counterpart_name ||
      invite?.name ||
      invite?.display_name ||
      tNow('common.familyMember'),
    status: invite?.status || 'pending',
    createdAt: invite?.created_at || null,
  };
}

export function formatRelativeDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const now = new Date();
  const diffSeconds = Math.max(0, Math.round((now.getTime() - date.getTime()) / 1000));
  const formatter = new Intl.RelativeTimeFormat(getCurrentLocale(), { numeric: 'auto' });

  if (diffSeconds < 45) return tNow('common.justNow');
  if (diffSeconds < 3600) return formatter.format(-Math.round(diffSeconds / 60), 'minute');
  if (diffSeconds < 86400) return formatter.format(-Math.round(diffSeconds / 3600), 'hour');
  if (diffSeconds < 604800) return formatter.format(-Math.round(diffSeconds / 86400), 'day');

  return date.toLocaleDateString(getCurrentLocale(), {
    month: 'short',
    day: 'numeric',
  });
}

export function formatMeasurementTime(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return date.toLocaleString(getCurrentLocale(), {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatSignalQuality(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return null;
  const percent = number <= 1 ? Math.round(number * 100) : Math.round(number);
  return `${Math.max(0, Math.min(100, percent))}%`;
}

export function initialsForName(name) {
  return String(name || tNow('common.familyMember'))
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'F';
}
