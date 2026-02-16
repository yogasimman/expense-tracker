/**
 * API client — centralised fetch wrapper for the Vue frontend.
 * All endpoints return JSON. Errors are thrown so callers can catch.
 */

const BASE = '/api'

async function request(url, options = {}) {
  const res = await fetch(`${BASE}${url}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    credentials: 'include',
    ...options
  })

  // Handle 401 — redirect to login (skip for auth check endpoints to avoid redirect loops)
  if (res.status === 401 && !url.startsWith('/auth/')) {
    window.location.href = '/app/login'
    throw new Error('Unauthorized')
  }

  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.message || `Request failed (${res.status})`)
  return data
}

export const api = {
  // ── Auth ──
  login: (email, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  me: () => request('/auth/me'),

  // ── Users ──
  getUsers: () => request('/users'),
  addUser: (data) => request('/users', { method: 'POST', body: JSON.stringify(data) }),
  updateUser: (id, data) => request(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteUser: (id) => request(`/users/${id}`, { method: 'DELETE' }),

  // ── Trips ──
  getTrips: (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    return request(`/trips${qs ? '?' + qs : ''}`)
  },
  getTrip: (id) => request(`/trips/${id}`),
  createTrip: (data) => request('/trips', { method: 'POST', body: JSON.stringify(data) }),
  deleteTrip: (id) => request(`/trips/${id}`, { method: 'DELETE' }),
  updateTripStatus: (id, status) => request(`/trips/${id}/status`, { method: 'POST', body: JSON.stringify({ status }) }),
  finishTrip: (id) => request(`/trips/${id}/finish`, { method: 'POST' }),

  // ── Expenses ──
  getExpenses: (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    return request(`/expenses${qs ? '?' + qs : ''}`)
  },
  createExpense: (data) => request('/expenses', { method: 'POST', body: JSON.stringify(data) }),
  deleteExpense: (id) => request(`/expenses/${id}`, { method: 'DELETE' }),
  approveExpenses: (ids) => request('/expenses/approve', { method: 'POST', body: JSON.stringify({ expenseIds: ids }) }),
  rejectExpense: (id, reason) => request(`/expenses/${id}/reject`, { method: 'POST', body: JSON.stringify({ rejectionReason: reason }) }),

  // ── Advances ──
  getAdvances: (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    return request(`/advances${qs ? '?' + qs : ''}`)
  },
  createAdvance: (data) => request('/advances', { method: 'POST', body: JSON.stringify(data) }),
  deleteAdvance: (id) => request(`/advances/${id}`, { method: 'DELETE' }),
  approveAdvances: (ids) => request('/advances/approve', { method: 'POST', body: JSON.stringify({ advanceIds: ids }) }),
  rejectAdvance: (id, reason) => request(`/advances/${id}/reject`, { method: 'POST', body: JSON.stringify({ rejectionReason: reason }) }),

  // ── Categories ──
  getCategories: () => request('/categories'),
  createCategory: (name) => request('/categories', { method: 'POST', body: JSON.stringify({ name }) }),
  deleteCategory: (id) => request(`/categories/${id}`, { method: 'DELETE' }),

  // ── Dashboard ──
  getDashboard: () => request('/dashboard'),

  // ── Analytics ──
  getAnalytics: () => request('/analytics/data')
}
