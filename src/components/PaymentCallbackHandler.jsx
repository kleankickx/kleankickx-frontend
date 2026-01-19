// src/components/PaymentCallbackHandler.jsx
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';

const PaymentCallbackHandler = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const handlePaymentCallback = async () => {
      const reference = searchParams.get('reference');
      const trxref = searchParams.get('trxref');
      const status = searchParams.get('status');
      
      // Get stored order reference from localStorage
      const pendingOrderRef = localStorage.getItem('pending_order_ref');
      
      // Scenario 1: User cancelled (Paystack returns with no params or specific cancellation)
      if (!reference && !trxref) {
        toast.info('Payment was cancelled');
        
        if (pendingOrderRef) {
          // Check if order exists on backend
          try {
            const token = localStorage.getItem('access_token');
            const response = await axios.get(
              `/api/orders/${pendingOrderRef}/status/`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            
            if (response.data.order_exists) {
              // Order exists, redirect to order details
              navigate(`/orders/${pendingOrderRef}`);
            } else {
              // Order doesn't exist, go back to checkout
              navigate('/checkout');
            }
          } catch (error) {
            // If we can't verify, assume order exists and redirect to details
            navigate(pendingOrderRef ? `/orders/${pendingOrderRef}` : '/checkout');
          }
        } else {
          // No pending order, go back to checkout
          navigate('/checkout');
        }
        return;
      }
      
      // Scenario 2: Payment was attempted (has reference)
      const transactionRef = reference || trxref;
      
      try {
        // Verify payment with backend
        const verificationResponse = await axios.post('/api/payments/verify/', {
          reference: transactionRef
        }, {
          headers: { 
            Authorization: `Bearer ${localStorage.getItem('access_token')}` 
          }
        });
        
        const { success, order_reference_code, message } = verificationResponse.data;
        
        if (success) {
          // Payment successful
          toast.success(message || 'Payment successful!');
          
          // Clear pending order reference
          localStorage.removeItem('pending_order_ref');
          
          // Redirect to order details with success state
          navigate(`/orders/${order_reference_code}?payment=success`);
        } else {
          // Payment failed
          toast.error(message || 'Payment failed');
          
          if (order_reference_code) {
            // Order exists but payment failed
            navigate(`/orders/${order_reference_code}?payment=failed`);
          } else {
            // No order associated, go to checkout
            navigate('/checkout');
          }
        }
        
      } catch (error) {
        console.error('Payment verification error:', error);
        toast.error('Unable to verify payment status');
        
        // Fallback: If we have a pending order ref, go to order details
        navigate(pendingOrderRef ? `/orders/${pendingOrderRef}` : '/checkout');
      }
    };

    handlePaymentCallback();
  }, [searchParams, navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
      <p className="text-gray-600">Processing payment...</p>
    </div>
  );
};

export default PaymentCallbackHandler;