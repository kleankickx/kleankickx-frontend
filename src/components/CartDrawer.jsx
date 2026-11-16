// src/components/CartDrawer.jsx
// The cart, as a panel that slides over the page: from the right on desktop, as a
// sheet from the bottom on phones. The same CartPanel is used full-page at /cart
// (abandoned-cart emails, the login redirect and bookmarks still land there).
// Only quantities and removal happen here; discounts, delivery and payment are
// worked out at checkout, and shoe photos are taken per pair after payment.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { CartContext } from '../context/CartContext';
import { trackBeginCheckout, trackEvent } from '../utils/analytics';

const FALLBACK_IMG = '/images/service-fallback.svg';
const CartDrawerContext = createContext({ openCart: () => {}, closeCart: () => {}, isOpen: false });
export const useCartDrawer = () => useContext(CartDrawerContext);

const money = (v) => {
  const n = Number(v) || 0;
  return `₵${n % 1 ? n.toFixed(2) : n}`;
};

const pairsLabel = (item) => {
  const per = Number(item.service_details?.included_quantity ?? item.included_quantity) || 1;
  const pairs = per * (Number(item.quantity) || 1);
  return pairs > 1 ? `${pairs} pairs` : '1 pair';
};

const Stepper = ({ value, onChange, busy, label }) => (
  <div className="kk-cart-stepper" role="group" aria-label={`Quantity of ${label}`}>
    <button type="button" onClick={() => onChange(value - 1)} disabled={busy || value <= 1} aria-label="One less">−</button>
    <motion.span key={value} initial={{ y: -6, opacity: 0 }} animate={{ y: 0, opacity: 1 }} aria-live="polite">{value}</motion.span>
    <button type="button" onClick={() => onChange(value + 1)} disabled={busy} aria-label="One more">+</button>
  </div>
);

const Line = ({ item }) => {
  const { updateQuantity, removeFromCart } = useContext(CartContext);
  const [busy, setBusy] = useState(false);
  const name = item.service_details?.name || item.service_name || 'Service';
  const image = item.service_details?.image_url || FALLBACK_IMG;
  const free = item.is_free_signup_service;
  const voucher = item.is_voucher_redeem;
  const lineTotal = (Number(item.unit_price) || 0) * (Number(item.quantity) || 1);

  const run = async (fn) => { setBusy(true); try { await fn(); } finally { setBusy(false); } };
  const change = (next) => { if (next >= 1) run(() => updateQuantity(item.id, next)); };
  const remove = () => {
    trackEvent('remove_from_cart', {
      currency: 'GHS', value: lineTotal,
      items: [{ item_id: String(item.service), item_name: name, price: Number(item.unit_price) || 0, quantity: item.quantity }],
    });
    run(() => removeFromCart(item.id));
  };

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: busy ? 0.6 : 1, y: 0 }}
      exit={{ opacity: 0, x: 40, transition: { duration: 0.2 } }}
      transition={{ type: 'spring', stiffness: 420, damping: 34 }}
      className="kk-cart-line"
    >
      <img src={image} alt="" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = FALLBACK_IMG; }} />
      <div className="kk-cart-line-main">
        <p className="kk-cart-line-name">{name}</p>
        <p className="kk-cart-line-sub">
          {free ? <span className="tag green">Free on signup</span>
            : voucher ? <span className="tag green">Voucher {item.voucher_code || ''}</span>
            : <>{money(item.unit_price)} · {pairsLabel(item)}</>}
        </p>
        <div className="kk-cart-line-actions">
          {free || voucher ? <span className="kk-cart-qty-fixed">1</span>
            : <Stepper value={Number(item.quantity) || 1} onChange={change} busy={busy} label={name} />}
          <button type="button" className="kk-cart-remove" onClick={remove} disabled={busy}>Remove</button>
        </div>
      </div>
      <p className="kk-cart-line-total">{free || voucher ? 'Free' : money(lineTotal)}</p>
    </motion.li>
  );
};

