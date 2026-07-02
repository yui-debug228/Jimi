import { useMemo } from "react";
import { useAuth } from "./useAuth";

export function useAdmin() {
  const { isAuthenticated, user } = useAuth();

  const isAdmin = useMemo(() => {
    if (!isAuthenticated) return false;
    if (user?.role === "admin") return true;
    return false;
  }, [isAuthenticated, user]);

  return {
    isAdmin,
    isLoading: false,
    pingData: null,
  };
}
