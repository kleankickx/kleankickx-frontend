import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { TrashIcon, MinusIcon, PlusIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { FaSpinner } from 'react-icons/fa6';
import axios from 'axios';
import Tooltip from '../components/Tooltip';


const Cart = () => {
  const { cart, updateQuantity, removeFromCart } = useContext(CartContext);
  const { isAuthenticated, discounts, user, api } = useContext(AuthContext);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const baseURL = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000';
  const [signupDiscountUsed, setSignupDiscountUsed] = useState(false)

  const fetchServices = async () => {
    setLoading(true);
    setError(null);
    try {
      const servicePromises = cart
        .filter(item => item.service_id)
        .map(item => axios.get(`${baseURL}/api/services/${item.service_id}/`));
      
      const responses = await Promise.all(servicePromises);
      setServices(responses.map(res => res.data));
    } catch (error) {
      console.error('Failed to fetch services:', error);
      setError('Failed to load service details. Please try again.');
      toast.error('Failed to load some service details');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserDiscountStatus = async () => {
    try{
      response = api.get('/api/users/discount-status/')
      setSignupDiscountUsed(response.data)
    } catch (error) {
      console.log("Error: ", error)
    }
  }

  useEffect(() => {
    const initializeData = async () => {
      await fetchServices();
      await fetchUserDiscountStatus();
    };
    
    initializeData();
  }, []);
  

  const getService = (id) => services.find((s) => s.id === id) || {};
  const subtotal = cart
    .reduce((t, it) => t + (getService(it.service_id).price || 0) * it.quantity, 0)
    .toFixed(2);
  
  // Calculate discount only if user exists and hasn't used their signup discount
  const signupDiscount = discounts?.find(d => d.type === 'Signup Discount');
  const canUseDiscount = user && !signupDiscountUsed && signupDiscount;
  const discountAmount = canUseDiscount 
    ? ((parseFloat(subtotal) * parseFloat(signupDiscount.percentage)) / 100).toFixed(2)
    : 0;
  const total = canUseDiscount 
    ? (parseFloat(subtotal) - parseFloat(discountAmount)).toFixed(2)
    : subtotal;

  const handleRemove = (id) => {
    removeFromCart(id);
    toast.info('Item removed');
  };

  const handleCheckout = () => {
    if (!cart.length) return toast.error('Your cart is empty');
    if (!isAuthenticated) {
      toast.warn('Login required');
      return navigate('/login?continue=/checkout');
    }
    navigate('/checkout');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen flex-col space-y-2">
        <FaSpinner className="animate-spin h-8 w-8 text-primary" />
        <p className="text-gray-600 mt-4">Loading your cart...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen flex-col space-y-4 px-4">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md max-w-md w-full">
          <div className="flex items-center gap-3">
            <svg className="h-6 w-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-700">{error}</p>
          </div>
          <button
            onClick={fetchServices}
            className="mt-3 flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors cursor-pointer"
          >
            <ArrowPathIcon className="w-5 h-5" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <section className="min-h-screen bg-gradient-to-br from-green-50 to-white pt-[2rem] px-4 md:px-10 lg:px-20 pb-16">
      <div className="max-w-7xl mx-auto mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800">🛒 Your Cart ({cart.length})</h2>
        <button onClick={() => navigate('/services')} className="px-5 py-2 rounded-md bg-primary text-white hover:bg-primary/80 transition cursor-pointer">
          Continue Shopping
        </button>
      </div>

      {cart.length ? (
        <div className="max-w-7xl mx-auto grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {cart.map((it) => {
              const s = getService(it.service_id);
              return (
                <div key={it.service_id} className="bg-white border border-gray-200 rounded-lg p-4 flex flex-col sm:flex-row gap-4">
                  <img src={s.image || 'https://via.placeholder.com/80'} alt={s.name} className="w-28 h-28 object-contain rounded border border-gray-200" />
                  <div className="flex-1 grid sm:grid-cols-4 gap-4 items-center text-sm">
                    <div className="sm:col-span-2">
                      <p className="font-semibold text-gray-800 mb-1 truncate max-w-xs">{s.name}</p>
                      <p className="text-primary">₵{parseFloat(s.price || 0).toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-2 justify-start sm:justify-center">
                      <Tooltip message="Decrease quantity" position="top">
                        <button onClick={() => updateQuantity(it.service_id, -1)} className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center hover:bg-gray-300 disabled:opacity-50 cursor-pointer" disabled={it.quantity <= 1}>
                          <MinusIcon className="w-4" />
                        </button>
                      </Tooltip>
                      <span className="w-8 text-center">{it.quantity}</span>
                      <Tooltip message="Increase quantity" position="top">
                        <button onClick={() => updateQuantity(it.service_id, 1)} className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center hover:bg-gray-300 cursor-pointer">
                          <PlusIcon className="w-4" />
                        </button>
                      </Tooltip>
                    </div>
                    <div className="text-right sm:text-center hidden lg:block font-medium">₵{((s.price || 0) * it.quantity).toFixed(2)}</div>
                  </div>
                  <div className="flex items-center justify-between">
                    <Tooltip message="Remove from cart" position="right">
                      <button onClick={() => handleRemove(it.service_id)} className="text-red-600 hover:text-red-800 cursor-pointer p-2 hover:bg-red-100 rounded">
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </Tooltip>
                    <div className="block lg:hidden font-medium">
                      Subtotal: ₵{((s.price || 0) * it.quantity).toFixed(2)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          <aside className="bg-white border border-gray-200 rounded-lg shadow p-6 space-y-6 h-max sticky top-28">
            <h3 className="text-lg font-semibold">Order Summary</h3>
            <div className="space-y-2 max-h-40 overflow-y-auto pr-2 text-sm">
              {cart.map((it) => {
                const s = getService(it.service_id);
                return (
                  <div key={it.service_id} className="flex justify-between">
                    <span>{s.name} × {it.quantity}</span>
                    <span>₵{((s.price || 0) * it.quantity).toFixed(2)}</span>
                  </div>
                );
              })}
            </div>
            
            <hr className="border-gray-200" />
            
            <div className="space-y-3">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>₵{subtotal}</span>
              </div>
              
              {canUseDiscount && (
                <>
                  <div className="flex flex-col bg-green-50 rounded-lg p-3 -mx-1">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-green-700 font-medium">Sign-Up Discount</span>
                      </div>
                      <span className="text-green-700 font-medium">-₵{discountAmount}</span>
                    </div>
                    <div className="text-xs text-green-600 mt-1">
                      {signupDiscount.percentage}% off your first order
                    </div>
                  </div>
                </>
              )}
              
              <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                <span className="font-semibold text-gray-800">Total</span>
                <div className="text-right">
                  {canUseDiscount && (
                    <div className="text-xs text-gray-400 line-through mb-0.5">₵{subtotal}</div>
                  )}
                  <span className="text-lg font-bold text-primary">₵{total}</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              className="w-full bg-primary hover:bg-primary/90 text-white py-3 rounded-md font-medium shadow-md cursor-pointer transition transform hover:scale-[1.01]"
              disabled={services.length === 0 || cart.length === 0}
              aria-label="Proceed to checkout"
            >
              {services.length === 0 || cart.length === 0 ? 'No services available' : 'Proceed to Checkout'}
            </button>

            {canUseDiscount && (
              <div className="text-xs text-gray-500 text-center">
                Discount will be automatically applied at checkout
              </div>
            )}
          </aside>
        </div>
      ) : (
        <div className="text-center">
          <div className="max-w-md mx-auto">
            <div className="w-24 h-24 bg-gray-100 rounded-full mx-auto mb-6 flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-medium text-gray-900 mb-2">Your cart is empty</h2>
            <p className="text-gray-500 mb-6">Looks like you haven't added any services yet</p>
            <button
              onClick={() => navigate('/services')}
              className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors font-medium cursor-pointer"
            >
              Browse Services
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

export default Cart;