/** The cart contents with its footer. `onNavigate` closes the drawer before leaving. */
export const CartPanel = ({ onNavigate, inDrawer = false }) => {
  const { cart, cartMeta, initialized, loading } = useContext(CartContext);
  const navigate = useNavigate();
  const items = cart || [];
  const count = items.reduce((n, i) => n + (Number(i.quantity) || 1), 0);
  const subtotal = Number(cartMeta?.total) || 0;

  const go = (to) => { onNavigate?.(); navigate(to); };
  const checkout = () => {
    trackBeginCheckout(items, subtotal);
    go('/checkout');
  };

  if (!initialized || (loading && !items.length)) {
    return (
      <div className="kk-cart-body">
        {[0, 1].map((k) => <div key={k} className="kk-cart-skeleton" />)}
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="kk-cart-empty">
        <div className="kk-cart-empty-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="28" height="28"><path d="M3 4h2l2.4 10.2a2 2 0 0 0 2 1.5h7.7a2 2 0 0 0 1.9-1.4L21 8H6.2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /><circle cx="10" cy="19.5" r="1.4" fill="currentColor" /><circle cx="17" cy="19.5" r="1.4" fill="currentColor" /></svg>
        </div>
        <p className="kk-cart-empty-title">Your cart is empty</p>
        <p className="kk-cart-empty-text">Pick a Klean and it will show up here.</p>
        <button type="button" className="kk-cart-btn primary" onClick={() => go('/#services')}>See services</button>
      </div>
    );
  }

  return (
    <>
      <ul className="kk-cart-body" aria-label="Items in your cart">
        <AnimatePresence initial={false}>
          {items.map((item) => <Line key={item.id} item={item} />)}
        </AnimatePresence>
      </ul>
      <div className="kk-cart-foot">
        <div className="kk-cart-row">
          <span>Subtotal <span className="muted">({count} {count === 1 ? 'item' : 'items'})</span></span>
          <motion.strong key={subtotal} initial={{ opacity: 0.4 }} animate={{ opacity: 1 }}>{money(subtotal)}</motion.strong>
        </div>
        <p className="kk-cart-note">Discounts, pickup and delivery are worked out at checkout.</p>
        <button type="button" className="kk-cart-btn primary wide" onClick={checkout}>
          Checkout <span aria-hidden="true">→</span>
        </button>
        {inDrawer && (
          <button type="button" className="kk-cart-btn ghost wide" onClick={onNavigate}>Keep browsing</button>
        )}
      </div>
    </>
  );
};

