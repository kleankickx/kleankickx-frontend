import React, { useState, useEffect, useRef, useContext, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import Footer from '../components/Footer';
import { AuthContext } from '../context/AuthContext';
import useQuickAdd from '../hooks/useQuickAdd';

// Photo at the top of a homepage service card. `images` is null while loading.
const ServicePhoto = ({ images, kind, alt }) => {
  const src = images?.[kind] || (kind === 'free' ? images?.standard : '');
  return (
    <div className={`pic ${images === null ? 'loading' : ''}`}>
      {src ? (
        <img src={src} alt={alt} loading="lazy" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
      ) : (
        images !== null && (
          <svg viewBox="0 0 64 40" aria-hidden="true">
            <path d="M4 30c0-3 2-5 5-5h14l9-12c1-1 3-2 4-1l6 5c2 1 4 2 6 2h6c3 0 6 3 6 6v5H4z" fill="currentColor" />
            <rect x="4" y="33" width="56" height="4" rx="2" fill="currentColor" opacity=".55" />
          </svg>
        )
      )}
    </div>
  );
};

const WHATSAPP_TRADE_IN = 'https://wa.me/233536278834?text=' + encodeURIComponent('Hi KleanKickx, I have pairs I no longer wear and want to trade them in.');

const Home = () => {
  const [bundleSelection, setBundleSelection] = useState(5);
  const [activeTab, setActiveTab] = useState('leather');
  const { isAuthenticated, user } = useContext(AuthContext);
  const { quickAdd, addingId } = useQuickAdd();

  const revealObserverRef = useRef(null);
  const countObserverRef = useRef(null);

  const bundles = {
    1: { name: 'Standard Klean', total: 50 },
    3: { name: 'Triple Threat', total: 130 },
    5: { name: 'Clean Krew', total: 210 },
    10: { name: 'Sneakers Squad', total: 410 },
    20: { name: 'VIP Klean', total: 800 },
  };

  const careTabs = [
    { id: 'leather', label: 'Leather' },
    { id: 'suede', label: 'Suede' },
    { id: 'mesh', label: 'Mesh & knit' },
    { id: 'soles', label: 'Soles' },
    { id: 'store', label: 'Storage' },
  ];
  const careContent = {
    leather: {
      subtitle: 'Tough, but it cracks if it dries out.',
      do: ['Wipe dust off after each wear with a damp cloth', 'Use sneaker shields or shoe trees to hold the shape and limit creasing', 'Condition every few months'],
      dont: ['Dry them in direct sun', 'Use household bleach or harsh detergent', 'Put them in a washing machine'],
    },
    suede: {
      subtitle: 'Beautiful and thirsty. Water is the enemy.',
      do: ['Brush in one direction with a suede brush to lift dirt', 'Use a suede eraser on small marks', 'Protect them before the rains'],
      dont: ['Scrub with water and soap', 'Wear them fresh into rain or mud', 'Rub stains hard; that pushes them deeper'],
    },
    mesh: {
      subtitle: 'Breathes well, catches every bit of dust.',
      do: ['Use a soft brush and mild cleaner, working gently', 'Pull out insoles and laces to air them', 'Air-dry with paper inside'],
      dont: ['Use a stiff brush that pulls threads', 'Soak them', 'Dry them on a heater or in the sun'],
    },
    soles: {
      subtitle: 'Where the wear shows first.',
      do: ['Wipe midsoles after dusty days before dirt sets', 'Rotate pairs so foam can recover between wears', 'Bring them in early when a sole starts to lift'],
      dont: ['Leave yellowing to spread for months', 'Use superglue on a lifting sole', 'Leave them in a hot car'],
    },
    store: {
      subtitle: "How they sit decides how they age.",
      do: ['Keep them in a cool, dry place to prevent mould and mildew', "Keep them out of direct sunlight so colours don't fade", 'Use silica packs during humid months'],
      dont: ['Seal them in plastic bags', 'Stack heavy pairs on top of each other', 'Store them damp'],
    },
  };

  // --- Live services: same list the Services page uses, so each card adds the real item ---
  const [services, setServices] = useState(null); // null while loading
  useEffect(() => {
    let alive = true;
    const endpoint = isAuthenticated ? '/api/services/authenticated/' : '/api/services/public/';
    api
      .get(endpoint)
      .catch(() => api.get('/api/services/public/'))
      .then(({ data }) => { if (alive) setServices(Array.isArray(data) ? data : []); })
      .catch(() => alive && setServices([]));
    return () => { alive = false; };
  }, [isAuthenticated]);

  const catalog = useMemo(() => {
    if (!services) return null;
    const isPackage = (s) => s.service_type?.startsWith('PACKAGE_');
    // Shortest matching name wins, so "Standard Klean" beats anything longer that mentions it
    const single = (word) => services
      .filter((s) => !s.is_free_signup_service && !isPackage(s) && s.name?.toLowerCase().includes(word))
      .sort((a, b) => a.name.length - b.name.length)[0];
    const bundle = (pairs, name) => services.find((s) => isPackage(s) && Number(s.included_quantity) === pairs)
      || services.find((s) => s.name?.toLowerCase() === name.toLowerCase());
    return {
      free: services.find((s) => s.is_free_signup_service),
      standard: single('standard'),
      priority: single('priority'),
      deep: single('deep'),
      bundle,
    };
  }, [services]);

  const serviceImages = catalog === null ? null : {
    free: catalog.free?.image || '',
    standard: catalog.standard?.image || '',
    priority: catalog.priority?.image || '',
    deep: catalog.deep?.image || '',
  };

  // Add straight to the cart. If the live list hasn't loaded or the item is missing,
  // fall back to the Services page so the customer is never stuck.
  const AddButton = ({ service, className = 'btn sm', children = 'Add to cart' }) => {
    if (!service) {
      return <Link className={className} to="/services">{children}</Link>;
    }
    const busy = addingId === service.id;
    return (
      <button type="button" className={className} onClick={() => quickAdd(service)} disabled={busy} aria-busy={busy}>
        {busy ? 'Adding…' : children}
      </button>
    );
  };

  const freeUsed = isAuthenticated && !!user?.free_signup_service_used;
  const freeLabel = !isAuthenticated ? 'Sign up free' : freeUsed ? 'Already claimed' : 'Add to cart';

  // --- Scroll Reveal & Count-Up ---
  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion || !('IntersectionObserver' in window)) {
      document.querySelectorAll('.rv').forEach((el) => el.classList.add('in'));
      return;
    }

    revealObserverRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in');
            revealObserverRef.current.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 }
    );
    document.querySelectorAll('.rv').forEach((el) => revealObserverRef.current.observe(el));

    countObserverRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target;
            const end = parseInt(el.dataset.count, 10);
            if (isNaN(end)) return;
            const em = el.querySelector('em')?.outerHTML || '';
            const startTime = performance.now();
            const duration = 1400;
            const tick = (now) => {
              const progress = Math.min(1, (now - startTime) / duration);
              const eased = 1 - Math.pow(1 - progress, 4);
              const current = Math.round(end * eased);
              el.innerHTML = current.toLocaleString('en-US') + em;
              if (progress < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
            countObserverRef.current.unobserve(el);
          }
        });
      },
      { threshold: 0.5 }
    );
    document.querySelectorAll('[data-count]').forEach((el) => countObserverRef.current.observe(el));

    return () => {
      if (revealObserverRef.current) revealObserverRef.current.disconnect();
      if (countObserverRef.current) countObserverRef.current.disconnect();
    };
  }, []);

  const selectedBundle = bundles[bundleSelection];
  const selectedService = catalog
    ? (bundleSelection === 1 ? catalog.standard : catalog.bundle(bundleSelection, selectedBundle.name))
    : undefined;

  const handleTabClick = (tabId) => setActiveTab(tabId);

  const handleTabKeyDown = (e, index) => {
    let nextIndex = null;
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') nextIndex = (index + 1) % careTabs.length;
    if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') nextIndex = (index - 1 + careTabs.length) % careTabs.length;
    if (nextIndex !== null) {
      e.preventDefault();
      handleTabClick(careTabs[nextIndex].id);
      document.getElementById(`tab-${careTabs[nextIndex].id}`)?.focus();
    }
  };

  const bundleKeys = Object.keys(bundles);
  const bundleIndex = bundleKeys.indexOf(String(bundleSelection));

  return (
    <div className="antialiased kk-home">
      <style>{`
        :root{
          --paper:#F7F9F6;--ink:#0A0B0A;--muted:#4D564C;--line:#D9DFD7;--card:#FFFFFF;
          --green:#1A7A1A;--green-ink:#FFFFFF;--tint:#E6F0E4;
          --band:#0A0B0A;--band-fg:#F2F5F0;--band-muted:#A3AEA1;--band-line:#2A302A;--band-green:#4CB84C;
          --display:"Anton","Arial Narrow",Impact,sans-serif;
          --body:"League Spartan",system-ui,-apple-system,"Segoe UI",sans-serif;
          --mono:"League Spartan",system-ui,sans-serif;
          --spring:cubic-bezier(.2,1.25,.3,1);
          --swift:cubic-bezier(.77,0,.18,1);
        }
        *{box-sizing:border-box}
        html{scroll-behavior:smooth}
        body{background:var(--paper)}
        .kk-home{color:var(--ink);font-family:var(--body);font-size:17px;line-height:1.6;-webkit-font-smoothing:antialiased}
        body::before{content:"";position:fixed;inset:0 0 auto;height:env(safe-area-inset-top,0px);z-index:30;background:var(--paper)}
        a{color:inherit}
        :focus-visible{outline:3px solid var(--green);outline-offset:3px;border-radius:2px}
        .wrap{max-width:1180px;margin:0 auto;padding-left:max(20px,env(safe-area-inset-left,0px));padding-right:max(20px,env(safe-area-inset-right,0px))}
        .mono{font-family:var(--mono);font-size:12.5px;letter-spacing:.08em;text-transform:uppercase}
        h1,h2,h3,h4{font-family:var(--display);font-weight:400;text-transform:uppercase;line-height:.95;margin:0;text-wrap:balance;letter-spacing:.005em}
        h2{font-size:clamp(40px,5.4vw,72px)}
        h3{font-size:30px;line-height:1}
        p{margin:0;max-width:62ch}
        .x{color:var(--green)}
        .btn{display:inline-flex;align-items:center;gap:10px;font-family:var(--body);font-weight:700;font-size:15px;text-decoration:none;padding:13px 20px;border-radius:2px;border:2px solid var(--ink);color:var(--ink);background:transparent;cursor:pointer;transition:transform .25s var(--spring),background .2s}
        .btn:hover{transform:translateY(-3px)}
        .btn .ar{transition:transform .3s var(--spring)}
        .btn:hover .ar{transform:translateX(4px)}
        .btn.go{background:var(--green);border-color:var(--green);color:var(--green-ink)}
        .btn.sm{padding:9px 14px;font-size:14px}
        .btn.light{border-color:#fff;color:#fff}
        .ctas{display:flex;flex-wrap:wrap;gap:12px;margin-top:30px}



        /* ===== hero: one static frame ===== */
        .hero{position:relative;min-height:clamp(540px,80vh,780px);display:flex;align-items:flex-end;background:#000;color:#fff;overflow:hidden}
        .hero img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 40%}
        .hero .shade{position:absolute;inset:0;background:linear-gradient(90deg,rgba(0,0,0,.84) 0%,rgba(0,0,0,.5) 55%,rgba(0,0,0,.15) 100%),linear-gradient(0deg,rgba(0,0,0,.6),transparent 45%)}
        .hero .txt{position:relative;width:100%;padding-block:120px 72px}
        .hero h1{font-size:clamp(56px,9vw,128px);max-width:10ch;color:#fff}
        .hero h1 span{color:#6FD46F}
        .hero .sub{font-size:clamp(17px,1.6vw,21px);color:rgba(255,255,255,.85);margin-top:22px;max-width:44ch}
        .hero-go{padding:16px 26px;font-size:16px}
        .hero-ghost{padding:16px 24px;font-size:16px}
        @media (max-width:640px){.hero .txt{padding-block:96px 44px}.hero .ctas .btn{flex:1 1 100%;justify-content:center}}

        /* sections reached from the navbar stop below the sticky bar */
        .kk-home section[id]{scroll-margin-top:88px}

        /* added-to-cart state on buttons */
        .btn[disabled]{opacity:.55;cursor:not-allowed;transform:none}

        /* 22 billion band */
        .stat{display:grid;grid-template-columns:1.15fr .85fr;gap:48px;align-items:end;border-top:2px solid var(--ink);padding-top:28px}
        .stat>*{min-width:0}
        .stat b{display:block;font-family:var(--display);font-weight:400;font-size:clamp(84px,13vw,190px);line-height:.88;letter-spacing:-.01em}
        .stat b em{font-style:normal;color:var(--green)}
        .stat h2{font-size:clamp(30px,3.6vw,46px);margin-top:14px}
        .stat p{color:var(--muted);font-size:18px}
        @media (max-width:860px){.stat{grid-template-columns:1fr;gap:20px}}
        .nums3{grid-template-columns:repeat(3,1fr);margin-top:64px}
        @media (max-width:860px){.nums3{grid-template-columns:1fr 1fr}}

        /* trade-in on the dark band */
        .band .steps{border-top-color:var(--band-fg)}
        .band .steps li+li{border-left-color:var(--band-line)}
        .band .steps h4{color:var(--band-fg)}
        .band .steps p{color:var(--band-muted)}
        @media (max-width:820px){.band .steps li,.band .steps li+li{border-bottom-color:var(--band-line)}}
        /* sections */
        section.std .wrap{padding-block:100px}
        .sep{border-top:1px solid var(--line)}
        .head{display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:end;margin-bottom:52px}
        .head>*{min-width:0}
        .head p{color:var(--muted)}
        @media (max-width:860px){.head{grid-template-columns:1fr;gap:18px}}
        .rv{transition:transform 1s cubic-bezier(.2,.8,.2,1)}
        .js .rv:not(.in){transform:translateY(36px)}

        /* numbers */
        .nums{display:grid;grid-template-columns:repeat(4,1fr);border-top:2px solid var(--ink)}
        .num{padding:26px 24px 0 0;min-width:0}
        .num+.num{padding-left:24px;border-left:1px solid var(--line)}
        .num b{display:block;font-family:var(--display);font-weight:400;font-size:clamp(52px,6vw,80px);line-height:1;font-variant-numeric:tabular-nums}
        .num b em{font-style:normal;color:var(--green)}
        .num span{color:var(--muted);font-size:15px}
        @media (max-width:860px){.nums{grid-template-columns:1fr 1fr;row-gap:28px}.num:nth-child(3){padding-left:0;border-left:0}}

        /* mission band */
        .band{background:var(--band);color:var(--band-fg)}
        .band .wrap{padding-block:100px}
        .band p{color:var(--band-muted)}
        .manifesto{font-family:var(--display);text-transform:uppercase;font-size:clamp(42px,6.4vw,92px);line-height:.98;max-width:15ch;text-wrap:balance;color:var(--band-fg)}
        .manifesto span{color:var(--band-green)}
        .film{display:grid;grid-template-columns:1.35fr .65fr;gap:44px;align-items:end;margin-top:64px}
        .film>*{min-width:0}
        .film video{width:100%;max-width:100%;aspect-ratio:16/9;display:block;background:#000;border:1px solid var(--band-line)}
        .film h3{color:var(--band-fg);font-size:36px;margin-bottom:12px}
        @media (max-width:860px){.film{grid-template-columns:1fr;gap:22px}}

        /* pillars */
        .pillars{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
        .pillar{background:var(--card);border:1px solid var(--line);padding:30px 28px;display:flex;flex-direction:column;gap:14px;min-width:0;transition:transform .4s var(--spring),border-color .2s}
        .pillar:hover{transform:translateY(-6px);border-color:var(--ink)}
        .verb{font-family:var(--display);font-size:68px;line-height:.9;text-transform:uppercase}
        .pillar p{font-size:16px;color:var(--muted)}
        @media (max-width:960px){.pillars{grid-template-columns:1fr}}

        /* services */
        .svcs{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}
        .svc{background:var(--card);border:1px solid var(--line);padding:26px 22px;display:flex;flex-direction:column;gap:12px;min-width:0;position:relative;transition:transform .4s var(--spring),border-color .2s}
        .svc:hover{transform:translateY(-6px);border-color:var(--ink)}
        .svc.free{background:var(--tint);border-color:var(--tint)}
        .svc .time{display:inline-flex;align-items:center;gap:8px;color:var(--muted)}
        .svc .time::before{content:"";width:8px;height:8px;border-radius:50%;background:var(--green)}
        .svc h3{font-size:32px}
        .svc p{font-size:15px;color:var(--muted)}
        .svc .price{margin-top:auto;font-family:var(--display);font-size:46px;line-height:1;font-variant-numeric:tabular-nums;padding-top:8px}
        .svc .price small{font-family:var(--mono);font-size:12px;color:var(--muted);letter-spacing:.06em;margin-left:6px}
        .svc .btn{align-self:flex-start}
        .svc .pic{margin:-26px -22px 8px;aspect-ratio:4/3;overflow:hidden;background:var(--line);display:grid;place-items:center;color:rgba(0,0,0,.18)}
        .svc.free .pic{background:rgba(0,0,0,.06)}
        .svc .pic img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .6s var(--spring)}
        .svc:hover .pic img{transform:scale(1.06)}
        .svc .pic svg{width:44%;height:auto}
        .svc .pic.loading{background:linear-gradient(90deg,var(--line) 0%,rgba(255,255,255,.6) 50%,var(--line) 100%);background-size:200% 100%;animation:svcShimmer 1.4s linear infinite}
        @keyframes svcShimmer{to{background-position:-200% 0}}
        .svc .flag{z-index:2}
        .svc .btn{margin-top:4px}
        .flag{position:absolute;top:-1px;right:-1px;background:var(--green);color:var(--green-ink);font-family:var(--mono);font-size:11px;letter-spacing:.1em;text-transform:uppercase;padding:5px 9px}
        @media (max-width:1000px){.svcs{grid-template-columns:1fr 1fr}}
        @media (max-width:540px){.svcs{grid-template-columns:1fr}}

        /* bundle picker */
        .picker{margin-top:28px;border:2px solid var(--ink);display:grid;grid-template-columns:1.1fr .9fr;background:var(--card)}
        .picker>*{min-width:0}
        .pk-l{padding:32px;border-right:1px solid var(--line)}
        .pk-l h3{font-size:40px;margin-bottom:8px}
        .pk-l p{color:var(--muted);font-size:15.5px}
        .seg{display:grid;grid-template-columns:repeat(5,1fr);gap:0;margin-top:26px;border:1.5px solid var(--ink);position:relative}
        .seg button{position:relative;z-index:1;background:none;border:0;padding:14px 4px;font-family:var(--display);font-size:28px;color:var(--ink);cursor:pointer;line-height:1;transition:color .3s}
        .seg button small{display:block;font-family:var(--mono);font-size:10.5px;letter-spacing:.08em;margin-top:6px;color:var(--muted);transition:color .3s}
        .seg button[aria-checked="true"],.seg button[aria-checked="true"] small{color:var(--green-ink)}
        .seg .pill{position:absolute;top:0;bottom:0;left:0;width:20%;background:var(--green);transition:transform .55s var(--spring)}
        .pairs{display:flex;flex-wrap:wrap;gap:6px;margin-top:22px;min-height:30px}
        .pairs i{width:22px;height:12px;border-radius:7px 9px 3px 3px;background:var(--ink);display:block;animation:pop .45s var(--spring) both;animation-delay:calc(var(--i)*25ms)}
        @keyframes pop{from{transform:scale(0)}to{transform:none}}
        .pk-r{padding:32px;display:flex;flex-direction:column;gap:6px;justify-content:center}
        .pk-r .bname{font-family:var(--display);font-size:46px;line-height:1;text-transform:uppercase}
        .pk-r .total{font-family:var(--display);font-size:clamp(64px,7vw,96px);line-height:1;color:var(--green);font-variant-numeric:tabular-nums;margin-top:6px}
        .pk-r .meta{display:flex;gap:18px;flex-wrap:wrap;color:var(--muted);font-size:15px;font-variant-numeric:tabular-nums}
        .pk-r .save{display:inline-block;align-self:flex-start;margin-top:10px;background:var(--tint);color:var(--ink);font-family:var(--mono);font-size:12.5px;letter-spacing:.06em;text-transform:uppercase;padding:6px 10px}
        .pk-r .btn{margin-top:18px;align-self:flex-start}
        @media (max-width:860px){.picker{grid-template-columns:1fr}.pk-l{border-right:0;border-bottom:1px solid var(--line)}.seg button{font-size:22px}}

        .note{margin-top:18px;color:var(--muted);font-size:14.5px}

        /* gift vouchers */
        .gift{margin-top:28px;display:grid;grid-template-columns:.9fr 1.1fr;background:var(--band);color:var(--band-fg)}
        .gift>*{min-width:0}
        .gift-l{padding:34px 32px;display:flex;flex-direction:column;gap:14px;border-right:1px solid var(--band-line)}
        .gift-l h3{font-size:42px;color:var(--band-fg)}
        .gift-l p{color:var(--band-muted);font-size:15.5px}
        .gift-l .btn{align-self:flex-start;margin-top:6px}
        .vouchers{list-style:none;margin:0;padding:16px 32px;display:grid;align-content:center}
        .vouchers li{display:grid;grid-template-columns:1fr auto auto;gap:18px;align-items:baseline;padding-block:13px;border-bottom:1px dashed var(--band-line);transition:padding .35s var(--spring)}
        .vouchers li:last-child{border-bottom:0}
        .vouchers li:hover{padding-left:10px}
        .v-n{font-family:var(--display);font-size:24px;text-transform:uppercase}
        .v-p{font-family:var(--mono);font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:var(--band-muted)}
        .vouchers b{font-family:var(--display);font-weight:400;font-size:28px;color:var(--band-green);font-variant-numeric:tabular-nums;min-width:3.2ch;text-align:right}
        @media (max-width:860px){.gift{grid-template-columns:1fr}.gift-l{border-right:0;border-bottom:1px solid var(--band-line)}.vouchers{padding:8px 24px 16px}}

        /* before / after */
        .ba{display:grid;grid-template-columns:1fr 1fr;gap:16px}
        .ba figure{margin:0;position:relative;overflow:hidden;aspect-ratio:3/4;max-width:100%;background:var(--line)}
        .ba img{width:100%;height:100%;object-fit:cover;display:block;transition:transform 1.4s cubic-bezier(.2,.8,.2,1)}
        .ba figure:hover img{transform:scale(1.04)}
        .ba figcaption{position:absolute;left:16px;top:16px;background:#000;color:#fff;font-family:var(--mono);font-size:12px;letter-spacing:.12em;padding:6px 10px}
        .ba .after figcaption{background:var(--green)}
        .js .ba .after:not(.in) img{clip-path:inset(0 0 0 100%)}
        .ba .after img{transition:clip-path 1.3s var(--swift),transform 1.4s cubic-bezier(.2,.8,.2,1)}
        @media (max-width:560px){.ba{grid-template-columns:1fr}}

        /* steps */
        .steps{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(3,1fr);border-top:2px solid var(--ink);counter-reset:s}
        .steps li{padding:24px 28px 0 0;display:flex;flex-direction:column;gap:10px;counter-increment:s;min-width:0}
        .steps li+li{padding-left:28px;border-left:1px solid var(--line)}
        .steps li::before{content:counter(s,decimal-leading-zero);font-family:var(--display);font-size:56px;line-height:1;color:var(--green)}
        .steps h4{font-size:30px}
        .steps p{font-size:15.5px;color:var(--muted)}
        @media (max-width:820px){.steps{grid-template-columns:1fr}.steps li,.steps li+li{padding:24px 0;border-left:0;border-bottom:1px solid var(--line)}}

        /* care guide */
        .guide{display:grid;grid-template-columns:240px 1fr;border:2px solid var(--ink);background:var(--card)}
        .guide>*{min-width:0}
        .tabs{display:flex;flex-direction:column;border-right:1px solid var(--line)}
        .tab{font-family:var(--display);font-size:25px;text-transform:uppercase;text-align:left;padding:17px 22px;background:transparent;border:0;border-bottom:1px solid var(--line);color:var(--muted);cursor:pointer;display:flex;justify-content:space-between;align-items:center;transition:background .2s,color .2s}
        .tab[aria-selected="true"]{color:var(--ink);background:var(--tint)}
        .tab[aria-selected="true"]::after{content:"→";color:var(--green);font-family:var(--body);font-size:18px}
        .panel{padding:32px 36px}
        .panel:not([hidden]){animation:fadeup .5s ease both}
        .panel h4{font-size:38px;margin-bottom:6px}
        .panel .sub{color:var(--muted);margin-bottom:22px}
        .dodont{display:grid;grid-template-columns:1fr 1fr;gap:28px}
        .dodont>div{min-width:0}
        .dodont b{display:block;font-family:var(--mono);font-size:12px;letter-spacing:.1em;text-transform:uppercase;font-weight:500;margin-bottom:10px}
        .dodont .do b{color:var(--green)}.dodont .dont b{color:var(--muted)}
        .dodont ul{margin:0;padding:0;list-style:none;display:grid;gap:10px;font-size:15.5px}
        .dodont li{display:flex;gap:10px}
        .dodont .do li::before{content:"";flex:none;width:8px;height:8px;margin-top:8px;background:var(--green)}
        .dodont .dont li::before{content:"";flex:none;width:8px;height:2px;margin-top:11px;background:var(--muted)}
        @media (max-width:820px){.guide{grid-template-columns:1fr}.tabs{flex-direction:row;overflow-x:auto;border-right:0;border-bottom:1px solid var(--line)}.tab{border-bottom:0;border-right:1px solid var(--line);white-space:nowrap;font-size:20px;padding:14px 16px}.tab[aria-selected="true"]::after{content:none}.panel{padding:24px 20px}.dodont{grid-template-columns:1fr}}

        /* business */
        .split2{display:grid;grid-template-columns:1fr 1fr;gap:20px}
        .aud{padding:34px 30px;display:flex;flex-direction:column;gap:14px;min-width:0;border:2px solid var(--ink)}
        .aud.biz{background:var(--tint);border-color:var(--tint)}
        .aud ul{margin:0;padding:0;list-style:none;display:grid;gap:8px;font-size:15.5px}
        .aud li{display:flex;gap:10px}
        .aud li::before{content:"";flex:none;width:8px;height:8px;margin-top:8px;background:var(--green)}
        .aud p{color:var(--muted)}
        .aud .btn{margin-top:auto;align-self:flex-start}
        @media (max-width:820px){.split2{grid-template-columns:1fr}}

        /* contact */
        .contact{display:grid;grid-template-columns:1.2fr .8fr;gap:48px;align-items:end}
        .contact>*{min-width:0}
        .contact h2 span{color:var(--band-green)}
        .cards{display:grid;gap:0;border-top:1px solid var(--band-line)}
        .cards div{display:grid;grid-template-columns:110px 1fr;gap:12px;padding-block:14px;border-bottom:1px solid var(--band-line);align-items:baseline}
        .cards .mono{color:var(--band-muted)}
        .cards a,.cards span{color:var(--band-fg);font-size:17px;text-decoration:none;user-select:all;overflow-wrap:anywhere}
        .sdgs{display:flex;flex-wrap:wrap;gap:10px;margin-top:40px}
        .sdgs span{border:1px solid var(--band-line);padding:8px 12px;font-size:14px;color:var(--band-muted)}
        .sdgs b{font-family:var(--display);font-weight:400;color:var(--band-green);font-size:18px;margin-right:8px}
        @media (max-width:860px){.contact{grid-template-columns:1fr}}

        @media (prefers-reduced-motion:reduce){
          html{scroll-behavior:auto}
          *,*::before,*::after{animation-duration:.01ms!important;animation-delay:0s!important;transition-duration:.01ms!important}
          .ticker .track{animation:none}
          .js .rv:not(.in){transform:none}
          .js .ba .after:not(.in) img{clip-path:none}
        }
      `}</style>

      <div id="top">
        {/* HERO */}
        <section className="hero" aria-labelledby="heroT">
          <img src="images/before-after.jpg" alt="White sneakers caked in dirt beside the same pair after a KleanKickx clean" fetchPriority="high" />
          <div className="shade"></div>
          <div className="wrap txt">
            <h1 id="heroT">Sneaker care in <span>Accra.</span></h1>
            <p className="sub">Cleaned and restored by hand at our studio on Golf Hills St. We pick up, Klean and deliver back across Accra.</p>
            <div className="ctas">
              <a className="btn go hero-go" href="#services">Book a Klean <span className="ar" aria-hidden="true">→</span></a>
              <a className="btn light hero-ghost" href="#bundles">See bundles</a>
            </div>
          </div>
        </section>

        {/* SERVICES & PACKAGES: second on the page so prices are one scroll away */}
        <section className="std" id="services" aria-labelledby="sT">
          <div className="wrap">
            <div className="head">
              <h2 id="sT">Pick your Klean.</h2>
              <p>Priced per pair, in GHS, taxes included. Drop off at the studio or add pickup and delivery at checkout (fees apply). Your first Standard Klean is free when you sign up.</p>
            </div>
            <div className="svcs rv">
              <article className="svc free">
                <span className="flag">New users</span>
                <ServicePhoto images={serviceImages} kind="free" alt="Sneakers after a Standard Klean" />
                <span className="time mono">Back in 72h</span>
                <h3>First Klean free</h3>
                <p>A free Standard Klean when you sign up. One per account.</p>
                <div className="price">₵0</div>
                {!isAuthenticated
                  ? <Link className="btn go sm" to="/auth/register">{freeLabel}</Link>
                  : freeUsed
                    ? <button type="button" className="btn sm" disabled>{freeLabel}</button>
                    : <AddButton service={catalog?.free} className="btn go sm">{freeLabel}</AddButton>}
              </article>
              <article className="svc">
                <ServicePhoto images={serviceImages} kind="standard" alt="Standard Klean" />
                <span className="time mono">Back in 72h</span>
                <h3>Standard Klean</h3>
                <p>The whole shoe cleaned: uppers, midsoles, soles, insoles and laces. For regular care.</p>
                <div className="price">₵50<small>/ pair</small></div>
                <AddButton service={catalog?.standard} />
              </article>
              <article className="svc">
                <span className="flag">Next day</span>
                <ServicePhoto images={serviceImages} kind="priority" alt="Priority Klean" />
                <span className="time mono">Back next day</span>
                <h3>Priority Klean</h3>
                <p>The Standard Klean, back to you the next day.</p>
                <div className="price">₵70<small>/ pair</small></div>
                <AddButton service={catalog?.priority} />
              </article>
              <article className="svc">
                <ServicePhoto images={serviceImages} kind="deep" alt="Deep Klean" />
                <span className="time mono">Back in 72h</span>
                <h3>Deep Klean</h3>
                <p>For stubborn stains, embedded dirt and tired midsoles. For pairs that need real restoration.</p>
                <div className="price">₵80<small>/ pair</small></div>
                <AddButton service={catalog?.deep} />
              </article>
            </div>

            {/* BUNDLE PICKER */}
            <div className="picker rv" id="bundles">
              <div className="pk-l">
                <h3>Bundles. Bring the whole rotation.</h3>
                <p>Standard Klean for every pair. The more pairs, the less each one costs.</p>
                <div className="seg" role="radiogroup" aria-label="Number of pairs">
                  <span className="pill" aria-hidden="true" style={{ transform: `translateX(${bundleIndex * 100}%)` }}></span>
                  {bundleKeys.map((n) => {
                    const num = parseInt(n, 10);
                    return (
                      <button
                        key={n}
                        type="button"
                        role="radio"
                        aria-checked={bundleSelection === num}
                        data-n={n}
                        onClick={() => setBundleSelection(num)}
                        tabIndex={bundleSelection === num ? 0 : -1}
                      >
                        {n}
                        <small>{num === 1 ? 'pair' : 'pairs'}</small>
                      </button>
                    );
                  })}
                </div>
                <div className="pairs" aria-hidden="true">
                  {Array.from({ length: bundleSelection }).map((_, i) => (
                    <i key={i} style={{ '--i': i }}></i>
                  ))}
                </div>
              </div>
              <div className="pk-r" aria-live="polite">
                <div className="bname">{selectedBundle.name}</div>
                <div className="total">₵{selectedBundle.total}</div>
                <div className="meta">
                  <span>₵{(selectedBundle.total / bundleSelection).toFixed(2)} per pair</span>
                  <span>Back in 72h</span>
                </div>
                <span className="save">
                  {bundleSelection * 50 - selectedBundle.total > 0
                    ? `Save ₵${bundleSelection * 50 - selectedBundle.total} vs single pairs`
                    : 'Standard price'}
                </span>
                <AddButton service={selectedService} className="btn go">
                  Add {selectedBundle.name} to cart <span className="ar" aria-hidden="true">→</span>
                </AddButton>
              </div>
            </div>
            <p className="note">One pair is a left and a right shoe. Pay at checkout by Mobile Money or card.</p>

            {/* GIFT VOUCHERS */}
            <div className="gift rv" id="vouchers">
              <div className="gift-l">
                <h3>Gift a Klean.</h3>
                <p>Pick a voucher, pay, and it arrives in their inbox. Valid for 6 months.</p>
                <Link className="btn go" to="/vouchers">Buy a voucher <span className="ar" aria-hidden="true">→</span></Link>
              </div>
              <ul className="vouchers">
                <li><span className="v-n">Standard Klean</span><span className="v-p">1 pair</span><b>₵50</b></li>
                <li><span className="v-n">Deep Klean</span><span className="v-p">1 pair</span><b>₵80</b></li>
                <li><span className="v-n">Triple Threat</span><span className="v-p">3 pairs</span><b>₵130</b></li>
                <li><span className="v-n">Clean Krew</span><span className="v-p">5 pairs</span><b>₵210</b></li>
                <li><span className="v-n">Sneakers Squad</span><span className="v-p">10 pairs</span><b>₵410</b></li>
              </ul>
            </div>
          </div>
        </section>

        {/* 22 BILLION */}
        <section className="std sep" aria-labelledby="gT">
          <div className="wrap">
            <div className="stat rv">
              <div>
                <b>22<em>B</em></b>
                <h2 id="gT">Pairs discarded globally.</h2>
              </div>
              <p>Every year, about 22 billion pairs of shoes are sent to landfill or burned, out of roughly 24 billion made. Most of them still had wear left. A Klean keeps a pair in use.</p>
            </div>
            <div className="nums nums3 rv">
              <div className="num"><b data-count="450">450<em>+</em></b><span>Happy clients</span></div>
              <div className="num"><b data-count="1200">1,200<em>+</em></b><span>Sneakers Kleaned</span></div>
              <div className="num"><b>4.8<em>★</em></b><span>Google rating</span></div>
            </div>
          </div>
        </section>

        {/* TRADE-IN */}
        <section className="band" id="trade-in" aria-labelledby="tiT">
          <div className="wrap">
            <div className="head">
              <h2 id="tiT" style={{ color: 'var(--band-fg)' }}>Trade-In.</h2>
              <p>Bring the pairs you no longer wear. We check every one by hand and nothing goes to landfill.</p>
            </div>
            <ol className="steps rv">
              <li><h4>Bring them in</h4><p>Drop pairs at the studio on Golf Hills St, or hand them over with your next pickup.</p></li>
              <li><h4>We sort by hand</h4><p>Wearable pairs are Kleaned and go back into use.</p></li>
              <li><h4>Nothing to landfill</h4><p>Pairs past saving go to our partner <a href="https://kicksctrl.com" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline' }}>KicksCTRL</a> for material recovery.</p></li>
            </ol>
            <div className="ctas">
              <a className="btn go" href={WHATSAPP_TRADE_IN} target="_blank" rel="noopener noreferrer">Arrange a trade-in <span className="ar" aria-hidden="true">→</span></a>
              <Link className="btn light" to="/impact">Our impact</Link>
            </div>
          </div>
        </section>

        {/* MISSION */}
        <section className="std" id="mission" aria-labelledby="mT">
          <div className="wrap">
            <h2 id="mT" className="rv" style={{ maxWidth: '15ch' }}>Every pair we Klean is a pair that <span className="x">doesn't get replaced.</span></h2>
            <p style={{ marginTop: '30px', fontSize: '19px', maxWidth: '58ch', color: 'var(--muted)' }}>
              Accra runs on sneaker culture, and pairs get thrown out the moment they look tired. We give them their years back through care and restoration, and the pairs that can't be saved go to recovery instead of landfill.
            </p>
            {/* Brand film (public/video/kleankickx-film.mp4) is off the page until it is re-cut:
                its opening frame shows the unsourced "300 million pairs" figure. */}
          </div>
        </section>

        {/* APPROACH */}
        <section className="std sep" aria-labelledby="aT">
          <div className="wrap">
            <div className="head">
              <h2 id="aT">Clean. Restore. Protect.</h2>
              <p>What happens to every pair that comes through the studio.</p>
            </div>
            <div className="pillars rv">
              <article className="pillar"><div className="verb">Clean<span className="x">.</span></div><p>Material-specific cleaning by hand and machine. The right brush, the right solution and the right drying for leather, suede, mesh and knit.</p></article>
              <article className="pillar"><div className="verb">Restore<span className="x">.</span></div><p>Stubborn stains, embedded dirt and tired midsoles brought back. We fix what usually gets a pair thrown out.</p></article>
              <article className="pillar"><div className="verb">Protect<span className="x">.</span></div><p>Every pair is quality-checked, packed and returned with Klean tips, so it stays fresh between visits.</p></article>
            </div>
          </div>
        </section>

        {/* BEFORE / AFTER */}
        <section className="std sep" aria-labelledby="baT">
          <div className="wrap">
            <div className="head">
              <h2 id="baT">Same pair. Days apart.</h2>
              <p>A real Deep Klean from the studio. Midsoles brightened, grime lifted from the mesh, laces refreshed.</p>
            </div>
            <div className="ba">
              <figure className="before"><img src="images/before.jpg" alt="Black and white sneakers before cleaning, with grey, grimy midsoles" loading="lazy" /><figcaption>BEFORE</figcaption></figure>
              <figure className="after rv"><img src="images/after.jpg" alt="The same sneakers after a KleanKickx Deep Klean, with bright white midsoles" loading="lazy" /><figcaption>AFTER</figcaption></figure>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="std sep" id="how" aria-labelledby="hT">
          <div className="wrap">
            <div className="head">
              <h2 id="hT">Three steps.</h2>
              <p>Add your Klean to the cart, pay by Mobile Money or card, and we take it from there.</p>
            </div>
            <ol className="steps rv">
              <li><h4>Book a Klean</h4><p>Add a service to your cart and choose pickup or drop-off at checkout.</p></li>
              <li><h4>We Klean &amp; restore</h4><p>Trained technicians clean and restore your pair by hand at the studio.</p></li>
              <li><h4>Back to you fresh</h4><p>Quality-checked, packed and returned, usually within 72 hours. Priority comes back next day.</p></li>
            </ol>
          </div>
        </section>

        {/* CARE GUIDE */}
        <section className="std sep" id="care" aria-labelledby="cgT">
          <div className="wrap">
            <div className="head">
              <h2 id="cgT">Klean tips.</h2>
              <p>Pick your material for the habits that add the most life.</p>
            </div>
            <div className="guide">
              <div className="tabs" role="tablist" aria-label="Sneaker materials">
                {careTabs.map((tab, i) => (
                  <button
                    key={tab.id}
                    className="tab"
                    role="tab"
                    id={`tab-${tab.id}`}
                    aria-controls={`panel-${tab.id}`}
                    aria-selected={activeTab === tab.id}
                    tabIndex={activeTab === tab.id ? 0 : -1}
                    onClick={() => handleTabClick(tab.id)}
                    onKeyDown={(e) => handleTabKeyDown(e, i)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <div className="panel" role="tabpanel" id={`panel-${activeTab}`} aria-labelledby={`tab-${activeTab}`}>
                <h4>{careTabs.find((t) => t.id === activeTab)?.label}</h4>
                <p className="sub">{careContent[activeTab].subtitle}</p>
                <div className="dodont">
                  <div className="do">
                    <b>Do</b>
                    <ul>{careContent[activeTab].do.map((item, i) => <li key={i}>{item}</li>)}</ul>
                  </div>
                  <div className="dont">
                    <b>Don't</b>
                    <ul>{careContent[activeTab].dont.map((item, i) => <li key={i}>{item}</li>)}</ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* BUSINESS */}
        <section className="std sep" id="business" aria-labelledby="buT">
          <div className="wrap">
            <div className="head">
              <h2 id="buT">For you. For your team.</h2>
              <p>One pair or twenty, we'll keep them fresh.</p>
            </div>
            <div className="split2 rv">
              <article className="aud">
                <h3>Sneakerheads &amp; everyday wearers</h3>
                <p>From your grails to your daily pair.</p>
                <ul><li>First Standard Klean free</li><li>Next-day Priority Klean when you can't wait</li><li>Pickup and delivery across Accra</li></ul>
                <a className="btn go" href="#services">Book a Klean <span className="ar" aria-hidden="true">→</span></a>
              </article>
              <article className="aud biz">
                <h3>Gyms, schools, teams &amp; retailers</h3>
                <p>Sneakers Squad (10 pairs, ₵41 a pair) and VIP Klean (20 pairs, ₵40 a pair) bring the price down.</p>
                <ul><li>Bulk cleaning for teams and squads</li><li>Care offers for sneaker retailers</li><li>Pop-up cleaning for events</li></ul>
                <a className="btn" href="#contact">Talk to us</a>
              </article>
            </div>
          </div>
        </section>

        {/* CONTACT */}
        <section className="band" id="contact" aria-labelledby="ctT">
          <div className="wrap">
            <div className="contact">
              <div>
                <h2 id="ctT" style={{ color: 'var(--band-fg)' }}>Leave your sneakers <span>in our care.</span></h2>
                <div className="ctas">
                  <a className="btn go" href="#services">Book a Klean <span className="ar" aria-hidden="true">→</span></a>
                </div>
              </div>
              <div className="cards">
                <div><span className="mono">Phone</span><a href="tel:+233536278834">+233 53 627 8834</a></div>
                <div><span className="mono">WhatsApp</span><a href="https://wa.me/233536278834" target="_blank" rel="noopener noreferrer">+233 53 627 8834</a></div>
                <div><span className="mono">Email</span><a href="mailto:info@kleankickx.com">info@kleankickx.com</a></div>
                <div><span className="mono">Studio</span><span>29 Golf Hills St, Accra</span></div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
};

export default Home;
