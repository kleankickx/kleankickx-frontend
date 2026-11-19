// src/pages/Promotions.jsx
// Public promotions. They apply automatically at checkout (no code), so the
// page sells the offer and sends people to book; partner codes are typed at checkout.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';

const CSS = `
  .kkpm{--ink:#0A0B0A;--paper:#F7F9F6;--line:#D9DFD7;--muted:#4D564C;--green:#1A7A1A;--tint:#E9F4E7;--red:#B42318;
    --display:"Anton","Arial Narrow",Impact,sans-serif;--spring:cubic-bezier(.2,1.25,.3,1);--swift:cubic-bezier(.77,0,.18,1);
    min-height:70vh;background:var(--paper);color:var(--ink);font-family:"League Spartan",system-ui,sans-serif;padding:56px 0 96px}
  .kkpm-wrap{max-width:1180px;margin:0 auto;padding:0 24px}
  .kkpm-eyebrow{margin:0;font-size:12px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:var(--green)}
  .kkpm-h1{margin:10px 0 0;font-family:var(--display);font-weight:400;font-size:clamp(56px,9vw,112px);line-height:.88;text-transform:uppercase;letter-spacing:-.01em}
  .kkpm-lede{max-width:560px;margin:18px 0 0;font-size:18px;line-height:1.5;color:var(--muted)}
  .kkpm-lede b{color:var(--ink)}
  .kkpm-rule{height:2px;margin:36px 0 0;background:var(--ink)}

  .kkpm-sec{margin-top:48px}
  .kkpm-sechead{display:flex;align-items:baseline;justify-content:space-between;gap:16px;margin-bottom:18px}
  .kkpm-sechead h2{margin:0;font-family:var(--display);font-weight:400;font-size:32px;line-height:1;text-transform:uppercase}
  .kkpm-sechead span{font-size:13px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--muted)}
  .kkpm-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,360px),1fr));gap:24px;align-items:start}

  .kkpm-card{display:flex;flex-direction:column;background:#fff;border:2px solid var(--ink);
    animation:kkpmIn .6s var(--swift) both;animation-delay:calc(var(--i,0) * 80ms)}
  @keyframes kkpmIn{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
  .kkpm-img{display:block;width:100%;aspect-ratio:16/10;object-fit:cover;background:var(--tint);border-bottom:2px solid var(--ink)}

  /* Ticket: green stub with the percentage, perforation, details */
  .kkpm-tix{--stub:112px;position:relative;flex:1;display:grid;grid-template-columns:var(--stub) 1fr;background:var(--tint)}
  .kkpm-tix::before,.kkpm-tix::after{content:"";position:absolute;left:calc(var(--stub) - 10px);width:20px;height:20px;border-radius:50%;
    background:var(--paper);border:2px solid var(--ink);z-index:1}
  .kkpm-tix::before{top:-12px}
  .kkpm-tix::after{bottom:-12px}
  .kkpm-card:has(.kkpm-img) .kkpm-tix::before{display:none}
  .kkpm-stub{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;padding:22px 8px;background:var(--green);color:#fff;text-align:center}
  .kkpm-stub .amt{font-family:var(--display);font-size:52px;line-height:.85}
  .kkpm-stub .amt i{font-style:normal;font-size:.5em;vertical-align:.7em;margin-left:2px}
  .kkpm-stub .off{font-size:12px;font-weight:800;letter-spacing:.3em;margin-right:-.3em}
  .kkpm-body{display:flex;flex-direction:column;min-width:0;padding:20px 20px 20px 24px;border-left:2px dashed rgba(26,122,26,.45)}
  .kkpm-tag{align-self:flex-start;display:inline-flex;align-items:center;gap:7px;padding:4px 8px;background:#fff;border:1.5px solid var(--green);
    font-size:11px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:var(--green)}
  .kkpm-tag.soon{border-color:var(--ink);color:var(--ink)}
  .kkpm-tag .dot{width:7px;height:7px;border-radius:50%;background:currentColor;animation:kkpmPulse 1.6s ease-in-out infinite}
  @keyframes kkpmPulse{50%{opacity:.25}}
  .kkpm-body h3{margin:12px 0 0;font-family:var(--display);font-weight:400;font-size:28px;line-height:1;text-transform:uppercase;overflow-wrap:anywhere}
  .kkpm-body p{margin:8px 0 0;font-size:15px;line-height:1.5;color:var(--muted)}
  .kkpm-when{margin-top:12px;font-size:13px;font-weight:700;color:var(--ink)}
  .kkpm-when span{font-weight:500;color:var(--muted)}
  .kkpm-go{margin-top:auto;padding-top:18px}
  .kkpm-btn{display:inline-flex;align-items:center;gap:10px;height:46px;padding:0 20px;border:2px solid var(--ink);background:var(--ink);color:#fff;
    font:inherit;font-size:15px;font-weight:700;text-decoration:none;cursor:pointer;transition:background .2s,border-color .2s}
  .kkpm-btn::after{content:"→";transition:transform .3s var(--spring)}
  .kkpm-btn:hover{background:var(--green);border-color:var(--green)}
  .kkpm-btn:hover::after{transform:translateX(4px)}
  .kkpm-btn.ghost{background:transparent;color:var(--ink)}
  .kkpm-btn.ghost:hover{background:var(--ink);color:#fff;border-color:var(--ink)}
  .kkpm-auto{display:block;margin-top:10px;font-size:12px;font-weight:700;letter-spacing:.06em;color:var(--green)}

  /* Partner-code note */
  .kkpm-code{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:18px;margin-top:56px;padding:22px 24px;border:2px solid var(--ink);background:#fff}
  .kkpm-code .ic{width:48px;height:48px;display:grid;place-items:center;background:var(--ink);color:#fff}
  .kkpm-code b{display:block;font-size:17px}
  .kkpm-code p{margin:4px 0 0;font-size:15px;color:var(--muted);line-height:1.45}

  /* Empty / error */
  .kkpm-empty{margin-top:48px;padding:48px 28px;border:2px dashed var(--line);background:#fff;text-align:center}
  .kkpm-empty h2{margin:0;font-family:var(--display);font-weight:400;font-size:40px;line-height:1;text-transform:uppercase}
  .kkpm-empty p{max-width:460px;margin:12px auto 0;font-size:16px;line-height:1.5;color:var(--muted)}
  .kkpm-empty .row{display:flex;flex-wrap:wrap;justify-content:center;gap:10px;margin-top:22px}
  .kkpm-empty.err{border-color:var(--red)}

  /* Loading */
  .kkpm-skel{height:300px;border:2px solid var(--line);background:linear-gradient(90deg,#fff 0%,#EEF2EC 50%,#fff 100%);background-size:200% 100%;animation:kkpmShim 1.3s linear infinite}
  @keyframes kkpmShim{to{background-position:-200% 0}}

  .kkpm a:focus-visible,.kkpm button:focus-visible{outline:2px solid var(--green);outline-offset:3px}
  @media (max-width:560px){
    .kkpm{padding:36px 0 72px}.kkpm-wrap{padding:0 16px}
    .kkpm-tix{--stub:88px}.kkpm-stub .amt{font-size:40px}.kkpm-body{padding:16px 16px 18px 18px}.kkpm-body h3{font-size:24px}
    .kkpm-code{grid-template-columns:auto 1fr;padding:18px}.kkpm-code .kkpm-btn{grid-column:1/-1;justify-content:center}
  }
  @media (prefers-reduced-motion:reduce){.kkpm-card,.kkpm-tag .dot,.kkpm-skel{animation:none}}
`;

