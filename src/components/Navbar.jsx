// src/components/Navbar.jsx
import React, { useContext, useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate, Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faShoppingCart,
  faUser,
  faBars,
  faTimes,
  faChevronDown,
  faChevronRight,
  faUserFriends,
  faKey,
  faRightFromBracket,
  faShoePrints,
  faGift,
  faTicket,
  faClipboardList,
  faFire,
} from '@fortawesome/free-solid-svg-icons';
import { useCartDrawer } from './CartDrawer';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';
import Logo from '../assets/logo2.png';

const Navbar = () => {
  // Get cart data from context
  const { getCartItemCount, cartMeta, loading: cartLoading } = useContext(CartContext);
  const { openCart } = useCartDrawer();
  const { isAuthenticated, user, logout } = useContext(AuthContext);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Desktop-only: controls the hover/click dropdowns in the top nav bar.
  const [activeDropdown, setActiveDropdown] = useState(null);

  // Mobile-only: controls the accordion sections inside the slide-out drawer.
  // IMPORTANT: this is intentionally a SEPARATE state from `activeDropdown`.
  // The desktop dropdown JSX is only CSS-hidden on mobile (`hidden lg:flex`),
  // not unmounted, so if it shared state with the mobile accordion, opening
  // an accordion on mobile would also mount the (invisible) desktop dropdown
  // and hijack `dropdownRef`, causing the outside-click handler below to
  // treat taps inside the mobile drawer as "outside clicks" and collapse the
  // accordion before the click could ever navigate. Keeping these separate
  // fixes that race condition entirely.
  const [mobileAccordion, setMobileAccordion] = useState(null);

  const dropdownRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const navigate = useNavigate();

  // Get cart item count - this will update as soon as cart loads
  const cartItemCount = getCartItemCount();

  // Close desktop dropdown when clicking outside
  useEffect(() => {
    const handleClick = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target)
      ) {
        setIsDropdownOpen(false);
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        isMobileMenuOpen &&
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(e.target) &&
        !e.target.closest('.mobile-menu-trigger')
      ) {
        setIsMobileMenuOpen(false);
        setMobileAccordion(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobileMenuOpen]);

  const truncateWithEllipsis = (text, maxLength) => {
    if (!text) return '';
    return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
  };

  useEffect(() => {
    document.body.classList.toggle('overflow-hidden', isMobileMenuOpen);
  }, [isMobileMenuOpen]);

  const userDisplayName =
    user && (user.first_name?.trim() ? user.first_name : truncateWithEllipsis(user.email, 8));

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
    setMobileAccordion(null);
  };

  const handleLogout = async (e) => {
    e.stopPropagation();
    try {
      await logout();
      toast.success('Logged out successfully!');
      closeMobileMenu();
      setIsDropdownOpen(false);
      navigate('/auth/login');
    } catch (err) {
      toast.error('Logout failed. Please try again.');
      console.error('Logout error:', err);
    }
  };

  const handleReferralRoute = (e) => {
    e.stopPropagation();
    closeMobileMenu();
    navigate('/referral-dashboard');
    setIsDropdownOpen(false);
  };

  // Main navigation: four links and one call to action. Hash links point at
  // sections on the homepage; ScrollToTop scrolls to them from any page.
  const navGroups = [
    { label: 'Services', to: '/#services', simple: true, hash: true },
    { label: 'Trade-In', to: '/#trade-in', simple: true, hash: true },
    { label: 'Impact', to: '/impact', simple: true },
    { label: 'Studio', to: '/studio', simple: true },
  ];

  // Account links, shown in the user menu (desktop) and the drawer (mobile).
  const accountLinks = [
    { to: '/orders', label: 'My Orders', icon: faClipboardList, color: 'text-green-600' },
    { to: '/account/vouchers', label: 'My Vouchers', icon: faGift, color: 'text-purple-500' },
    { to: '/redeem', label: 'Redeem Voucher', icon: faTicket, color: 'text-green-600' },
    { to: '/vouchers', label: 'Buy Gift Vouchers', icon: faShoePrints, color: 'text-gray-600' },
    { to: '/promotions', label: 'Promotions', icon: faFire, color: 'text-orange-500' },
  ];

  // Desktop dropdown toggle (top nav bar)
  const toggleDropdown = (groupLabel) => {
    setActiveDropdown(activeDropdown === groupLabel ? null : groupLabel);
  };

  // Mobile accordion toggle (slide-out drawer) - fully independent of the
  // desktop dropdown state, see comment near `mobileAccordion` above.
  const toggleMobileAccordion = (groupLabel) => {
    setMobileAccordion(mobileAccordion === groupLabel ? null : groupLabel);
  };

  return (
    <div className="sticky inset-x-0 top-0 z-40">
      <nav className="bg-white text-gray-900 py-3 shadow-sm border-b border-gray-200">
        <div className="flex justify-between items-center px-4 lg:px-8 xl:px-12 gap-6">
          {/* Logo */}
          <NavLink to="/" className="flex items-center gap-2 flex-shrink-0">
            <img src={Logo} alt="KleanKickx" className="h-12 w-auto object-contain" />
          </NavLink>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center justify-center flex-1 gap-1">
            {navGroups.map((group) => {
              if (group.authOnly && !isAuthenticated) return null;

              if (group.simple) {
                return (
                  <div key={group.label} className="relative">
                    <NavLink
                      to={group.to}
                      className={({ isActive }) =>
                        `flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all duration-200 ${
                          isActive && !group.hash
                            ? 'bg-green-50 text-green-700'
                            : 'hover:bg-gray-100 hover:text-green-700'
                        }`
                      }
                    >
                      <span className="font-medium">{group.label}</span>
                    </NavLink>
                  </div>
                );
              }

              return (
                <div key={group.label} className="relative">
                  <button
                    onClick={() => toggleDropdown(group.label)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all duration-200 font-medium ${
                      activeDropdown === group.label
                        ? 'bg-green-50 text-green-700'
                        : 'hover:bg-gray-100 hover:text-green-700'
                    }`}
                  >
                    <span>{group.label}</span>
                    <FontAwesomeIcon
                      icon={faChevronDown}
                      className={`w-3 h-3 transition-transform duration-200 ${
                        activeDropdown === group.label ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {/* Dropdown Menu */}
                  {activeDropdown === group.label && (
                    <div
                      className="absolute left-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-xl z-50 py-2"
                      ref={dropdownRef}
                    >
                      {group.items.map((item) => (
                        <NavLink
                          key={item.to}
                          to={item.to}
                          onClick={() => setActiveDropdown(null)}
                          className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-3 transition-all ${
                              item.highlight
                                ? 'bg-gradient-to-r from-green-600 to-primary text-white mx-2 rounded-md hover:opacity-90'
                                : isActive
                                ? 'bg-green-50 text-green-700'
                                : 'hover:bg-gray-100 text-gray-700'
                            }`
                          }
                        >
                          {item.icon && (
                            <FontAwesomeIcon icon={item.icon} className="w-4 h-4" />
                          )}
                          <span className="font-medium">{item.label}</span>
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Right Side Actions */}
          <div className="hidden lg:flex items-center gap-4">
            <Link
              to="/#services"
              className="px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
            >
              Book a Klean
            </Link>
            {/* Cart - Smooth display without disappearing */}
            <button
              onClick={openCart}
              className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              aria-label="Shopping cart"
            >
              <FontAwesomeIcon icon={faShoppingCart} className="text-xl" />

              {/* Show loading spinner only on initial load */}
              {cartLoading ? (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-gray-500 rounded-full flex items-center justify-center">
                  <svg
                    className="animate-spin h-3 w-3 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </span>
              ) : cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[20px] h-5 px-1 flex items-center justify-center font-bold shadow-lg">
                  {cartItemCount > 99 ? '99+' : cartItemCount}
                </span>
              )}
            </button>

            {/* User Actions */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen((p) => !p)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-all cursor-pointer"
                >
                  <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center">
                    <FontAwesomeIcon icon={faUser} className="w-4 h-4" />
                  </div>
                  <span className="truncate max-w-[120px] font-medium">
                    {userDisplayName}
                  </span>
                  <FontAwesomeIcon
                    icon={faChevronDown}
                    className={`w-3 h-3 transition-transform duration-200 ${
                      isDropdownOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {isDropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-xl z-50 p-2"
                    ref={dropdownRef}
                  >
                    <div className="space-y-1">
                      {accountLinks.map((item) => (
                        <button
                          key={item.to}
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(item.to);
                            setIsDropdownOpen(false);
                          }}
                          className="flex items-center gap-3 w-full text-left rounded-lg px-3 py-2.5 cursor-pointer hover:bg-gray-100 transition-colors"
                        >
                          <FontAwesomeIcon icon={item.icon} className={`w-4 h-4 ${item.color}`} />
                          <span>{item.label}</span>
                        </button>
                      ))}
                      <div className="border-t border-gray-200 my-2" />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate('/change-password');
                          setIsDropdownOpen(false);
                        }}
                        className="flex items-center gap-3 w-full text-left rounded-lg px-3 py-2.5 cursor-pointer hover:bg-gray-100 transition-colors"
                      >
                        <FontAwesomeIcon icon={faKey} className="w-4 h-4 text-yellow-500" />
                        <span>Change Password</span>
                      </button>
                      <button
                        onClick={handleReferralRoute}
                        className="flex items-center gap-3 w-full text-left rounded-lg px-3 py-2.5 cursor-pointer hover:bg-gray-100 transition-colors"
                      >
                        <FontAwesomeIcon icon={faUserFriends} className="w-4 h-4 text-blue-500" />
                        <span>Referrals</span>
                      </button>
                      <div className="border-t border-gray-200 my-2" />
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full text-left rounded-lg px-3 py-2.5 cursor-pointer hover:bg-red-500/10 text-red-600 hover:text-red-700 transition-colors"
                      >
                        <FontAwesomeIcon icon={faRightFromBracket} className="w-4 h-4" />
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <NavLink
                  to="/auth/login"
                  className="px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Login
                </NavLink>
                <NavLink
                  to="/auth/register"
                  className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 transition-colors font-medium"
                >
                  Sign up
                </NavLink>
              </div>
            )}
          </div>

          {/* Mobile menu toggle - moved to left side */}
          <div className="lg:hidden flex gap-4 items-center">
            {/* Cart for mobile */}
            <button
              onClick={openCart}
              className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              aria-label="Shopping cart"
            >
              <FontAwesomeIcon icon={faShoppingCart} className="text-xl" />

              {cartLoading ? (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-gray-500 rounded-full flex items-center justify-center">
                  <svg
                    className="animate-spin h-3 w-3 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </span>
              ) : cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[20px] h-5 px-1 flex items-center justify-center font-bold shadow-lg">
                  {cartItemCount > 99 ? '99+' : cartItemCount}
                </span>
              )}
            </button>

            <button
              className="text-2xl p-2 hover:bg-gray-100 rounded-lg cursor-pointer mobile-menu-trigger"
              onClick={() => setIsMobileMenuOpen((p) => !p)}
              aria-label="Menu"
            >
              <FontAwesomeIcon icon={faBars} />
            </button>
          </div>
        </div>

        {/* Mobile menu: the site's editorial style (Anton, square, ink rules) */}
        <style>{`
          .kkm-scrim{position:fixed;inset:0;z-index:40;background:rgba(10,11,10,.46);transition:opacity .35s ease}
          .kkm{--ink:#0A0B0A;--paper:#F7F9F6;--line:#D9DFD7;--muted:#4D564C;--green:#1A7A1A;--display:"Anton","Arial Narrow",Impact,sans-serif;
            --swift:cubic-bezier(.77,0,.18,1);--spring:cubic-bezier(.2,1.25,.3,1);
            position:fixed;top:0;left:0;bottom:0;z-index:50;width:min(420px,88vw);background:var(--paper);color:var(--ink);
            border-right:2px solid var(--ink);display:flex;flex-direction:column;font-family:"League Spartan",system-ui,sans-serif;
            transform:translateX(-102%);transition:transform .55s var(--swift);box-shadow:30px 0 80px -30px rgba(10,11,10,.5)}
          .kkm.open{transform:translateX(0)}
          .kkm-head{display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:2px solid var(--ink)}
          .kkm-logo{font-family:var(--display);font-size:26px;line-height:1;color:var(--ink);text-decoration:none;letter-spacing:.01em}
          .kkm-logo b{font-weight:400;color:var(--green)}
          .kkm-x{width:42px;height:42px;display:grid;place-items:center;border:2px solid var(--ink);background:none;color:var(--ink);cursor:pointer;
            transition:background .2s,color .2s,transform .3s var(--spring)}
          .kkm-x:hover{background:var(--ink);color:#fff;transform:rotate(90deg)}
          .kkm-body{flex:1;overflow-y:auto;overscroll-behavior:contain;padding:8px 20px 20px}
          .kkm-nav{list-style:none;margin:0;padding:0}
          .kkm-nav a{display:grid;grid-template-columns:30px 1fr auto;align-items:baseline;gap:6px;padding:14px 0;border-bottom:1px solid var(--line);
            color:var(--ink);text-decoration:none;opacity:0;transform:translateX(-16px);transition:opacity .45s ease,transform .55s var(--swift),color .2s}
          .kkm.open .kkm-nav a{opacity:1;transform:none}
          .kkm-nav a .n{font-size:12px;font-weight:600;letter-spacing:.1em;color:var(--muted)}
          .kkm-nav a .t{font-family:var(--display);font-size:40px;line-height:.95;text-transform:uppercase}
          .kkm-nav a .ar{font-size:20px;transition:transform .3s var(--spring)}
          .kkm-nav a:hover,.kkm-nav a.active{color:var(--green)}
          .kkm-nav a:hover .ar{transform:translateX(5px)}
          .kkm-btn{display:flex;align-items:center;justify-content:center;gap:10px;height:54px;margin-top:20px;border:2px solid var(--green);border-radius:2px;
            background:var(--green);color:#fff !important;font-weight:700;font-size:16px;text-decoration:none;transition:background .2s,border-color .2s}
          .kkm-btn .ar{transition:transform .3s var(--spring)}
          .kkm-btn:hover{background:var(--ink);border-color:var(--ink)}
          .kkm-btn:hover .ar{transform:translateX(5px)}
          .kkm-cart{display:flex;align-items:center;justify-content:space-between;gap:12px;width:100%;margin-top:12px;padding:14px 16px;border:2px solid var(--ink);
            background:#fff;font:inherit;font-size:15px;color:var(--ink);cursor:pointer;text-align:left}
          .kkm-cart strong{font-family:var(--display);font-weight:400;font-size:22px}
          .kkm-cart:hover{background:var(--ink);color:#fff}
          .kkm-eyebrow{margin:28px 0 8px;font-size:12px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:var(--green)}
          .kkm-who{margin:0 0 6px}
          .kkm-who p{margin:0}
          .kkm-who .name{font-family:var(--display);font-size:26px;text-transform:uppercase;line-height:1}
          .kkm-who .mail{font-size:13px;color:var(--muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
          .kkm-acc{list-style:none;margin:0;padding:0;border-top:2px solid var(--ink)}
          .kkm-acc button{display:flex;justify-content:space-between;align-items:center;width:100%;padding:13px 0;border:0;border-bottom:1px solid var(--line);
            background:none;font:inherit;font-size:13px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:var(--ink);cursor:pointer;text-align:left}
          .kkm-acc button:hover{color:var(--green)}
          .kkm-touch a{display:flex;justify-content:space-between;align-items:baseline;gap:12px;padding:13px 0;border-bottom:1px solid var(--line);
            font-size:13px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:var(--ink);text-decoration:none}
          .kkm-touch a span{font-size:14px;font-weight:500;letter-spacing:0;text-transform:none;color:var(--muted)}
          .kkm-touch a:hover{color:var(--green)}
          .kkm-foot{padding:16px 20px calc(16px + env(safe-area-inset-bottom,0px));border-top:2px solid var(--ink);display:flex;gap:10px}
          .kkm-foot a,.kkm-foot button{flex:1;display:flex;align-items:center;justify-content:center;height:50px;border:2px solid var(--ink);border-radius:2px;
            font:inherit;font-size:15px;font-weight:700;text-decoration:none;cursor:pointer;transition:background .2s,color .2s}
          .kkm-foot .ghost{background:transparent;color:var(--ink)}
          .kkm-foot .solid{background:var(--ink);color:#fff}
          .kkm-foot .ghost:hover{background:var(--ink);color:#fff}
          .kkm-foot .out{background:transparent;color:#B42318;border-color:#B42318}
          .kkm-foot .out:hover{background:#B42318;color:#fff}
          .kkm :focus-visible{outline:2px solid var(--green);outline-offset:3px}
          @media (prefers-reduced-motion:reduce){.kkm,.kkm-nav a{transition:none}}
        `}</style>

        <div
          className="kkm-scrim lg:hidden"
          style={{ opacity: isMobileMenuOpen ? 1 : 0, pointerEvents: isMobileMenuOpen ? 'auto' : 'none' }}
          onClick={closeMobileMenu}
        />

        <aside
          ref={mobileMenuRef}
          className={`kkm lg:hidden ${isMobileMenuOpen ? 'open' : ''}`}
          aria-label="Menu"
          aria-hidden={!isMobileMenuOpen}
        >
          <div className="kkm-head">
            <NavLink to="/" onClick={closeMobileMenu} className="kkm-logo" tabIndex={isMobileMenuOpen ? 0 : -1}>
              KLEANKICK<b>X</b>
            </NavLink>
            <button className="kkm-x" onClick={closeMobileMenu} aria-label="Close menu" tabIndex={isMobileMenuOpen ? 0 : -1}>
              <svg viewBox="0 0 16 16" width="13" height="13"><path d="M2 2l12 12M14 2L2 14" stroke="currentColor" strokeWidth="2.2" /></svg>
            </button>
          </div>

          <div className="kkm-body">
            <ul className="kkm-nav">
              {navGroups.map((group, i) => (
                <li key={group.label}>
                  <NavLink
                    to={group.to}
                    onClick={closeMobileMenu}
                    tabIndex={isMobileMenuOpen ? 0 : -1}
                    className={({ isActive }) => (isActive && !group.hash ? 'active' : '')}
                    style={{ transitionDelay: isMobileMenuOpen ? `${120 + i * 60}ms` : '0ms' }}
                  >
                    <span className="n">{String(i + 1).padStart(2, '0')}</span>
                    <span className="t">{group.label}</span>
                    <span className="ar" aria-hidden="true">→</span>
                  </NavLink>
                </li>
              ))}
            </ul>

            <Link to="/#services" onClick={closeMobileMenu} className="kkm-btn" tabIndex={isMobileMenuOpen ? 0 : -1}>
              Book a Klean <span className="ar" aria-hidden="true">→</span>
            </Link>

            {!cartLoading && cartItemCount > 0 && (
              <button type="button" className="kkm-cart" onClick={() => { closeMobileMenu(); openCart(); }} tabIndex={isMobileMenuOpen ? 0 : -1}>
                <span>Cart · {String(cartItemCount).padStart(2, '0')} {cartItemCount === 1 ? 'item' : 'items'}</span>
                <span><strong>₵{Number(cartMeta?.total || 0).toFixed(2)}</strong> →</span>
              </button>
            )}

            {isAuthenticated && (
              <>
                <p className="kkm-eyebrow">Your account</p>
                <div className="kkm-who">
                  <p className="name">{userDisplayName}</p>
                  <p className="mail">{user?.email}</p>
                </div>
                <ul className="kkm-acc">
                  {[...accountLinks, { to: '/referral-dashboard', label: 'Referrals' }, { to: '/change-password', label: 'Change password' }].map((item) => (
                    <li key={item.to}>
                      <button
                        type="button"
                        tabIndex={isMobileMenuOpen ? 0 : -1}
                        onClick={(e) => { e.stopPropagation(); navigate(item.to); closeMobileMenu(); }}
                      >
                        {item.label} <span aria-hidden="true">→</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}

            <p className="kkm-eyebrow">Get in touch</p>
            <ul className="kkm-acc kkm-touch">
              <li><a href="https://wa.me/233536278834" target="_blank" rel="noopener noreferrer" tabIndex={isMobileMenuOpen ? 0 : -1}>WhatsApp <span>+233 53 627 8834</span></a></li>
              <li><a href="https://instagram.com/kleankickxgh" target="_blank" rel="noopener noreferrer" tabIndex={isMobileMenuOpen ? 0 : -1}>Instagram <span>@kleankickxgh</span></a></li>
              <li><a href="https://maps.google.com/?q=KleanKickx+Sneaker+Care,+29+Golf+Hills+St,+Accra" target="_blank" rel="noopener noreferrer" tabIndex={isMobileMenuOpen ? 0 : -1}>Studio <span>29 Golf Hills St, Accra</span></a></li>
            </ul>
          </div>

          <div className="kkm-foot">
            {isAuthenticated ? (
              <button type="button" className="out" onClick={handleLogout} tabIndex={isMobileMenuOpen ? 0 : -1}>Log out</button>
            ) : (
              <>
                <NavLink to="/auth/login" onClick={closeMobileMenu} className="ghost" tabIndex={isMobileMenuOpen ? 0 : -1}>Log in</NavLink>
                <NavLink to="/auth/register" onClick={closeMobileMenu} className="solid" tabIndex={isMobileMenuOpen ? 0 : -1}>Sign up</NavLink>
              </>
            )}
          </div>
        </aside>
      </nav>
    </div>
  );
};

export default Navbar;