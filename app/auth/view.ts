export const AUTH_VIEWS = ['login', 'create-account', 'reset-password'] as const;

export type AuthView = (typeof AUTH_VIEWS)[number];

/** Unknown or missing values fall back to the sign-in form. */
export function parseAuthView(value: string | string[] | undefined): AuthView {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw === 'create-account' || raw === 'reset-password' ? raw : 'login';
}

const DEVICE_ID_KEY = 'spotter-device-id';

/**
 * Emails are stored lower case: Member.email, Staff.email and Gym.email all
 * carry a lower case CHECK constraint, and the server normalises again before
 * it writes. Formatting in the field too means the member sees exactly the
 * address that will be stored, and a phone keyboard that starts with a capital
 * letter cannot produce a mixed case address.
 */
export function formatEmailInput(value: string): string {
  return value.replace(/\s+/g, '').toLowerCase();
}

/**
 * One field accepts either a member number or an email. Only the email form is
 * case insensitive, so the value is lowered only once it contains an "@".
 * Members have no letter case preference otherwise: a member number is digits.
 */
export function formatIdentifierInput(value: string): string {
  const withoutLeadingSpace = value.replace(/^\s+/, '');
  return withoutLeadingSpace.includes('@')
    ? formatEmailInput(withoutLeadingSpace)
    : withoutLeadingSpace;
}

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

