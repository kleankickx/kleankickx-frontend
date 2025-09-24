// src/config/checkoutConfig.js
export const CHECKOUT_CONFIG = {
  retryAttempts: 3,
  retryDelay: 1000,
  paymentTimeout: 30000,
  maps: {
    defaultZoom: 12,
    selectedZoom: 16,
    gestureHandling: 'greedy'
  }
};

export const DISCOUNT_TYPES = {
  SIGNUP: 'signup',
  REFERRAL: 'referral',
  REDEEMED_POINTS: 'redeemed_points',
  PROMOTION: 'promotion'
};

export const STORAGE_KEYS = {
  DELIVERY_LOCATION: 'deliveryLocation',
  PICKUP_LOCATION: 'pickupLocation',
  DELIVERY_INPUT: 'deliveryInputValue',
  PICKUP_INPUT: 'pickupInputValue',
  DELIVERY_REGION: 'deliveryRegion',
  PICKUP_REGION: 'pickupRegion',
  CHECKOUT_ALERT: 'hasSeenCheckoutAlert'
};