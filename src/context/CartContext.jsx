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

  const addToCart = (serviceId, serviceName, servicePrice, quantity = 1) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.service_id === serviceId);
      
      if (existingItem) {
        return prevCart.map(item =>
          item.service_id === serviceId
            ? { 
                ...item, 
                quantity: item.quantity + quantity,
                unit_price: servicePrice
              }
            : item
        );
      } else {
        return [...prevCart, { 
          service_id: serviceId, 
          quantity, 
          service_name: serviceName, 
          unit_price: servicePrice,
          imageBase64: null
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

  return (
    <CartContext.Provider
      value={{
        cart, // This is now guaranteed to be an array
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        addImageToCartItem,
        removeImageFromCartItem,
        hasImage,
        getImageBase64,
        getCartItemCount,
        getCartTotal
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export default CartProvider;