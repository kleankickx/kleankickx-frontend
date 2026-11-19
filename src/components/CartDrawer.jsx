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
import api from '../api';
import useQuickAdd from '../hooks/useQuickAdd';
import { prepareCartPhoto, photoSrc } from '../utils/cartPhoto';

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

/** Optional photo of the sneakers on this line: the customer's record of their
 *  condition. One per line here; after checkout they can add one per pair. */
const LinePhoto = ({ item, pairs }) => {
  const { addImageToCartItem, removeImageFromCartItem } = useContext(CartContext);
  const input = useRef(null);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const saving = String(item.id).startsWith('temp-');   // still being added to the cart
  const src = photoSrc(item.image_base64);
  const has = !!src || item.has_image;

  const pick = async (file) => {
    if (!file) return;
    setError(''); setBusy('Adding photo…');
    try {
      const raw = await prepareCartPhoto(file);
      await addImageToCartItem(item.id, raw);
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || "That photo didn't upload. Try again.");
    } finally {
      setBusy('');
      if (input.current) input.current.value = '';
    }
  };
  const remove = async () => {
    setError(''); setBusy('Removing…');
    try { await removeImageFromCartItem(item.id); } catch { setError("Couldn't remove it. Try again."); } finally { setBusy(''); }
  };

  return (
    <div className="kkc-photo">
      {has ? (
        <>
          {src ? <img className="kkc-photo-thumb" src={src} alt={`Your photo of ${item.service_details?.name || 'this pair'}`} />
            : <span className="kkc-photo-thumb" aria-hidden="true" />}
          <div className="kkc-photo-text">
            <span className="ok">Photo added</span>
            <span className="kkc-photo-links">
              <button type="button" onClick={() => input.current?.click()} disabled={!!busy}>Change</button>
              <button type="button" onClick={remove} disabled={!!busy}>Remove</button>
            </span>
          </div>
        </>
      ) : (
        <button type="button" className="kkc-photo-add" onClick={() => input.current?.click()} disabled={!!busy || saving}
          title={saving ? 'One moment, still adding this to your cart' : undefined}>
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path d="M4 8h3l1.5-2h7L17 8h3v11H4z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
            <circle cx="12" cy="13.5" r="3.2" fill="none" stroke="currentColor" strokeWidth="1.8" />
          </svg>
          <span><b>Add a photo</b> <i>optional</i></span>
        </button>
      )}
      {busy ? <p className="kkc-photo-note">{busy}</p>
        : error ? <p className="kkc-photo-note err" role="alert">{error}</p>
        : !has && <p className="kkc-photo-note">Your record of their condition.{pairs > 1 ? ' You can add one per pair after checkout.' : ''}</p>}
      <input ref={input} type="file" accept="image/*,.heic,.heif" capture="environment" hidden onChange={(e) => pick(e.target.files?.[0])} />
    </div>
  );
};

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
        <LinePhoto item={item} pairs={pairs} />
      </div>
      <p className="kkc-amt">{free || voucher ? <span className="kkc-amt-free">Free</span> : <Rolling value={money(lineTotal)} />}</p>
    </motion.li>
  );
};

/** Sneaker sole prints walking across the empty cart, one step at a time; the last
 *  lands in brand green, then the trail fades and walks again. */
const SOLE = 'M3 11C3 5 9 1.5 18 2C25 2.4 29 4.5 34 4.5C41 4.5 47 5.5 49 11C51 17.5 44 21 35 20C29 19.5 26 17.5 21 17.5C14 17.5 10 20.5 6 20C3.5 19.7 3 15.5 3 11Z';
const TREAD = 'M10 7v9M15 5v12M20 5.5v10M27 6v10M33 6.5v11M39 7v11M44 8v8';
const STEPS = [
  { x: 6, y: 64 }, { x: 50, y: 36 }, { x: 94, y: 64 }, { x: 138, y: 36 }, { x: 182, y: 64 },
];
const LOOP = 4.2;

