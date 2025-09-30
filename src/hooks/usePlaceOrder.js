import { useState, useCallback, useRef, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { toast } from 'react-toastify';

// Assuming you have these utilities and constants available globally or passed via context/props
// For simplicity, we'll assume they are imported or available in scope in the file where this hook is used.
// If they are not globally available, you would need to pass them to the hook.

// --- Helper function to build the discounts payload ---
const buildDiscountsPayload = (summary) => {
    console.log("SUMMARY:", summary)
    const appliedDiscounts = [];

    if (summary.canUseSignup && summary.signupDiscount && summary.signupDiscountAmount > 0) {
        appliedDiscounts.push({
            type: summary.signupDiscount.discount_type.split(' ')[0],
            percentage: summary.signupDiscount.percentage,
            amount: summary.signupDiscountAmount
        });
    }

    if (summary.canUseReferral && summary.referralDiscount && summary.referralDiscountAmount > 0) {
        appliedDiscounts.push({
            type: summary.referralDiscount.discount_type.split(' ')[0],
            percentage: summary.referralDiscount.percentage,
            amount: summary.referralDiscountAmount
        });
    }

    if (summary.canUseRedeemedPoints && summary.redeemedPointsDiscount && summary.redeemedPointsDiscountAmount > 0) {
        appliedDiscounts.push({
            type: "redeemed_points",
            percentage: summary.redeemedPointsDiscount.percentage,
            amount: summary.redeemedPointsDiscountAmount,
            points_redeemed: summary.redeemedPointsDiscount.points_redeemed
        });
    }

    if (summary.appliedPromotion && summary.promoDiscountAmount > 0) {
        appliedDiscounts.push({
            type: "promotion",
            percentage: summary.appliedPromotion.discount_percentage,
            amount: summary.promoDiscountAmount,
            promotion_id: summary.appliedPromotion.id,
            promotion_code: summary.appliedPromotion.code
        });
    }
    return appliedDiscounts.length > 0 ? appliedDiscounts : null;
};

// --- Custom Hook ---
export const usePlaceOrder = (
    {
        user, navigate, logout, api, baseURL, PAYSTACK_PUBLIC_KEY,
        setAccessToken, setRefreshToken, clearCart,
        setDelivery, setPickup, setDeliveryInputValue, setPickupInputValue,
        setDeliveryRegion, setPickupRegion, setUseSame, setAppliedPromotion
    }
) => {
    const [placing, setPlacing] = useState(false);
    const placingRef = useRef(false); // To prevent multiple submissions

    // Sync ref with state
    useEffect(() => {
        placingRef.current = placing;
    }, [placing]);

    

    const checkAndRefreshTokens = useCallback(async (refreshToken, currentAccessToken) => {
        try {
            if (!refreshToken) throw new Error('No refresh token');

            const decoded = jwtDecode(refreshToken);
            const currentTime = Date.now() / 1000;
            const timeLeft = decoded.exp - currentTime;

            // Refresh token if it expires in less than 60 seconds (or if access token is missing/expired)
            if (timeLeft < 60 || !currentAccessToken) {
                const response = await axios.post(`${baseURL}/api/token/refresh/`, { refresh: refreshToken });

                const newAccessToken = response.data.access;
                const newRefreshToken = response.data.refresh || refreshToken;

                setAccessToken(newAccessToken);
                localStorage.setItem('access_token', newAccessToken);

                if (response.data.refresh) {
                    setRefreshToken(newRefreshToken);
                    localStorage.setItem('refresh_token', newRefreshToken);
                }
                return newAccessToken; // Return the new access token
            }
            return currentAccessToken;
        } catch (tokenError) {
            console.error('Token refresh error:', tokenError);
            logout();
            toast.error('Session expired. Please log in again to complete your order.');
            navigate('/login?continuePath=/checkout');
            throw tokenError; // Re-throw to stop payment process
        }
    }, [baseURL, logout, navigate, setAccessToken, setRefreshToken]);


    const handlePayment = useCallback(async (summary, cart, phoneNumber, delivery, pickup, useSame) => {
        // Use ref for the immediate check
        if (placingRef.current) return;

        
        

        const { total, subtotal, deliveryFee, pickupFee, signupDiscount, signupDiscountAmount, referralDiscount, referralDiscountAmount, redeemedPointsDiscount, redeemedPointsDiscountAmount, promoDiscountAmount, canUseSignup, canUseReferral, canUseRedeemedPoints, appliedPromotion } = summary;

        const currentRefreshToken = localStorage.getItem('refresh_token');
        const currentAccessToken = localStorage.getItem('access_token');

        try {
            // 1. Token Refresh/Validation
            await checkAndRefreshTokens(currentRefreshToken, currentAccessToken);

            // 2. Build Payload
            const appliedDiscounts = buildDiscountsPayload(summary);
            const transactionRef = `order_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
            console.log(appliedDiscounts)
            // 3. Initialize Paystack
            const handler = window.PaystackPop && new window.PaystackPop();
            if (!handler) {
                toast.error("Payment system not loaded. Please try again.");
                return;
            }

           
            handler.newTransaction({
                key: PAYSTACK_PUBLIC_KEY,
                email: user.email,
                amount: total * 100, // Amount in Kobo/Pesewas
                currency: 'GHS',
                reference: transactionRef,
                
                // --- Paystack onSuccess handler ---
                onSuccess: async (transaction) => {

                    setPlacing(true)
                    placingRef.current = true;

                    console.log('--- Payment Started: Placing', placing);
                    // Prevent navigation away during order creation
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
                            // Re-check and refresh token before each API retry
                            await checkAndRefreshTokens(localStorage.getItem('refresh_token'), localStorage.getItem('access_token'));
                            
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
                                discounts_applied: appliedDiscounts
                            });

                            success = true;
                            
                            // 4. Cleanup on Success
                            clearCart();
                            // Clear all relevant local storage items
                            ['deliveryLocation', 'pickupLocation', 'deliveryInputValue', 'pickupInputValue', 'deliveryRegion', 'pickupRegion', 'failedOrder'].forEach(key => {
                                localStorage.removeItem(key);
                            });

                            if (canUseRedeemedPoints) {
                                try {
                                    // Use api.patch directly since tokens are managed
                                    await api.patch(`/api/referrals/redeem/${redeemedPointsDiscount.id}/apply/`);
                                } catch (error) {
                                    console.error("Error marking discount as applied:", error);
                                }
                            }

                            // Reset component state
                            setDelivery(null); setPickup(null);
                            setDeliveryInputValue(''); setPickupInputValue('');
                            setDeliveryRegion(''); setPickupRegion('');
                            setUseSame(true); setAppliedPromotion(null);
                            
                            window.removeEventListener('beforeunload', beforeUnloadHandler);
                            toast.success('Order placed successfully! Thank you for your purchase.');
                            navigate(`/orders/${response.data.order_slug}`);
                            
                        } catch (error) {
                            lastError = error;
                            retries--;

                            // Special handling for 401: Refresh token and retry immediately
                            if (error.response?.status === 401 && retries >= 0) {
                                // checkAndRefreshTokens called at start of loop handles this
                            } else if (retries > 0) {
                                // Wait before next non-401 retry
                                await new Promise(resolve => setTimeout(resolve, 1000 * (4 - retries)));
                            } else if (error.response?.status === 401) {
                                // If 401 after all retries or failed refresh
                                throw error;
                            }
                        }
                    }

                    if (!success) {
                        throw lastError || new Error('Failed to create order after maximum retries.');
                    }
                },
                
                // --- Paystack onCancel handler ---
                onCancel: () => {
                    toast.info('Payment cancelled. Your order was not placed.');
                }
            });
        } catch (error) {
            // Catches token errors or errors during Paystack initialization
            if (error.response?.status !== 401 && error.message !== 'No refresh token') {
                 // Save order details if Paystack succeeded but the order POST failed
                if (error.response) { // This error is from order POST failure
                    const failedOrder = {
                        user_id: user.id,
                        delivery_location: delivery,
                        pickup_location: useSame ? delivery : pickup,
                        total_amount: total,
                        cart_items: cart,
                        transaction_id: error.config?.data?.transaction_id, // Get ref from request payload
                        phone_number: phoneNumber,
                        error: error.message,
                        response_data: error.response.data
                    };
                    localStorage.setItem('failedOrder', JSON.stringify(failedOrder));
                    navigate('/orders/failed');
                } else {
                    toast.error('Error initializing payment. Please try again.');
                }
            }
        } finally {
            setPlacing(false);
            placingRef.current =  false;
        }
    }, [setPlacing, user, api, PAYSTACK_PUBLIC_KEY, checkAndRefreshTokens, navigate, setDelivery, setPickup, setDeliveryInputValue, setPickupInputValue, setDeliveryRegion, setPickupRegion, setUseSame, setAppliedPromotion, clearCart]);

    return { placing, handlePayment };
};