// src/components/checkout/PromotionsSection.jsx
import React from 'react';
import { FaTags, FaInfoCircle, FaCheckCircle } from 'react-icons/fa';

const PromotionsSection = ({ availablePromotions, appliedPromotion }) => {
  if (availablePromotions.length === 0) return null;

  return (
    <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl shadow-md border border-purple-100 overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <FaTags className="text-purple-500 text-xl mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Today's Special Offer</h3>
              <p className="text-sm text-gray-600">
                {appliedPromotion ? (
                  <span className="text-green-600 font-medium">
                    <FaCheckCircle className="inline mr-1" />
                    {appliedPromotion.discount_percentage}% discount applied automatically!
                  </span>
                ) : (
                  "Checking for available promotions..."
                )}
              </p>
            </div>
          </div>
          {appliedPromotion && (
            <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
              -{appliedPromotion.discount_percentage}% OFF
            </div>
          )}
        </div>
        
        {appliedPromotion && appliedPromotion.description && (
          <p className="text-sm text-gray-700 mt-2 bg-white/50 p-2 rounded-lg">
            {appliedPromotion.description}
          </p>
        )}
        
        {appliedPromotion && (
          <div className="mt-3 text-xs text-gray-500 flex items-center">
            <FaInfoCircle className="mr-1" />
            Valid until: {new Date(appliedPromotion.end_date).toLocaleDateString()}
          </div>
        )}
      </div>
    </div>
  );
};

export default PromotionsSection;