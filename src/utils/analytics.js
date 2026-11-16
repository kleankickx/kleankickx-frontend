// src/utils/analytics.js

export const trackEvent = (eventName, params = {}) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, params);
    if (import.meta.env.DEV) console.log(`GA4 Event: ${eventName}`, params);
  }
};

// Helper for purchase events
export const trackPurchase = (orderData) => {
  const { 
    transaction_id, 
    value, 
    currency = 'GHS', 
    items = [], 
    payment_type = 'paystack',
    tax = 0,
    shipping = 0,
    coupon = null
  } = orderData;

  // Validate required fields
  if (!transaction_id) {
    console.error('trackPurchase: transaction_id is required');
    return false;
  }
  
  if (!value || value <= 0) {
    console.error('trackPurchase: valid value is required');
    return false;
  }

  if (!items || items.length === 0) {
    console.error('trackPurchase: items array is required');
    return false;
  }

  const purchaseParams = {
    transaction_id: String(transaction_id),
    value: parseFloat(value),
    currency,
    tax: parseFloat(tax),
    shipping: parseFloat(shipping),
    payment_type,
    items: items.map(item => ({
      item_id: String(item.item_id || item.service_id || item.id),
      item_name: item.item_name || item.service_name || item.name,
      item_category: item.item_category || item.category || 'Cleaning',
      price: parseFloat(item.price || item.unit_price),
      quantity: parseInt(item.quantity) || 1,
    })),
  };

  if (coupon) {
    purchaseParams.coupon = coupon;
  }

  trackEvent('purchase', { ...purchaseParams, transport_type: 'beacon' });
  return true;
};

// Helper for begin_checkout
export const trackBeginCheckout = (cart, total, coupon = null) => {
  if (!cart || cart.length === 0) return;
  
  trackEvent('begin_checkout', {
    currency: 'GHS',
    value: parseFloat(total),
    coupon: coupon || undefined,
    items: cart.map(item => ({
      item_id: String(item.service_id || item.service || item.id),
      item_name: item.service_name || item.name,
      item_category: item.service_type || 'Cleaning',
      price: parseFloat(item.unit_price || item.price),
      quantity: parseInt(item.quantity) || 1,
    })),
  });
};

// Helper for add_to_cart (already exists but ensure it has items)
export const trackAddToCart = (item, quantity = 1) => {
  trackEvent('add_to_cart', {
    currency: 'GHS',
    value: parseFloat(item.unit_price) * quantity,
    items: [{
      item_id: String(item.service_id || item.id),
      item_name: item.service_name || item.name,
      item_category: item.service_type || 'Cleaning',
      price: parseFloat(item.unit_price),
      quantity: parseInt(quantity),
    }],
  });
};
// ---------------------------------------------------------------------------
// Paid-order tracking, shared by the Paystack return page (/payment/:status/:ref)
// and the order page (/orders/:ref).
// - Fires once per order per browser (localStorage, survives new sessions).
// - Paid orders send `purchase`; free orders (e.g. the free first Standard Klean)
//   send `claim_free_klean`, because GA4 drops ₵0 revenue and they would vanish.
// - Uses the beacon transport so the hit still leaves if the tab closes.
// ---------------------------------------------------------------------------
// payment_status comes from the API: SUCCESS = paid, COVERED = nothing to pay (free Klean,
// vouchers). Order status alone isn't enough: unpaid cash / MoMo Pay orders created by
// staff are PROCESSING too, and must not count as revenue.
const PAID = (order) =>
  order &&
  order.status !== 'CANCELLED' &&
  (order.payment_status === 'SUCCESS' || order.payment_status === 'COVERED');

const alreadySent = (ref) => {
  try { return localStorage.getItem(`ga4_purchase_${ref}`) === '1'; } catch { return false; }
};
const markSent = (ref) => {
  try { localStorage.setItem(`ga4_purchase_${ref}`, '1'); } catch { /* storage blocked */ }
};

export const trackOrderPurchase = (order, source = 'order_page') => {
  if (!PAID(order) || !order.reference_code) return false;
  if (typeof window === 'undefined' || !window.gtag) return false;
  if (alreadySent(order.reference_code)) return false;

  const items = (order.items || []).map((item) => ({
    item_id: String(item.service?.id || item.service_id || item.id),
    item_name: item.service?.name || item.service_name || item.name,
    item_category: item.service?.service_type || item.service_type || 'Cleaning',
    price: parseFloat(item.unit_price || item.price || 0),
    quantity: parseInt(item.quantity) || 1,
  }));

  let coupon = null;
  const promo = (order.discounts_applied || []).find((d) => d.type === 'promotion');
  if (promo) coupon = promo.promotion_code;

  const value = parseFloat(order.total_amount ?? order.total ?? 0) || 0;
  const shipping = (parseFloat(order.delivery_cost) || 0) + (parseFloat(order.pickup_cost) || 0);

  if (value <= 0) {
    trackEvent('claim_free_klean', {
      transaction_id: String(order.reference_code),
      currency: 'GHS',
      value: 0,
      items,
      source,
      transport_type: 'beacon',
    });
    markSent(order.reference_code);
    return true;
  }

  const ok = trackPurchase({
    transaction_id: order.reference_code,
    value,
    currency: 'GHS',
    items: items.length ? items : [{ item_id: 'order', item_name: 'KleanKickx order', price: value, quantity: 1 }],
    payment_type: order.payment_method || 'paystack',
    shipping,
    coupon,
  });
  if (ok) markSent(order.reference_code);
  return ok;
};
