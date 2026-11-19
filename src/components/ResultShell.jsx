// src/components/ResultShell.jsx
// Shared look for result / payment pages (payment status, pay for an order,
// voucher purchase done, order recovery). Builds on the account page styles.
import React from 'react';
import { ACCOUNT_CSS } from './AccountShell';

export const RESULT_CSS = ACCOUNT_CSS + `
  .kkrs-wrap{max-width:760px;margin:0 auto;padding:0 20px 72px}
  .kkrs-wrap.wide{max-width:1100px}
  .kkrs-top{padding:44px 0 24px;border-bottom:2px solid var(--ink)}
  .kkrs-top h1{margin:10px 0 0;font-family:var(--display);font-weight:400;text-transform:uppercase;font-size:clamp(44px,7vw,88px);line-height:.9}
  .kkrs-top p.sub{margin:12px 0 0;color:var(--muted);font-size:17px;line-height:1.5;max-width:52ch}
  .kkrs-mark{width:64px;height:64px;display:grid;place-items:center;margin-bottom:18px;background:var(--ink);color:#fff}
  .kkrs-mark.ok{background:var(--green)}
  .kkrs-mark.wait{background:#B7791F}
  .kkrs-mark.bad{background:var(--red)}
  .kkrs-mark svg{width:30px;height:30px}
  .kkrs-receipt{background:var(--ink);color:#fff;padding:22px;margin-top:24px}
  .kkrs-receipt .kkac-eyebrow{color:#6FD46F}
  .kkrs-row{display:flex;justify-content:space-between;align-items:baseline;gap:14px;padding:11px 0;border-bottom:1px solid rgba(255,255,255,.14);font-size:15px}
  .kkrs-row:last-child{border-bottom:0}
  .kkrs-row span:first-child{color:#C4CCC2}
  .kkrs-row span:last-child{font-weight:700;text-align:right;overflow-wrap:anywhere}
  .kkrs-row.total span:last-child{font-family:var(--display);font-weight:400;font-size:40px;line-height:1}
  .kkrs-tag{display:inline-flex;align-items:center;gap:6px;height:24px;padding:0 8px;border:1px solid currentColor;font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase}
  .kkrs-tag::before{content:"";width:6px;height:6px;background:currentColor}
  .kkrs-tag.ok{color:#6FD46F}.kkrs-tag.wait{color:#F2B544}.kkrs-tag.bad{color:#FF8A80}
  .kkrs-actions{display:grid;gap:10px;margin-top:22px}
  .kkrs-actions.two{grid-template-columns:1fr 1fr}
  .kkrs-actions .kkac-btn{width:100%}
  .kkrs-steps{list-style:none;margin:24px 0 0;padding:0;border-top:2px solid var(--ink)}
  .kkrs-steps li{display:grid;grid-template-columns:48px 1fr;gap:10px;padding:14px 0;border-bottom:1px solid var(--line)}
  .kkrs-steps .n{font-family:var(--display);font-size:30px;line-height:1;color:var(--green)}
  .kkrs-steps b{display:block;font-size:16px}
  .kkrs-steps p{margin:2px 0 0;color:var(--muted);font-size:15px;line-height:1.45}
  .kkrs-note{margin-top:20px;padding:14px 16px;border-left:3px solid var(--green);background:var(--tint);font-size:15px;line-height:1.5}
  .kkrs-note.wait{border-left-color:#B7791F;background:#FDF5E6;color:#5B3D0A}
  .kkrs-note.bad{border-left-color:var(--red);background:#FDECEA;color:#7A1A12}
  .kkrs-help{margin-top:22px;font-size:14px;color:var(--muted);line-height:1.55}
  .kkrs-help a{color:var(--ink);font-weight:700;text-decoration:underline;text-underline-offset:3px}
  .kkrs-bar{height:4px;margin-top:22px;background:var(--line);overflow:hidden;position:relative}
  .kkrs-bar::after{content:"";position:absolute;top:0;bottom:0;width:35%;background:var(--green);animation:kkrsSlide 1.1s cubic-bezier(.77,0,.18,1) infinite}
  @keyframes kkrsSlide{from{left:-35%}to{left:100%}}
  .kkrs-items{list-style:none;margin:0;padding:0}
  .kkrs-items li{display:grid;grid-template-columns:52px 1fr auto;gap:14px;align-items:center;padding:12px 0;border-bottom:1px solid var(--line)}
  .kkrs-items li:last-child{border-bottom:0}
  .kkrs-items img{width:52px;height:52px;object-fit:cover;border:1px solid var(--line);background:var(--paper)}
  .kkrs-items b{display:block;font-size:16px}
  .kkrs-items small{color:var(--muted);font-size:14px}
  .kkrs-items .pr{font-weight:700;font-variant-numeric:tabular-nums}
  .kkrs .kk-pp{border-radius:0;box-shadow:none;border:1px solid var(--line);margin:24px 0 0}
  @media (max-width:560px){
    .kkrs-wrap{padding:0 16px 56px}
    .kkrs-top{padding-top:30px}
    .kkrs-top p.sub{font-size:15px}
    .kkrs-actions.two{grid-template-columns:1fr}
    .kkrs-row.total span:last-child{font-size:32px}
  }
  @media (prefers-reduced-motion:reduce){.kkrs-bar::after{animation:none;width:100%;left:0}}
`;

export const Mark = ({ tone = '', children }) => <span className={`kkrs-mark ${tone}`} aria-hidden="true">{children}</span>;

export const Icons = {
  check: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 12.5l4.2 4.2L19 7" /></svg>,
  cross: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M6 6l12 12M18 6L6 18" /></svg>,
  clock: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><circle cx="12" cy="12" r="8" /><path d="M12 8v4.5l3 2" /></svg>,
  card: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M3 6h18v12H3z M3 10h18" /></svg>,
  gift: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M4 10h16v10H4z M3 7h18v3H3z M12 7v13 M12 7c-2-4-6-3-5 0M12 7c2-4 6-3 5 0" /></svg>,
  alert: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6"><path d="M12 7v7M12 17.5v.5" /></svg>,
};

export const cedi = (v) => `₵${(parseFloat(v) || 0).toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