const DAY = 86400000;
const fmt = (d) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

/** "Ends today", "Ends tomorrow", "Ends in 3 days" / "Starts Mon 24 Nov" */
function timing(promo, now) {
  const start = new Date(promo.start_date);
  const end = new Date(promo.end_date);
  if (start > now) {
    const days = Math.ceil((start - now) / DAY);
    return { live: false, label: days <= 1 ? 'Starts tomorrow' : `Starts ${fmt(start)}`, range: `${fmt(start)} – ${fmt(end)}` };
  }
  const left = Math.ceil((end - now) / DAY);
  const label = end - now < DAY && end.getDate() === now.getDate() ? 'Ends today'
    : left <= 1 ? 'Ends tomorrow'
    : left <= 14 ? `Ends in ${left} days`
    : `Until ${fmt(end)}`;
  return { live: true, label, range: `Until ${end.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}` };
}

function PromoCard({ promo, now, index, onBook }) {
  const pct = Math.round(Number(promo.discount_percentage) || 0);
  const t = timing(promo, now);
  return (
    <article className="kkpm-card" style={{ '--i': index }} aria-label={`${promo.name}, ${pct}% off`}>
      {promo.image && <img className="kkpm-img" src={promo.image} alt="" loading="lazy" />}
      <div className="kkpm-tix">
        <div className="kkpm-stub" aria-hidden="true">
          <span className="amt">{pct}<i>%</i></span>
          <span className="off">OFF</span>
        </div>
        <div className="kkpm-body">
          <span className={`kkpm-tag ${t.live ? '' : 'soon'}`}>
            {t.live && <span className="dot" aria-hidden="true" />}
            {t.label}
          </span>
          <h3>{promo.name}</h3>
          {promo.description && <p>{promo.description}</p>}
          <div className="kkpm-when">{t.live ? 'On now' : 'Coming up'} <span>· {t.range}</span></div>
          <div className="kkpm-go">
            {t.live ? (
              <>
                <button type="button" className="kkpm-btn" onClick={onBook}>Book a Klean</button>
                <span className="kkpm-auto">✓ Applied automatically at checkout</span>
              </>
            ) : (
              <span className="kkpm-auto" style={{ color: 'var(--muted)' }}>Applies automatically once it starts</span>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

export default function Promotions() {
  const navigate = useNavigate();
  const [promotions, setPromotions] = useState(null); // null = loading
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setError(false);
    setPromotions(null);
    try {
      const { data } = await api.get('/api/promotions/');
      setPromotions(Array.isArray(data) ? data : []);
    } catch {
      setError(true);
      setPromotions([]);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { document.title = 'Promotions | KleanKickx'; }, []);

  const now = useMemo(() => new Date(), [promotions]);
  const { live, soon } = useMemo(() => {
    const list = (promotions || []).filter((p) => new Date(p.end_date) > now);
    const byEnd = (a, b) => new Date(a.end_date) - new Date(b.end_date);
    const byStart = (a, b) => new Date(a.start_date) - new Date(b.start_date);
    return {
      live: list.filter((p) => new Date(p.start_date) <= now).sort(byEnd),
      soon: list.filter((p) => new Date(p.start_date) > now).sort(byStart),
    };
  }, [promotions, now]);

  const book = () => navigate('/#services');

  return (
    <main className="kkpm">
      <style>{CSS}</style>
      <div className="kkpm-wrap">
        <p className="kkpm-eyebrow">Offers</p>
        <h1 className="kkpm-h1">Promotions</h1>
        <p className="kkpm-lede">
          What&apos;s on right now. <b>No code needed:</b> the discount comes off automatically when you check out.
        </p>
        <div className="kkpm-rule" />

        {promotions === null ? (
          <div className="kkpm-sec">
            <div className="kkpm-grid" aria-busy="true" aria-label="Loading promotions">
              {[0, 1, 2].map((i) => <div key={i} className="kkpm-skel" />)}
            </div>
          </div>
        ) : error ? (
          <div className="kkpm-empty err" role="alert">
            <h2>Couldn&apos;t load offers</h2>
            <p>Check your connection and try again.</p>
            <div className="row"><button type="button" className="kkpm-btn" onClick={load}>Try again</button></div>
          </div>
        ) : live.length === 0 && soon.length === 0 ? (
          <div className="kkpm-empty">
            <h2>Nothing on right now</h2>
            <p>New offers land here first. Meanwhile, invite a friend and you both earn points toward your next Klean.</p>
            <div className="row">
              <button type="button" className="kkpm-btn" onClick={book}>Book a Klean</button>
              <Link to="/referral-dashboard" className="kkpm-btn ghost">Invite a friend</Link>
            </div>
          </div>
        ) : (
          <>
            {live.length > 0 && (
              <section className="kkpm-sec" aria-labelledby="kkpm-live">
                <div className="kkpm-sechead">
                  <h2 id="kkpm-live">On now</h2>
                  <span>{String(live.length).padStart(2, '0')} {live.length === 1 ? 'offer' : 'offers'}</span>
                </div>
                <div className="kkpm-grid">
                  {live.map((p, i) => <PromoCard key={p.id} promo={p} now={now} index={i} onBook={book} />)}
                </div>
              </section>
            )}
            {soon.length > 0 && (
              <section className="kkpm-sec" aria-labelledby="kkpm-soon">
                <div className="kkpm-sechead">
                  <h2 id="kkpm-soon">Coming up</h2>
                  <span>{String(soon.length).padStart(2, '0')} {soon.length === 1 ? 'offer' : 'offers'}</span>
                </div>
                <div className="kkpm-grid">
                  {soon.map((p, i) => <PromoCard key={p.id} promo={p} now={now} index={i} onBook={book} />)}
                </div>
              </section>
            )}
          </>
        )}

        {promotions !== null && !error && (
          <aside className="kkpm-code">
            <span className="ic" aria-hidden="true">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
                <path d="M3 7h18v3a2 2 0 0 0 0 4v3H3v-3a2 2 0 0 0 0-4V7z" /><path d="M14 7v10" strokeDasharray="2 2" />
              </svg>
            </span>
            <div>
              <b>Got a code from a partner?</b>
              <p>Enter it at checkout under &ldquo;Have a promo code?&rdquo;. If you opened a link with a code, we&apos;ve saved it for you.</p>
            </div>
            <button type="button" className="kkpm-btn ghost" onClick={book}>Start booking</button>
          </aside>
        )}
      </div>
    </main>
  );
}
