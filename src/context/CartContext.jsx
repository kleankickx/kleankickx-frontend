// src/context/CartContext.jsx
import React, { createContext, useState, useEffect } from 'react';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(() => {
    try {
      const storedCart = localStorage.getItem('cart');
      if (!storedCart) return [];
      
      const parsed = JSON.parse(storedCart);
      // Ensure we always return an array
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('cart', JSON.stringify(cart));
    } catch (error) {
      console.error('Failed to save cart to localStorage:', error);
    }
  }, [cart]);

  // Update the addToCart function in your CartContext.jsx
  const addToCart = (serviceId, serviceName, servicePrice, quantity = 1, serviceData = {}) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.service_id === serviceId);
      
      if (existingItem) {
        return prevCart.map(item =>
          item.service_id === serviceId
            ? { 
                ...item, 
                quantity: item.quantity + quantity,
                unit_price: servicePrice,
                // Preserve existing data and merge new serviceData
                ...serviceData,
                service_type: serviceData.service_type || item.service_type,
                is_free_signup_service: serviceData.is_free_signup_service !== undefined 
                  ? serviceData.is_free_signup_service 
                  : item.is_free_signup_service,
                is_voucher_redeem: serviceData.is_voucher_redeem !== undefined
                  ? serviceData.is_voucher_redeem
                  : item.is_voucher_redeem,
                included_quantity: serviceData.included_quantity || item.included_quantity,
                original_price: serviceData.original_price || item.original_price || servicePrice,
                voucher_code: serviceData.voucher_code || item.voucher_code,
                voucher_value: serviceData.voucher_value || item.voucher_value,
                voucher_id: serviceData.voucher_id || item.voucher_id
              }
            : item
        );
      } else {
        return [...prevCart, { 
          service_id: serviceId, 
          quantity, 
          service_name: serviceName, 
          unit_price: servicePrice,
          imageBase64: null,
          // Store all service properties including voucher info
          service_type: serviceData.service_type || null,
          is_free_signup_service: serviceData.is_free_signup_service || false,
          is_voucher_redeem: serviceData.is_voucher_redeem || false,
          included_quantity: serviceData.included_quantity || 1,
          original_price: serviceData.original_price || servicePrice,
          // Voucher-specific fields
          voucher_code: serviceData.voucher_code || null,
          voucher_value: serviceData.voucher_value || null,
          voucher_id: serviceData.voucher_id || null,
          is_bundle_service: serviceData.is_bundle_service || false,
          // Add a timestamp for tracking
          added_at: new Date().toISOString()
        }];
      }
    });
  };

  const updateQuantity = (serviceId, delta) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.service_id === serviceId);
      if (!existingItem) return prevCart;
      
      const newQuantity = existingItem.quantity + delta;
      
      if (newQuantity <= 0) {
        return prevCart.filter(item => item.service_id !== serviceId);
      } else {
        return prevCart.map(item =>
          item.service_id === serviceId 
            ? { ...item, quantity: newQuantity } 
            : item
        );
      }
    });
  };

  const removeFromCart = (serviceId) => {
    setCart(prevCart => prevCart.filter(item => item.service_id !== serviceId));
  };

  const addImageToCartItem = (serviceId, file, blobUrl, imageBase64) => {
    setCart(prevCart =>
      prevCart.map(item =>
        item.service_id === serviceId 
          ? { 
              ...item, 
              imageBase64: imageBase64
            }
          : item
      )
    );
  };

  const removeImageFromCartItem = (serviceId) => {
    setCart(prevCart =>
      prevCart.map(item =>
        item.service_id === serviceId 
          ? { ...item, imageBase64: null }
          : item
      )
    );
  };

  const hasImage = (serviceId) => {
    const item = cart.find(item => item.service_id === serviceId);  
    return !!(item && item.imageBase64);
  };

  const getImageBase64 = (serviceId) => {
    const item = cart.find(item => item.service_id === serviceId);
    return item?.imageBase64 || null;
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem('cart');
    // You might also want to clear voucher validation state
    localStorage.removeItem('voucher_validation');
  };

  const getCartItemCount = () => {
    if (!Array.isArray(cart)) return 0;
    return cart.reduce((total, item) => total + (item.quantity || 0), 0);
  };

  const getCartTotal = () => {
    if (!Array.isArray(cart)) return 0;
    return cart.reduce((total, item) => {
      return total + ((item.unit_price || 0) * (item.quantity || 0));
    }, 0);
  };

  // Add this to your CartContext functions
  const getVoucherItems = () => {
    if (!Array.isArray(cart)) return [];
    return cart.filter(item => item.is_voucher_redeem === true);
  };

  const getNonVoucherItems = () => {
    if (!Array.isArray(cart)) return [];
    return cart.filter(item => !item.is_voucher_redeem);
  };

  const hasValidVouchers = () => {
    const voucherItems = getVoucherItems();
    return voucherItems.length > 0 && voucherItems.every(item => item.voucher_code);
  };

  const removeVoucherItem = (voucherCode) => {
    setCart(prevCart => 
      prevCart.filter(item => item.voucher_code !== voucherCode)
    );
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        addImageToCartItem,
        removeImageFromCartItem,
        hasImage,
        getImageBase64,
        getCartItemCount,
        getCartTotal,
        // New functions
        getVoucherItems,
        getNonVoucherItems,
        hasValidVouchers,
        removeVoucherItem
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export default CartProvider;