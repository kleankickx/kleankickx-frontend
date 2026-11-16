// src/components/AppLoader.jsx
// KleanKickx loading screen: the wordmark on paper white, the X gently breathing,
// and a thin line underneath with a green segment gliding along it.
// Pure CSS: the same markup also lives in index.html as the splash shown before
// JavaScript loads (keep the two in step). Respects reduced motion.

export const AppLoaderStyles = () => (
  <style>{`
    .kkl{position:fixed;inset:0;z-index:9000;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;background:#F7F9F6}
    .kkl-word{margin:0;font-family:"Anton","Arial Narrow",Impact,sans-serif;font-size:34px;letter-spacing:.02em;line-height:1;color:#0A0B0A}
    .kkl-word b{display:inline-block;font-weight:400;color:#1A7A1A;animation:kklX 1.6s ease-in-out infinite}
    .kkl-line{position:relative;width:132px;height:2px;background:#D9DFD7;overflow:hidden}
    .kkl-line::after{content:"";position:absolute;top:0;left:0;height:100%;width:38%;background:#1A7A1A;animation:kklGlide 1.6s cubic-bezier(.77,0,.18,1) infinite}
    @keyframes kklGlide{0%{transform:translateX(-100%)}100%{transform:translateX(265%)}}
    @keyframes kklX{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.55;transform:scale(.94)}}
    @media (prefers-reduced-motion:reduce){.kkl-word b,.kkl-line::after{animation:none}.kkl-line::after{width:100%}}
  `}</style>
);

/** Full-screen loader. `label` is read out by screen readers. */
export default function AppLoader({ label = 'Loading KleanKickx' }) {
  return (
    <div className="kkl" role="status" aria-live="polite" aria-label={label}>
      <AppLoaderStyles />
      <p className="kkl-word" aria-hidden="true">KLEANKICK<b>X</b></p>
      <span className="kkl-line" aria-hidden="true" />
    </div>
  );
}
