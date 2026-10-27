export const AUTH_VIEWS = ['login', 'create-account', 'reset-password'] as const;

export type AuthView = (typeof AUTH_VIEWS)[number];

/** Unknown or missing values fall back to the sign-in form. */
export function parseAuthView(value: string | string[] | undefined): AuthView {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw === 'create-account' || raw === 'reset-password' ? raw : 'login';
}

const DEVICE_ID_KEY = 'spotter-device-id';

/**
 * FR-4: one stable device ID per browser, created on first use. The server
 * binds the session to it and revokes any session held by another device.
 */
export function getOrCreateDeviceId(): string {
  if (typeof window === 'undefined') return '';
  try {
    const existing = window.localStorage.getItem(DEVICE_ID_KEY);
    if (existing) return existing;
    const created =
      typeof window.crypto?.randomUUID === 'function'
        ? window.crypto.randomUUID()
        : `dev_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
    window.localStorage.setItem(DEVICE_ID_KEY, created);
    return created;
  } catch {
    // Private browsing with storage blocked: the server falls back to a
    // generated device ID for this sign in only.
    return '';
  }
}

