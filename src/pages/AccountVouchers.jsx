// src/pages/AccountVouchers.jsx
// The customer's vouchers: ready to use, gifts they sent, and history.
import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import api from '../api';
import Footer from '../components/Footer';

const ease = [0.77, 0, 0.18, 1];
const SITE = 'https://kleankickx.com';

const formatDate = (d) => (d
  ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  : '—');

const daysRemaining = (validUntil) =>
  Math.max(0, Math.ceil((new Date(validUntil) - new Date()) / 86400000));

const statusOf = (voucher) => {
  const days = daysRemaining(voucher.valid_until);
  if (voucher.status === 'REDEEMED') return { key: 'redeemed', label: 'Used', tone: 'done' };
  if (voucher.status === 'CANCELLED') return { key: 'cancelled', label: 'Cancelled', tone: 'bad' };
  if (voucher.status === 'EXPIRED' || days <= 0) return { key: 'expired', label: 'Expired', tone: 'off' };
  if (days <= 14) return { key: 'expiring', label: `${days} day${days === 1 ? '' : 's'} left`, tone: 'wait' };
  return { key: 'active', label: 'Ready to use', tone: 'live' };
};
const isLive = (v) => ['active', 'expiring'].includes(statusOf(v).key);

const shareLink = (v) => {
  const text = `I got you a ${v.service_name || 'sneaker Klean'} from KleanKickx! Your code is ${v.code}. `
    + `Redeem it here: ${SITE}/redeem?apply_voucher=${v.code}`;
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
};

