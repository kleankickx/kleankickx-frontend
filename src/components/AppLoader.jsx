// src/components/AppLoader.jsx
// KleanKickx loading screen: a grubby sneaker is wiped clean, left to right, by a
// green brush stroke, with a few bubbles, above the wordmark. Pure CSS so the same
// markup also lives in index.html as the splash shown before JavaScript loads
// (keep the two in step). Respects reduced motion.

const SNEAKER = {
  sole: 'M8 72H184a8 8 0 0 1 0 15H14a6 6 0 0 1-6-6z',
  upper: 'M12 72L14 38C14 34 18 31 22 31L34 33C40 35 44 40 52 40C58 40 62 30 70 20C74 15 80 15 84 19L96 30C112 40 136 46 160 52C178 56 188 62 188 72Z',
  stripe: 'M40 63C78 50 120 51 162 60',
  laces: 'M86 31l9-7M97 37l9-7M108 42l9-7',
  heel: 'M23 42c-2 8-2 17 0 26',
};

export const SneakerArt = ({ clean }) => (
  <svg viewBox="0 0 200 92" aria-hidden="true">
    <path d={SNEAKER.sole} fill={clean ? '#FFFFFF' : '#B9B2A3'} stroke={clean ? '#0A0B0A' : '#6E675B'} strokeWidth="3" strokeLinejoin="round" />
    <path d={SNEAKER.upper} fill={clean ? '#FFFFFF' : '#CFC8BA'} stroke={clean ? '#0A0B0A' : '#6E675B'} strokeWidth="3" strokeLinejoin="round" />
    <path d={SNEAKER.stripe} fill="none" stroke={clean ? '#1A7A1A' : '#8F8878'} strokeWidth="5" strokeLinecap="round" />
    <path d={SNEAKER.laces} fill="none" stroke={clean ? '#0A0B0A' : '#6E675B'} strokeWidth="2.6" strokeLinecap="round" />
    <path d={SNEAKER.heel} fill="none" stroke={clean ? '#0A0B0A' : '#6E675B'} strokeWidth="2.4" strokeLinecap="round" />
    {!clean && (
      <g fill="#7A7262" opacity=".75">
        <circle cx="34" cy="55" r="2.6" /><circle cx="60" cy="50" r="1.8" /><circle cx="96" cy="58" r="3" />
        <circle cx="128" cy="53" r="2" /><circle cx="152" cy="64" r="2.6" /><circle cx="174" cy="64" r="1.6" />
        <circle cx="30" cy="80" r="2" /><circle cx="110" cy="80" r="2.4" /><circle cx="162" cy="80" r="1.8" />
      </g>
    )}
  </svg>
);

export const AppLoaderStyles = () => (
  <style>{`
    .kkl{position:fixed;inset:0;z-index:9000;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:22px;
      background:#F7F9F6;font-family:"League Spartan",system-ui,sans-serif;color:#0A0B0A}
    .kkl-shoe{position:relative;width:min(220px,58vw);aspect-ratio:200/92}
    .kkl-shoe svg{position:absolute;inset:0;width:100%;height:100%;display:block}
    .kkl-clean{position:absolute;inset:0;clip-path:inset(0 100% 0 0);animation:kklWipe 2.4s cubic-bezier(.77,0,.18,1) infinite}
    .kkl-brush{position:absolute;top:8%;bottom:-6%;left:0;width:6px;border-radius:3px;background:#1A7A1A;box-shadow:0 0 0 3px rgba(26,122,26,.18);
      animation:kklBrush 2.4s cubic-bezier(.77,0,.18,1) infinite}
    .kkl-bubble{position:absolute;bottom:30%;width:8px;height:8px;border-radius:50%;border:1.5px solid rgba(26,122,26,.55);opacity:0;
      animation:kklBubble 2.4s ease-out infinite}
    .kkl-bubble:nth-of-type(1){left:28%;animation-delay:.35s}
    .kkl-bubble:nth-of-type(2){left:52%;width:6px;height:6px;animation-delay:.75s}
    .kkl-bubble:nth-of-type(3){left:76%;width:10px;height:10px;animation-delay:1.1s}
    .kkl-word{margin:0;font-family:"Anton","Arial Narrow",Impact,sans-serif;font-size:30px;letter-spacing:.02em;line-height:1}
    .kkl-word b{font-weight:400;color:#1A7A1A}
    .kkl-cap{margin:-12px 0 0;font-size:11px;font-weight:600;letter-spacing:.2em;text-transform:uppercase;color:#4D564C}
    @keyframes kklWipe{0%{clip-path:inset(0 100% 0 0)}55%,82%{clip-path:inset(0 0 0 0)}100%{clip-path:inset(0 0 0 100%)}}
    @keyframes kklBrush{0%{left:0;opacity:1}55%{left:calc(100% - 6px);opacity:1}62%,100%{left:calc(100% - 6px);opacity:0}}
    @keyframes kklBubble{0%{opacity:0;transform:translateY(0) scale(.6)}25%{opacity:1}100%{opacity:0;transform:translateY(-42px) scale(1.1)}}
    @media (prefers-reduced-motion:reduce){
      .kkl-clean{animation:none;clip-path:none}.kkl-brush,.kkl-bubble{display:none}
    }
  `}</style>
);

/** Full-screen loader. `label` changes the small caption under the wordmark. */
export default function AppLoader({ label = 'Getting your kicks ready' }) {
  return (
    <div className="kkl" role="status" aria-live="polite" aria-label={label}>
      <AppLoaderStyles />
      <div className="kkl-shoe">
        <SneakerArt />
        <div className="kkl-clean"><SneakerArt clean /></div>
        <span className="kkl-brush" aria-hidden="true" />
        <span className="kkl-bubble" aria-hidden="true" />
        <span className="kkl-bubble" aria-hidden="true" />
        <span className="kkl-bubble" aria-hidden="true" />
      </div>
      <p className="kkl-word">KLEANKICK<b>X</b></p>
      <p className="kkl-cap">{label}</p>
    </div>
  );
}