const CartStyles = () => (
  <style>{`
    .kk-cart{font-family:"League Spartan",system-ui,-apple-system,sans-serif;color:#0A0B0A}
    .kk-cart-scrim{position:fixed;inset:0;z-index:9998;background:rgba(10,11,10,.32);backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px)}
    .kk-cart-drawer{position:fixed;z-index:9999;display:flex;flex-direction:column;background:rgba(252,253,251,.92);
      backdrop-filter:blur(24px) saturate(1.6);-webkit-backdrop-filter:blur(24px) saturate(1.6);
      box-shadow:0 30px 80px -20px rgba(10,11,10,.45),inset 0 0 0 .5px rgba(10,11,10,.08)}
    @media (min-width:768px){.kk-cart-drawer{top:12px;right:12px;bottom:12px;width:min(440px,calc(100vw - 24px));border-radius:28px}}
    @media (max-width:767px){.kk-cart-drawer{left:0;right:0;bottom:0;max-height:88vh;border-radius:28px 28px 0 0;padding-bottom:env(safe-area-inset-bottom,0px)}}
    .kk-cart-grip{display:none}
    @media (max-width:767px){.kk-cart-grip{display:block;width:40px;height:5px;border-radius:3px;background:rgba(10,11,10,.18);margin:8px auto 0}}
    .kk-cart-head{display:flex;align-items:center;justify-content:space-between;padding:18px 20px 10px}
    .kk-cart-head h2{margin:0;font-size:22px;font-weight:700;letter-spacing:-.01em}
    .kk-cart-head .count{font-size:14px;font-weight:600;color:rgba(10,11,10,.5);margin-left:6px}
    .kk-cart-close{width:36px;height:36px;border-radius:50%;border:0;background:rgba(10,11,10,.06);display:grid;place-items:center;cursor:pointer;transition:background .2s}
    .kk-cart-close:hover{background:rgba(10,11,10,.12)}
    .kk-cart-body{list-style:none;margin:0;padding:6px 20px;overflow-y:auto;flex:1;overscroll-behavior:contain}
    .kk-cart-line{display:flex;gap:14px;align-items:flex-start;padding:14px 0;border-bottom:1px solid rgba(10,11,10,.07)}
    .kk-cart-line img{flex:none;width:68px;height:68px;border-radius:16px;object-fit:cover;background:#E7EBE5}
    .kk-cart-line-main{flex:1;min-width:0}
    .kk-cart-line-name{margin:0;font-size:16px;font-weight:600;line-height:1.2}
    .kk-cart-line-sub{margin:3px 0 0;font-size:13px;color:rgba(10,11,10,.55)}
    .kk-cart-line-total{margin:0;font-size:15px;font-weight:700;white-space:nowrap}
    .tag{display:inline-block;padding:2px 8px;border-radius:999px;font-size:12px;font-weight:600}
    .tag.green{background:rgba(26,122,26,.1);color:#1A7A1A}
    .kk-cart-line-actions{display:flex;align-items:center;gap:14px;margin-top:10px}
    .kk-cart-stepper{display:inline-flex;align-items:center;border-radius:999px;background:rgba(10,11,10,.06);overflow:hidden}
    .kk-cart-stepper button{width:34px;height:32px;border:0;background:transparent;font-size:18px;line-height:1;cursor:pointer;color:#0A0B0A;transition:background .15s}
    .kk-cart-stepper button:hover:not(:disabled){background:rgba(10,11,10,.08)}
    .kk-cart-stepper button:disabled{opacity:.35;cursor:default}
    .kk-cart-stepper span{min-width:22px;text-align:center;font-weight:700;font-size:14px}
    .kk-cart-qty-fixed{font-size:13px;color:rgba(10,11,10,.5)}
    .kk-cart-remove{border:0;background:none;padding:0;font:inherit;font-size:13px;color:rgba(10,11,10,.5);text-decoration:underline;text-underline-offset:3px;cursor:pointer}
    .kk-cart-remove:hover{color:#B42318}
    .kk-cart-foot{padding:14px 20px 18px;border-top:1px solid rgba(10,11,10,.08);display:flex;flex-direction:column;gap:10px}
    .kk-cart-row{display:flex;justify-content:space-between;align-items:baseline;font-size:16px}
    .kk-cart-row strong{font-size:20px}
    .kk-cart-row .muted{color:rgba(10,11,10,.5);font-size:14px}
    .kk-cart-note{margin:0;font-size:13px;color:rgba(10,11,10,.55)}
    .kk-cart-btn{border:0;border-radius:999px;padding:14px 20px;font:inherit;font-size:15px;font-weight:700;cursor:pointer;transition:transform .15s,background .2s}
    .kk-cart-btn:active{transform:scale(.98)}
    .kk-cart-btn.wide{width:100%}
    .kk-cart-btn.primary{background:#0A0B0A;color:#fff}
    .kk-cart-btn.primary:hover{background:#1A7A1A}
    .kk-cart-btn.ghost{background:transparent;color:#0A0B0A}
    .kk-cart-btn.ghost:hover{background:rgba(10,11,10,.05)}
    .kk-cart-btn:focus-visible,.kk-cart-close:focus-visible,.kk-cart-stepper button:focus-visible{outline:2px solid #1A7A1A;outline-offset:2px}
    .kk-cart-empty{display:flex;flex-direction:column;align-items:center;text-align:center;padding:48px 24px;gap:6px}
    .kk-cart-empty-icon{width:64px;height:64px;border-radius:50%;display:grid;place-items:center;background:rgba(10,11,10,.05);margin-bottom:8px}
    .kk-cart-empty-title{margin:0;font-size:19px;font-weight:700}
    .kk-cart-empty-text{margin:0 0 14px;color:rgba(10,11,10,.55)}
    .kk-cart-skeleton{height:84px;border-radius:16px;margin:12px 0;background:linear-gradient(90deg,#EEF1EC 0%,#F7F9F6 50%,#EEF1EC 100%);background-size:200% 100%;animation:kkCartShimmer 1.3s linear infinite}
    @keyframes kkCartShimmer{to{background-position:-200% 0}}
    .kk-cart-page{max-width:640px;margin:0 auto;padding:32px 16px 64px}
    .kk-cart-page .kk-cart-card{background:#fff;border-radius:28px;box-shadow:0 20px 60px -30px rgba(10,11,10,.3),inset 0 0 0 .5px rgba(10,11,10,.08);overflow:hidden}
  `}</style>
);

