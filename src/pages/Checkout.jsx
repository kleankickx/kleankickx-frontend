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
import { GoogleMapsProvider } from "../components/GoogleMapsProvider";
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
import { usePlaceOrder } from '../hooks/usePlaceOrder';
import { Link } from "react-router-dom";
import { motion } from 'framer-motion';
import api from '../api';
import CheckoutStepper, { CHECKOUT_STEPS } from '../components/CheckoutStepper';
import { FaArrowLeft, FaArrowRight, FaPen, FaHandHolding, FaMapMarkerAlt, FaUser, FaChevronDown, FaLock, FaShoppingBag } from 'react-icons/fa';
import { AnimatePresence } from 'framer-motion';
import { btnPrimary, btnSecondary, btnIcon, card, money } from '../components/checkoutUi';

// One block on the review step, with an Edit button back to its step
const ReviewRow = ({ icon: Icon, title, onEdit, children }) => (
  <div className="flex items-start gap-3 sm:gap-4 p-4 sm:p-5">
    <span className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary flex-shrink-0">
      <Icon className="w-4 h-4" aria-hidden="true" />
    </span>
    <div className="flex-1 min-w-0">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">{title}</h3>
      {children}
    </div>
    <button
      type="button"
      onClick={onEdit}
      aria-label={`Edit ${title.toLowerCase()}`}
      className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-sm font-medium text-primary hover:bg-primary/10 transition-colors cursor-pointer flex-shrink-0"
    >
      <FaPen className="w-3 h-3" aria-hidden="true" />
      <span className="hidden sm:inline">Edit</span>
    </button>
  </div>
);

