// Modern Cart.jsx – polished responsive design with fixed tooltip
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { TrashIcon, MinusIcon, PlusIcon } from '@heroicons/react/24/outline';

/* ------------------ Tooltip ------------------ */
const Tooltip = ({ message, position = 'top', children }) => {
  const pos = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  }[position] || 'bottom-full left-1/2 -translate-x-1/2 mb-2';

  return (
    <div className="relative inline-flex group">
      {children}
      <span
        className={`pointer-events-none absolute whitespace-nowrap bg-gray-800 text-white text-xs z-10 rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${pos}`}
      >
        {message}
      </span>
    </div>
  );
};

/* ------------------ Main Cart component ------------------ */
const Cart = () => {
  const { cart, updateQuantity, removeFromCart } = useContext(CartContext);
  const { isAuthenticated } = useContext(AuthContext);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get('http://127.0.0.1:8000/api/services/');
        setServices(data);
      } catch {
        toast.error('Failed to load services');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const getService = (id) => services.find((s) => s.id === id) || {};
  const total = cart
    .reduce((t, it) => t + (getService(it.service_id).price || 0) * it.quantity, 0)
    .toFixed(2);

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

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-br from-green-50 to-white">
        <span className="animate-spin h-10 w-10 border-4 border-green-600 border-t-transparent rounded-full" />
      </div>
    );

  return (
    <section className="min-h-screen bg-gradient-to-br from-green-50 to-white pt-24 px-4 md:px-10 lg:px-20 pb-16">
      <div className="max-w-7xl mx-auto mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800">🛒 Your Cart ({cart.length})</h2>
        <button onClick={() => navigate('/services')} className="px-5 py-2 rounded-md bg-primary text-white hover:bg-primary/80 transition cursor-pointer">
          Continue Shopping
        </button>
      </div>

      {cart.length ? (
        <div className="max-w-7xl mx-auto grid lg:grid-cols-3 gap-8">
          {/* Items list */}
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
                      {/* tooltip for decrement button */}
                      <Tooltip message="Decrease quantity" position="top">
                        <button onClick={() => updateQuantity(it.service_id, -1)} className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center hover:bg-gray-300 disabled:opacity-50 cursor-pointer" disabled={it.quantity <= 1}>
                          <MinusIcon className="w-4" />
                        </button>
                      </Tooltip>
                      <span className="w-8 text-center">{it.quantity}</span>
                      {/* tooltip for increment button */}
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

          {/* Summary */}
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
            <div className="flex justify-between font-semibold text-gray-700">
              <span>Total</span>
              <span>₵{total}</span>
            </div>
            <button onClick={handleCheckout} className="w-full bg-primary hover:bg-primary/80 text-white py-2 rounded-md font-medium shadow cursor-pointer transition ">
              Checkout
            </button>
          </aside>
        </div>
      ) : (
        <div className="text-center mt-24 space-y-6">
          <p className="text-xl font-medium">Your cart is empty 🥲</p>
          <button onClick={() => navigate('/services')} className="px-6 py-3 bg-primary text-white rounded-md hover:bg-primary/80 transition">
            Browse Services
          </button>
        </div>
      )}
    </section>
  );
};

export default Cart;
