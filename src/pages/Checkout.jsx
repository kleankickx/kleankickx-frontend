import React, { useState, useEffect, useContext, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { CartContext } from "../context/CartContext";
import { APIProvider, Map } from "@vis.gl/react-google-maps";
import { toast } from "react-toastify";
import { jwtDecode } from "jwt-decode";
import axios from "axios";
import {
  FiTruck,
  FiInfo,
  FiNavigation,
  FiCheck,
} from "react-icons/fi";
import {
  FaCheckCircle,
  FaTimesCircle,
  FaSpinner,
  FaExclamationTriangle,
  FaGift,
  FaUserFriends,
  FaInfoCircle,
  FaStar
} from "react-icons/fa";
import PlaceAutocompleteElementWrapper from "/src/components/PlaceAutocompleteElementWrapper"

import MapHandler from "../components/MapHandler";
import REGION_CONFIG from '../utils/regionConfig'

const Checkout = () => {
  const { refreshToken, setAccessToken, setRefreshToken, logout, api, user, discounts } = useContext(AuthContext);
  const { cart, clearCart } = useContext(CartContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  // --- Constants ---
  const Maps_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;
  const DEFAULT_CENTER = { lat: 5.6037, lng: -0.1870 }; // Accra coordinates
  const MAP_CONTAINER_STYLE = { width: '100%', height: '300px', borderRadius: '12px' };

  // State for locations and inputs
  const getLocationFromStorage = (key) => {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch {
      return null;
    }
  };

  const [delivery, setDelivery] = useState(() => getLocationFromStorage('deliveryLocation'));
  const [pickup, setPickup] = useState(() => getLocationFromStorage('pickupLocation'));
  const [useSame, setUseSame] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [activeInput, setActiveInput] = useState(null);
  const [deliveryInputValue, setDeliveryInputValue] = useState(() => localStorage.getItem('deliveryInputValue') || '');
  const [pickupInputValue, setPickupInputValue] = useState(() => localStorage.getItem('pickupInputValue') || '');
  const [currentLocation, setCurrentLocation] = useState(DEFAULT_CENTER);
  const [locationLoading, setLocationLoading] = useState(true);
  const [deliveryRegion, setDeliveryRegion] = useState(() => localStorage.getItem('deliveryRegion') || 'Greater Accra');
  const [pickupRegion, setPickupRegion] = useState(() => localStorage.getItem('pickupRegion') || 'Greater Accra');
  const [showAlert, setShowAlert] = useState(true);
  const [paymentView, setPaymentView] = useState(false);
  const [transactionReference, setTransactionReference] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isPhoneValid, setIsPhoneValid] = useState(false);
  const [signupDiscountUsed, setSignupDiscountUsed] = useState(false)
  const [referralDiscountUsed, setReferralDiscountUsed] = useState(false);
  const [redeemedPointsDiscount, setRedeemedPointsDiscount] = useState(null);

  // Base URL for backend API
  const baseURL = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000';
  
  useEffect(() => {
    const init = async () => {
      try {
        // Fetch discount status after user loads
        fetchUserDiscountStatus();
        fetchUserReferralDiscountStatus();
        fetchRedeemedPointsDiscount();

        setLoading(false);
      } catch (error) {
        console.error("Error during checkout init:", error);
      } finally {
        setLoading(false); // Always turn off loader
      }
    };

    init();
  }, []);

  // Fetch user discount status
  const fetchUserDiscountStatus = async () => {
    try{
      const response = await api.get('/api/discounts/signup/status/')
      setSignupDiscountUsed(response.data)
    } catch (error) {
      console.log("Error: ", error)
    }
  }

  const fetchUserReferralDiscountStatus = async () => {
    try {
      const response = await api.get('/api/discounts/referral/status/');
      setReferralDiscountUsed(response.data);
    } catch (error) {
      console.log("Error fetching referral discount status:", error);
    }
  };

  // Fetch redeemed points discount
  const fetchRedeemedPointsDiscount = async () => {
    try {
      const response = await api.get('/api/referrals/redeem/');
      if (response.data && !response.data.error) {
        setRedeemedPointsDiscount(response.data);
      } else {
        setRedeemedPointsDiscount(null);
      }
    } catch (error) {
      if (error.response && error.response.status === 404) {
        setRedeemedPointsDiscount(null);
      } else {
        console.log("Error fetching redeemed points discount:", error);
      }
    }
  }

  // Calculate order totals
  const subtotal = cart.reduce((sum, item) => sum + item.quantity * item.price, 0);
  const deliveryFee = delivery?.cost || 0;
  const pickupFee = useSame ? deliveryFee : pickup?.cost || 0;

  // Get discounts from context
  const signupDiscount = discounts?.find(d => d.discount_type === 'signup');
  const referralDiscount = discounts?.find(d => d.discount_type === 'referral');

  // Eligibility
  const canUseSignup = user && !signupDiscountUsed?.signup_discount_used && signupDiscount;
  const canUseReferral = user && referralDiscountUsed?.first_order_completed === false && referralDiscount;
  const canUseRedeemedPoints = user && redeemedPointsDiscount && !redeemedPointsDiscount.is_applied;

  // Calculate discount amounts individually
  const signupDiscountAmount = canUseSignup
    ? ((parseFloat(subtotal) * parseFloat(signupDiscount.percentage)) / 100)
    : 0;

  const referralDiscountAmount = canUseReferral
    ? ((parseFloat(subtotal) * parseFloat(referralDiscount.percentage)) / 100)
    : 0;

  const redeemedPointsDiscountAmount = canUseRedeemedPoints
    ? ((parseFloat(subtotal) * parseFloat(redeemedPointsDiscount.percentage)) / 100)
    : 0;

  // Final total
  const total = parseFloat((subtotal + deliveryFee + pickupFee) - 
    (signupDiscountAmount + referralDiscountAmount + redeemedPointsDiscountAmount)).toFixed(2);

  // Ghana phone number validation
  const validateGhanaPhone = (number) => {
    const cleaned = number.replace(/\D/g, '');
    const ghanaRegex = /^(233|0)?(20|24|25|26|27|28|29|30|50|54|55|56|57|59)[0-9]{7}$/;
    return ghanaRegex.test(cleaned);
  };

  const handlePhoneChange = (e) => {
    let input = e.target.value;
   
    if (input.length <= 13) {
      setPhoneNumber(input);
      setIsPhoneValid(validateGhanaPhone(input));
    }
  };

  // Persist delivery and pickup regions to localStorage
  useEffect(() => {
    localStorage.setItem('deliveryRegion', deliveryRegion);
    localStorage.setItem('pickupRegion', pickupRegion);
  }, [deliveryRegion, pickupRegion]);

  // Sync pickup location when useSame is true
  useEffect(() => {
    if (useSame && delivery) {
      setPickup({ ...delivery, region: deliveryRegion });
      setPickupInputValue(delivery.address);
      localStorage.setItem('pickupLocation', JSON.stringify({ ...delivery, region: deliveryRegion }));
      localStorage.setItem('pickupInputValue', delivery.address);
    } else if (useSame && !delivery) {
      setPickup(null);
      setPickupInputValue('');
      localStorage.removeItem('pickupLocation');
      localStorage.removeItem('pickupInputValue');
    }
  }, [useSame, delivery, deliveryRegion]);

  // Show alert only once
  useEffect(() => {
    const hasSeenAlert = localStorage.getItem('hasSeenCheckoutAlert');
    if (!hasSeenAlert) {
      setShowAlert(true);
      localStorage.setItem('hasSeenCheckoutAlert', 'true');
    }
  }, []);

  // Detect user location
  useEffect(() => {
    const detectUserLocation = () => {
      if (!navigator.geolocation) {
        setLocationLoading(false);
        toast.info("Geolocation not supported, using default location (Accra).");
        return;
      }
      setLocationLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setLocationLoading(false);
        },
        (error) => {
          console.error("Geolocation error:", error);
          setLocationLoading(false);
          toast.info("Failed to detect location, using default (Accra).");
        },
        { timeout: 5000 }
      );
    };
    detectUserLocation();
  }, []);

  // Handle place selection from map
  const handlePlaceSelect = useCallback((location, type) => {
    if (type === 'delivery') {
      setDelivery(location);
      setDeliveryInputValue(location ? location.address : '');
      localStorage.setItem('deliveryLocation', JSON.stringify(location));
      localStorage.setItem('deliveryInputValue', location ? location.address : '');
      if (useSame && location) {
        setPickup({ ...location, region: deliveryRegion });
        setPickupInputValue(location.address);
        localStorage.setItem('pickupLocation', JSON.stringify({ ...location, region: deliveryRegion }));
        localStorage.setItem('pickupInputValue', location.address);
      } else if (useSame && !location) {
        setPickup(null);
        setPickupInputValue('');
        localStorage.removeItem('pickupLocation');
        localStorage.removeItem('pickupInputValue');
      }
    } else {
      setPickup(location);
      setPickupInputValue(location ? location.address : '');
      localStorage.setItem('pickupLocation', JSON.stringify(location));
      localStorage.setItem('pickupInputValue', location ? location.address : '');
    }
    setActiveInput(null);
    if (location) {
      toast.success(
        <div className="flex items-center">
          <FiCheck className="mr-2" />
          {type} location set to {location.areaName}, {location.region}
        </div>
      );
    } else {
      toast.info(`${type} location cleared.`);
    }
  }, [useSame, deliveryRegion]);

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

  // Handle use current location
  const handleUseCurrentLocation = async () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported by your browser");
      return;
    }
    setLocationLoading(true);
    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
      });
      const userLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };
      const geocoder = new window.google.maps.Geocoder();
      const { results } = await new Promise((resolve, reject) => {
        geocoder.geocode({ location: userLocation }, (results, status) => {
          if (status === 'OK' && results && results.length > 0) {
            resolve({ results });
          } else {
            reject(new Error(status));
          }
        });
      });
      const place = results[0];
      let detectedRegion = deliveryRegion;
      const administrativeAreaLevel1 = place.address_components.find(comp =>
        comp.types.includes('administrative_area_level_1')
      )?.long_name;
      if (administrativeAreaLevel1) {
        const matchedRegion = AVAILABLE_REGIONS.find(r => administrativeAreaLevel1.includes(r));
        if (matchedRegion) {
          detectedRegion = matchedRegion;
          setDeliveryRegion(detectedRegion);
        }
      }
      const regionData = REGION_CONFIG[detectedRegion];
      let locality = place.address_components.find(comp =>
        comp.types.includes('locality') || comp.types.includes('sublocality')
      )?.long_name.toLowerCase() || '';
      let area = regionData.availableAreas[regionData.defaultArea];
      for (const [areaKey, areaInfo] of Object.entries(regionData.availableAreas)) {
        if (locality.includes(areaKey)) {
          area = areaInfo;
          break;
        }
      }
      const locationInfo = {
        address: place.formatted_address,
        name: 'Your Current Location',
        region: detectedRegion,
        areaName: area.name,
        cost: area.fee,
        lat: userLocation.lat,
        lng: userLocation.lng
      };
      handlePlaceSelect(locationInfo, 'delivery');
    } catch (error) {
      console.error("Error getting current location:", error);
      toast.error("Could not get current location. Please try searching instead.");
    } finally {
      setLocationLoading(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!delivery) {
      toast.error('Please select a delivery location');
      return;
    }
    if (!pickup && !useSame) {
      toast.error('Please select a pickup location');
      return;
    }
    if (cart.length === 0) {
      toast.error('Your cart is empty');
      return;
    }
    if (!isPhoneValid) {
      toast.error('Please enter a valid Ghana phone number');
      return;
    }
    setPaymentView(true);
    setShowAlert(false);
  };

  // Handle payment with Paystack
  const handlePayment = async () => {
    if (placing) return;

    try {
      setPlacing(true);
      
      // First check token validity
      try {
        if (!refreshToken) throw new Error('No refresh token');
        
        const decoded = jwtDecode(refreshToken);
        const currentTime = Date.now() / 1000;
        const timeLeft = decoded.exp - currentTime;
        
        if (timeLeft < 60) {
          const response = await axios.post(`${baseURL}/api/token/refresh/`, {
            refresh: refreshToken
          }, {
            headers: { 'Content-Type': 'application/json' }
          });
          
          const newAccessToken = response.data.access;
          const newRefreshToken = response.data.refresh || refreshToken;
          
          setAccessToken(newAccessToken);
          localStorage.setItem('access_token', newAccessToken);
          
          if (response.data.refresh) {
            setRefreshToken(newRefreshToken);
            localStorage.setItem('refresh_token', newRefreshToken);
          }
        }
      } catch (tokenError) {
        console.error('Token refresh error:', tokenError);
        logout();
        toast.error('Session expired. Please login again to complete your order.');
        navigate('/login?continuePath=/checkout');
        setPlacing(false);
        return;
      }

      const appliedDiscounts = [];

      if (canUseSignup && signupDiscount && signupDiscountAmount > 0) {
        appliedDiscounts.push({
          type: signupDiscount.discount_type.split(' ')[0],
          percentage: signupDiscount.percentage,
          amount: signupDiscountAmount
        });
      }

      if (canUseReferral && referralDiscount && referralDiscountAmount > 0) {
        appliedDiscounts.push({
          type: referralDiscount.discount_type.split(' ')[0],
          percentage: referralDiscount.percentage,
          amount: referralDiscountAmount
        });
      }

      if (canUseRedeemedPoints && redeemedPointsDiscount && redeemedPointsDiscountAmount > 0) {
        appliedDiscounts.push({
          type: "redeemed_points",
          percentage: redeemedPointsDiscount.percentage,
          amount: redeemedPointsDiscountAmount,
          points_redeemed: redeemedPointsDiscount.points_redeemed
        });
      }

      const transactionRef = `order_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      setTransactionReference(transactionRef);

      const handler = window.PaystackPop && new window.PaystackPop();
      if (!handler) {
        toast.error("Payment system not loaded. Please try again.");
        setPlacing(false);
        return;
      }

      handler.newTransaction({
        key: PAYSTACK_PUBLIC_KEY,
        email: user.email,
        amount: total * 100,
        currency: 'GHS',
        reference: transactionRef,
        onSuccess: async (transaction) => {
          try {
            const beforeUnloadHandler = (e) => {
              e.preventDefault();
              e.returnValue = 'Your order is being processed. Please wait...';
              return e.returnValue;
            };
            window.addEventListener('beforeunload', beforeUnloadHandler);

            let retries = 3;
            let success = false;
            let lastError = null;

            while (retries > 0 && !success) {
              try {
                const response = await api.post('/api/orders/', {
                  user_id: user.id,
                  delivery_location: delivery,
                  pickup_location: useSame ? delivery : pickup,
                  total_amount: total,
                  cart_items: cart,
                  delivery_cost: deliveryFee,
                  pickup_cost: useSame ? deliveryFee : pickupFee,
                  sub_total: subtotal,
                  transaction_id: transaction.reference,
                  phone_number: phoneNumber,
                  discounts_applied: appliedDiscounts.length > 0 ? appliedDiscounts : null
                });

                success = true;
                clearCart();
                ['deliveryLocation', 'pickupLocation', 'deliveryInputValue', 
                'pickupInputValue', 'deliveryRegion', 'pickupRegion'].forEach(key => {
                  localStorage.removeItem(key);
                });

                // If redeemed points discount was used, mark it as applied
                if (canUseRedeemedPoints) {
                  try {
                    await api.patch(`/api/referrals/redeem/${redeemedPointsDiscount.id}/apply/`);
                  } catch (error) {
                    console.error("Error marking discount as applied:", error);
                  }
                }

                setDelivery(null);
                setPickup(null);
                setDeliveryInputValue('');
                setPickupInputValue('');
                setDeliveryRegion('');
                setPickupRegion('');
                setUseSame(true);

                window.removeEventListener('beforeunload', beforeUnloadHandler);
                navigate(`/orders/${response.data.order_slug}`);
                toast.success('Order placed successfully! Thank you for your purchase.');
              } catch (error) {
                lastError = error;
                retries--;
                
                if (error.response?.status === 401 && retries > 0) {
                  try {
                    const refreshResponse = await axios.post(`${api.defaults.baseURL}/api/token/refresh/`, {
                      refresh: localStorage.getItem('refresh_token')
                    }, {
                      headers: { 'Content-Type': 'application/json' }
                    });

                    const newAccessToken = refreshResponse.data.access;
                    const newRefreshToken = refreshResponse.data.refresh || refreshToken;
                    
                    setAccessToken(newAccessToken);
                    localStorage.setItem('access_token', newAccessToken);
                    
                    if (refreshResponse.data.refresh) {
                      setRefreshToken(newRefreshToken);
                      localStorage.setItem('refresh_token', newRefreshToken);
                    }
                  } catch (refreshError) {
                    logout();
                    retries = 0;
                    throw refreshError;
                  }
                } else if (retries > 0) {
                  await new Promise(resolve => 
                    setTimeout(resolve, 1000 * (4 - retries))
                  );
                }
              }
            }

            if (!success) {
              throw lastError || new Error('Failed to create order after retries');
            }
          } catch (error) {
            console.error('Error placing order:', error);
            const failedOrder = {
              user_id: user.id,
              delivery_location: delivery,
              pickup_location: useSame ? delivery : pickup,
              total_amount: total,
              cart_items: cart,
              transaction_id: transaction.reference,
              phone_number: phoneNumber,
              error: error.message
            };
            localStorage.setItem('failedOrder', JSON.stringify(failedOrder));
            
            if (error.response?.status === 401) {
              toast.error('Session expired. Please login again to complete your order.');
              logout();
              navigate('/login?returnUrl=/checkout');
            } else {
              toast.error('Failed to place order. Please check your orders page or contact support.');
              navigate('/orders/failed');
            }
          } finally {
            setPlacing(false);
          }
        },
        onCancel: () => {
          setPlacing(false);
          toast.info('Payment cancelled. Your order was not placed.');
        }
      });
    } catch (error) {
      setPlacing(false);
      console.error('Error initializing payment:', error);
      toast.error('Error initializing payment. Please try again.');
    }
  };

  // Load Paystack script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = "https://js.paystack.co/v2/inline.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }, [paymentView]);

  return (
    !loading ? (
    <APIProvider
      apiKey={Maps_API_KEY}
      libraries={['places', 'geocoding']}
      onLoad={() => console.log('Google Maps API loaded successfully!')}
    >
      <div className="bg-gradient-to-br from-green-50 to-white">
        <div className="max-w-5xl mx-auto px-4 py-8">
          {showAlert && (
            <div className="mb-6 p-4 bg-yellow-100 border-l-4 border-yellow-500 rounded-lg flex items-center">
              <FiInfo className="mr-2 text-yellow-700" />
              <p className="text-sm text-yellow-700">
                Current options for delivery and pickup are Accra, Tema, Kasoa.
                <button
                  onClick={() => setShowAlert(false)}
                  className="ml-4 text-yellow-700 hover:text-yellow-900 underline"
                >
                  Dismiss
                </button>
              </p>
            </div>
          )}

          {!paymentView ? (
            <>
              <div className="py-8">
                <div className="mb-8 text-center md:text-left">
                  <h1 className="text-3xl font-bold text-gray-900">Complete Your Order</h1>
                  <p className="text-gray-600 mt-2">Review your items and provide delivery information</p>
                </div>

                <div className="flex flex-col lg:flex-row gap-8">
                  {/* Left Column - Customer Information */}
                  <div className="lg:w-1/2 space-y-6">
                    {/* Delivery Information Card */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                      <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
                        <h2 className="text-xl font-semibold flex items-center">
                          <FiTruck className="mr-3 text-primary" />
                          Delivery Information
                        </h2>
                      </div>
                      <div className="p-6 space-y-5">
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-medium text-gray-700">
                              Delivery Address
                            </label>
                            <button
                              onClick={handleUseCurrentLocation}
                              disabled={locationLoading}
                              className="flex items-center text-sm text-blue-600 hover:text-blue-800 disabled:text-gray-400 transition-colors"
                            >
                              <FiNavigation className="mr-1.5" />
                              {locationLoading ? 'Detecting...' : 'Use Current Location'}
                            </button>
                          </div>
                          <PlaceAutocompleteElementWrapper
                            key={`delivery-${paymentView}`}
                            onPlaceSelect={(loc) => handlePlaceSelect(loc, 'delivery')}
                            currentInputValue={deliveryInputValue}
                            initialLocation={delivery}
                            placeholder="Enter delivery address"
                            type="delivery"
                            region={deliveryRegion}
                            onFocus={() => setActiveInput('delivery')}
                          />
                        </div>

                        <label className="flex items-center cursor-pointer group">
                            <div className="relative">
                              <input
                                type="checkbox"
                                id="same"
                                checked={useSame}
                                onChange={(e) => setUseSame(e.target.checked)}
                                className="sr-only"
                              />
                              <div className={`w-5 h-5 rounded border-2 transition-all duration-200 ease-in-out
                                ${useSame 
                                  ? 'bg-primary border-primary' 
                                  : 'bg-white border-gray-300 group-hover:border-primary'
                                }`}
                              >
                                {useSame && (
                                  <svg className="w-3 h-3 text-white mx-auto mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </div>
                            </div>
                            <span className="ml-3 text-sm text-gray-700 group-hover:text-gray-900 transition-colors">
                              Use delivery address for pickup
                            </span>
                        </label>
                        

                        {!useSame && (
                          <div className="pt-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Pickup Address
                            </label>
                            <PlaceAutocompleteElementWrapper
                              key={`pickup-${paymentView}`}
                              onPlaceSelect={(loc) => handlePlaceSelect(loc, 'pickup')}
                              currentInputValue={pickupInputValue}
                              initialLocation={pickup}
                              placeholder="Enter pickup address"
                              type="pickup"
                              region={pickupRegion}
                              onFocus={() => setActiveInput('pickup')}
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Contact Information Card */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                      <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
                        <h2 className="text-xl font-semibold flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-primary" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                          </svg>
                          Contact Details
                        </h2>
                      </div>
                      <div className="p-6 space-y-5">
                        <div>
                          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                            Email Address
                          </label>
                          <input
                            type="email"
                            id="email"
                            value={user?.email || ''}
                            disabled
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary disabled:bg-gray-50 disabled:text-gray-500"
                          />
                        </div>
                        
                        <div>
                          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                            Phone Number
                          </label>
                          <div className="relative rounded-lg overflow-hidden">
                            <div className="absolute inset-y-0 left-0 flex items-center px-4 bg-gray-100 border-r border-gray-200">
                              <span className="text-gray-700 flex items-center">
                                <span className="mr-2">🇬🇭</span> +233
                              </span>
                            </div>
                            <input
                              type="tel"
                              id="phone"
                              value={phoneNumber}
                              onChange={handlePhoneChange}
                              placeholder="24 123 4567"
                              className="pl-24 w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-0"
                              maxLength={13}
                            />
                            {phoneNumber && (
                              <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                                {isPhoneValid ? (
                                  <FaCheckCircle className="text-green-500" />
                                ) : (
                                  <FaTimesCircle className="text-red-500" />
                                )}
                              </div>
                            )}
                          </div>
                          {phoneNumber && !isPhoneValid && (
                            <p className="mt-2 text-sm text-red-600">
                              Please enter a valid Ghana phone number (e.g., 024 123 4567)
                            </p>
                          )}
                        
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Order Summary */}
                  <div className="lg:w-1/2 space-y-6">
                    {/* Map Section */}
                    {/* <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                      <div className="h-64 md:h-80 w-full relative">
                        <Map
                          mapId={"checkout-map"}
                          defaultZoom={delivery || pickup ? 16 : 12}
                          defaultCenter={currentLocation}
                          gestureHandling={'greedy'}
                          disableDefaultUI={false}
                          style={{ height: '100%', width: '100%' }}
                        >
                          <MapHandler
                            delivery={delivery}
                            pickup={pickup}
                            useSame={useSame}
                            currentLocation={currentLocation}
                            activeInput={activeInput}
                          />
                        </Map>
                      </div>
                    </div> */}

                    {/* Order Summary Card */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                      <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
                        <h2 className="text-xl font-semibold">Order Summary</h2>
                      </div>
                      <div className="p-6">
                        <div className="divide-y divide-gray-200">
                          {cart.map((item) => (
                            <div key={item.service_id} className="py-4 first:pt-0 last:pb-0">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-medium text-gray-900">{item.service_name}</p>
                                  <p className="text-sm text-gray-500 mt-1">Quantity: {item.quantity}</p>
                                </div>
                                <p className="font-medium text-gray-900">GHS {(item.quantity * item.price).toFixed(2)}</p>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Pricing Breakdown */}
                        <div className="mt-6 pt-6 border-t border-gray-200 space-y-3">
                          <div className="flex justify-between">
                            <p className="text-gray-600">Subtotal</p>
                            <p className="font-medium">GHS {subtotal.toFixed(2)}</p>
                          </div>
                          
                          {canUseSignup && (
                            <div className="bg-green-50 rounded-lg p-3 -mx-1">
                              <div className="flex justify-between items-center">
                                <span className="text-green-700 font-medium flex items-center">
                                  <FaGift className="mr-2" />
                                  {signupDiscount.discount_type}
                                </span>
                                <span className="text-green-700 font-medium">-GHS {signupDiscountAmount.toFixed(2)}</span>
                              </div>
                              <div className="text-xs text-green-600 mt-1 ml-6">
                                {signupDiscount.percentage}% off your order
                              </div>
                            </div>
                          )}

                          {canUseReferral && (
                            <div className="bg-blue-50 rounded-lg p-3 -mx-1">
                              <div className="flex justify-between items-center">
                                <span className="text-blue-700 font-medium flex items-center">
                                  <FaUserFriends className="mr-2" />
                                  {referralDiscount.discount_type}
                                </span>
                                <span className="text-blue-700 font-medium">-GHS {referralDiscountAmount.toFixed(2)}</span>
                              </div>
                              <div className="text-xs text-blue-600 mt-1 ml-6">
                                {referralDiscount.percentage}% off your order
                              </div>
                            </div>
                          )}

                          {canUseRedeemedPoints && (
                            <div className="bg-amber-50 rounded-lg p-3 -mx-1">
                              <div className="flex justify-between items-center">
                                <span className="text-amber-700 font-medium flex items-center">
                                  <FaStar className="mr-2" />
                                  Redeemed Points Discount
                                </span>
                                <span className="text-amber-700 font-medium">-GHS {redeemedPointsDiscountAmount.toFixed(2)}</span>
                              </div>
                              <div className="text-xs text-amber-600 mt-1 ml-6">
                                {redeemedPointsDiscount.percentage}% off your order ({redeemedPointsDiscount.points_redeemed} points redeemed)
                              </div>
                            </div>
                          )}

                          <div className="flex justify-between pt-2">
                            <p className="text-gray-600">Delivery Fee</p>
                            <p className="font-medium">
                              {delivery ? `GHS ${delivery.cost.toFixed(2)}` : '--'}
                            </p>
                          </div>
                          <div className="flex justify-between">
                            <p className="text-gray-600">Pickup Fee</p>
                            <p className="font-medium">
                              {useSame ? (delivery ? `GHS ${delivery.cost.toFixed(2)}` : '--') : (pickup ? `GHS ${pickup.cost.toFixed(2)}` : '--')}
                            </p>
                          </div>

                          <div className="flex justify-between pt-4 mt-3 border-t border-gray-200">
                            <p className="text-lg font-semibold">Total Amount</p>
                            <div className="text-right">
                              {(canUseSignup || canUseReferral || canUseRedeemedPoints) && (
                                <div className="text-sm text-gray-400 line-through">GHS {subtotal}</div>
                              )}
                              <p className="text-xl font-bold text-primary">
                                GHS {total}
                              </p>
                            </div>
                          </div>
                        </div>

                        {canUseSignup && signupDiscount && (
                          <div className="mt-4 p-3 bg-green-50 rounded-lg text-sm text-green-700 flex items-start">
                            <FaInfoCircle className="w-4 h-4 mt-0.5 mr-2 flex-shrink-0" />
                            <span>Your {signupDiscount.percentage}% sign-up discount has been applied!</span>
                          </div>
                        )}

                        {canUseRedeemedPoints && redeemedPointsDiscount && (
                          <div className="mt-4 p-3 bg-amber-50 rounded-lg text-sm text-amber-700 flex items-start">
                            <FaInfoCircle className="w-4 h-4 mt-0.5 mr-2 flex-shrink-0" />
                            <span>Your {redeemedPointsDiscount.percentage}% redeemed points discount has been applied!</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Checkout Button */}
                    <button
                      onClick={handleSubmit}
                      disabled={placing || cart.length === 0 || !delivery || (!useSame && !pickup) || !isPhoneValid}
                      className={`w-full py-3.5 px-6 rounded-lg font-medium text-white transition-all ${
                        placing || cart.length === 0 || !delivery || (!useSame && !pickup) || !isPhoneValid
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg'
                      }`}
                    >
                      {placing ? (
                        <span className="flex items-center justify-center">
                          <FaSpinner className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
                          Processing...
                        </span>
                      ) : (
                        'Proceed to Payment'
                      )}
                    </button>

                    {cart.length === 0 && (
                      <div className="p-4 bg-yellow-50 rounded-lg text-yellow-800 text-sm flex items-center">
                        <FaExclamationTriangle className="mr-2" />
                        Your cart is empty. Add items to proceed with checkout.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white lg:p-8 p-6 rounded-2xl shadow-lg border border-gray-100 max-w-md px-4 mx-auto">
  {/* Payment Header */}
  <div className="relative mb-8 overflow-hidden rounded-xl bg-gradient-to-r from-emerald-600 to-primary p-6 text-white">
    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5"></div>
    <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10"></div>
    <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-white/10"></div>
    
    <div className="relative z-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Complete Payment</h2>
          <p className="text-white/90 mt-1">Secure transaction powered by</p>
        </div>
        <div className="flex space-x-2">
          <div className="h-10 w-16 rounded-md bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-sm">
            <span className="text-xs font-bold tracking-wider">PAYSTACK</span>
          </div>
        </div>
      </div>
      <div className="mt-4 flex items-center text-sm">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
        </svg>
        End-to-end encrypted transaction
      </div>
    </div>
  </div>

  {/* Order Summary */}
  <div className="mb-8 bg-white/80 p-6 rounded-xl border border-gray-100 shadow-sm backdrop-blur-sm">
    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
        <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
        <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
      </svg>
      Order Summary
    </h3>

    <div className="space-y-3">
      {/* Subtotal */}
      <div className="flex justify-between py-2.5">
        <span className="text-gray-600 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
            <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
          </svg>
          Subtotal
        </span>
        <span className="font-medium">GHS {subtotal.toFixed(2)}</span>
      </div>

      {/* Discounts */}
      {canUseSignup && (
        <div className="flex justify-between py-2.5 text-emerald-600">
          <span className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Sign-Up Discount ({signupDiscount.percentage}%)
          </span>
          <span className="font-medium">-GHS {signupDiscountAmount.toFixed(2)}</span>
        </div>
      )}

                {canUseReferral && (
                    <div className="flex justify-between py-3 border-b border-gray-100/50 text-blue-600">
                    <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM12 15v2m-2 2h4" />
                      </svg>
                      Referral Discount ({referralDiscount.percentage}%)
                    </div>
                    <span className="font-medium">-GHS {referralDiscountAmount.toFixed(2)}</span>
                  </div>
                )}

                {canUseRedeemedPoints && (
                  <div className="flex justify-between py-3 border-b border-gray-100/50 text-amber-600">
                    <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                      Points Discount ({redeemedPointsDiscount.percentage}%)
                    </div>
                    <span className="font-medium">-GHS {redeemedPointsDiscountAmount.toFixed(2)}</span>
                  </div>
                )}
                
                <div className="flex justify-between py-3 border-b border-gray-100/50">
                  <div className="flex items-center text-gray-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                      <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1v-1a1 1 0 011-1h2a1 1 0 011 1v1a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H19a1 1 0 001-1V5a1 1 0 00-1-1H3z" />
                    </svg>
                    Delivery Fee
                  </div>
                  <span className="font-medium">GHS {delivery ? delivery.cost.toFixed(2) : '0.00'}</span>
                </div>
                
                <div className="flex justify-between py-3">
                  <div className="flex items-center text-gray-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    Pickup Fee
                  </div>
                  <span className="font-medium">
                    {useSame ? (delivery ? `GHS ${delivery.cost.toFixed(2)}` : '0.00') : (pickup ? `GHS ${pickup.cost.toFixed(2)}` : '0.00')}
                  </span>
                </div>

      {/* Total */}
      <div className="border-t border-gray-200 mt-4 pt-4">
        <div className="flex justify-between items-center">
          <span className="text-lg font-semibold text-gray-800 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-primary" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            Total Amount
          </span>
          <span className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-primary">
            GHS {total}
          </span>
        </div>
      </div>
    </div>
  </div>

  {/* Payment Actions */}
  <div className="space-y-4">
    {/* Pay Now Button */}
    <button
      onClick={handlePayment}
      disabled={placing}
      className={`w-full py-3.5 px-6 rounded-xl font-semibold text-white transition-all duration-300 flex items-center justify-center relative overflow-hidden group ${
        placing 
          ? 'bg-gray-300 cursor-not-allowed shadow-inner' 
          : 'bg-gradient-to-r from-emerald-600 to-primary hover:from-emerald-700 hover:to-primary-dark shadow-md hover:shadow-lg'
      }`}
    >
      {placing ? (
        <>
          <FaSpinner className="animate-spin mr-3 h-5 w-5 text-white" />
          Processing Payment...
        </>
      ) : (
        <>
          <span className="relative z-10 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2.5 text-white/90" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            Pay Now
          </span>
          <span className="absolute inset-0 bg-white/10 group-hover:bg-white/15 transition-all duration-500 transform group-hover:scale-110"></span>
        </>
      )}
    </button>

    {/* Back Button */}
    <button
      onClick={() => {
        setPaymentView(false)
        setShowAlert(true)
      }}
      className="w-full py-3 px-6 rounded-xl font-medium text-gray-700 hover:text-gray-900 bg-white border border-gray-200 hover:border-gray-300 transition-all duration-300 flex items-center justify-center hover:shadow-sm group"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-500 group-hover:text-gray-700 transition-colors" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
      </svg>
      Back to Checkout
    </button>
  </div>

  {/* Security Footer */}
  <div className="mt-8 pt-6 border-t border-gray-100">
    <div className="flex flex-col items-center text-center">
      <div className="flex items-center text-emerald-600 mb-2">
        <div className="relative">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
        </div>
        <span className="ml-2 text-sm font-medium">Secure Payment Processing</span>
      </div>
      <p className="text-xs text-gray-500 max-w-xs">
        Your payment information is encrypted and securely processed by Paystack
      </p>
    </div>
  </div>
</div>
          )}
        </div>
      </div>
    </APIProvider>
    ) : (
      <div className="flex items-center justify-center min-h-screen flex-col space-y-2">
        <FaSpinner className="animate-spin h-8 w-8 text-primary" />
        <p className="text-gray-600 mt-4">Loading...</p>
      </div> 
    )
  );
};

export default Checkout;