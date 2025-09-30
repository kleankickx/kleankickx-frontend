import React from 'react';
import { FaInfoCircle, FaGift } from 'react-icons/fa';

// --- Placeholder/Example Data Definition ---
// NOTE: In a real application, you would pass the appliedPromotion object as a prop.
// This is a placeholder for the default image URL when appliedPromotion.image is null.
const PromotionPlaceholder = "https://placehold.co/112x128/9CA3AF/FFFFFF?text=PROMO"; 


const PromotionCard = ({ appliedPromotion }) => {

  // Function to format the date to a simple, localized string (e.g., 9/29/2025)
  const formatEndDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (e) {
      return 'Invalid Date';
    }
  };

  return (
    <div className="rounded-xl bg-white shadow-md border border-gray-100 overflow-hidden">
      
      {/* Card Header */}
      <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 bg-gray-50">
        <div className="flex items-center">
          {/* Icon for Promotion */}
          <FaGift className="mr-2 text-primary" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Today's Special Offer</h3>
          </div>
        </div>
        
        {/* Discount Badge (Conditional) */}
        {appliedPromotion && appliedPromotion.discount_percentage && (
          <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
            -{appliedPromotion.discount_percentage}% OFF
          </div>
        )}
      </div>
      
      {/* Card Body and Promotion Display */}
      <div className="px-6 py-4">
        {/* Coupon Ticket Style Wrapper */}
        <div className="relative bg-white rounded-xl shadow-lg border-2 border-dashed border-gray-200 overflow-hidden">
          
          {/* Main ticket content (Flex layout for image and text) */}
          <div className="flex">
            
            {/* Image section */}
            <div className="relative p-4">
              <img 
                src={appliedPromotion?.image || PromotionPlaceholder} 
                alt="Promotion" 
                className="w-28 h-32 rounded-lg border-2 border-gray-100 object-cover" 
              />
            </div>

            {/* Content section */}
            <div className="flex-1 p-4 pr-6">
              <h4 className="font-bold text-gray-900 uppercase tracking-wide text-lg">
                {appliedPromotion ? appliedPromotion.name : 'No active promotions at the moment'}
              </h4>
              
              {appliedPromotion && appliedPromotion.description && (
                <p className="text-gray-600 mt-2 text-sm leading-relaxed line-clamp-3">
                  {appliedPromotion.description}
                </p>
              )}
            </div>
          </div>

          {/* Corner accents for the coupon look */}
          <div className="absolute top-2 left-2 w-3 h-3 border-l-2 border-t-2 border-gray-300 rounded-tl-lg"></div>
          <div className="absolute top-2 right-2 w-3 h-3 border-r-2 border-t-2 border-gray-300 rounded-tr-lg"></div>
          <div className="absolute bottom-2 left-2 w-3 h-3 border-l-2 border-b-2 border-gray-300 rounded-bl-lg"></div>
          <div className="absolute bottom-2 right-2 w-3 h-3 border-r-2 border-b-2 border-gray-300 rounded-br-lg"></div>
        </div>
        
        {/* Expiration Date (Conditional) */}
        {appliedPromotion && appliedPromotion.end_date && (
          <div className="mt-4 text-xs text-gray-500 flex items-center">
            <FaInfoCircle className="mr-1" />
            Valid until: {formatEndDate(appliedPromotion.end_date)}
          </div>
        )}
      </div>
    </div>
  );
};

export default PromotionCard;
