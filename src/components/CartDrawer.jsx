// src/components/CartDrawer.jsx
// The cart, in the site's editorial style (Anton display type, League Spartan
// labels, square corners, 2px ink rules, green "go" button). It slides in from the
// right on desktop and rises as a sheet on phones. The same CartPanel is used
// full-page at /cart (abandoned-cart emails, the login redirect, bookmarks).
// Only quantities and removal happen here; discounts, delivery and payment are
// worked out at checkout, and shoe photos are taken per pair after payment.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { CartContext } from '../context/CartContext';
import { trackBeginCheckout, trackEvent } from '../utils/analytics';

const FALLBACK_IMG = '/images/service-fallback.svg';
const SWIFT = [0.77, 0, 0.18, 1];          // the site's --swift easing
const CartDrawerContext = createContext({ openCart: () => {}, closeCart: () => {}, isOpen: false });
export const useCartDrawer = () => useContext(CartDrawerContext);

const money = (v) => {
  const n = Number(v) || 0;
  return `₵${n % 1 ? n.toFixed(2) : n.toLocaleString('en-GH')}`;
};
const two = (n) => String(n).padStart(2, '0');

const pairsOf = (item) => {
  const per = Number(item.service_details?.included_quantity ?? item.included_quantity) || 1;
  return per * (Number(item.quantity) || 1);
};

/** A number that rolls to its new value, like a departures board. */
const Rolling = ({ value, className }) => (
  <span className={`kkc-roll ${className || ''}`}>
    <AnimatePresence mode="popLayout" initial={false}>
      <motion.span
        key={value}
        initial={{ y: '-100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ duration: 0.35, ease: SWIFT }}
      >
        {value}
      </motion.span>
    </AnimatePresence>
  </span>
);

const Stepper = ({ value, onChange, busy, label }) => (
  <div className="kkc-step" role="group" aria-label={`Quantity of ${label}`}>
    <button type="button" onClick={() => onChange(value - 1)} disabled={busy || value <= 1} aria-label="One less">
      <svg viewBox="0 0 12 12" width="11" height="11"><path d="M2 6h8" stroke="currentColor" strokeWidth="2" /></svg>
    </button>
    <Rolling value={two(value)} className="kkc-step-n" />
    <button type="button" onClick={() => onChange(value + 1)} disabled={busy} aria-label="One more">
      <svg viewBox="0 0 12 12" width="11" height="11"><path d="M2 6h8M6 2v8" stroke="currentColor" strokeWidth="2" /></svg>
    </button>
  </div>
);

const Line = ({ item, index }) => {
  const { updateQuantity, removeFromCart } = useContext(CartContext);
  const [busy, setBusy] = useState(false);
  const name = item.service_details?.name || item.service_name || 'Service';
  const image = item.service_details?.image_url || FALLBACK_IMG;
  const free = item.is_free_signup_service;
  const voucher = item.is_voucher_redeem;
  const pairs = pairsOf(item);
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
      layout="position"
      className={`kkc-line ${busy ? 'busy' : ''}`}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0, transition: { delay: 0.12 + index * 0.06, duration: 0.5, ease: SWIFT } }}
      exit={{ opacity: 0, x: -36, height: 0, paddingTop: 0, paddingBottom: 0, transition: { duration: 0.4, ease: SWIFT } }}
    >
      <span className="kkc-idx">{two(index + 1)}</span>
      <div className="kkc-pic">
        <img src={image} alt="" loading="lazy" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = FALLBACK_IMG; }} />
        {(free || voucher) && <span className="kkc-flag">{free ? 'Free' : 'Voucher'}</span>}
      </div>
      <div className="kkc-main">
        <h3 className="kkc-name">{name}</h3>
        <p className="kkc-meta">
          {free ? 'First Klean on us'
            : voucher ? `Voucher ${item.voucher_code || ''}`.trim()
            : <>{money(item.unit_price)} each <i>/</i> {pairs} {pairs === 1 ? 'pair' : 'pairs'}</>}
        </p>
        <div className="kkc-actions">
          {free || voucher ? <span className="kkc-fixed">Qty 01</span>
            : <Stepper value={Number(item.quantity) || 1} onChange={change} busy={busy} label={name} />}
          <button type="button" className="kkc-remove" onClick={remove} disabled={busy}>Remove</button>
        </div>
      </div>
      <p className="kkc-amt">{free || voucher ? <span className="kkc-amt-free">Free</span> : <Rolling value={money(lineTotal)} />}</p>
    </motion.li>
  );
};

