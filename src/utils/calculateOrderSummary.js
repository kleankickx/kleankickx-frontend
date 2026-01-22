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

  const canUseSignup = user && !signupDiscountUsed?.signup_discount_used && signupDiscount;
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

  const redeemedPointsDiscountAmount = canUseRedeemedPoints
    ? getDiscountAmount(redeemedPointsDiscount)
    : 0;
    
  // --- 4. Final Totals ---

  const totalBeforeDiscounts = subtotal + deliveryFee + pickupFee;

  const totalDiscounts = 
    signupDiscountAmount + 
    referralDiscountAmount + 
    redeemedPointsDiscountAmount + 
    promoDiscountAmount;

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
    canUseSignup,
    canUseReferral,
    canUseRedeemedPoints,
    
    // Discount Objects & Amounts (for UI display)
    signupDiscount, // Pass full object for percentage display in UI
    signupDiscountAmount: toFloat(signupDiscountAmount),
    
    referralDiscount,
    referralDiscountAmount: toFloat(referralDiscountAmount),
    
    redeemedPointsDiscount,
    redeemedPointsDiscountAmount: toFloat(redeemedPointsDiscountAmount),
    
    appliedPromotion, // Full promotion object for UI display
    promoDiscountAmount: toFloat(promoDiscountAmount), // The discount amount from appliedPromotion
    
    // Final Output Totals (formatted for UI)
    totalWithoutDiscounts: toFloat(totalBeforeDiscounts).toFixed(2),
    total: toFloat(finalTotal).toFixed(2),
  };
};