const Drawer = ({ onClose }) => {
  const reduce = useReducedMotion();
  const { cart } = useContext(CartContext);
  const closeRef = useRef(null);
  const [mobile] = useState(() => typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches);
  const count = (cart || []).reduce((n, i) => n + (Number(i.quantity) || 1), 0);

  useEffect(() => {
    const prev = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener('keydown', onKey);
      prev?.focus?.();
    };
  }, [onClose]);

  const from = reduce ? { opacity: 0 } : mobile ? { y: '100%' } : { x: '105%' };
  const to = reduce ? { opacity: 1 } : mobile ? { y: 0 } : { x: 0 };

  return (
    <div className="kk-cart">
      <motion.div className="kk-cart-scrim" onClick={onClose}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} />
      <motion.aside
        className="kk-cart-drawer"
        role="dialog" aria-modal="true" aria-label="Your cart"
        initial={from} animate={to} exit={from}
        transition={{ type: 'spring', stiffness: 360, damping: 36, mass: 0.9 }}
        drag={mobile && !reduce ? 'y' : false}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.6 }}
        onDragEnd={(_, info) => { if (info.offset.y > 90 || info.velocity.y > 500) onClose(); }}
      >
        <div className="kk-cart-grip" aria-hidden="true" />
        <div className="kk-cart-head">
          <h2>Your cart{count > 0 && <span className="count">{count}</span>}</h2>
          <button ref={closeRef} type="button" className="kk-cart-close" onClick={onClose} aria-label="Close cart">
            <svg viewBox="0 0 24 24" width="16" height="16"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" /></svg>
          </button>
        </div>
        <CartPanel onNavigate={onClose} inDrawer />
      </motion.aside>
    </div>
  );
};

export const CartDrawerProvider = ({ children }) => {
  const [isOpen, setOpen] = useState(false);
  const { cart, cartMeta } = useContext(CartContext);
  const { pathname } = useLocation();
  const cartRef = useRef(cart);
  cartRef.current = cart;

  const closeCart = useCallback(() => setOpen(false), []);
  const openCart = useCallback(() => {
    setOpen(true);
    trackEvent('view_cart', {
      currency: 'GHS', value: Number(cartMeta?.total) || 0,
      items: (cartRef.current || []).map((i) => ({
        item_id: String(i.service), item_name: i.service_details?.name || i.service_name,
        price: Number(i.unit_price) || 0, quantity: i.quantity,
      })),
    });
  }, [cartMeta?.total]);

  // Leaving the page (e.g. to checkout) closes it
  useEffect(() => { setOpen(false); }, [pathname]);

  const value = useMemo(() => ({ openCart, closeCart, isOpen }), [openCart, closeCart, isOpen]);

  return (
    <CartDrawerContext.Provider value={value}>
      <CartStyles />
      {children}
      <AnimatePresence>{isOpen && <Drawer onClose={closeCart} />}</AnimatePresence>
    </CartDrawerContext.Provider>
  );
};

export default CartDrawerProvider;
