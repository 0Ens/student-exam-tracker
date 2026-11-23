const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
const TOKEN_KEY = 'token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export async function apiRequest(path, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (res.status === 204) {
    return null;
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(res.status, data.error || 'Request failed', data.details);
  }
  return data;
}

export const authApi = {
  register: (input) => apiRequest('/auth/register', { method: 'POST', body: input }),
  login: (input) => apiRequest('/auth/login', { method: 'POST', body: input }),
  me: () => apiRequest('/auth/me'),
};

export const coursesApi = {
  list: () => apiRequest('/courses'),
  get: (id) => apiRequest(`/courses/${id}`),
  create: (input) => apiRequest('/courses', { method: 'POST', body: input }),
  update: (id, input) => apiRequest(`/courses/${id}`, { method: 'PUT', body: input }),
  remove: (id) => apiRequest(`/courses/${id}`, { method: 'DELETE' }),
};

export const examsApi = {
  list: (courseId) => apiRequest(`/courses/${courseId}/exams`),
  create: (courseId, input) =>
    apiRequest(`/courses/${courseId}/exams`, { method: 'POST', body: input }),
  update: (id, input) => apiRequest(`/exams/${id}`, { method: 'PUT', body: input }),
  remove: (id) => apiRequest(`/exams/${id}`, { method: 'DELETE' }),
};

export const gradesApi = {
  list: () => apiRequest('/grades'),
  forCourse: (courseId) => apiRequest(`/courses/${courseId}/grade`),
};

export const deadlinesApi = {
  list: (days = 14) => apiRequest(`/deadlines?days=${days}`),
};
