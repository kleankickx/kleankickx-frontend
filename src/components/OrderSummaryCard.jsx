import { FaTags, FaGift, FaUserFriends, FaStar, FaHandHolding } from 'react-icons/fa';
import { card, money } from './checkoutUi';

const Row = ({ label, value, className = 'text-gray-600', valueClass = 'text-gray-900', note }) => (
  <div>
    <div className={`flex justify-between gap-4 text-sm ${className}`}>
      <span className="flex items-center gap-2 min-w-0">{label}</span>
      <span className={`font-medium whitespace-nowrap ${valueClass}`}>{value}</span>
    </div>
    {note && <p className="text-xs text-gray-500 mt-0.5 ml-5">{note}</p>}
  </div>
);

/*
 * Items, discounts, fees and total. `bare` drops the card frame and heading,
 * for the collapsible summary on small screens.
 */
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
  isSelfHandled = false,
  bare = false,
}) => {
  const hasDiscount = canUseSignup || canUseReferral || canUseRedeemedPoints || appliedPromotion;
  const itemCount = cart.reduce((n, item) => n + (item.quantity || 0), 0);
  const fee = (value) => (value ? money(value) : 'Set address');
  const pickupValue = useSame ? deliveryFee : pickupFee;

  const content = (
    <>
      {/* Items */}
      <ul className="divide-y divide-gray-100">
        {cart.map((item) => (
          <li key={item.service_id} className="flex items-start justify-between gap-4 py-3 first:pt-0">
            <div className="flex items-start gap-3 min-w-0">
              <span className="flex items-center justify-center min-w-6 h-6 px-1.5 rounded-md bg-gray-100 text-xs font-semibold text-gray-700 flex-shrink-0">
                {item.quantity}×
              </span>
              <p className="text-sm font-medium text-gray-900">{item.service_name}</p>
            </div>
            <p className="text-sm font-medium text-gray-900 whitespace-nowrap">{money(item.quantity * item.unit_price)}</p>
          </li>
        ))}
      </ul>

      {/* Breakdown */}
      <div className="mt-4 pt-4 border-t border-gray-100 space-y-2.5">
        <Row label="Subtotal" value={money(subtotal)} />

        {canUseSignup && signupDiscount && (
          <Row
            label={<><FaGift className="w-3 h-3 flex-shrink-0" aria-hidden="true" /><span className="capitalize truncate">{signupDiscount.discount_type}</span></>}
            value={`-${money(signupDiscountAmount)}`}
            className="text-green-700"
            valueClass="text-green-700"
            note={`${signupDiscount.percentage}% off`}
          />
        )}
        {canUseReferral && referralDiscount && (
          <Row
            label={<><FaUserFriends className="w-3 h-3 flex-shrink-0" aria-hidden="true" /><span className="capitalize truncate">{referralDiscount.discount_type}</span></>}
            value={`-${money(referralDiscountAmount)}`}
            className="text-blue-700"
            valueClass="text-blue-700"
            note={`${referralDiscount.percentage}% off`}
          />
        )}
        {canUseRedeemedPoints && redeemedPointsDiscount && (
          <Row
            label={<><FaStar className="w-3 h-3 flex-shrink-0" aria-hidden="true" />Points discount</>}
            value={`-${money(redeemedPointsDiscountAmount)}`}
            className="text-amber-700"
            valueClass="text-amber-700"
            note={`${redeemedPointsDiscount.percentage}% off · ${redeemedPointsDiscount.points_redeemed} points`}
          />
        )}
        {appliedPromotion && (
          <Row
            label={<><FaTags className="w-3 h-3 flex-shrink-0" aria-hidden="true" />Promotion</>}
            value={`-${money(promoDiscountAmount)}`}
            className="text-purple-700"
            valueClass="text-purple-700"
            note={`${appliedPromotion.discount_percentage}% off today`}
          />
        )}

        {isSelfHandled ? (
          <Row
            label={<><FaHandHolding className="w-3 h-3 flex-shrink-0" aria-hidden="true" />Drop-off & collect</>}
            value="Free"
            valueClass="text-primary"
          />
        ) : (
          <>
            <Row label="Pickup fee" value={fee(pickupValue)} valueClass={pickupValue ? 'text-gray-900' : 'text-gray-400'} />
            <Row label="Delivery fee" value={fee(deliveryFee)} valueClass={deliveryFee ? 'text-gray-900' : 'text-gray-400'} />
          </>
        )}
      </div>

      {/* Total */}
      <div className="mt-4 pt-4 border-t border-gray-200 flex items-end justify-between gap-4">
        <span className="text-base font-semibold text-gray-900">Total</span>
        <div className="text-right">
          {hasDiscount && <p className="text-xs text-gray-400 line-through">{money(totalWithoutDiscounts)}</p>}
          <p className="text-2xl font-bold text-gray-900 tracking-tight">{money(total)}</p>
        </div>
      </div>
    </>
  );

  if (bare) return content;

  return (
    <section id="order-summary" className={card} aria-labelledby="summary-title">
      <div className="flex items-center justify-between gap-3 px-5 sm:px-6 pt-5 sm:pt-6 pb-4">
        <h2 id="summary-title" className="text-lg font-semibold text-gray-900">Order summary</h2>
        <span className="text-sm text-gray-500">{itemCount} {itemCount === 1 ? 'item' : 'items'}</span>
      </div>
      <div className="px-5 sm:px-6 pb-5 sm:pb-6">{content}</div>
    </section>
  );
};

export default OrderSummaryCard;
