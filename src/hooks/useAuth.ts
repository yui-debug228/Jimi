import { useCallback, useMemo } from "react";

const DEMO_USER_KEY = "demo_auth_user";

export type DemoUser = {
  id: number;
  name: string;
  email: string | null;
  avatar: string | null;
  role: string;
  unionId: string;
};

const getStorageItem = (key: string): string | null => {
  try { return localStorage.getItem(key); } catch { return null; }
};
const setStorageItem = (key: string, value: string): void => {
  try { localStorage.setItem(key, value); } catch { /* ignore */ }
};
const removeStorageItem = (key: string): void => {
  try { localStorage.removeItem(key); } catch { /* ignore */ }
};
const safeReload = (): void => {
  if (typeof window !== "undefined") window.location.reload();
};

export function useAuth() {
  const userStr = getStorageItem(DEMO_USER_KEY);

  const user: DemoUser | null = useMemo(() => {
    if (!userStr) return null;
    try {
      return JSON.parse(userStr) as DemoUser;
    } catch {
      removeStorageItem(DEMO_USER_KEY);
      return null;
    }
  }, [userStr]);

  const isLoading = false;

  const login = useCallback((name: string, role: string = "user") => {
    const demoUser: DemoUser = {
      id: 1,
      name,
      email: null,
      avatar: null,
      role,
      unionId: `local:${name}`,
    };
    setStorageItem(DEMO_USER_KEY, JSON.stringify(demoUser));
    safeReload();
  }, []);

  const logout = useCallback(() => {
    removeStorageItem(DEMO_USER_KEY);
    safeReload();
  }, []);

  return useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading,
      isAdmin: user?.role === "admin",
      logout,
      login,
    }),
    [user, isLoading, logout, login],
  );
}
