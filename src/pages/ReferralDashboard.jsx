// src/pages/ReferralDashboard.jsx
// Refer a friend: share link, points (50 per friend's first order, redeem from 100),
// active discount, referrals and redemption history.
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import JSConfetti from 'js-confetti';
import api from '../api';
import Footer from '../components/Footer';
import { ACCOUNT_CSS } from '../components/AccountShell';

const POINTS_PER_REFERRAL = 50;   // orders/services.py award_referral_points
const MIN_REDEEM = 100;           // referrals/views.py MIN_REDEMPTION_POINTS
const ease = [0.77, 0, 0.18, 1];
let confetti = null;

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '');
const pct = (v) => {
  const n = parseFloat(v) || 0;
  return `${n % 1 ? n.toFixed(1) : n}%`;
};

const CSS = ACCOUNT_CSS + `
  .kkrf-hero{display:flex;align-items:flex-end;justify-content:space-between;gap:20px;padding:44px 0 22px;border-bottom:2px solid var(--ink)}
  .kkrf-hero h1{margin:8px 0 0;font-family:var(--display);font-weight:400;text-transform:uppercase;font-size:clamp(52px,8vw,104px);line-height:.88}
  .kkrf-hero p.sub{margin:12px 0 0;color:var(--muted);font-size:17px;max-width:46ch;line-height:1.5}
  .kkrf-pts{margin:0;display:flex;flex-direction:column;align-items:flex-end;text-align:right;flex:none}
  .kkrf-pts b{font-family:var(--display);font-weight:400;font-size:clamp(56px,8vw,104px);line-height:.88;color:var(--green);font-variant-numeric:tabular-nums}
  .kkrf-pts span{margin-top:8px;font-size:12px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:var(--muted)}
  .kkrf-share{background:var(--ink);color:#fff;padding:22px}
  .kkrf-share .kkac-eyebrow{color:#6FD46F}
  .kkrf-share h2{margin:6px 0 0;font-family:var(--display);font-weight:400;text-transform:uppercase;font-size:clamp(30px,3.6vw,42px);line-height:.95}
  .kkrf-share p{margin:10px 0 0;color:#C4CCC2;font-size:15px;line-height:1.5}
  .kkrf-link{display:flex;align-items:stretch;margin-top:18px;border:1.5px solid rgba(255,255,255,.35)}
  .kkrf-link input{flex:1;min-width:0;padding:0 14px;height:52px;border:0;outline:0;background:transparent;color:#fff;font:inherit;font-size:15px}
  .kkrf-link button{flex:none;padding:0 18px;border:0;border-left:1.5px solid rgba(255,255,255,.35);background:#fff;color:var(--ink);font:inherit;font-size:14px;font-weight:700;cursor:pointer;transition:background .2s,color .2s}
  .kkrf-link button:hover{background:#6FD46F}
  .kkrf-label{display:flex;justify-content:space-between;align-items:baseline;gap:10px;margin:20px 0 8px !important;font-size:11px !important;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#A9B3A7 !important}
  .kkrf-label span{font-weight:500;letter-spacing:.02em;text-transform:none;font-size:12.5px}
  .kkrf-codebox{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 12px 12px 18px;border:1.5px dashed rgba(255,255,255,.45)}
  .kkrf-codebox code{font-family:var(--mono);font-size:28px;font-weight:700;letter-spacing:.18em;color:#fff;overflow-wrap:anywhere}
  .kkrf-codebox div{display:flex;gap:8px;flex:none}
  .kkrf-codebox button{height:42px;padding:0 14px;border:2px solid #fff;border-radius:2px;background:transparent;color:#fff;font:inherit;font-size:13px;font-weight:700;cursor:pointer;transition:background .2s,color .2s}
  .kkrf-codebox button:first-child{background:#fff;color:var(--ink)}
  .kkrf-codebox button:hover{background:#6FD46F;border-color:#6FD46F;color:var(--ink)}
  @media (max-width:560px){.kkrf-label{flex-direction:column;gap:2px}.kkrf-codebox{flex-direction:column;align-items:stretch;padding:14px}.kkrf-codebox code{font-size:24px;text-align:center}.kkrf-codebox div button{flex:1}}
  .kkrf-share-row{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:16px}
  .kkrf-share-row a,.kkrf-share-row button{display:inline-flex;align-items:center;justify-content:center;gap:8px;height:48px;border:2px solid #fff;border-radius:2px;background:transparent;color:#fff;
    font:inherit;font-size:14px;font-weight:700;text-decoration:none;cursor:pointer;transition:background .2s,color .2s,border-color .2s}
  .kkrf-share-row .wa{background:var(--green);border-color:var(--green)}
  .kkrf-share-row a:hover,.kkrf-share-row button:hover{background:#fff;color:var(--ink);border-color:#fff}
  .kkrf-meter{display:flex;gap:4px;margin:16px 0 8px}
  .kkrf-meter span{flex:1;height:8px;background:var(--line);position:relative;overflow:hidden}
  .kkrf-meter span i{position:absolute;inset:0;background:var(--green);transform-origin:left;transition:transform .8s var(--spring)}
  .kkrf-big{font-family:var(--display);font-weight:400;font-size:56px;line-height:1;font-variant-numeric:tabular-nums}
  .kkrf-big small{font-family:inherit;font-size:20px;color:var(--muted);margin-left:6px}
  .kkrf-disc{margin-top:16px;padding:14px 16px;border:2px solid var(--green);background:var(--tint)}
  .kkrf-disc b{display:block;font-family:var(--display);font-weight:400;font-size:34px;line-height:1;color:var(--green)}
  .kkrf-disc span{display:block;margin-top:4px;font-size:14px;color:var(--ink)}
  .kkrf-steps{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(3,1fr)}
  .kkrf-steps li{padding:18px 18px 4px 0}
  .kkrf-steps li + li{padding-left:18px;border-left:1px solid var(--line)}
  .kkrf-steps .n{font-family:var(--display);font-size:40px;line-height:1;color:var(--green)}
  .kkrf-steps b{display:block;margin-top:6px;font-family:var(--display);font-weight:400;text-transform:uppercase;font-size:22px}
  .kkrf-steps p{margin:4px 0 0;color:var(--muted);font-size:14.5px;line-height:1.5}
  .kkrf-list{list-style:none;margin:0;padding:0}
  .kkrf-list li{display:grid;grid-template-columns:40px minmax(0,1fr) auto auto;gap:12px;align-items:center;padding:12px 0;border-bottom:1px solid var(--line)}
  .kkrf-list li:last-child{border-bottom:0}
  .kkrf-ini{width:40px;height:40px;display:grid;place-items:center;background:var(--ink);color:#fff;font-family:var(--display);font-size:16px}
  .kkrf-who{min-width:0}
  .kkrf-who b{display:block;font-size:15px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .kkrf-who small{color:var(--muted);font-size:13px}
  .kkrf-plus{font-family:var(--display);font-size:22px;color:var(--green);min-width:56px;text-align:right}
  .kkrf-plus.off{color:var(--muted)}
  .kkrf-empty{padding:28px 0 10px;text-align:center;color:var(--muted)}
  .kkrf-empty b{display:block;font-family:var(--display);font-weight:400;text-transform:uppercase;font-size:28px;color:var(--ink)}
  @media (max-width:900px){.kkrf-steps{grid-template-columns:1fr}.kkrf-steps li + li{padding-left:0;border-left:0;border-top:1px solid var(--line)}}
  @media (max-width:560px){
    .kkrf-hero{padding-top:30px}
    .kkrf-pts b{font-size:clamp(44px,13vw,60px)}
    .kkrf-share{padding:18px 16px}
    .kkrf-list li{grid-template-columns:40px minmax(0,1fr) auto;row-gap:6px}
    .kkrf-list li .kkac-tag{grid-column:2;justify-self:start}
    .kkrf-list li .kkrf-plus{grid-row:1;grid-column:3}
  }
`;

