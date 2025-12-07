import { jwtDecode } from 'jwt-decode'
import { connectivity } from '@/contexts/connectivitySingleton.js';


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
  try { sessionStorage.setItem('JWT', jwt); } catch {}
}

export function getToken() {
  try { return sessionStorage.getItem('JWT'); } catch { return null; }
}

export function saveRefreshToken(jwt) {
  try { sessionStorage.setItem('refreshJWT', jwt); } catch {}
}

export function getRefreshToken() {
  try { return sessionStorage.getItem('refreshJWT'); } catch { return null; }
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
export async function authenticatedRequest(path, opts = {}) {
  let token = getToken();
  let refreshToken = getRefreshToken();

  try {
    let response = await request(path, {
      ...opts,
      headers: {
        Authorization: token ? `Bearer ${token}` : undefined,
        ...(opts.headers || {}),
      },
    });

    // Server online
    connectivity.goOnline();

    // Handle 401/400: try refresh
    if ((response.status === 401 || response.status === 400) && refreshToken) {
      const refreshResponse = await fetch('/refresh', {
        method: 'POST',
        headers: { Authorization: `Bearer ${refreshToken}` },
      });

      if (!refreshResponse.ok) {
        window.location.href = '/';
        return { redirected: true };
      }

      const data = await refreshResponse.json();
      token = data.JWT;
      setToken(token);

      response = await request(path, {
        ...opts,
        headers: { Authorization: `Bearer ${token}`, ...(opts.headers || {}) },
      });

      connectivity.goOnline();
    }

    // Detect offline / proxy failure from Vite
    if (!response.ok) {
      // Vite proxy returns 502 with JSON error
      if (response.status === 502) {
        connectivity.goOffline();
        return { offline: true, error: 'Backend unreachable' };
      }

      // Other server errors
      if (response.status >= 500) {
        connectivity.goOffline();
        return { offline: true };
      }
    }

    return response;

  } catch (err) {
    // Only mark offline for real network errors
    if (err instanceof TypeError && err.message === 'Failed to fetch') {
      connectivity.goOffline();
      return { offline: true };
    }

    // rethrow
    throw err;
  }
}


//export async function authenticatedRequest(path, opts = {}) {
//  let token = getToken(); // access token
//  let refreshToken = getRefreshToken(); // refresh token
//
//  let response = await request(path, {
//    ...opts,
//    headers: { Authorization: token ? `Bearer ${token}` : undefined, ...(opts.headers || {}) },
//  });
//
//  if (response.status === 401 && refreshToken) {
//    const refreshResponse = await fetch('/refresh', {
//      method: 'POST',
//      headers: { Authorization: `Bearer ${refreshToken}` },
//    });
//
//
//    if (refreshResponse.ok) {
//      const data = await refreshResponse.json();
//      token = data.JWT;
//      setToken(token);
//
//      response = await request(path, {
//        ...opts,
//        headers: { Authorization: `Bearer ${token}`, ...(opts.headers || {}) },
//      });
//    } else {
//      window.location.href = '/';
//      return { redirected: true }; }
//  }
//
//  return response;
//}



export function getHomePage() {
  return authenticatedRequest('/api/home', {
    method: 'GET',
  });
}
