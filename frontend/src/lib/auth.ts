export type AuthUser = {
  id: number;
  first_name: string | null;
  middle_name: string | null;
  last_name: string | null;
  user_name: string | null;
  email: string;
  phone: string | null;
  role_id: number | null;
  role_name: string | null;
  created_at: string;
};

const TOKEN_KEY = "helporbit.token";
const USER_KEY = "helporbit.user";

const isBrowser = () => typeof window !== "undefined";

export function getToken(): string | null {
  if (!isBrowser()) return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function getUser(): AuthUser | null {
  if (!isBrowser()) return null;
  const raw = window.localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function setSession(token: string, user: AuthUser): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(TOKEN_KEY, token);
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession(): void {
  if (!isBrowser()) return;
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
}

export function displayName(user: AuthUser | null): string {
  if (!user) return "";
  const parts = [user.first_name, user.last_name].filter(Boolean);
  if (parts.length) return parts.join(" ");
  return user.user_name || user.email;
}
