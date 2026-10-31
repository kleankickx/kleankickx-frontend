import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  // --- State & Refs ---
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  const [bundleSelection, setBundleSelection] = useState(5);
  const [activeTab, setActiveTab] = useState('leather');

  const slideshowRef = useRef(null);
  const revealObserverRef = useRef(null);
  const countObserverRef = useRef(null);

  const bundles = {
    1: { name: 'Standard Klean', total: 50, label: 'Book a Standard Klean' },
    3: { name: 'Triple Threat', total: 130, label: 'Add 3-pair bundle' },
    5: { name: 'Clean Krew', total: 210, label: 'Add 5-pair bundle' },
    10: { name: 'Sneakers Squad', total: 410, label: 'Add 10-pair bundle' },
    20: { name: 'VIP Klean', total: 800, label: 'Add 20-pair bundle' },
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

  const slides = [
    {
      label: 'Why we exist',
      title: '300 million pairs binned.',
      highlight: 'Yearly.',
      sub: "That's how many shoes Africa discards annually. In Ghana, many end up in landfills, polluting soil and water. Most of them still had years left.",
      image: 'images/market.jpg',
      alt: 'A trader opening a sack of secondhand sneakers beside piles of shoes at an Accra market',
      imageClass: '',
    },
    {
      label: 'Before you bin them',
      title: "Most aren't done. They're",
      highlight: 'dirty.',
      sub: 'Stains, grime and yellowed soles are fixable. Cleaning, sole whitening, deodorizing and minor restoration, by hand, every day.',
      image: 'images/before-after.jpg',
      alt: 'White sneakers before cleaning, caked in dirt, beside the same pair after a KleanKickx clean, bright white',
      imageClass: 'top',
    },
    {
      label: 'The KleanKickx studio · 29 Golf Hills St, Accra',
      title: 'Clean. Restore.',
      highlight: 'Protect.',
      sub: 'We pick up your dirty kicks, Klean them by hand with a controlled care system, and deliver them fresh. Typically within 72 hours.',
      image: 'images/store.jpg',
      alt: 'A KleanKickx technician cleaning sneakers at the studio machine, with shelves of restored pairs',
      imageClass: '',
      isStore: true,
    },
  ];

  // --- Slideshow Logic ---
  const goToSlide = useCallback((index) => {
    setCurrentSlide((prev) => (index === prev ? prev : index));
  }, []);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  const shouldRun = !isPaused && !userPaused;

  // Auto-advance — single source of truth, timer drives the slideshow
  useEffect(() => {
    if (!shouldRun) return;
    const id = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6500);
    return () => clearInterval(id);
  }, [shouldRun, slides.length]);

  // Pause on hover/focus
  const handleMouseEnter = () => { if (!userPaused) setIsPaused(true); };
  const handleMouseLeave = () => { if (!userPaused) setIsPaused(false); };
  const handleFocusIn = () => { if (!userPaused) setIsPaused(true); };
  const handleFocusOut = () => { if (!userPaused) setIsPaused(false); };

  // Visibility change
  useEffect(() => {
    const handleVisibility = () => { if (!userPaused) setIsPaused(document.hidden); };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [userPaused]);

  // Swipe
  const touchStartX = useRef(null);
  const handlePointerDown = (e) => { touchStartX.current = e.clientX; };
  const handlePointerUp = (e) => {
    if (touchStartX.current === null) return;
    const dx = e.clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(dx) > 50) {
      if (dx < 0) nextSlide(); else prevSlide();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowRight') nextSlide();
    if (e.key === 'ArrowLeft') prevSlide();
  };

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
          --body:"Instrument Sans",system-ui,-apple-system,"Segoe UI",sans-serif;
          --mono:"IBM Plex Mono",ui-monospace,Menlo,monospace;
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
        .eyebrow{color:var(--green);margin-bottom:20px;display:flex;gap:10px;align-items:center}
        .eyebrow::before{content:"";width:28px;height:2px;background:var(--green)}
        .btn{display:inline-flex;align-items:center;gap:10px;font-family:var(--body);font-weight:700;font-size:15px;text-decoration:none;padding:13px 20px;border-radius:2px;border:2px solid var(--ink);color:var(--ink);background:transparent;cursor:pointer;transition:transform .25s var(--spring),background .2s}
        .btn:hover{transform:translateY(-3px)}
        .btn .ar{transition:transform .3s var(--spring)}
        .btn:hover .ar{transform:translateX(4px)}
        .btn.go{background:var(--green);border-color:var(--green);color:var(--green-ink)}
        .btn.sm{padding:9px 14px;font-size:14px}
        .btn.light{border-color:#fff;color:#fff}
        .ctas{display:flex;flex-wrap:wrap;gap:12px;margin-top:30px}


        /* ===== hero slideshow ===== */
        .show{position:relative;height:clamp(560px,80vh,820px);overflow:hidden;background:#000;color:#fff;touch-action:pan-y}
        .slide{position:absolute;inset:0;clip-path:inset(0 0 0 100%);z-index:0}
        .slide.on{clip-path:inset(0 0 0 0);z-index:2}
        .slide.leaving{clip-path:inset(0 0 0 0);z-index:1}
        .show.moving .slide.on{transition:clip-path 1.15s var(--swift)}
        .show.rev .slide:not(.on):not(.leaving){clip-path:inset(0 100% 0 0)}
        .slide .ph{position:absolute;inset:0;overflow:hidden}
        .slide img{width:100%;height:100%;object-fit:cover;display:block;transform:scale(1.06)}
        .slide.on img{animation:kb 9s cubic-bezier(.25,.1,.25,1) both}
        .slide:nth-child(2n).on img{animation-name:kb2}
        @keyframes kb{from{transform:scale(1.2) translate3d(2.5%,1%,0)}to{transform:scale(1.04) translate3d(0,0,0)}}
        @keyframes kb2{from{transform:scale(1.04) translate3d(-1%,0,0)}to{transform:scale(1.2) translate3d(2%,-1.5%,0)}}
        .slide img.top{object-position:50% 0;transform-origin:50% 0}
        .slide .shade{position:absolute;inset:0;background:linear-gradient(90deg,rgba(0,0,0,.82) 0%,rgba(0,0,0,.45) 50%,rgba(0,0,0,.08) 100%),linear-gradient(0deg,rgba(0,0,0,.55),transparent 40%)}
        .slide .txt{position:relative;height:100%;display:flex;flex-direction:column;justify-content:center;padding-block:40px 120px}
        .slide .lab{color:#6FD46F;display:flex;gap:12px;align-items:center;margin-bottom:22px}
        .slide .lab::before{content:"";height:2px;width:36px;background:#6FD46F;transform-origin:left}
        .slide h1{font-size:clamp(54px,8.6vw,124px);max-width:11.5ch;color:#fff}
        .slide h1 .w{display:inline-block;overflow:hidden;vertical-align:top;padding-right:.18em;margin-right:-.18em}
        .slide h1 .w>span{display:inline-block}
        .slide h1 .g{color:#6FD46F}
        .slide .sub{font-size:clamp(17px,1.6vw,20px);color:rgba(255,255,255,.82);margin-top:22px;max-width:46ch}
        .slide.play .lab::before{animation:grow .7s var(--swift) .35s both}
        .slide.play .lab span{animation:fadeup .6s ease .45s both}
        .slide.play h1 .w>span{animation:rise .95s var(--spring) both;animation-delay:calc(.5s + var(--i)*75ms)}
        .slide.play .sub{animation:fadeup .8s ease 1s both}
        .slide.play .ctas{animation:fadeup .8s ease 1.15s both}
        @keyframes rise{from{transform:translateY(112%) rotate(4deg)}to{transform:none}}
        @keyframes grow{from{transform:scaleX(0)}to{transform:none}}
        @keyframes fadeup{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}
        .wipe{position:absolute;inset:0 -20%;z-index:5;background:var(--green);transform:translateX(-120%) skewX(-14deg);pointer-events:none}
        .wipe.go{animation:wipe 1.15s var(--swift) both}
        .show.rev .wipe.go{animation-name:wipeR}
        @keyframes wipe{0%{transform:translateX(120%) skewX(-14deg)}100%{transform:translateX(-120%) skewX(-14deg)}}
        @keyframes wipeR{0%{transform:translateX(-120%) skewX(-14deg)}100%{transform:translateX(120%) skewX(-14deg)}}
        .slide .fallback{position:absolute;inset:0;background:radial-gradient(120% 90% at 85% 50%,#1F8E1F 0%,#0F4F0F 55%,#071F07 100%);display:none}
        .slide .fallback svg{position:absolute;right:6%;top:50%;width:min(42vw,520px);transform:translateY(-50%);opacity:.9}
        .slide.noimg .fallback{display:block}.slide.noimg .ph{display:none}
        .controls{position:absolute;z-index:6;left:0;right:0;bottom:0;padding-bottom:max(28px,env(safe-area-inset-bottom,0px))}
        .controls .wrap{display:flex;align-items:center;gap:20px}
        .bars{display:flex;gap:8px;flex:1;max-width:520px}
        .bars button{flex:1;height:30px;background:none;border:0;padding:0;cursor:pointer;display:flex;align-items:center}
        .bars i{display:block;height:3px;width:100%;background:rgba(255,255,255,.28);position:relative;overflow:hidden}
        .bars i::after{content:"";position:absolute;inset:0;background:#fff;transform:scaleX(0);transform-origin:left}
        .bars .done i::after{transform:none}
        .bars .on i::after{animation:fill 6.5s linear both}
        .show.paused .bars .on i::after{animation-play-state:paused}
        @keyframes fill{to{transform:none}}
        .count{font-family:var(--mono);font-size:13px;letter-spacing:.1em;color:rgba(255,255,255,.8);font-variant-numeric:tabular-nums;min-width:62px}
        .cbtn{width:44px;height:44px;border-radius:50%;border:1.5px solid rgba(255,255,255,.5);background:rgba(0,0,0,.25);color:#fff;display:grid;place-items:center;cursor:pointer;transition:background .2s,transform .3s var(--spring)}
        .cbtn:hover{background:rgba(255,255,255,.15);transform:scale(1.08)}
        .cbtn svg{width:16px;height:16px}

        /* ticker */
        .ticker{background:var(--green);color:var(--green-ink);overflow:hidden;white-space:nowrap;border-block:1px solid var(--green)}
        .ticker .track{display:inline-flex;gap:48px;padding-block:14px;animation:tick 32s linear infinite;will-change:transform}
        .ticker span{font-family:var(--display);font-size:26px;letter-spacing:.03em;display:inline-flex;align-items:center;gap:48px}
        .ticker span::after{content:"";width:10px;height:10px;border-radius:50%;background:var(--green-ink)}
        @keyframes tick{to{transform:translateX(-50%)}}

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
        .band .eyebrow{color:var(--band-green)}.band .eyebrow::before{background:var(--band-green)}
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
        .gift-l .eyebrow{color:var(--band-green);margin-bottom:0}.gift-l .eyebrow::before{background:var(--band-green)}
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
        footer .wrap{padding-block:30px;display:flex;flex-wrap:wrap;gap:12px 32px;justify-content:space-between;color:var(--muted);font-size:14px}
        footer nav{display:flex;align-items:center;gap:20px;flex-wrap:wrap}
        footer nav a{text-decoration:none;color:var(--muted)}

        @media (prefers-reduced-motion:reduce){
          html{scroll-behavior:auto}
          *,*::before,*::after{animation-duration:.01ms!important;animation-delay:0s!important;transition-duration:.01ms!important}
          .ticker .track{animation:none}
          .js .rv:not(.in){transform:none}
          .js .ba .after:not(.in) img{clip-path:none}
        }
      `}</style>

      <main id="top">
        {/* HERO SLIDESHOW */}
        <section
          className={`show ${!shouldRun ? 'paused' : ''}`}
          id="show"
          aria-roledescription="carousel"
          aria-label="KleanKickx stories"
          ref={slideshowRef}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onFocus={handleFocusIn}
          onBlur={handleFocusOut}
          onKeyDown={handleKeyDown}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          tabIndex={0}
        >
          {slides.map((slide, index) => {
            const isActive = index === currentSlide;
            return (
              <article
                key={`slide-${index}-${isActive ? 'on' : 'off'}`}
                className={`slide ${isActive ? 'on play' : ''}`}
                aria-roledescription="slide"
                aria-label={`${index + 1} of ${slides.length}`}
                aria-hidden={!isActive}
              >
                {slide.isStore ? (
                  <>
                    <div className="ph">
                      <img
                        src={slide.image}
                        alt={slide.alt}
                        className={slide.imageClass}
                        onError={(e) => e.currentTarget.closest('.slide')?.classList.add('noimg')}
                      />
                    </div>
                    <div className="fallback">
                      <svg viewBox="0 0 1080 1080" aria-hidden="true">
                        <circle cx="298" cy="256" r="122" fill="#6FD46F" />
                        <polygon points="113,1013 345,1013 500,763 655,1013 975,1013 588,617 975,136 475,136" fill="#0A0B0A" />
                      </svg>
                    </div>
                  </>
                ) : (
                  <div className="ph">
                    <img src={slide.image} alt={slide.alt} className={slide.imageClass} />
                  </div>
                )}
                <div className="shade"></div>
                <div className="wrap txt">
                  <div className="lab mono"><span>{slide.label}</span></div>
                  <h1>
                    {slide.title.split(' ').map((word, wi) => (
                      <React.Fragment key={wi}>
                        <span className="w">
                          <span style={{ '--i': wi }}>{word}</span>
                        </span>{' '}
                      </React.Fragment>
                    ))}
                    <span className="g">
                      <span className="w">
                        <span style={{ '--i': slide.title.split(' ').length }}>{slide.highlight}</span>
                      </span>
                    </span>
                  </h1>
                  <p className="sub">{slide.sub}</p>
                  {index === 2 && (
                    <div className="ctas">
                      <Link className="btn go" to="/services">
                        Schedule a Klean <span className="ar" aria-hidden="true">→</span>
                      </Link>
                      <a className="btn light" href="#bundles">See bundles</a>
                    </div>
                  )}
                </div>
              </article>
            );
          })}

          {/* keyed on currentSlide → remounts → wipe animation replays */}
          <div key={`wipe-${currentSlide}`} className="wipe go" aria-hidden="true"></div>

          <div className="controls">
            <div className="wrap">
              <div className="bars" role="group" aria-label="Choose slide">
                {slides.map((_, i) => (
                  <button
                    key={`bar-${i}-${i === currentSlide ? 'on' : i < currentSlide ? 'done' : 'idle'}`}
                    aria-label={`Go to slide ${i + 1}`}
                    aria-current={i === currentSlide ? 'true' : 'false'}
                    className={`${i < currentSlide ? 'done' : ''} ${i === currentSlide ? 'on' : ''}`}
                    onClick={() => goToSlide(i)}
                  >
                    <i></i>
                  </button>
                ))}
              </div>
              <span className="count" aria-live="polite">
                {String(currentSlide + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}
              </span>
              <button className="cbtn" onClick={prevSlide} aria-label="Previous slide">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10 3 5 8l5 5" />
                </svg>
              </button>
              <button
                className="cbtn"
                onClick={() => {
                  const next = !userPaused;
                  setUserPaused(next);
                  setIsPaused(next);
                }}
                aria-label={userPaused ? 'Play slideshow' : 'Pause slideshow'}
              >
                {userPaused ? (
                  <svg viewBox="0 0 16 16" fill="currentColor"><path d="M4 3l9 5-9 5z" /></svg>
                ) : (
                  <svg viewBox="0 0 16 16" fill="currentColor">
                    <rect x="4" y="3" width="3" height="10" />
                    <rect x="9" y="3" width="3" height="10" />
                  </svg>
                )}
              </button>
              <button className="cbtn" onClick={nextSlide} aria-label="Next slide">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m6 3 5 5-5 5" />
                </svg>
              </button>
            </div>
          </div>
        </section>

        <div className="ticker" aria-hidden="true">
          <div className="track">
            <span>Clean</span><span>Restore</span><span>Protect</span><span>Pickup &amp; delivery in Accra</span><span>Klean in 72 hours</span>
            <span>Clean</span><span>Restore</span><span>Protect</span><span>Pickup &amp; delivery in Accra</span><span>Klean in 72 hours</span>
          </div>
        </div>

        {/* NUMBERS */}
        <section className="std" aria-label="KleanKickx in numbers">
          <div className="wrap">
            <div className="nums rv">
              <div className="num"><b data-count="450">450<em>+</em></b><span>Happy clients</span></div>
              <div className="num"><b data-count="1200">1,200<em>+</em></b><span>Sneakers Kleaned</span></div>
              <div className="num"><b data-count="21000">21,000<em>+</em></b><span>Kg CO₂ emissions reduced</span></div>
              <div className="num"><b>4.8<em>★</em></b><span>Google rating, Golf Hills</span></div>
            </div>
          </div>
        </section>

        {/* MISSION */}
        <section className="band" id="mission" aria-labelledby="mT">
          <div className="wrap">
            <div className="eyebrow mono" id="mT">Our mission</div>
            <p className="manifesto rv">Every pair we Klean is a pair that <span>doesn't get replaced.</span></p>
            <p style={{ marginTop: '30px', fontSize: '19px', maxWidth: '58ch' }}>
              Africa discards over 300 million pairs of shoes a year. Accra runs on sneaker culture, and pairs get thrown out the moment they look tired. We give them their years back through care and restoration, and partner with recyclers and local artisans to repurpose the pairs that can't be saved. One restored sneaker at a time.
            </p>
            <div className="film">
              <video
                src="video/kleankickx-film.mp4"
                poster="video/poster.jpg"
                autoPlay
                muted
                loop
                playsInline
                controls
                preload="metadata"
                aria-label="KleanKickx film: from the pile to fresh"
              ></video>
              <div>
                <div className="eyebrow mono">Watch</div>
                <h3>From the pile to fresh.</h3>
                <p>Ten seconds on why we do this.</p>
              </div>
            </div>
          </div>
        </section>

        {/* APPROACH */}
        <section className="std" aria-labelledby="aT">
          <div className="wrap">
            <div className="head">
              <div><div className="eyebrow mono">Our approach</div><h2 id="aT">Clean. Restore. Protect.</h2></div>
              <p>Three things we do for every pair that comes through the studio, using KleanKickx's controlled care system.</p>
            </div>
            <div className="pillars rv">
              <article className="pillar"><div className="verb">Clean<span className="x">.</span></div><p>Material-specific cleaning by hand and machine. The right brush, the right solution and the right drying for leather, suede, mesh and knit.</p></article>
              <article className="pillar"><div className="verb">Restore<span className="x">.</span></div><p>Stubborn stains, embedded dirt and tired midsoles brought back. We fix what usually gets a pair thrown out.</p></article>
              <article className="pillar"><div className="verb">Protect<span className="x">.</span></div><p>Every pair is quality-checked, carefully packed and returned with Klean tips, so it stays fresh between visits.</p></article>
            </div>
          </div>
        </section>

        {/* SERVICES */}
        <section className="std sep" id="services" aria-labelledby="sT">
          <div className="wrap">
            <div className="head">
              <div><div className="eyebrow mono">Our premium services</div><h2 id="sT">Pick your Klean.</h2></div>
              <p>Priced per pair, in GHS, taxes included. Drop off at the studio or request pickup and delivery (fees apply). New here? Your first Standard Klean is on us.</p>
            </div>
            <div className="svcs rv">
              <article className="svc free"><span className="flag">New users</span><span className="time mono">Delivered in 72h</span><h3>Free Signup Klean</h3><p>A complimentary Standard Klean for new users. One per account.</p><div className="price">FREE</div><Link className="btn go sm" to="/services">Sign up to claim</Link></article>
              <article className="svc"><span className="time mono">Delivered in 72h</span><h3>Standard Klean</h3><p>Thorough cleaning of the entire shoe, removing dirt, dust and everyday grime. Ideal for regular care.</p><div className="price">₵50<small>/ pair</small></div><Link className="btn sm" to="/services">Book Standard</Link></article>
              <article className="svc"><span className="flag">Next day</span><span className="time mono">Delivered next day</span><h3>Priority Klean</h3><p>For sneakerheads who want professional care without the wait. Your pair jumps the queue.</p><div className="price">₵70<small>/ pair</small></div><Link className="btn sm" to="/services">Book Priority</Link></article>
              <article className="svc"><span className="time mono">Delivered in 72h</span><h3>Deep Klean</h3><p>An intensive process for stubborn stains and deeply embedded dirt. For pairs that need a real restoration.</p><div className="price">₵80<small>/ pair</small></div><Link className="btn sm" to="/services">Book Deep</Link></article>
            </div>

            {/* BUNDLE PICKER */}
            <div className="picker rv" id="bundles">
              <div className="pk-l">
                <div className="eyebrow mono">Bundles · Standard Klean</div>
                <h3>Bring the whole rotation.</h3>
                <p>The more pairs, the less each one costs. Pick how many pairs you're sending.</p>
                <div className="seg" role="radiogroup" aria-label="Number of pairs">
                  <span className="pill" aria-hidden="true" style={{ transform: `translateX(${bundleIndex * 100}%)` }}></span>
                  {bundleKeys.map((n) => {
                    const num = parseInt(n, 10);
                    return (
                      <button
                        key={n}
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
                <span className="mono" style={{ color: 'var(--muted)' }}>Your bundle</span>
                <div className="bname">{selectedBundle.name}</div>
                <div className="total">₵{selectedBundle.total}</div>
                <div className="meta">
                  <span>₵{(selectedBundle.total / bundleSelection).toFixed(2)} per pair</span>
                  <span>Delivered in 72h</span>
                </div>
                <span className="save">
                  {bundleSelection * 50 - selectedBundle.total > 0
                    ? `Save ₵${bundleSelection * 50 - selectedBundle.total} vs single pairs`
                    : 'Standard price'}
                </span>
                <Link className="btn go" to="/services">
                  {selectedBundle.label} <span className="ar" aria-hidden="true">→</span>
                </Link>
              </div>
            </div>
            <p className="note">We count in pairs: one pair is a left and a right shoe. Pay by Mobile Money, card, bank transfer, Paystack or cash.</p>

            {/* GIFT VOUCHERS */}
            <div className="gift rv" id="vouchers">
              <div className="gift-l">
                <div className="eyebrow mono">Gift vouchers</div>
                <h3>Give the gift of fresh kicks.</h3>
                <p>Pick a voucher, pay securely, and it lands in their inbox instantly. Valid for 6 months.</p>
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

        {/* BEFORE / AFTER */}
        <section className="std sep" aria-labelledby="baT">
          <div className="wrap">
            <div className="head">
              <div><div className="eyebrow mono">Before &amp; after</div><h2 id="baT">Same pair. Days apart.</h2></div>
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
              <div><div className="eyebrow mono">How it works</div><h2 id="hT">Three easy steps.</h2></div>
              <p>Getting your footwear cleaned has never been so easy. We handle the rest.</p>
            </div>
            <ol className="steps rv">
              <li><h4>Book a Klean</h4><p>Schedule through our website. Choose your service and your preferred pickup or drop-off option.</p></li>
              <li><h4>We Klean &amp; restore</h4><p>Trained sneaker technicians clean and refresh your pair with our controlled care system, built to protect materials and extend lifespan.</p></li>
              <li><h4>Delivered back fresh</h4><p>Quality-checked, carefully packed and returned to you clean and ready to wear, typically within 72 hours.</p></li>
            </ol>
          </div>
        </section>

        {/* CARE GUIDE */}
        <section className="std sep" id="care" aria-labelledby="cgT">
          <div className="wrap">
            <div className="head">
              <div><div className="eyebrow mono">Klean tips</div><h2 id="cgT">Keep the soles sparkling.</h2></div>
              <p>The only thing better than a new pair of sneakers is a clean pair. Pick your material for the habits that add the most life.</p>
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
              <div><div className="eyebrow mono">Who we serve</div><h2 id="buT">For you. For your team.</h2></div>
              <p>One pair or twenty, we'll keep them fresh.</p>
            </div>
            <div className="split2 rv">
              <article className="aud">
                <span className="mono x">Individuals</span>
                <h3>Sneakerheads &amp; everyday wearers</h3>
                <p>From your grails to your daily beaters, premium care that keeps them looking right.</p>
                <ul><li>Free first Standard Klean</li><li>Next-day Priority Klean when you can't wait</li><li>Pickup and delivery in Accra</li></ul>
                <Link className="btn go" to="/services">Schedule a Klean <span className="ar" aria-hidden="true">→</span></Link>
              </article>
              <article className="aud biz">
                <span className="mono x">Teams &amp; businesses</span>
                <h3>Gyms, schools, teams &amp; retailers</h3>
                <p>Our Sneakers Squad (10 pairs) and VIP Klean (20 pairs) bundles bring the price down to ₵40 a pair.</p>
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
                <div className="eyebrow mono">Get in touch</div>
                <h2 id="ctT" style={{ color: 'var(--band-fg)' }}>Leave your sneakers <span>in our care.</span></h2>
                <div className="ctas">
                  <Link className="btn go" to="/services">Schedule a Klean <span className="ar" aria-hidden="true">→</span></Link>
                </div>
              </div>
              <div className="cards">
                <div><span className="mono">Phone</span><a href="tel:+233536278834">+233 53 627 8834</a></div>
                <div><span className="mono">Email</span><a href="mailto:info@kleankickx.com">info@kleankickx.com</a></div>
                <div><span className="mono">Studio</span><span>29 Golf Hills Street, Accra, Ghana</span></div>
              </div>
            </div>
            <div className="sdgs" aria-label="Our sustainable commitment">
              <span><b>11</b>Sustainable cities &amp; communities</span>
              <span><b>12</b>Responsible consumption &amp; production</span>
              <span><b>13</b>Climate action</span>
            </div>
          </div>
        </section>
      </main>

      <footer>
        <div className="wrap">
          <div>© 2026 KleanKickx Sneaker Care Limited · 29 Golf Hills Street, Accra</div>
          <nav aria-label="Footer">
            <a href="#services">Services</a>
            <a href="#bundles">Bundles</a>
            <a href="#how">How it works</a>
            <a href="#care">Klean tips</a>
            <a href="#contact">Contact</a>
          </nav>
        </div>
      </footer>
    </div>
  );
};

export default Home;