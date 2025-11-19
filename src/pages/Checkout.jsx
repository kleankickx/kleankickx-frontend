import { useState, useEffect, useContext, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { CartContext } from "../context/CartContext";
import { APIProvider, Map } from "@vis.gl/react-google-maps";
import { toast } from "react-toastify";
import { jwtDecode } from "jwt-decode";
import axios from "axios";
import PaymentCard from "../components/PaymentCard";
import DeliveryInformationCard from "../components/DeliveryInformationCard";
import { useCheckoutState } from "../hooks/useCheckoutState"; 
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
  FaStar,
  FaTags,
} from "react-icons/fa";

import PlaceAutocompleteElementWrapper from "../components/PlaceAutoCompleteElementWrapper"
import MapHandler from "../components/MapHandler";
import REGION_CONFIG from '../utils/regionConfig'
import PersonalInformationCard from "../components/PersonalInformationCard";
import PromotionCard from "../components/PromotionCard";
import OrderSummaryCard from "../components/OrderSummaryCard";
import { calculateOrderSummary } from '../utils/calculateOrderSummary'
import { usePlaceOrder } from '../hooks/usePlaceOrder'; // The new hook
import { Link } from "react-router-dom";
import { motion } from 'framer-motion';


const Checkout = () => {
  const { refreshToken, setAccessToken, setRefreshToken, logout, api, user, discounts } = useContext(AuthContext);
  const { cart, clearCart } = useContext(CartContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  // --- Constants ---
  const Maps_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;
  const DEFAULT_CENTER = { lat: 5.6037, lng: -0.1870 }; // Accra coordinates
  // const MAP_CONTAINER_STYLE = { width: '100%', height: '300px', borderRadius: '12px' };

  // State for locations and inputs
  const getLocationFromStorage = (key) => {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch {
      return null;
    }
  };

  // const [delivery, setDelivery] = useState(() => getLocationFromStorage('deliveryLocation'));
  // const [pickup, setPickup] = useState(() => getLocationFromStorage('pickupLocation'));
  // const [useSame, setUseSame] = useState(true);
  // const [deliveryInputValue, setDeliveryInputValue] = useState(() => localStorage.getItem('deliveryInputValue') || '');
  // const [pickupInputValue, setPickupInputValue] = useState(() => localStorage.getItem('pickupInputValue') || '');
  // const [deliveryRegion, setDeliveryRegion] = useState(() => localStorage.getItem('deliveryRegion') || 'Greater Accra');
  // const [pickupRegion, setPickupRegion] = useState(() => localStorage.getItem('pickupRegion') || 'Greater Accra');

  const { 
        delivery, setDelivery, 
        pickup, setPickup, 
        useSame, setUseSame,
        deliveryInputValue, setDeliveryInputValue,
        pickupInputValue, setPickupInputValue,
        deliveryRegion, setDeliveryRegion,
        pickupRegion, setPickupRegion,
        pickupTime, setPickupTime
    } = useCheckoutState(); 
    

  const [showAlert, setShowAlert] = useState(true);
  const [paymentView, setPaymentView] = useState(false);
  const [signupDiscountUsed, setSignupDiscountUsed] = useState(false)
  const [referralDiscountUsed, setReferralDiscountUsed] = useState(false);
  const [redeemedPointsDiscount, setRedeemedPointsDiscount] = useState({});
  const [availablePromotions, setAvailablePromotions] = useState([]);
  const [appliedPromotion, setAppliedPromotion] = useState(null);
  const [activeInput, setActiveInput] = useState(null);
  
  


  // Base URL for backend API
  const baseURL = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:10000';
  
  useEffect(() => {
    const init = async () => {
      try {
        // Fetch discount status after user loads
        await fetchUserDiscountStatus();
        await fetchUserReferralDiscountStatus();
        await fetchRedeemedPointsDiscount();
        await fetchAvailablePromotions();
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
      const response = await api.get('/api/referrals/active-discount/');
      if (Object.keys(response.data).length !== 0) {
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

  // Fetch available promotions for today and auto-apply the first valid one
  const fetchAvailablePromotions = async () => {
    try {
      const response = await api.get('/api/promotions/today');
      const promotions = response.data;
      setAvailablePromotions(promotions);
      
      // Auto-apply the first valid promotion
      if (promotions.length > 0) {
        const validPromotion = promotions.find(promo => 
          new Date(promo.end_date) > new Date() && 
          promo.is_active === true
        );
        
        if (validPromotion) {
          setAppliedPromotion(validPromotion);
          if (cart.length > 0){
            toast.success(`🎉 ${validPromotion.discount_percentage}% promotion applied automatically!`);
          }
        }
      }
    } catch (error) {
      console.log("Error fetching promotions:", error);
    }
  }


  // Call the calculation function, memoizing the result
  const summary = useMemo(() => {
    return calculateOrderSummary({
      cart,
      delivery,
      pickup,
      useSame,
      discounts,
      appliedPromotion,
      user,
      signupDiscountUsed,
      referralDiscountUsed,
      redeemedPointsDiscount,
    });
  }, [
    cart, 
    delivery, 
    pickup, 
    useSame, 
    discounts, 
    appliedPromotion, 
    user, 
    signupDiscountUsed, 
    referralDiscountUsed, 
    redeemedPointsDiscount
  ]);

  // Initialize the hook with all necessary dependencies
  const { placing, handlePayment } = usePlaceOrder({
      user, navigate, logout, api, baseURL, PAYSTACK_PUBLIC_KEY,
      setAccessToken, setRefreshToken, clearCart,
      setDelivery, setPickup, setDeliveryInputValue, setPickupInputValue,
      setDeliveryRegion, setPickupRegion, setUseSame, setAppliedPromotion,
      setPickupTime
  });

  // Helper function to format the number for display (024 123 4567)
  const formatPhoneNumberDisplay = (number) => {
      // 1. Clean the number to just digits
      const cleaned = number ? String(number).replace(/\D/g, '') : '';
      if (!cleaned) return '';
      
      // 2. Remove any leading '233' or '0' to get the 9-digit local number
      let localNumber = cleaned;
      if (localNumber.startsWith('233')) {
          localNumber = localNumber.substring(3); // Remove +233
      } else if (localNumber.startsWith('0')) {
          localNumber = localNumber.substring(1); // Remove leading 0
      }

      // 3. Ghana local numbers (excluding the leading 0) are 9 digits.
      if (localNumber.length === 9) {
          // Format as (NN) NNN NNNN -> e.g., 24 123 4567
          return localNumber.replace(/(\d{2})(\d{3})(\d{4})/, '0$1 $2 $3');
      }
      
      // Fallback: Return the cleaned number as is if the length is still being typed
      return number; 
  }
  // Ghana phone number validation
  const validateGhanaPhone = (number) => {
    const cleaned = number.replace(/\D/g, '');
    const ghanaRegex = /^(233|0)?(20|24|25|26|27|28|29|30|50|54|55|56|57|59)[0-9]{7}$/;
    return ghanaRegex.test(cleaned);
  };

  const [phoneNumber, setPhoneNumber] = useState(
      user?.phone_number ? formatPhoneNumberDisplay(user.phone_number) : ''
  );
  const [isPhoneValid, setIsPhoneValid] = useState(
      user?.phone_number ? validateGhanaPhone(user.phone_number) : false
  );

  

  const handlePhoneChange = (e) => {
    let input = e.target.value;
   
    if (input.length <= 10) {
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

  // Handle place selection from map
  const handlePlaceSelect = useCallback((location, type) => {
    setPickupTime(location ? location.pickupTime : null);
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
  // const handleUseCurrentLocation = async () => {
  //   if (!navigator.geolocation) {
  //     toast.error("Geolocation not supported by your browser");
  //     return;
  //   }
  //   setLocationLoading(true);
  //   try {
  //     const position = await new Promise((resolve, reject) => {
  //       navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
  //     });
  //     const userLocation = {
  //       lat: position.coords.latitude,
  //       lng: position.coords.longitude
  //     };
  //     const geocoder = new window.google.maps.Geocoder();
  //     const { results } = await new Promise((resolve, reject) => {
  //       geocoder.geocode({ location: userLocation }, (results, status) => {
  //         if (status === 'OK' && results && results.length > 0) {
  //           resolve({ results });
  //         } else {
  //           reject(new Error(status));
  //         }
  //       });
  //     });
  //     const place = results[0];
  //     let detectedRegion = deliveryRegion;
  //     const administrativeAreaLevel1 = place.address_components.find(comp =>
  //       comp.types.includes('administrative_area_level_1')
  //     )?.long_name;
  //     if (administrativeAreaLevel1) {
  //       const matchedRegion = AVAILABLE_REGIONS.find(r => administrativeAreaLevel1.includes(r));
  //       if (matchedRegion) {
  //         detectedRegion = matchedRegion;
  //         setDeliveryRegion(detectedRegion);
  //       }
  //     }
  //     const regionData = REGION_CONFIG[detectedRegion];
  //     let locality = place.address_components.find(comp =>
  //       comp.types.includes('locality') || comp.types.includes('sublocality')
  //     )?.long_name.toLowerCase() || '';
  //     let area = regionData.availableAreas[regionData.defaultArea];
  //     for (const [areaKey, areaInfo] of Object.entries(regionData.availableAreas)) {
  //       if (locality.includes(areaKey)) {
  //         area = areaInfo;
  //         break;
  //       }
  //     }
  //     const locationInfo = {
  //       address: place.formatted_address,
  //       name: 'Your Current Location',
  //       region: detectedRegion,
  //       areaName: area.name,
  //       cost: area.fee,
  //       lat: userLocation.lat,
  //       lng: userLocation.lng
  //     };
  //     handlePlaceSelect(locationInfo, 'delivery');
  //   } catch (error) {
  //     console.error("Error getting current location:", error);
  //     toast.error("Could not get current location. Please try searching instead.");
  //   } finally {
  //     setLocationLoading(false);
  //   }
  // };

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
  const onPayment = async() => {
    // The hook handles token checks, Paystack initialization, and order submission
    await handlePayment(summary, cart, phoneNumber, delivery, pickup, useSame, pickupTime);
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
    setShowAlert(true); // Reset alert visibility on payment view change
  }, [paymentView]);

 

  return (
    
    <APIProvider
      apiKey={Maps_API_KEY}
      libraries={['places', 'geocoding']}
      onLoad={() => console.log('Google Maps API loaded successfully!')}
    >
      <div className="bg-gray-50 min-h-screen">
        <div className="lg:px-18 px-4 py-8">
          
          {cart.length === 0 ? (
            <div className="min-h-[70vh] flex items-center justify-center px-4 py-8">
              <div className="text-center max-w-md mx-auto">
                {/* Animated Icon */}
                <div className="relative mb-8">
                  <div className="w-32 h-32 mx-auto bg-yellow-100 rounded-full flex items-center justify-center animate-bounce">
                    <FaExclamationTriangle className="text-4xl text-yellow-600" />
                  </div>
                </div>

                {/* Main Message */}
                <h1 className="text-4xl font-bold text-gray-900 mb-4">Oops!</h1>
                <h2 className="text-2xl font-semibold text-gray-800 mb-6">Your Cart is Empty</h2>
                
                {/* Description */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 mb-8">
                  <p className="text-yellow-800 leading-relaxed">
                    Looks like you haven't added any items to your cart yet. 
                    Let's find some amazing cleaning services for you!
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="space-y-4">
                  <Link 
                    to="/services" 
                    className="inline-flex items-center justify-center w-full bg-primary hover:bg-primary-dark text-white font-semibold py-4 px-8 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                  >
                    <span>Explore Cleaning Services</span>
                    <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </Link>
                  
                  <Link 
                    to="/" 
                    className="inline-flex items-center justify-center w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-all duration-300"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    Return to Homepage
                  </Link>
                </div>

                {/* Additional Help */}
                <div className="mt-12 pt-6 border-t border-gray-200">
                  <p className="text-gray-500 text-sm">
                    Need help? <a href="mailto:support@kleankickx.com" className="text-primary hover:underline font-medium">Contact our support team</a>
                  </p>
                </div>
              </div>
            </div>
          ): (
            <div> 

              <div className="">
                <div className={`mb-6 ${paymentView ? 'hidden' : ''}`}>
                  <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Complete Your Order</h1>
                  <p className="text-gray-600 mt-2">Review your items and provide delivery information</p>
                </div>
                {!loading && cart.length > 0 ? (
                  <div>
                    
                      <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                      >
                        <div className="py-6">
                          {/* Main Grid Layout */}
                          <div className="flex flex-col xl:flex-row gap-6 w-full">
                            
                            {/* Left Column - Forms (2/3 width on large screens) */}
                            <div className="flex-1 space-y-6 order-2 xl:order-1">
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Personal Information - Top Left */}
                                <div className="lg:col-span-1">
                                  <PersonalInformationCard
                                    phoneNumber={phoneNumber}
                                    isPhoneValid={isPhoneValid}
                                    handlePhoneChange={handlePhoneChange}
                                    user={user}
                                  />
                                </div>

                                {/* Delivery Information - Top Right */}
                                <div className="lg:col-span-1">
                                  <div className="">
                                    <DeliveryInformationCard
                                      // Logic Props
                                      useSame={useSame}
                                      setUseSame={setUseSame}
                                      handlePlaceSelect={handlePlaceSelect}
                                      setActiveInput={setActiveInput}
                                      paymentView={paymentView}

                                      // Data Props for Delivery
                                      delivery={delivery}
                                      deliveryInputValue={deliveryInputValue}
                                      deliveryRegion={deliveryRegion}

                                      // Data Props for Pickup
                                      pickup={pickup}
                                      pickupInputValue={pickupInputValue}
                                      pickupRegion={pickupRegion}
                                      pickupTime={pickupTime}
                                      setPickupTime={setPickupTime}
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* Promotions Card - Above Payment on mobile */}
                              <div className="block xl:hidden">
                                {availablePromotions.length > 0 && (
                                  <div className="mb-6">
                                    <PromotionCard
                                      appliedPromotion={appliedPromotion}
                                    />
                                  </div>
                                )}
                              </div>

                              <div className="block lg:hidden">
                                <OrderSummaryCard 
                                  cart={cart}
                                  appliedPromotion={appliedPromotion}
                                  useSame={useSame}
                                  {...summary} 
                                />
                              </div>

                              {/* Payment Card - Full width below */}
                              <div className="lg:col-span-2">
                                <motion.div
                                  initial={{ opacity: 0, y: 20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ duration: 0.6, delay: 0.2 }}
                                >
                                  <PaymentCard
                                    total={summary.total}
                                    handlePayment={onPayment}
                                    placing={placing}
                                    cartLength={cart.length}
                                    delivery={delivery}
                                    useSame={useSame}
                                    pickup={pickup}
                                    isPhoneValid={isPhoneValid}
                                    pickupTime={pickupTime}
                                  />
                                </motion.div>
                              </div>
                            </div>

                            {/* Right Column - Order Summary & Promotions (1/3 width) */}
                            <div className="xl:w-1/3 space-y-6 order-3 xl:order-1">
                                {/* Promotions Card - Desktop only */}
                              {availablePromotions.length > 0 && (
                                <div className="hidden xl:block">
                                    <PromotionCard
                                      appliedPromotion={appliedPromotion}
                                    />
                                  
                                </div>
                              )}
                              {/* Order Summary Card - First on mobile */}
                              <div className="hidden lg:block">
                                <OrderSummaryCard 
                                  cart={cart}
                                  appliedPromotion={appliedPromotion}
                                  useSame={useSame}
                                  {...summary} 
                                />
                              </div>

                              
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[40vh]">
                    <FaSpinner className="animate-spin text-4xl text-primary" />
                    <p className="ml-4 text-gray-700 mt-2">Loading checkout...</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </APIProvider>
     
  );
};

export default Checkout;