const EmptyArt = () => {
  const reduce = useReducedMotion();
  return (
    <svg className="kkc-art" viewBox="0 0 240 110" aria-hidden="true">
      <path d="M0 104H240" stroke="var(--line)" strokeWidth="2" strokeDasharray="2 6" strokeLinecap="round" />
      {STEPS.map(({ x, y }, i) => {
        const last = i === STEPS.length - 1;
        const at = (i * 0.42) / LOOP;          // when this step lands, as a fraction of the loop
        return (
          <g key={i} transform={`translate(${x} ${y}) rotate(${i % 2 ? -8 : 8} 26 11)`}>
            <motion.g
              style={{ originX: '26px', originY: '11px' }}
              initial={reduce ? false : { opacity: 0, scale: 1.25 }}
              animate={reduce ? { opacity: 1, scale: 1 } : {
                opacity: [0, 0, 1, 1, 0],
                scale: [1.25, 1.25, 1, 1, 1],
              }}
              transition={reduce ? undefined : {
                duration: LOOP, repeat: Infinity, ease: 'easeOut',
                times: [0, at, Math.min(at + 0.06, 0.98), 0.86, 1],
              }}
            >
              <path d={SOLE} fill={last ? 'var(--green)' : 'var(--ink)'} />
              <path d={TREAD} fill="none" stroke="var(--paper)" strokeWidth="1.6" strokeLinecap="round" opacity=".55" />
            </motion.g>
          </g>
        );
      })}
    </svg>
  );
};

