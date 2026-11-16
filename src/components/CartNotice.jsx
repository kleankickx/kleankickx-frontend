// src/components/CartNotice.jsx
// "Added to cart" banner in the style of an iOS notification: frosted glass, the
// service photo, a check that draws itself, and a View cart button. It springs in
// from the top, pauses while hovered or touched, can be swiped up to dismiss, and
// adding the same item again updates the count instead of stacking banners.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { CartContext } from '../context/CartContext';

const CartNoticeContext = createContext({ showAdded: () => {} });
export const useCartNotice = () => useContext(CartNoticeContext);

const SHOW_MS = 3600;

const money = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return '';
  return n === 0 ? 'Free' : `₵${n % 1 ? n.toFixed(2) : n}`;
};

const Check = ({ reduce }) => (
  <span className="kk-cn-check" aria-hidden="true">
    <svg viewBox="0 0 24 24" width="14" height="14">
      <motion.path
        d="M5 12.5l4.2 4.2L19 7"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: reduce ? 1 : 0 }}
        animate={{ pathLength: 1 }}
        transition={{ delay: 0.18, duration: 0.42, ease: [0.65, 0, 0.35, 1] }}
      />
    </svg>
  </span>
);

const Notice = ({ notice, onClose, onPause, onResume }) => {
  const reduce = useReducedMotion();
  const { cartMeta } = useContext(CartContext);
  const count = cartMeta?.item_count;
  const total = cartMeta?.total;

  return (
    <motion.div
      key={notice.key}
      role="status"
      aria-live="polite"
      className="kk-cn"
      layout
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: -28, scale: 0.94, filter: 'blur(6px)' }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
      exit={reduce ? { opacity: 0 } : { opacity: 0, y: -22, scale: 0.96, filter: 'blur(4px)', transition: { duration: 0.22 } }}
      transition={{ type: 'spring', stiffness: 420, damping: 32, mass: 0.9 }}
      drag={reduce ? false : 'y'}
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={{ top: 0.6, bottom: 0.08 }}
      onDragStart={onPause}
      onDragEnd={(_, info) => (info.offset.y < -24 || info.velocity.y < -300 ? onClose() : onResume())}
      onMouseEnter={onPause}
      onMouseLeave={onResume}
      onTouchStart={onPause}
      onTouchEnd={onResume}
    >
      <div className="kk-cn-thumb">
        {notice.image ? <img src={notice.image} alt="" /> : <span className="kk-cn-thumb-fallback" />}
        <Check reduce={reduce} />
      </div>

      <div className="kk-cn-text">
        <p className="kk-cn-eyebrow">Added to cart</p>
        <p className="kk-cn-name">
          {notice.name}
          <AnimatePresence initial={false}>
            {notice.times > 1 && (
              <motion.span
                key={notice.times}
                className="kk-cn-times"
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 600, damping: 20 }}
              >
                ×{notice.times}
              </motion.span>
            )}
          </AnimatePresence>
        </p>
        <p className="kk-cn-meta">
          {money(notice.price)}
          {count > 0 && <> · {count} {count === 1 ? 'item' : 'items'}{Number(total) > 0 ? ` · ${money(total)}` : ''}</>}
        </p>
      </div>

      <Link to="/cart" className="kk-cn-btn" onClick={onClose}>View cart</Link>

      <motion.span
        className="kk-cn-timer"
        aria-hidden="true"
        key={`${notice.key}-${notice.times}`}
        initial={{ scaleX: 1 }}
        animate={{ scaleX: notice.paused ? undefined : 0 }}
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
    setNotice((prev) => {
      const same = prev && prev.id === id;
      return {
        key: same ? prev.key : `${id}-${Date.now()}`,
        id, name, price, image: image || prev?.image,
        times: same ? prev.times + 1 : 1,
        paused: false,
        remaining: SHOW_MS,
      };
    });
    schedule(SHOW_MS);
  }, [schedule]);

  const pause = useCallback(() => {
    if (!timer.current) return;
    const left = Math.max(endsAt.current - Date.now(), 600);
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
        .kk-cn-wrap{position:fixed;top:max(14px,env(safe-area-inset-top,0px));left:50%;transform:translateX(-50%);
          z-index:10000;width:min(420px,calc(100vw - 24px));pointer-events:none}
        @media (min-width:768px){.kk-cn-wrap{left:auto;right:20px;transform:none;top:84px}}
        .kk-cn{pointer-events:auto;position:relative;overflow:hidden;display:flex;align-items:center;gap:12px;
          padding:10px 10px 10px 10px;border-radius:22px;cursor:grab;touch-action:pan-x;
          background:rgba(250,251,249,.78);backdrop-filter:blur(22px) saturate(1.8);-webkit-backdrop-filter:blur(22px) saturate(1.8);
          box-shadow:0 18px 40px -18px rgba(10,11,10,.38),0 2px 8px -2px rgba(10,11,10,.12),inset 0 0 0 .5px rgba(10,11,10,.10),inset 0 1px 0 rgba(255,255,255,.7);
          font-family:"League Spartan",system-ui,-apple-system,sans-serif;color:#0A0B0A}
        .kk-cn:active{cursor:grabbing}
        .kk-cn-thumb{position:relative;flex:none;width:48px;height:48px;border-radius:14px;overflow:visible}
        .kk-cn-thumb img,.kk-cn-thumb-fallback{width:100%;height:100%;border-radius:14px;object-fit:cover;display:block;background:#E7EBE5}
        .kk-cn-check{position:absolute;right:-5px;bottom:-5px;width:22px;height:22px;border-radius:50%;
          display:grid;place-items:center;background:#1A7A1A;color:#fff;box-shadow:0 0 0 2.5px rgba(250,251,249,.95)}
        .kk-cn-text{min-width:0;flex:1}
        .kk-cn-eyebrow{margin:0;font-size:11px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;color:#1A7A1A}
        .kk-cn-name{margin:1px 0 0;font-size:15px;font-weight:600;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .kk-cn-times{display:inline-block;margin-left:6px;padding:1px 6px;border-radius:999px;font-size:12px;background:#0A0B0A;color:#fff;vertical-align:1px}
        .kk-cn-meta{margin:2px 0 0;font-size:12.5px;color:rgba(10,11,10,.55);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .kk-cn-btn{flex:none;align-self:center;padding:9px 14px;border-radius:999px;background:#0A0B0A;color:#fff !important;
          font-size:13px;font-weight:600;text-decoration:none !important;transition:transform .15s,background .2s}
        .kk-cn-btn:hover{background:#1A7A1A}
        .kk-cn-btn:active{transform:scale(.96)}
        .kk-cn-btn:focus-visible{outline:2px solid #1A7A1A;outline-offset:2px}
        .kk-cn-timer{position:absolute;left:14px;right:14px;bottom:3px;height:2px;border-radius:2px;background:rgba(26,122,26,.45);transform-origin:left}
      `}</style>
      <div className="kk-cn-wrap">
        <AnimatePresence mode="popLayout">
          {notice && <Notice key={notice.key} notice={notice} onClose={close} onPause={pause} onResume={resume} />}
        </AnimatePresence>
      </div>
    </CartNoticeContext.Provider>
  );
};

export default CartNoticeProvider;
