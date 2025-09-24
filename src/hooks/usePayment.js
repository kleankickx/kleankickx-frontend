// src/hooks/usePayment.js
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  validateAndRefreshToken,
  formatAppliedDiscounts,
  prepareOrderData,
  initializePaystackPayment,
  cleanupAfterOrder,
  handlePaymentError,
  retryApiCall
} from '../utils/paymentUtils';

export const usePayment = (api, user, logout, clearCart) => {
  const [placing, setPlacing] = useState(false);
  const [transactionReference, setTransactionReference] = useState(null);
  const navigate = useNavigate();

  const processPayment = useCallback(async (paymentData) => {
    if (placing) return;

    const {
      cart,
      totals,
      discounts,
      appliedPromotion,
      delivery,
      pickup,
      useSame,
      deliveryFee,
      pickupFee,
      phoneNumber,
      refreshToken,
      baseURL,
      paystackPublicKey,
      setStateFunctions // Array of state setters to reset after order
    } = paymentData;

    try {
      setPlacing(true);

      // Validate and refresh token if needed
      try {
        const newTokens = await validateAndRefreshToken(refreshToken, baseURL);
        if (newTokens) {
          // Update tokens in context and localStorage
          // This would need to be handled by the AuthContext
          paymentData.onTokenRefresh?.(newTokens);
        }
      } catch (tokenError) {
        console.error('Token refresh error:', tokenError);
        logout();
        toast.error('Session expired. Please login again to complete your order.');
        navigate('/login?continuePath=/checkout');
        setPlacing(false);
        return;
      }

      // Format applied discounts
      const appliedDiscounts = formatAppliedDiscounts(discounts, appliedPromotion, cart);

      // Generate transaction reference
      const transactionRef = `order_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      setTransactionReference(transactionRef);

      // Prepare order data
      const orderData = {
        user,
        delivery,
        pickup,
        useSame,
        totals,
        cart,
        deliveryFee,
        pickupFee,
        phoneNumber,
        transactionRef,
        appliedDiscounts
      };

      const orderPayload = prepareOrderData(orderData);

      // Initialize Paystack payment
      const paystackConfig = {
        key: paystackPublicKey,
        email: user.email,
        amount: totals.total * 100,
        currency: 'GHS',
        reference: transactionRef,
        onSuccess: async (transaction) => {
          await handlePaymentSuccess(transaction, orderData, api, clearCart, setStateFunctions, navigate);
          setPlacing(false);
        },
        onCancel: () => {
          setPlacing(false);
          toast.info('Payment cancelled. Your order was not placed.');
        }
      };

      // Add beforeunload handler
      const beforeUnloadHandler = (e) => {
        e.preventDefault();
        e.returnValue = 'Your order is being processed. Please wait...';
        return e.returnValue;
      };
      window.addEventListener('beforeunload', beforeUnloadHandler);
      paystackConfig.beforeUnloadHandler = beforeUnloadHandler;

      initializePaystackPayment(paystackConfig);

    } catch (error) {
      setPlacing(false);
      console.error('Error initializing payment:', error);
      
      if (error.message === "Payment system not loaded") {
        toast.error("Payment system not loaded. Please try again.");
      } else {
        toast.error('Error initializing payment. Please try again.');
      }
    }
  }, [placing, logout, navigate, clearCart, api]);

  const handlePaymentSuccess = async (transaction, orderData, api, clearCart, setStateFunctions, navigate) => {
    try {
      const orderPayload = prepareOrderData({
        ...orderData,
        transaction_id: transaction.reference
      });

      // Retry the order creation with token refresh handling
      await retryApiCall(async () => {
        const response = await api.post('/api/orders/', orderPayload);
        return response;
      });

      // Mark redeemed points as applied if used
      if (orderData.discounts.redeemedPoints) {
        try {
          await api.patch(`/api/referrals/redeem/${orderData.discounts.redeemedPoints.promotion_id}/apply/`);
        } catch (error) {
          console.error("Error marking discount as applied:", error);
        }
      }

      // Cleanup after successful order
      cleanupAfterOrder(clearCart, setStateFunctions);

      // Navigate to order confirmation
      navigate(`/orders/${response.data.order_slug}`);
      toast.success('Order placed successfully! Thank you for your purchase.');

    } catch (error) {
      handlePaymentError(error, orderData, logout, navigate);
      throw error;
    }
  };

  return {
    placing,
    transactionReference,
    processPayment
  };
};