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

import PlaceAutocompleteElementWrapper from "../components/PlaceAutoCompleteElementWrapper"
import MapHandler from "../components/MapHandler";
import REGION_CONFIG from '../utils/regionConfig'
import PersonalInformationCard from "../components/PersonalInformationCard";
import PromotionCard from "../components/PromotionCard";
import PromoCodeBox from "../components/PromoCodeBox";
import { getSavedPromoCode, clearSavedPromoCode } from "../utils/promoCode";
import OrderSummaryCard from "../components/OrderSummaryCard";
import { calculateOrderSummary } from '../utils/calculateOrderSummary'
import { usePlaceOrder } from '../hooks/usePlaceOrder';
import { Link } from "react-router-dom";
import { motion } from 'framer-motion';
import api from '../api';
import CheckoutStepper, { CHECKOUT_STEPS } from '../components/CheckoutStepper';
import { AnimatePresence } from 'framer-motion';
import { btnPrimary, btnSecondary, btnIcon, card, money, CHECKOUT_CSS } from '../components/checkoutUi';

// One block on the review step, with an Edit link back to its step
const ReviewRow = ({ title, onEdit, children }) => (
  <div>
    <div style={{ minWidth: 0 }}>
      <h3>{title}</h3>
      {children}
    </div>
    <button type="button" className="kkco-edit" onClick={onEdit} aria-label={`Edit ${title.toLowerCase()}`}>Edit</button>
  </div>
);

