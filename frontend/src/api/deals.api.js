import endpoints from './endpoints';
import { request } from './client';

export const fetchDeals = () => request(endpoints.deals);

export const createDeal = (payload) =>
  request(endpoints.deals, {
    method: 'POST',
    body: JSON.stringify(payload)
  });

export const updateDeal = (id, payload) =>
  request(`${endpoints.deals}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });

export const deleteDeal = (id) => request(`${endpoints.deals}/${id}`, { method: 'DELETE' });
