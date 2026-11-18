// Shared look for the checkout (editorial style: ink, paper, square corners).
// The class strings keep Tailwind's display utilities so callers can still add
// `hidden lg:inline-flex` and the like; the visuals come from CHECKOUT_CSS.

export const card = 'kkco-card';
export const cardBody = 'kkco-body';

const layout = 'inline-flex items-center justify-center gap-2 select-none';
export const btnPrimary = `${layout} kkco-btn go`;
export const btnSecondary = `${layout} kkco-btn`;
export const btnIcon = `${layout} kkco-btn icon`;

export const money = (value) => {
  const n = parseFloat(value) || 0;
  return `₵${n.toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const CHECKOUT_CSS = `
  .kkco,.kkco-vars{--ink:#0A0B0A;--paper:#F7F9F6;--line:#D9DFD7;--muted:#4D564C;--green:#1A7A1A;--green-hi:#4CB84C;--tint:#E9F4E7;--amber:#9A5B00;--red:#B42318;
    --display:"Anton","Arial Narrow",Impact,sans-serif;--mono:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;
    --spring:cubic-bezier(.2,1.25,.3,1);--swift:cubic-bezier(.77,0,.18,1)}
  .kkco{background:var(--paper);color:var(--ink);font-family:"League Spartan",system-ui,sans-serif;min-height:100vh}
  .kkco-vars{font-family:"League Spartan",system-ui,sans-serif;color:var(--ink)}
  .kkco-wrap{max-width:1200px;margin:0 auto;padding:0 20px 64px}
  .kkco-eyebrow{margin:0;font-size:12px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:var(--green)}
  .kkco-top{padding:40px 0 22px;border-bottom:2px solid var(--ink)}
  .kkco-top h1{margin:8px 0 0;font-family:var(--display);font-weight:400;text-transform:uppercase;font-size:clamp(48px,7vw,88px);line-height:.88}
  .kkco-top p.sub{margin:10px 0 0;color:var(--muted);font-size:17px}

  /* Cards */
  .kkco-card{background:#fff;border:1px solid var(--line)}
  .kkco-body{padding:22px}
  .kkco-head{padding-bottom:14px;margin-bottom:18px;border-bottom:2px solid var(--ink)}
  .kkco-h{margin:0;font-family:var(--display);font-weight:400;text-transform:uppercase;font-size:30px;line-height:1}
  .kkco-sub{margin:6px 0 0;color:var(--muted);font-size:15px;line-height:1.5}
  .kkco-label{display:flex;align-items:center;gap:8px;margin:0 0 8px;font-size:12px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:var(--ink)}
  .kkco-label .req{color:var(--red)}

  /* Buttons */
  .kkco-btn{height:52px;padding:0 22px;border:2px solid var(--ink);border-radius:2px;background:transparent;color:var(--ink);font:inherit;font-size:15px;font-weight:700;
    text-decoration:none;cursor:pointer;white-space:nowrap;transition:background .2s,color .2s,border-color .2s,transform .25s var(--spring)}
  .kkco-btn svg{transition:transform .3s var(--spring)}
  .kkco-btn:hover:not(:disabled){background:var(--ink);color:#fff}
  .kkco-btn:active:not(:disabled){transform:scale(.98)}
  .kkco-btn.go{background:var(--green);border-color:var(--green);color:#fff}
  .kkco-btn.go:hover:not(:disabled){background:var(--ink);border-color:var(--ink)}
  .kkco-btn.go:hover:not(:disabled) .fwd{transform:translateX(4px)}
  .kkco-btn.icon{width:52px;padding:0;flex:none}
  .kkco-btn:disabled{opacity:.5;cursor:default}
  .kkco :focus-visible{outline:2px solid var(--green);outline-offset:3px}

  /* Inputs */
  .kkco-phone{display:flex;align-items:stretch;height:54px;border:1.5px solid var(--line);border-radius:2px;background:#fff;transition:border-color .2s,box-shadow .2s}
  .kkco-phone:focus-within{border-color:var(--ink);box-shadow:0 3px 0 0 var(--green)}
  .kkco-phone.err{border-color:var(--red)}
  .kkco-phone.err:focus-within{box-shadow:0 3px 0 0 var(--red)}
  .kkco-phone .pre{display:flex;align-items:center;padding:0 14px;border-right:1.5px solid var(--line);font-weight:700;font-size:15px;background:var(--paper)}
  .kkco-phone input{flex:1;min-width:0;padding:0 14px;border:0;outline:0;background:transparent;font:inherit;font-size:17px;letter-spacing:.04em;color:var(--ink)}
  .kkco-phone .ok{display:flex;align-items:center;padding-right:14px}
  .kkco-help{margin:8px 0 0;font-size:14px;color:var(--muted)}
  .kkco-help.err{color:var(--red)}

  /* Account row */
  .kkco-who{display:flex;align-items:center;gap:14px;padding:14px;border:1px solid var(--line);background:var(--paper)}
  .kkco-who .ini{flex:none;width:48px;height:48px;display:grid;place-items:center;background:var(--ink);color:#fff;font-family:var(--display);font-size:20px;letter-spacing:.04em}
  .kkco-who p{margin:0;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .kkco-who .n{font-weight:700;font-size:17px}
  .kkco-who .m{font-size:14px;color:var(--muted)}

  /* Choice cards (pickup method) */
  .kkco-opts{display:grid;grid-template-columns:1fr 1fr;gap:10px}
  .kkco-opt{position:relative;display:flex;flex-direction:column;align-items:flex-start;gap:4px;width:100%;padding:16px 44px 16px 16px;border:2px solid var(--line);border-radius:2px;
    background:#fff;text-align:left;font:inherit;color:var(--ink);cursor:pointer;transition:border-color .2s,background .2s}
  .kkco-opt:hover{border-color:var(--ink)}
  .kkco-opt.on{border-color:var(--green);background:var(--tint)}
  .kkco-opt b{font-size:16px}
  .kkco-opt small{font-size:14px;color:var(--muted);line-height:1.45}
  .kkco-opt .tag{margin-top:6px;font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--green)}
  .kkco-opt .dot{position:absolute;top:16px;right:16px;width:20px;height:20px;border:2px solid var(--ink);display:grid;place-items:center}
  .kkco-opt.on .dot{border-color:var(--green);background:var(--green)}
  .kkco-opt.on .dot::after{content:"";width:8px;height:8px;background:#fff}

  /* Same-address switch */
  .kkco-switch{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:16px;border:1px solid var(--line);background:#fff;cursor:pointer;transition:border-color .2s}
  .kkco-switch:hover{border-color:var(--ink)}
  .kkco-switch b{display:block;font-size:15px}
  .kkco-switch small{display:block;margin-top:2px;font-size:14px;color:var(--muted)}
  .kkco-toggle{position:relative;flex:none;width:48px;height:26px;border:2px solid var(--ink);background:#fff;transition:background .2s,border-color .2s}
  .kkco-toggle::after{content:"";position:absolute;top:3px;left:3px;width:16px;height:16px;background:var(--ink);transition:transform .3s var(--spring),background .2s}
  input:checked + .kkco-toggle{background:var(--green);border-color:var(--green)}
  input:checked + .kkco-toggle::after{transform:translateX(22px);background:#fff}
  input:focus-visible + .kkco-toggle{outline:2px solid var(--green);outline-offset:3px}

  /* Notes and states */
  .kkco-note{padding:14px 16px;border-left:3px solid var(--green);background:var(--tint);font-size:14px;line-height:1.5}
  .kkco-note.warn{border-left-color:#B7791F;background:#FDF5E6;color:#5B3D0A}
  .kkco-note ul{list-style:none;margin:10px 0 0;padding:0;display:grid;grid-template-columns:1fr 1fr;gap:6px 14px}
  .kkco-note li{display:flex;gap:8px}
  .kkco-note li::before{content:"";flex:none;width:6px;height:6px;margin-top:7px;background:var(--green)}
  .kkco-error{display:flex;align-items:flex-start;gap:10px;padding:12px 14px;border-left:3px solid var(--red);background:#FDECEA;color:#7A1A12;font-size:14px;font-weight:600}
  .kkco-placeholder{margin-top:10px;padding:14px;border:1.5px dashed var(--line);text-align:center;font-size:14px;color:var(--muted)}
  .kkco-skel{height:50px;background:linear-gradient(90deg,var(--line) 0%,#EEF2EC 50%,var(--line) 100%);background-size:200% 100%;animation:kkcoShim 1.3s linear infinite}
  @keyframes kkcoShim{to{background-position:-200% 0}}
  .kkco-spin{display:inline-block;width:16px;height:16px;border-radius:50%;border:2.5px solid rgba(26,122,26,.2);border-top-color:var(--green);animation:kkcoSpin .8s linear infinite}
  .kkco-btn .kkco-spin{border-color:rgba(255,255,255,.35);border-top-color:#fff}
  @keyframes kkcoSpin{to{transform:rotate(360deg)}}

  /* Chosen address */
  .kkco-loc{margin-top:10px;border:1px solid var(--line);border-left:4px solid var(--green);background:#fff}
  .kkco-loc-top{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;padding:14px 14px 12px 16px}
  .kkco-loc-top b{display:block;font-size:16px}
  .kkco-loc-top p{margin:3px 0 0;font-size:14px;color:var(--muted);line-height:1.45}
  .kkco-loc-top .reg{display:inline-block;margin-top:8px;padding:2px 8px;border:1px solid var(--line);font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase}
  .kkco-loc-x{flex:none;width:32px;height:32px;display:grid;place-items:center;border:1.5px solid var(--line);background:none;color:var(--ink);cursor:pointer;transition:border-color .2s,background .2s,color .2s}
  .kkco-loc-x:hover{border-color:var(--ink);background:var(--ink);color:#fff}
  .kkco-loc-fee{display:flex;justify-content:space-between;align-items:baseline;padding:10px 14px 12px 16px;border-top:1px solid var(--line);font-size:14px;color:var(--muted)}
  .kkco-loc-fee b{font-family:var(--display);font-weight:400;font-size:22px;color:var(--ink)}
  .kkco-when{margin-top:8px;padding:12px 14px;border-left:3px solid var(--green);background:var(--tint);font-size:14px;line-height:1.5}
  .kkco-when b{font-weight:700}
  .kkco-when small{display:block;margin-top:2px;color:var(--muted)}
  .place-autocomplete-input-container gmp-place-autocomplete,.place-autocomplete-input-container gmp-placeautocomplete{color-scheme:light}

  /* Review */
  .kkco-review > div{display:grid;grid-template-columns:1fr auto;gap:12px;padding:18px 22px;border-bottom:1px solid var(--line)}
  .kkco-review > div:last-child{border-bottom:0}
  .kkco-review h3{margin:0 0 6px;font-size:12px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:var(--green)}
  .kkco-review p{margin:0;font-size:15px;color:var(--muted);overflow-wrap:anywhere}
  .kkco-review p.main{color:var(--ink);font-weight:700;font-size:16px}
  .kkco-review dl{margin:0;display:grid;gap:8px}
  .kkco-review dt{font-size:13px;color:var(--muted)}
  .kkco-review dd{margin:0;font-weight:700;overflow-wrap:anywhere}
  .kkco-edit{align-self:start;border:0;background:none;padding:2px 0;font:inherit;font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--ink);
    text-decoration:underline;text-underline-offset:4px;cursor:pointer}
  .kkco-edit:hover{color:var(--green)}

  /* Payment methods */
  .kkco-pay{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(4,1fr);gap:8px}
  .kkco-pay li{display:flex;flex-direction:column;align-items:center;gap:8px;padding:14px 6px;border:1px solid var(--line);background:var(--paper);text-align:center;font-size:12.5px;font-weight:600;line-height:1.2}
  .kkco-pay img{width:40px;height:40px;object-fit:cover}
  .kkco-secure{display:flex;align-items:center;justify-content:center;gap:8px;margin:16px 0 0;font-size:13px;color:var(--muted)}

  /* Summary (dark receipt) */
  .kkco-sum{background:var(--ink);color:#fff;border:0}
  .kkco-sum .kkco-head{border-bottom-color:rgba(255,255,255,.9);display:flex;justify-content:space-between;align-items:baseline;gap:12px}
  .kkco-sum .kkco-head span{font-size:13px;color:#A9B3A7}
  .kkco-items{list-style:none;margin:0;padding:0}
  .kkco-items li{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,.12)}
  .kkco-items .q{flex:none;min-width:30px;height:24px;padding:0 6px;display:grid;place-items:center;border:1.5px solid rgba(255,255,255,.4);font-size:12px;font-weight:700}
  .kkco-items .nm{flex:1;min-width:0;font-size:15px;font-weight:600}
  .kkco-items .pr{font-weight:700;white-space:nowrap;font-variant-numeric:tabular-nums}
  .kkco-rows{margin-top:6px}
  .kkco-row{padding:9px 0;border-bottom:1px solid rgba(255,255,255,.12)}
  .kkco-row > div{display:flex;justify-content:space-between;gap:12px;font-size:15px}
  .kkco-row > div > span:first-child{color:#C4CCC2;display:flex;align-items:center;gap:8px;min-width:0}
  .kkco-row > div > span:last-child{font-weight:700;white-space:nowrap;font-variant-numeric:tabular-nums}
  .kkco-row small{display:block;margin-top:2px;font-size:12px;color:#A9B3A7}
  .kkco-row.g > div > span{color:#6FD46F !important}
  .kkco-row.a > div > span{color:#F2B544 !important}
  .kkco-row .muted{color:#7E887C !important;font-weight:500 !important}
  .kkco-total{display:flex;justify-content:space-between;align-items:flex-end;gap:12px;padding-top:16px}
  .kkco-total > span{font-size:13px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:#C4CCC2}
  .kkco-total div{text-align:right}
  .kkco-total s{display:block;font-size:14px;color:#A9B3A7}
  .kkco-total strong{display:block;font-family:var(--display);font-weight:400;font-size:46px;line-height:1;font-variant-numeric:tabular-nums}
  .kkco-sum-bare .kkco-items li,.kkco-sum-bare .kkco-row{border-bottom-color:var(--line)}
  .kkco-sum-bare .kkco-items .q{border-color:var(--ink)}
  .kkco-sum-bare .kkco-row > div > span:first-child{color:var(--muted)}
  .kkco-sum-bare .kkco-row small{color:var(--muted)}
  .kkco-sum-bare .kkco-row.g > div > span{color:var(--green) !important}
  .kkco-sum-bare .kkco-row.a > div > span{color:var(--amber) !important}
  .kkco-sum-bare .kkco-row .muted{color:var(--muted) !important}
  .kkco-sum-bare .kkco-total > span{color:var(--muted)}
  .kkco-sum-bare .kkco-total s{color:var(--muted)}
  .kkco-sum-bare .kkco-total strong{font-size:38px}

  /* Promotion */
  .kkco-promo{display:flex;align-items:center;gap:14px;padding:16px;border:2px solid var(--green);background:var(--tint)}
  .kkco-promo .pct{flex:none;width:56px;height:56px;display:grid;place-items:center;background:var(--green);color:#fff;font-family:var(--display);font-size:22px}
  .kkco-promo img{flex:none;width:56px;height:56px;object-fit:cover}
  .kkco-promo b{display:block;font-size:16px}
  .kkco-promo p{margin:2px 0 0;font-size:14px;color:var(--muted);line-height:1.45}
  .kkco-promo small{display:block;margin-top:4px;font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--green)}

  /* Promo code */
  .kkco-promo-box{background:#fff;border:1px solid var(--line)}
  .kkco-promo-toggle{display:flex;justify-content:space-between;align-items:center;width:100%;padding:14px 16px;border:0;background:none;font:inherit;font-size:14px;font-weight:700;color:var(--ink);cursor:pointer}
  .kkco-promo-toggle span{font-size:20px;line-height:1;transition:transform .3s var(--spring)}
  .kkco-promo-toggle:hover span{transform:rotate(90deg);color:var(--green)}
  .kkco-promo-box form{padding:14px 16px 16px}
  .kkco-promo-row{display:flex;height:50px;border:1.5px solid var(--line);transition:border-color .2s,box-shadow .2s}
  .kkco-promo-row:focus-within{border-color:var(--ink);box-shadow:0 3px 0 0 var(--green)}
  .kkco-promo-row.err{border-color:var(--red)}
  .kkco-promo-row.err:focus-within{box-shadow:0 3px 0 0 var(--red)}
  .kkco-promo-row input{flex:1;min-width:0;padding:0 14px;border:0;outline:0;background:transparent;font-family:var(--mono);font-size:16px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--ink)}
  .kkco-promo-row input::placeholder{font-family:"League Spartan",system-ui,sans-serif;font-weight:500;letter-spacing:0;text-transform:none;color:#9AA399}
  .kkco-promo-row button{flex:none;min-width:84px;border:0;background:var(--ink);color:#fff;font:inherit;font-size:14px;font-weight:700;cursor:pointer;display:grid;place-items:center;transition:background .2s}
  .kkco-promo-row button:hover:not(:disabled){background:var(--green)}
  .kkco-promo-row button .kkco-spin{border-color:rgba(255,255,255,.35);border-top-color:#fff}
  .kkco-promo-on{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;padding:14px 16px;border:2px solid var(--green);background:var(--tint)}
  .kkco-promo-on small{display:block;font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--green)}
  .kkco-promo-on b{display:block;margin-top:2px;font-family:var(--mono);font-size:18px;letter-spacing:.1em}
  .kkco-promo-on span{display:block;font-size:14px}
  .kkco-promo-on em{display:block;margin-top:6px;font-style:normal;font-size:13px;color:var(--muted);line-height:1.45}
  .kkco-promo-on button{flex:none;border:0;background:none;padding:2px 0;font:inherit;font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--ink);text-decoration:underline;text-underline-offset:3px;cursor:pointer}
  .kkco-promo-on button:hover{color:var(--red)}

  /* Mobile summary toggle and step bar */
  .kkco-fold{display:flex;align-items:center;justify-content:space-between;gap:12px;width:100%;padding:14px 16px;border:0;background:none;font:inherit;color:var(--ink);cursor:pointer}
  .kkco-fold span:first-child{display:flex;align-items:center;gap:8px;font-size:13px;font-weight:700;letter-spacing:.12em;text-transform:uppercase}
  .kkco-fold svg{transition:transform .3s var(--spring)}
  .kkco-fold[aria-expanded="true"] svg{transform:rotate(180deg)}
  .kkco-fold strong{font-family:var(--display);font-weight:400;font-size:24px}
  .kkco-bar{position:fixed;left:0;right:0;bottom:0;z-index:40;background:#fff;border-top:2px solid var(--ink);padding:12px 16px calc(12px + env(safe-area-inset-bottom,0px))}
  .kkco-bar .tot small{display:block;font-size:11px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:var(--muted)}
  .kkco-bar .tot b{font-family:var(--display);font-weight:400;font-size:24px;line-height:1}
  @media (min-width:1024px){.kkco-bar{position:static;z-index:auto;border-top:0;background:transparent;padding:6px 0 0}}
  /* Phones: keep alerts above the fixed Continue / Pay bar */
  @media (max-width:1023px){body:has(.kkco-bar) .kk-toasts{bottom:calc(92px + env(safe-area-inset-bottom,0px)) !important}}

  /* Empty cart */
  .kkco-empty{margin-top:28px;padding:64px 24px;border:2px dashed var(--line);text-align:center}
  .kkco-empty h2{margin:0;font-family:var(--display);font-weight:400;text-transform:uppercase;font-size:48px;line-height:.95}
  .kkco-empty p{margin:12px auto 24px;max-width:42ch;color:var(--muted);line-height:1.5}
  .kkco-empty div{display:flex;flex-wrap:wrap;justify-content:center;gap:10px}

  @media (max-width:640px){
    .kkco-wrap{padding:0 16px 48px}
    .kkco-top{padding:28px 0 18px}
    .kkco-top p.sub{font-size:15px}
    .kkco-body{padding:18px 16px}
    .kkco-h{font-size:26px}
    .kkco-opts{grid-template-columns:1fr}
    .kkco-note ul{grid-template-columns:1fr}
    .kkco-pay{grid-template-columns:1fr 1fr}
    .kkco-review > div{padding:16px}
    .kkco-total strong{font-size:40px}
  }
  @media (prefers-reduced-motion:reduce){.kkco-skel,.kkco-spin{animation-duration:2s}}
`;
