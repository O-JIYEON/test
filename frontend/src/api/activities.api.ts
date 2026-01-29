import endpoints from './endpoints';
import { request } from './client';

export const fetchActivityLogs = () => request(endpoints.activities);
