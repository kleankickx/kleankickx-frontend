// src/services/orderService.js
import { retryApiCall } from '../utils/paymentUtils';

export const orderService = {
  async createOrder(api, orderData, refreshToken, baseURL, onTokenRefresh) {
    return await retryApiCall(async () => {
      try {
        const response = await api.post('/api/orders/', orderData);
        return response;
      } catch (error) {
        if (error.response?.status === 401) {
          // Attempt token refresh
          const newTokens = await validateAndRefreshToken(refreshToken, baseURL);
          if (newTokens) {
            onTokenRefresh(newTokens);
            // Retry with new token
            const response = await api.post('/api/orders/', orderData);
            return response;
          }
        }
        throw error;
      }
    });
  },

  async markDiscountAsApplied(api, discountId) {
    try {
      await api.patch(`/api/referrals/redeem/${discountId}/apply/`);
    } catch (error) {
      console.error("Error marking discount as applied:", error);
      // Don't throw error here - it shouldn't block the order
    }
  }
};