const Checkout = () => {
  const { refreshToken, setAccessToken, setRefreshToken, logout, user, discounts } = useContext(AuthContext);
  const { cart, clearCart } = useContext(CartContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  // --- Constants ---
  const Maps_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;
  const DEFAULT_CENTER = { lat: 5.6037, lng: -0.1870 }; // Accra coordinates

  // State for locations and inputs
  const getLocationFromStorage = (key) => {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch {
      return null;
    }
  };

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
  const [isSelfHandled, setIsSelfHandled] = useState(false);
  const [checkingPendingOrder, setCheckingPendingOrder] = useState(false);

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
        setLoading(false);
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
        console.log(response.data)
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
      isSelfHandled,
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
    redeemedPointsDiscount,
    isSelfHandled
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
      const cleaned = number ? String(number).replace(/\D/g, '') : '';
      if (!cleaned) return '';
      
      let localNumber = cleaned;
      if (localNumber.startsWith('233')) {
          localNumber = localNumber.substring(3);
      } else if (localNumber.startsWith('0')) {
          localNumber = localNumber.substring(1);
      }

      if (localNumber.length === 9) {
          return localNumber.replace(/(\d{2})(\d{3})(\d{4})/, '0$1 $2 $3');
      }
      
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
    const input = e.target.value.replace(/[^\d\s+]/g, '');
    const digits = input.replace(/\D/g, '');
    // Up to 10 digits locally (024…), or 12 with the 233 country code
    if (digits.length <= (digits.startsWith('233') ? 12 : 10)) {
      setPhoneNumber(input);
      setIsPhoneValid(validateGhanaPhone(input));
    }
  };

  // --- Steps ---
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [stepError, setStepError] = useState('');
  const [shakeKey, setShakeKey] = useState(0);
  const [summaryOpen, setSummaryOpen] = useState(false);

  // What is still missing on a step; empty when the step is complete.
  const missingFor = (index) => {
    if (index === 0) return isPhoneValid ? '' : 'Enter a valid Ghana phone number to continue.';
    if (index === 1) {
      if (isSelfHandled) return '';
      if (!pickup) return 'Choose a pickup address to continue.';
      if (!delivery && !useSame) return 'Choose a delivery address, or use the pickup address.';
    }
    return '';
  };

  const goToStep = (next) => {
    if (next === step || next < 0 || next >= CHECKOUT_STEPS.length) return;
    // Moving forward needs every step before it complete.
    for (let i = step; i < next; i++) {
      const missing = missingFor(i);
      if (missing) {
        if (i !== step) setStep(i);
        setStepError(missing);
        setShakeKey((key) => key + 1);
        return;
      }
    }
    setStepError('');
    setDirection(next > step ? 1 : -1);
    setStep(next);
    document.getElementById('checkout-steps')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Clear the step's error once it is fixed.
  useEffect(() => {
    if (stepError && !missingFor(step)) setStepError('');
  }, [isPhoneValid, pickup, delivery, useSame, isSelfHandled]);

  // Persist delivery and pickup regions to localStorage
  useEffect(() => {
    localStorage.setItem('deliveryRegion', deliveryRegion);
    localStorage.setItem('pickupRegion', pickupRegion);
  }, [deliveryRegion, pickupRegion]);

  // Sync delivery location when useSame is true
  useEffect(() => {
    if (useSame && pickup) {
      setDelivery({ ...pickup, region: pickupRegion });
      setDeliveryInputValue(pickup.address);
      localStorage.setItem('deliveryLocation', JSON.stringify({ ...pickup, region: pickupRegion }));
      localStorage.setItem('deliveryInputValue', pickup.address);
    } else if (useSame && !pickup) {
      setDelivery(null);
      setDeliveryInputValue('');
      localStorage.removeItem('deliveryLocation');
      localStorage.removeItem('deliveryInputValue');
    }
  }, [useSame, pickup, pickupRegion]);

  // Show alert only once
  useEffect(() => {
    const hasSeenAlert = localStorage.getItem('hasSeenCheckoutAlert');
    if (!hasSeenAlert) {
      setShowAlert(true);
      localStorage.setItem('hasSeenCheckoutAlert', 'true');
    }
  }, []);

  // Handle place selection from map
  const handlePlaceSelect = useCallback((location, type, silent = false) => {
    setPickupTime(location ? location.pickupTime : null);
    
    if (type === 'pickup') {
      setPickup(location);
      setPickupInputValue(location ? location.address : '');
      localStorage.setItem('pickupLocation', JSON.stringify(location));
      localStorage.setItem('pickupInputValue', location ? location.address : '');
      
      if (useSame && location) {
        setDelivery({ ...location, region: pickupRegion });
        setDeliveryInputValue(location.address);
        localStorage.setItem('deliveryLocation', JSON.stringify({ ...location, region: pickupRegion }));
        localStorage.setItem('deliveryInputValue', location.address);
      } else if (useSame && !location) {
        setDelivery(null);
        setDeliveryInputValue('');
        localStorage.removeItem('deliveryLocation');
        localStorage.removeItem('deliveryInputValue');
      }
    } else {
      setDelivery(location);
      setDeliveryInputValue(location ? location.address : '');
      localStorage.setItem('deliveryLocation', JSON.stringify(location));
      localStorage.setItem('deliveryInputValue', location ? location.address : '');
    }
    
    setActiveInput(null);
    
    if (!silent) {
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
    }
  }, [useSame, pickupRegion]);

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

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!pickup) {
      toast.error('Please select a pickup location');
      return;
    }
    if (!delivery && !useSame) {
      toast.error('Please select a delivery location');
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
    if (!cart || cart.length === 0) {
      toast.error('Your cart is empty. Please add items before placing an order.');
      return;
    }

    if (!user) {
      toast.error('Please log in to complete your order.');
      navigate('/login?continuePath=/checkout');
      return;
    }

    if (!isPhoneValid) {
      toast.error('Please enter a valid Ghana phone number');
      return;
    }

    if (!isSelfHandled) {
      if (!pickup) {
        toast.error('Please select a pickup location');
        return;
      }
      if (!delivery && !useSame) {
        toast.error('Please select a delivery location');
        return;
      }
    }

    await handlePayment(summary, cart, phoneNumber, delivery, pickup, useSame, pickupTime, isSelfHandled);
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
    setShowAlert(true);
  }, [paymentView]);

  const stepAnimation = direction > 0 ? 'checkout-step-forward' : 'checkout-step-back';

  // Show loading state while checking pending order
  if (checkingPendingOrder) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="animate-spin text-4xl text-primary mx-auto mb-4" />
          <p className="text-gray-600">Checking your order status...</p>
        </div>
      </div>
    );
  }

  return (
    <GoogleMapsProvider onLoad={() => console.log('Google Maps API loaded successfully!')}>
      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
          
          {/* Show loading spinner while loading data */}
          {loading ? (
            <div className="min-h-[70vh] flex items-center justify-center">
              <div className="text-center">
                <FaSpinner className="animate-spin text-4xl text-primary mx-auto mb-4" />
                <p className="text-gray-600">Loading your cart...</p>
              </div>
            </div>
          ) : cart.length === 0 ? (
            /* Empty Cart State - Only show when loading is complete AND cart is empty */
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
          ) : (
            /* Checkout: one step at a time, summary alongside on large screens */
            <div id="checkout-steps" className="scroll-mt-24 pb-28 lg:pb-0">
              <div className="mb-5 sm:mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Checkout</h1>
                <p className="text-sm sm:text-base text-gray-500 mt-1">{CHECKOUT_STEPS[step].hint}</p>
              </div>

              <CheckoutStepper step={step} onStepClick={goToStep} />

              <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_400px] gap-6 lg:gap-8 mt-6 items-start">
                <div className="min-w-0 space-y-4">
                  {/* Small screens: summary folds open above the step */}
                  <div className={`${card} lg:hidden overflow-hidden`}>
                    <button
                      type="button"
                      onClick={() => setSummaryOpen((open) => !open)}
                      aria-expanded={summaryOpen}
                      aria-controls="mobile-summary"
                      className="w-full flex items-center justify-between gap-3 px-4 py-3.5 cursor-pointer"
                    >
                      <span className="flex items-center gap-2 text-sm font-medium text-primary">
                        <FaShoppingBag className="w-4 h-4" aria-hidden="true" />
                        {summaryOpen ? 'Hide' : 'Show'} order summary
                        <FaChevronDown className={`w-3 h-3 transition-transform duration-300 ${summaryOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
                      </span>
                      <span className="text-base font-bold text-gray-900">{money(summary.total)}</span>
                    </button>
                    <AnimatePresence initial={false}>
                      {summaryOpen && (
                        <motion.div
                          id="mobile-summary"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 pt-1 border-t border-gray-100">
                            <div className="pt-4">
                              <OrderSummaryCard bare cart={cart} appliedPromotion={appliedPromotion} useSame={useSame} isSelfHandled={isSelfHandled} {...summary} />
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  {availablePromotions.length > 0 && (
                    <div className="lg:hidden">
                      <PromotionCard appliedPromotion={appliedPromotion} />
                    </div>
                  )}

                  {/* Steps stay mounted (hidden when inactive) so addresses and inputs keep their state */}
                  <div hidden={step !== 0} className={step === 0 ? stepAnimation : ''}>
                    <PersonalInformationCard
                      phoneNumber={phoneNumber}
                      isPhoneValid={isPhoneValid}
                      handlePhoneChange={handlePhoneChange}
                      user={user}
                    />
                  </div>

                  <div hidden={step !== 1} className={step === 1 ? stepAnimation : ''}>
                    <DeliveryInformationCard
                      useSame={useSame}
                      setUseSame={setUseSame}
                      handlePlaceSelect={handlePlaceSelect}
                      setActiveInput={setActiveInput}
                      paymentView={paymentView}
                      delivery={delivery}
                      deliveryInputValue={deliveryInputValue}
                      deliveryRegion={deliveryRegion}
                      pickup={pickup}
                      pickupInputValue={pickupInputValue}
                      pickupRegion={pickupRegion}
                      pickupTime={pickupTime}
                      setPickupTime={setPickupTime}
                      isSelfHandled={isSelfHandled}
                      setIsSelfHandled={setIsSelfHandled}
                    />
                  </div>

                  <div hidden={step !== 2} className={`space-y-4 ${step === 2 ? stepAnimation : ''}`}>
                    <section className={`${card} divide-y divide-gray-100`} aria-label="Review your order">
                      <ReviewRow icon={FaUser} title="Your details" onEdit={() => goToStep(0)}>
                        <p className="text-gray-900 font-medium truncate">{[user?.first_name, user?.last_name].filter(Boolean).join(' ') || 'You'}</p>
                        <p className="text-gray-500 text-sm truncate">{user?.email}</p>
                        <p className="text-gray-500 text-sm">{phoneNumber}</p>
                      </ReviewRow>
                      <ReviewRow icon={isSelfHandled ? FaHandHolding : FaMapMarkerAlt} title="Pickup & delivery" onEdit={() => goToStep(1)}>
                        {isSelfHandled ? (
                          <>
                            <p className="text-gray-900 font-medium">Drop off & collect</p>
                            <p className="text-gray-500 text-sm">At our Achimota Golf Hills workshop · no pickup or delivery fees</p>
                          </>
                        ) : (
                          <dl className="text-sm space-y-2">
                            <div>
                              <dt className="text-gray-500">Pickup</dt>
                              <dd className="text-gray-900 font-medium break-words">{pickup?.address || '—'}</dd>
                            </div>
                            <div>
                              <dt className="text-gray-500">Delivery</dt>
                              <dd className="text-gray-900 font-medium break-words">{useSame ? 'Same as pickup' : delivery?.address || '—'}</dd>
                            </div>
                          </dl>
                        )}
                      </ReviewRow>
                    </section>

                    <PaymentCard />
                  </div>

                  {/* Step error */}
                  {stepError && (
                    <motion.p
                      key={shakeKey}
                      role="alert"
                      initial={{ x: 0 }}
                      animate={{ x: [0, -8, 8, -6, 6, 0] }}
                      transition={{ duration: 0.4 }}
                      className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                    >
                      <FaExclamationTriangle className="flex-shrink-0" aria-hidden="true" />
                      {stepError}
                    </motion.p>
                  )}

                  {/* Step buttons. Large screens: under the step. Small screens: a bar fixed to the bottom. */}
                  <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:static lg:z-auto lg:border-0 lg:bg-transparent lg:backdrop-blur-none lg:p-0 lg:pt-2">
                    <div className="flex items-center gap-3">
                      {step === 0 ? (
                        <Link to="/cart" className={`${btnIcon} lg:hidden`} aria-label="Back to cart">
                          <FaArrowLeft className="w-4 h-4" aria-hidden="true" />
                        </Link>
                      ) : (
                        <button type="button" onClick={() => goToStep(step - 1)} className={`${btnIcon} lg:hidden`} aria-label="Back">
                          <FaArrowLeft className="w-4 h-4" aria-hidden="true" />
                        </button>
                      )}
                      {step === 0 ? (
                        <Link to="/cart" className={`${btnSecondary} hidden lg:inline-flex`}>
                          <FaArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
                          Back to cart
                        </Link>
                      ) : (
                        <button type="button" onClick={() => goToStep(step - 1)} className={`${btnSecondary} hidden lg:inline-flex`}>
                          <FaArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
                          Back
                        </button>
                      )}

                      {/* Total, on small screens only (the summary column shows it on large ones) */}
                      <div className="lg:hidden min-w-0 mr-auto">
                        <p className="text-xs text-gray-500 leading-none">Total</p>
                        <p className="text-base font-bold text-gray-900 truncate">{money(summary.total)}</p>
                      </div>

                      {step < CHECKOUT_STEPS.length - 1 ? (
                        <button type="button" onClick={() => goToStep(step + 1)} className={`${btnPrimary} group lg:ml-auto`}>
                          <span className="sm:hidden">Continue</span>
                          <span className="hidden sm:inline">Continue to {CHECKOUT_STEPS[step + 1].label.toLowerCase()}</span>
                          <FaArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={onPayment}
                          disabled={placing}
                          className={`${btnPrimary} lg:ml-auto lg:min-w-[240px]`}
                        >
                          {placing ? (
                            <>
                              <FaSpinner className="w-4 h-4 animate-spin" aria-hidden="true" />
                              Processing…
                            </>
                          ) : (
                            <>
                              <FaLock className="w-3.5 h-3.5" aria-hidden="true" />
                              <span className="sm:hidden">Pay now</span>
                              <span className="hidden sm:inline">Pay {money(summary.total)}</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Side column on large screens: promotion and order summary on every step */}
                <aside className="hidden lg:block space-y-4 lg:sticky lg:top-24">
                  {availablePromotions.length > 0 && <PromotionCard appliedPromotion={appliedPromotion} />}
                  <OrderSummaryCard
                    cart={cart}
                    appliedPromotion={appliedPromotion}
                    useSame={useSame}
                    isSelfHandled={isSelfHandled}
                    {...summary}
                  />
                </aside>
              </div>
            </div>
          )}
        </div>
      </div>
    </GoogleMapsProvider>
  );
};

export default Checkout;