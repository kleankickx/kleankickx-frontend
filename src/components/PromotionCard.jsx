import PromoTicket from './PromoTicket';

const PromotionCard = ({ appliedPromotion }) => {
  if (!appliedPromotion) return null;
  const endDate = appliedPromotion.end_date
    ? new Date(appliedPromotion.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : null;
  const pct = appliedPromotion.discount_percentage;
  return (
    <PromoTicket
      aria-label={`Today's promotion: ${appliedPromotion.name}${pct ? `, ${Number(pct)}% off` : ''}`}
      label="Today's promotion"
      pct={pct}
      title={appliedPromotion.name}
      description={appliedPromotion.description}
      meta={`Applied automatically${endDate ? ` · ends ${endDate}` : ''}`}
    />
  );
};

export default PromotionCard;
