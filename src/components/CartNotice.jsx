// src/components/CartNotice.jsx
// "Added to cart", Dynamic Island style (in light frosted glass): a small pill appears at the top
// centre, springs open into a card (photo with a countdown ring and a check that
// draws itself, name, price, cart total, View cart), then folds back into the pill
// and leaves. Hover or touch pauses it, swipe up or Esc dismisses it, and adding the
// same item again bumps a counter instead of stacking. Reduced motion: a plain fade.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { CartContext } from '../context/CartContext';
import { useCartDrawer } from './CartDrawer';

const CartNoticeContext = createContext({ showAdded: () => {} });
export const useCartNotice = () => useContext(CartNoticeContext);

const SHOW_MS = 4000;
const PILL = { width: 132, height: 38, borderRadius: 19 };
const SPRING = { type: 'spring', stiffness: 380, damping: 30, mass: 0.85 };
const RING = 2 * Math.PI * 25; // circumference of the countdown ring (r = 25)

const money = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return '';
  return n === 0 ? 'Free' : `₵${n % 1 ? n.toFixed(2) : n}`;
};

const openWidth = () => (typeof window === 'undefined' ? 400 : Math.min(420, window.innerWidth - 20));

const Notice = ({ notice, onClose, onPause, onResume }) => {
  const reduce = useReducedMotion();
  const { cartMeta } = useContext(CartContext);
  const { openCart } = useCartDrawer();
  const count = cartMeta?.item_count;
  const total = cartMeta?.total;
  const open = { width: openWidth(), height: 76, borderRadius: 28 };

  const content = {
    hidden: { opacity: 0, filter: 'blur(6px)', scale: 0.96 },
    shown: { opacity: 1, filter: 'blur(0px)', scale: 1, transition: { delay: reduce ? 0 : 0.14, duration: 0.28 } },
    gone: { opacity: 0, filter: 'blur(6px)', transition: { duration: 0.12 } },
  };

  return (
    <motion.div
      role="status"
      aria-live="polite"
      className="kk-island"
      initial={reduce ? { ...open, opacity: 0 } : { ...PILL, opacity: 0, y: -8 }}
      animate={{ ...open, opacity: 1, y: 0, transition: SPRING }}
      exit={reduce
        ? { opacity: 0, transition: { duration: 0.2 } }
        : { ...PILL, opacity: 0, y: -10, transition: { ...SPRING, opacity: { delay: 0.18, duration: 0.15 } } }}
      drag={reduce ? false : 'y'}
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={{ top: 0.5, bottom: 0.06 }}
      onDragStart={onPause}
      onDragEnd={(_, info) => (info.offset.y < -20 || info.velocity.y < -280 ? onClose() : onResume())}
      onMouseEnter={onPause}
      onMouseLeave={onResume}
      onTouchStart={onPause}
      onTouchEnd={onResume}
    >
      <motion.div className="kk-island-body" variants={content} initial="hidden" animate="shown" exit="gone">
        <div className="kk-island-thumb">
          {notice.image ? <img src={notice.image} alt="" /> : <span className="kk-island-thumb-fallback" />}
          <svg className="kk-island-ring" viewBox="0 0 56 56" aria-hidden="true">
            <circle cx="28" cy="28" r="25" className="track" />
            <motion.circle
              // Re-mounted on every pause / resume, starting from exactly what is left
              key={`${notice.key}-${notice.times}-${notice.paused}-${notice.remaining}`}
              cx="28" cy="28" r="25" className="bar"
              strokeDasharray={RING}
              initial={{ strokeDashoffset: RING * (1 - notice.remaining / SHOW_MS) }}
              animate={notice.paused ? undefined : { strokeDashoffset: RING }}
              transition={{ duration: notice.remaining / 1000, ease: 'linear' }}
            />
          </svg>
          <motion.span
            className="kk-island-check"
            aria-hidden="true"
            initial={reduce ? false : { scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.22, type: 'spring', stiffness: 520, damping: 18 }}
          >
            <svg viewBox="0 0 24 24" width="12" height="12">
              <motion.path
                d="M5 12.5l4.2 4.2L19 7" fill="none" stroke="currentColor" strokeWidth="3"
                strokeLinecap="round" strokeLinejoin="round"
                initial={{ pathLength: reduce ? 1 : 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay: 0.32, duration: 0.36, ease: [0.65, 0, 0.35, 1] }}
              />
            </svg>
          </motion.span>
        </div>

        <div className="kk-island-text">
          <p className="kk-island-eyebrow">Added to cart</p>
          <p className="kk-island-name">
            <span className="n">{notice.name}</span>
            <AnimatePresence initial={false} mode="popLayout">
              {notice.times > 1 && (
                <motion.span
                  key={notice.times}
                  className="kk-island-times"
                  initial={{ scale: 0.4, opacity: 0, y: 6 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.4, opacity: 0, y: -6 }}
                  transition={{ type: 'spring', stiffness: 600, damping: 22 }}
                >
                  ×{notice.times}
                </motion.span>
              )}
            </AnimatePresence>
          </p>
          <p className="kk-island-meta">
            {money(notice.price)}
            {count > 0 && <> · {count} {count === 1 ? 'item' : 'items'}{Number(total) > 0 ? ` · ${money(total)}` : ''}</>}
          </p>
        </div>

        <button type="button" className="kk-island-btn" onClick={() => { onClose(); openCart(); }}>View cart</button>
      </motion.div>
    </motion.div>
  );
};

