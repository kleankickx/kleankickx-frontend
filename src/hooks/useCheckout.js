// // src/hooks/useCheckout.js
// import { useState, useEffect, useCallback, useContext } from 'react';
// import { toast } from 'react-toastify';
// import { 
//   getLocationFromStorage, 
//   persistToStorage,
//   validateGhanaPhone,
//   calculateDiscountAmount,
//   calculateOrderTotals,
//   findValidPromotion
// } from '../utils/checkoutUtils';
// import { STORAGE_KEYS } from '../config/checkoutConfig';
// import { AuthContext } from '../context/AuthContext';

// export const useCheckout = (api, user, discounts) => {
//   // State declarations
//   const [delivery, setDelivery] = useState(() => getLocationFromStorage(STORAGE_KEYS.DELIVERY_LOCATION));
//   const [pickup, setPickup] = useState(() => getLocationFromStorage(STORAGE_KEYS.PICKUP_LOCATION));
//   const [useSame, setUseSame] = useState(true);
//   const [deliveryInputValue, setDeliveryInputValue] = useState(() => localStorage.getItem(STORAGE_KEYS.DELIVERY_INPUT) || '');
//   const [pickupInputValue, setPickupInputValue] = useState(() => localStorage.getItem(STORAGE_KEYS.PICKUP_INPUT) || '');
//   const [deliveryRegion, setDeliveryRegion] = useState(() => localStorage.getItem(STORAGE_KEYS.DELIVERY_REGION) || 'Greater Accra');
//   const [pickupRegion, setPickupRegion] = useState(() => localStorage.getItem(STORAGE_KEYS.PICKUP_REGION) || 'Greater Accra');
//   const [phoneNumber, setPhoneNumber] = useState('');
//   const [isPhoneValid, setIsPhoneValid] = useState(false);
//   const [signupDiscountUsed, setSignupDiscountUsed] = useState(false);
//   const [referralDiscountUsed, setReferralDiscountUsed] = useState(false);
//   const [redeemedPointsDiscount, setRedeemedPointsDiscount] = useState({});
//   const [availablePromotions, setAvailablePromotions] = useState([]);
//   const [appliedPromotion, setAppliedPromotion] = useState(null);
  

//   // Fetch data on mount
//   useEffect(() => {
//     fetchUserDiscountStatus();
//     fetchUserReferralDiscountStatus();
//     fetchRedeemedPointsDiscount();
//     fetchAvailablePromotions();
//   }, []);

//   // API calls
//   const fetchUserDiscountStatus = async () => {
//     try {
//       const response = await api.get('/api/discounts/signup/status/');
//       setSignupDiscountUsed(response.data);
//     } catch (error) {
//       console.log("Error fetching signup discount status:", error);
//     }
//   };

//   const fetchUserReferralDiscountStatus = async () => {
//     try {
//       const response = await api.get('/api/discounts/referral/status/');
//       setReferralDiscountUsed(response.data);
//     } catch (error) {
//       console.log("Error fetching referral discount status:", error);
//     }
//   };

//   const fetchRedeemedPointsDiscount = async () => {
//     try {
//       const response = await api.get('/api/referrals/active-discount/');
//       setRedeemedPointsDiscount(response.data?.id ? response.data : null);
//     } catch (error) {
//       if (error.response?.status !== 404) {
//         console.log("Error fetching redeemed points discount:", error);
//       }
//     }
//   };

//   const fetchAvailablePromotions = async () => {
//     try {
//       const response = await api.get('/api/promotions/today');
//       const promotions = response.data;
//       setAvailablePromotions(promotions);
      
//       const validPromotion = findValidPromotion(promotions);
//       if (validPromotion) {
//         setAppliedPromotion(validPromotion);
//         toast.success(`🎉 ${validPromotion.discount_percentage}% promotion applied automatically!`);
//       }
//     } catch (error) {
//       console.log("Error fetching promotions:", error);
//     }
//   };

//   // Phone number handling
//   const handlePhoneChange = useCallback((e) => {
//     const input = e.target.value;
//     if (input.length <= 13) {
//       setPhoneNumber(input);
//       setIsPhoneValid(validateGhanaPhone(input));
//     }
//   }, []);

//   // Location handling
//   const handlePlaceSelect = useCallback((location, type) => {
//     const setters = {
//       delivery: [setDelivery, setDeliveryInputValue],
//       pickup: [setPickup, setPickupInputValue]
//     };

//     const [setLocation, setInputValue] = setters[type];
    
//     setLocation(location);
//     setInputValue(location ? location.address : '');
    
//     persistToStorage(`${type}Location`, location);
//     persistToStorage(`${type}InputValue`, location ? location.address : '');

//     if (type === 'delivery' && useSame && location) {
//       setPickup({ ...location, region: deliveryRegion });
//       setPickupInputValue(location.address);
//       persistToStorage('pickupLocation', { ...location, region: deliveryRegion });
//       persistToStorage('pickupInputValue', location.address);
//     }

//     setActiveInput(null);
    
//     if (location) {
//       toast.success(`${type} location set to ${location.areaName}, ${location.region}`);
//     }
//   }, [useSame, deliveryRegion]);

//   // Discount calculations
//   const getDiscounts = useCallback((cart) => {
//     const subtotal = cart.reduce((sum, item) => sum + item.quantity * item.price, 0);


//     const signupDiscount = discounts?.find(d => d.discount_type === 'signup');
//     const referralDiscount = discounts?.find(d => d.discount_type === 'referral');

//     if (user && !signupDiscountUsed?.signup_discount_used && signupDiscount) {
//       discounts.signup = {
//         type: 'signup',
//         percentage: signupDiscount.percentage,
//         amount: calculateDiscountAmount(subtotal, signupDiscount.percentage)
//       };
//     }

//     if (user && referralDiscountUsed?.first_order_completed === false && referralDiscount) {
//       discounts.referral = {
//         type: 'referral',
//         percentage: referralDiscount.percentage,
//         amount: calculateDiscountAmount(subtotal, referralDiscount.percentage)
//       };
//     }

//     if (user && redeemedPointsDiscount && !redeemedPointsDiscount.is_applied) {
//       discounts.redeemedPoints = {
//         type: 'redeemed_points',
//         percentage: redeemedPointsDiscount.percentage,
//         amount: calculateDiscountAmount(subtotal, redeemedPointsDiscount.percentage),
//         points_redeemed: redeemedPointsDiscount.points_redeemed
//       };
//     }

//     if (appliedPromotion) {
//       discounts.promotion = {
//         type: 'promotion',
//         percentage: appliedPromotion.discount_percentage,
//         amount: calculateDiscountAmount(subtotal, appliedPromotion.discount_percentage),
//         promotion_id: appliedPromotion.id
//       };
//     }

//     return discounts;
//   }, [signupDiscountUsed, referralDiscountUsed, redeemedPointsDiscount, appliedPromotion, discounts]);

//   return {
//     // State
//     delivery,
//     pickup,
//     useSame,
//     deliveryInputValue,
//     pickupInputValue,
//     deliveryRegion,
//     pickupRegion,
//     phoneNumber,
//     isPhoneValid,
//     appliedPromotion,
//     availablePromotions,

//     // Setters
//     setDelivery,
//     setPickup,
//     setUseSame,
//     setDeliveryInputValue,
//     setPickupInputValue,
//     setDeliveryRegion,
//     setPickupRegion,
//     setPhoneNumber,
//     setIsPhoneValid,

//     // Functions
//     handlePhoneChange,
//     handlePlaceSelect,
//     getDiscounts,
//     calculateOrderTotals
//   };
// };