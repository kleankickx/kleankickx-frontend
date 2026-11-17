// src/components/AccountShell.jsx
// Shared look for the account settings pages (Account details, Change password).
import React, { useState } from 'react';

export const ACCOUNT_CSS = `
  .kkac{--ink:#0A0B0A;--paper:#F7F9F6;--line:#D9DFD7;--muted:#4D564C;--green:#1A7A1A;--tint:#E9F4E7;--red:#B42318;--amber:#9A5B00;
    --display:"Anton","Arial Narrow",Impact,sans-serif;--mono:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;--spring:cubic-bezier(.2,1.25,.3,1);
    background:var(--paper);color:var(--ink);font-family:"League Spartan",system-ui,sans-serif;min-height:100vh}
  .kkac-wrap{max-width:1100px;margin:0 auto;padding:0 20px 72px}
  .kkac-eyebrow{margin:0;font-size:12px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:var(--green)}
  .kkac-back{display:inline-flex;align-items:center;gap:8px;margin-top:28px;font-size:13px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);text-decoration:none}
  .kkac-back span{transition:transform .3s var(--spring)}
  .kkac-back:hover{color:var(--ink)}
  .kkac-back:hover span{transform:translateX(-4px)}
  .kkac-hero{display:flex;align-items:flex-end;justify-content:space-between;gap:20px;padding:18px 0 22px;border-bottom:2px solid var(--ink)}
  .kkac-hero h1{margin:8px 0 0;font-family:var(--display);font-weight:400;text-transform:uppercase;font-size:clamp(48px,7.5vw,96px);line-height:.88}
  .kkac-hero p.sub{margin:12px 0 0;color:var(--muted);font-size:17px;max-width:48ch}
  .kkac-ini{flex:none;width:84px;height:84px;display:grid;place-items:center;background:var(--ink);color:#fff;font-family:var(--display);font-size:34px;letter-spacing:.04em}
  .kkac-grid{display:grid;grid-template-columns:minmax(0,1fr) 340px;gap:24px;align-items:start;margin-top:26px}
  .kkac-col{display:flex;flex-direction:column;gap:24px;min-width:0}
  .kkac-card{background:#fff;border:1px solid var(--line);padding:22px}
  .kkac-card-head{display:flex;justify-content:space-between;align-items:baseline;gap:12px;padding-bottom:14px;margin-bottom:18px;border-bottom:2px solid var(--ink)}
  .kkac-card-head h2{margin:0;font-family:var(--display);font-weight:400;text-transform:uppercase;font-size:30px;line-height:1}
  .kkac-card-head span{font-size:13px;color:var(--muted)}
  .kkac-two{display:grid;grid-template-columns:1fr 1fr;gap:14px}
  .kkac-field{display:flex;flex-direction:column;gap:7px;margin-bottom:16px;min-width:0}
  .kkac-field label{display:flex;justify-content:space-between;align-items:baseline;gap:8px;font-size:12px;font-weight:600;letter-spacing:.12em;text-transform:uppercase}
  .kkac-field label i{font-style:normal;font-weight:500;letter-spacing:.04em;text-transform:none;color:var(--muted)}
  .kkac-input{display:flex;align-items:stretch;height:52px;border:1.5px solid var(--line);border-radius:2px;background:#fff;transition:border-color .2s,box-shadow .2s}
  .kkac-input:focus-within{border-color:var(--ink);box-shadow:0 3px 0 0 var(--green)}
  .kkac-input.err{border-color:var(--red)}
  .kkac-input.err:focus-within{box-shadow:0 3px 0 0 var(--red)}
  .kkac-input.ro{background:var(--paper)}
  .kkac-input .pre{display:flex;align-items:center;padding:0 12px;border-right:1.5px solid var(--line);background:var(--paper);font-weight:700;font-size:15px}
  .kkac-input input{flex:1;min-width:0;padding:0 14px;border:0;outline:0;background:transparent;font:inherit;font-size:16px;color:var(--ink)}
  .kkac-input input:disabled{color:var(--muted)}
  .kkac-input .tail{display:flex;align-items:center;padding:0 12px}
  .kkac-eye{border:0;background:none;padding:0 14px;color:var(--muted);cursor:pointer;display:grid;place-items:center}
  .kkac-eye:hover{color:var(--ink)}
  .kkac-help{margin:0;font-size:13.5px;color:var(--muted);line-height:1.45}
  .kkac-help.err{color:var(--red)}
  .kkac-tag{display:inline-flex;align-items:center;gap:6px;height:24px;padding:0 8px;border:1px solid currentColor;font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;white-space:nowrap}
  .kkac-tag::before{content:"";width:6px;height:6px;background:currentColor}
  .kkac-tag.ok{color:var(--green);background:var(--tint)}
  .kkac-tag.wait{color:var(--amber);background:#FFF6E5}
  .kkac-actions{display:flex;flex-wrap:wrap;align-items:center;gap:12px;margin-top:6px}
  .kkac-btn{display:inline-flex;align-items:center;justify-content:center;gap:10px;height:52px;padding:0 22px;border:2px solid var(--ink);border-radius:2px;background:transparent;
    color:var(--ink);font:inherit;font-size:15px;font-weight:700;text-decoration:none;cursor:pointer;white-space:nowrap;transition:background .2s,color .2s,border-color .2s,transform .25s var(--spring)}
  .kkac-btn .ar{transition:transform .3s var(--spring)}
  .kkac-btn:hover:not(:disabled){background:var(--ink);color:#fff}
  .kkac-btn:hover:not(:disabled) .ar{transform:translateX(5px)}
  .kkac-btn:active:not(:disabled){transform:scale(.98)}
  .kkac-btn.go{background:var(--green);border-color:var(--green);color:#fff}
  .kkac-btn.go:hover:not(:disabled){background:var(--ink);border-color:var(--ink)}
  .kkac-btn:disabled{opacity:.45;cursor:default}
  .kkac-saved{display:inline-flex;align-items:center;gap:8px;font-size:14px;font-weight:700;color:var(--green)}
  .kkac-spin{width:16px;height:16px;border-radius:50%;border:2.5px solid rgba(255,255,255,.35);border-top-color:#fff;animation:kkacSpin .8s linear infinite}
  @keyframes kkacSpin{to{transform:rotate(360deg)}}
  .kkac :focus-visible{outline:2px solid var(--green);outline-offset:3px}

  .kkac-list{margin:0}
  .kkac-list div{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid var(--line);font-size:15px}
  .kkac-list div:first-child{padding-top:0}
  .kkac-list div:last-child{border-bottom:0;padding-bottom:0}
  .kkac-list dt{color:var(--muted)}
  .kkac-list dd{margin:0;font-weight:700;text-align:right;overflow-wrap:anywhere}
  .kkac-link{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:16px;border:1.5px solid var(--line);background:#fff;color:var(--ink);text-decoration:none;font-weight:700;transition:border-color .2s}
  .kkac-link small{display:block;margin-top:2px;font-size:13px;font-weight:500;color:var(--muted)}
  .kkac-link .ar{transition:transform .3s var(--spring)}
  .kkac-link:hover{border-color:var(--ink)}
  .kkac-link:hover .ar{transform:translateX(5px);color:var(--green)}
  .kkac-code{display:flex;align-items:center;justify-content:space-between;gap:10px;width:100%;padding:12px 14px;border:1.5px dashed var(--line);background:var(--paper);font:inherit;cursor:pointer;text-align:left}
  .kkac-code code{font-family:var(--mono);font-size:18px;font-weight:700;letter-spacing:.12em;color:var(--ink)}
  .kkac-code span{font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--green)}
  .kkac-code:hover{border-color:var(--ink)}
  .kkac-points{margin:14px 0 0;font-size:14px;color:var(--muted)}
  .kkac-points b{font-family:var(--display);font-weight:400;font-size:26px;color:var(--ink);margin-right:6px}
  .kkac-meter{display:flex;gap:4px;margin-top:10px}
  .kkac-meter span{flex:1;height:5px;background:var(--line);transition:background .25s}
  .kkac-meter span.on{background:var(--green)}
  .kkac-meter.weak span.on{background:#C2410C}
  .kkac-skel{background:linear-gradient(90deg,var(--line) 0%,#EEF2EC 50%,var(--line) 100%);background-size:200% 100%;animation:kkacShim 1.3s linear infinite}
  @keyframes kkacShim{to{background-position:-200% 0}}

  @media (max-width:900px){.kkac-grid{grid-template-columns:1fr}}
  @media (max-width:560px){
    .kkac-wrap{padding:0 16px 56px}
    .kkac-hero{padding-bottom:18px}
    .kkac-ini{width:60px;height:60px;font-size:24px}
    .kkac-hero p.sub{font-size:15px}
    .kkac-card{padding:18px 16px}
    .kkac-card-head h2{font-size:26px}
    .kkac-two{grid-template-columns:1fr;gap:0}
    .kkac-actions .kkac-btn{width:100%}
  }
  @media (prefers-reduced-motion:reduce){.kkac-skel{animation:none}}
`;

const Eye = ({ off }) => (
  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
    <circle cx="12" cy="12" r="3" />
    {off && <path d="M4 4l16 16" />}
  </svg>
);

/** Password field with a show/hide button. */
export const PasswordField = ({ id, label, hint, error, value, onChange, autoComplete, autoFocus }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="kkac-field">
      <label htmlFor={id}>{label}{hint && <i>{hint}</i>}</label>
      <div className={`kkac-input ${error ? 'err' : ''}`}>
        <input id={id} type={show ? 'text' : 'password'} value={value} onChange={onChange} autoComplete={autoComplete}
          autoFocus={autoFocus} aria-invalid={!!error} aria-describedby={error ? `${id}-err` : undefined} />
        <button type="button" className="kkac-eye" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'}>
          <Eye off={show} />
        </button>
      </div>
      {error && <p id={`${id}-err`} className="kkac-help err" role="alert">{error}</p>}
    </div>
  );
};

/** First message from a DRF error body ({field: ['msg']} or {error: 'msg'}). */
export const firstError = (data, field) => {
  const v = data?.[field];
  return Array.isArray(v) ? v[0] : v || null;
};
