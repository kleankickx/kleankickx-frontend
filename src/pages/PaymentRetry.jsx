// src/pages/PaymentRetry.jsx
// Pay for an order that wasn't paid (/checkout/retry/:orderReferenceCode).
import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../api';
import Footer from '../components/Footer';
import { RESULT_CSS, Mark, Icons, cedi } from '../components/ResultShell';

const PAY_TAG = {
  PENDING: ['Awaiting payment', 'wait'],
  FAILED: ['Payment failed', 'bad'],
  UNPAID: ['Unpaid', 'bad'],
};

const PaymentRetry = () => {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const { orderReferenceCode } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrder = async () => {
      setLoading(true);
      setError(null);
      if (!orderReferenceCode) {
        setError('Invalid order reference.');
        setLoading(false);
        return;
      }
      try {
        const response = await api.get(`/api/orders/${orderReferenceCode}/`);
        const fetchedOrder = response.data;
        setOrder(fetchedOrder);
        const status = fetchedOrder.payment_status?.toUpperCase();
        if (status === 'SUCCESS' || status === 'REFUNDED') {
          toast.info('This order is already paid.', { toastId: 'already-paid' });
          navigate(`/orders/${orderReferenceCode}`, { replace: true });
        }
      } catch (err) {
        console.error('Error fetching order for retry:', err);
        setError(err.response?.status === 404 ? `We couldn't find order #${orderReferenceCode} on your account.` : "We couldn't load this order. Try again in a moment.");
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [orderReferenceCode, navigate]);

  const handleInitiatePayment = async () => {
    if (!order || isProcessingPayment) return;
    setIsProcessingPayment(true);
    try {
      const response = await api.post('/api/payments/initialize_retry/', {
        reference_code: order.reference_code,
        amount: order.total,
      });
      if (response.data.success && response.data.payment_url) {
        window.location.href = response.data.payment_url;
        return; // leaving for Paystack; keep the button in its busy state
      }
      toast.error(response.data.message || "Couldn't start the payment. Try again.", { autoClose: 5000 });
    } catch (err) {
      console.error('Payment initialization error:', err);
      toast.error('Payments are briefly unavailable. Try again in a moment.', { autoClose: 5000 });
    }
    setIsProcessingPayment(false);
  };

  if (loading) {
    return (
      <div className="kkac kkrs">
        <style>{RESULT_CSS}</style>
        <div className="kkrs-wrap">
          <header className="kkrs-top" aria-busy="true">
            <Mark>{Icons.card}</Mark>
            <h1>Loading order</h1>
            <div className="kkrs-bar" role="status" aria-label="Loading order" />
          </header>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="kkac kkrs">
        <style>{RESULT_CSS}</style>
        <div className="kkrs-wrap">
          <header className="kkrs-top">
            <Mark tone="bad">{Icons.alert}</Mark>
            <h1>Order not found</h1>
            <p className="sub">{error || "We couldn't find this order."}</p>
          </header>
          <div className="kkrs-actions two">
            <Link to="/orders" className="kkac-btn go">My orders <span className="ar" aria-hidden="true">→</span></Link>
            <Link to="/#services" className="kkac-btn">Browse services</Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const total = order.total_amount || order.total || 0;
  const fees = (parseFloat(order.delivery_cost) || 0) + (parseFloat(order.pickup_cost) || 0);
  const [tagText, tagTone] = PAY_TAG[order.payment_status?.toUpperCase()] || PAY_TAG.UNPAID;
  const pairs = (order.items || []).reduce((n, i) => n + (Number(i.quantity) || 1), 0);

  return (
    <div className="kkac kkrs">
      <style>{RESULT_CSS}</style>
      <div className="kkrs-wrap wide">
        <Link to={`/orders/${orderReferenceCode}`} className="kkac-back"><span aria-hidden="true">←</span> Order #{order.reference_code}</Link>
        <header className="kkrs-top" style={{ paddingTop: 18 }}>
          <h1>Pay for your order</h1>
          <p className="sub">Your order is saved. Pay now and we'll start on your sneakers as soon as it's confirmed.</p>
        </header>

        <motion.div className="kkac-grid" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.77, 0, 0.18, 1] }}>
          <section className="kkac-card" aria-labelledby="kkrs-items-h">
            <div className="kkac-card-head">
              <h2 id="kkrs-items-h">Your Kleans</h2>
              <span>{pairs} {pairs === 1 ? 'pair' : 'pairs'} · placed {new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
            </div>
            <ul className="kkrs-items">
              {(order.items || []).map((item, i) => (
                <li key={i}>
                  {item.service?.image ? <img src={item.service.image} alt="" /> : <span style={{ width: 52, height: 52, background: 'var(--paper)', border: '1px solid var(--line)' }} />}
                  <span><b>{item.service?.name}</b><small>{item.quantity} {Number(item.quantity) === 1 ? 'pair' : 'pairs'}</small></span>
                  <span className="pr">{cedi(item.total_price || item.unit_price * item.quantity)}</span>
                </li>
              ))}
            </ul>
          </section>

          <aside className="kkac-col">
            <section className="kkrs-receipt" style={{ marginTop: 0 }} aria-label="Payment summary">
              <p className="kkac-eyebrow" style={{ marginBottom: 8 }}>Summary</p>
              <div className="kkrs-row"><span>Status</span><span><span className={`kkrs-tag ${tagTone}`}>{tagText}</span></span></div>
              <div className="kkrs-row"><span>Subtotal</span><span>{cedi(order.subtotal)}</span></div>
              {!order.is_self_handled && <div className="kkrs-row"><span>Pickup & delivery</span><span>{cedi(fees)}</span></div>}
              <div className="kkrs-row total"><span>Total</span><span>{cedi(total)}</span></div>
              <button type="button" className="kkac-btn go" style={{ width: '100%', marginTop: 16 }} onClick={handleInitiatePayment} disabled={isProcessingPayment}>
                {isProcessingPayment ? <><span className="kkac-spin" aria-hidden="true" /> Opening Paystack…</> : <>Pay {cedi(total)} <span className="ar" aria-hidden="true">→</span></>}
              </button>
              <p style={{ margin: '12px 0 0', fontSize: 13, color: '#A9B3A7', textAlign: 'center' }}>Mobile Money or card, securely through Paystack.</p>
            </section>
            <p className="kkrs-help" style={{ marginTop: 0 }}>
              Problem paying? Message us on <a href="https://wa.me/233536278834" target="_blank" rel="noreferrer">WhatsApp</a>.
            </p>
          </aside>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
};

export default PaymentRetry;
