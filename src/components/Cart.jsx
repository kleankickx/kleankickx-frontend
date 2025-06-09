// src/components/Cart.jsx
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { CartContext } from '../context/CartContext';
import { toast } from 'react-toastify';

const Cart = () => {
  const { cart, updateQuantity, removeFromCart } = useContext(CartContext);
  const [services, setServices] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await axios.get('http://127.0.0.1:8000/api/services/');
        setServices(response.data);
      } catch (err) {
        setError('Failed to load services.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchServices();
  }, []);

  const getServiceDetails = (serviceId) => {
    return services.find(service => service.id === serviceId) || {};
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => {
      const service = getServiceDetails(item.service_id);
      return total + (service.price || 0) * item.quantity;
    }, 0).toFixed(2);
  };

  const handleRemoveFromCart = (serviceId) => {
    removeFromCart(serviceId);
    toast.success('Item removed from cart!', {
      position: 'top-right',
      autoClose: 3000,
    });
  };

  const handleCheckout = () => {
    alert('Proceeding to checkout (feature coming soon)!');
  };

  if (isLoading) {
    {/* proper loading screen */}
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 py-8 h-[100vh] px-4 md:px-12 lg:px-24 mt-[4rem]">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white shadow rounded p-6 border-l-4 border-green-600 mb-6">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-800">
              {/* closeable alert */}
              <strong className="text-green-600">Cart</strong> - You have {cart.length} item{cart.length !== 1 ? 's' : ''} in your cart.
            </p>
            <button
              onClick={() => navigate('/services')}
              className="bg-green-600 cursor-pointer hover:bg-green-700 text-white py-1 px-4 rounded text-sm"
            >
              Continue Shopping
            </button>
          </div>
        </div>

        {cart.length === 0 ? (
          <div className="text-center mt-16">
            <p className="text-lg mb-4">Your cart is empty.</p>
            <button
              onClick={() => navigate('/services')}
              className="bg-blue-600 text-white px-6 py-2 rounded cursor-pointer hover:bg-blue-700"
            >
              Continue Shopping
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="md:col-span-2 space-y-6">
              <div className="bg-white border  rounded">
                <div className="grid grid-cols-6 p-4 border-b font-semibold text-sm text-gray-600 ">
                  <p className="col-span-2">Product</p>
                  <p>Price</p>
                  <p>Quantity</p>
                  <p>Subtotal</p>
                  <p>Action</p>
                </div>

                {cart.map(item => {
                  const service = getServiceDetails(item.service_id);
                  return (
                    <div key={item.service_id} className="grid grid-cols-6 items-center p-4 border-b ">
                      <div className="col-span-2 flex items-center gap-4">
                        <img
                          src={service.image || 'https://via.placeholder.com/64'}
                          alt={service.name}
                          className="w-20 h-20 object-contain rounded border border-gray-200 shadow-sm"
                        />
                        <div>
                          <p className="font-semibold text-green-600">{service.name}</p>
                          
                        </div>
                      </div>
                      <p>₵{parseFloat(service.price || 0).toFixed(2)}</p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.service_id, -1)}
                          className="w-6 h-6 cursor-pointer bg-gray-200 rounded hover:bg-gray-300"
                        >
                          -
                        </button>
                        <span>{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.service_id, 1)}
                          className="w-6 h-6 cursor-pointer bg-gray-200 rounded hover:bg-gray-300"
                        >
                          +
                        </button>
                      </div>
                      <p>₵{(parseFloat(service.price || 0) * item.quantity).toFixed(2)}</p>
                      <button
                        onClick={() => handleRemoveFromCart(item.service_id)}
                        className="bg-red-500 text-white w-[5rem] cursor-pointer py-2 rounded hover:bg-red-700 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  );
                })}

                {/* Coupon + Update */}
                <div className="flex flex-col md:flex-row items-center justify-between p-4">
                  <div className="flex gap-2 w-full md:w-auto">
                    <input
                      type="text"
                      placeholder="Coupon Code"
                      className="border rounded p-2 w-full md:w-64 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled
                    />
                    <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm disabled:opacity-50 disabled:cursor-not-allowed" disabled>
                      Apply Coupon
                    </button>
                  </div>
                  {/* <button className="text-green-700 text-sm font-semibold mt-4 md:mt-0 hover:underline" disabled>
                    Update Cart
                  </button> */}
                </div>
              </div>
            </div>

            {/* Cart Total */}
            <div className="bg-white border rounded shadow p-6 space-y-4 h-[371px]">
              <h3 className="text-lg font-semibold">Cart Total</h3>
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>₵{calculateTotal()}</span>
              </div>
              {/* dasheses divider */}
              <hr className="border-t border-gray-300 my-2" />

              {/* <div className="text-sm text-gray-600">
                <p><strong>Shipping</strong></p>
                <p>Free shipping</p>
                <p>Shipping to Ghana, Accra,<br />Accra, Greater Accra, 00233.</p>
                <button className="text-green-600 font-medium hover:underline mt-1 text-sm">
                  Change Address
                </button>
              </div> */}
              <div className="space-y-2 text-sm text-gray-700 h-32 overflow-y-auto">
                <h4 className="font-medium mb-2">Summary</h4>
                {cart.map(item => {
                  const service = getServiceDetails(item.service_id);
                  const subtotal = (service.price || 0) * item.quantity;
                  return (
                    <div key={item.service_id} className="flex justify-between">
                      <span>{service.name} × {item.quantity}</span>
                      <span>₵{parseFloat(subtotal).toFixed(2)}</span>
                    </div>
                  );
                })}
              </div>

              <hr className="border-t border-gray-300 my-2" />

              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>₵{calculateTotal()}</span>
              </div>
              <button
                onClick={handleCheckout}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded text-center font-medium"
              >
                Proceed to Checkout
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;
