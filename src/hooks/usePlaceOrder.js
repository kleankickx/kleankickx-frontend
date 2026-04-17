// src/hooks/usePlaceOrder.js

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

// --- Local implementation of jwtDecode ---
const jwtDecode = (token) => {
    try {
        if (!token) {
            return null;
        }
        const base64Url = token.split('.')[1];
        if (!base64Url) {
            return null;
        }
        
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        return JSON.parse(jsonPayload);
    } catch (e) {
        console.error("Failed to decode JWT locally:", e);
        return null;
    }
};

// --- Helper function to transform cart items for order API ---
const transformCartItemsForOrder = (cartItems) => {
    if (!cartItems || !Array.isArray(cartItems)) {
        console.log('No cart items or not an array:', cartItems);
        return [];
    }
    
    console.log('Raw cart items:', cartItems);
    
    const transformed = cartItems.map((item, index) => {
        // Try to get service_id from various possible fields
        const serviceId = item.service_id || item.service || item.id || item.serviceId;
        
        if (!serviceId) {
            console.error(`Item ${index} has no service_id:`, item);
        }
        
        return {
            service_id: serviceId,
            service_name: item.service_name || item.name || 'Service',
            quantity: item.quantity || 1,
            unit_price: item.unit_price || item.price || 0,
            total: item.total || (item.unit_price || item.price || 0) * (item.quantity || 1),
            imageBase64: item.image_base64 || item.imageBase64 || null,
            is_voucher_redeem: item.is_voucher_redeem || false,
            voucher_code: item.voucher_code || null,
            is_free_signup_service: item.is_free_signup_service || false,
            service_type: item.service_type || null,
            included_quantity: item.included_quantity || 1,
            customizations: item.customizations || {}
        };
    });
    
    console.log('Transformed cart items:', transformed);
    return transformed;
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

    useEffect(() => {
        placingRef.current = placing;
    }, [placing]);

    const checkAndRefreshTokens = useCallback(async (refreshToken, currentAccessToken) => {
        try {
            if (!refreshToken) throw new Error('No refresh token');

            const decoded = jwtDecode(refreshToken);
            if (!decoded) throw new Error('Invalid refresh token format.');

            const currentTime = Date.now() / 1000;
            const timeLeft = decoded.exp - currentTime;

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
                return newAccessToken;
            }
            return currentAccessToken;
        } catch (tokenError) {
            console.error('Token refresh error:', tokenError);
            logout();
            toast.error('Session expired. Please log in again to complete your order.');
            navigate('/login?continuePath=/checkout');
            throw tokenError;
        }
    }, [baseURL, logout, navigate, setAccessToken, setRefreshToken]);

    const handlePayment = useCallback(async (summary, cart, phoneNumber, delivery, pickup, useSame, pickupTime, isSelfHandled = false) => {
        if (placingRef.current) return;

        setPlacing(true);
        placingRef.current = true;

        const { total, subtotal, deliveryFee, pickupFee, redeemedPointsDiscount, canUseRedeemedPoints } = summary;

        const currentRefreshToken = localStorage.getItem('refresh_token');
        const currentAccessToken = localStorage.getItem('access_token');

        try {
            await checkAndRefreshTokens(currentRefreshToken, currentAccessToken);

            // Transform cart items - this is CRITICAL
            const transformedCartItems = transformCartItemsForOrder(cart);
            
            if (transformedCartItems.length === 0) {
                toast.error('Your cart is empty. Please add items before checkout.');
                setPlacing(false);
                placingRef.current = false;
                return;
            }
            
            // Validate all items have service_id
            const missingServiceId = transformedCartItems.some(item => !item.service_id);
            if (missingServiceId) {
                console.error('Some cart items missing service_id:', transformedCartItems);
                toast.error('Invalid cart data. Please try adding items again.');
                setPlacing(false);
                placingRef.current = false;
                return;
            }

            const appliedDiscounts = buildDiscountsPayload(summary);
            
            const orderData = {
                user_id: user?.id,
                total_amount: parseFloat(total),
                cart_items: transformedCartItems,
                sub_total: parseFloat(subtotal),
                phone_number: phoneNumber,
                discounts_applied: appliedDiscounts,
                is_self_handled: isSelfHandled,
            };
            
            if (!isSelfHandled) {
                orderData.delivery_location = delivery;
                orderData.pickup_location = useSame ? delivery : pickup;
                orderData.delivery_cost = parseFloat(deliveryFee) || 0;
                orderData.pickup_cost = useSame ? (parseFloat(deliveryFee) || 0) : (parseFloat(pickupFee) || 0);
                orderData.pickup_time = pickupTime?.value;
            } else {
                orderData.delivery_location = null;
                orderData.pickup_location = null;
                orderData.delivery_cost = 0;
                orderData.pickup_cost = 0;
            }
            
            console.log('Final order data being sent:', JSON.stringify(orderData, null, 2));
            
            const response = await api.post('/api/orders/', orderData);

            if (response.status === 201) {
                clearCart();
                
                localStorage.removeItem('cart_id');
                localStorage.removeItem('cart_sync_token');
                // Also clear session storage if any
                sessionStorage.removeItem('cart_id');

                setDelivery(null);
                setPickup(null);
                setDeliveryInputValue('');
                setPickupInputValue('');
                setDeliveryRegion(null);
                setPickupRegion(null);
                setUseSame(false);
                setAppliedPromotion(null);
                localStorage.removeItem('voucher_validation');
                
                const orderRef = response.data.order_reference_code;
                
                if (response.data.is_free_order) {
                    toast.success(response.data.message || "Order placed successfully!");
                    
                    if (canUseRedeemedPoints && redeemedPointsDiscount?.id) {
                        try {
                            await api.patch(`/api/referrals/redeem/${redeemedPointsDiscount.id}/apply/`);
                        } catch (error) {
                            console.error("Error marking discount as applied:", error);
                        }
                    }
                    
                    setTimeout(() => {
                        navigate(`/orders/${orderRef}/`);
                    }, 1500);
                    
                    setPlacing(false);
                    placingRef.current = false;
                    return;
                }
                
                const authUrl = response.data.paystack_auth_url;
                
                if (authUrl) {
                    if (canUseRedeemedPoints && redeemedPointsDiscount?.id) {
                        try {
                            await api.patch(`/api/referrals/redeem/${redeemedPointsDiscount.id}/apply/`);
                        } catch (error) {
                            console.error("Error marking discount as applied:", error);
                        }
                    }
                    
                    toast.info("Redirecting to Paystack for secure payment...");
                    window.location.href = authUrl;
                    
                } else {
                    toast.error('Order placed, but failed to get payment link.');
                    navigate('/orders/');
                    setPlacing(false);
                    placingRef.current = false;
                }
            } else {
                toast.error('Failed to create order. Please try again.');
                setPlacing(false);
                placingRef.current = false;
            }
            
        } catch (error) {
            console.error("Payment Initiation Failed:", error);
            console.error("Error response:", error.response?.data);

            if (error.response?.status === 401 || error.message === 'No refresh token') {
                // Handled elsewhere
            } else {
                const errorMessage = error.response?.data?.detail || 
                                error.response?.data?.error || 
                                error.response?.data?.message ||
                                'An unexpected error occurred. Please try again.';
                                
                toast.error(errorMessage);
                
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