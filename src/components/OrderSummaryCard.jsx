import { card, money } from './checkoutUi';

const Row = ({ label, value, tone = '', note, muted = false }) => (
  <div className={`kkco-row ${tone}`}>
    <div>
      <span>{label}</span>
      <span className={muted ? 'muted' : ''}>{value}</span>
    </div>
    {note && <small>{note}</small>}
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
  const hasDiscount = canUseSignup || canUseReferral || canUseRedeemedPoints || promoDiscountAmount > 0;
  const itemCount = cart.reduce((n, item) => n + (item.quantity || 0), 0);
  const pickupValue = useSame ? deliveryFee : pickupFee;
  const fee = (value) => (value ? money(value) : 'Add address');

  const content = (
    <>
      <ul className="kkco-items">
        {cart.map((item) => (
          <li key={item.service_id}>
            <span className="q">{item.quantity}×</span>
            <span className="nm">{item.service_name}</span>
            <span className="pr">{money(item.quantity * item.unit_price)}</span>
          </li>
        ))}
      </ul>

      <div className="kkco-rows">
        <Row label="Subtotal" value={money(subtotal)} />

        {canUseSignup && signupDiscount && (
          <Row tone="g" label={<span style={{ textTransform: 'capitalize' }}>{signupDiscount.discount_type}</span>}
            value={`−${money(signupDiscountAmount)}`} note={`${signupDiscount.percentage}% off`} />
        )}
        {canUseReferral && referralDiscount && (
          <Row tone="g" label={<span style={{ textTransform: 'capitalize' }}>{referralDiscount.discount_type}</span>}
            value={`−${money(referralDiscountAmount)}`} note={`${referralDiscount.percentage}% off`} />
        )}
        {canUseRedeemedPoints && redeemedPointsDiscount && (
          <Row tone="a" label="Points discount" value={`−${money(redeemedPointsDiscountAmount)}`}
            note={`${redeemedPointsDiscount.percentage}% off · ${redeemedPointsDiscount.points_redeemed} points`} />
        )}
        {appliedPromotion && promoDiscountAmount > 0 && (
          appliedPromotion.is_public === false
            ? <Row tone="g" label={`Code ${appliedPromotion.code}`} value={`−${money(promoDiscountAmount)}`} note={`${Number(appliedPromotion.discount_percentage)}% off your Kleans`} />
            : <Row tone="g" label="Promotion" value={`−${money(promoDiscountAmount)}`} note={`${appliedPromotion.discount_percentage}% off today`} />
        )}

        {isSelfHandled ? (
          <Row tone="g" label="Drop-off & collect" value="Free" />
        ) : (
          <>
            <Row label="Pickup" value={fee(pickupValue)} muted={!pickupValue} />
            <Row label="Delivery" value={fee(deliveryFee)} muted={!deliveryFee} />
          </>
        )}
      </div>

      <div className="kkco-total">
        <span>Total</span>
        <div>
          {hasDiscount && <s>{money(totalWithoutDiscounts)}</s>}
          <strong>{money(total)}</strong>
        </div>
      </div>
    </>
  );

  if (bare) return <div className="kkco-sum-bare">{content}</div>;

  return (
    <section id="order-summary" className={`${card} kkco-sum`} aria-labelledby="summary-title">
      <div className="kkco-body">
        <div className="kkco-head">
          <h2 id="summary-title" className="kkco-h">Summary</h2>
          <span>{itemCount} {itemCount === 1 ? 'pair' : 'pairs'}</span>
        </div>
        {content}
      </div>
    </section>
  );
};

export default OrderSummaryCard;
