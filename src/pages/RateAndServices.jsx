// src/pages/RateAndServices.jsx
// Prices: every service on one list, how a booking works, and what we clean.
import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AuthContext } from '../context/AuthContext';
import useQuickAdd from '../hooks/useQuickAdd';
import api from '../api';
import Footer from '../components/Footer';

const ease = [0.77, 0, 0.18, 1];
const isPriority = (name = '') => /priority|express|rush/i.test(name);
const isBundle = (s) => s?.service_type?.startsWith('PACKAGE_');

const STEPS = [
  ['Book', 'Add your Klean to the cart and pick pickup or drop-off at checkout. Pay by Mobile Money or card.'],
  ['Pickup', 'Our courier calls on the day and collects your pair from your door.'],
  ['Klean', 'Cleaned by hand: the right brush, product and drying for each material.'],
  ['Back to you', 'Delivered clean, usually within 72 hours. Priority comes back the next day.'],
];
const MATERIALS = ['Canvas', 'Leather', 'Suede & nubuck', 'Mesh & knit', 'High-tops', 'Limited editions'];

const RateAndServices = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user, isAuthenticated } = useContext(AuthContext);
  const { quickAdd, addingId } = useQuickAdd();

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/api/services/public/');
      const list = (Array.isArray(data) ? data : []).slice().sort((a, b) => {
        if (a.is_free_signup_service !== b.is_free_signup_service) return a.is_free_signup_service ? -1 : 1;
        if (isBundle(a) !== isBundle(b)) return isBundle(a) ? 1 : -1;
        return Number(a.price) - Number(b.price);
      });
      setServices(list);
    } catch (err) {
      console.error('Error fetching services:', err);
      setError("We couldn't load prices.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const freeClaimed = isAuthenticated && user?.free_signup_service_used;
  const singles = services.filter((s) => !isBundle(s));
  const bundles = services.filter(isBundle);

  const Row = ({ s }) => {
    const free = s.is_free_signup_service && !freeClaimed;
    const pairs = Number(s.included_quantity) || 1;
    return (
      <li className="kkpr-row">
        <div className="kkpr-name">
          <b>{s.name}</b>
          {s.description && <span>{s.description}</span>}
        </div>
        <span className={`kkpr-time ${isPriority(s.name) ? 'fast' : ''}`}>{isPriority(s.name) ? 'Next day' : '72 hours'}</span>
        <div className="kkpr-price">
          {free ? <><strong>Free</strong><small>first Klean</small></>
            : <><strong>₵{Number(s.price).toLocaleString('en-GH')}</strong><small>{isBundle(s) ? `${pairs} pairs · ₵${(Number(s.price) / pairs).toFixed(0)} each` : 'per pair'}</small></>}
        </div>
        <button type="button" className="kkpr-add" onClick={() => quickAdd(s)} disabled={addingId === s.id} aria-label={`Add ${s.name} to cart`}>
          {addingId === s.id ? 'Adding…' : <>Add <span className="ar" aria-hidden="true">+</span></>}
        </button>
      </li>
    );
  };

  return (
    <div className="kkpr">
      <style>{`
        .kkpr{--ink:#0A0B0A;--paper:#F7F9F6;--line:#D9DFD7;--muted:#4D564C;--green:#1A7A1A;--tint:#E9F4E7;
          --display:"Anton","Arial Narrow",Impact,sans-serif;--spring:cubic-bezier(.2,1.25,.3,1);
          background:var(--paper);color:var(--ink);font-family:"League Spartan",system-ui,sans-serif;min-height:100vh}
        .kkpr-wrap{max-width:1200px;margin:0 auto;padding:0 20px 72px}
        .kkpr-eyebrow{margin:0;font-size:12px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:var(--green)}
        .kkpr-hero{padding:48px 0 26px;border-bottom:2px solid var(--ink)}
        .kkpr-hero h1{margin:8px 0 0;font-family:var(--display);font-weight:400;text-transform:uppercase;font-size:clamp(56px,9vw,120px);line-height:.88}
        .kkpr-hero p.sub{margin:14px 0 0;max-width:50ch;color:var(--muted);font-size:18px;line-height:1.5}
        .kkpr-sec{margin-top:40px}
        .kkpr-head{display:flex;justify-content:space-between;align-items:baseline;gap:12px;padding-bottom:12px;border-bottom:2px solid var(--ink)}
        .kkpr-head h2{margin:0;font-family:var(--display);font-weight:400;text-transform:uppercase;font-size:clamp(30px,4vw,44px);line-height:1}
        .kkpr-head span{font-size:13px;color:var(--muted)}
        .kkpr-list{list-style:none;margin:0;padding:0}
        .kkpr-row{display:grid;grid-template-columns:minmax(0,1fr) 110px 190px 96px;align-items:center;gap:18px;padding:18px 0;border-bottom:1px solid var(--line)}
        .kkpr-name b{display:block;font-family:var(--display);font-weight:400;text-transform:uppercase;font-size:26px;line-height:1}
        .kkpr-name span{display:block;margin-top:6px;color:var(--muted);font-size:14.5px;line-height:1.45;max-width:60ch;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
        .kkpr-time{display:inline-flex;align-items:center;gap:8px;font-size:12px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:var(--muted)}
        .kkpr-time::before{content:"";width:8px;height:8px;border-radius:50%;background:var(--green)}
        .kkpr-time.fast::before{background:#E08A00}
        .kkpr-price{text-align:right}
        .kkpr-price strong{display:block;font-family:var(--display);font-weight:400;font-size:38px;line-height:1;font-variant-numeric:tabular-nums}
        .kkpr-price small{display:block;margin-top:4px;font-size:12.5px;color:var(--muted)}
        .kkpr-add{height:44px;border:2px solid var(--ink);border-radius:2px;background:transparent;color:var(--ink);font:inherit;font-size:14px;font-weight:700;cursor:pointer;
          transition:background .2s,color .2s,border-color .2s}
        .kkpr-add .ar{display:inline-block;margin-left:4px;transition:transform .3s var(--spring)}
        .kkpr-add:hover:not(:disabled){background:var(--green);border-color:var(--green);color:#fff}
        .kkpr-add:hover:not(:disabled) .ar{transform:rotate(90deg)}
        .kkpr-add:disabled{opacity:.5;cursor:default}
        .kkpr :focus-visible{outline:2px solid var(--green);outline-offset:3px}
        .kkpr-skel{height:86px;border-bottom:1px solid var(--line);background:linear-gradient(90deg,transparent 0%,rgba(217,223,215,.6) 50%,transparent 100%);background-size:200% 100%;animation:kkprShim 1.3s linear infinite}
        @keyframes kkprShim{to{background-position:-200% 0}}
        .kkpr-err{margin-top:20px;padding:12px 14px;border-left:3px solid #B42318;background:#FDECEA;color:#7A1A12}
        .kkpr-err button{margin-left:8px;border:0;background:none;font:inherit;font-weight:700;text-decoration:underline;cursor:pointer;color:inherit}
        .kkpr-steps{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(4,1fr)}
        .kkpr-steps li{padding:20px 20px 0 0}
        .kkpr-steps li + li{padding-left:20px;border-left:1px solid var(--line)}
        .kkpr-steps .n{font-family:var(--display);font-size:48px;line-height:1;color:var(--green)}
        .kkpr-steps h3{margin:8px 0 6px;font-family:var(--display);font-weight:400;text-transform:uppercase;font-size:26px}
        .kkpr-steps p{margin:0;color:var(--muted);line-height:1.5;font-size:15px}
        .kkpr-mat{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:28px;align-items:center;margin-top:20px;padding:28px;background:var(--ink);color:#fff}
        .kkpr-mat h2{margin:6px 0 0;font-family:var(--display);font-weight:400;text-transform:uppercase;font-size:clamp(34px,4.6vw,56px);line-height:.92}
        .kkpr-mat p{margin:12px 0 0;color:#C4CCC2;line-height:1.55}
        .kkpr-mat .kkpr-eyebrow{color:#6FD46F}
        .kkpr-mat ul{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:1fr 1fr;gap:8px}
        .kkpr-mat li{padding:14px;border:1px solid rgba(255,255,255,.18);font-weight:700;font-size:15px}
        .kkpr-cta{display:flex;flex-wrap:wrap;gap:10px;margin-top:28px}
        .kkpr-btn{display:inline-flex;align-items:center;justify-content:center;gap:10px;height:52px;padding:0 22px;border:2px solid var(--ink);border-radius:2px;background:transparent;color:var(--ink);
          font:inherit;font-size:15px;font-weight:700;text-decoration:none;transition:background .2s,color .2s,border-color .2s}
        .kkpr-btn .ar{transition:transform .3s var(--spring)}
        .kkpr-btn:hover{background:var(--ink);color:#fff}
        .kkpr-btn:hover .ar{transform:translateX(5px)}
        .kkpr-btn.go{background:var(--green);border-color:var(--green);color:#fff}
        .kkpr-btn.go:hover{background:var(--ink);border-color:var(--ink)}
        @media (max-width:900px){
          .kkpr-row{grid-template-columns:minmax(0,1fr) auto;grid-template-areas:"n p" "t a";row-gap:10px}
          .kkpr-name{grid-area:n}.kkpr-price{grid-area:p}.kkpr-time{grid-area:t}.kkpr-add{grid-area:a;padding:0 18px}
          .kkpr-steps{grid-template-columns:1fr 1fr;row-gap:24px}
          .kkpr-steps li:nth-child(3){padding-left:0;border-left:0}
          .kkpr-mat{grid-template-columns:1fr}
        }
        @media (max-width:560px){
          .kkpr-wrap{padding:0 16px 56px}
          .kkpr-hero{padding:32px 0 20px}
          .kkpr-hero p.sub{font-size:16px}
          .kkpr-name b{font-size:22px}
          .kkpr-price strong{font-size:30px}
          .kkpr-steps{grid-template-columns:1fr}
          .kkpr-steps li,.kkpr-steps li + li{padding:16px 0 0;border-left:0;border-top:1px solid var(--line)}
          .kkpr-mat{padding:20px}
          .kkpr-cta .kkpr-btn{flex:1 1 100%}
        }
        @media (prefers-reduced-motion:reduce){.kkpr-skel{animation:none}}
      `}</style>

      <div className="kkpr-wrap">
        <header className="kkpr-hero">
          <p className="kkpr-eyebrow">Prices</p>
          <h1>Price list</h1>
          <p className="sub">Every Klean is priced per pair, in cedis. Pickup and delivery are quoted at checkout from your address, or free if you drop off at the studio.</p>
        </header>

        {error && <p className="kkpr-err" role="alert">{error}<button type="button" onClick={load}>Try again</button></p>}

        <section className="kkpr-sec" aria-labelledby="kkpr-single">
          <div className="kkpr-head"><h2 id="kkpr-single">Single Kleans</h2><span>Per pair</span></div>
          <ul className="kkpr-list">
            {loading ? [0, 1, 2, 3].map((k) => <li key={k} className="kkpr-skel" aria-hidden="true" />) : singles.map((s) => <Row key={s.id} s={s} />)}
          </ul>
        </section>

        {!loading && bundles.length > 0 && (
          <section className="kkpr-sec" aria-labelledby="kkpr-bundles">
            <div className="kkpr-head"><h2 id="kkpr-bundles">Bundles</h2><span>More pairs, lower price each</span></div>
            <ul className="kkpr-list">{bundles.map((s) => <Row key={s.id} s={s} />)}</ul>
          </section>
        )}

        <section className="kkpr-sec" aria-labelledby="kkpr-how">
          <div className="kkpr-head"><h2 id="kkpr-how">How a booking works</h2></div>
          <motion.ol className="kkpr-steps" initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.5, ease }}>
            {STEPS.map(([t, d], i) => (
              <li key={t}><span className="n">{String(i + 1).padStart(2, '0')}</span><h3>{t}</h3><p>{d}</p></li>
            ))}
          </motion.ol>
        </section>

        <section className="kkpr-mat" aria-labelledby="kkpr-mat-h">
          <div>
            <p className="kkpr-eyebrow">What we clean</p>
            <h2 id="kkpr-mat-h">Every type of sneaker</h2>
            <p>Everyday pairs and limited editions alike. Every pair is cleaned by hand and checked before it goes back to you.</p>
          </div>
          <ul>{MATERIALS.map((m) => <li key={m}>{m}</li>)}</ul>
        </section>

        <div className="kkpr-cta">
          <Link to="/services" className="kkpr-btn go">Book a Klean <span className="ar" aria-hidden="true">→</span></Link>
          <Link to="/vouchers" className="kkpr-btn">Gift a Klean</Link>
          <a className="kkpr-btn" href="https://wa.me/233536278834" target="_blank" rel="noreferrer">Ask on WhatsApp</a>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default RateAndServices;