export default function ReferralDashboard() {
  const [code, setCode] = useState('');
  const [link, setLink] = useState('');
  const [referrals, setReferrals] = useState([]);
  const [points, setPoints] = useState(0);
  const [activeDiscount, setActiveDiscount] = useState(null);
  const [history, setHistory] = useState([]);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState(false);

  const fetchCode = async () => {
    const res = await api.get('/api/referrals/code/');
    setCode(res.data.code);
    setLink(res.data.referral_link);
  };
  const fetchReferrals = async () => setReferrals((await api.get('/api/referrals/stats/')).data || []);
  const fetchPoints = async () => setPoints((await api.get('/api/referrals/points/')).data.points || 0);
  const fetchActiveDiscount = async () => {
    try {
      const { data } = await api.get('/api/referrals/active-discount/');
      setActiveDiscount(data && Object.keys(data).length ? data : null);
    } catch {
      setActiveDiscount(null);
    }
  };
  const fetchHistory = async () => {
    try { setHistory((await api.get('/api/referrals/redeem/history/')).data || []); } catch { setHistory([]); }
  };

  const loadAll = async () => {
    setLoading(true);
    await Promise.allSettled([fetchCode(), fetchReferrals(), fetchPoints(), fetchActiveDiscount(), fetchHistory()]);
    setLoading(false);
  };
  useEffect(() => { loadAll(); }, []);

  const redeemPoints = async () => {
    if (redeeming || points < MIN_REDEEM) return;
    setRedeeming(true);
    try {
      const res = await api.post('/api/referrals/redeem/', {});
      if (res.data.discount_percentage) {
        await Promise.allSettled([fetchPoints(), fetchActiveDiscount(), fetchHistory()]);
        try { (confetti ||= new JSConfetti()).addConfetti({ confettiColors: ['#1A7A1A', '#4CB84C', '#0A0B0A', '#D9DFD7'] }); } catch { /* decorative */ }
        toast.success(`Redeemed. You get ${pct(res.data.discount_percentage)} off your next order.`);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || "Couldn't redeem your points. Try again.");
    } finally {
      setRedeeming(false);
    }
  };

  // copied: '' | 'link' | 'code'
  const copy = async (what) => {
    try {
      await navigator.clipboard.writeText(what === 'code' ? code : link);
      setCopied(what);
      setTimeout(() => setCopied(''), 1800);
    } catch {
      toast.error(`Could not copy the ${what}`);
    }
  };
  const copyLink = () => copy('link');

  const shareText = `Get your sneakers cleaned by KleanKickx. Sign up with my link and get a discount on your first order: ${link}`;
  const codeText = `Get your sneakers cleaned by KleanKickx. Sign up at kleankickx.com and enter my referral code ${code} for a discount on your first order.`;
  const canShare = typeof navigator !== 'undefined' && !!navigator.share;
  const shareCode = () => {
    if (canShare) navigator.share({ title: 'KleanKickx referral code', text: codeText }).catch(() => {});
    else window.open(`https://wa.me/?text=${encodeURIComponent(codeText)}`, '_blank', 'noopener');
  };
  const done = referrals.filter((r) => r.first_order_completed).length;
  const progress = Math.min(1, points / MIN_REDEEM);
  const needed = Math.max(0, MIN_REDEEM - points);

  return (
    <div className="kkac">
      <style>{CSS}</style>
      <div className="kkac-wrap">
        <header className="kkrf-hero">
          <div>
            <h1>Refer a friend</h1>
            <p className="sub">Share your link. When a friend completes their first order, you get {POINTS_PER_REFERRAL} points. Every {MIN_REDEEM} points becomes a discount.</p>
          </div>
          <p className="kkrf-pts" aria-label={`${points} points`}>
            <b>{loading ? '—' : points}</b>
            <span>Points</span>
          </p>
        </header>

        <div className="kkac-grid">
          <div className="kkac-col">
            <motion.section className="kkrf-share" aria-labelledby="kkrf-share-h"
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease }}>
              <p className="kkac-eyebrow">Share & earn</p>
              <h2 id="kkrf-share-h">Give a Klean, get rewarded</h2>
              <p>Friends who sign up with your link or code get a discount on their first order.</p>
              {loading && !link ? <div className="kkac-skel" style={{ height: 52, marginTop: 18, opacity: 0.25 }} /> : (
                <>
                  <p className="kkrf-label">Link</p>
                  <div className="kkrf-link">
                    <input value={link} readOnly aria-label="Your referral link" onFocus={(e) => e.target.select()} />
                    <button type="button" onClick={copyLink} aria-live="polite">{copied === 'link' ? 'Copied' : 'Copy'}</button>
                  </div>
                  <div className="kkrf-share-row">
                    <a className="wa" href={`https://wa.me/?text=${encodeURIComponent(shareText)}`} target="_blank" rel="noopener noreferrer">Share link on WhatsApp</a>
                    {canShare
                      ? <button type="button" onClick={() => navigator.share({ title: 'KleanKickx', text: shareText, url: link }).catch(() => {})}>More options</button>
                      : <button type="button" onClick={copyLink}>{copied === 'link' ? 'Copied' : 'Copy link'}</button>}
                  </div>

                  {code && (
                    <>
                      <p className="kkrf-label">Or share your code<span>Friends enter it when they sign up</span></p>
                      <div className="kkrf-codebox">
                        <code aria-label={`Referral code ${code}`}>{code}</code>
                        <div>
                          <button type="button" onClick={() => copy('code')} aria-live="polite">{copied === 'code' ? 'Copied' : 'Copy code'}</button>
                          <button type="button" onClick={shareCode}>Share code</button>
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}
            </motion.section>

            <section className="kkac-card" aria-labelledby="kkrf-how-h">
              <div className="kkac-card-head"><h2 id="kkrf-how-h">How it works</h2></div>
              <ol className="kkrf-steps">
                <li><span className="n">01</span><b>Share</b><p>Send your link to friends who wear sneakers.</p></li>
                <li><span className="n">02</span><b>They book</b><p>They sign up with it and complete their first order.</p></li>
                <li><span className="n">03</span><b>You save</b><p>You get {POINTS_PER_REFERRAL} points each. Every {MIN_REDEEM} points becomes a discount on your next order.</p></li>
              </ol>
            </section>

            <section className="kkac-card" aria-labelledby="kkrf-friends-h">
              <div className="kkac-card-head">
                <h2 id="kkrf-friends-h">Your referrals</h2>
                <span>{referrals.length} invited · {done} ordered</span>
              </div>
              {loading ? <div className="kkac-skel" style={{ height: 140 }} /> : referrals.length === 0 ? (
                <div className="kkrf-empty"><b>No referrals yet</b>Share your link to get started.</div>
              ) : (
                <ul className="kkrf-list">
                  {referrals.map((r, i) => (
                    <li key={i}>
                      <span className="kkrf-ini" aria-hidden="true">{(r.referred_email || '?')[0].toUpperCase()}</span>
                      <span className="kkrf-who"><b>{r.referred_email}</b><small>Joined {fmtDate(r.created_at)}</small></span>
                      <span className={`kkac-tag ${r.first_order_completed ? 'ok' : 'wait'}`}>{r.first_order_completed ? 'Ordered' : 'Not yet'}</span>
                      <span className={`kkrf-plus ${r.first_order_completed ? '' : 'off'}`}>{r.first_order_completed ? `+${POINTS_PER_REFERRAL}` : '0'}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <aside className="kkac-col">
            <section className="kkac-card" aria-labelledby="kkrf-pts-h">
              <div className="kkac-card-head"><h2 id="kkrf-pts-h">Your points</h2></div>
              <p className="kkrf-big">{loading ? '—' : points}<small>/ {MIN_REDEEM}</small></p>
              <div className="kkrf-meter" aria-hidden="true">
                <span><i style={{ transform: `scaleX(${Math.min(1, progress * 2)})` }} /></span>
                <span><i style={{ transform: `scaleX(${Math.max(0, progress * 2 - 1)})` }} /></span>
              </div>
              <p className="kkac-help">
                {needed > 0
                  ? `${needed} more points to redeem: ${Math.ceil(needed / POINTS_PER_REFERRAL)} more friend${Math.ceil(needed / POINTS_PER_REFERRAL) === 1 ? '' : 's'} ordering.`
                  : `Ready to redeem. Every ${MIN_REDEEM} points becomes a discount on your next order${points % MIN_REDEEM ? `; the other ${points % MIN_REDEEM} stay in your account` : ''}.`}
              </p>
              <button type="button" className="kkac-btn go" style={{ width: '100%', marginTop: 16 }} onClick={redeemPoints} disabled={redeeming || points < MIN_REDEEM}>
                {redeeming ? <><span className="kkac-spin" aria-hidden="true" /> Redeeming…</> : points >= MIN_REDEEM ? <>Redeem {Math.floor(points / MIN_REDEEM) * MIN_REDEEM} points <span className="ar" aria-hidden="true">→</span></> : `Redeem from ${MIN_REDEEM} points`}
              </button>
              {activeDiscount && (
                <div className="kkrf-disc">
                  <b>{pct(activeDiscount.percentage)} off</b>
                  <span>Ready to use. It's applied automatically at your next checkout.</span>
                </div>
              )}
              {activeDiscount && <Link to="/services" className="kkac-btn" style={{ width: '100%', marginTop: 10 }}>Book a Klean</Link>}
            </section>

            <section className="kkac-card" aria-labelledby="kkrf-hist-h">
              <div className="kkac-card-head"><h2 id="kkrf-hist-h">Redeemed</h2></div>
              {loading ? <div className="kkac-skel" style={{ height: 80 }} /> : history.length === 0 ? (
                <p className="kkac-help">Nothing redeemed yet.</p>
              ) : (
                <dl className="kkac-list">
                  {history.map((h) => (
                    <div key={h.id}>
                      <dt>{fmtDate(h.created_at)} · {h.points_redeemed} pts</dt>
                      <dd>{pct(h.discount_value)} <span className={`kkac-tag ${h.is_applied ? 'ok' : 'wait'}`} style={{ marginLeft: 6 }}>{h.is_applied ? 'Used' : 'Ready'}</span></dd>
                    </div>
                  ))}
                </dl>
              )}
            </section>
          </aside>
        </div>
      </div>
      <Footer />
    </div>
  );
}
