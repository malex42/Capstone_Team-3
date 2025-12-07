import { connectivity } from '@/contexts/connectivitySingleton.js';

export async function checkBackend() {
  try {
    const res = await fetch('/api/ping', { method: 'GET' });

    if (!res.ok) {
      // Server returned 500 or something
      connectivity.goOffline();
      return false;
    }

    // Backend reachable
    connectivity.goOnline();
    return true;

  } catch (err) {
    // Network error or proxy failure
    connectivity.goOffline();
    return false;
  }
}