const AccountVouchers = () => {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [copiedCode, setCopiedCode] = useState(null);
  const [legacy, setLegacy] = useState(false);
  const [historyPage, setHistoryPage] = useState({ results: [], next: null, previous: null, n: 1 });
  const [historyBusy, setHistoryBusy] = useState(false);
  const historyRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('payment_status') === 'success' && params.get('order')) {
      toast.success('Payment successful. Your vouchers are ready.');
      window.history.replaceState({}, document.title, '/account/vouchers');
    }
    fetchUserVouchers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  // Current vouchers in one go; history one cursor page at a time.
  const fetchUserVouchers = async () => {
    setFailed(false);
    try {
      const [cur, hist] = await Promise.all([
        api.get('/api/vouchers/user-vouchers/', { params: { scope: 'current' } }),
        api.get('/api/vouchers/user-vouchers/', { params: { scope: 'history' } }),
      ]);
      if (Array.isArray(hist.data)) {
        // Older API without scopes: both calls return the full list.
        setLegacy(true);
        setVouchers(Array.isArray(cur.data) ? cur.data : []);
      } else {
        setLegacy(false);
        setVouchers(Array.isArray(cur.data) ? cur.data : []);
        setHistoryPage({ results: hist.data.results || [], next: hist.data.next, previous: hist.data.previous, n: 1 });
      }
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error('Please sign in to view your vouchers');
        navigate('/auth/login?continue=/account/vouchers');
      } else {
        setFailed(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 1800);
    } catch {
      toast.error('Could not copy the code');
    }
  };

  // Follow a cursor link from the API. Only the cursor value is used, so the request
  // goes through our own API base URL (the link's host/scheme may be the proxy's).
  const goHistory = async (link, dir) => {
    const cursor = link ? new URL(link, window.location.origin).searchParams.get('cursor') : null;
    if (!cursor || historyBusy) return;
    setHistoryBusy(true);
    try {
      const { data } = await api.get('/api/vouchers/user-vouchers/', { params: { scope: 'history', cursor } });
      setHistoryPage((p) => ({ results: data.results || [], next: data.next, previous: data.previous, n: p.n + dir }));
      const top = historyRef.current?.getBoundingClientRect().top;
      if (top !== undefined && top < 0) historyRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch {
      toast.error("Couldn't load more history. Try again.");
    } finally {
      setHistoryBusy(false);
    }
  };

  const ready = vouchers.filter((v) => !v.is_gift && v.bought_by_me !== false && isLive(v));
  const gifts = vouchers.filter((v) => v.is_gift);
  const history = legacy ? vouchers.filter((v) => !v.is_gift && !isLive(v)) : historyPage.results;
  const historyPaged = !legacy && (historyPage.next || historyPage.previous);

  const Code = ({ v, dark = false }) => (
    <button type="button" className={`kkav-code ${dark ? 'dark' : ''}`} onClick={() => copyToClipboard(v.code)}
      aria-label={`Copy voucher code ${v.code}`}>
      <code>{v.code}</code>
      <span aria-live="polite">{copiedCode === v.code ? 'Copied' : 'Copy'}</span>
    </button>
  );

  return (
    <div className="kkav">
      <style>{`
        .kkav{--ink:#0A0B0A;--paper:#F7F9F6;--line:#D9DFD7;--muted:#4D564C;--green:#1A7A1A;--amber:#9A5B00;--red:#B42318;
          --display:"Anton","Arial Narrow",Impact,sans-serif;--mono:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;
          --spring:cubic-bezier(.2,1.25,.3,1);--swift:cubic-bezier(.77,0,.18,1);
          background:var(--paper);color:var(--ink);font-family:"League Spartan",system-ui,sans-serif;min-height:100vh}
        .kkav-wrap{max-width:1200px;margin:0 auto;padding:0 20px 72px}
        .kkav-eyebrow{margin:0;font-size:12px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:var(--green)}
        .kkav-hero{display:flex;align-items:flex-end;justify-content:space-between;gap:20px;padding:48px 0 24px;border-bottom:2px solid var(--ink)}
        .kkav-hero h1{margin:8px 0 0;font-family:var(--display);font-weight:400;text-transform:uppercase;font-size:clamp(56px,8vw,104px);line-height:.88}
        .kkav-hero p.sub{margin:12px 0 0;color:var(--muted);font-size:17px}
        .kkav-count{margin:0;display:flex;flex-direction:column;align-items:flex-end;text-align:right;flex:none}
        .kkav-count b{font-family:var(--display);font-weight:400;font-size:clamp(56px,8vw,104px);line-height:.88;color:var(--green)}
        .kkav-count span{margin-top:8px;font-size:12px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:var(--muted)}
        .kkav-actions{display:flex;flex-wrap:wrap;gap:10px;padding:20px 0 4px}
        .kkav-btn{display:inline-flex;align-items:center;justify-content:center;gap:10px;height:48px;padding:0 20px;border:2px solid var(--ink);border-radius:2px;background:transparent;
          color:var(--ink);font:inherit;font-size:15px;font-weight:700;text-decoration:none;cursor:pointer;white-space:nowrap;transition:background .2s,color .2s,border-color .2s,transform .25s var(--spring)}
        .kkav-btn .ar{transition:transform .3s var(--spring)}
        .kkav-btn:hover{background:var(--ink);color:#fff}
        .kkav-btn:hover .ar{transform:translateX(5px)}
        .kkav-btn:active{transform:scale(.98)}
        .kkav-btn.go{background:var(--green);border-color:var(--green);color:#fff}
        .kkav-btn.go:hover{background:var(--ink);border-color:var(--ink)}
        .kkav-btn.sm{height:44px;padding:0 14px;font-size:14px}
        .kkav :focus-visible{outline:2px solid var(--green);outline-offset:3px}

        .kkav-sec{margin-top:40px}
        .kkav-sec-head{display:flex;justify-content:space-between;align-items:baseline;gap:12px;padding-bottom:12px;border-bottom:2px solid var(--ink);margin-bottom:20px}
        .kkav-sec-head h2{margin:0;font-family:var(--display);font-weight:400;text-transform:uppercase;font-size:34px;line-height:1}
        .kkav-sec-head span{font-size:13px;color:var(--muted)}
        .kkav-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:20px}

        .kkav-tag{display:inline-flex;align-items:center;gap:7px;height:26px;padding:0 9px;border:1px solid currentColor;border-radius:2px;font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;white-space:nowrap}
        .kkav-tag::before{content:"";width:7px;height:7px;background:currentColor}
        .kkav-tag.live{color:var(--green);background:#E9F4E7}
        .kkav-tag.wait{color:var(--amber);background:#FFF6E5}
        .kkav-tag.done{color:var(--ink);background:#fff}
        .kkav-tag.off{color:var(--muted);background:#fff}
        .kkav-tag.bad{color:var(--red);background:#FDECEA}

        .kkav-ticket{position:relative;display:flex;flex-direction:column;background:var(--ink);color:#fff;transition:transform .4s var(--spring)}
        .kkav-ticket:hover{transform:translateY(-4px)}
        .kkav-ticket-top{padding:20px 20px 18px}
        .kkav-ticket-row{display:flex;justify-content:space-between;align-items:center;gap:10px}
        .kkav-ticket .kkav-type{font-size:12px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:#A9B3A7;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .kkav-ticket .kkav-tag.live{background:transparent;color:#6FD46F}
        .kkav-ticket .kkav-tag.wait{background:transparent;color:#F2B544}
        .kkav-ticket h3{margin:12px 0 0;font-family:var(--display);font-weight:400;text-transform:uppercase;font-size:38px;line-height:.92}
        .kkav-ticket .pairs{margin:6px 0 0;color:#C4CCC2;font-size:14px}
        .kkav-perf{position:relative;height:0;border-top:2px dashed rgba(255,255,255,.28);margin:0 20px}
        .kkav-perf::before,.kkav-perf::after{content:"";position:absolute;top:-12px;width:22px;height:22px;border-radius:50%;background:var(--paper)}
        .kkav-perf::before{left:-31px}.kkav-perf::after{right:-31px}
        .kkav-ticket-bottom{padding:18px 20px 20px;display:flex;flex-direction:column;gap:14px;flex:1}
        .kkav-meta{display:flex;justify-content:space-between;gap:12px;font-size:13px;color:#A9B3A7}
        .kkav-meta b{display:block;margin-top:2px;font-size:15px;color:#fff}
        .kkav-meta .val b{font-family:var(--display);font-weight:400;font-size:28px;line-height:1}
        .kkav-ticket-actions{display:grid;grid-template-columns:1fr auto;gap:8px;margin-top:auto}
        .kkav-ticket .kkav-btn{border-color:#fff;color:#fff}
        .kkav-ticket .kkav-btn:hover{background:#fff;color:var(--ink)}
        .kkav-ticket .kkav-btn.go{border-color:var(--green);background:var(--green)}
        .kkav-ticket .kkav-btn.go:hover{background:#fff;border-color:#fff;color:var(--ink)}

        .kkav-code{display:flex;align-items:center;justify-content:space-between;gap:12px;width:100%;padding:12px 14px;border:1.5px dashed var(--line);border-radius:2px;
          background:#fff;color:var(--ink);font:inherit;cursor:pointer;text-align:left;transition:border-color .2s}
        .kkav-code code{font-family:var(--mono);font-size:17px;font-weight:700;letter-spacing:.12em;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .kkav-code span{flex:none;font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--green)}
        .kkav-code:hover{border-color:var(--ink)}
        .kkav-code.dark{background:rgba(255,255,255,.06);border-color:rgba(255,255,255,.35);color:#fff}
        .kkav-code.dark span{color:#6FD46F}
        .kkav-code.dark:hover{border-color:#fff}

        .kkav-gift{display:flex;flex-direction:column;gap:14px;padding:20px;background:#fff;border:1px solid var(--line)}
        .kkav-gift-to{margin:0;font-size:13px;color:var(--muted)}
        .kkav-gift-to b{display:block;margin-top:2px;font-size:17px;color:var(--ink);overflow-wrap:anywhere}
        .kkav-gift h3{margin:0;font-family:var(--display);font-weight:400;text-transform:uppercase;font-size:28px;line-height:.95}
        .kkav-quote{margin:0;padding-left:12px;border-left:3px solid var(--green);font-size:15px;line-height:1.5;color:var(--ink);font-style:italic}
        .kkav-gift-foot{display:flex;justify-content:space-between;align-items:center;gap:10px;padding-top:12px;border-top:1px solid var(--line);font-size:13px;color:var(--muted)}

        .kkav-hist{list-style:none;margin:0;padding:0;transition:opacity .2s}
        .kkav-hist.busy{opacity:.45;pointer-events:none}
        .kkav-pager{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:18px}
        .kkav-pager > span{font-size:13px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:var(--muted)}
        .kkav-btn:disabled{opacity:.35;cursor:default}
        .kkav-btn:disabled:hover{background:transparent;color:var(--ink)}
        .kkav-btn:hover:not(:disabled) .ar.back{transform:translateX(-5px)}
        .kkav-btn:hover .ar.back{transform:translateX(-5px)}
        .kkav-hist li{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(0,1fr) 150px minmax(0,1fr);align-items:center;gap:16px;padding:14px 4px;border-bottom:1px solid var(--line)}
        .kkav-hist .name{font-weight:700}
        .kkav-hist .name small{display:block;margin-top:2px;font-weight:500;font-size:13px;color:var(--muted)}
        .kkav-hist code{font-family:var(--mono);font-size:14px;letter-spacing:.08em;color:var(--muted)}
        .kkav-hist .when{font-size:14px;color:var(--muted);text-align:right}
        .kkav-hist .when a{color:var(--ink);font-weight:700;text-decoration:underline;text-underline-offset:3px}
        .kkav-hist .when a:hover{color:var(--green)}

        .kkav-empty{margin-top:28px;padding:64px 24px;border:2px dashed var(--line);text-align:center}
        .kkav-empty h2{margin:0;font-family:var(--display);font-weight:400;text-transform:uppercase;font-size:44px;line-height:.95}
        .kkav-empty p{margin:12px auto 22px;max-width:44ch;color:var(--muted)}
        .kkav-empty div{display:flex;flex-wrap:wrap;justify-content:center;gap:10px}
        .kkav-skel{height:300px;background:linear-gradient(90deg,var(--line) 0%,#EEF2EC 50%,var(--line) 100%);background-size:200% 100%;animation:kkavShim 1.3s linear infinite}
        @keyframes kkavShim{to{background-position:-200% 0}}

        @media (max-width:760px){
          .kkav-hist li{grid-template-columns:1fr auto;row-gap:4px}
          .kkav-hist code{grid-column:1}
          .kkav-hist .when{grid-column:1 / -1;text-align:left}
        }
        @media (max-width:560px){
          .kkav-hero{padding:34px 0 20px}
          .kkav-actions .kkav-btn{flex:1}
          .kkav-grid{grid-template-columns:1fr}
          .kkav-sec-head h2{font-size:28px}
        }
        @media (prefers-reduced-motion:reduce){.kkav-skel{animation:none}}
      `}</style>

      <div className="kkav-wrap">
        <header className="kkav-hero">
          <div>
            <p className="kkav-eyebrow">Your account</p>
            <h1>Vouchers</h1>
            <p className="sub">Your codes, the gifts you've sent, and what's been used.</p>
          </div>
          {!loading && ready.length > 0 && (
            <p className="kkav-count" aria-label={`${ready.length} ready to use`}>
              <b>{String(ready.length).padStart(2, '0')}</b>
              <span>Ready to use</span>
            </p>
          )}
        </header>

        <div className="kkav-actions">
          <Link to="/vouchers" className="kkav-btn go">Buy a voucher <span className="ar" aria-hidden="true">→</span></Link>
          <Link to="/redeem" className="kkav-btn">Redeem a code</Link>
        </div>

        {loading ? (
          <div className="kkav-sec">
            <div className="kkav-grid" aria-busy="true" aria-label="Loading your vouchers">
              {[0, 1, 2].map((k) => <div key={k} className="kkav-skel" />)}
            </div>
          </div>
        ) : failed ? (
          <div className="kkav-empty" role="alert">
            <h2>Couldn't load vouchers</h2>
            <p>Something went wrong on our side. Try again in a moment.</p>
            <div><button type="button" className="kkav-btn" onClick={() => { setLoading(true); fetchUserVouchers(); }}>Try again</button></div>
          </div>
        ) : vouchers.length === 0 && history.length === 0 ? (
          <div className="kkav-empty">
            <h2>No vouchers yet</h2>
            <p>Give someone a Klean, or treat yourself to a bundle for later. Got a code from a friend? Redeem it and it shows up here.</p>
            <div>
              <Link to="/vouchers" className="kkav-btn go">Browse vouchers <span className="ar" aria-hidden="true">→</span></Link>
              <Link to="/redeem" className="kkav-btn">Redeem a code</Link>
            </div>
          </div>
        ) : (
          <>
            {ready.length > 0 && (
              <section className="kkav-sec" aria-labelledby="kkav-ready">
                <div className="kkav-sec-head"><h2 id="kkav-ready">Ready to use</h2><span>{ready.length}</span></div>
                <div className="kkav-grid">
                  {ready.map((v, i) => {
                    const st = statusOf(v);
                    const pairs = Number(v.pairs) || 0;
                    return (
                      <motion.article key={v.id} className="kkav-ticket"
                        initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: i * 0.05, ease }}>
                        <div className="kkav-ticket-top">
                          <div className="kkav-ticket-row">
                            <span className="kkav-type">{v.voucher_type}</span>
                            <span className={`kkav-tag ${st.tone}`}>{st.label}</span>
                          </div>
                          <h3>{v.service_name || 'Sneaker Klean'}</h3>
                          {pairs > 0 && <p className="pairs">{pairs} {pairs === 1 ? 'pair' : 'pairs'}</p>}
                        </div>
                        <div className="kkav-perf" aria-hidden="true" />
                        <div className="kkav-ticket-bottom">
                          <Code v={v} dark />
                          <div className="kkav-meta">
                            <span className="val">Value<b>₵{Number(v.purchase_price || 0).toLocaleString('en-GH')}</b></span>
                            <span style={{ textAlign: 'right' }}>Valid until<b>{formatDate(v.valid_until)}</b></span>
                          </div>
                          <div className="kkav-ticket-actions">
                            <button type="button" className="kkav-btn go sm" onClick={() => navigate(`/redeem?apply_voucher=${encodeURIComponent(v.code)}`)}>
                              Use it now <span className="ar" aria-hidden="true">→</span>
                            </button>
                            <a className="kkav-btn sm" href={shareLink(v)} target="_blank" rel="noopener noreferrer" aria-label={`Share voucher ${v.code} on WhatsApp`}>
                              Share
                            </a>
                          </div>
                        </div>
                      </motion.article>
                    );
                  })}
                </div>
              </section>
            )}

            {gifts.length > 0 && (
              <section className="kkav-sec" aria-labelledby="kkav-gifts">
                <div className="kkav-sec-head"><h2 id="kkav-gifts">Gifts you sent</h2><span>{gifts.length}</span></div>
                <div className="kkav-grid">
                  {gifts.map((v) => {
                    const st = statusOf(v);
                    const used = st.key === 'redeemed';
                    return (
                      <article key={v.id} className="kkav-gift">
                        <div className="kkav-ticket-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                          <p className="kkav-gift-to">Sent to<b>{v.sent_to}</b></p>
                          <span className={`kkav-tag ${used ? 'live' : st.tone}`}>{used ? 'Used by them' : st.key === 'active' || st.key === 'expiring' ? 'Not used yet' : st.label}</span>
                        </div>
                        <h3>{v.service_name || v.voucher_type}</h3>
                        {v.gift_message && <p className="kkav-quote">“{v.gift_message}”</p>}
                        {isLive(v) && <Code v={v} />}
                        <div className="kkav-gift-foot">
                          <span>{used ? `Used ${formatDate(v.redeemed_at)}` : `Valid until ${formatDate(v.valid_until)}`}</span>
                          {isLive(v) && (
                            <a className="kkav-btn sm" href={shareLink(v)} target="_blank" rel="noopener noreferrer" style={{ height: 38 }}>
                              Resend on WhatsApp
                            </a>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            )}

            {history.length > 0 && (
              <section className="kkav-sec" aria-labelledby="kkav-hist" ref={historyRef}>
                <div className="kkav-sec-head">
                  <h2 id="kkav-hist">History</h2>
                  {!historyPaged && <span>{history.length}</span>}
                </div>
                <ul className={`kkav-hist ${historyBusy ? 'busy' : ''}`} aria-busy={historyBusy}>
                  {history.map((v) => {
                    const st = statusOf(v);
                    return (
                      <li key={v.id}>
                        <span className="name">
                          {v.service_name || v.voucher_type}
                          <small>{v.bought_by_me === false ? `Gift from ${v.from_name || 'a friend'}` : v.voucher_type}</small>
                        </span>
                        <code>{v.code}</code>
                        <span><span className={`kkav-tag ${st.tone}`}>{st.label}</span></span>
                        <span className="when">
                          {st.key === 'redeemed'
                            ? <>Used {formatDate(v.redeemed_at)}{v.order_reference && <> · <Link to={`/orders/${v.order_reference}`}>Order #{v.order_reference}</Link></>}</>
                            : `Ended ${formatDate(v.valid_until)}`}
                        </span>
                      </li>
                    );
                  })}
                </ul>
                {historyPaged && (
                  <nav className="kkav-pager" aria-label="History pages">
                    <button type="button" className="kkav-btn sm" onClick={() => goHistory(historyPage.previous, -1)}
                      disabled={!historyPage.previous || historyBusy}>
                      <span className="ar back" aria-hidden="true">←</span> Newer
                    </button>
                    <span aria-live="polite">{historyBusy ? 'Loading…' : `Page ${historyPage.n}`}</span>
                    <button type="button" className="kkav-btn sm" onClick={() => goHistory(historyPage.next, 1)}
                      disabled={!historyPage.next || historyBusy}>
                      Older <span className="ar" aria-hidden="true">→</span>
                    </button>
                  </nav>
                )}
              </section>
            )}
          </>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default AccountVouchers;
