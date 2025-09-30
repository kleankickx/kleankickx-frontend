import { FaTags, FaGift, FaUserFriends, FaStar, FaInfoCircle } from 'react-icons/fa';


const OrderSummaryCard = ({
  cart,
  appliedPromotion,
  subtotal,
  canUseSignup,
  signupDiscount,
  signupDiscountAmount,
  canUseReferral,
  referralDiscount,
  referralDiscountAmount,
  canUseRedeemedPoints,
  redeemedPointsDiscount,
  redeemedPointsDiscountAmount,
  promoDiscountAmount,
  deliveryFee,
  pickupFee,
  useSame,
  totalWithoutDiscounts,
  total,
}) => {
  return (
    // Order Summary Card
    <div id="order-summary" className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex items-center justify-between">

        <h2 className="text-xl font-semibold flex items-center">
          {/* Icon for Order Summary */}
          <FaTags className="mr-2 text-primary" />  
          Order Summary
        </h2>
        
        {/* Promo Applied Badge */}
        {appliedPromotion && (
          <div className="flex items-center bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">
            <FaTags className="mr-1" />
            Promo Applied
          </div>
        )}
      </div>

      <div className="p-6">
        {/* Cart Items List */}
        <div className="divide-y divide-gray-200">
          {cart.map((item) => (
            <div key={item.service_id} className="py-4 first:pt-0 last:pb-0">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-gray-900">{item.service_name}</p>
                  <p className="text-sm text-gray-500 mt-1">Quantity: {item.quantity}</p>
                </div>
                <p className="font-medium text-gray-900">
                  GHS {(item.quantity * item.price).toFixed(2)}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Pricing Breakdown */}
        <div className="mt-6 pt-6 border-t border-gray-200 space-y-3">
          
          {/* Subtotal */}
          <div className="flex justify-between">
            <p className="text-gray-600">Subtotal</p>
            <p className="font-medium">GHS {subtotal.toFixed(2)}</p>
          </div>
          
          {/* Signup Discount */}
          {canUseSignup && signupDiscount && (
            <div className="bg-green-50 rounded-lg p-3 -mx-1">
              <div className="flex justify-between items-center">
                <span className="text-green-700 font-medium flex items-center capitalize">
                  <FaGift className="mr-2" />
                  {signupDiscount.discount_type}
                </span>
                <span className="text-green-700 font-medium">-GHS {signupDiscountAmount.toFixed(2)}</span>
              </div>
              <div className="text-xs text-green-600 mt-1 ml-6">
                {signupDiscount.percentage}% off your order
              </div>
            </div>
          )}

          {/* Referral Discount */}
          {canUseReferral && referralDiscount && (
            <div className="bg-blue-50 rounded-lg p-3 -mx-1">
              <div className="flex justify-between items-center">
                <span className="text-blue-700 font-medium flex items-center capitalize">
                  <FaUserFriends className="mr-2" />
                  {referralDiscount.discount_type}
                </span>
                <span className="text-blue-700 font-medium">-GHS {referralDiscountAmount.toFixed(2)}</span>
              </div>
              <div className="text-xs text-blue-600 mt-1 ml-6">
                {referralDiscount.percentage}% off your order
              </div>
            </div>
          )}

          {/* Redeemed Points Discount */}
          {canUseRedeemedPoints && redeemedPointsDiscount && (
            <div className="bg-amber-50 rounded-lg p-3 -mx-1">
              <div className="flex justify-between items-center">
                <span className="text-amber-700 font-medium flex items-center">
                  <FaStar className="mr-2" />
                  Redeemed Points Discount
                </span>
                <span className="text-amber-700 font-medium">-GHS {redeemedPointsDiscountAmount.toFixed(2)}</span>
              </div>
              <div className="text-xs text-amber-600 mt-1 ml-6">
                {redeemedPointsDiscount.percentage}% off your order ({redeemedPointsDiscount.points_redeemed} points redeemed)
              </div>
            </div>
          )}

          {/* Auto-applied Promotion Discount */}
          {appliedPromotion && (
            <div className="bg-purple-50 rounded-lg p-3 -mx-1">
              <div className="flex justify-between items-center">
                <span className="text-purple-700 font-medium flex items-center">
                  <FaTags className="mr-2" />
                  Special Promotion
                </span>
                <span className="text-purple-700 font-medium">-GHS {promoDiscountAmount.toFixed(2)}</span>
              </div>
              <div className="text-xs text-purple-600 mt-1 ml-6">
                {appliedPromotion.discount_percentage}% off your order
              </div>
            </div>
          )}

          {/* Delivery Fee */}
          <div className="flex justify-between pt-2">
            <p className="text-gray-600">Delivery Fee</p>
            <p className="font-medium">
              {deliveryFee ? `GHS ${deliveryFee}` : '--'}
            </p>
          </div>

          {/* Pickup Fee */}
          <div className="flex justify-between">
            <p className="text-gray-600">Pickup Fee</p>
            <p className="font-medium">
              {/* Uses delivery cost if useSame is true, otherwise uses pickup cost */}
              {useSame 
                ? (deliveryFee ? `GHS ${deliveryFee}` : '--') 
                : (pickupFee ? `GHS ${pickupFee}` : '--')
              }
            </p>
          </div>

          {/* FINAL TOTAL */}
          <div className="flex justify-between pt-4 mt-3 border-t border-gray-200">
            <p className="text-lg font-semibold">Total Amount</p>
            <div className="text-right">
              {/* Strike-through price if any discount is applied */}
              {(canUseSignup || canUseReferral || canUseRedeemedPoints || appliedPromotion) && (
                <div className="text-sm text-gray-400 line-through">GHS {totalWithoutDiscounts}</div>
              )}
              <p className="text-xl font-bold text-primary">
                GHS {total}
              </p>
            </div>
          </div>
        </div>

        {/* --- Information Banners --- */}

        {canUseSignup && signupDiscount && (
          <div className="mt-4 p-3 bg-green-50 rounded-lg text-sm text-green-700 flex items-start">
            <FaInfoCircle className="w-4 h-4 mt-0.5 mr-2 flex-shrink-0" />
            <span>Your {signupDiscount.percentage}% sign-up discount has been applied!</span>
          </div>
        )}

        {canUseRedeemedPoints && redeemedPointsDiscount && (
          <div className="mt-4 p-3 bg-amber-50 rounded-lg text-sm text-amber-700 flex items-start">
            <FaInfoCircle className="w-4 h-4 mt-0.5 mr-2 flex-shrink-0" />
            <span>Your {redeemedPointsDiscount.percentage}% redeemed points discount has been applied!</span>
          </div>
        )}

        {appliedPromotion && (
          <div className="mt-4 p-3 bg-purple-50 rounded-lg text-sm text-purple-700 flex items-start">
            <FaInfoCircle className="w-4 h-4 mt-0.5 mr-2 flex-shrink-0" />
            <span>Special promotion applied! You save {appliedPromotion.discount_percentage}% on your order.</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderSummaryCard;