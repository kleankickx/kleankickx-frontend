import React, { useContext, useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShoppingCart, faUser, faBars, faTimes } from '@fortawesome/free-solid-svg-icons';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';
import Logo from '../assets/logo.png';

const Navbar = () => {
  const { cart } = useContext(CartContext);
  const { isAuthenticated, user, logout } = useContext(AuthContext);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const cartItemCount = cart.reduce((total, item) => total + (item.quantity || 0), 0);
  const userDisplayName = user && (user.first_name?.trim() ? user.first_name : user.email) || '';
  

  const handleLogout = () => {
    logout();
    setIsDropdownOpen(false);
    toast.success('Logged out successfully!', { position: 'top-right' });
    navigate('/login'); //
  };

  const toggleDropdown = () => {
    setIsDropdownOpen((prev) => !prev);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((prev) => !prev);
  };

  const navLinks = (
    <>
      <li>
        <NavLink to="/" className={({ isActive }) => isActive ? 'text-green-400' : 'hover:text-green-300'}>
          Home
        </NavLink>
      </li>
      <li>
        <NavLink to="/rate-and-services" className={({ isActive }) => isActive ? 'text-green-400' : 'hover:text-green-300'}>
          Rate & Services
        </NavLink>
      </li>
      <li>
        <NavLink to="/about-us" className={({ isActive }) => isActive ? 'text-green-400' : 'hover:text-green-300'}>
          About us
        </NavLink>
      </li>
      <li>
        <NavLink to="/initiative" className={({ isActive }) => isActive ? 'text-green-400' : 'hover:text-green-300'}>
          Our Initiative
        </NavLink>
      </li>
    </>
  );

  return (
    <nav className="bg-gray-800 text-white py-4 shadow-md fixed top-0 left-0 w-full z-50">
      <div className="flex justify-between items-center px-4 lg:px-24">
        {/* Logo */}
        <div className="text-xl font-bold flex items-center gap-2">
          <NavLink to="/" className="hover:text-gray-300">
            <img src={Logo} alt="KleanKickx Logo" className="h-8 w-auto inline-block" />
          </NavLink>
        </div>

        {/* Desktop Nav */}
        <ul className="hidden md:flex space-x-6 items-center">
          {navLinks}
        </ul>

        {/* Right Buttons */}
        <ul className="hidden md:flex items-center space-x-6">
          <li>
            <NavLink to="/services" className="bg-white text-green-700 rounded hover:text-green-600 px-4 py-2.5 transition duration-200">
              Shop now
            </NavLink>
          </li>
          <li>
            <button onClick={() => navigate('/cart')} className="relative cursor-pointer hover:text-gray-300 focus:outline-none">
              <FontAwesomeIcon icon={faShoppingCart} className="text-xl" />
              {cartItemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {cartItemCount}
                </span>
              )}
            </button>
          </li>

          {isAuthenticated ? (
            <li className="relative" ref={dropdownRef}>
              <button
                onClick={toggleDropdown}
                className="flex items-center hover:text-gray-300 focus:outline-none"
              >
                <FontAwesomeIcon icon={faUser} className="text-xl" />
                <span className="ml-2 hidden sm:inline truncate max-w-[150px]">{userDisplayName}</span>
              </button>
              {isDropdownOpen && (
                <ul className="absolute right-0 mt-2 w-48 bg-white text-gray-800 rounded-md shadow-lg z-10">
                  <li>
                    <button onClick={handleLogout} className="block w-full text-left px-4 py-2 hover:bg-gray-100">
                      Logout
                    </button>
                  </li>
                </ul>
              )}
            </li>
          ) : (
            <>
              <li>
                <NavLink to="/register" className={({ isActive }) => isActive ? 'text-blue-400' : 'hover:text-gray-300'}>
                  Register
                </NavLink>
              </li>
              <li>
                <NavLink to="/login" className={({ isActive }) => isActive ? 'text-blue-400' : 'hover:text-gray-300'}>
                  Login
                </NavLink>
              </li>
            </>
          )}
        </ul>

        {/* Mobile Hamburger */}
        <div className="md:hidden">
          <button className='cursor-pointer' onClick={toggleMobileMenu}>
            <FontAwesomeIcon icon={isMobileMenuOpen ? faTimes : faBars} className="text-2xl" />
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden mt-4 px-4 space-y-4 bg-gray-900 pb-4">
          <ul className="flex flex-col space-y-3">
            {navLinks}
          </ul>
          <ul className="flex flex-col space-y-3 mt-4">
            
            <li>
              <button onClick={() => navigate('/cart')} className="flex items-center space-x-2 text-left">
                <FontAwesomeIcon icon={faShoppingCart} className="text-xl" />
                <span>Cart ({cartItemCount})</span>
              </button>
            </li>
            {isAuthenticated ? (
              <li>
                <button onClick={handleLogout} className="block w-full text-left px-4 py-2 hover:bg-gray-700 rounded">
                  Logout
                </button>
              </li>
            ) : (
              <>
                <li>
                  <NavLink to="/register" className="block hover:text-green-300">
                    Register
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/login" className="block hover:text-green-300">
                    Login
                  </NavLink>
                </li>
              </>
            )}
            <li>
              <NavLink to="/services" className="block bg-white text-green-700 rounded hover:text-green-600 px-4 py-2 text-center">
                Shop now
              </NavLink>
            </li>
          </ul>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
