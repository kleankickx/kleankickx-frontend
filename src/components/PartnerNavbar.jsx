// src/components/PartnerNavbar.jsx
import React, { useContext, useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faShoppingCart,
  faUser,
  faBars,
  faTimes,
  faChevronDown,
  faChevronRight,
  faRightFromBracket,
  faTachometerAlt,
  faBox,
  faStore,
  faChartLine,
  faCog,
  faPhone,
  faFileInvoice,
  faCreditCard,
} from '@fortawesome/free-solid-svg-icons';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';
import Logo from '../assets/klean_logo.webp';

const PartnerNavbar = () => {
  const navigate = useNavigate();
  const { user, isPartner, logout, partnerData } = useContext(AuthContext);
  
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const dropdownRef = useRef(null);
  const mobileMenuRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
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
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobileMenuOpen]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    document.body.classList.toggle('overflow-hidden', isMobileMenuOpen);
  }, [isMobileMenuOpen]);

  const truncateWithEllipsis = (text, maxLength) => {
    if (!text) return '';
    return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
  };

  const userDisplayName = partnerData?.company_name || 
    (user && (user.first_name?.trim() ? user.first_name : truncateWithEllipsis(user.email, 8)));

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

  // Partner Navigation Groups
  const partnerNavGroups = [
    {
      label: 'Dashboard',
      to: '/partner/dashboard',
      icon: faTachometerAlt,
      simple: true,
    },
    {
      label: 'Services',
      to: '/partner/services',
      icon: faStore,
      simple: true,
    },
    {
      label: 'Orders',
      to: '/partner/orders',
      icon: faBox,
      simple: true,
    },
    {
      label: 'Invoices',
      to: '/partner/invoices',
      icon: faFileInvoice,
      simple: true,
    },
  ];

  const toggleDropdown = (groupLabel) => {
    setActiveDropdown(activeDropdown === groupLabel ? null : groupLabel);
  };

  // If not a partner, don't render anything
  if (!isPartner) {
    return null;
  }

  return (
    <div className="sticky inset-x-0 top-0 z-40">
      {/* Partner Banner */}
      <div className="bg-gradient-to-r from-primary/90 to-primary text-white">
        <div className="max-w-7xl mx-auto px-4 py-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className="text-yellow-300">🏪</span>
              <span>Partner Portal</span>
              {partnerData?.company_name && (
                <span className="hidden md:inline text-white/80">
                  | {partnerData.company_name}
                </span>
              )}
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => window.open('mailto:partners@kleankickx.com', '_blank')}
                className="flex items-center gap-1 text-xs hover:text-yellow-200 transition-colors"
              >
                <FontAwesomeIcon icon={faPhone} className="w-3 h-3" />
                <span className="hidden sm:inline">Support</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <nav className="bg-gray-800 text-white py-3 shadow-md">
        <div className="flex justify-between items-center px-4 lg:px-8 xl:px-12 gap-6">
          {/* Logo */}
          <NavLink to="/partner/dashboard" className="flex items-center gap-2 flex-shrink-0">
            <img src={Logo} alt="KleanKickx Partners" className="w-28 object-cover" />
            <span className="hidden sm:inline text-sm font-medium text-green-400 ml-2">
              Partners
            </span>
          </NavLink>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center justify-center flex-1 gap-1">
            {partnerNavGroups.map((group) => {
              if (group.simple) {
                return (
                  <NavLink
                    key={group.label}
                    to={group.to}
                    className={({ isActive }) =>
                      `flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all duration-200 ${
                        isActive
                          ? 'bg-gray-700 text-green-400'
                          : 'hover:bg-gray-700 hover:text-green-300'
                      }`
                    }
                  >
                    <FontAwesomeIcon icon={group.icon} className="w-4 h-4" />
                    <span className="font-medium">{group.label}</span>
                  </NavLink>
                );
              }
              return null;
            })}
          </div>

          {/* Right Side Actions */}
          <div className="hidden lg:flex items-center gap-4">
            {/* Invoices Quick Link */}
            <NavLink
              to="/partner/invoices"
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-green-600 text-white'
                    : 'hover:bg-gray-700'
                }`
              }
            >
              <FontAwesomeIcon icon={faFileInvoice} className="w-4 h-4" />
              <span className="text-sm font-medium">Invoices</span>
            </NavLink>

            {/* User Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen((p) => !p)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-700 transition-all cursor-pointer"
              >
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <FontAwesomeIcon icon={faUser} className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium truncate max-w-[120px]">
                    {userDisplayName}
                  </p>
                  <p className="text-xs text-gray-400 hidden md:block">Partner</p>
                </div>
                <FontAwesomeIcon
                  icon={faChevronDown}
                  className={`w-3 h-3 transition-transform duration-200 ${
                    isDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>
              
              {isDropdownOpen && (
                <div 
                  className="absolute right-0 mt-2 w-64 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 p-2"
                  ref={dropdownRef}
                >
                  <div className="space-y-1">
                    {/* Company Info */}
                    <div className="px-3 py-2 border-b border-gray-700 mb-2">
                      <p className="text-sm font-semibold text-green-400">
                        {partnerData?.company_name || 'Partner Account'}
                      </p>
                      <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                    </div>
                    
                    <button
                      onClick={() => {
                        navigate('/partner/dashboard');
                        setIsDropdownOpen(false);
                      }}
                      className="flex items-center gap-3 w-full text-left rounded-lg px-3 py-2.5 cursor-pointer hover:bg-gray-700 transition-colors"
                    >
                      <FontAwesomeIcon icon={faTachometerAlt} className="w-4 h-4 text-green-400" />
                      <span>Dashboard</span>
                    </button>
                    
                    <button
                      onClick={() => {
                        navigate('/partner/services');
                        setIsDropdownOpen(false);
                      }}
                      className="flex items-center gap-3 w-full text-left rounded-lg px-3 py-2.5 cursor-pointer hover:bg-gray-700 transition-colors"
                    >
                      <FontAwesomeIcon icon={faStore} className="w-4 h-4 text-blue-400" />
                      <span>Wholesale Services</span>
                    </button>
                    
                    <button
                      onClick={() => {
                        navigate('/partner/orders');
                        setIsDropdownOpen(false);
                      }}
                      className="flex items-center gap-3 w-full text-left rounded-lg px-3 py-2.5 cursor-pointer hover:bg-gray-700 transition-colors"
                    >
                      <FontAwesomeIcon icon={faBox} className="w-4 h-4 text-yellow-400" />
                      <span>Order History</span>
                    </button>
                    
                    <button
                      onClick={() => {
                        navigate('/partner/invoices');
                        setIsDropdownOpen(false);
                      }}
                      className="flex items-center gap-3 w-full text-left rounded-lg px-3 py-2.5 cursor-pointer hover:bg-gray-700 transition-colors"
                    >
                      <FontAwesomeIcon icon={faFileInvoice} className="w-4 h-4 text-purple-400" />
                      <span>Invoices</span>
                    </button>
                    
                    <div className="border-t border-gray-700 my-2" />
                    
                    <button
                      onClick={() => {
                        navigate('/change-password');
                        setIsDropdownOpen(false);
                      }}
                      className="flex items-center gap-3 w-full text-left rounded-lg px-3 py-2.5 cursor-pointer hover:bg-gray-700 transition-colors"
                    >
                      <FontAwesomeIcon icon={faCog} className="w-4 h-4 text-purple-400" />
                      <span>Change Password</span>
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
          </div>

          {/* Mobile menu toggle */}
          <div className="lg:hidden flex gap-4 items-center">
            <button
              className="text-2xl p-2 hover:bg-gray-700 rounded-lg cursor-pointer mobile-menu-trigger"
              onClick={() => setIsMobileMenuOpen((p) => !p)}
              aria-label="Menu"
            >
              <FontAwesomeIcon icon={faBars} />
            </button>
          </div>
        </div>

        {/* Mobile menu backdrop */}
        <div
          className={`fixed inset-0 bg-black/60 transition-opacity duration-300 lg:hidden ${
            isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
          onClick={closeMobileMenu}
        />

        {/* Mobile side drawer */}
        <div
          ref={mobileMenuRef}
          className={`fixed top-0 left-0 h-full w-4/5 max-w-sm bg-gray-800 shadow-xl transform transition-transform duration-300 ease-out lg:hidden ${
            isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex flex-col h-full p-5">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <NavLink to="/partner/dashboard" onClick={closeMobileMenu}>
                <img src={Logo} alt="KleanKickx Partners" className="w-24" />
                <span className="text-xs text-green-400 mt-1 block">Partner Portal</span>
              </NavLink>
              <button
                className="text-2xl p-2 hover:bg-gray-700 rounded-lg cursor-pointer"
                onClick={closeMobileMenu}
                aria-label="Close menu"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            {/* User Info */}
            <div className="p-4 bg-gray-700/50 rounded-lg mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                  <FontAwesomeIcon icon={faUser} className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{userDisplayName}</p>
                  <p className="text-sm text-gray-400 truncate">{user?.email}</p>
                  {partnerData?.company_name && (
                    <p className="text-xs text-green-400">{partnerData.company_name}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Navigation Items */}
            <div className="flex-1 overflow-y-auto space-y-1">
              {partnerNavGroups.map((group) => (
                <NavLink
                  key={group.label}
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
                  <FontAwesomeIcon icon={group.icon} className="w-4 h-4" />
                  <span className="font-medium">{group.label}</span>
                </NavLink>
              ))}
            </div>

            {/* Footer Actions */}
            <div className="pt-6 border-t border-gray-700/50 space-y-3">
              <button
                onClick={() => {
                  navigate('/change-password');
                  closeMobileMenu();
                }}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-lg hover:bg-gray-700 transition-colors text-left"
              >
                <FontAwesomeIcon icon={faCog} className="w-4 h-4 text-purple-400" />
                <span>Change Password</span>
              </button>
              
              <button
                onClick={handleLogout}
                className="flex items-center justify-center gap-3 w-full px-4 py-3 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
              >
                <FontAwesomeIcon icon={faRightFromBracket} className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
};

export default PartnerNavbar;