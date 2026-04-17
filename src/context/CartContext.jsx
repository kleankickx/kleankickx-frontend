// src/context/CartContext.jsx
import React, { createContext, useState, useEffect, useCallback, useRef, useContext } from 'react';
import { AuthContext } from './AuthContext';
import api from '../api';

export const CartContext = createContext();

const emptyCart = { id: null, items: [], total: 0, item_count: 0, currency: 'GHS' };

export const CartProvider = ({ children }) => {
  const { user, isAuthenticated } = useContext(AuthContext);
  const [cartData, setCartData] = useState(emptyCart);
  const [loading, setLoading] = useState(true);

  const cartRef = useRef(cartData);           // For quick read in callbacks
  const isMounted = useRef(true);
  const loadPromiseRef = useRef(null);

  useEffect(() => {
    cartRef.current = cartData;
  }, [cartData]);

  const loadCart = useCallback(async () => {
    if (!isMounted.current) return;

    if (loadPromiseRef.current) return loadPromiseRef.current;

    setLoading(true);
    loadPromiseRef.current = (async () => {
      try {
        const response = await api.get('/api/cart/');
        if (isMounted.current) {
          setCartData(response.data);
        }
        return response.data;
      } catch (err) {
        console.error('Cart load error:', err);
      } finally {
        if (isMounted.current) {
          setLoading(false);
          loadPromiseRef.current = null;
        }
      }
    })();

    return loadPromiseRef.current;
  }, [api]);

  // Initial load + auth change
  useEffect(() => {
    isMounted.current = true;
    loadCart();
    return () => { isMounted.current = false; };
  }, [loadCart]);

  useEffect(() => {
    if (user !== undefined) loadCart();
  }, [isAuthenticated, user, loadCart]);

  // ==================== OPTIMISTIC QUANTITY UPDATE ====================
  const updateQuantity = useCallback(async (itemId, newQuantity) => {
    const currentCart = cartRef.current;
    const itemIndex = currentCart.items.findIndex(item => item.id === itemId);

    if (itemIndex === -1) return;

    const oldItem = currentCart.items[itemIndex];
    const oldQuantity = oldItem.quantity;
    const oldTotal = currentCart.total;

    // Calculate optimistic new total
    const pricePerItem = oldItem.unit_price || (oldItem.total / oldItem.quantity);
    const quantityDiff = newQuantity - oldQuantity;
    const newTotal = Math.max(0, oldTotal + (quantityDiff * pricePerItem));

    // 1. Optimistically update UI immediately
    setCartData(prev => {
      const updatedItems = [...prev.items];
      if (newQuantity <= 0) {
        // Remove item
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
      // 2. Call the backend
      if (newQuantity <= 0) {
        await api.delete(`/api/cart/items/${itemId}/`);
      } else {
        await api.put(`/api/cart/items/${itemId}/`, { quantity: newQuantity });
      }

      // Optional: light refresh to sync any server-side changes (e.g. sync_token)
      // await loadCart();   // Uncomment if you want full server sync after success

    } catch (error) {
      console.error('Quantity update failed:', error);

      // 3. Rollback on error
      setCartData(prev => {
        const revertedItems = [...prev.items];
        if (oldQuantity <= 0) {
          // Re-add the item if it was removed
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

      // Optional: show toast/notification to user
      if (typeof toast !== 'undefined') {
        toast.error("Failed to update quantity. Please try again.");
      }
    }
  }, [api]);

  // Other operations remain mostly the same (you can make addToCart optimistic too later)
  const addToCart = useCallback(async (serviceId, quantity = 1) => {
    await api.post('/api/cart/add/', { service_id: serviceId, quantity });
    await loadCart();
  }, [api, loadCart]);

  const removeFromCart = useCallback(async (itemId) => {
    await api.delete(`/api/cart/items/${itemId}/`);  // ← Fixed: backticks
    await loadCart();
  }, [api, loadCart]);

  const clearCart = useCallback(async () => {
    await api.post('/api/cart/clear/');
    setCartData(emptyCart);
  }, [api]);

  const addImageToCartItem = useCallback(async (itemId, imageBase64) => {
    await api.post(`/api/cart/items/${itemId}/add-image/`, { image_base64: imageBase64 });  // ← Fixed: backticks
    await loadCart();
  }, [api, loadCart]);

  const removeImageFromCartItem = useCallback(async (itemId) => {
    await api.delete(`/api/cart/items/${itemId}/remove-image/`);  // ← Fixed: backticks
    await loadCart();
  }, [api, loadCart]);

  const mergeGuestCart = useCallback(async (guestCartId = null) => {
    if (!isAuthenticated) return null;

    // ← NEW: Send explicit guest cart ID when available (most reliable)
    const payload = guestCartId ? { guest_cart_id: guestCartId } : {};

    const response = await api.post('/api/cart/merge-guest/', payload);
    await loadCart();           // Refresh UI with merged cart
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
    updateQuantity,        // ← Now super fast with optimistic update
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