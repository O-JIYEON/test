import endpoints from './endpoints';
import { request } from './client';

export const fetchLookupCategories = () => request(endpoints.lookupCategories);

export const createLookupCategory = (payload) =>
  request(endpoints.lookupCategories, {
    method: 'POST',
    body: JSON.stringify(payload)
  });

export const updateLookupCategory = (id, payload) =>
  request(`${endpoints.lookupCategories}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });

export const deleteLookupCategory = (id) =>
  request(`${endpoints.lookupCategories}/${id}`, { method: 'DELETE' });

export const fetchLookupValues = (categoryId) => {
  const query = categoryId ? `?category_id=${categoryId}` : '';
  return request(`${endpoints.lookupValues}${query}`);
};

export const createLookupValue = (payload) =>
  request(endpoints.lookupValues, {
    method: 'POST',
    body: JSON.stringify(payload)
  });

export const updateLookupValue = (id, payload) =>
  request(`${endpoints.lookupValues}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });

export const deleteLookupValue = (id) =>
  request(`${endpoints.lookupValues}/${id}`, { method: 'DELETE' });
