import { useState } from "react";
import { FaSpinner } from "react-icons/fa";

const PaymentCard = ({
  subtotal,
  signupDiscount,
  signupDiscountAmount,
  referralDiscount,
  referralDiscountAmount,
  redeemedPointsDiscount,
  redeemedPointsDiscountAmount,
  delivery,
  pickup,
  useSame,
  total,
  handlePayment,
  placing,
  setPaymentView,
  setShowAlert,
  canUseSignup,
  canUseReferral,
  canUseRedeemedPoints,
  appliedPromotion,
  promoDiscountAmount,
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
              <h2 className="text-2xl font-bold tracking-tight">
                Complete Payment
              </h2>
              <p className="text-white/90 mt-1">
                Secure transaction powered by
              </p>
            </div>
            <div className="flex space-x-2">
              <div className="h-10 w-16 rounded-md bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-sm">
                <span className="text-xs font-bold tracking-wider">
                  PAYSTACK
                </span>
              </div>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-1.5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                clipRule="evenodd"
              />
            </svg>
            End-to-end encrypted transaction
          </div>
        </div>
      </div>

      {/* Order Summary */}
      <div className="mb-8 bg-white/80 p-6 rounded-xl border border-gray-100 shadow-sm backdrop-blur-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-2 text-gray-500"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
            <path
              fillRule="evenodd"
              d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
              clipRule="evenodd"
            />
          </svg>
          Order Summary
        </h3>

        <div className="space-y-3">
          {/* Subtotal */}
          <div className="flex justify-between py-2.5">
            <span className="text-gray-600 flex items-center">
              Subtotal
            </span>
            <span className="font-medium">GHS {subtotal.toFixed(2)}</span>
          </div>

          {/* Discounts */}
          {canUseSignup && (
            <div className="flex justify-between py-2.5 text-emerald-600">
              <span className="flex items-center">
                Sign-Up Discount ({signupDiscount.percentage}%)
              </span>
              <span className="font-medium">
                -GHS {signupDiscountAmount.toFixed(2)}
              </span>
            </div>
          )}

          {canUseReferral && (
            <div className="flex justify-between py-3 border-b border-gray-100/50 text-blue-600">
              <div className="flex items-center">
                Referral Discount ({referralDiscount.percentage}%)
              </div>
              <span className="font-medium">
                -GHS {referralDiscountAmount.toFixed(2)}
              </span>
            </div>
          )}

          {canUseRedeemedPoints && (
            <div className="flex justify-between py-3 border-b border-gray-100/50 text-amber-600">
              <div className="flex items-center">
                Points Discount ({redeemedPointsDiscount.percentage}%)
              </div>
              <span className="font-medium">
                -GHS {redeemedPointsDiscountAmount.toFixed(2)}
              </span>
            </div>
          )}

          {appliedPromotion && (
            <div className="flex justify-between py-3 border-b border-gray-100/50 text-amber-600">
              <div className="flex items-center">
                Promational Discount ({appliedPromotion.discount_percentage}%)
              </div>
              <span className="font-medium">
                -GHS {promoDiscountAmount.toFixed(2)}
              </span>
            </div>
          )}

          {/* Delivery Fee */}
          <div className="flex justify-between py-3 border-b border-gray-100/50">
            <div className="flex items-center text-gray-600">Delivery Fee</div>
            <span className="font-medium">
              GHS {delivery ? delivery.cost.toFixed(2) : "0.00"}
            </span>
          </div>

          {/* Pickup Fee */}
          <div className="flex justify-between py-3">
            <div className="flex items-center text-gray-600">Pickup Fee</div>
            <span className="font-medium">
              {useSame
                ? delivery
                  ? `GHS ${delivery.cost.toFixed(2)}`
                  : "0.00"
                : pickup
                ? `GHS ${pickup.cost.toFixed(2)}`
                : "0.00"}
            </span>
          </div>

          {/* Total */}
          <div className="border-t border-gray-200 mt-4 pt-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-800 flex items-center">
                Total Amount
              </span>
              <span className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-primary">
                GHS {total}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Actions */}
      <div className="space-y-4">
        <button
          onClick={handlePayment}
          disabled={placing}
          className={`w-full py-3.5 px-6 rounded-xl font-semibold text-white transition-all duration-300 flex items-center justify-center relative overflow-hidden group cursor-pointer ${
            placing
              ? "bg-gray-300 cursor-not-allowed shadow-inner"
              : "bg-gradient-to-r from-emerald-600 to-primary hover:from-emerald-700 hover:to-primary-dark shadow-md hover:shadow-lg"
          }`}
        >
          {placing ? (
            <>
              <FaSpinner className="animate-spin mr-3 h-5 w-5 text-white" />
              Processing Payment...
            </>
          ) : (
            <>
              <span className="relative z-10 flex items-center">Pay Now</span>
              <span className="absolute inset-0 bg-white/10 group-hover:bg-white/15 transition-all duration-500 transform group-hover:scale-110"></span>
            </>
          )}
        </button>

        <button
          onClick={() => {
            setPaymentView(false);
            setShowAlert(true);
          }}
          className="w-full py-3 px-6 rounded-xl font-medium text-gray-700 hover:text-gray-900 bg-white border border-gray-200 hover:border-gray-300 transition-all duration-300 flex items-center justify-center hover:shadow-sm group"
        >
          Back to Checkout
        </button>
      </div>

      {/* Security Footer */}
      <div className="mt-8 pt-6 border-t border-gray-100">
        <div className="flex flex-col items-center text-center">
          <div className="flex items-center text-emerald-600 mb-2">
            <span className="ml-2 text-sm font-medium">
              Secure Payment Processing
            </span>
          </div>
          <p className="text-xs text-gray-500 max-w-xs">
            Your payment information is encrypted and securely processed by
            Paystack
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentCard;
