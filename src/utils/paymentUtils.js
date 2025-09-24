// src/utils/paymentUtils.js
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';
import { toast } from 'react-toastify';
import { CHECKOUT_CONFIG, STORAGE_KEYS } from '../config/checkoutConfig';

// Token management
export const validateAndRefreshToken = async (refreshToken, baseURL) => {
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
    
    return {
      accessToken: response.data.access,
      refreshToken: response.data.refresh || refreshToken
    };
  }
  
  return null;
};

// Discount formatting
export const formatAppliedDiscounts = (discounts, appliedPromotion, cart) => {
  const appliedDiscounts = [];
  const subtotal = cart.reduce((sum, item) => sum + item.quantity * item.price, 0);

  if (discounts.signup) {
    appliedDiscounts.push({
      type: discounts.signup.type,
      percentage: discounts.signup.percentage,
      amount: discounts.signup.amount
    });
  }

  if (discounts.referral) {
    appliedDiscounts.push({
      type: discounts.referral.type,
      percentage: discounts.referral.percentage,
      amount: discounts.referral.amount
    });
  }

  if (discounts.redeemedPoints) {
    appliedDiscounts.push({
      type: discounts.redeemedPoints.type,
      percentage: discounts.redeemedPoints.percentage,
      amount: discounts.redeemedPoints.amount,
      points_redeemed: discounts.redeemedPoints.points_redeemed
    });
  }

  if (appliedPromotion) {
    appliedDiscounts.push({
      type: "promotion",
      percentage: appliedPromotion.discount_percentage,
      amount: (subtotal * appliedPromotion.discount_percentage) / 100,
      promotion_id: appliedPromotion.id,
      promotion_code: appliedPromotion.code
    });
  }

  return appliedDiscounts;
};

// Order data preparation
export const prepareOrderData = (orderData) => {
  return {
    user_id: orderData.user.id,
    delivery_location: orderData.delivery,
    pickup_location: orderData.useSame ? orderData.delivery : orderData.pickup,
    total_amount: orderData.totals.total,
    cart_items: orderData.cart,
    delivery_cost: orderData.deliveryFee,
    pickup_cost: orderData.useSame ? orderData.deliveryFee : orderData.pickupFee,
    sub_total: orderData.totals.subtotal,
    transaction_id: orderData.transactionRef,
    phone_number: orderData.phoneNumber,
    discounts_applied: orderData.appliedDiscounts.length > 0 ? orderData.appliedDiscounts : null
  };
};

// Payment handler
export const initializePaystackPayment = (paystackConfig) => {
  const handler = window.PaystackPop && new window.PaystackPop();
  if (!handler) {
    throw new Error("Payment system not loaded");
  }

  return handler.newTransaction(paystackConfig);
};

// Cleanup after successful order
export const cleanupAfterOrder = (clearCart, setStateFunctions) => {
  // Clear cart
  clearCart();
  
  // Clear localStorage
  Object.values(STORAGE_KEYS).forEach(key => {
    if (key !== STORAGE_KEYS.CHECKOUT_ALERT) {
      localStorage.removeItem(key);
    }
  });

  // Reset state
  setStateFunctions.forEach(setter => setter(null));
  
  // Remove beforeunload listener
  window.removeEventListener('beforeunload', paystackConfig.beforeUnloadHandler);
};

// Error handling
export const handlePaymentError = (error, orderData, logout, navigate) => {
  console.error('Payment error:', error);
  
  // Save failed order for recovery
  const failedOrder = {
    user_id: orderData.user.id,
    delivery_location: orderData.delivery,
    pickup_location: orderData.useSame ? orderData.delivery : orderData.pickup,
    total_amount: orderData.totals.total,
    cart_items: orderData.cart,
    transaction_id: orderData.transactionRef,
    phone_number: orderData.phoneNumber,
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
};

// Retry mechanism for API calls
export const retryApiCall = async (apiCall, maxRetries = CHECKOUT_CONFIG.retryAttempts) => {
  let retries = maxRetries;
  let lastError = null;

  while (retries > 0) {
    try {
      return await apiCall();
    } catch (error) {
      lastError = error;
      retries--;
      
      if (error.response?.status === 401 && retries > 0) {
        // Token refresh will be handled by the calling function
        throw error;
      } else if (retries > 0) {
        await new Promise(resolve => 
          setTimeout(resolve, CHECKOUT_CONFIG.retryDelay * (maxRetries - retries))
        );
      }
    }
  }
  
  throw lastError || new Error(`Failed after ${maxRetries} retries`);
};