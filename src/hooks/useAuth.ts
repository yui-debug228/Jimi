import { trpc } from "@/providers/trpc";
import { useCallback, useMemo } from "react";
import { jwtVerify } from "jose";
import { useQuery } from "@tanstack/react-query";

const JWT_SECRET = new TextEncoder().encode(
  import.meta.env.VITE_APP_SECRET || "fallback-secret-change-in-production"
);

type UnifiedUser = {
  id: number;
  name: string | null;
  email: string | null;
  avatar: string | null;
  role: string;
  unionId: string;
};

async function verifyLocalAuthToken(token: string): Promise<UnifiedUser | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      algorithms: ["HS256"],
      clockTolerance: 60,
    });
    if (payload.id && payload.name) {
      return {
        id: payload.id as number,
        name: payload.name as string,
        email: null,
        avatar: null,
        role: (payload.role as string) || "user",
        unionId: `local:${payload.name}`,
      };
    }
  } catch {
    // Invalid token
  }
  return null;
}

export function useAuth() {
  const utils = trpc.useUtils();

  // Try OAuth auth first
  const {
    data: oauthUser,
    isLoading: oauthLoading,
  } = trpc.auth.me.useQuery(undefined, {
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: async () => {
      await utils.invalidate();
      window.location.reload();
    },
  });

  // Verify local auth token using JWT
  const token = localStorage.getItem("local_auth_token");
  const { data: localUser } = useQuery({
    queryKey: ["localAuth", token],
    queryFn: () => (token ? verifyLocalAuthToken(token) : Promise.resolve(null)),
    enabled: !!token && !oauthUser,
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  // Build unified user from whatever auth method worked
  const user: UnifiedUser | null = useMemo(() => {
    if (oauthUser) {
      return {
        id: oauthUser.id,
        name: oauthUser.name,
        email: oauthUser.email ?? null,
        avatar: oauthUser.avatar ?? null,
        role: oauthUser.role,
        unionId: oauthUser.unionId,
      };
    }
    return localUser;
  }, [oauthUser, localUser]);

  const isLoading = oauthLoading;

  const logout = useCallback(() => {
    // Always clear local auth
    localStorage.removeItem("local_auth_token");
    // Always call OAuth logout
    logoutMutation.mutate(undefined, {
      onSettled: () => {
        window.location.reload();
      },
    });
  }, [logoutMutation]);

  return useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading: isLoading || logoutMutation.isPending,
      isAdmin: user?.role === "admin",
      logout,
    }),
    [user, isLoading, logoutMutation.isPending, logout],
  );
}
