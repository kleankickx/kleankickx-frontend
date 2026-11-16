// src/components/CartNotice.jsx
// "Added to cart" banner in the site's editorial style, matching the cart: square,
// paper white, a 2px ink rule, Anton display type, League Spartan labels and the
// green "go" button. It drops in at the top centre and wipes open left to right,
// a green bar counts down along the bottom, and it lifts away when done. Hover or
// touch pauses it, swipe up or Esc dismisses it, and adding the same item again
// bumps a counter instead of stacking. Reduced motion: a plain fade.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { CartContext } from '../context/CartContext';
import { useCartDrawer } from './CartDrawer';

const CartNoticeContext = createContext({ showAdded: () => {} });
export const useCartNotice = () => useContext(CartNoticeContext);

const SHOW_MS = 4000;
const SWIFT = [0.77, 0, 0.18, 1];           // the site's --swift easing
const FALLBACK_IMG = '/images/service-fallback.svg';

const money = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return '';
  return n === 0 ? 'Free' : `₵${n % 1 ? n.toFixed(2) : n.toLocaleString('en-GH')}`;
};
const two = (n) => String(n).padStart(2, '0');

const Notice = ({ notice, onClose, onPause, onResume }) => {
  const reduce = useReducedMotion();
  const { cartMeta } = useContext(CartContext);
  const { openCart } = useCartDrawer();
  const count = Number(cartMeta?.item_count) || 0;
  const total = Number(cartMeta?.total) || 0;

  const enter = reduce ? { opacity: 0 } : { opacity: 1, y: -24, clipPath: 'inset(0 100% 0 0)' };
  const shown = { opacity: 1, y: 0, clipPath: 'inset(0 0% 0 0)' };
  const leave = reduce ? { opacity: 0 } : { opacity: 0, y: -28, clipPath: 'inset(0 0% 0 0)' };
  const stagger = (i) => (reduce ? {} : { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 },
    transition: { delay: 0.28 + i * 0.06, duration: 0.45, ease: SWIFT } });

  return (
    <motion.div
      role="status"
      aria-live="polite"
      className="kkn"
      initial={enter}
      animate={{ ...shown, transition: { y: { duration: 0.45, ease: SWIFT }, clipPath: { duration: 0.55, ease: SWIFT, delay: 0.05 } } }}
      exit={{ ...leave, transition: { duration: 0.35, ease: SWIFT } }}
      drag={reduce ? false : 'y'}
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={{ top: 0.5, bottom: 0.05 }}
      onDragStart={onPause}
      onDragEnd={(_, info) => (info.offset.y < -20 || info.velocity.y < -280 ? onClose() : onResume())}
      onMouseEnter={onPause}
      onMouseLeave={onResume}
      onTouchStart={onPause}
      onTouchEnd={onResume}
    >
      <motion.div className="kkn-pic" initial={reduce ? false : { scale: 1.15 }} animate={{ scale: 1 }}
        transition={{ duration: 0.8, ease: SWIFT }}>
        <img src={notice.image || FALLBACK_IMG} alt="" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = FALLBACK_IMG; }} />
        <motion.span className="kkn-tick" aria-hidden="true" initial={reduce ? false : { scale: 0 }} animate={{ scale: 1 }}
          transition={{ delay: 0.42, type: 'spring', stiffness: 520, damping: 20 }}>
          <svg viewBox="0 0 24 24" width="12" height="12">
            <motion.path d="M5 12.5l4.2 4.2L19 7" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="square"
              initial={{ pathLength: reduce ? 1 : 0 }} animate={{ pathLength: 1 }}
              transition={{ delay: 0.5, duration: 0.35, ease: SWIFT }} />
          </svg>
        </motion.span>
      </motion.div>

      <div className="kkn-text">
        <motion.p className="kkn-eyebrow" {...stagger(0)}>
          Added to cart
          <AnimatePresence initial={false} mode="popLayout">
            {notice.times > 1 && (
              <motion.span key={notice.times} className="kkn-times"
                initial={{ y: '-100%', opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: '100%', opacity: 0 }}
                transition={{ duration: 0.3, ease: SWIFT }}>
                ×{two(notice.times)}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.p>
        <motion.p className="kkn-name" {...stagger(1)}>{notice.name}</motion.p>
        <motion.p className="kkn-meta" {...stagger(2)}>
          {money(notice.price)}
          {count > 0 && <><i>/</i>{two(count)} in cart{total > 0 ? <><i>/</i>{money(total)}</> : null}</>}
        </motion.p>
      </div>

      <motion.button type="button" className="kkn-btn" onClick={() => { onClose(); openCart(); }} {...stagger(3)}>
        View cart <span className="ar" aria-hidden="true">→</span>
      </motion.button>

      <motion.span
        className="kkn-timer"
        aria-hidden="true"
        // Re-mounted on every pause / resume, starting from exactly what is left
        key={`${notice.key}-${notice.times}-${notice.paused}-${notice.remaining}`}
        initial={{ scaleX: notice.remaining / SHOW_MS }}
        animate={notice.paused ? undefined : { scaleX: 0 }}
        transition={{ duration: notice.remaining / 1000, ease: 'linear' }}
      />
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
        .kkn-wrap{position:fixed;left:0;right:0;top:max(12px,env(safe-area-inset-top,0px));z-index:10000;
          display:flex;justify-content:center;padding:0 10px;pointer-events:none}
        .kkn{--ink:#0A0B0A;--paper:#F7F9F6;--line:#D9DFD7;--muted:#4D564C;--green:#1A7A1A;
          --display:"Anton","Arial Narrow",Impact,sans-serif;--body:"League Spartan",system-ui,sans-serif;--spring:cubic-bezier(.2,1.25,.3,1);
          pointer-events:auto;position:relative;width:min(460px,100%);display:grid;grid-template-columns:64px 1fr auto;align-items:center;gap:14px;
          padding:10px 10px 13px;background:var(--paper);color:var(--ink);border:2px solid var(--ink);
          box-shadow:8px 8px 0 -2px rgba(10,11,10,.12),0 24px 50px -24px rgba(10,11,10,.45);
          font-family:var(--body);cursor:grab;touch-action:pan-x;overflow:hidden}
        .kkn:active{cursor:grabbing}
        .kkn-pic{position:relative;width:64px;aspect-ratio:4/5;overflow:visible}
        .kkn-pic img{width:100%;height:100%;object-fit:cover;display:block;background:var(--line)}
        .kkn-tick{position:absolute;right:-6px;bottom:-6px;width:22px;height:22px;display:grid;place-items:center;background:var(--green);color:#fff;
          box-shadow:0 0 0 2px var(--paper)}
        .kkn-text{min-width:0}
        .kkn-eyebrow{margin:0;display:flex;align-items:center;gap:8px;font-size:11px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:var(--green)}
        .kkn-times{display:inline-block;background:var(--ink);color:#fff;padding:2px 6px;letter-spacing:.06em;font-variant-numeric:tabular-nums}
        .kkn-name{margin:3px 0 0;font-family:var(--display);font-weight:400;font-size:24px;line-height:.95;text-transform:uppercase;
          white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .kkn-meta{margin:5px 0 0;font-size:13px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-variant-numeric:tabular-nums}
        .kkn-meta i{font-style:normal;opacity:.4;margin:0 6px}
        .kkn-btn{align-self:center;display:inline-flex;align-items:center;gap:8px;border:2px solid var(--green);border-radius:2px;background:var(--green);color:#fff;
          font-family:var(--body);font-weight:700;font-size:14px;padding:11px 14px;cursor:pointer;white-space:nowrap;
          transition:transform .25s var(--spring),background .2s,border-color .2s}
        .kkn-btn .ar{transition:transform .3s var(--spring)}
        .kkn-btn:hover{background:var(--ink);border-color:var(--ink)}
        .kkn-btn:hover .ar{transform:translateX(4px)}
        .kkn-btn:active{transform:scale(.97)}
        .kkn-btn:focus-visible{outline:2px solid var(--green);outline-offset:3px}
        .kkn-timer{position:absolute;left:0;right:0;bottom:0;height:3px;background:var(--green);transform-origin:left}
        @media (max-width:380px){.kkn{grid-template-columns:52px 1fr auto;gap:10px}.kkn-pic{width:52px}.kkn-name{font-size:20px}.kkn-btn{padding:10px 11px;font-size:13px}}
      `}</style>
      <div className="kkn-wrap">
        <AnimatePresence>
          {notice && <Notice key={notice.key} notice={notice} onClose={close} onPause={pause} onResume={resume} />}
        </AnimatePresence>
      </div>
    </CartNoticeContext.Provider>
  );
};

export default CartNoticeProvider;
