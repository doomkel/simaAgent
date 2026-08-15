// Environment variables (must be set during build or deployment)
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

if (!GOOGLE_CLIENT_ID) {
  throw new Error(
    "VITE_GOOGLE_CLIENT_ID is not set. This must be provided during build time. " +
    "For local dev, set it in frontend/.env.local."
  );
}

// Google Workspace domain allowed to sign in. Enforced server-side via the
// ID token's "hd" claim; used here only as a sign-in hint for the picker.
export const GOOGLE_HOSTED_DOMAIN = import.meta.env.VITE_GOOGLE_HOSTED_DOMAIN || "3styk.com";