/** The cart contents with its footer. `onNavigate` closes the drawer before leaving. */
export const CartPanel = ({ onNavigate, inDrawer = false }) => {
  const { cart, cartMeta, initialized, loading } = useContext(CartContext);
  const navigate = useNavigate();
  const items = cart || [];
  const count = items.reduce((n, i) => n + (Number(i.quantity) || 1), 0);
  const pairs = items.reduce((n, i) => n + pairsOf(i), 0);
  const subtotal = Number(cartMeta?.total) || 0;

  const go = (to) => { onNavigate?.(); navigate(to); };
  const checkout = () => { trackBeginCheckout(items, subtotal); go('/checkout'); };

  if (!initialized || (loading && !items.length)) {
    return <div className="kkc-body">{[0, 1].map((k) => <div key={k} className="kkc-skel" />)}</div>;
  }

  if (!items.length) {
    return (
      <motion.div className="kkc-empty" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: SWIFT, delay: 0.1 }}>
        <p className="kkc-eyebrow">00 items</p>
        <h3 className="kkc-empty-h">Nothing here yet</h3>
        <p className="kkc-empty-p">Pick a Klean and it will show up here. Standard Klean from ₵50 a pair.</p>
        <button type="button" className="kkc-btn go" onClick={() => go('/#services')}>
          See services <span className="ar" aria-hidden="true">→</span>
        </button>
      </motion.div>
    );
  }

  return (
    <>
      <ul className="kkc-body" aria-label="Items in your cart">
        <AnimatePresence initial={true}>
          {items.map((item, i) => <Line key={item.id} item={item} index={i} />)}
        </AnimatePresence>
      </ul>
      <motion.div className="kkc-foot" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: SWIFT, delay: 0.18 }}>
        <div className="kkc-total">
          <div>
            <p className="kkc-eyebrow">Subtotal</p>
            <p className="kkc-sub">{count} {count === 1 ? 'item' : 'items'} <i>/</i> {pairs} {pairs === 1 ? 'pair' : 'pairs'}</p>
          </div>
          <Rolling value={money(subtotal)} className="kkc-total-n" />
        </div>
        <p className="kkc-note">Discounts, pickup and delivery are added at checkout. Pay by Mobile Money or card.</p>
        <button type="button" className="kkc-btn go wide" onClick={checkout}>
          Checkout <span className="ar" aria-hidden="true">→</span>
        </button>
        {inDrawer && <button type="button" className="kkc-btn wide" onClick={onNavigate}>Keep browsing</button>}
      </motion.div>
    </>
  );
};

