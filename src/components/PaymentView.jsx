// src/components/checkout/PaymentView.jsx
import React from 'react';
import { FaSpinner, FaCheckCircle, FaUserFriends, FaStar, FaTags } from 'react-icons/fa';

const PaymentView = ({
  cart,
  totals,
  discounts,
  appliedPromotion,
  delivery,
  pickup,
  useSame,
  deliveryFee,
  pickupFee,
  phoneNumber,
  placing,
  onPayment,
  onBack
}) => {
  return (
    <div className="bg-white lg:p-8 p-6 rounded-2xl shadow-lg border border-gray-100 max-w-md px-4 mx-auto">
      {/* Payment Header */}
      <div className="relative mb-8 overflow-hidden rounded-xl bg-gradient-to-r from-emerald-600 to-primary p-6 text-white">
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5"></div>
        <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10"></div>
        <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-white/10"></div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Complete Payment</h2>
              <p className="text-white/90 mt-1">Secure transaction powered by</p>
            </div>
            <div className="flex space-x-2">
              <div className="h-10 w-16 rounded-md bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-sm">
                <span className="text-xs font-bold tracking-wider">PAYSTACK</span>
              </div>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            End-to-end encrypted transaction
          </div>
        </div>
      </div>

      {/* Order Summary */}
      <div className="mb-8 bg-white/80 p-6 rounded-xl border border-gray-100 shadow-sm backdrop-blur-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
            <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
            <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
          </svg>
          Order Summary
        </h3>

        <div className="space-y-3">
          {/* Subtotal */}
          <PriceRow 
            label="Subtotal" 
            amount={totals.subtotal} 
            icon="currency"
          />

          {/* Discounts */}
          {discounts.signup && (
            <DiscountRow
              label={`Signup Discount (${discounts.signup.percentage}%)`}
              amount={-discounts.signup.amount}
              icon={FaCheckCircle}
              color="emerald"
            />
          )}

          {discounts.referral && (
            <DiscountRow
              label={`Referral Discount (${discounts.referral.percentage}%)`}
              amount={-discounts.referral.amount}
              icon={FaUserFriends}
              color="blue"
            />
          )}

          {discounts.redeemedPoints && (
            <DiscountRow
              label={`Points Discount (${discounts.redeemedPoints.percentage}%)`}
              amount={-discounts.redeemedPoints.amount}
              icon={FaStar}
              color="amber"
            />
          )}

          {appliedPromotion && (
            <DiscountRow
              label={`Promotion (${appliedPromotion.discount_percentage}%)`}
              amount={-(totals.subtotal * appliedPromotion.discount_percentage / 100)}
              icon={FaTags}
              color="purple"
            />
          )}

          {/* Fees */}
          <PriceRow 
            label="Delivery Fee" 
            amount={deliveryFee.toFixed(2)} 
            icon="truck"
          />
          
          <PriceRow 
            label="Pickup Fee" 
            amount={pickupFee.toFixed(2)} 
            icon="location"
          />

          {/* Total */}
          <div className="border-t border-gray-200 mt-4 pt-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-800 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-primary" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                Total Amount
              </span>
              <span className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-primary">
                GHS {totals.total}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Actions */}
      <div className="space-y-4">
        {/* Pay Now Button */}
        <button
          onClick={onPayment}
          disabled={placing}
          className={`w-full py-3.5 px-6 rounded-xl font-semibold text-white transition-all duration-300 flex items-center justify-center relative overflow-hidden group cursor-pointer ${
            placing 
              ? 'bg-gray-300 cursor-not-allowed shadow-inner' 
              : 'bg-gradient-to-r from-emerald-600 to-primary hover:from-emerald-700 hover:to-primary-dark shadow-md hover:shadow-lg'
          }`}
        >
          {placing ? (
            <>
              <FaSpinner className="animate-spin mr-3 h-5 w-5 text-white" />
              Processing Payment...
            </>
          ) : (
            <>
              <span className="relative z-10 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2.5 text-white/90" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                Pay Now
              </span>
              <span className="absolute inset-0 bg-white/10 group-hover:bg-white/15 transition-all duration-500 transform group-hover:scale-110"></span>
            </>
          )}
        </button>

        {/* Back Button */}
        <button
          onClick={onBack}
          className="w-full py-3 px-6 rounded-xl font-medium text-gray-700 hover:text-gray-900 bg-white border border-gray-200 hover:border-gray-300 transition-all duration-300 flex items-center justify-center hover:shadow-sm group"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-500 group-hover:text-gray-700 transition-colors" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back to Checkout
        </button>
      </div>

      {/* Security Footer */}
      <div className="mt-8 pt-6 border-t border-gray-100">
        <div className="flex flex-col items-center text-center">
          <div className="flex items-center text-emerald-600 mb-2">
            <div className="relative">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="ml-2 text-sm font-medium">Secure Payment Processing</span>
          </div>
          <p className="text-xs text-gray-500 max-w-xs">
            Your payment information is encrypted and securely processed by Paystack
          </p>
        </div>
      </div>
    </div>
  );
};

const PriceRow = ({ label, amount, icon }) => (
  <div className="flex justify-between py-2.5">
    <span className="text-gray-600 flex items-center">
      <IconRenderer icon={icon} />
      {label}
    </span>
    <span className="font-medium">GHS {amount}</span>
  </div>
);

const DiscountRow = ({ label, amount, icon: Icon, color }) => (
  <div className="flex justify-between py-2.5 text-emerald-600">
    <span className="flex items-center">
      <Icon className="h-4 w-4 mr-2" />
      {label}
    </span>
    <span className="font-medium">-GHS {Math.abs(amount).toFixed(2)}</span>
  </div>
);

const IconRenderer = ({ icon }) => {
  const icons = {
    currency: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
        <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
      </svg>
    ),
    truck: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
        <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
        <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1v-1a1 1 0 011-1h2a1 1 0 011 1v1a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H19a1 1 0 001-1V5a1 1 0 00-1-1H3z" />
      </svg>
    ),
    location: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
      </svg>
    )
  };

  return icons[icon] || null;
};

export default PaymentView;