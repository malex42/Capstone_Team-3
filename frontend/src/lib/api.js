// Generic JSON fetcher with sensible defaults
export async function request(path, { method = 'GET', body, headers } = {}) {
  const res = await fetch(path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(headers || {}) },
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'include', // sets JWT cookies if your backend does that
  });

  let data = {};
  try { data = await res.json(); } catch { /* no body */ }

  if (!res.ok) {
    const msg = data?.message || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

export function saveToken(jwt) {
  try { localStorage.setItem('JWT', jwt); } catch {}
}

export function getToken() {
  try { return localStorage.getItem('JWT'); } catch { return null; }
}

// ---- API calls aligned to your Flask routes ----
export function createUser({ username, password, role, code }) {
  return request('/api/auth/register', {
    method: 'POST',
    body: { username, password, role, ...(code ? { code } : {}) },
  });
}

export function loginUser({ username, password }) {
  return request('/api/auth/login', {
    method: 'POST',
    body: { username, password },
  });
}

// For any authed call
export function authenticatedRequest(path, opts = {}) {
  const token = getToken();
  return request(path, {
    ...opts,
    headers: { Authorization: token ? `Bearer ${token}` : undefined, ...(opts.headers || {}) },
  });
}
