// src/utils/promoCode.js
// A promo code from a shared link (e.g. kleankickx.com/?code=KOFI15), kept until checkout.
const KEY = 'kk_promo_code';
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // forget after 30 days

const clean = (code) => String(code || '').trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 50);

export const savePromoCode = (code) => {
  const c = clean(code);
  if (!c) return '';
  try { localStorage.setItem(KEY, JSON.stringify({ code: c, at: Date.now() })); } catch { /* storage blocked */ }
  return c;
};

export const getSavedPromoCode = () => {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (!v?.code || Date.now() - (v.at || 0) > MAX_AGE_MS) return '';
    return v.code;
  } catch {
    return '';
  }
};

export const clearSavedPromoCode = () => {
  try { localStorage.removeItem(KEY); } catch { /* storage blocked */ }
};

/** Read ?code= (or ?promo=) from the current address, save it and tidy the address. */
export const capturePromoCodeFromUrl = () => {
  if (typeof window === 'undefined') return '';
  const params = new URLSearchParams(window.location.search);
  const raw = params.get('code') || params.get('promo');
  if (!raw) return '';
  const saved = savePromoCode(raw);
  params.delete('code');
  params.delete('promo');
  const qs = params.toString();
  window.history.replaceState(window.history.state, '', `${window.location.pathname}${qs ? `?${qs}` : ''}${window.location.hash}`);
  return saved;
};