/** Three popular Kleans, addable in one tap straight from the empty cart. */
const QuickPicks = () => {
  const { quickAdd, addingId } = useQuickAdd();
  const [picks, setPicks] = useState(null);

  useEffect(() => {
    let live = true;
    api.get('/api/services/public/').then(({ data }) => {
      const list = (Array.isArray(data) ? data : data?.results || [])
        .filter((x) => !x.is_free_signup_service && !x.is_wholesale);
      const find = (word) => list.find((x) => x.name?.toLowerCase().includes(word));
      const chosen = [find('standard'), find('deep'), find('triple')].filter(Boolean);
      const rest = list.filter((x) => !chosen.includes(x));
      if (live) setPicks([...chosen, ...rest].slice(0, 3));
    }).catch(() => { if (live) setPicks([]); });
    return () => { live = false; };
  }, []);

  if (picks && !picks.length) return null;
  return (
    <div className="kkc-picks">
      <p className="kkc-eyebrow">Popular right now</p>
      <ul>
        {(picks || [0, 1, 2]).map((svc, i) => (svc?.id ? (
          <motion.li key={svc.id} initial={{ y: 10 }} animate={{ y: 0 }}
            transition={{ delay: 0.35 + i * 0.07, duration: 0.45, ease: SWIFT }}>
            <img src={svc.image || FALLBACK_IMG} alt="" loading="lazy" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = FALLBACK_IMG; }} />
            <div className="kkc-pick-main">
              <p className="kkc-pick-name">{svc.name}</p>
              <p className="kkc-pick-price">{money(svc.price)}{Number(svc.included_quantity) > 1 ? ` / ${svc.included_quantity} pairs` : ' / pair'}</p>
            </div>
            <button type="button" className="kkc-pick-add" onClick={() => quickAdd(svc)} disabled={addingId === svc.id}
              aria-label={`Add ${svc.name} to cart`}>
              {addingId === svc.id ? <span className="kkc-spin" /> : <>Add <span aria-hidden="true">+</span></>}
            </button>
          </motion.li>
        ) : <li key={i} className="kkc-pick-skel" />))}
      </ul>
    </div>
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
      <div className="kkc-empty-wrap">
        <motion.div className="kkc-empty" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: SWIFT, delay: 0.05 }}>
          <EmptyArt />
          <h3 className="kkc-empty-h">No pairs yet</h3>
          <p className="kkc-empty-p">Take the first step: add a Klean below, or browse every service and bundle.</p>
        </motion.div>
        <QuickPicks />
        <div className="kkc-empty-foot">
          <button type="button" className="kkc-btn go wide" onClick={() => go('/#services')}>
            See all services <span className="ar" aria-hidden="true">→</span>
          </button>
        </div>
      </div>
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
    .kkc-photo{display:flex;flex-wrap:wrap;align-items:center;gap:6px 10px;margin-top:12px}
    .kkc-photo-add{display:inline-flex;align-items:center;gap:8px;padding:8px 12px;border:1.5px dashed rgba(10,11,10,.35);border-radius:2px;background:transparent;
      color:var(--ink);font:inherit;font-size:13px;cursor:pointer;transition:border-color .2s,color .2s,background .2s}
    .kkc-photo-add b{font-weight:700}
    .kkc-photo-add i{font-style:normal;color:var(--muted);margin-left:2px}
    .kkc-photo-add:hover:not(:disabled){border-color:var(--green);color:var(--green);background:rgba(26,122,26,.05)}
    .kkc-photo-add:disabled{opacity:.5;cursor:default}
    .kkc-photo-thumb{width:44px;height:44px;object-fit:cover;display:block;background:var(--line);border:1px solid var(--line)}
    .kkc-photo-text{display:flex;flex-direction:column;gap:2px;font-size:13px}
    .kkc-photo-text .ok{font-weight:700;color:var(--green)}
    .kkc-photo-links{display:flex;gap:12px}
    .kkc-photo-links button{border:0;background:none;padding:0;font:inherit;font-size:12px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;
      color:var(--muted);cursor:pointer;text-decoration:underline;text-underline-offset:3px}
    .kkc-photo-links button:hover{color:var(--ink)}
    .kkc-photo-note{flex-basis:100%;margin:0;font-size:12.5px;color:var(--muted)}
    .kkc-photo-note.err{color:#B42318}
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

    .kkc-empty-wrap{display:flex;flex-direction:column;flex:1;min-height:0;overflow-y:auto}
    .kkc-empty{padding:26px 24px 8px;display:flex;flex-direction:column;align-items:flex-start;gap:10px}
    .kkc-art{width:260px;max-width:84%;height:auto;margin:8px 0 10px;overflow:visible}
    .kkc-empty-h{margin:0;font-family:var(--display);font-weight:400;font-size:52px;line-height:.9;text-transform:uppercase;max-width:9ch}
    .kkc-empty-p{margin:0;color:var(--muted);font-size:15px;line-height:1.5;max-width:34ch}
    .kkc-picks{padding:18px 24px 6px}
    .kkc-picks ul{list-style:none;margin:10px 0 0;padding:0;border-top:2px solid var(--ink)}
    .kkc-picks li{display:grid;grid-template-columns:52px 1fr auto;gap:12px;align-items:center;padding:12px 0;border-bottom:1px solid var(--line)}
    .kkc-picks img{width:52px;height:52px;object-fit:cover;background:var(--line);display:block}
    .kkc-pick-main{min-width:0}
    .kkc-pick-name{margin:0;font-family:var(--display);font-size:20px;line-height:1;text-transform:uppercase;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .kkc-pick-price{margin:4px 0 0;font-size:13px;color:var(--muted);font-variant-numeric:tabular-nums}
    .kkc-pick-add{display:inline-flex;align-items:center;justify-content:center;gap:6px;min-width:72px;height:38px;padding:0 12px;border:2px solid var(--ink);
      border-radius:2px;background:transparent;color:var(--ink);font:inherit;font-size:14px;font-weight:700;cursor:pointer;
      transition:background .2s,color .2s,transform .25s var(--spring)}
    .kkc-pick-add:hover:not(:disabled){background:var(--ink);color:#fff}
    .kkc-pick-add:active{transform:scale(.96)}
    .kkc-pick-add:focus-visible{outline:2px solid var(--green);outline-offset:3px}
    .kkc-pick-skel{height:52px;margin:12px 0;background:linear-gradient(90deg,var(--line) 0%,#EEF2EC 50%,var(--line) 100%);background-size:200% 100%;animation:kkcShim 1.3s linear infinite;border:0 !important}
    .kkc-spin{width:16px;height:16px;border-radius:50%;border:2px solid rgba(10,11,10,.15);border-top-color:var(--ink);animation:kkcSpin .8s linear infinite}
    @keyframes kkcSpin{to{transform:rotate(360deg)}}
    .kkc-empty-foot{margin-top:auto;padding:16px 24px 22px}
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
            <p className="kkc-eyebrow">
              {count > 0 ? <><Rolling value={two(count)} /> {count === 1 ? 'item' : 'items'}</> : 'Ready when you are'}
            </p>
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
