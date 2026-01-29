import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

const DEFAULT_TZ = 'Asia/Seoul';

dayjs.extend(utc);
dayjs.extend(timezone);

export const now = () => dayjs();

export const toDayjs = (value) => {
  if (!value) return null;
  return dayjs(value);
};

export const toKst = (value) => {
  if (!value) return null;
  return dayjs.utc(value).tz(DEFAULT_TZ);
};

export const formatDate = (value, format = 'YYYY-MM-DD') => {
  if (!value) return '';
  return dayjs(value).format(format);
};

export const formatDateTime = (value, format = 'YYYY-MM-DD HH:mm') => {
  if (!value) return '';
  return dayjs(value).format(format);
};

export const formatKstDate = (value, format = 'YYYY-MM-DD') => {
  if (!value) return '';
  return dayjs.utc(value).tz(DEFAULT_TZ).format(format);
};

export const formatKstDateTime = (value, format = 'YYYY-MM-DD HH:mm') => {
  if (!value) return '';
  return dayjs.utc(value).tz(DEFAULT_TZ).format(format);
};

export const normalizeDateForCompare = (value) => {
  if (!value) return null;
  return dayjs(value).hour(12).minute(0).second(0).millisecond(0);
};

export const parseDateOnly = (value) => {
  if (!value) return null;
  return dayjs(String(value).slice(0, 10));
};

export const startOfMonth = (value) => dayjs(value).startOf('month');
export const endOfMonth = (value) => dayjs(value).endOf('month');

export const isSameOrAfter = (a, b, unit = 'day') => dayjs(a).isSame(b, unit) || dayjs(a).isAfter(b, unit);
export const isSameOrBefore = (a, b, unit = 'day') => dayjs(a).isSame(b, unit) || dayjs(a).isBefore(b, unit);

export default dayjs;
