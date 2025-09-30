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

  const [delivery, setDelivery] = useState(() => getLocationFromStorage('deliveryLocation'));
  const [pickup, setPickup] = useState(() => getLocationFromStorage('pickupLocation'));
  const [useSame, setUseSame] = useState(true);
  const [deliveryInputValue, setDeliveryInputValue] = useState(() => localStorage.getItem('deliveryInputValue') || '');
  const [pickupInputValue, setPickupInputValue] = useState(() => localStorage.getItem('pickupInputValue') || '');
  const [locationLoading, setLocationLoading] = useState(true);
  const [deliveryRegion, setDeliveryRegion] = useState(() => localStorage.getItem('deliveryRegion') || 'Greater Accra');
  const [pickupRegion, setPickupRegion] = useState(() => localStorage.getItem('pickupRegion') || 'Greater Accra');
  const [showAlert, setShowAlert] = useState(true);
  const [paymentView, setPaymentView] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isPhoneValid, setIsPhoneValid] = useState(false);
  const [signupDiscountUsed, setSignupDiscountUsed] = useState(false)
  const [referralDiscountUsed, setReferralDiscountUsed] = useState(false);
  const [redeemedPointsDiscount, setRedeemedPointsDiscount] = useState({});
  const [availablePromotions, setAvailablePromotions] = useState([]);
  const [appliedPromotion, setAppliedPromotion] = useState(null);
  const [activeInput, setActiveInput] = useState(null);
  const [transactionReference, setTransactionReference] = useState(null);


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
          toast.success(`🎉 ${validPromotion.discount_percentage}% promotion applied automatically!`);
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
        setDeliveryRegion, setPickupRegion, setUseSame, setAppliedPromotion
    });

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
    await handlePayment(summary, cart, phoneNumber, delivery, pickup, useSame);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <FaSpinner className="animate-spin text-4xl text-primary" />
        <p className="ml-4 text-gray-700">Loading checkout...</p>
      </div>
    );
  }

  return (
    
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
                   
                    {/* Contact Information Card */}
                    <PersonalInformationCard
                      phoneNumber={phoneNumber}
                      isPhoneValid={isPhoneValid}
                      handlePhoneChange={handlePhoneChange}
                      user={user}
                    />

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
                    />
                  </div>

                  {/* Right Column - Order Summary */}
                  <div className="lg:w-1/2 space-y-6">
                    {/* Promotions card section - Simplified */}
                    {availablePromotions.length > 0 && (
                      <PromotionCard
                        appliedPromotion={appliedPromotion}
                      />
                      
                    )}

                    {/* Order Summary Card */}
                    <OrderSummaryCard 
                      // Spread all the calculated values directly to the UI component
                      cart={cart}
                      appliedPromotion={appliedPromotion}
                      useSame={useSame}
                      {...summary} 
                    />
                  

                    {/* Checkout Button */}
                    <button
                      onClick={handleSubmit}
                      disabled={placing || cart.length === 0 || !delivery || (!useSame && !pickup) || !isPhoneValid}
                      className={`w-full py-3.5 px-6 rounded-lg font-medium text-white transition-all cursor-pointer ${
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
            // Payment view remains the same as before
            <div className="">
              {/* Payment view content remains */}
              <PaymentCard
                // 1. Spread all the calculated totals, discounts, and flags from the summary object
                {...summary} 
                
                // 2. Explicitly pass objects that are needed but weren't created inside the utility
                
                appliedPromotion={appliedPromotion}

                // 3. Pass all handler functions and local state needed for interaction
                useSame={useSame}
                handlePayment={onPayment}
                placing={placing}
                setPaymentView={setPaymentView}
                setShowAlert={setShowAlert}
                
              />

            </div>
          )}
        </div>
      </div>
    </APIProvider>
     
  );
};

export default Checkout;