const CartStyles = () => (
  <style>{`
    .kkc{--ink:#0A0B0A;--paper:#F7F9F6;--card:#fff;--line:#D9DFD7;--muted:#4D564C;--green:#1A7A1A;--tint:#E6F0E4;
      --display:"Anton","Arial Narrow",Impact,sans-serif;--body:"League Spartan",system-ui,sans-serif;
      --spring:cubic-bezier(.2,1.25,.3,1);--swift:cubic-bezier(.77,0,.18,1);
      font-family:var(--body);color:var(--ink)}
    .kkc-scrim{position:fixed;inset:0;z-index:9998;background:rgba(10,11,10,.46);backdrop-filter:blur(2px) grayscale(.3);-webkit-backdrop-filter:blur(2px) grayscale(.3)}
    .kkc-drawer{position:fixed;z-index:9999;display:flex;flex-direction:column;background:var(--paper);box-shadow:-30px 0 80px -30px rgba(10,11,10,.5)}
    @media (min-width:768px){.kkc-drawer{top:0;right:0;bottom:0;width:min(480px,100vw);border-left:2px solid var(--ink)}}
    @media (max-width:767px){.kkc-drawer{left:0;right:0;bottom:0;max-height:90vh;border-top:2px solid var(--ink);padding-bottom:env(safe-area-inset-bottom,0px)}}
    .kkc-grip{display:none}
    @media (max-width:767px){.kkc-grip{display:block;width:44px;height:4px;background:var(--ink);opacity:.2;margin:10px auto 0}}

    .kkc-head{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;padding:22px 24px 16px;border-bottom:2px solid var(--ink)}
    .kkc-eyebrow{margin:0;font-family:var(--body);font-size:12px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:var(--green)}
    .kkc-title{margin:4px 0 0;font-family:var(--display);font-weight:400;font-size:52px;line-height:.9;text-transform:uppercase;letter-spacing:.005em}
    .kkc-close{flex:none;width:44px;height:44px;display:grid;place-items:center;border:2px solid var(--ink);background:transparent;color:var(--ink);cursor:pointer;
      transition:background .2s,color .2s,transform .3s var(--spring)}
    .kkc-close:hover{background:var(--ink);color:#fff;transform:rotate(90deg)}

    .kkc-body{list-style:none;margin:0;padding:0 24px;overflow-y:auto;flex:1;overscroll-behavior:contain}
    .kkc-line{position:relative;display:grid;grid-template-columns:22px 84px 1fr auto;gap:14px;align-items:start;padding:20px 0;border-bottom:1px solid var(--line);overflow:hidden}
    .kkc-line.busy{opacity:.55}
    .kkc-idx{font-size:12px;font-weight:600;letter-spacing:.1em;color:var(--muted);padding-top:3px;font-variant-numeric:tabular-nums}
    .kkc-pic{position:relative;width:84px;aspect-ratio:4/5;overflow:hidden;background:var(--line)}
    .kkc-pic img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .8s var(--swift)}
    .kkc-line:hover .kkc-pic img{transform:scale(1.06)}
    .kkc-flag{position:absolute;top:0;left:0;background:var(--green);color:#fff;font-size:10px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;padding:4px 7px}
    .kkc-main{min-width:0}
    .kkc-name{margin:0;font-family:var(--display);font-weight:400;font-size:26px;line-height:.95;text-transform:uppercase;text-wrap:balance}
    .kkc-meta{margin:6px 0 0;font-size:14px;color:var(--muted);font-variant-numeric:tabular-nums}
    .kkc-meta i,.kkc-sub i{font-style:normal;opacity:.4;margin:0 4px}
    .kkc-actions{display:flex;align-items:center;gap:16px;margin-top:14px}
    .kkc-step{display:inline-flex;align-items:stretch;border:2px solid var(--ink);height:36px}
    .kkc-step button{width:34px;border:0;background:transparent;color:var(--ink);display:grid;place-items:center;cursor:pointer;transition:background .15s,color .15s}
    .kkc-step button:hover:not(:disabled){background:var(--ink);color:#fff}
    .kkc-step button:disabled{opacity:.25;cursor:default}
    .kkc-step-n{min-width:34px;border-left:1px solid var(--line);border-right:1px solid var(--line);font-weight:700;font-size:14px}
    .kkc-roll{position:relative;display:inline-grid;place-items:center;overflow:hidden;font-variant-numeric:tabular-nums}
    .kkc-roll > span{grid-area:1/1}
    .kkc-fixed{font-size:12px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:var(--muted)}
    .kkc-remove{border:0;background:none;padding:0;font:inherit;font-size:12px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);cursor:pointer;
      background-image:linear-gradient(currentColor,currentColor);background-size:0 1px;background-repeat:no-repeat;background-position:0 100%;transition:background-size .3s var(--swift),color .2s}
    .kkc-remove:hover{color:#B42318;background-size:100% 1px}
    .kkc-amt{margin:0;font-family:var(--display);font-size:28px;line-height:1;text-align:right;white-space:nowrap}
    .kkc-amt-free{color:var(--green)}

    .kkc-foot{padding:20px 24px 22px;border-top:2px solid var(--ink);background:var(--card);display:flex;flex-direction:column;gap:12px}
    .kkc-total{display:flex;align-items:flex-end;justify-content:space-between;gap:16px}
    .kkc-sub{margin:4px 0 0;font-size:14px;color:var(--muted);font-variant-numeric:tabular-nums}
    .kkc-total-n{font-family:var(--display);font-size:56px;line-height:.9}
    .kkc-note{margin:0;font-size:13px;line-height:1.4;color:var(--muted)}
    .kkc-btn{display:inline-flex;align-items:center;justify-content:center;gap:10px;font-family:var(--body);font-weight:700;font-size:15px;letter-spacing:.02em;
      padding:15px 22px;border:2px solid var(--ink);border-radius:2px;background:transparent;color:var(--ink);cursor:pointer;
      transition:transform .25s var(--spring),background .2s,color .2s,border-color .2s}
    .kkc-btn .ar{transition:transform .3s var(--spring)}
    .kkc-btn:hover .ar{transform:translateX(5px)}
    .kkc-btn:active{transform:scale(.98)}
    .kkc-btn.wide{width:100%}
    .kkc-btn.go{background:var(--green);border-color:var(--green);color:#fff}
    .kkc-btn.go:hover{background:var(--ink);border-color:var(--ink)}
    .kkc-btn:not(.go):hover{background:var(--ink);color:#fff}
    .kkc-btn:focus-visible,.kkc-close:focus-visible,.kkc-step button:focus-visible,.kkc-remove:focus-visible{outline:2px solid var(--green);outline-offset:3px}

    .kkc-empty{padding:40px 24px 32px;display:flex;flex-direction:column;align-items:flex-start;gap:10px}
    .kkc-empty-h{margin:0;font-family:var(--display);font-weight:400;font-size:56px;line-height:.9;text-transform:uppercase;max-width:8ch}
    .kkc-empty-p{margin:0 0 10px;color:var(--muted);font-size:15px;max-width:30ch}
    .kkc-skel{height:118px;margin:20px 0;background:linear-gradient(90deg,var(--line) 0%,#EEF2EC 50%,var(--line) 100%);background-size:200% 100%;animation:kkcShim 1.3s linear infinite}
    @keyframes kkcShim{to{background-position:-200% 0}}

    @media (max-width:420px){
      .kkc-head{padding:18px 18px 14px}.kkc-body{padding:0 18px}.kkc-foot{padding:18px}
      .kkc-title{font-size:44px}.kkc-line{grid-template-columns:72px 1fr auto;gap:12px}.kkc-idx{display:none}
      .kkc-pic{width:72px}.kkc-name{font-size:22px}.kkc-amt{font-size:24px}.kkc-total-n{font-size:46px}
    }
    @media (prefers-reduced-motion:reduce){.kkc *{transition:none !important}}

    .kkc-page{max-width:720px;margin:0 auto;padding:40px 16px 72px}
    .kkc-page .kkc-card{background:var(--paper);border:2px solid var(--ink)}
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
    closeRef.current?.focus({ preventScroll: true });
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener('keydown', onKey);
      prev?.focus?.({ preventScroll: true });
    };
  }, [onClose]);

  const hidden = reduce ? { opacity: 0 } : mobile ? { y: '100%' } : { x: '100%' };
  const shown = reduce ? { opacity: 1 } : mobile ? { y: 0 } : { x: 0 };

  return (
    <div className="kkc">
      <motion.div className="kkc-scrim" onClick={onClose}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.3, delay: 0.1 } }}
        transition={{ duration: 0.35 }} />
      <motion.aside
        className="kkc-drawer"
        role="dialog" aria-modal="true" aria-label="Your cart"
        initial={hidden} animate={shown} exit={hidden}
        transition={{ duration: 0.6, ease: SWIFT }}
        drag={mobile && !reduce ? 'y' : false}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.6 }}
        onDragEnd={(_, info) => { if (info.offset.y > 90 || info.velocity.y > 500) onClose(); }}
      >
        <div className="kkc-grip" aria-hidden="true" />
        <motion.header className="kkc-head" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: SWIFT, delay: 0.08 }}>
          <div>
            <p className="kkc-eyebrow"><Rolling value={two(count)} /> {count === 1 ? 'item' : 'items'}</p>
            <h2 className="kkc-title">Your cart</h2>
          </div>
          <button ref={closeRef} type="button" className="kkc-close" onClick={onClose} aria-label="Close cart">
            <svg viewBox="0 0 16 16" width="14" height="14"><path d="M2 2l12 12M14 2L2 14" stroke="currentColor" strokeWidth="2.2" /></svg>
          </button>
        </motion.header>
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
