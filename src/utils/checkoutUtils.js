// src/utils/checkoutUtils.js
import { toast } from 'react-toastify';

// Constants
export const MAP_CONTAINER_STYLE = { 
  width: '100%', 
  height: '300px', 
  borderRadius: '12px' 
};

export const DEFAULT_CENTER = { 
  lat: 5.6037, 
  lng: -0.1870 
}; // Accra coordinates

// Phone validation
export const validateGhanaPhone = (number) => {
  const cleaned = number.replace(/\D/g, '');
  const ghanaRegex = /^(233|0)?(20|24|25|26|27|28|29|30|50|54|55|56|57|59)[0-9]{7}$/;
  return ghanaRegex.test(cleaned);
};

// Local storage helpers
export const getLocationFromStorage = (key) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
};

export const persistToStorage = (key, value) => {
  try {
    if (value === null || value === undefined) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, typeof value === 'object' ? JSON.stringify(value) : value);
    }
  } catch (error) {
    console.error('Error persisting to storage:', error);
  }
};

// Location detection
export const detectUserLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation not supported"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => resolve({
        lat: position.coords.latitude,
        lng: position.coords.longitude
      }),
      (error) => reject(error),
      { timeout: 5000 }
    );
  });
};

// Discount calculations
export const calculateDiscountAmount = (subtotal, percentage) => {
  return (parseFloat(subtotal) * parseFloat(percentage)) / 100;
};

export const calculateOrderTotals = (cart, deliveryFee, pickupFee, discounts = {}) => {
  const subtotal = cart.reduce((sum, item) => sum + item.quantity * item.price, 0);
  
  const totalDiscounts = Object.values(discounts).reduce((sum, discount) => {
    return sum + (discount.amount || 0);
  }, 0);

  const totalWithoutDiscounts = parseFloat(subtotal + deliveryFee + pickupFee);
  const total = parseFloat(totalWithoutDiscounts - totalDiscounts).toFixed(2);

  return {
    subtotal,
    totalWithoutDiscounts: totalWithoutDiscounts.toFixed(2),
    total,
    totalDiscounts
  };
};

// Token validation
export const validateToken = async (refreshToken, baseURL) => {
  if (!refreshToken) throw new Error('No refresh token');
  
  const decoded = jwtDecode(refreshToken);
  const currentTime = Date.now() / 1000;
  const timeLeft = decoded.exp - currentTime;
  
  if (timeLeft < 60) {
    const response = await axios.post(`${baseURL}/api/token/refresh/`, {
      refresh: refreshToken
    }, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    return {
      accessToken: response.data.access,
      refreshToken: response.data.refresh || refreshToken
    };
  }
  
  return null;
};

// Promotion helpers
export const findValidPromotion = (promotions) => {
  return promotions.find(promo => 
    new Date(promo.end_date) > new Date() && 
    promo.is_active === true
  );
};