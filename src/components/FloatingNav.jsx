import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

// Floating pill nav that slides up from the bottom once the visitor scrolls past the first screen.
// Public pages only: it never shows on cart, checkout, orders, account, partner or auth pages.
const SHOW_ON = ['/', '/services', '/impact', '/rate-and-services', '/vouchers', '/legal'];

const LINKS = [
  { label: 'Services', to: '/#services' },
  { label: 'Trade-In', to: '/#trade-in' },
  { label: 'Impact', to: '/impact' },
];

const FloatingNav = () => {
  const { pathname } = useLocation();
  const [on, setOn] = useState(false);
  // Pre-rendered pages are served at '/studio/' as well as '/studio'
  const allowed = SHOW_ON.includes(pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname);

  useEffect(() => {
    if (!allowed) return undefined;
    let raf = 0;
    const check = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const nearEnd = window.innerHeight + window.scrollY > document.body.scrollHeight - 160;
        setOn(window.scrollY > window.innerHeight * 0.7 && !nearEnd);
      });
    };
    check();
    window.addEventListener('scroll', check, { passive: true });
    window.addEventListener('resize', check);
    return () => { window.removeEventListener('scroll', check); window.removeEventListener('resize', check); cancelAnimationFrame(raf); };
  }, [allowed, pathname]);

  if (!allowed) return null;

  return (
    <>
      <style>{`
        .kk-fnav{position:fixed;left:50%;bottom:max(20px,env(safe-area-inset-bottom,0px));z-index:40;
          display:flex;align-items:center;gap:2px;padding:5px;border-radius:999px;
          background:rgba(240,242,239,.82);backdrop-filter:blur(14px) saturate(1.4);-webkit-backdrop-filter:blur(14px) saturate(1.4);
          box-shadow:0 10px 30px -12px rgba(0,0,0,.35),inset 0 0 0 1px rgba(0,0,0,.06);
          transform:translate(-50%,140%);opacity:0;transition:transform .55s cubic-bezier(.2,.9,.2,1),opacity .35s ease}
        .kk-fnav.on{transform:translate(-50%,0);opacity:1}
        .kk-fnav a{font:600 13px/1 "League Spartan",system-ui,sans-serif;letter-spacing:.06em;text-transform:uppercase;color:#0A0B0A;
          text-decoration:none;padding:12px 14px;border-radius:999px;white-space:nowrap;transition:background .2s}
        .kk-fnav a:hover{background:rgba(0,0,0,.06)}
        .kk-fnav a.go{background:#0A0B0A;color:#fff;padding:12px 18px}
        .kk-fnav a.go:hover{background:#1A7A1A}
        @media (max-width:420px){.kk-fnav a{padding:11px 10px;font-size:12px}.kk-fnav .nh{display:none}}
        @media (prefers-reduced-motion:reduce){.kk-fnav{transition:opacity .2s}}
      `}</style>
      <nav className={`kk-fnav ${on ? 'on' : ''}`} aria-label="Quick links" aria-hidden={!on}>
        {LINKS.map((l) => (
          <Link key={l.to} to={l.to} className={l.narrowHide ? 'nh' : ''} tabIndex={on ? 0 : -1}>{l.label}</Link>
        ))}
        <Link to="/#services" className="go" tabIndex={on ? 0 : -1}>Book a Klean</Link>
      </nav>
    </>
  );
};

export default FloatingNav;
