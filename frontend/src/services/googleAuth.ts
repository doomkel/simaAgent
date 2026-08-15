/**
 * Decoded claims from a Google-issued OpenID Connect ID token.
 * The ID token's signature is verified server-side; this client-side decode
 * is for reading display claims only and must not be trusted for authorization.
 */
export interface GoogleIdTokenClaims {
  sub: string;
  email: string;
  name?: string;
  picture?: string;
  hd?: string;
  exp: number;
}

/**
 * Decode the payload of a JWT without verifying its signature.
 * Returns null if the token is malformed.
 */
export function decodeIdToken(idToken: string): GoogleIdTokenClaims | null {
  try {
    const payload = idToken.split(".")[1];
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
        .join("")
    );
    const claims = JSON.parse(json) as GoogleIdTokenClaims;
    return claims.sub && claims.email && claims.exp ? claims : null;
  } catch {
    return null;
  }
}
