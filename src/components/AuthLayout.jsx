// src/components/AuthLayout.jsx
// Shared shell for Login and Register in the site's editorial style: a dark brand
// panel with the before/after photo and why to sign up, and the form on paper.
// On phones the brand panel becomes a short strip above the form.
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
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
    @import url('https://fonts.googleapis.com/css2?family=Bodoni+Moda:opsz,wght@6..96,400&display=swap');
    .kka{--ink:#0A0B0A;--paper:#F7F9F6;--card:#fff;--line:#D9DFD7;--muted:#4D564C;--green:#1A7A1A;--green-hi:#4CB84C;--red:#B42318;
      --display:"Anton","Arial Narrow",Impact,sans-serif;--body:"League Spartan",system-ui,sans-serif;--spring:cubic-bezier(.2,1.25,.3,1);
      min-height:100vh;display:grid;grid-template-columns:minmax(0,46fr) minmax(0,54fr);background:var(--paper);color:var(--ink);font-family:var(--body)}
    .kka-brand{position:relative;overflow:hidden;background:#0B0D0B;color:#F2F5F0;display:flex;flex-direction:column;justify-content:space-between;padding:36px 44px}
    .kka-brand-img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:58% 38%;opacity:.6}
    .kka-brand::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(11,13,11,.5) 0%,rgba(11,13,11,.05) 22%,rgba(11,13,11,.15) 48%,rgba(11,13,11,.94) 74%,rgba(11,13,11,.98) 100%)}
    .kka-brand-copy{margin-top:auto;margin-bottom:22px}
    .kka-brand > :not(.kka-brand-img){position:relative;z-index:1}
    .kka-logo{display:block;line-height:0;align-self:flex-start}
    .kka-logo img{width:150px;height:auto;display:block}
    .kka-brand h2{margin:0;font-family:var(--display);font-weight:400;text-transform:uppercase;font-size:clamp(48px,5.2vw,80px);line-height:.9;max-width:11ch}
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
    .kka-gbtn{display:flex;align-items:center;justify-content:center;gap:12px;width:100%;height:54px;padding:0 18px;border:2px solid var(--ink);border-radius:2px;
      background:#fff;color:var(--ink);font:inherit;font-size:16px;font-weight:700;cursor:pointer;transition:background .2s,box-shadow .25s,transform .25s var(--spring)}
    .kka-gbtn svg{flex:none}
    .kka-gbtn:hover:not(:disabled){background:var(--paper);box-shadow:0 4px 0 0 var(--ink)}
    .kka-gbtn:active:not(:disabled){transform:translateY(2px);box-shadow:0 2px 0 0 var(--ink)}
    .kka-gbtn:disabled{cursor:default;opacity:.7}
    .kka-gbtn:focus-visible{outline:2px solid var(--green);outline-offset:3px}
    .kka-spin.dark{border-color:rgba(10,11,10,.18);border-top-color:var(--ink)}
    .kka-main,.kka-form{min-width:0}
    .kka-switch{margin:24px 0 0;padding-top:20px;border-top:2px solid var(--ink);display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;font-size:15px}
    .kka-switch a{font-weight:700;color:var(--ink);text-decoration:none;display:inline-flex;align-items:center;gap:6px}
    .kka-switch a:hover{color:var(--green)}
    .kka-legal{margin:16px 0 0;font-size:12.5px;color:var(--muted);line-height:1.5}
    .kka-legal a{color:inherit;text-decoration:underline;text-underline-offset:2px}
    @media (max-width:900px){
      .kka{grid-template-columns:1fr}
      .kka-brand{min-height:240px;padding:66px 20px 22px;justify-content:flex-end;gap:14px}
      .kka-brand-copy{margin:0}
      .kka-brand-img{object-position:50% 42%}
      .kka-brand .kka-logo{position:absolute;top:20px;left:20px}
      .kka-brand h2{font-size:48px}
      .kka-perks,.kka-brand small{display:none}
      .kka-main{padding:28px 20px 48px;align-items:flex-start}
      .kka-title{font-size:46px}
    }
    /* Care is respect: the photo fills the top of the panel and fades to black; the
       logo, headline and caption are real text, so it fits any screen without cropping words. */
    .kka-brand.kka-poster{position:sticky;top:0;height:100vh;align-self:start;display:block;padding:0;background:#000}
    .kka-poster .kka-brand-img{position:absolute;left:0;top:0;width:100%;height:74%;object-fit:cover;object-position:52% 40%;opacity:1;
      filter:brightness(1.18) contrast(1.06)}
    /* Light shade behind the logo, and a short fade where the photo meets the black strip */
    .kka-poster::after{content:"";position:absolute;inset:0;pointer-events:none;
      background:linear-gradient(180deg,rgba(0,0,0,.28) 0%,rgba(0,0,0,0) 13%,rgba(0,0,0,0) 62%,#000 74.5%)}
    .kka-brand.kka-poster > .kka-poster-logo{position:absolute;top:32px;left:40px;z-index:2;line-height:0}
    .kka-poster-logo img{width:140px;height:auto;display:block}
    .kka-brand.kka-poster > .kka-poster-copy{position:absolute;left:40px;right:40px;bottom:clamp(20px,3.4vh,32px);z-index:2}
    .kka-brand .kka-poster-h{margin:0;max-width:none;font-family:"Bodoni Moda","Bodoni 72",Didot,"Times New Roman",serif;font-weight:400;text-transform:uppercase;color:#fff;
      font-size:clamp(26px,min(3vw,5vh),48px);line-height:1.08;letter-spacing:.06em}
    .kka-poster-h span{display:block}
    .kka-poster-cap{margin-top:clamp(10px,1.8vh,18px);padding-top:10px;border-top:1px solid rgba(255,255,255,.2);max-width:46ch}
    .kka-poster-cap p{margin:3px 0 0;font-size:12.5px;line-height:1.45;color:#A9B3A7}
    .kka-poster-cap p.n{margin:0;font-family:"Bodoni Moda","Bodoni 72",Didot,"Times New Roman",serif;font-size:15px;letter-spacing:.02em;color:#fff}
    @media (max-width:900px){
      .kka-brand.kka-poster{position:relative;height:300px;min-height:0}
      .kka-poster .kka-brand-img{height:100%;object-position:60% 28%}
      .kka-poster::after{background:linear-gradient(180deg,rgba(0,0,0,.3) 0%,rgba(0,0,0,0) 26%,rgba(0,0,0,0) 62%,rgba(0,0,0,.7) 100%)}
      .kka-brand.kka-poster > .kka-poster-logo{top:18px;left:20px}
      .kka-poster-logo img{width:118px}
      .kka-brand.kka-poster > .kka-poster-copy{left:20px;right:20px;bottom:18px}
      .kka-brand .kka-poster-h{font-size:clamp(20px,6vw,28px);letter-spacing:.05em}
      .kka-poster-h span{display:inline}
      .kka-poster-cap{display:none}
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

/** Our own "Continue with Google" button (Google's popup flow). Calls onToken with
 *  { access_token }, which AuthContext.googleLogin sends to the API. Keeps Google's
 *  coloured G, as their branding rules require for custom buttons. */
export const GoogleButton = ({ label = 'Continue with Google', onToken, onError, disabled }) => {
  const [opening, setOpening] = useState(false);
  const start = useGoogleLogin({
    flow: 'implicit',
    scope: 'openid email profile',
    onSuccess: async (res) => {
      try { await onToken({ access_token: res.access_token }); } finally { setOpening(false); }
    },
    onError: () => { setOpening(false); onError?.('Google sign-in failed. Please try again.'); },
    onNonOAuthError: (err) => {
      setOpening(false);
      if (err?.type === 'popup_failed_to_open') onError?.('Your browser blocked the Google window. Allow pop-ups for this site and try again.');
      // popup_closed: they closed it themselves; nothing to say.
    },
  });
  const busy = opening || disabled;
  return (
    <button type="button" className="kka-gbtn" disabled={busy} onClick={() => {
      setOpening(true);
      start();
      // Safety net: if Google's window never reports back, re-enable the button.
      setTimeout(() => setOpening(false), 30000);
    }}>
      {busy ? <span className="kka-spin dark" aria-hidden="true" /> : (
        <svg viewBox="0 0 48 48" width="20" height="20" aria-hidden="true">
          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
        </svg>
      )}
      <span>{busy ? 'Connecting to Google…' : label}</span>
    </button>
  );
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
      <aside className="kka-brand kka-poster">
        {/* Photo cut from the Care is respect poster (logo removed); the words are set as text. */}
        <img className="kka-brand-img" src="/images/care-is-respect-photo.jpg" width="951" height="628"
          alt="Jerry Akaminko, Ghanaian football icon, training in the gym." />
        <Link to="/" className="kka-poster-logo" aria-label="KleanKickx home">
          <img src="/images/kleankickx-logo-white.png" alt="KleanKickx" width="140" height="47" />
        </Link>
        <div className="kka-poster-copy">
          <motion.h2 className="kka-poster-h" {...rise(0.05)}>
            <span>Care </span><span>is </span><span>respect</span>
          </motion.h2>
          <motion.div className="kka-poster-cap" {...rise(0.15)}>
            <p className="n">Jerry Akaminko</p>
            <p>A Ghanaian football icon. Our first and biggest supporter. A reminder that resilience, care and the will to keep going can give everything a longer story.</p>
          </motion.div>
        </div>
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
