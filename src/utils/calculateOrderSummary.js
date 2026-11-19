export const calculateOrderSummary = ({
  cart,
  delivery,
  pickup,
  useSame,
  discounts,
  appliedPromotion,
  user,
  signupDiscountUsed,
  referralDiscountUsed,
  redeemedPointsDiscount,
  isSelfHandled = false, // Add default value
}) => {
  // Helper to ensure values are treated as numbers
  const toFloat = (value) => parseFloat(value || 0);

  // --- 1. Base Totals & Fees ---
  const subtotal = cart.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
  
  // If self-handled, set all location fees to 0
  let deliveryFee = 0;
  let pickupFee = 0;
  
  if (!isSelfHandled) {
    // Calculate fees normally when NOT self-handled
    deliveryFee = toFloat(delivery?.cost);
    pickupFee = useSame ? deliveryFee : toFloat(pickup?.cost);
  }
  // When self-handled, both fees remain 0

  // --- 2. Discount Definitions & Eligibility ---
  const signupDiscount = discounts?.find(d => d.discount_type === 'signup');
  const referralDiscount = discounts?.find(d => d.discount_type === 'referral');

  const canUseSignup = user && !signupDiscountUsed?.signup_discount_used && signupDiscount && signupDiscount.is_active;
  const canUseReferral = user && referralDiscountUsed?.first_order_completed === false && referralDiscount;
  const canUseRedeemedPoints = user && redeemedPointsDiscount && !redeemedPointsDiscount.is_applied;
  
  // Helper for percentage discount calculation
  const getDiscountAmount = (discountObj) => 
    discountObj 
      ? (toFloat(subtotal) * toFloat(discountObj.percentage)) / 100
      : 0;

  // --- 3. Discount Calculations ---
  
  // Note: promoDiscountAmount is calculated directly from appliedPromotion
  const promoDiscountAmount = appliedPromotion
    ? (toFloat(subtotal) * toFloat(appliedPromotion.discount_percentage)) / 100
    : 0;

  const signupDiscountAmount = canUseSignup
    ? getDiscountAmount(signupDiscount)
    : 0;

  const referralDiscountAmount = canUseReferral
    ? getDiscountAmount(referralDiscount)
    : 0;

  let redeemedPointsDiscountAmount = canUseRedeemedPoints
    ? getDiscountAmount(redeemedPointsDiscount)
    : 0;

  // A typed-in promo code (is_public === false) doesn't stack: like the backend,
  // keep whichever saves more, the code or the customer's other discounts together.
  let promoAmount = promoDiscountAmount;
  let signupAmount = signupDiscountAmount;
  let referralAmount = referralDiscountAmount;
  let codeNote = '';
  let useSignup = canUseSignup;
  let useReferral = canUseReferral;
  let usePoints = canUseRedeemedPoints;
  if (appliedPromotion && appliedPromotion.is_public === false && promoAmount > 0) {
    const others = signupAmount + referralAmount + redeemedPointsDiscountAmount;
    if (others > 0) {
      if (promoAmount >= others) {
        signupAmount = 0; referralAmount = 0; redeemedPointsDiscountAmount = 0;
        useSignup = false; useReferral = false; usePoints = false;
        codeNote = 'Saves more than your other discounts, so we used the code. They stay for next time.';
      } else {
        promoAmount = 0;
        codeNote = "Your other discounts save more on this order, so we're using those instead.";
      }
    }
  }

  // --- 4. Final Totals ---

  const totalBeforeDiscounts = subtotal + deliveryFee + pickupFee;

  const totalDiscounts =
    signupAmount +
    referralAmount +
    redeemedPointsDiscountAmount +
    promoAmount;

  const finalTotal = Math.max(0, totalBeforeDiscounts - totalDiscounts); // Total can't be negative

  // --- 5. Return Results ---
  return {
    // Base Totals & Fees
    subtotal: toFloat(subtotal),
    deliveryFee: toFloat(deliveryFee),
    pickupFee: toFloat(pickupFee),
    
    // Self-handled flag
    isSelfHandled: Boolean(isSelfHandled), // Convert to boolean
    
    // Eligibility Flags
    canUseSignup: useSignup,
    canUseReferral: useReferral,
    canUseRedeemedPoints: usePoints,
    
    // Discount Objects & Amounts (for UI display)
    signupDiscount, // Pass full object for percentage display in UI
    signupDiscountAmount: toFloat(signupAmount),
    
    referralDiscount,
    referralDiscountAmount: toFloat(referralAmount),
    
    redeemedPointsDiscount,
    redeemedPointsDiscountAmount: toFloat(redeemedPointsDiscountAmount),
    
    appliedPromotion, // Full promotion object for UI display
    promoDiscountAmount: toFloat(promoAmount), // after the typed-in code rule
    codeNote, // why a typed-in code was or wasn't used alongside other discounts
    
    // Final Output Totals (formatted for UI)
    totalWithoutDiscounts: toFloat(totalBeforeDiscounts).toFixed(2),
    total: toFloat(finalTotal).toFixed(2),
  };
};