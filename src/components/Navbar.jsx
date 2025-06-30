import React, { useContext, useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faShoppingCart,
  faUser,
  faBars,
  faTimes,
  faChevronDown,
} from '@fortawesome/free-solid-svg-icons';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';
import Logo from '../assets/klean_logo.png';

const Navbar = () => {
  const { cart } = useContext(CartContext);
  const { isAuthenticated, user, logout } = useContext(AuthContext);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef(null); // Desktop dropdown
  const mobileDropdownRef = useRef(null); // Mobile dropdown
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClick = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        mobileDropdownRef.current &&
        !mobileDropdownRef.current.contains(e.target)
      ) {
        setIsDropdownOpen(false);
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

  const cartItemCount = cart.reduce((t, i) => t + (i.quantity || 0), 0);
  const userDisplayName =
    user && (user.first_name?.trim() ? user.first_name : truncateWithEllipsis(user.email, 8));

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const handleLogout = (e) => {
    e.stopPropagation();
    try {
      logout();
      toast.success('Logged out successfully!');
      closeMobileMenu();
      setIsDropdownOpen(false);
      navigate('/login');
    } catch (err) {
      toast.error('Logout failed. Please try again.');
      console.error('Logout error:', err);
    }
  };

  const navItems = [
    { to: '/', label: 'Home' },
    { to: '/rate-and-services', label: 'Rate & Services' },
    { to: '/about-us', label: 'About Us' },

    // my orders link only if user is authenticated
    ...(isAuthenticated ? [{ to: '/orders', label: 'My Orders' }] : []),
  ];

  return (
    <nav className="bg-gray-800 text-white py-3 shadow-md fixed inset-x-0 top-0 z-50">
      <div className="flex justify-between items-center px-4 lg:px-24 gap-8">
        <NavLink to="/" className="flex items-center gap-2 w-full">
          <img src={Logo} alt="KleanKickx" className="w-[6rem] object-cover" />
        </NavLink>

        <ul className="hidden md:flex items-center w-full justify-center gap-8">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  isActive ? 'text-green-400' : 'hover:text-green-300'
                }
              >
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>

        <ul className="hidden md:flex items-center w-full justify-center gap-4">
          <li>
            <NavLink
              to="/services"
              className="bg-white text-primary rounded px-4 py-2.5 hover:bg-primary hover:text-white transition duration-300"
            >
               Start Kleaning Here

            </NavLink>
          </li>
          <li>
            <button
              onClick={() => navigate('/cart')}
              className="relative hover:text-gray-300 cursor-pointer"
            >
              <FontAwesomeIcon icon={faShoppingCart} className="text-xl" />
              {cartItemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center cursor-pointer">
                  {cartItemCount}
                </span>
              )}
            </button>
          </li>

          {isAuthenticated ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen((p) => !p)}
                className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-gray-700 transition cursor-pointer"
              >
                <FontAwesomeIcon icon={faUser} className="text-xl" />
                <span className="truncate max-w-[150px] hidden sm:inline">
                  {userDisplayName}
                </span>
                <FontAwesomeIcon
                  icon={faChevronDown}
                  className={`transition-transform duration-200 ${
                    isDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {isDropdownOpen && (
                <ul className="absolute right-0 mt-2 w-48 bg-white text-gray-800 rounded shadow-lg z-50 p-2 space-y-1">
                  <li>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate('/change-password');
                        setIsDropdownOpen(false);
                      }}
                      className="w-full text-left rounded px-4 py-2 cursor-pointer hover:bg-gray-100"
                    >
                      Change Password
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 cursor-pointer hover:bg-gray-100 rounded"
                    >
                      Logout
                    </button>
                  </li>
                </ul>
              )}
            </div>
          ) : (
            <>
              <li>
                <NavLink to="/register" className="hover:text-gray-300">
                  Register
                </NavLink>
              </li>
              <li>
                <NavLink to="/login" className="hover:text-gray-300">
                  Login
                </NavLink>
              </li>
            </>
          )}
        </ul>

        {/* Mobile menu toggle */}
        <div className="md:hidden flex gap-4 items-center">
          <button
            onClick={() => navigate('/cart')}
            className="relative hover:text-gray-300 cursor-pointer"
          >
            <FontAwesomeIcon icon={faShoppingCart} className="text-xl" />
            {cartItemCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center cursor-pointer">
                {cartItemCount}
              </span>
            )}
          </button>

          <button
            className="text-2xl cursor-pointer"
            onClick={() => setIsMobileMenuOpen((p) => !p)}
          >
            <FontAwesomeIcon icon={isMobileMenuOpen ? faTimes : faBars} />
          </button>
        </div>
      </div>

      {/* Mobile menu overlay */}
      <div
        className={`fixed inset-0 bg-black/60 transition-opacity duration-300 ${
          isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        } md:hidden`}
        onClick={closeMobileMenu}
      />

      {/* Mobile side drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-3/4 max-w-xs bg-gray-800 shadow-xl transform transition-transform duration-300 md:hidden ${
          isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full p-6 space-y-6">
          <button className="self-end text-2xl cursor-pointer" onClick={closeMobileMenu}>
            <FontAwesomeIcon icon={faTimes} />
          </button>

          <ul className="flex flex-col gap-4 text-lg">
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  onClick={closeMobileMenu}
                  className={({ isActive }) =>
                    isActive ? 'text-green-400' : 'hover:text-green-300'
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>

          <div className="border-t border-gray-700 pt-6 mt-auto space-y-4">
            <button
              onClick={() => {
                navigate('/cart');
                closeMobileMenu();
              }}
              className="flex items-center gap-2 hover:bg-gray-700 px-3 py-2 rounded transition cursor-pointer w-full"
            >
              <FontAwesomeIcon icon={faShoppingCart} />
              Cart ({cartItemCount})
            </button>

            {isAuthenticated ? (
              <div className="text-white" ref={mobileDropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen((prev) => !prev)}
                  className="flex items-center justify-between w-full px-3 py-2 rounded hover:bg-gray-700 transition"
                >
                  <div className="flex items-center gap-2">
                    <FontAwesomeIcon icon={faUser} />
                    <span className="truncate max-w-[150px]">{userDisplayName}</span>
                  </div>
                  <FontAwesomeIcon
                    icon={faChevronDown}
                    className={`transition-transform duration-200 ${
                      isDropdownOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {isDropdownOpen && (
                  <ul className="mt-2 bg-gray-700 text-white rounded-md shadow space-y-2 p-2">
                    <li>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate('/change-password');
                          closeMobileMenu();
                          setIsDropdownOpen(false);
                        }}
                        className="flex items-center cursor-pointer w-full text-left px-4 py-2 hover:bg-gray-600 rounded"
                      >
                        Change Password
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={handleLogout}
                        className="flex items-center cursor-pointer w-full text-left px-4 py-2 hover:bg-gray-600 rounded"
                      >
                        Logout
                      </button>
                    </li>
                  </ul>
                )}
              </div>
            ) : (
              <div className="flex flex-col space-y-2">
                <NavLink
                  to="/login"
                  onClick={closeMobileMenu}
                  className="hover:bg-gray-700 px-3 py-2 rounded"
                >
                  <FontAwesomeIcon icon={faUser} className="mr-2" />
                  Login
                </NavLink>
              </div>
            )}

            <NavLink
              to="/services"
              onClick={closeMobileMenu}
              className="inline-block bg-white text-primary rounded px-4 py-2 text-center hover:bg-primary hover:text-white transition w-full"
            >
               Start Kleaning Here
            </NavLink>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;