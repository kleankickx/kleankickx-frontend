// Today's promotion, applied automatically at checkout
const PromotionCard = ({ appliedPromotion }) => {
  if (!appliedPromotion) return null;

  const endDate = appliedPromotion.end_date
    ? new Date(appliedPromotion.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : null;
  const pct = appliedPromotion.discount_percentage;

  return (
    <section aria-label="Today's promotion" className="kkco-promo">
      {appliedPromotion.image
        ? <img src={appliedPromotion.image} alt="" />
        : <span className="pct" aria-hidden="true">{pct ? `-${Math.round(pct)}%` : '%'}</span>}
      <div style={{ minWidth: 0 }}>
        <b>{appliedPromotion.name}{pct && appliedPromotion.image ? ` · ${pct}% off` : ''}</b>
        {appliedPromotion.description && <p>{appliedPromotion.description}</p>}
        <small>Applied automatically{endDate ? ` · ends ${endDate}` : ''}</small>
      </div>
    </section>
  );
};

export default PromotionCard;
