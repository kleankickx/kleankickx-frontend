import { useState, useCallback, useRef, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

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

// --- Local implementation of jwtDecode to avoid external library import issues ---
const jwtDecode = (token) => {
    try {
        if (!token) {
            return null;
        }
        // Get the second part (payload) of the token
        const base64Url = token.split('.')[1];
        if (!base64Url) {
            return null;
        }
        
        // Convert base64url to standard base64 and then decode
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        
        // atob decodes the base64 string. The map function handles Unicode characters correctly.
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        return JSON.parse(jsonPayload);
    } catch (e) {
        console.error("Failed to decode JWT locally:", e);
        return null;
    }
};

// --- Custom Hook ---
export const usePlaceOrder = (
    {
        user, navigate, logout, api, baseURL, 
        setAccessToken, setRefreshToken, clearCart,
        setDelivery, setPickup, setDeliveryInputValue, setPickupInputValue,
        setDeliveryRegion, setPickupRegion, setUseSame, setAppliedPromotion
    }
) => {
    const [placing, setPlacing] = useState(false);
    const placingRef = useRef(false);

    // Sync ref with state
    useEffect(() => {
        placingRef.current = placing;
    }, [placing]);

    const checkAndRefreshTokens = useCallback(async (refreshToken, currentAccessToken) => {
        try {
            if (!refreshToken) throw new Error('No refresh token');

            const decoded = jwtDecode(refreshToken);
            // If decoding fails, we treat it like an expired token and force logout.
            if (!decoded) throw new Error('Invalid refresh token format.');

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


   const handlePayment = useCallback(async (summary, cart, phoneNumber, delivery, pickup, useSame, pickupTime) => {
        // Use ref for the immediate check
        if (placingRef.current) return;

        setPlacing(true);
        placingRef.current = true;

        const { total, subtotal, deliveryFee, pickupFee, redeemedPointsDiscount, canUseRedeemedPoints } = summary;

        const currentRefreshToken = localStorage.getItem('refresh_token');
        const currentAccessToken = localStorage.getItem('access_token');

        try {
            // 1. Token Refresh/Validation
            await checkAndRefreshTokens(currentRefreshToken, currentAccessToken);

            // 2. Build Payload
            const appliedDiscounts = buildDiscountsPayload(summary);
            
            // 3. Post to Backend to Initialize Order and Payment
            const response = await api.post('/api/orders/', {
                user_id: user.id,
                delivery_location: delivery,
                pickup_location: useSame ? delivery : pickup,
                total_amount: total,
                cart_items: cart,
                delivery_cost: deliveryFee,
                pickup_cost: useSame ? deliveryFee : pickupFee,
                sub_total: subtotal,
                phone_number: phoneNumber,
                discounts_applied: appliedDiscounts,
                pickup_time: pickupTime?.value
            });

            // 4. Validate Response and Perform Local Cleanup
            const authUrl = response.data.paystack_auth_url;
            const orderReferenceCode = response.data.order_reference_code;
            const paystackReference = response.data.paystack_reference;
            
            if (response.status === 201 && authUrl && orderReferenceCode) {
                
                // *** CRITICAL: Store order reference before redirect ***
                localStorage.setItem('pending_order_ref', orderReferenceCode);
                localStorage.setItem('paystack_ref', paystackReference);
                // Store order data for fallback (optional)
                localStorage.setItem('last_order_data', JSON.stringify({
                    orderReferenceCode,
                    total,
                    subtotal,
                    createdAt: new Date().toISOString()
                }));
                
                // 4b. Discount Redemption (If applicable)
                if (canUseRedeemedPoints) {
                    try {
                        await api.patch(`/api/referrals/redeem/${redeemedPointsDiscount.id}/apply/`);
                    } catch (error) {
                        console.error("Error marking discount as applied:", error);
                    }
                }
                
                // 4c. Clear cart locally
                clearCart();
                
                toast.info("Redirecting to Paystack for secure payment...");

                // 5. REDIRECT THE USER
                // Use setTimeout to ensure localStorage is set before redirect
                setTimeout(() => {
                    window.location.href = authUrl;
                }, 100);
                
            } else {
                toast.error('Order placed, but failed to get payment link. Please check your order status.');
                navigate('/orders/');
            }
            
        } catch (error) {
            console.error("Payment Initiation Failed:", error);

            // --- Error Handling ---
            if (error.response?.status === 401 || error.message === 'No refresh token') {
                // Already handled in checkAndRefreshTokens
            } else {
                const errorMessage = error.response?.data?.detail || 
                                error.response?.data?.error || 
                                'An unexpected error occurred. Please try again.';
                                
                toast.error(errorMessage);
            }

        } finally {
            // Only reset placing state if we did not successfully redirect
            if (placingRef.current && !window.location.href.includes('paystack')) {
                setPlacing(false);
                placingRef.current = false;
            }
        }
    }, [
        user, api, checkAndRefreshTokens, navigate, setDelivery, setPickup, clearCart, 
        setDeliveryInputValue, setPickupInputValue, setDeliveryRegion, setPickupRegion, 
        setUseSame, setAppliedPromotion,
    ]);

    return { placing, handlePayment };
};
