import React, { useContext, useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate, Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faShoppingCart,
  faUser,
  faBars,
  faTimes,
  faChevronDown,
  faUserFriends,  
  faKey, // Key icon for 'Change Password'
  faRightFromBracket,
  faShoePrints, // Logout icon
  
  
} from '@fortawesome/free-solid-svg-icons';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';
import Logo from '../assets/klean_logo.png';


const Navbar = () => {
  const { cart } = useContext(CartContext);
  const { isAuthenticated, user, logout, discounts } = useContext(AuthContext);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isBannerVisible, setIsBannerVisible] = useState(true);
  const dropdownRef = useRef(null); // Desktop dropdown
  const mobileDropdownRef = useRef(null); // Mobile dropdown
  const navigate = useNavigate();

  
  
  const signupDiscount = discounts?.find(d => d.discount_type === 'signup');
  console.log(signupDiscount)

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


  const navItems = [
    { to: '/', label: 'Home' },
    { to: '/rate-and-services', label: 'Rate & Services' },
    { to: '/about-us', label: 'About Us' },
    ...(isAuthenticated ? [{ to: '/orders', label: 'My Orders' }] : []),
    { to: '/promotions', label: 'Promotions' },
  ];

  const handleCloseBanner = () => {
    setIsBannerVisible(false); // start slide-out
  };

  

  return (
    <div className='sticky inset-x-0 top-0 z-40'>
      {/* Discount Banner with Slide Animation */}
      {signupDiscount && isBannerVisible && signupDiscount.is_active && (
        <div
          className={`bg-gradient-to-r from-green-500 to-green-600 text-white transform transition-transform duration-500 ease-in-out
            
          `}
        >
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


      <nav className="bg-gray-800 text-white py-5 shadow-md ">
        <div className="flex justify-between items-center px-4 lg:px-24 gap-8">
          <NavLink to="/" className="flex items-center gap-2">
            <img src={Logo} alt="KleanKickx" className="w-[6rem] object-cover" />
          </NavLink>

          <ul className="hidden md:flex items-center justify-center gap-8">
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

          <ul className="hidden md:flex items-center justify-center gap-4">
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
                        className="flex items-center w-full text-left rounded px-4 py-2 cursor-pointer hover:bg-gray-100"
                      >
                        <FontAwesomeIcon icon={faKey} className="mr-2 h-4 w-4" /> {/* Change Password Icon */}
                        Change Password
                      </button>
                    </li>

                    <li className="w-full text-left px-4 py-2 cursor-pointer hover:bg-gray-100 rounded">
                      <Link to="/referral-dashboard" className="flex items-center">
                        <FontAwesomeIcon icon={faUserFriends} className="mr-2 h-4 w-4" /> {/* Referrals Icon */}
                        Referrals
                      </Link>
                    </li>

                    {/* divider */}
                    <li className="border-t border-gray-200 my-2" />
                    <li>
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full text-left px-4 py-2 cursor-pointer hover:bg-gray-100 rounded"
                      >
                        <FontAwesomeIcon icon={faRightFromBracket} className="mr-2 h-4 w-4" /> {/* Logout Icon */}
                        Logout
                      </button>
                    </li>
                  </ul>
                )}
              </div>
            ) : (
              <>
                <li>
                  <NavLink to="/auth/register" className="hover:text-gray-300">

                    Register
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/auth/login" className="hover:text-gray-300">
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

            <ul className="flex flex-col gap-4">
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
              <li>
                <NavLink
                to="/services"
                onClick={closeMobileMenu}
                className="inline-block bg-gradient-to-br from-green-900 to-green-800 text-white rounded px-4 py-2 text-center hover:bg-primary transition w-full"
              > 
                <FontAwesomeIcon icon={faShoePrints} className="mr-2" />
                Start Kleaning Here
              </NavLink>
              </li>
            </ul>

            {/* need help card */}
             
                    

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
                          <FontAwesomeIcon icon={faKey} className="mr-2" />
                          Change Password
                        </button>
                      </li>
                      <li>
                          <button
                          onClick={handleReferralRoute}
                          className="flex items-center cursor-pointer w-full text-left px-4 py-2 hover:bg-gray-600 rounded"
                        >
                        <FontAwesomeIcon icon={faUserFriends} className="mr-2" />
                        Referrals
                      </button>
                      </li>

                      <li className="border-t border-gray-600 my-2" />
                      <li>
                        <button
                          onClick={handleLogout}
                          className="flex items-center cursor-pointer w-full text-left px-4 py-2 hover:bg-gray-600 rounded"
                        >
                          <FontAwesomeIcon icon={faRightFromBracket} className="mr-2" />
                          Logout
                        </button>
                      </li>
                      
                    </ul>
                  )}
                </div>
              ) : (
                <div className="flex flex-col space-y-2">
                  <NavLink
                    to="/auth/login"
                    onClick={closeMobileMenu}
                    className="hover:bg-gray-700 px-3 py-2 rounded"
                  >
                    <FontAwesomeIcon icon={faUser} className="mr-2" />
                    Login
                  </NavLink>
                </div>
              )}

              
            </div>
          </div>
        </div>
      </nav>


    </div>
  );
};

export default Navbar;