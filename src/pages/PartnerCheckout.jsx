// src/pages/PartnerCheckout.jsx
import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { APIProvider } from '@vis.gl/react-google-maps';
import { 
  Package, ArrowLeft, Truck, MapPin, 
  CreditCard, Home, Store, CheckCircle, AlertCircle
} from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../api';
import PlaceAutocompleteElementWrapper from "../components/PlaceAutoCompleteElementWrapper";
import MapHandler from "../components/MapHandler";
import { GoogleMapsProvider } from "../components/GoogleMapsProvider";

const PartnerCheckout = () => {
  const navigate = useNavigate();
  const { user, isPartner } = useContext(AuthContext);
  
  const [checkoutItems, setCheckoutItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deliveryOption, setDeliveryOption] = useState('SELF_HANDLED');
  
  // Google Maps API Key
  const Maps_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const DEFAULT_CENTER = { lat: 5.6037, lng: -0.1870 }; // Accra coordinates
  
  // Location states
  const [pickup, setPickup] = useState(null);
  const [delivery, setDelivery] = useState(null);
  const [useSame, setUseSame] = useState(false);
  const [pickupInputValue, setPickupInputValue] = useState('');
  const [deliveryInputValue, setDeliveryInputValue] = useState('');
  const [pickupRegion, setPickupRegion] = useState('');
  const [deliveryRegion, setDeliveryRegion] = useState('');
  const [activeInput, setActiveInput] = useState(null);
  const [pickupTime, setPickupTime] = useState(null);
  
  // Validation errors
  const [validationErrors, setValidationErrors] = useState({
    pickup: false,
    delivery: false,
    pickupTime: false,
    phone: false
  });
  
  // Phone number
  const [phoneNumber, setPhoneNumber] = useState(user?.phone_number || '');
  const [isPhoneValid, setIsPhoneValid] = useState(true);

  // Helper function to safely get cost as number
  const getSafeCost = (location) => {
    if (!location) return 0;
    const cost = location.cost;
    if (typeof cost === 'number') return cost;
    if (typeof cost === 'string') return parseFloat(cost) || 0;
    return 0;
  };

  // Load checkout items from localStorage
  useEffect(() => {
    if (!isPartner) {
      navigate('/auth/login');
      return;
    }
    
    const storedItems = localStorage.getItem('partner_checkout_items');
    if (storedItems) {
      try {
        const items = JSON.parse(storedItems);
        setCheckoutItems(items);
        if (items.length === 0) {
          toast.error('Your order is empty');
          navigate('/partner/services');
        }
      } catch (error) {
        console.error('Failed to parse checkout items:', error);
        navigate('/partner/services');
      }
    } else {
      navigate('/partner/services');
    }
    setLoading(false);
  }, [isPartner, navigate]);

  // Load saved locations from localStorage
  useEffect(() => {
    const savedPickup = localStorage.getItem('partner_pickupLocation');
    const savedDelivery = localStorage.getItem('partner_deliveryLocation');
    const savedPickupValue = localStorage.getItem('partner_pickupInputValue');
    const savedDeliveryValue = localStorage.getItem('partner_deliveryInputValue');
    const savedPickupTime = localStorage.getItem('partner_pickupTime');
    
    if (savedPickup) setPickup(JSON.parse(savedPickup));
    if (savedDelivery) setDelivery(JSON.parse(savedDelivery));
    if (savedPickupValue) setPickupInputValue(savedPickupValue);
    if (savedDeliveryValue) setDeliveryInputValue(savedDeliveryValue);
    if (savedPickupTime) setPickupTime(JSON.parse(savedPickupTime));
  }, []);

  const calculateSubtotal = () => {
    return checkoutItems.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
  };

  // Get pickup cost from the selected location (from Zippy API)
  const getPickupCost = () => {
    if (deliveryOption !== 'DELIVERY_PICKUP') return 0;
    if (!pickup) return 0;
    return getSafeCost(pickup);
  };

  // Get delivery cost from the selected location (from Zippy API)
  const getDeliveryCost = () => {
    if (deliveryOption !== 'DELIVERY_PICKUP') return 0;
    
    // If using same as pickup, use pickup cost
    if (useSame) {
      return getSafeCost(pickup);
    }
    
    // Otherwise use delivery location cost
    return getSafeCost(delivery);
  };

  const calculateTotal = () => {
    return calculateSubtotal() + getPickupCost() + getDeliveryCost();
  };

  // Format cost for display
  const formatCost = (cost) => {
    if (cost === undefined || cost === null) return null;
    const numCost = typeof cost === 'number' ? cost : parseFloat(cost);
    if (isNaN(numCost)) return null;
    return numCost.toFixed(2);
  };

  // Handle place selection from map
  const handlePlaceSelect = useCallback((location, type, silent = false) => {
    // Clear validation error for this field when location is selected
    setValidationErrors(prev => ({ ...prev, [type]: false }));
    
    if (type === 'pickup') {
      setPickup(location);
      setPickupInputValue(location ? location.address : '');
      setPickupRegion(location ? location.region : '');
      localStorage.setItem('partner_pickupLocation', JSON.stringify(location));
      localStorage.setItem('partner_pickupInputValue', location ? location.address : '');
      
      if (useSame && location) {
        setDelivery({ ...location, region: pickupRegion });
        setDeliveryInputValue(location.address);
        setDeliveryRegion(location.region);
        localStorage.setItem('partner_deliveryLocation', JSON.stringify({ ...location, region: pickupRegion }));
        localStorage.setItem('partner_deliveryInputValue', location.address);
        setValidationErrors(prev => ({ ...prev, delivery: false }));
      }
    } else {
      setDelivery(location);
      setDeliveryInputValue(location ? location.address : '');
      setDeliveryRegion(location ? location.region : '');
      localStorage.setItem('partner_deliveryLocation', JSON.stringify(location));
      localStorage.setItem('partner_deliveryInputValue', location ? location.address : '');
    }
    
    setActiveInput(null);
    
    if (!silent && location) {
      const cost = getSafeCost(location);
      toast.success(
        `${type} location set to ${location.areaName || location.name}, ${location.region}
        Cost: GHS ${cost.toFixed(2)}`
      );
    }
  }, [useSame, pickupRegion]);

  // Handle pickup time selection
  const handlePickupTimeSelect = useCallback((time) => {
    setPickupTime(time);
    setValidationErrors(prev => ({ ...prev, pickupTime: false }));
    if (time) {
      localStorage.setItem('partner_pickupTime', JSON.stringify(time));
    }
  }, []);

  // Event listener for map location selection
  useEffect(() => {
    const listener = (event) => {
      const { location, type } = event.detail;
      handlePlaceSelect(location, type);
    };
    window.addEventListener('mapLocationSelected', listener);
    return () => {
      window.removeEventListener('mapLocationSelected', listener);
    };
  }, [handlePlaceSelect]);

  // Sync delivery when useSame is true
  useEffect(() => {
    if (useSame && pickup) {
      setDelivery({ ...pickup, region: pickupRegion });
      setDeliveryInputValue(pickup.address);
      setDeliveryRegion(pickupRegion);
      localStorage.setItem('partner_deliveryLocation', JSON.stringify({ ...pickup, region: pickupRegion }));
      localStorage.setItem('partner_deliveryInputValue', pickup.address);
      setValidationErrors(prev => ({ ...prev, delivery: false }));
    } else if (useSame && !pickup) {
      setDelivery(null);
      setDeliveryInputValue('');
      setDeliveryRegion('');
      localStorage.removeItem('partner_deliveryLocation');
      localStorage.removeItem('partner_deliveryInputValue');
    }
  }, [useSame, pickup, pickupRegion]);

  // Save pickup time to localStorage
  useEffect(() => {
    if (pickupTime) {
      localStorage.setItem('partner_pickupTime', JSON.stringify(pickupTime));
    }
  }, [pickupTime]);

  const validateAddresses = () => {
    const errors = {};
    
    if (deliveryOption === 'DELIVERY_PICKUP') {
      // Check pickup address
      if (!pickup) {
        errors.pickup = true;
        toast.error('Please select a pickup address');
      } else {
        const pickupCost = getSafeCost(pickup);
        if (pickupCost === 0 && pickup.cost !== undefined) {
          toast.warning('Pickup cost is still loading. Please wait a moment.');
          return false;
        }
      }
      
      // Check delivery address (only if not using same as pickup)
      if (!useSame && !delivery) {
        errors.delivery = true;
        toast.error('Please select a delivery address');
      } else if (!useSame && delivery) {
        const deliveryCost = getSafeCost(delivery);
        if (deliveryCost === 0 && delivery.cost !== undefined) {
          toast.warning('Delivery cost is still loading. Please wait a moment.');
          return false;
        }
      }
      
      // Check pickup time
      if (!pickupTime) {
        errors.pickupTime = true;
        toast.error('Please wait for pickup time to load or reselect location');
      }
    }
    
    // Check phone number
    if (!isPhoneValid || !phoneNumber) {
      errors.phone = true;
      toast.error('Please enter a valid Ghana phone number');
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validatePhone = (number) => {
    const cleaned = number.replace(/\D/g, '');
    const ghanaRegex = /^(233|0)?(20|24|25|26|27|28|29|30|50|54|55|56|57|59)[0-9]{7}$/;
    return ghanaRegex.test(cleaned);
  };

  const handlePhoneChange = (e) => {
    const value = e.target.value;
    setPhoneNumber(value);
    const isValid = validatePhone(value);
    setIsPhoneValid(isValid);
    if (isValid) {
      setValidationErrors(prev => ({ ...prev, phone: false }));
    }
  };



// src/pages/PartnerCheckout.jsx - Updated handlePlaceOrder function

const handlePlaceOrder = async () => {
  if (!validateAddresses()) {
    return;
  }
  
  if (!isPhoneValid) {
    toast.error('Please enter a valid Ghana phone number');
    return;
  }
  
  setSubmitting(true);
  
  try {
    const cartItems = checkoutItems.map(item => ({
      service_id: item.service_id || item.id,
      quantity: item.quantity,
      unit_price: item.unit_price,
    }));
    
    const orderData = {
      cart_items: cartItems,
      is_self_handled: deliveryOption === 'SELF_HANDLED',
      phone_number: phoneNumber,
    };
    
    // Add address details if not self-handled
    if (deliveryOption === 'DELIVERY_PICKUP') {
      orderData.pickup_location = pickup;
      orderData.delivery_location = delivery || pickup;
      orderData.pickup_time = pickupTime?.value || pickupTime;
    }
    
    console.log('Placing order:', orderData);
    
    const response = await api.post('/api/orders/partner/create/', orderData);
    
    if (response.data.success) {
      // Order placed successfully - no immediate payment required
      toast.success(response.data.message || 'Order placed successfully!');
      
      // Clear checkout from localStorage
      localStorage.removeItem('partner_checkout_items');
      localStorage.removeItem('partner_pickupLocation');
      localStorage.removeItem('partner_deliveryLocation');
      localStorage.removeItem('partner_pickupTime');
      
      // Get invoice info from response
      const invoiceInfo = response.data.invoice;
      
      // Redirect to order confirmation/success page with invoice details
      if (response.data.order_reference_code) {
        navigate(`/partner/order-success/${response.data.order_reference_code}`, {
          state: {
            order: response.data,
            invoice: invoiceInfo,
            message: response.data.message
          }
        });
      } else {
        // Fallback to dashboard
        navigate('/partner/dashboard', {
          state: {
            message: 'Order placed successfully! It will be added to your next invoice.'
          }
        });
      }
    } else {
      throw new Error(response.data.message || 'Order creation failed');
    }
  } catch (error) {
    console.error('Order placement failed:', error);
    const errorMsg = error.response?.data?.error || 'Failed to place order. Please try again.';
    toast.error(errorMsg);
  } finally {
    setSubmitting(false);
  }
};

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading checkout...</p>
        </div>
      </div>
    );
  }

  return (
    <GoogleMapsProvider
      onLoad={() => console.log('Google Maps API loaded for partner checkout!')}
    >
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-primary/90 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <button
              onClick={() => navigate('/partner/services')}
              className="flex items-center gap-2 text-white/80 hover:text-white mb-4 transition-colors"
            >
              <ArrowLeft size={20} />
              <span>Back to Services</span>
            </button>
            <div className="flex items-center gap-3">
              <Package className="h-8 w-8" />
              <div>
                <h1 className="text-2xl font-bold">Checkout</h1>
                <p className="mt-1 text-white/80 text-sm">
                  Review your order and provide delivery details
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Order Items & Forms */}
            <div className="lg:col-span-2 space-y-6">
              {/* Order Items */}
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h2 className="text-lg font-semibold text-gray-900">Order Items</h2>
                </div>
                <div className="divide-y divide-gray-100">
                  {checkoutItems.map((item) => (
                    <div key={item.id} className="px-6 py-4 flex justify-between items-center">
                      <div>
                        <h3 className="font-medium text-gray-900">{item.name}</h3>
                        <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">
                          GHS {(item.unit_price * item.quantity).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-xs text-gray-500">
                          GHS {item.unit_price.toLocaleString(undefined, { minimumFractionDigits: 2 })} each
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Phone Number Input */}
              <div className={`bg-white rounded-xl shadow-sm p-6 transition-all ${validationErrors.phone ? 'border-2 border-red-500' : ''}`}>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={handlePhoneChange}
                    placeholder="024XXXXXXX"
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                      !isPhoneValid && phoneNumber ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {!isPhoneValid && phoneNumber && (
                    <p className="mt-1 text-xs text-red-500">Please enter a valid Ghana phone number (e.g., 024XXXXXXX)</p>
                  )}
                  {validationErrors.phone && !phoneNumber && (
                    <p className="mt-1 text-xs text-red-500">Phone number is required</p>
                  )}
                </div>
              </div>

              {/* Delivery Options */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Delivery Options</h2>
                
                <div className="space-y-4">
                  {/* Self-Handled Option */}
                  <label className={`flex items-start p-4 border rounded-lg cursor-pointer transition-all ${
                    deliveryOption === 'SELF_HANDLED' 
                      ? 'border-primary bg-primary/5' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <input
                      type="radio"
                      name="deliveryOption"
                      value="SELF_HANDLED"
                      checked={deliveryOption === 'SELF_HANDLED'}
                      onChange={(e) => setDeliveryOption(e.target.value)}
                      className="mt-1 text-primary focus:ring-primary"
                    />
                    <div className="ml-3 flex-1">
                      <div className="flex items-center gap-2">
                        <Store size={18} className="text-gray-600" />
                        <span className="font-medium text-gray-900">Self-Handled</span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        You handle your own pickup and delivery. No additional costs.
                      </p>
                      <div className="mt-2 text-xs text-green-600 flex items-center gap-1">
                        <CheckCircle size={12} />
                        <span>You will arrange pickup and delivery yourself</span>
                      </div>
                    </div>
                  </label>

                  {/* Delivery & Pickup Option */}
                  <label className={`flex items-start p-4 border rounded-lg cursor-pointer transition-all ${
                    deliveryOption === 'DELIVERY_PICKUP' 
                      ? 'border-primary bg-primary/5' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <input
                      type="radio"
                      name="deliveryOption"
                      value="DELIVERY_PICKUP"
                      checked={deliveryOption === 'DELIVERY_PICKUP'}
                      onChange={(e) => setDeliveryOption(e.target.value)}
                      className="mt-1 text-primary focus:ring-primary"
                    />
                    <div className="ml-3 flex-1">
                      <div className="flex items-center gap-2">
                        <Truck size={18} className="text-gray-600" />
                        <span className="font-medium text-gray-900">Full Service</span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        We handle pickup and delivery for you.
                      </p>
                      <div className="mt-2 text-xs text-blue-600 flex items-center gap-1">
                        <AlertCircle size={12} />
                        <span>Pickup and delivery addresses are required</span>
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Address Forms (only for Full Service) */}
              {deliveryOption === 'DELIVERY_PICKUP' && (
                <div className="space-y-6">
                  {/* Pickup Address */}
                  <div className={`bg-white rounded-xl shadow-sm p-6 transition-all ${validationErrors.pickup ? 'border-2 border-red-500' : ''}`}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <MapPin size={20} className="text-primary" />
                        <h2 className="text-lg font-semibold text-gray-900">Pickup Address *</h2>
                      </div>
                      {pickup && (
                        <div className="flex items-center gap-1 text-green-600 text-sm">
                          <CheckCircle size={14} />
                          <span>Selected</span>
                        </div>
                      )}
                      {validationErrors.pickup && !pickup && (
                        <div className="flex items-center gap-1 text-red-500 text-sm">
                          <AlertCircle size={14} />
                          <span>Required</span>
                        </div>
                      )}
                    </div>
                    
                    <PlaceAutocompleteElementWrapper
                      placeholder="Search for your pickup location..."
                      type="pickup"
                      currentInputValue={pickupInputValue}
                      initialLocation={pickup}
                      onPlaceSelect={handlePlaceSelect}
                      region={pickupRegion}
                      pickupTime={pickupTime}
                      setPickupTime={handlePickupTimeSelect}
                      useSame={useSame}
                      onFocus={() => setActiveInput('pickup')}
                    />
                    
                    {pickup && getSafeCost(pickup) > 0 && (
                      <p className="mt-2 text-xs text-green-600">
                        Pickup cost: GHS {formatCost(getSafeCost(pickup))}
                      </p>
                    )}
                    
                    {validationErrors.pickup && !pickup && (
                      <p className="mt-2 text-xs text-red-500">Pickup address is required for Full Service</p>
                    )}
                  </div>

                  {/* Delivery Address (only show if not using same as pickup) */}
                  {!useSame && (
                    <div className={`bg-white rounded-xl shadow-sm p-6 transition-all ${validationErrors.delivery ? 'border-2 border-red-500' : ''}`}>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Home size={20} className="text-primary" />
                          <h2 className="text-lg font-semibold text-gray-900">Delivery Address *</h2>
                        </div>
                        {delivery && (
                          <div className="flex items-center gap-1 text-green-600 text-sm">
                            <CheckCircle size={14} />
                            <span>Selected</span>
                          </div>
                        )}
                        {validationErrors.delivery && !delivery && (
                          <div className="flex items-center gap-1 text-red-500 text-sm">
                            <AlertCircle size={14} />
                            <span>Required</span>
                          </div>
                        )}
                      </div>
                      
                      <PlaceAutocompleteElementWrapper
                        placeholder="Search for your delivery location..."
                        type="delivery"
                        currentInputValue={deliveryInputValue}
                        initialLocation={delivery}
                        onPlaceSelect={handlePlaceSelect}
                        region={deliveryRegion}
                        pickupTime={pickupTime}
                        setPickupTime={handlePickupTimeSelect}
                        useSame={useSame}
                        onFocus={() => setActiveInput('delivery')}
                      />
                      
                      {delivery && getSafeCost(delivery) > 0 && (
                        <p className="mt-2 text-xs text-green-600">
                          Delivery cost: GHS {formatCost(getSafeCost(delivery))}
                        </p>
                      )}
                      
                      {validationErrors.delivery && !delivery && (
                        <p className="mt-2 text-xs text-red-500">Delivery address is required for Full Service</p>
                      )}
                    </div>
                  )}

                  {/* Same as pickup checkbox */}
                  <div className="bg-white rounded-xl shadow-sm p-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={useSame}
                        onChange={(e) => {
                          setUseSame(e.target.checked);
                          if (e.target.checked) {
                            setValidationErrors(prev => ({ ...prev, delivery: false }));
                          }
                        }}
                        className="w-4 h-4 text-primary focus:ring-primary rounded"
                      />
                      <span className="text-gray-700">Delivery address is the same as pickup address</span>
                    </label>
                    {useSame && pickup && (
                      <p className="mt-2 text-xs text-green-600 ml-7">
                        Using "{pickup.address}" as delivery address
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
                
                <div className="space-y-3">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal ({checkoutItems.reduce((sum, i) => sum + i.quantity, 0)} items)</span>
                    <span>GHS {calculateSubtotal().toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  
                  {deliveryOption === 'DELIVERY_PICKUP' && (
                    <>
                      <div className="flex justify-between text-gray-600">
                        <span>Pickup Service</span>
                        <span className="font-medium">
                          {pickup && getSafeCost(pickup) > 0 ? 
                            `GHS ${formatCost(getSafeCost(pickup))}` : 
                            <span className="text-gray-400 text-sm">Select location</span>
                          }
                        </span>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>Delivery Service</span>
                        <span className="font-medium">
                          {!useSame && delivery && getSafeCost(delivery) > 0 ? 
                            `GHS ${formatCost(getSafeCost(delivery))}` : 
                            useSame && pickup && getSafeCost(pickup) > 0 ?
                            `GHS ${formatCost(getSafeCost(pickup))}` :
                            <span className="text-gray-400 text-sm">Select location</span>
                          }
                        </span>
                      </div>
                      {pickupTime && (
                        <div className="flex justify-between text-gray-600 text-sm pt-2 border-t">
                          <span>Pickup Window</span>
                          <span className="text-right font-mono text-xs">
                            {pickupTime.value || pickupTime}
                          </span>
                        </div>
                      )}
                    </>
                  )}
                  
                  <div className="border-t pt-3 mt-3">
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span className="text-primary">
                        GHS {calculateTotal().toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={handlePlaceOrder}
                  disabled={submitting}
                  className="w-full mt-6 bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Placing Order...</span>
                    </>
                  ) : (
                    <>
                      <CreditCard size={18} />
                      <span>Place Order</span>
                    </>
                  )}
                </button>
                
                {/* Validation summary for Full Service */}
                {deliveryOption === 'DELIVERY_PICKUP' && (validationErrors.pickup || validationErrors.delivery || validationErrors.pickupTime) && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm font-semibold text-red-800 mb-2">Required for Full Service:</p>
                    <ul className="text-xs text-red-700 space-y-1">
                      {validationErrors.pickup && <li>• Pickup address</li>}
                      {validationErrors.delivery && !useSame && <li>• Delivery address</li>}
                      {validationErrors.pickupTime && <li>• Pickup time (wait for location processing)</li>}
                    </ul>
                  </div>
                )}
                
                {validationErrors.phone && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-xs text-red-700">• Valid phone number is required</p>
                  </div>
                )}
                
                <p className="text-xs text-center text-gray-400 mt-4">
                  By placing this order, you agree to our wholesale terms and conditions
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Map Handler for location selection */}
      <MapHandler
        center={DEFAULT_CENTER}
        zoom={12}
        onLocationSelect={(location, type) => {
          handlePlaceSelect(location, type);
        }}
      />
    </GoogleMapsProvider>
  );
};

export default PartnerCheckout;