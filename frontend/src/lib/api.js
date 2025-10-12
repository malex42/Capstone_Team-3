// src/lib/api.js

// Generic request helper
export async function request(path, { method = 'GET', body, headers } = {}) {
  const res = await fetch(path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'include',
  });

  let data;
  try {
    data = await res.json();
  } catch {
    data = {};
  }

  if (!res.ok) {
    const msg = data?.message || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

// Token helpers
export function saveToken(token) {
  localStorage.setItem('jwt', token);
}

export function getToken() {
  return localStorage.getItem('jwt');
}

export function clearToken() {
  localStorage.removeItem('jwt');
}

// API calls
export function createUser({ username, password, role, code }) {
  // This hits Flask's register()
  return request('/api/auth/register', {
    method: 'POST',
    body: { username, password, role, ...(code ? { code } : {}) },
  });
}

export function login({ username, password }) {
  return request('/api/auth/login', {
    method: 'POST',
    body: { username, password },
  });
}

export function authenticatedRequest(path, options = {}) {
  const token = getToken();
  if (!token) throw new Error('No auth token found');
  return request(path, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });
}
