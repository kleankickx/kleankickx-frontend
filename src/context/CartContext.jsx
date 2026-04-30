// src/context/CartContext.jsx - Simplified
import React, { createContext, useState, useEffect, useCallback, useRef, useContext } from 'react';
import { AuthContext } from './AuthContext';
import api from '../api';

export const CartContext = createContext();

const emptyCart = { id: null, items: [], total: 0, item_count: 0, currency: 'GHS' };

export const CartProvider = ({ children }) => {
  const { user, isAuthenticated } = useContext(AuthContext);
  const [cartData, setCartData] = useState(emptyCart);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  const cartRef = useRef(cartData);
  const initialLoadDone = useRef(false);

  useEffect(() => {
    cartRef.current = cartData;
  }, [cartData]);

  const loadCart = useCallback(async () => {
    try {
      const response = await api.get('/api/cart/');
      if (response.data) {
        setCartData(response.data);
      }
      return response.data;
    } catch (err) {
      console.error('Cart load error:', err);
      return null;
    }
  }, []);

  // Single initial load
  useEffect(() => {
    if (!initialLoadDone.current) {
      initialLoadDone.current = true;
      setLoading(true);
      loadCart().finally(() => {
        setLoading(false);
        setInitialized(true);
      });
    }
  }, [loadCart]);

  // Only reload on auth change (login/logout)
  useEffect(() => {
    if (initialized) {
      loadCart();
    }
  }, [isAuthenticated, user, loadCart, initialized]);

  const updateQuantity = useCallback(async (itemId, newQuantity) => {
    const currentCart = cartRef.current;
    const itemIndex = currentCart.items.findIndex(item => item.id === itemId);
    if (itemIndex === -1) return;

    const oldItem = currentCart.items[itemIndex];
    const oldQuantity = oldItem.quantity;
    const oldTotal = currentCart.total;
    const pricePerItem = oldItem.unit_price || (oldItem.total / oldItem.quantity);
    const quantityDiff = newQuantity - oldQuantity;
    const newTotal = Math.max(0, oldTotal + (quantityDiff * pricePerItem));

    // Optimistic update
    setCartData(prev => {
      const updatedItems = [...prev.items];
      if (newQuantity <= 0) {
        updatedItems.splice(itemIndex, 1);
      } else {
        updatedItems[itemIndex] = { ...oldItem, quantity: newQuantity };
      }
      return {
        ...prev,
        items: updatedItems,
        total: newTotal,
        item_count: updatedItems.reduce((sum, item) => sum + item.quantity, 0),
      };
    });

    try {
      if (newQuantity <= 0) {
        await api.delete(`/api/cart/items/${itemId}/`);
      } else {
        await api.put(`/api/cart/items/${itemId}/`, { quantity: newQuantity });
      }
    } catch (error) {
      console.error('Quantity update failed:', error);
      // Rollback
      setCartData(prev => {
        const revertedItems = [...prev.items];
        if (oldQuantity <= 0) {
          revertedItems.splice(itemIndex, 0, oldItem);
        } else {
          revertedItems[itemIndex] = { ...oldItem, quantity: oldQuantity };
        }
        return {
          ...prev,
          items: revertedItems,
          total: oldTotal,
          item_count: revertedItems.reduce((sum, item) => sum + item.quantity, 0),
        };
      });
      await loadCart(); // Force refresh on error
    }
  }, [api, loadCart]);

  const addToCart = useCallback(async (serviceId, quantity = 1) => {
    await api.post('/api/cart/add/', { service_id: serviceId, quantity });
    await loadCart();
  }, [api, loadCart]);

  const removeFromCart = useCallback(async (itemId) => {
    await api.delete(`/api/cart/items/${itemId}/`);
    await loadCart();
  }, [api, loadCart]);

  const clearCart = useCallback(async () => {
    await api.post('/api/cart/clear/');
    setCartData(emptyCart);
  }, [api]);

  const addImageToCartItem = useCallback(async (itemId, imageBase64) => {
    await api.post(`/api/cart/items/${itemId}/add-image/`, { image_base64: imageBase64 });
    await loadCart();
  }, [api, loadCart]);

  const removeImageFromCartItem = useCallback(async (itemId) => {
    await api.delete(`/api/cart/items/${itemId}/remove-image/`);
    await loadCart();
  }, [api, loadCart]);

  const mergeGuestCart = useCallback(async (guestCartId = null) => {
    if (!isAuthenticated) return null;
    const payload = guestCartId ? { guest_cart_id: guestCartId } : {};
    const response = await api.post('/api/cart/merge-guest/', payload);
    await loadCart();
    return response.data;
  }, [api, loadCart, isAuthenticated]);

  const refreshCart = useCallback(() => loadCart(), [loadCart]);
  const getCartItemCount = useCallback(() => cartData.item_count || 0, [cartData]);
  const getCartTotal = useCallback(() => cartData.total || 0, [cartData]);
  
  const hasImage = useCallback((itemId) =>
    !!cartRef.current.items.find(i => i.id === itemId)?.image_base64, []
  );

  const getImageBase64 = useCallback((itemId) =>
    cartRef.current.items.find(i => i.id === itemId)?.image_base64 || null, []
  );

  const value = {
    cart: cartData.items,
    cartMeta: cartData,
    loading,
    getCartItemCount,
    getCartTotal,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    addImageToCartItem,
    removeImageFromCartItem,
    mergeGuestCart,
    refreshCart,
    hasImage,
    getImageBase64,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export default CartProvider;