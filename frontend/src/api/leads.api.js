import endpoints from './endpoints';
import { request } from './client';

export const fetchLeads = () => request(endpoints.leads);

export const createLead = (payload) =>
  request(endpoints.leads, {
    method: 'POST',
    body: JSON.stringify(payload)
  });

export const updateLead = (id, payload) =>
  request(`${endpoints.leads}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });

export const deleteLead = (id) =>
  request(`${endpoints.leads}/${id}`, { method: 'DELETE' });
