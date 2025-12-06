import { jwtDecode } from 'jwt-decode'


//export async function request(path, { method = 'GET', body, headers } = {}) {
//  const data = await fetch(path, {
//    method,
//    headers: { 'Content-Type': 'application/json', ...(headers || {}) },
//    body: body ? JSON.stringify(body) : undefined,
//    credentials: 'include',
//  });
//
//  if (!data.ok) {
//    const msg = data?.message || `HTTP ${data.status}`;
//    throw new Error(msg);
//  }
// console.log(data)
//  return data;
//}

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

export function saveToken(jwt) {
  try { localStorage.setItem('JWT', jwt); } catch {}
}

export function getToken() {
  try { return localStorage.getItem('JWT'); } catch { return null; }
}

export function addCodeToToken(code) {
const token = getToken();
  if (!token) return null;
}

export function getBusinessCode() {
  const token = getToken();
  if (!token) return null;

  try {
    const decoded = jwtDecode(token);
    return decoded.code || null;
  } catch (error) {
    console.error("Invalid token:", error);
    return null;
  }
}

export function getEmployeeID() {
  const token = getToken();
  if (!token) return null;

  try {
    const decoded = jwtDecode(token);
    return decoded.user_id || null;
  } catch (error) {
    console.error("Invalid token:", error);
    return null;
  }
}


// ---- API calls aligned to your Flask routes ----
export function createUser({ firstName, lastName, username, password, role, code }) {
  return request('/api/auth/register', {
    method: 'POST',
    body: { firstName, lastName, username, password, role, ...(code ? { code } : {}) },
  });
}

export function loginUser({ username, password }) {
  return request('/api/auth/login', {
    method: 'POST',
    body: { username, password },
  });
}


// For any authed call
//export function authenticatedRequest(path, opts = {}) {
//  const token = getToken();
//  return request(path, {
//    ...opts,
//    headers: { Authorization: token ? `Bearer ${token}` : undefined, ...(opts.headers || {}) },
//  });
//}


// For any authed call
export async function authenticatedRequest(path, opts = {}) {
  let token = getToken();

  // Attempt the request
  let response = await request(path, {
    ...opts,
    headers: { Authorization: token ? `Bearer ${token}` : undefined, ...(opts.headers || {}) },
  });

  // If token expired, try to refresh
  if (response.status === 401) {
    const refreshResponse = await fetch('/refresh', {
      method: 'POST',
      credentials: 'include',
    });

    if (refreshResponse.ok) {
      const data = await refreshResponse.json();
      token = data.JWT;
      setToken(token); // save the new access token

      // Retry original request with new token
      response = await request(path, {
        ...opts,
        headers: { Authorization: `Bearer ${token}`, ...(opts.headers || {}) },
      });
    } else {
      // Refresh failed, force logout
      window.location.href = '/login';
      return;
    }
  }

  return response;
}



export function getHomePage() {
  return authenticatedRequest('/api/home', {
    method: 'GET',
  });
}
