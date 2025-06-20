// src/pages/Checkout.jsx
import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { toast } from 'react-toastify';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const PAYSTACK_PUBLIC_KEY = 'your-paystack-public-key';

const ghanaRegions = [
  'Ahafo',
  'Ashanti',
  'Bono',
  'Bono East',
  'Central',
  'Eastern',
  'Greater Accra',
  'North East',
  'Northern',
  'Oti',
  'Savannah',
  'Upper East',
  'Upper West',
  'Volta',
  'Western',
  'Western North',
];

const LocationMarker = ({ position, setPosition }) => {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });
  return position ? <Marker position={position}></Marker> : null;
};

const RegionDropdown = ({ value, onChange, disabled }) => {
  const [searchTerm, setSearchTerm] = useState(value || '');
  const [isOpen, setIsOpen] = useState(false);
  const [filteredRegions, setFilteredRegions] = useState(ghanaRegions);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    setSearchTerm(value || '');
    setFilteredRegions(
      ghanaRegions.filter((region) =>
        region.toLowerCase().includes((searchTerm || '').toLowerCase())
      )
    );
  }, [value, searchTerm]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (region) => {
    onChange(region);
    setSearchTerm(region);
    // Close dropdown after selection
    setIsOpen(false);
    
  };

  const handleClear = (e) => {
    e.stopPropagation();
    setSearchTerm('');
    onChange('');
    setIsOpen(true);
    inputRef.current.focus();
  };

  const handleKeyDown = (e, region) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleSelect(region);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Select Region"
          className="input-style pr-10"
          disabled={disabled}
          aria-label="Select Region"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-auto">
          {searchTerm && (
            <button
              type="button"
              onClick={handleClear}
              className="text-gray-500 cursor-pointer hover:text-gray-700 focus:outline-none mr-2"
              aria-label="Clear region selection"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="text-gray-500 cursor-pointer hover:text-gray-700 focus:outline-none"
            aria-label={isOpen ? 'Close region dropdown' : 'Open region dropdown'}
          >
            <svg
              className={`h-5 w-5 transform transition-transform duration-200 ${
                isOpen ? 'rotate-180' : 'rotate-0'
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        </div>
      </div>
      {isOpen && (
        <ul
          className="absolute z-10 w-full bg-white border border-gray-300 rounded-xl mt-1 max-h-60 overflow-y-auto shadow-lg"
          role="listbox"
        >
          {filteredRegions.length > 0 ? (
            filteredRegions.map((region) => (
              <li
                key={region}
                onClick={() => handleSelect(region)}
                onKeyDown={(e) => handleKeyDown(e, region)}
                className="px-4 py-2 cursor-pointer hover:bg-green-100 focus:bg-green-100 focus:outline-none"
                role="option"
                tabIndex={0}
                aria-selected={value === region}
              >
                {region}
              </li>
            ))
          ) : (
            <li className="px-4 py-2 text-gray-500">No regions found</li>
          )}
        </ul>
      )}
    </div>
  );
};

const Checkout = () => {
  const { cart, clearCart } = useContext(CartContext);
  const { user, loading: authLoading } = useContext(AuthContext);
  const navigate = useNavigate();

  // backend URL from environment variable
  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000';

  const [deliveryDetails, setDeliveryDetails] = useState({
    name: user ? `${user.first_name} ${user.last_name}`.trim() : '',
    phone: '',
    email: user?.email || '',
    address: '',
    region: 'Greater Accra', // Default region
    landmark: '',
    latitude: 5.6037, // Default Accra
    longitude: -0.1870,
  });
  const [deliveryCost, setDeliveryCost] = useState(0);
  const [deliveryId, setDeliveryId] = useState(null);
  const [addressId, setAddressId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const subtotal = cart.reduce((sum, item) => sum + item.quantity * item.price, 0);
  const taxRate = 0.05;
  const taxAmount = (subtotal + deliveryCost) * taxRate;
  const total = subtotal + deliveryCost + taxAmount;

  // check if the logged-in has verified their email
  useEffect(() => {
    if (user.is_verified === false) {
      toast.error('Please verify your email before proceeding to checkout.', {
        position: 'top-right',
      });
      navigate('/temp-verify-email/?is-verified=false&email=' + encodeURIComponent(user.email));
      return;
    }
  }, [user]);

  useEffect(() => {
    console.log('Checkout: user=', user);
    console.log('Checkout: cart=', cart);
    console.log('Checkout: deliveryDetails=', deliveryDetails);
  }, [user, cart, deliveryDetails]);

  const createAddress = async () => {
    try {
      const response = await axios.post(
        `${backendUrl}/api/addresses/create/`,
        deliveryDetails,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
        }
      );
      setAddressId(response.data.id);
      return response.data.id;
    } catch (err) {
      throw new Error('Failed to save address: ' + err.message);
    }
  };

  const fetchDeliveryCost = async () => {
    try {
      const response = await axios.post(
        `${backendUrl}/api/delivery/cost/`,
        {
          delivery_latitude: deliveryDetails.latitude,
          delivery_longitude: deliveryDetails.longitude,
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
        }
      );
      setDeliveryCost(response.data.delivery_cost);
      setDeliveryId(response.data.delivery_id);
    } catch (err) {
      throw new Error('Failed to calculate delivery cost: ' + err.message);
    }
  };

  const initiatePayment = async () => {
    try {
      const response = await axios.post(
        `${backendUrl}/api/payments/initialize/`,
        { amount: total },
        { headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` } }
      );
      const { authorization_url, reference, payment_id } = response.data;

      const paystack = new window.PaystackPop();
      paystack.newTransaction({
        key: PAYSTACK_PUBLIC_KEY,
        email: user.email,
        amount: total * 100,
        reference,
        onSuccess: async () => {
          try {
            await confirmPayment(payment_id);
            await createOrder(payment_id);
          } catch (err) {
            setError(err.message || 'Payment failed.');
            toast.error(err.message || 'Payment failed.', { position: 'top-right' });
            setLoading(false);
          }
        },
        onCancel: () => {
          setError('Payment cancelled.');
          toast.error('Payment cancelled.', { position: 'top-right' });
          setLoading(false);
        },
      });
    } catch (err) {
      throw new Error('Failed to initiate payment: ' + err.message);
    }
  };

  const confirmPayment = async (payment_id) => {
    try {
      const response = await axios.post(
        `${backendUrl}/api/payments/verify/`,
        { payment_id },
        { headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` } }
      );
      if (response.data.status !== 'SUCCESS') {
        throw new Error('Payment verification failed.');
      }
    } catch (err) {
      throw err;
    }
  };

  const createOrder = async (payment_id) => {
    try {
      await axios.post(
        `${backendUrl}/api/orders/create/`,
        { cart, address_id: addressId, payment_id, delivery_id: deliveryId },
        { headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` } }
      );
      clearCart();
      toast.success('Order placed successfully!', { position: 'top-right' });
      navigate('/dashboard');
    } catch (err) {
      throw new Error('Failed to create order: ' + err.message);
    }
  };

  useEffect(() => {
    if (!authLoading && cart.length === 0) {
      toast.warn('Your cart is empty.', { position: 'top-right' });
      navigate('/services');
    }
  }, [cart, navigate, authLoading]);

  useEffect(() => {
    if (!authLoading && user) {
      setDeliveryDetails((prev) => ({
        ...prev,
        name: `${user.first_name} ${user.last_name}`.trim(),
        email: user.email,
      }));
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (deliveryDetails.latitude && deliveryDetails.longitude) {
      fetchDeliveryCost().catch((err) => {
        setError(err.message);
        toast.error(err.message, { position: 'top-right' });
      });
    }
  }, [deliveryDetails.latitude, deliveryDetails.longitude]);

  const validateDeliveryDetails = () => {
    const { name, phone, email, address, region } = deliveryDetails;
    if (!name || !phone || !email || !address || !region) {
      setError('Please fill in all required delivery details.');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email.');
      return false;
    }
    if (!/^\+?\d{10,15}$/.test(phone)) {
      setError('Please enter a valid phone number.');
      return false;
    }
    if (!ghanaRegions.includes(region)) {
      setError('Please select a valid region.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    if (!validateDeliveryDetails()) {
      setLoading(false);
      return;
    }
    try {
      await createAddress();
      await initiatePayment();
    } catch (err) {
      setError(err.message || 'Checkout failed. Please try again.');
      toast.error(err.message || 'Checkout failed.', { position: 'top-right' });
      setLoading(false);
    }
  };

  if (authLoading) {
    return <div className="text-center py-16">Loading...</div>;
  }

  return (
    <div className="bg-gray-50 py-10 px-4 min-h-screen">
      <div className="max-w-6xl mx-auto bg-white rounded-3xl shadow-2xl p-10 mt-[4rem]">
        <h1 className="text-4xl font-bold text-center text-green-700 mb-10 tracking-tight">
          Checkout
        </h1>
        <form onSubmit={handleSubmit} className="grid lg:grid-cols-3 gap-10">
          {/* Delivery Details */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-2xl font-semibold text-green-600 mb-4">Delivery Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <input
                type="text"
                placeholder="Full Name"
                value={deliveryDetails.name}
                onChange={(e) =>
                  setDeliveryDetails({ ...deliveryDetails, name: e.target.value })
                }
                className="input-style"
                required
                disabled={loading}
                aria-label="Full Name"
              />
              <input
                type="tel"
                placeholder="Phone Number"
                value={deliveryDetails.phone}
                onChange={(e) =>
                  setDeliveryDetails({ ...deliveryDetails, phone: e.target.value })
                }
                className="input-style"
                required
                disabled={loading}
                aria-label="Phone Number"
              />
              <input
                type="email"
                placeholder="Email Address"
                value={deliveryDetails.email}
                onChange={(e) =>
                  setDeliveryDetails({ ...deliveryDetails, email: e.target.value })
                }
                className="input-style"
                required
                disabled={loading}
                aria-label="Email Address"
              />
              <RegionDropdown
                value={deliveryDetails.region}
                onChange={(region) =>
                  setDeliveryDetails({ ...deliveryDetails, region })
                }
                disabled={loading}
              />
              <input
                type="text"
                placeholder="Full Address"
                value={deliveryDetails.address}
                onChange={(e) =>
                  setDeliveryDetails({ ...deliveryDetails, address: e.target.value })
                }
                className="input-style"
                required
                disabled={loading}
                aria-label="Full Address"
              />
              <input
                type="text"
                placeholder="Nearby Landmark (optional)"
                value={deliveryDetails.landmark}
                onChange={(e) =>
                  setDeliveryDetails({ ...deliveryDetails, landmark: e.target.value })
                }
                className="input-style"
                disabled={loading}
                aria-label="Nearby Landmark"
              />
            </div>
            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-700 mb-2">
                Select Delivery Location on Map
              </h3>
              <MapContainer
                center={[deliveryDetails.latitude, deliveryDetails.longitude]}
                zoom={13}
                scrollWheelZoom={false}
                className="h-72 rounded-xl border border-green-200 shadow"
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <LocationMarker
                  position={[deliveryDetails.latitude, deliveryDetails.longitude]}
                  setPosition={(latlng) =>
                    setDeliveryDetails({
                      ...deliveryDetails,
                      latitude: latlng[0],
                      longitude: latlng[1],
                    })
                  }
                />
              </MapContainer>
            </div>
            <div className="pt-6">
              <button
                type="submit"
                className="w-full bg-green-600 text-white font-semibold py-3 rounded-xl hover:bg-green-700 transition duration-300"
                disabled={loading}
                aria-label="Place Order and Pay"
              >
                {loading ? 'Processing...' : 'Place Order & Pay'}
              </button>
              {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
            </div>
          </div>
          {/* Order Summary */}
          <div className="bg-gray-50 rounded-2xl shadow p-6">
            <h2 className="text-2xl font-semibold text-green-600 mb-6">Order Summary</h2>
            <div className="space-y-4 text-sm">
              {cart.map((item) => (
                <div key={item.service_id} className="flex justify-between border-b pb-2">
                  <span>{item.service_name} x {item.quantity}</span>
                  <span className="font-medium text-gray-800">
                    GH₵{(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-6 space-y-2 text-base font-medium text-gray-700">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>GH₵{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery:</span>
                <span>GH₵{deliveryCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax (5%):</span>
                <span>GH₵{taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t pt-3 text-lg font-bold">
                <span>Total:</span>
                <span>GH₵{total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Checkout;