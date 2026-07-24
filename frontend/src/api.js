const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  getPeople: () => request('/api/people'),
  getPerson: (id) => request(`/api/people/${id}`),
  createPerson: (data) => request('/api/people', { method: 'POST', body: JSON.stringify(data) }),
  updatePerson: (id, data) => request(`/api/people/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deletePerson: (id) => request(`/api/people/${id}`, { method: 'DELETE' }),
  addTransaction: (personId, data) =>
    request(`/api/people/${personId}/transactions`, { method: 'POST', body: JSON.stringify(data) }),
  updateTransaction: (id, data) => request(`/api/transactions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTransaction: (id) => request(`/api/transactions/${id}`, { method: 'DELETE' }),
  getSummary: () => request('/api/summary'),
};
