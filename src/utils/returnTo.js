// src/utils/returnTo.js
// Where to send someone after they log in or sign up ("continue to checkout").
// Pages pass it as ?continue=/path (preferred) or in router state ({ from } / { redirectTo }).

/** A path on this site only: no other sites (//evil.com, https://...), no auth pages. */
export const safePath = (p) => {
  if (typeof p !== 'string') return null;
  const path = p.trim();
  if (!path.startsWith('/') || path.startsWith('//') || path.startsWith('/\\')) return null;
  if (path.startsWith('/auth/') || path === '/auth') return null; // never loop back to login/register
  return path;
};

/** The return path for the current login/register page, if any. */
export const getReturnTo = (location) => {
  const params = new URLSearchParams(location?.search || '');
  return safePath(params.get('continue'))
    || safePath(location?.state?.from)
    || safePath(location?.state?.redirectTo)
    || null;
};

/** `?continue=...` for links between login and register, so the return path survives the switch. */
export const continueSearch = (location) => {
  const to = getReturnTo(location);
  return to ? `?continue=${encodeURIComponent(to)}` : '';
};

/** The page someone is on right now, to come back to after logging in again. */
export const currentPath = () => {
  if (typeof window === 'undefined') return null;
  return safePath(window.location.pathname + window.location.search);
};
