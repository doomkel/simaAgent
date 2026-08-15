import { useCallback, useEffect, useRef } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { GOOGLE_CLIENT_ID, GOOGLE_HOSTED_DOMAIN } from '../config/authConfig';
import { decodeIdToken } from '../services/googleAuth';

const TOKEN_STORAGE_KEY = 'google_id_token';

/**
 * Drives Google Identity Services sign-in: restores a cached token on mount,
 * initializes the GIS client, and renders the sign-in button into `buttonContainerRef`
 * whenever the user is not authenticated.
 */
export function useGoogleSignIn() {
  const { state, dispatch } = useAppContext();
  const buttonContainerRef = useRef<HTMLDivElement | null>(null);
  const initializedRef = useRef(false);

  const handleCredential = useCallback((idToken: string): boolean => {
    const claims = decodeIdToken(idToken);
    if (!claims || claims.exp * 1000 <= Date.now()) {
      sessionStorage.removeItem(TOKEN_STORAGE_KEY);
      return false;
    }

    sessionStorage.setItem(TOKEN_STORAGE_KEY, idToken);
    dispatch({
      type: 'AUTH_INITIALIZED',
      token: idToken,
      user: {
        sub: claims.sub,
        email: claims.email,
        name: claims.name ?? claims.email,
        picture: claims.picture,
      },
    });
    return true;
  }, [dispatch]);

  // Restore a still-valid cached token so a page refresh doesn't force re-auth
  useEffect(() => {
    const cached = sessionStorage.getItem(TOKEN_STORAGE_KEY);
    if (!cached || !handleCredential(cached)) {
      dispatch({ type: 'AUTH_SIGN_OUT' });
    }
    // Runs once on mount; handleCredential is stable across the component's lifetime
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Initialize GIS and render the sign-in button while unauthenticated
  useEffect(() => {
    if (state.auth.status === 'authenticated') return;

    let cancelled = false;

    const waitForGoogleScript = () => {
      if (cancelled) return;

      if (!window.google?.accounts?.id) {
        setTimeout(waitForGoogleScript, 100);
        return;
      }

      if (!initializedRef.current) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          hd: GOOGLE_HOSTED_DOMAIN,
          auto_select: true,
          callback: (response) => handleCredential(response.credential),
        });
        initializedRef.current = true;
      }

      if (buttonContainerRef.current) {
        buttonContainerRef.current.innerHTML = '';
        window.google.accounts.id.renderButton(buttonContainerRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'signin_with',
        });
      }

      window.google.accounts.id.prompt();
    };

    waitForGoogleScript();

    return () => {
      cancelled = true;
    };
  }, [state.auth.status, handleCredential]);

  const signOut = useCallback(() => {
    sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    window.google?.accounts.id.disableAutoSelect();
    dispatch({ type: 'AUTH_SIGN_OUT' });
  }, [dispatch]);

  return { buttonContainerRef, signOut };
}
