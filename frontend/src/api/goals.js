const API_URL = 'http://localhost:9090/api';

const getToken = () => localStorage.getItem('habitx_token');

export const getGoals = async () => {
  const res = await fetch(`${API_URL}/goals`, {
    headers: { 'Authorization': `Bearer ${getToken()}` }
  });
  if (!res.ok) throw new Error('Failed to fetch goals');
  return res.json();
};

export const getGoalsByCategory = async (category) => {
  const res = await fetch(`${API_URL}/goals?category=${encodeURIComponent(category)}`, {
    headers: { 'Authorization': `Bearer ${getToken()}` }
  });
  if (!res.ok) throw new Error('Failed to fetch goals');
  return res.json();
};

export const createGoal = async (goalData) => {
  const res = await fetch(`${API_URL}/goals`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`
    },
    body: JSON.stringify(goalData)
  });
  if (!res.ok) throw new Error('Failed to create goal');
  return res.json();
};

export const updateGoal = async (goalData) => {
  const res = await fetch(`${API_URL}/goals`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`
    },
    body: JSON.stringify(goalData)
  });
  if (!res.ok) throw new Error('Failed to update goal');
  return res.json();
};

export const updateGoalProgress = async (goalId, currentValue) => {
  const res = await fetch(`${API_URL}/goals/progress`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`
    },
    body: JSON.stringify({ id: goalId, currentValue })
  });
  if (!res.ok) throw new Error('Failed to update progress');
  return res.json();
};

export const deleteGoal = async (goalId) => {
  const res = await fetch(`${API_URL}/goals?id=${goalId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${getToken()}` }
  });
  if (!res.ok) throw new Error('Failed to delete goal');
  return res.json();
};
