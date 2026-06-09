// src/context/CartContext.jsx
import React, {
  createContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  useContext,
} from "react";
import { AuthContext } from "../context/AuthContext";
import { toast } from "react-toastify";
import api from "../api";
import { trackEvent } from "../utils/analytics";
export const CartContext = createContext();

const emptyCart = {
  id: null,
  items: [],
  total: 0,
  item_count: 0,
  currency: "GHS",
};

export const CartProvider = ({ children }) => {
  const { isAuthenticated, isPartner } = useContext(AuthContext);
  const [cartData, setCartData] = useState(emptyCart);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState(null);

  // cartRef always holds the latest server-confirmed cart state.
  const cartRef = useRef(cartData);
  const initialLoadDone = useRef(false);
  const loadingRef = useRef(false);

  const setCart = useCallback((data) => {
    cartRef.current = data;
    setCartData(data);
  }, []);

  // ─── Load cart from server ───────────────────────────────────────────────
  const loadCart = useCallback(async () => {
    // Skip cart loading for partners
    if (isPartner) {
      console.log("[CartContext] Partner account - skipping cart loading");
      setCart(emptyCart);
      return emptyCart;
    }

    if (loadingRef.current) {
      console.log("[CartContext] Load already in progress, skipping");
      return cartRef.current;
    }

    loadingRef.current = true;
    console.log("[CartContext] Loading cart…");

    try {
      const response = await api.get("/api/cart/");
      if (response.data) {
        setCart(response.data);
        setError(null);
      }
      return response.data;
    } catch (err) {
      console.error("[CartContext] Cart load error:", err);
      setError(err.message);
      return null;
    } finally {
      loadingRef.current = false;
    }
  }, [setCart, isPartner]);

  // ─── Initial load on mount ───────────────────────────────────────────────
  useEffect(() => {
    if (initialLoadDone.current) return;
    initialLoadDone.current = true;

    console.log("[CartContext] Initial load starting…");
    setLoading(true);
    loadCart()
      .then(() => {
        console.log("[CartContext] Initial load complete");
        setInitialized(true);
      })
      .catch(() => {
        setInitialized(true);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [loadCart]);

  // ─── Reload on auth change ───────────────────────────────────────────────
  useEffect(() => {
    if (!initialized) return;
    console.log("[CartContext] Auth changed, reloading cart");
    loadCart();
  }, [isAuthenticated, initialized, isPartner, loadCart]);

  // ─── addToCart ───────────────────────────────────────────────────────────
  const addToCart = useCallback(
    async (serviceId, quantity = 1, serviceData = null) => {
      // Skip for partners
      if (isPartner) {
        console.log("[CartContext] Partner account - cannot add to cart");
        toast.info("Partners order directly from wholesale catalog", {
          position: "top-right",
          autoClose: 3000,
        });
        return null;
      }

      const currentCart = cartRef.current;

      // Optimistic update for instant UI feedback
      if (serviceData && currentCart) {
        const existingIndex = currentCart.items.findIndex(
          (item) =>
            item.service_id === serviceId || item.service?.id === serviceId
        );

        if (existingIndex >= 0) {
          const updatedItems = [...currentCart.items];
          updatedItems[existingIndex] = {
            ...updatedItems[existingIndex],
            quantity: updatedItems[existingIndex].quantity + quantity,
          };
          setCartData({
            ...currentCart,
            items: updatedItems,
            item_count: currentCart.item_count + quantity,
            total: currentCart.total + serviceData.price * quantity,
          });
        } else {
          const tempItem = {
            id: `temp-${Date.now()}`,
            service_id: serviceId,
            service: serviceData,
            quantity,
            unit_price: serviceData.price,
            total: serviceData.price * quantity,
          };
          setCartData({
            ...currentCart,
            items: [...currentCart.items, tempItem],
            item_count: currentCart.item_count + quantity,
            total: currentCart.total + serviceData.price * quantity,
          });
        }
      }

      try {
        const response = await api.post("/api/cart/add/", {
          service_id: serviceId,
          quantity,
        });
        setCart(response.data);
        if (serviceData) {
          trackEvent("add_to_cart", {
            currency: "GHS",
            value: serviceData.price * quantity,
            items: [
              {
                item_id: String(serviceId),
                item_name: serviceData.name,
                item_category:
                  serviceData.service_type || "Cleaning",
                price: serviceData.price,
                quantity,
              },
            ],
          });
        }
        return response.data;
      } catch (error) {
        console.error("Add to cart failed:", error);
        await loadCart();
        throw error;
      }
    },
    [loadCart, setCart, isPartner]
  );

  // ─── updateQuantity ──────────────────────────────────────────────────────
  const updateQuantity = useCallback(
    async (itemId, newQuantity) => {
      // Skip for partners
      if (isPartner) {
        console.log("[CartContext] Partner account - cannot update cart");
        return;
      }

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
        cartRef.current = {
          ...cartRef.current,
          items:
            newQuantity <= 0
              ? cartRef.current.items.filter((i) => i.id !== itemId)
              : cartRef.current.items.map((i) =>
                  i.id === itemId ? { ...i, quantity: newQuantity } : i
                ),
          total: newTotal,
        };
      } catch (error) {
        console.error("Quantity update failed:", error);
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
        await loadCart();
      }
    },
    [loadCart, isPartner]
  );

  // ─── removeFromCart ──────────────────────────────────────────────────────
  const removeFromCart = useCallback(
    async (itemId) => {
      // Skip for partners
      if (isPartner) {
        console.log("[CartContext] Partner account - cannot remove from cart");
        return;
      }

      const currentCart = cartRef.current;
      const itemToRemove = currentCart.items.find((item) => item.id === itemId);
      if (!itemToRemove) return;

      const updatedItems = currentCart.items.filter((item) => item.id !== itemId);
      const newTotal = Math.max(
        0,
        currentCart.total - itemToRemove.unit_price * itemToRemove.quantity
      );
      const newCount = currentCart.item_count - itemToRemove.quantity;

      const optimistic = {
        ...currentCart,
        items: updatedItems,
        total: newTotal,
        item_count: newCount,
      };
      setCartData(optimistic);

      try {
        await api.delete(`/api/cart/items/${itemId}/`);
        cartRef.current = optimistic;
      } catch (error) {
        console.error("Remove from cart failed:", error);
        setCartData(currentCart);
      }
    },
    [isPartner]
  );

  // ─── clearCart ───────────────────────────────────────────────────────────
  const clearCart = useCallback(async () => {
    // Skip for partners
    if (isPartner) {
      console.log("[CartContext] Partner account - cannot clear cart");
      return;
    }

    await api.post("/api/cart/clear/");
    setCart(emptyCart);
  }, [setCart, isPartner]);

  // ─── Image actions ───────────────────────────────────────────────────────
  const addImageToCartItem = useCallback(
    async (itemId, imageBase64) => {
      // Skip for partners
      if (isPartner) {
        console.log("[CartContext] Partner account - cannot add image to cart");
        return;
      }

      await api.post(`/api/cart/items/${itemId}/add-image/`, {
        image_base64: imageBase64,
      });
      await loadCart();
    },
    [loadCart, isPartner]
  );

  const removeImageFromCartItem = useCallback(
    async (itemId) => {
      // Skip for partners
      if (isPartner) {
        console.log("[CartContext] Partner account - cannot remove image from cart");
        return;
      }

      await api.delete(`/api/cart/items/${itemId}/remove-image/`);
      await loadCart();
    },
    [loadCart, isPartner]
  );

  // ─── mergeGuestCart ──────────────────────────────────────────────────────
  const mergeGuestCart = useCallback(
    async (guestCartId = null) => {
      if (!isAuthenticated) return null;
      
      // Skip for partners
      if (isPartner) {
        console.log("[CartContext] Partner account - skipping cart merge");
        return null;
      }
      
      const payload = guestCartId ? { guest_cart_id: guestCartId } : {};
      const response = await api.post("/api/cart/merge-guest/", payload);
      await loadCart();
      return response.data;
    },
    [loadCart, isAuthenticated, isPartner]
  );

  // ─── refreshCart ─────────────────────────────────────────────────────────
  const refreshCart = useCallback(() => {
    if (isPartner) {
      console.log("[CartContext] Partner account - skipping cart refresh");
      return Promise.resolve(emptyCart);
    }
    return loadCart();
  }, [loadCart, isPartner]);

  // ─── Helper functions ────────────────────────────────────────────────────
  const getCartItemCount = useCallback(() => {
    if (isPartner) return 0;
    return cartData.item_count || 0;
  }, [cartData.item_count, isPartner]);

  const getCartTotal = useCallback(() => {
    if (isPartner) return 0;
    return cartData.total || 0;
  }, [cartData.total, isPartner]);

  const hasImage = useCallback(
    (itemId) => {
      if (isPartner) return false;
      return !!cartRef.current.items.find((i) => i.id === itemId)?.image_base64;
    },
    [isPartner]
  );

  const getImageBase64 = useCallback(
    (itemId) => {
      if (isPartner) return null;
      return cartRef.current.items.find((i) => i.id === itemId)?.image_base64 || null;
    },
    [isPartner]
  );

  // ─── Context value ───────────────────────────────────────────────────────
  const value = {
    cart: isPartner ? [] : cartData.items,
    cartMeta: isPartner ? emptyCart : cartData,
    loading: isPartner ? false : loading,
    initialized,
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

  return (
    <CartContext.Provider value={value}>{children}</CartContext.Provider>
  );
};

export default CartProvider;