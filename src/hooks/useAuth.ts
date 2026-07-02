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

export function useAuth() {
  const userStr = localStorage.getItem(DEMO_USER_KEY);

  const user: DemoUser | null = useMemo(() => {
    if (!userStr) return null;
    try {
      return JSON.parse(userStr) as DemoUser;
    } catch {
      localStorage.removeItem(DEMO_USER_KEY);
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
    localStorage.setItem(DEMO_USER_KEY, JSON.stringify(demoUser));
    window.location.reload();
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(DEMO_USER_KEY);
    window.location.reload();
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
