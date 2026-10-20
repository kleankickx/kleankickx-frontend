// src/context/CartContext.jsx
import React, {
  createContext, useState, useEffect, useCallback, useRef, useContext,
} from "react";
import { AuthContext } from "../context/AuthContext";
import { toast } from "react-toastify";
import api from "../api";
import { trackEvent } from "../utils/analytics";

export const CartContext = createContext();

const emptyCart = {
  id: null, items: [], total: 0, item_count: 0, currency: "GHS",
};

export const CartProvider = ({ children }) => {
  const { isAuthenticated, isPartner } = useContext(AuthContext);
  const [cartData, setCartData] = useState(emptyCart);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState(null);

  const cartRef = useRef(cartData);
  const initialLoadDone = useRef(false);
  const loadingRef = useRef(false);

  const setCart = useCallback((data) => {
    cartRef.current = data;
    setCartData(data);
  }, []);

  const loadCart = useCallback(async () => {
    if (isPartner) {
      setCart(emptyCart);
      return emptyCart;
    }
    if (loadingRef.current) return cartRef.current;
    loadingRef.current = true;
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

  useEffect(() => {
    if (initialLoadDone.current) return;
    initialLoadDone.current = true;
    setLoading(true);
    loadCart()
      .then(() => setInitialized(true))
      .catch(() => setInitialized(true))
      .finally(() => setLoading(false));
  }, [loadCart]);

  useEffect(() => {
    if (!initialized) return;
    loadCart();
  }, [isAuthenticated, initialized, isPartner, loadCart]);

  // ─── addToCart ─────────────────────────────────────────────────────────
  // Signature: addToCart(serviceId, quantity = 1, serviceData = null)
  // serviceData may include voucher fields.
  const addToCart = useCallback(
    async (serviceId, quantity = 1, serviceData = null) => {
      if (isPartner) {
        toast.info("Partners order directly from wholesale catalog", {
          position: "top-right", autoClose: 3000,
        });
        return null;
      }

      // Defensive: catch legacy 5-arg callers
      if (typeof quantity === "string" && isNaN(Number(quantity))) {
        console.error(
          "[CartContext.addToCart] quantity is a non-numeric string:",
          quantity,
          "— correct signature is addToCart(serviceId, quantity, serviceData)"
        );
        throw new Error("addToCart called with wrong arguments");
      }

      const qty = Math.max(1, parseInt(quantity, 10) || 1);
      const currentCart = cartRef.current;

      // Guard duplicate voucher in cart
      if (serviceData?.is_voucher_redeem && serviceData?.voucher_code) {
        const alreadyInCart = (currentCart.items || []).some(
          (item) =>
            item.is_voucher_redeem &&
            item.voucher_code === serviceData.voucher_code
        );
        if (alreadyInCart) {
          toast.info("This voucher is already in your cart");
          return currentCart;
        }
      }

      // Optimistic UI
      if (serviceData && currentCart) {
        const existingIndex = (currentCart.items || []).findIndex(
          (item) =>
            item.service_id === serviceId ||
            item.service?.id === serviceId ||
            item.service === serviceId
        );

        const price = Number(serviceData.price) || 0;

        if (existingIndex >= 0) {
          const updatedItems = [...currentCart.items];
          updatedItems[existingIndex] = {
            ...updatedItems[existingIndex],
            quantity: updatedItems[existingIndex].quantity + qty,
          };
          setCartData({
            ...currentCart,
            items: updatedItems,
            item_count: (currentCart.item_count || 0) + qty,
            total: (currentCart.total || 0) + price * qty,
          });
        } else {
          const tempItem = {
            id: `temp-${Date.now()}`,
            service_id: serviceId,
            service: serviceData,
            service_name: serviceData.name,
            quantity: qty,
            unit_price: price,
            total: price * qty,
            is_voucher_redeem: !!serviceData.is_voucher_redeem,
            voucher_code: serviceData.voucher_code,
            voucher_id: serviceData.voucher_id,
            voucher_value: serviceData.voucher_value,
            original_price: serviceData.original_price,
          };
          setCartData({
            ...currentCart,
            items: [...(currentCart.items || []), tempItem],
            item_count: (currentCart.item_count || 0) + qty,
            total: (currentCart.total || 0) + price * qty,
          });
        }
      }

      try {
        const payload = { service_id: serviceId, quantity: qty };

        // Forward voucher metadata to the backend
        if (serviceData?.is_voucher_redeem) {
          payload.is_voucher_redeem = true;
          payload.voucher_code = serviceData.voucher_code;
          payload.voucher_id = serviceData.voucher_id;
          if (serviceData.voucher_value != null) {
            payload.voucher_value = serviceData.voucher_value;
          }
          if (serviceData.original_price != null) {
            payload.original_price = serviceData.original_price;
          }
        }

        const response = await api.post("/api/cart/add/", payload);
        setCart(response.data);

        if (serviceData) {
          trackEvent("add_to_cart", {
            currency: "GHS",
            value: (Number(serviceData.price) || 0) * qty,
            items: [{
              item_id: String(serviceId),
              item_name: serviceData.name || "Service",
              item_category: serviceData.service_type || "Cleaning",
              price: Number(serviceData.price) || 0,
              quantity: qty,
            }],
          });
        }
        return response.data;
      } catch (err) {
        console.error("Add to cart failed:", err);
        await loadCart();
        throw err;
      }
    },
    [loadCart, setCart, isPartner]
  );

  const updateQuantity = useCallback(
    async (itemId, newQuantity) => {
      if (isPartner) return;
      const currentCart = cartRef.current;
      const itemIndex = (currentCart.items || []).findIndex((i) => i.id === itemId);
      if (itemIndex === -1) return;

      const oldItem = currentCart.items[itemIndex];
      // Voucher items are always free — don't change price
      const pricePerItem = oldItem.is_voucher_redeem
        ? 0
        : oldItem.unit_price || (oldItem.total || 0) / (oldItem.quantity || 1);
      const oldQuantity = oldItem.quantity;
      const oldTotal = currentCart.total;
      const quantityDiff = newQuantity - oldQuantity;
      const newTotal = Math.max(0, oldTotal + quantityDiff * pricePerItem);

      setCartData((prev) => {
        const updatedItems = [...prev.items];
        if (newQuantity <= 0) updatedItems.splice(itemIndex, 1);
        else updatedItems[itemIndex] = { ...oldItem, quantity: newQuantity };
        return {
          ...prev,
          items: updatedItems,
          total: newTotal,
          item_count: updatedItems.reduce((s, i) => s + i.quantity, 0),
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
          items: newQuantity <= 0
            ? cartRef.current.items.filter((i) => i.id !== itemId)
            : cartRef.current.items.map((i) =>
                i.id === itemId ? { ...i, quantity: newQuantity } : i
              ),
          total: newTotal,
        };
      } catch (err) {
        console.error("Quantity update failed:", err);
        await loadCart();
      }
    },
    [loadCart, isPartner]
  );

  const removeFromCart = useCallback(
    async (itemId) => {
      if (isPartner) return;
      const currentCart = cartRef.current;
      const itemToRemove = currentCart.items.find((i) => i.id === itemId);
      if (!itemToRemove) return;

      const updatedItems = currentCart.items.filter((i) => i.id !== itemId);
      const lineTotal = itemToRemove.is_voucher_redeem
        ? 0
        : (Number(itemToRemove.unit_price) || 0) * itemToRemove.quantity;
      const newTotal = Math.max(0, currentCart.total - lineTotal);
      const newCount = currentCart.item_count - itemToRemove.quantity;

      const optimistic = {
        ...currentCart, items: updatedItems, total: newTotal, item_count: newCount,
      };
      setCartData(optimistic);

      try {
        await api.delete(`/api/cart/items/${itemId}/`);
        cartRef.current = optimistic;
      } catch (err) {
        console.error("Remove from cart failed:", err);
        setCartData(currentCart);
      }
    },
    [isPartner]
  );

  const clearCart = useCallback(async () => {
    if (isPartner) return;
    await api.post("/api/cart/clear/");
    setCart(emptyCart);
  }, [setCart, isPartner]);

  const addImageToCartItem = useCallback(
    async (itemId, imageBase64) => {
      if (isPartner) return;
      await api.post(`/api/cart/items/${itemId}/add-image/`, {
        image_base64: imageBase64,
      });
      await loadCart();
    },
    [loadCart, isPartner]
  );

  const removeImageFromCartItem = useCallback(
    async (itemId) => {
      if (isPartner) return;
      await api.delete(`/api/cart/items/${itemId}/remove-image/`);
      await loadCart();
    },
    [loadCart, isPartner]
  );

  const mergeGuestCart = useCallback(
    async (guestCartId = null) => {
      if (!isAuthenticated || isPartner) return null;
      const payload = guestCartId ? { guest_cart_id: guestCartId } : {};
      const response = await api.post("/api/cart/merge-guest/", payload);
      await loadCart();
      return response.data;
    },
    [loadCart, isAuthenticated, isPartner]
  );

  const refreshCart = useCallback(() => {
    if (isPartner) return Promise.resolve(emptyCart);
    return loadCart();
  }, [loadCart, isPartner]);

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

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export default CartProvider;