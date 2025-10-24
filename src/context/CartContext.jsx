// src/context/CartContext.jsx
import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const CART_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

  const getInitialCart = () => {
    try {
      const storedCart = localStorage.getItem('cart');
      // console.log('getInitialCart: storedCart=', storedCart);
      if (!storedCart) {
        const initial = { items: [], timestamp: Date.now(), expired: false };
        // console.log('getInitialCart: No stored cart, returning', initial);
        return initial;
      }

      const parsedCart = JSON.parse(storedCart);
      // console.log('getInitialCart: parsedCart=', parsedCart);
      if (
        !parsedCart ||
        !Array.isArray(parsedCart.items) ||
        !Number.isInteger(parsedCart.timestamp)
      ) {
        const invalid = { items: [], timestamp: Date.now(), expired: false };
        // console.log('getInitialCart: Invalid cart structure, returning', invalid);
        return invalid;
      }

      if (Date.now() - parsedCart.timestamp > CART_EXPIRY_MS) {
        localStorage.removeItem('cart');
        const expired = { items: [], timestamp: Date.now(), expired: true };
        // console.log('getInitialCart: Cart expired, cleared localStorage, returning', expired);
        return expired;
      }

      const valid = { ...parsedCart, expired: false };
      // console.log('getInitialCart: Valid cart, returning', valid);
      return valid;
    } catch (err) {
      console.error('getInitialCart: Failed to parse cart from localStorage:', err);
      const errorFallback = { items: [], timestamp: Date.now(), expired: false };
      console.log('getInitialCart: Error, returning', errorFallback);
      return errorFallback;
    }
  };

  const initialCart = getInitialCart();
  const [cart, setCart] = useState(initialCart.items);
  const [cartExpired, setCartExpired] = useState(initialCart.expired);

  useEffect(() => {
    if (cartExpired) {
      toast.warn('Your cart has expired and been cleared.', {
        position: 'top-right',
        autoClose: 5000,
      });
      console.log('useEffect: Cart expired, toast shown');
      setCartExpired(false);
    }
  }, [cartExpired]);

  useEffect(() => {
    if (Array.isArray(cart)) {
      try {
        const newCartData = { items: cart, timestamp: Date.now() };
        localStorage.setItem('cart', JSON.stringify(newCartData));
        // console.log('useEffect: Saved cart to localStorage:', newCartData);
      } catch (err) {
        console.error('useEffect: Failed to save cart to localStorage:', err);
      }
    } else {
      console.warn('useEffect: Cart is not an array, skipping save:', cart);
    }
  }, [cart]);

  
  const addToCart = (serviceId, serviceName, servicePrice, quantity = 1) => {
    setCart(prevCart => {
      const safeCart = Array.isArray(prevCart) ? prevCart : [];
      const existingItem = safeCart.find(item => item.service_id === serviceId);
      let newCart;
      if (existingItem) {
        newCart = safeCart.map(item =>
          item.service_id === serviceId
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        newCart = [...safeCart, { service_id: serviceId, quantity: quantity, service_name: serviceName, price: servicePrice * quantity }];
      }
      // console.log('addToCart: Updated cart=', newCart);
      return newCart;
    });
  };

  const updateQuantity = (serviceId, delta) => {
    setCart(prevCart => {
      const safeCart = Array.isArray(prevCart) ? prevCart : [];
      const existingItem = safeCart.find(item => item.service_id === serviceId);
      if (!existingItem) {
        // console.log('updateQuantity: Item not found, no change');
        return safeCart;
      }
      const newQuantity = existingItem.quantity + delta;
      let newCart;
      if (newQuantity <= 0) {
        newCart = safeCart.filter(item => item.service_id !== serviceId);
      } else {
        newCart = safeCart.map(item =>
          item.service_id === serviceId ? { ...item, quantity: newQuantity } : item
        );
      }
      // console.log('updateQuantity: Updated cart=', newCart);
      return newCart;
    });
  };

  const removeFromCart = (serviceId) => {
    setCart(prevCart => {
      const safeCart = Array.isArray(prevCart) ? prevCart : [];
      const newCart = safeCart.filter(item => item.service_id !== serviceId);
      // console.log('removeFromCart: Updated cart=', newCart);
      return newCart;

    });
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem('cart');
    // console.log('clearCart: Cart cleared');
  };


  return (
    <CartContext.Provider
      value={{
        cart,
        cartExpired,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};


export default CartProvider;
