const UNIX_SECONDS_THRESHOLD = 9999999999;

const normalizeDateTimeString = (value) => {
  const text = String(value || '').trim();
  if (!text) {
    return null;
  }

  let normalized = text.replace(',', '.');

  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(normalized)) {
    normalized = normalized.replace(' ', 'T');
  }

  normalized = normalized.replace(/(\.\d{3})\d+(?=Z|[+\-]\d{2}:?\d{2}$)/, '$1');

  if (!/Z$|[+\-]\d{2}:?\d{2}$/.test(normalized)) {
    normalized = `${normalized}Z`;
  }

  return normalized;
};

export const parseAppDateTime = (value) => {
  if (value == null || value === '') {
    return null;
  }

  const asNumber = Number(value);
  if (Number.isFinite(asNumber)) {
    const epochMs = asNumber > UNIX_SECONDS_THRESHOLD ? asNumber : asNumber * 1000;
    const date = new Date(epochMs);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const normalized = normalizeDateTimeString(value);
  if (!normalized) {
    return null;
  }

  const parsed = Date.parse(normalized);
  if (!Number.isFinite(parsed)) {
    return null;
  }

  return new Date(parsed);
};

export const getAppDateTimeMs = (value) => {
  const parsed = parseAppDateTime(value);
  return parsed ? parsed.getTime() : 0;
};

export const formatLocalDateTime = (value, options) => {
  const parsed = parseAppDateTime(value);
  if (!parsed) {
    return '-';
  }

  return parsed.toLocaleString(undefined, options);
};

export const formatLocalDate = (value, options) => {
  const parsed = parseAppDateTime(value);
  if (!parsed) {
    return '-';
  }

  return parsed.toLocaleDateString(undefined, options);
};
