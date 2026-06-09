// src/utils/analytics.js

export const trackEvent = (eventName, params = {}) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, params);
    console.log(`GA4 Event: ${eventName}`, params);
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

  trackEvent('purchase', purchaseParams);
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