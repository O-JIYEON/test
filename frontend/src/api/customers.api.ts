import endpoints from './endpoints';
import { request } from './client';

export const fetchCustomers = () => request(endpoints.customers);

export const fetchCustomerContacts = (customerId) =>
  request(`${endpoints.customerContacts}?customer_id=${customerId}`);

export const createCustomer = (payload) =>
  request(endpoints.customers, {
    method: 'POST',
    body: JSON.stringify(payload)
  });

export const updateCustomer = (id, payload) =>
  request(`${endpoints.customers}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });

export const deleteCustomer = (id) =>
  request(`${endpoints.customers}/${id}`, { method: 'DELETE' });

export const createCustomerContact = (payload) =>
  request(endpoints.customerContacts, {
    method: 'POST',
    body: JSON.stringify(payload)
  });

export const updateCustomerContact = (id, payload) =>
  request(`${endpoints.customerContacts}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });

export const deleteCustomerContact = (id) =>
  request(`${endpoints.customerContacts}/${id}`, { method: 'DELETE' });
