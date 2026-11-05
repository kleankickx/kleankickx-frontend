const toNumber = (value) => {
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : 0;
};

/*
 * What to show as an order's total on the orders list.
 * Voucher and free signup items are stored at 0, so an order with nothing to pay
 * reads "Paid with voucher" or "Free" instead of 0.00, with its real value struck through.
 */
export const orderPrice = (order) => {
  const items = order?.items || [];
  const total = toNumber(order?.total);
  const voucher = items.some((item) => item.is_voucher_redeem);
  const free = items.some((item) => item.is_free_service);
  const coveredValue = items
    .filter((item) => item.is_voucher_redeem || item.is_free_service)
    .reduce((sum, item) => sum + toNumber(item.full_value), 0);

  const label = total <= 0 ? (voucher ? 'Paid with voucher' : 'Free') : null;

  let was = 0;
  if (voucher || free) was = total + coveredValue;
  else if (order?.is_discounted) was = toNumber(order.total_before_discount);
  if (was <= total) was = 0;

  return { total, label, voucher, free, was };
};