export const CartNoticeProvider = ({ children }) => {
  const [notice, setNotice] = useState(null);
  const timer = useRef(null);
  const endsAt = useRef(0);

  const clear = () => { if (timer.current) clearTimeout(timer.current); timer.current = null; };
  const close = useCallback(() => { clear(); setNotice(null); }, []);
  const schedule = useCallback((ms) => {
    clear();
    endsAt.current = Date.now() + ms;
    timer.current = setTimeout(() => setNotice(null), ms);
  }, []);

  const showAdded = useCallback(({ id, name, price, image }) => {
    try { navigator.vibrate?.(12); } catch { /* not supported */ }
    setNotice((prev) => {
      const same = prev && prev.id === id;
      return {
        key: same ? prev.key : `${id}-${Date.now()}`,
        id, name, price, image: image || (same ? prev.image : null),
        times: same ? prev.times + 1 : 1,
        paused: false,
        remaining: SHOW_MS,
      };
    });
    schedule(SHOW_MS);
  }, [schedule]);

  const pause = useCallback(() => {
    if (!timer.current) return;
    const left = Math.max(endsAt.current - Date.now(), 800);
    clear();
    setNotice((n) => (n ? { ...n, paused: true, remaining: left } : n));
  }, []);

  const resume = useCallback(() => {
    setNotice((n) => {
      if (!n || !n.paused) return n;
      schedule(n.remaining);
      return { ...n, paused: false };
    });
  }, [schedule]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); clear(); };
  }, [close]);

  const value = useMemo(() => ({ showAdded }), [showAdded]);

  return (
    <CartNoticeContext.Provider value={value}>
      {children}
      <style>{`
        .kk-island-wrap{position:fixed;left:0;right:0;top:max(10px,env(safe-area-inset-top,0px));z-index:10000;
          display:flex;justify-content:center;pointer-events:none}
        .kk-island{pointer-events:auto;position:relative;overflow:hidden;cursor:grab;touch-action:pan-x;
          background:rgba(252,253,251,.80);color:#0A0B0A;backdrop-filter:blur(24px) saturate(1.8);-webkit-backdrop-filter:blur(24px) saturate(1.8);
          box-shadow:0 22px 48px -22px rgba(10,11,10,.40),0 3px 10px -4px rgba(10,11,10,.14),inset 0 0 0 .5px rgba(10,11,10,.10),inset 0 1px 0 rgba(255,255,255,.85);
          font-family:"League Spartan",system-ui,-apple-system,sans-serif}
        .kk-island:active{cursor:grabbing}
        .kk-island-body{position:absolute;inset:0;display:flex;align-items:center;gap:12px;padding:0 12px 0 10px}
        .kk-island-thumb{position:relative;flex:none;width:56px;height:56px;display:grid;place-items:center}
        .kk-island-thumb img,.kk-island-thumb-fallback{width:44px;height:44px;border-radius:50%;object-fit:cover;display:block;background:#E7EBE5}
        .kk-island-ring{position:absolute;inset:0;transform:rotate(-90deg)}
        .kk-island-ring circle{fill:none;stroke-width:2.5}
        .kk-island-ring .track{stroke:rgba(10,11,10,.08)}
        .kk-island-ring .bar{stroke:#1A7A1A;stroke-linecap:round}
        .kk-island-check{position:absolute;right:1px;bottom:1px;width:20px;height:20px;border-radius:50%;
          display:grid;place-items:center;background:#1A7A1A;color:#fff;box-shadow:0 0 0 2.5px rgba(252,253,251,.98)}
        .kk-island-text{min-width:0;flex:1}
        .kk-island-eyebrow{margin:0;font-size:11px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:#1A7A1A}
        .kk-island-name{margin:1px 0 0;display:flex;align-items:center;gap:6px;font-size:15.5px;font-weight:600;line-height:1.2;min-width:0}
        .kk-island-name .n{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .kk-island-times{flex:none;padding:1px 7px;border-radius:999px;font-size:12px;font-weight:700;background:#0A0B0A;color:#fff}
        .kk-island-meta{margin:2px 0 0;font-size:12.5px;color:rgba(10,11,10,.55);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .kk-island-btn{flex:none;border:0;cursor:pointer;font-family:inherit;padding:10px 15px;border-radius:999px;background:#0A0B0A;color:#fff !important;
          font-size:13.5px;font-weight:700;text-decoration:none !important;transition:transform .15s,background .2s}
        .kk-island-btn:hover{background:#1A7A1A}
        .kk-island-btn:active{transform:scale(.95)}
        .kk-island-btn:focus-visible{outline:2px solid #1A7A1A;outline-offset:2px}
        @media (max-width:360px){.kk-island-btn{padding:9px 11px;font-size:12.5px}.kk-island-body{gap:9px}}
      `}</style>
      <div className="kk-island-wrap">
        <AnimatePresence>
          {notice && <Notice key={notice.key} notice={notice} onClose={close} onPause={pause} onResume={resume} />}
        </AnimatePresence>
      </div>
    </CartNoticeContext.Provider>
  );
};

export default CartNoticeProvider;
