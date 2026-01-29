import dayjs from 'dayjs';

export function normalizeDateValue(value: unknown) {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const text = String(value);
  const parsed = dayjs(text);
  if (parsed.isValid()) {
    return parsed.format('YYYY-MM-DD');
  }
  return text.includes('T') ? text.split('T')[0] : text;
}

export function normalizeNumberValue(value: unknown) {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const numeric = String(value).replace(/[^\d.-]/g, '');
  if (numeric === '' || Number.isNaN(Number(numeric))) {
    return null;
  }
  return Number(numeric);
}

export function normalizeIdValue(value: unknown) {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  return value;
}
