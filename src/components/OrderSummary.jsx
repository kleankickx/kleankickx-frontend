// src/components/checkout/OrderSummary.jsx
import React from 'react';
import {
  FaGift,
  FaUserFriends,
  FaStar,
  FaTags,
  FaInfoCircle
} from 'react-icons/fa';

const OrderSummary = ({
  cart,
  delivery,
  pickup,
  useSame,
  discounts,
  appliedPromotion,
  totals,
  onCheckout
}) => {
  const deliveryFee = delivery?.cost || 0;
  const pickupFee = useSame ? deliveryFee : pickup?.cost || 0;

  return (
    <div id="order-summary" className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <Header appliedPromotion={appliedPromotion} />
      <CartItems cart={cart} />
      <PricingBreakdown
        subtotal={totals.subtotal}
        deliveryFee={deliveryFee}
        pickupFee={pickupFee}
        discounts={discounts}
        appliedPromotion={appliedPromotion}
        totals={totals}
      />
      <DiscountNotes discounts={discounts} appliedPromotion={appliedPromotion} />
      <CheckoutButton
        isValid={cart.length > 0 && delivery && (useSame || pickup)}
        onCheckout={onCheckout}
      />
    </div>
  );
};

const Header = ({ appliedPromotion }) => (
  <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex items-center justify-between">
    <h2 className="text-xl font-semibold">Order Summary</h2>
    {appliedPromotion && (
      <div className="flex items-center bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">
        <FaTags className="mr-1" />
        Promo Applied
      </div>
    )}
  </div>
);

const CartItems = ({ cart }) => (
  <div className="p-6">
    <div className="divide-y divide-gray-200">
      {cart.map((item) => (
        <div key={item.service_id} className="py-4 first:pt-0 last:pb-0">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-medium text-gray-900">{item.service_name}</p>
              <p className="text-sm text-gray-500 mt-1">Quantity: {item.quantity}</p>
            </div>
            <p className="font-medium text-gray-900">GHS {(item.quantity * item.price).toFixed(2)}</p>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const PricingBreakdown = ({
  subtotal,
  deliveryFee,
  pickupFee,
  discounts,
  appliedPromotion,
  totals
}) => (
  <div className="px-6 pb-6">
    <div className="border-t border-gray-200 pt-6 space-y-3">
      <PriceRow label="Subtotal" amount={subtotal.toFixed(2)} />

      <DiscountRows discounts={discounts} subtotal={subtotal} appliedPromotion={appliedPromotion} />

      <PriceRow
        label="Delivery Fee"
        amount={deliveryFee ? deliveryFee.toFixed(2) : '--'}
      />
      <PriceRow 
        label="Pickup Fee" 
        amount={pickupFee ? pickupFee.toFixed(2) : '--'} 
      />

      <TotalRow totals={totals} />
    </div>
  </div>
);

const PriceRow = ({ label, amount }) => (
  <div className="flex justify-between">
    <p className="text-gray-600">{label}</p>
    <p className="font-medium">GHS {amount}</p>
  </div>
);

const DiscountRows = ({ discounts, subtotal, appliedPromotion }) => (
  <>
    {discounts.signup && (
      <DiscountRow
        icon={FaGift}
        label={`Signup Discount (${discounts.signup.percentage}%)`}
        amount={-discounts.signup.amount}
        color="green"
      />
    )}
    
    {discounts.referral && (
      <DiscountRow
        icon={FaUserFriends}
        label={`Referral Discount (${discounts.referral.percentage}%)`}
        amount={-discounts.referral.amount}
        color="blue"
      />
    )}
    
    {discounts.redeemedPoints && (
      <DiscountRow
        icon={FaStar}
        label={`Points Discount (${discounts.redeemedPoints.percentage}%)`}
        amount={-discounts.redeemedPoints.amount}
        color="amber"
      />
    )}
    
    {appliedPromotion && (
      <DiscountRow
        icon={FaTags}
        label={`Promotion (${appliedPromotion.discount_percentage}%)`}
        amount={-subtotal * (appliedPromotion.discount_percentage / 100)}
        color="purple"
      />
    )}
  </>
);

const DiscountRow = ({ icon: Icon, label, amount, color }) => (
  <div className={`bg-${color}-50 rounded-lg p-3 -mx-1`}>
    <div className="flex justify-between items-center">
      <span className={`text-${color}-700 font-medium flex items-center`}>
        <Icon className="mr-2" />
        {label}
      </span>
      <span className={`text-${color}-700 font-medium`}>
        -GHS {Math.abs(amount).toFixed(2)}
      </span>
    </div>
  </div>
);

const TotalRow = ({ totals }) => (
  <div className="flex justify-between pt-4 mt-3 border-t border-gray-200">
    <p className="text-lg font-semibold">Total Amount</p>
    <div className="text-right">
      {totals.totalWithoutDiscounts !== totals.total && (
        <div className="text-sm text-gray-400 line-through">
          GHS {totals.totalWithoutDiscounts}
        </div>
      )}
      <p className="text-xl font-bold text-primary">
        GHS {totals.total}
      </p>
    </div>
  </div>
);

const DiscountNotes = ({ discounts, appliedPromotion }) => (
  <div className="px-6 pb-6 space-y-3">
    {discounts.signup && (
      <Note 
        color="green" 
        text={`Your ${discounts.signup.percentage}% sign-up discount has been applied!`} 
      />
    )}
    
    {discounts.redeemedPoints && (
      <Note 
        color="amber" 
        text={`Your ${discounts.redeemedPoints.percentage}% redeemed points discount has been applied!`} 
      />
    )}
    
    {appliedPromotion && (
      <Note 
        color="purple" 
        text={`Special promotion applied! You save ${appliedPromotion.discount_percentage}% on your order.`} 
      />
    )}
  </div>
);

const Note = ({ color, text }) => (
  <div className={`p-3 bg-${color}-50 rounded-lg text-sm text-${color}-700 flex items-start`}>
    <FaInfoCircle className="w-4 h-4 mt-0.5 mr-2 flex-shrink-0" />
    <span>{text}</span>
  </div>
);

const CheckoutButton = ({ isValid, onCheckout }) => (
  <div className="px-6 pb-6">
    <button
      onClick={onCheckout}
      disabled={!isValid}
      className={`w-full py-3.5 px-6 rounded-lg font-medium text-white transition-all ${
        isValid
          ? 'bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg cursor-pointer'
          : 'bg-gray-400 cursor-not-allowed'
      }`}
    >
      Proceed to Payment
    </button>
  </div>
);

export default OrderSummary;