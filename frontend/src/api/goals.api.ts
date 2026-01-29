import endpoints from './endpoints';
import { request } from './client';

export const fetchGoals = () => request(endpoints.goals);

export const upsertGoal = (payload) =>
  request(endpoints.goals, {
    method: 'POST',
    body: JSON.stringify(payload)
  });

export const deleteGoal = (id) => request(`${endpoints.goals}/${id}`, { method: 'DELETE' });
