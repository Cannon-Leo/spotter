export const AUTH_VIEWS = ['login', 'create-account', 'reset-password'] as const;

export type AuthView = (typeof AUTH_VIEWS)[number];

/** Unknown or missing values fall back to the sign-in form. */
export function parseAuthView(value: string | string[] | undefined): AuthView {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw === 'create-account' || raw === 'reset-password' ? raw : 'login';
}
