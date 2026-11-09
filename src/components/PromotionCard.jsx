import { FaTags } from 'react-icons/fa';

// Today's promotion, applied automatically at checkout
const PromotionCard = ({ appliedPromotion }) => {
  if (!appliedPromotion) return null;

  const endDate = appliedPromotion.end_date
    ? new Date(appliedPromotion.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : null;

  return (
    <section
      aria-label="Today's promotion"
      className="relative overflow-hidden rounded-2xl border border-purple-200 bg-gradient-to-br from-purple-50 to-white p-4 sm:p-5"
    >
      <div className="flex items-center gap-4">
        {appliedPromotion.image ? (
          <img src={appliedPromotion.image} alt="" className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
        ) : (
          <span className="flex items-center justify-center w-14 h-14 rounded-xl bg-purple-100 text-purple-700 flex-shrink-0">
            <FaTags className="w-5 h-5" aria-hidden="true" />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-gray-900 truncate">{appliedPromotion.name}</p>
            {appliedPromotion.discount_percentage && (
              <span className="text-xs font-semibold text-purple-700 bg-purple-100 rounded-full px-2 py-0.5">
                -{appliedPromotion.discount_percentage}%
              </span>
            )}
          </div>
          {appliedPromotion.description && (
            <p className="text-sm text-gray-600 mt-0.5 line-clamp-2">{appliedPromotion.description}</p>
          )}
          <p className="text-xs text-purple-700 mt-1">
            Applied automatically{endDate ? ` · ends ${endDate}` : ''}
          </p>
        </div>
      </div>
    </section>
  );
};

export default PromotionCard;
