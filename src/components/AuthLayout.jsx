// src/components/AuthLayout.jsx
// Shared shell for Login and Register in the site's editorial style: a dark brand
// panel with the before/after photo and why to sign up, and the form on paper.
// On phones the brand panel becomes a short strip above the form.
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

const SWIFT = [0.77, 0, 0.18, 1];
const PERKS = [
  'Your first Standard Klean is free',
  'Pickup and delivery across Accra',
  'Pay by Mobile Money or card',
];

export const AuthStyles = () => (
  <style>{`
    .kka{--ink:#0A0B0A;--paper:#F7F9F6;--card:#fff;--line:#D9DFD7;--muted:#4D564C;--green:#1A7A1A;--green-hi:#4CB84C;--red:#B42318;
      --display:"Anton","Arial Narrow",Impact,sans-serif;--body:"League Spartan",system-ui,sans-serif;--spring:cubic-bezier(.2,1.25,.3,1);
      min-height:100vh;display:grid;grid-template-columns:minmax(0,46fr) minmax(0,54fr);background:var(--paper);color:var(--ink);font-family:var(--body)}
    .kka-brand{position:relative;overflow:hidden;background:#0B0D0B;color:#F2F5F0;display:flex;flex-direction:column;justify-content:space-between;padding:36px 44px}
    .kka-brand-img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 30%;opacity:.42;filter:grayscale(.2)}
    .kka-brand::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(11,13,11,.55) 0%,rgba(11,13,11,.2) 35%,rgba(11,13,11,.92) 100%)}
    .kka-brand > :not(.kka-brand-img){position:relative;z-index:1}
    .kka-logo{font-family:var(--display);font-size:30px;letter-spacing:.01em;color:#fff;text-decoration:none;line-height:1}
    .kka-logo b{font-weight:400;color:var(--green-hi)}
    .kka-brand h2{margin:0;font-family:var(--display);font-weight:400;text-transform:uppercase;font-size:clamp(52px,6vw,92px);line-height:.9;max-width:9ch}
    .kka-perks{list-style:none;margin:26px 0 0;padding:0;display:grid;gap:12px}
    .kka-perks li{display:flex;align-items:center;gap:12px;font-size:17px;color:#DDE3DB}
    .kka-perks li span{flex:none;width:22px;height:22px;display:grid;place-items:center;background:var(--green);color:#fff}
    .kka-brand small{font-size:13px;color:#A3AEA1;letter-spacing:.04em}
    .kka-main{display:flex;align-items:center;justify-content:center;padding:48px 24px}
    .kka-form{width:100%;max-width:440px}
    .kka-eyebrow{margin:0;font-size:12px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:var(--green)}
    .kka-title{margin:6px 0 0;font-family:var(--display);font-weight:400;text-transform:uppercase;font-size:56px;line-height:.9}
    .kka-sub{margin:12px 0 26px;color:var(--muted);font-size:16px;line-height:1.5}
    .kka-note{display:flex;gap:10px;align-items:flex-start;padding:12px 14px;margin:0 0 18px;font-size:14px;line-height:1.45;border-left:3px solid var(--green);background:#E6F0E4;color:#164D16}
    .kka-note.warn{border-color:#B7791F;background:#FDF5E6;color:#6B4A12}
    .kka-note.err{border-color:var(--red);background:#FDECEA;color:#7A1A12}
    .kka-note a,.kka-note button{color:inherit;font-weight:700;text-decoration:underline;text-underline-offset:3px;background:none;border:0;padding:0;font:inherit;cursor:pointer}
    .kka-grid2{display:grid;grid-template-columns:1fr 1fr;gap:14px}
    .kka-field{display:flex;flex-direction:column;gap:7px;margin-bottom:16px}
    .kka-field label{display:flex;justify-content:space-between;align-items:baseline;font-size:12px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:var(--ink)}
    .kka-field label i{font-style:normal;font-weight:500;letter-spacing:.04em;text-transform:none;color:var(--muted)}
    .kka-input{position:relative}
    .kka-input input{width:100%;height:52px;padding:0 14px;border:1.5px solid var(--line);border-radius:2px;background:var(--card);color:var(--ink);
      font:inherit;font-size:16px;outline:none;transition:border-color .2s,box-shadow .2s}
    .kka-input input::placeholder{color:#9AA39A}
    .kka-input input:focus{border-color:var(--ink);box-shadow:0 3px 0 0 var(--green)}
    .kka-input input:disabled{background:#F0F3EF;color:var(--muted)}
    .kka-input input[aria-invalid="true"]{border-color:var(--red)}
    .kka-input .eye{position:absolute;right:6px;top:50%;transform:translateY(-50%);width:40px;height:40px;display:grid;place-items:center;border:0;background:none;color:var(--muted);cursor:pointer}
    .kka-input .eye:hover{color:var(--ink)}
    .kka-input .eye svg{width:22px;height:22px}
    .kka-field.pw input{padding-right:52px}
    .kka-hint{margin:0;font-size:13px;color:var(--muted);display:flex;align-items:center;gap:8px}
    .kka-hint.ok{color:var(--green)}
    .kka-hint .dot{width:15px;height:15px;border-radius:50%;display:grid;place-items:center;border:1.5px solid currentColor;font-size:9px;line-height:1;transition:background .2s}
    .kka-hint.ok .dot{background:var(--green);border-color:var(--green);color:#fff}
    .kka-link{border:0;background:none;padding:0;font:inherit;font-size:14px;font-weight:600;color:var(--ink);text-decoration:underline;text-underline-offset:3px;cursor:pointer}
    .kka-link:hover{color:var(--green)}
    .kka-btn{width:100%;display:inline-flex;align-items:center;justify-content:center;gap:10px;height:54px;border:2px solid var(--green);border-radius:2px;
      background:var(--green);color:#fff;font:inherit;font-size:16px;font-weight:700;cursor:pointer;transition:background .2s,border-color .2s,transform .25s var(--spring)}
    .kka-btn .ar{transition:transform .3s var(--spring)}
    .kka-btn:hover:not(:disabled){background:var(--ink);border-color:var(--ink)}
    .kka-btn:hover:not(:disabled) .ar{transform:translateX(5px)}
    .kka-btn:active:not(:disabled){transform:scale(.98)}
    .kka-btn:disabled{opacity:.6;cursor:default}
    .kka-btn:focus-visible,.kka-link:focus-visible{outline:2px solid var(--green);outline-offset:3px}
    .kka-spin{width:18px;height:18px;border-radius:50%;border:2.5px solid rgba(255,255,255,.35);border-top-color:#fff;animation:kkaSpin .8s linear infinite}
    @keyframes kkaSpin{to{transform:rotate(360deg)}}
    .kka-or{display:flex;align-items:center;gap:14px;margin:24px 0;font-size:12px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:var(--muted)}
    .kka-or::before,.kka-or::after{content:"";flex:1;height:1px;background:var(--line)}
    .kka-google{display:flex;justify-content:center;min-height:44px;max-width:100%;overflow:hidden}
    .kka-main,.kka-form{min-width:0}
    .kka-switch{margin:24px 0 0;padding-top:20px;border-top:2px solid var(--ink);display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;font-size:15px}
    .kka-switch a{font-weight:700;color:var(--ink);text-decoration:none;display:inline-flex;align-items:center;gap:6px}
    .kka-switch a:hover{color:var(--green)}
    .kka-legal{margin:16px 0 0;font-size:12.5px;color:var(--muted);line-height:1.5}
    .kka-legal a{color:inherit;text-decoration:underline;text-underline-offset:2px}
    @media (max-width:900px){
      .kka{grid-template-columns:1fr}
      .kka-brand{min-height:220px;padding:66px 20px 22px;justify-content:flex-end;gap:14px}
      .kka-brand .kka-logo{position:absolute;top:20px;left:20px}
      .kka-brand h2{font-size:48px}
      .kka-perks,.kka-brand small{display:none}
      .kka-main{padding:28px 20px 48px;align-items:flex-start}
      .kka-title{font-size:46px}
    }
    @media (max-width:420px){.kka-grid2{grid-template-columns:1fr;gap:0}}
  `}</style>
);

