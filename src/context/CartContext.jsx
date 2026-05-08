// src/context/CartContext.jsx
import React, { createContext, useState, useEffect, useCallback, useRef, useContext } from 'react';
import { AuthContext } from './AuthContext';
import api from '../api';

export const CartContext = createContext();

const emptyCart = { id: null, items: [], total: 0, item_count: 0, currency: 'GHS' };

export const CartProvider = ({ children }) => {
  const { isAuthenticated } = useContext(AuthContext);
  const [cartData, setCartData] = useState(emptyCart);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState(null);

  const cartRef = useRef(cartData);
  const initialLoadDone = useRef(false);
  const loadingRef = useRef(false);

  useEffect(() => {
    cartRef.current = cartData;
  }, [cartData]);

  const loadCart = useCallback(async () => {
    // Prevent concurrent requests
    if (loadingRef.current) {
      console.log('[CartContext] Load already in progress, skipping');
      return cartRef.current;
    }
    
    loadingRef.current = true;
    console.log('[CartContext] Loading cart...');

    try {
      const response = await api.get('/api/cart/');
      console.log('[CartContext] Cart loaded:', response.data);
      if (response.data) {
        setCartData(response.data);
        cartRef.current = response.data;
        setError(null);
      }
      return response.data;
    } catch (err) {
      console.error('[CartContext] Cart load error:', err);
      setError(err.message);
      return null;
    } finally {
      loadingRef.current = false;
    }
  }, []);

  // Single initial load on mount
  useEffect(() => {
    if (initialLoadDone.current) return;
    initialLoadDone.current = true;
    
    console.log('[CartContext] Initial load starting...');
    setLoading(true);
    loadCart()
      .then(() => {
        console.log('[CartContext] Initial load complete');
        setInitialized(true);
      })
      .catch((err) => {
        console.error('[CartContext] Initial load failed:', err);
        setInitialized(true); // Still set initialized to true to avoid infinite skeleton
      })
      .finally(() => {
        setLoading(false);
      });
  }, [loadCart]);

  // Reload on auth change (login / logout) — only after initial load is done
  useEffect(() => {
    if (!initialized) return;
    console.log('[CartContext] Auth changed, reloading cart');
    loadCart();
  }, [isAuthenticated, initialized]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Cart Actions ───────────────────────────────────────────────────────────

  const updateQuantity = useCallback(async (itemId, newQuantity) => {
    const currentCart = cartRef.current;
    const itemIndex = currentCart.items.findIndex((item) => item.id === itemId);
    if (itemIndex === -1) return;

    const oldItem = currentCart.items[itemIndex];
    const oldQuantity = oldItem.quantity;
    const oldTotal = currentCart.total;
    const pricePerItem = oldItem.unit_price || oldItem.total / oldItem.quantity;
    const quantityDiff = newQuantity - oldQuantity;
    const newTotal = Math.max(0, oldTotal + quantityDiff * pricePerItem);

    // Optimistic update
    setCartData((prev) => {
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
      // Rollback on failure
      setCartData((prev) => {
        const revertedItems = [...prev.items];
        const idx = revertedItems.findIndex((i) => i.id === itemId);
        if (idx !== -1) {
          revertedItems[idx] = { ...oldItem, quantity: oldQuantity };
        } else {
          revertedItems.splice(itemIndex, 0, oldItem);
        }
        return {
          ...prev,
          items: revertedItems,
          total: oldTotal,
          item_count: revertedItems.reduce((sum, item) => sum + item.quantity, 0),
        };
      });
      await loadCart(); // Force sync with server after rollback
    }
  }, [loadCart]);

  // src/context/CartContext.jsx - Update addToCart function

  const addToCart = useCallback(async (serviceId, quantity = 1, serviceData = null) => {
    // Optimistic update for better UX
    const currentCart = cartRef.current;
    
    // If we have service data, optimistically update the UI
    if (serviceData && currentCart) {
      const existingItemIndex = currentCart.items.findIndex(
        item => item.service_id === serviceId || item.service?.id === serviceId
      );
      
      if (existingItemIndex >= 0) {
        // Update existing item quantity
        const updatedItems = [...currentCart.items];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: updatedItems[existingItemIndex].quantity + quantity
        };
        setCartData({
          ...currentCart,
          items: updatedItems,
          item_count: currentCart.item_count + quantity,
          total: currentCart.total + (serviceData.price * quantity)
        });
      } else {
        // Add new item
        const newItem = {
          id: `temp-${Date.now()}`,
          service_id: serviceId,
          service: serviceData,
          quantity: quantity,
          unit_price: serviceData.price,
          total: serviceData.price * quantity
        };
        setCartData({
          ...currentCart,
          items: [...currentCart.items, newItem],
          item_count: currentCart.item_count + quantity,
          total: currentCart.total + (serviceData.price * quantity)
        });
      }
    }
    
    try {
      const response = await api.post('/api/cart/add/', { 
        service_id: serviceId, 
        quantity 
      });
      
      // Update with server response
      setCartData(response.data);
      cartRef.current = response.data;
      
      return response.data;
    } catch (error) {
      console.error('Add to cart failed:', error);
      // Rollback on error
      await loadCart();
      throw error;
    }
  }, [api, loadCart]);


  const removeFromCart = useCallback(async (itemId) => {
    const currentCart = cartRef.current;
    const itemToRemove = currentCart.items.find(item => item.id === itemId);
    
    if (!itemToRemove) return;
    
    // Optimistic update - remove item immediately from UI
    const updatedItems = currentCart.items.filter(item => item.id !== itemId);
    const newTotal = Math.max(0, currentCart.total - (itemToRemove.unit_price * itemToRemove.quantity));
    const newItemCount = currentCart.item_count - itemToRemove.quantity;
    
    // Update UI immediately
    setCartData({
      ...currentCart,
      items: updatedItems,
      total: newTotal,
      item_count: newItemCount
    });
    
    try {
      // Call backend
      await api.delete(`/api/cart/items/${itemId}/`);
    } catch (error) {
      console.error('Remove from cart failed:', error);
      // Rollback on error - restore the removed item
      setCartData({
        ...currentCart,
        items: [...currentCart.items],
        total: currentCart.total,
        item_count: currentCart.item_count
      });
      toast.error('Failed to remove item. Please try again.');
    }
  }, [api]);

  const clearCart = useCallback(async () => {
    await api.post('/api/cart/clear/');
    setCartData(emptyCart);
    cartRef.current = emptyCart;
  }, []);

  const addImageToCartItem = useCallback(async (itemId, imageBase64) => {
    await api.post(`/api/cart/items/${itemId}/add-image/`, { image_base64: imageBase64 });
    await loadCart();
  }, [loadCart]);

  const removeImageFromCartItem = useCallback(async (itemId) => {
    await api.delete(`/api/cart/items/${itemId}/remove-image/`);
    await loadCart();
  }, [loadCart]);

  const mergeGuestCart = useCallback(async (guestCartId = null) => {
    if (!isAuthenticated) return null;
    const payload = guestCartId ? { guest_cart_id: guestCartId } : {};
    const response = await api.post('/api/cart/merge-guest/', payload);
    await loadCart();
    return response.data;
  }, [loadCart, isAuthenticated]);

  const refreshCart = useCallback(() => loadCart(), [loadCart]);

  const getCartItemCount = useCallback(
    () => cartData.item_count || 0,
    [cartData.item_count]
  );

  const getCartTotal = useCallback(
    () => cartData.total || 0,
    [cartData.total]
  );

  const hasImage = useCallback(
    (itemId) => !!cartRef.current.items.find((i) => i.id === itemId)?.image_base64,
    []
  );

  const getImageBase64 = useCallback(
    (itemId) => cartRef.current.items.find((i) => i.id === itemId)?.image_base64 || null,
    []
  );

  // ─── Context Value ───────────────────────────────────────────────────────────

  const value = {
    cart: cartData.items,
    cartMeta: cartData,
    loading,
    initialized,  // ← EXPORT THIS!
    error,
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