// src/components/AppToasts.jsx
// KleanKickx alerts. Every toast.success / error / warn / info call in the app shows
// here: an ink card with square corners, a coloured edge and icon tile per type, a
// small label above the message, and a thin timer line. Bottom-right on desktop,
// along the bottom on phones (the add-to-cart banner owns the top of the screen).
import React from 'react';
import { ToastContainer, cssTransition } from 'react-toastify';

const LABEL = { success: 'Done', error: 'Something went wrong', warning: 'Heads up', info: 'Note', default: 'Note' };

const Glyph = ({ type }) => {
  const paths = {
    success: <path d="M5 12.5l4.2 4.2L19 7" />,
    error: <path d="M7 7l10 10M17 7L7 17" />,
    warning: <><path d="M12 6v8" /><path d="M12 18.2v.1" /></>,
  };
  return (
    <span className={`kkt-icon kkt-icon--${type}`} aria-hidden="true">
      <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="square">
        {paths[type] || <><path d="M12 10.5v7" /><path d="M12 6.4v.1" /></>}
      </svg>
    </span>
  );
};

const Close = ({ closeToast }) => (
  <button type="button" className="kkt-x" onClick={closeToast} aria-label="Dismiss">
    <svg viewBox="0 0 16 16" width="11" height="11" aria-hidden="true"><path d="M2 2l12 12M14 2L2 14" stroke="currentColor" strokeWidth="2.2" /></svg>
  </button>
);

const slide = cssTransition({ enter: 'kkt-in', exit: 'kkt-out', collapseDuration: 220 });

const css = `
  .kk-toasts{--kkt-ink:#0A0B0A;--kkt-green:#4CB84C;--kkt-red:#F0564A;--kkt-amber:#F2B544;--kkt-grey:#C4CCC2;
    width:380px;padding:0;z-index:9999}
  .kk-toasts.Toastify__toast-container--bottom-right{right:20px;bottom:20px}
  .kk-toasts .Toastify__toast{position:relative;display:flex;align-items:flex-start;gap:12px;min-height:0;margin:10px 0 0;padding:32px 10px 16px 16px;
    border-radius:2px;background:var(--kkt-ink);color:#fff;box-shadow:0 24px 50px -24px rgba(10,11,10,.7),0 0 0 1px rgba(255,255,255,.06);
    font-family:"League Spartan",system-ui,sans-serif;font-size:15px;font-weight:600;line-height:1.4;overflow:hidden;cursor:default}
  .kk-toasts .Toastify__toast::before{content:"";position:absolute;left:0;top:0;bottom:0;width:4px;background:var(--kkt-accent,var(--kkt-grey))}
  .kk-toasts .Toastify__toast--success{--kkt-accent:var(--kkt-green)}
  .kk-toasts .Toastify__toast--error{--kkt-accent:var(--kkt-red)}
  .kk-toasts .Toastify__toast--warning{--kkt-accent:var(--kkt-amber)}
  .kk-toasts .Toastify__toast--info,.kk-toasts .Toastify__toast--default{--kkt-accent:var(--kkt-grey)}
  .kk-toasts .Toastify__toast-icon{width:auto;margin:0;flex:none}
  .kkt-icon{display:grid;place-items:center;width:28px;height:28px;background:var(--kkt-accent,var(--kkt-grey));color:var(--kkt-ink)}
  .kk-toasts .Toastify__toast::after{content:var(--kkt-label,"Note");position:absolute;top:14px;left:56px;right:44px;
    font-size:10.5px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:var(--kkt-accent,var(--kkt-grey));
    white-space:nowrap;overflow:hidden;text-overflow:ellipsis;pointer-events:none}
  .kk-toasts .Toastify__toast-icon{margin-top:-18px !important}
  .kk-toasts .Toastify__toast--success{--kkt-label:"${LABEL.success}"}
  .kk-toasts .Toastify__toast--error{--kkt-label:"${LABEL.error}"}
  .kk-toasts .Toastify__toast--warning{--kkt-label:"${LABEL.warning}"}
  .kk-toasts .Toastify__toast--info{--kkt-label:"${LABEL.info}"}
  .kk-toasts .Toastify__toast a{color:inherit;text-decoration:underline;text-underline-offset:3px}
  .kkt-x{flex:none;width:28px;height:28px;display:grid;place-items:center;margin:-20px 0 0 auto;border:0;background:none;color:rgba(255,255,255,.55);cursor:pointer;
    transition:color .2s,background .2s}
  .kkt-x:hover{color:#fff;background:rgba(255,255,255,.1)}
  .kkt-x:focus-visible{outline:2px solid var(--kkt-green);outline-offset:1px}
  .kk-toasts .Toastify__progress-bar--wrp{height:2px;bottom:0;left:4px;right:0;width:auto;border-radius:0}
  .kk-toasts .Toastify__progress-bar--bg{background:rgba(255,255,255,.08);opacity:1}
  .kk-toasts .Toastify__progress-bar{background:var(--kkt-accent,var(--kkt-grey));opacity:.9}

  @keyframes kktIn{from{opacity:0;transform:translateY(18px) scale(.97)}to{opacity:1;transform:none}}
  @keyframes kktOut{from{opacity:1;transform:none}to{opacity:0;transform:translateX(30px)}}
  .kkt-in{animation:kktIn .42s cubic-bezier(.2,1.25,.3,1) both}
  .kkt-out{animation:kktOut .22s cubic-bezier(.77,0,.18,1) both}

  @media (max-width:480px){
    .kk-toasts{width:auto;left:12px;right:12px;bottom:calc(12px + env(safe-area-inset-bottom,0px))}
    .kk-toasts.Toastify__toast-container--bottom-right{left:12px;right:12px;bottom:calc(12px + env(safe-area-inset-bottom,0px));transform:none}
    .kk-toasts .Toastify__toast{margin-top:8px}
    @keyframes kktOut{from{opacity:1;transform:none}to{opacity:0;transform:translateY(20px)}}
  }
  @media (prefers-reduced-motion:reduce){
    .kkt-in,.kkt-out{animation-duration:.01ms}
  }
`;

export default function AppToasts() {
  return (
    <>
      <style>{css}</style>
      <ToastContainer
        className="kk-toasts"
        position="bottom-right"
        autoClose={4000}
        newestOnTop
        limit={3}
        closeOnClick={false}
        pauseOnHover
        pauseOnFocusLoss
        draggable="touch"
        transition={slide}
        icon={({ type }) => <Glyph type={type} />}
        closeButton={Close}
      />
    </>
  );
}
