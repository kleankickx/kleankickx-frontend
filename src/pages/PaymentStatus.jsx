// src/pages/PaymentStatus.jsx
// Result page after paying (/payment/:status/:reference).
import { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useCheckoutState } from '../hooks/useCheckoutState';
import { CartContext } from '../context/CartContext';
import api from '../api';
import { trackOrderPurchase } from '../utils/analytics';
import PairPhotos from '../components/PairPhotos';
import Footer from '../components/Footer';
import { RESULT_CSS, Mark, Icons, cedi } from '../components/ResultShell';

const ease = [0.77, 0, 0.18, 1];

// Paid once Paystack confirmed it, or once the order has moved past "pending".
const paymentState = (order) => {
  const pay = (order?.payment_status || '').toUpperCase();
  const st = (order?.status || '').toUpperCase();
  if (pay === 'SUCCESS' || pay === 'COVERED' || ['PROCESSING', 'FULFILLED', 'PICKUP', 'CLEANING_ONGOING', 'CLEANING_COMPLETED', 'SCHEDULED_FOR_DELIVERY', 'DELIVERED'].includes(st)) return 'paid';
  if (pay === 'PENDING' && st !== 'CANCELLED') return 'pending';
  return 'failed';
};

const PaymentStatus = () => {
  const { reference } = useParams();
  const { clearCart } = useContext(CartContext);
  const { resetCheckoutState } = useCheckoutState();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [shouldCleanup, setShouldCleanup] = useState(false);

  useEffect(() => {
    if (!reference) {
      setError('Order reference is missing.');
      setLoading(false);
      return;
    }
    const fetchOrderStatus = async () => {
      try {
        const response = await api.get(`/api/orders/${reference}/`);
        const fetchedOrder = response.data;
        setOrder(fetchedOrder);
        // GA4 purchase: this is where Paystack sends customers after paying.
        trackOrderPurchase(fetchedOrder, 'payment_return');
        if (paymentState(fetchedOrder) === 'paid') setShouldCleanup(true);
      } catch (err) {
        console.error('Failed to fetch order status:', err);
        setError("We couldn't load this order. Check your Orders page.");
      } finally {
        setLoading(false);
      }
    };
    fetchOrderStatus();
  }, [reference]);

  useEffect(() => {
    if (shouldCleanup) {
      clearCart();
      resetCheckoutState();
      setShouldCleanup(false);
    }
  }, [shouldCleanup, clearCart, resetCheckoutState]);

  const state = order ? paymentState(order) : null;
  const total = order ? (order.total_amount || order.total) : 0;
  const copy = {
    paid: { eyebrow: 'Payment confirmed', title: 'Order placed', sub: "You're all set. We've emailed your receipt and will be in touch about pickup.", tone: 'ok', icon: Icons.check, tag: ['Paid', 'ok'] },
    pending: { eyebrow: 'Almost there', title: 'Confirming payment', sub: "Your order is saved. We're waiting for the payment to clear, which can take a minute for Mobile Money.", tone: 'wait', icon: Icons.clock, tag: ['Confirming', 'wait'] },
    failed: { eyebrow: 'Payment not completed', title: "Payment didn't go through", sub: 'Nothing was charged. Your order is saved, so you can pay for it now.', tone: 'bad', icon: Icons.cross, tag: ['Unpaid', 'bad'] },
  }[state || 'pending'];

  return (
    <div className="kkac kkrs">
      <style>{RESULT_CSS}</style>
      <div className="kkrs-wrap">
        {loading ? (
          <header className="kkrs-top" aria-busy="true">
            <Mark>{Icons.card}</Mark>
            <p className="kkac-eyebrow">Payment</p>
            <h1>Checking payment</h1>
            <p className="sub">Confirming your payment with Paystack. This only takes a moment.</p>
            <div className="kkrs-bar" role="status" aria-label="Checking payment" />
          </header>
        ) : error ? (
          <>
            <header className="kkrs-top">
              <Mark tone="bad">{Icons.alert}</Mark>
              <p className="kkac-eyebrow">Payment</p>
              <h1>Couldn't load order</h1>
              <p className="sub">{error} Reference: <b>{reference}</b>.</p>
            </header>
            <div className="kkrs-actions two">
              <Link to="/orders" className="kkac-btn go">My orders <span className="ar" aria-hidden="true">→</span></Link>
              <Link to="/" className="kkac-btn">Home</Link>
            </div>
          </>
        ) : (
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease }}>
            <header className="kkrs-top">
              <Mark tone={copy.tone}>{copy.icon}</Mark>
              <p className="kkac-eyebrow">{copy.eyebrow}</p>
              <h1>{copy.title}</h1>
              <p className="sub">{copy.sub}</p>
            </header>

            <section className="kkrs-receipt" aria-label="Order summary">
              <p className="kkac-eyebrow" style={{ marginBottom: 8 }}>Order</p>
              <div className="kkrs-row"><span>Reference</span><span>#{order.reference_code}</span></div>
              <div className="kkrs-row"><span>Payment</span><span><span className={`kkrs-tag ${copy.tag[1]}`}>{copy.tag[0]}</span></span></div>
              {total ? <div className="kkrs-row total"><span>Total</span><span>{cedi(total)}</span></div> : null}
            </section>

            {state === 'paid' && <PairPhotos order={order} />}

            <div className={`kkrs-actions ${state === 'paid' ? 'two' : ''}`}>
              {state === 'failed' && (
                <button type="button" className="kkac-btn go" onClick={() => navigate(`/checkout/retry/${order.reference_code}`)}>
                  Pay {total ? cedi(total) : 'now'} <span className="ar" aria-hidden="true">→</span>
                </button>
              )}
              <button type="button" className={`kkac-btn ${state === 'failed' ? '' : 'go'}`} onClick={() => navigate(`/orders/${reference}`)}>
                View order {state !== 'failed' && <span className="ar" aria-hidden="true">→</span>}
              </button>
              {state === 'paid' && <Link to="/#services" className="kkac-btn">Book another Klean</Link>}
            </div>

            <p className="kkrs-help">
              Questions about this payment? Message us on <a href="https://wa.me/233536278834" target="_blank" rel="noreferrer">WhatsApp</a> or
              email <a href="mailto:support@kleankickx.com">support@kleankickx.com</a> with your order number.
            </p>
          </motion.div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default PaymentStatus;