/** A labelled input. `type="password"` gets a show/hide button. */
export const Field = ({ id, label, optional, hint, type = 'text', invalid, children, ...input }) => {
  const [show, setShow] = useState(false);
  const isPw = type === 'password';
  return (
    <div className={`kka-field ${isPw ? 'pw' : ''}`}>
      <label htmlFor={id}>{label}{optional && <i>Optional</i>}{children}</label>
      <div className="kka-input">
        <input id={id} type={isPw && show ? 'text' : type} aria-invalid={invalid ? 'true' : undefined} {...input} />
        {isPw && (
          <button type="button" className="eye" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'}>
            {show ? <EyeSlashIcon /> : <EyeIcon />}
          </button>
        )}
      </div>
      {hint}
    </div>
  );
};

/** Google's button needs a pixel width; fit it to the form on small screens. */
export const useGoogleWidth = () => {
  const calc = () => (typeof window === 'undefined' ? 360 : Math.max(220, Math.min(400, window.innerWidth - 40)));
  const [w, setW] = useState(calc);
  useEffect(() => {
    const onResize = () => setW(calc());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return String(w);
};

export const SubmitButton = ({ busy, busyLabel, children }) => (
  <button type="submit" className="kka-btn" disabled={busy}>
    {busy ? <><span className="kka-spin" aria-hidden="true" /> {busyLabel}</> : <>{children} <span className="ar" aria-hidden="true">→</span></>}
  </button>
);

export default function AuthLayout({ headline, eyebrow, title, subtitle, children }) {
  const reduce = useReducedMotion();
  const rise = (delay) => (reduce ? {} : { initial: { opacity: 0, y: 18 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.6, ease: SWIFT, delay } });
  return (
    <div className="kka">
      <AuthStyles />
      <aside className="kka-brand" aria-hidden="false">
        <img className="kka-brand-img" src="/images/before-after.jpg" alt="" />
        <Link to="/" className="kka-logo" aria-label="KleanKickx home">KLEANKICK<b>X</b></Link>
        <div>
          <motion.h2 {...rise(0.05)}>{headline}</motion.h2>
          <ul className="kka-perks">
            {PERKS.map((p, i) => (
              <motion.li key={p} {...rise(0.15 + i * 0.07)}>
                <span aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="12" height="12"><path d="M5 12.5l4.2 4.2L19 7" fill="none" stroke="currentColor" strokeWidth="3.2" /></svg>
                </span>
                {p}
              </motion.li>
            ))}
          </ul>
        </div>
        <small>29 Golf Hills St, Accra · Sneaker care since 2020</small>
      </aside>
      <main className="kka-main">
        <motion.div className="kka-form" {...rise(0.1)}>
          <p className="kka-eyebrow">{eyebrow}</p>
          <h1 className="kka-title">{title}</h1>
          {subtitle && <p className="kka-sub">{subtitle}</p>}
          {children}
        </motion.div>
      </main>
    </div>
  );
}

/** First useful message from a DRF error response. */
export const apiError = (err, fallback) => {
  const data = err?.response?.data;
  if (!err?.response) return 'Network error. Check your connection and try again.';
  if (typeof data === 'string') return fallback;
  const first = data?.error || data?.detail || data?.message
    || Object.values(data || {}).flat().find((v) => typeof v === 'string');
  return first || fallback;
};
