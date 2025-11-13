export function getOrCreateDeviceId(): string {
  try {
    const key = 'deviceId';
    let id = localStorage.getItem(key);
    if (!id) {
      // Use crypto UUID if available; fallback to random
      id = (globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`);
      localStorage.setItem(key, id);
    }
    return id;
  } catch (e) {
    // In case localStorage is unavailable, return a session-based id
    return (globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`);
  }
}

// Fetches the user's public IP address using ipify.
// Returns undefined if the request fails to avoid blocking flows.
export async function getPublicIp(): Promise<string | undefined> {
  try {
    const res = await fetch('https://api.ipify.org?format=json');
    if (!res.ok) return undefined;
    const data = await res.json();
    const ip = typeof data?.ip === 'string' ? data.ip : undefined;
    return ip;
  } catch (e) {
    console.warn('Failed to retrieve public IP:', e);
    return undefined;
  }
}