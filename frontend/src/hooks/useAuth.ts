import { useCallback, useMemo } from "react";
import { useAppContext } from "../contexts/AppContext";

/**
 * Authentication hook backed by Google Identity Services.
 * Provides the current ID token and authentication status from app state.
 *
 * @example
 * ```tsx
 * function ProtectedComponent() {
 *   const { getAccessToken, isAuthenticated, user } = useAuth();
 *
 *   useEffect(() => {
 *     const fetchData = async () => {
 *       const token = await getAccessToken();
 *       if (token) {
 *         // Make authenticated API call
 *       }
 *     };
 *     fetchData();
 *   }, [getAccessToken]);
 *
 *   if (!isAuthenticated) return <div>Please sign in</div>;
 *   return <div>Welcome, {user?.name}</div>;
 * }
 * ```
 */
export const useAuth = () => {
  const { state } = useAppContext();

  const getAccessToken = useCallback(async (): Promise<string | null> => {
    return state.auth.token;
  }, [state.auth.token]);

  const isAuthenticated = state.auth.status === "authenticated";
  const user = state.auth.user;

  return useMemo(
    () => ({
      getAccessToken,
      isAuthenticated,
      user,
    }),
    [getAccessToken, isAuthenticated, user]
  );
};
