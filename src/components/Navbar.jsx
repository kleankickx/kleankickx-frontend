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
  faHome,
  faInfoCircle,
  faClipboardList,
  faFire,
} from '@fortawesome/free-solid-svg-icons';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';
import Logo from '../assets/klean_logo.webp';

const Navbar = () => {
  // Get cart data from context
  const { getCartItemCount, cartMeta, loading: cartLoading } = useContext(CartContext);
  const { isAuthenticated, user, logout, discounts } = useContext(AuthContext);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isBannerVisible, setIsBannerVisible] = useState(true);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const signupDiscount = discounts?.find(d => d.discount_type === 'signup');

  // Get cart item count - this will update as soon as cart loads
  const cartItemCount = getCartItemCount();

  // Close dropdown when clicking outside
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
    setActiveDropdown(null);
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

  // Desktop Navigation Groups
  const navGroups = [
    {
      label: 'Home',
      to: '/',
      icon: faHome,
      simple: true,
    },
    {
      label: 'Services',
      items: [
        { to: '/rate-and-services', label: 'Rate & Services', icon: faClipboardList },
        { to: '/services', label: 'Start Kleaning Here', icon: faShoePrints },
      ],
    },
    {
      label: 'About',
      to: '/about-us',
      icon: faInfoCircle,
      simple: true,
    },
    {
      label: 'Shop',
      items: [
        { to: '/services', label: 'Start Kleaning Here', icon: faShoePrints },
        { to: '/vouchers', label: 'Buy Vouchers', icon: faGift },
        { to: '/redeem', label: 'Redeem Voucher', icon: faTicket, highlight: true },
      ],
    },
    {
      label: 'Orders',
      items: isAuthenticated
        ? [
            { to: '/orders', label: 'My Orders', icon: faClipboardList },
            { to: '/account/vouchers', label: 'My Vouchers', icon: faGift },
          ]
        : [],
      authOnly: true,
    },
    {
      label: 'Promotions',
      to: '/promotions',
      icon: faFire,
      simple: true,
    },
  ];

  const handleCloseBanner = () => {
    setIsBannerVisible(false);
  };

  const toggleDropdown = (groupLabel) => {
    setActiveDropdown(activeDropdown === groupLabel ? null : groupLabel);
  };

  return (
    <div className="sticky inset-x-0 top-0 z-40">
      {/* Discount Banner with Slide Animation */}
      {signupDiscount && isBannerVisible && signupDiscount.is_active && (
        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white transform transition-transform duration-500 ease-in-out">
          <div className="py-2 px-4">
            <div className="max-w-7xl mx-auto flex items-start justify-between gap-2">
              <div className="flex items-start gap-1">
                <span>🎉</span>
                <div>
                  <span className="font-bold mr-2">SPECIAL OFFER!</span>
                  <span className="lg:text-sm text-xs">
                    Get {signupDiscount.percentage}% off on your first order when you sign up!
                  </span>
                </div>
              </div>
              <button
                onClick={handleCloseBanner}
                className="text-white hover:text-gray-200 transition-colors flex-shrink-0 cursor-pointer"
                aria-label="Close banner"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5 sm:w-6 sm:h-6"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      <nav className="bg-gray-800 text-white py-4 shadow-md">
        <div className="flex justify-between items-center px-4 lg:px-8 xl:px-12 gap-6">
          {/* Logo */}
          <NavLink to="/" className="flex items-center gap-2 flex-shrink-0">
            <img src={Logo} alt="KleanKickx" className="w-28 object-cover" />
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
                          isActive
                            ? 'bg-gray-700 text-green-400'
                            : 'hover:bg-gray-700 hover:text-green-300'
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
                        ? 'bg-gray-700 text-green-400'
                        : 'hover:bg-gray-700 hover:text-green-300'
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
                      className="absolute left-0 mt-2 w-56 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 py-2"
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
                                ? 'bg-gray-700 text-green-400'
                                : 'hover:bg-gray-700 text-gray-200'
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
            {/* Cart - Smooth display without disappearing */}
            <button
              onClick={() => navigate('/cart')}
              className="relative p-2 hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
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
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-700 transition-all cursor-pointer"
                >
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
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
                    className="absolute right-0 mt-2 w-56 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 p-2"
                    ref={dropdownRef}
                  >
                    <div className="space-y-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate('/account/vouchers');
                          setIsDropdownOpen(false);
                        }}
                        className="flex items-center gap-3 w-full text-left rounded-lg px-3 py-2.5 cursor-pointer hover:bg-gray-700 transition-colors"
                      >
                        <FontAwesomeIcon icon={faGift} className="w-4 h-4 text-purple-400" />
                        <span>My Vouchers</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate('/change-password');
                          setIsDropdownOpen(false);
                        }}
                        className="flex items-center gap-3 w-full text-left rounded-lg px-3 py-2.5 cursor-pointer hover:bg-gray-700 transition-colors"
                      >
                        <FontAwesomeIcon icon={faKey} className="w-4 h-4 text-yellow-400" />
                        <span>Change Password</span>
                      </button>
                      <button
                        onClick={handleReferralRoute}
                        className="flex items-center gap-3 w-full text-left rounded-lg px-3 py-2.5 cursor-pointer hover:bg-gray-700 transition-colors"
                      >
                        <FontAwesomeIcon icon={faUserFriends} className="w-4 h-4 text-blue-400" />
                        <span>Referrals</span>
                      </button>
                      <div className="border-t border-gray-700 my-2" />
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full text-left rounded-lg px-3 py-2.5 cursor-pointer hover:bg-red-500/10 text-red-400 hover:text-red-300 transition-colors"
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
                  className="px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Login
                </NavLink>
                <NavLink
                  to="/auth/register"
                  className="px-4 py-2 bg-green-600 rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  Register
                </NavLink>
              </div>
            )}
          </div>

          {/* Mobile menu toggle */}
          <div className="lg:hidden flex gap-4 items-center">
            {/* Cart for mobile */}
            <button
              onClick={() => navigate('/cart')}
              className="relative p-2 hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
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
              className="text-2xl p-2 hover:bg-gray-700 rounded-lg cursor-pointer"
              onClick={() => setIsMobileMenuOpen((p) => !p)}
              aria-label="Menu"
            >
              <FontAwesomeIcon icon={isMobileMenuOpen ? faTimes : faBars} />
            </button>
          </div>
        </div>

        {/* Mobile menu overlay */}
        <div
          className={`fixed inset-0 bg-black/60 transition-opacity duration-300 lg:hidden ${
            isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
          onClick={closeMobileMenu}
        />

        {/* Mobile side drawer */}
        <div
          className={`fixed top-0 right-0 h-full w-4/5 max-w-sm bg-gray-800 shadow-xl transform transition-transform duration-300 ease-out lg:hidden ${
            isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="flex flex-col h-full p-5">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <NavLink to="/" onClick={closeMobileMenu}>
                <img src={Logo} alt="KleanKickx" className="w-24" />
              </NavLink>
              <button
                className="text-2xl p-2 hover:bg-gray-700 rounded-lg cursor-pointer"
                onClick={closeMobileMenu}
                aria-label="Close menu"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            {/* Navigation Content */}
            <div className="flex-1 overflow-y-auto space-y-6">
              {/* Cart Summary in Mobile Menu - Only show when cart has items */}
              {!cartLoading && cartItemCount > 0 && (
                <div 
                  onClick={() => {
                    navigate('/cart');
                    closeMobileMenu();
                  }}
                  className="p-4 bg-gradient-to-r from-green-600/20 to-primary/20 rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FontAwesomeIcon icon={faShoppingCart} className="text-xl text-green-400" />
                      <div>
                        <p className="font-semibold">{cartItemCount} item(s) in cart</p>
                        <p className="text-sm text-gray-400">
                          Total: ₵{cartMeta?.total?.toFixed(2) || '0.00'}
                        </p>
                      </div>
                    </div>
                    <FontAwesomeIcon icon={faChevronRight} className="text-gray-400" />
                  </div>
                </div>
              )}

              {/* User Info */}
              {isAuthenticated && (
                <div className="p-4 bg-gray-700/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                      <FontAwesomeIcon icon={faUser} className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-semibold">{userDisplayName}</p>
                      <p className="text-sm text-gray-400 truncate max-w-[200px]">
                        {user?.email}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Items */}
              <div className="space-y-1">
                {navGroups
                  .filter(group => !group.authOnly || (group.authOnly && isAuthenticated))
                  .map((group) => (
                    <div key={group.label} className="border-b border-gray-700/50 last:border-0">
                      {group.simple ? (
                        <NavLink
                          to={group.to}
                          onClick={closeMobileMenu}
                          className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-3.5 rounded-lg transition-colors ${
                              isActive
                                ? 'bg-gray-700 text-green-400'
                                : 'hover:bg-gray-700'
                            }`
                          }
                        >
                          <span className="font-medium">{group.label}</span>
                        </NavLink>
                      ) : (
                        <div className="space-y-1">
                          <button
                            onClick={() => toggleDropdown(group.label)}
                            className={`flex items-center justify-between w-full px-4 py-3.5 rounded-lg transition-colors ${
                              activeDropdown === group.label
                                ? 'bg-gray-700 text-green-400'
                                : 'hover:bg-gray-700'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="font-medium">{group.label}</span>
                            </div>
                            <FontAwesomeIcon
                              icon={faChevronRight}
                              className={`w-3 h-3 transition-transform duration-200 ${
                                activeDropdown === group.label ? 'rotate-90' : ''
                              }`}
                            />
                          </button>
                          
                          {activeDropdown === group.label && (
                            <div className="ml-4 pl-4 border-l border-gray-700 space-y-1 py-2">
                              {group.items.map((item) => (
                                <NavLink
                                  key={item.to}
                                  to={item.to}
                                  onClick={closeMobileMenu}
                                  className={({ isActive }) =>
                                    `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                                      item.highlight
                                        ? 'bg-gradient-to-r from-green-600 to-primary text-white hover:opacity-90'
                                        : isActive
                                        ? 'bg-gray-700/50 text-green-400'
                                        : 'hover:bg-gray-700/50'
                                    }`
                                  }
                                >
                                  <span>{item.label}</span>
                                  {item.highlight && (
                                    <span className="ml-auto text-xs bg-white/20 px-2 py-1 rounded-full">
                                      New
                                    </span>
                                  )}
                                </NavLink>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
              </div>

              {/* User Actions for Mobile */}
              {isAuthenticated && (
                <div className="space-y-2 pt-4 border-t border-gray-700/50">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate('/change-password');
                      closeMobileMenu();
                    }}
                    className="flex items-center gap-3 w-full px-4 py-3 rounded-lg hover:bg-gray-700 transition-colors text-left"
                  >
                    <FontAwesomeIcon icon={faKey} className="w-4 h-4 text-yellow-400" />
                    <span>Change Password</span>
                  </button>
                  <button
                    onClick={handleReferralRoute}
                    className="flex items-center gap-3 w-full px-4 py-3 rounded-lg hover:bg-gray-700 transition-colors text-left"
                  >
                    <FontAwesomeIcon icon={faUserFriends} className="w-4 h-4 text-blue-400" />
                    <span>Referrals</span>
                  </button>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="pt-6 border-t border-gray-700/50 space-y-4">
              {!isAuthenticated && (
                <div className="flex flex-col gap-3">
                  <NavLink
                    to="/auth/login"
                    onClick={closeMobileMenu}
                    className="px-4 py-3 rounded-lg hover:bg-gray-700 transition-colors text-center"
                  >
                    Login
                  </NavLink>
                  <NavLink
                    to="/auth/register"
                    onClick={closeMobileMenu}
                    className="px-4 py-3 bg-green-600 rounded-lg hover:bg-green-700 transition-colors text-center font-medium"
                  >
                    Register
                  </NavLink>
                </div>
              )}
              
              {isAuthenticated && (
                <button
                  onClick={handleLogout}
                  className="flex items-center justify-center gap-3 w-full px-4 py-3 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                >
                  <FontAwesomeIcon icon={faRightFromBracket} className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
};

export default Navbar;