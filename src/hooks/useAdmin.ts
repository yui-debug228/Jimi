import { trpc } from "@/providers/trpc";
import { useMemo } from "react";
import { useAuth } from "./useAuth";

export function useAdmin() {
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();

  const { data: pingData, isLoading: pingLoading } = trpc.ping.useQuery(undefined, {
    refetchInterval: 60000,
    enabled: isAuthenticated,
  });

  const isAdmin = useMemo(() => {
    if (!isAuthenticated) return false;
    if (user?.role === "admin") return true;
    return false;
  }, [isAuthenticated, user]);

  return {
    isAdmin,
    isLoading: authLoading || pingLoading,
    pingData,
  };
}