const Checkout = () => {
  const { refreshToken, setAccessToken, setRefreshToken, logout, user, discounts } = useContext(AuthContext);
  const { cart, clearCart } = useContext(CartContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  // --- Constants ---
  const Maps_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
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
  
  // Back from Paystack after a failed payment: the order already exists (unpaid), so
  // send the customer to their orders to pay for it, rather than checking out again.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment_status') === 'failed') {
      navigate('/orders', { replace: true });
      // After the redirect, so the alert isn't lost while the app is still starting up.
      setTimeout(() => toast.error("The payment didn't go through. Your order is saved under Orders, where you can pay for it.",
        { toastId: 'payment-return', autoClose: 8000 }), 300);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        // Fetch discount status after user loads
        await fetchUserDiscountStatus();
        await fetchUserReferralDiscountStatus();
        await fetchRedeemedPointsDiscount();
        await fetchAvailablePromotions();
        await applySavedPromoCode();
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
          // A code the customer typed or came in with wins over the automatic promotion.
          setAppliedPromotion((prev) => (prev && prev.is_public === false ? prev : validPromotion));
          if (cart.length > 0 && !getSavedPromoCode()) {
            toast.success(`${validPromotion.discount_percentage}% promotion applied automatically.`);
          }
        }
      }
    } catch (error) {
      console.log("Error fetching promotions:", error);
    }
  }

  // A code saved from a shared link (?code=KOFI15): check it and apply it.
  const applySavedPromoCode = async () => {
    const saved = getSavedPromoCode();
    if (!saved) return;
    try {
      const { data } = await api.post('/api/promotions/validate/', { code: saved });
      setAppliedPromotion(data);
      toast.success(`Code ${data.code} applied: ${Number(data.discount_percentage)}% off your Kleans.`, { toastId: 'promo-code' });
    } catch (err) {
      clearSavedPromoCode();
      const reason = err.response?.data?.error;
      if (reason) toast.info(`Code ${saved}: ${reason}`, { toastId: 'promo-code' });
    }
  };

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

  // The day's public promotion, if any (applied automatically when no code is in use).
  const publicPromotion = availablePromotions.find((p) => new Date(p.end_date) > new Date() && p.is_active === true) || null;
  const typedCode = appliedPromotion && appliedPromotion.is_public === false ? appliedPromotion : null;
  const promoBox = (
    <PromoCodeBox
      appliedCode={typedCode}
      note={summary?.codeNote}
      onApply={(data) => setAppliedPromotion(data)}
      onRemove={() => setAppliedPromotion(publicPromotion)}
    />
  );


  // Initialize the hook with all necessary dependencies
  const { placing, handlePayment } = usePlaceOrder({
      user, navigate, logout, api, baseURL,
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
        toast.success(`${type === 'pickup' ? 'Pickup' : 'Delivery'} address set${location.region ? ` in ${location.region}` : ''}.`);
      } else {
        toast.info(`${type === 'pickup' ? 'Pickup' : 'Delivery'} address cleared.`);
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
  const Arrow = ({ back = false }) => (
    <svg className={back ? '' : 'fwd'} viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path d={back ? 'M19 12H5m6-6l-6 6 6 6' : 'M5 12h14m-6-6l6 6-6 6'} fill="none" stroke="currentColor" strokeWidth="2.4" />
    </svg>
  );

  // Show loading state while checking pending order
  if (checkingPendingOrder) {
    return (
      <div className="kkco">
        <style>{CHECKOUT_CSS}</style>
        <div className="kkco-wrap" style={{ minHeight: '60vh', display: 'grid', placeItems: 'center' }}>
          <p className="kkco-sub" role="status" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="kkco-spin" aria-hidden="true" /> Checking your order status…
          </p>
        </div>
      </div>
    );
  }

  return (
    <GoogleMapsProvider onLoad={() => console.log('Google Maps API loaded successfully!')}>
      <div className="kkco">
        <style>{CHECKOUT_CSS}</style>
        <div className="kkco-wrap">
          {loading ? (
            <div style={{ paddingTop: 40 }} aria-busy="true" aria-label="Loading checkout">
              <div className="kkco-skel" style={{ height: 90, maxWidth: 420 }} />
              <div style={{ display: 'grid', gap: 16, marginTop: 24 }}>
                <div className="kkco-skel" style={{ height: 70 }} />
                <div className="kkco-skel" style={{ height: 280 }} />
              </div>
            </div>
          ) : cart.length === 0 ? (
            <div className="kkco-empty">
              <h2>Your cart is empty</h2>
              <p>Add a Klean first, then come back here to choose pickup and pay.</p>
              <div>
                <Link to="/#services" className={btnPrimary}>Browse services <Arrow /></Link>
                <Link to="/" className={btnSecondary}>Back to home</Link>
              </div>
            </div>
          ) : (
            /* Checkout: one step at a time, summary alongside on large screens */
            <div id="checkout-steps" className="scroll-mt-24 pb-28 lg:pb-0">
              <header className="kkco-top">
                <h1>Checkout</h1>
                <p className="sub">{CHECKOUT_STEPS[step].hint}</p>
              </header>

              <CheckoutStepper step={step} onStepClick={goToStep} />

              <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px] xl:grid-cols-[minmax(0,1fr)_400px] gap-5 lg:gap-7 mt-6 items-start">
                <div className="min-w-0 space-y-4">
                  {/* Small screens: summary folds open above the step */}
                  <div className={`${card} lg:hidden overflow-hidden`}>
                    <button
                      type="button"
                      className="kkco-fold"
                      onClick={() => setSummaryOpen((open) => !open)}
                      aria-expanded={summaryOpen}
                      aria-controls="mobile-summary"
                    >
                      <span>
                        {summaryOpen ? 'Hide' : 'Show'} summary
                        <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2.6" /></svg>
                      </span>
                      <strong>{money(summary.total)}</strong>
                    </button>
                    <AnimatePresence initial={false}>
                      {summaryOpen && (
                        <motion.div
                          id="mobile-summary"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.35, ease: [0.77, 0, 0.18, 1] }}
                          style={{ overflow: 'hidden' }}
                        >
                          <div style={{ padding: '4px 16px 16px', borderTop: '1px solid var(--line)' }}>
                            <OrderSummaryCard bare cart={cart} appliedPromotion={appliedPromotion} useSame={useSame} isSelfHandled={isSelfHandled} {...summary} />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  {availablePromotions.length > 0 && !typedCode && (
                    <div className="lg:hidden">
                      <PromotionCard appliedPromotion={appliedPromotion} />
                    </div>
                  )}
                  <div className="lg:hidden">{promoBox}</div>

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
                    <section className={card} aria-labelledby="review-title">
                      <div className="kkco-body" style={{ paddingBottom: 0 }}>
                        <div className="kkco-head" style={{ marginBottom: 0 }}>
                          <h2 id="review-title" className="kkco-h">Review</h2>
                          <p className="kkco-sub">Check your details before you pay.</p>
                        </div>
                      </div>
                      <div className="kkco-review">
                        <ReviewRow title="Your details" onEdit={() => goToStep(0)}>
                          <p className="main">{[user?.first_name, user?.last_name].filter(Boolean).join(' ') || 'You'}</p>
                          <p>{user?.email}</p>
                          <p>{phoneNumber}</p>
                        </ReviewRow>
                        <ReviewRow title="Pickup & delivery" onEdit={() => goToStep(1)}>
                          {isSelfHandled ? (
                            <>
                              <p className="main">Drop off & collect</p>
                              <p>At our Achimota Golf Hills studio · no pickup or delivery fees</p>
                            </>
                          ) : (
                            <dl>
                              <div><dt>We collect from</dt><dd>{pickup?.address || '—'}</dd></div>
                              <div><dt>We deliver to</dt><dd>{useSame ? 'The same address' : delivery?.address || '—'}</dd></div>
                            </dl>
                          )}
                        </ReviewRow>
                      </div>
                    </section>

                    <PaymentCard />
                  </div>

                  {/* Step error */}
                  {stepError && (
                    <motion.p
                      key={shakeKey}
                      role="alert"
                      className="kkco-error"
                      initial={{ x: 0 }}
                      animate={{ x: [0, -8, 8, -6, 6, 0] }}
                      transition={{ duration: 0.4 }}
                    >
                      {stepError}
                    </motion.p>
                  )}

                  {/* Step buttons. Large screens: under the step. Small screens: a bar fixed to the bottom. */}
                  <div className="kkco-bar">
                    <div className="flex items-center gap-3">
                      {step === 0 ? (
                        <Link to="/cart" className={`${btnIcon} lg:hidden`} aria-label="Back to cart"><Arrow back /></Link>
                      ) : (
                        <button type="button" onClick={() => goToStep(step - 1)} className={`${btnIcon} lg:hidden`} aria-label="Back"><Arrow back /></button>
                      )}
                      {step === 0 ? (
                        <Link to="/cart" className="hidden lg:inline-flex items-center justify-center gap-2 select-none kkco-btn"><Arrow back /> Back to cart</Link>
                      ) : (
                        <button type="button" onClick={() => goToStep(step - 1)} className="hidden lg:inline-flex items-center justify-center gap-2 select-none kkco-btn"><Arrow back /> Back</button>
                      )}

                      {/* Total, on small screens only (the summary column shows it on large ones) */}
                      <div className="tot lg:hidden min-w-0 mr-auto">
                        <small>Total</small>
                        <b>{money(summary.total)}</b>
                      </div>

                      {step < CHECKOUT_STEPS.length - 1 ? (
                        <button type="button" onClick={() => goToStep(step + 1)} className={`${btnPrimary} lg:ml-auto`}>
                          <span className="sm:hidden">Continue</span>
                          <span className="hidden sm:inline">Continue to {CHECKOUT_STEPS[step + 1].label.toLowerCase()}</span>
                          <Arrow />
                        </button>
                      ) : (
                        <button type="button" onClick={onPayment} disabled={placing} className={`${btnPrimary} lg:ml-auto lg:min-w-[240px]`}>
                          {placing ? (
                            <><span className="kkco-spin" aria-hidden="true" /> Opening Paystack…</>
                          ) : (
                            <>
                              <span className="sm:hidden">Pay now</span>
                              <span className="hidden sm:inline">Pay {money(summary.total)}</span>
                              <Arrow />
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Side column on large screens: promotion and order summary on every step */}
                <aside className="hidden lg:block space-y-4 lg:sticky lg:top-24">
                  {availablePromotions.length > 0 && !typedCode && <PromotionCard appliedPromotion={appliedPromotion} />}
                  {promoBox}
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
