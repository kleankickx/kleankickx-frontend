// src/pages/FailedOrders.jsx
// Recovery page for a paid order that failed to save (/orders/failed).
import { useEffect, useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { CartContext } from '../context/CartContext';
import api from '../api';
import Footer from '../components/Footer';
import { RESULT_CSS, Mark, Icons, cedi } from '../components/ResultShell';

const FailedOrders = () => {
  const [failedOrders, setFailedOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);
  const navigate = useNavigate();
  const { clearCart } = useContext(CartContext);

  useEffect(() => {
    try {
      const storedOrder = localStorage.getItem('failedOrder');
      setFailedOrders(storedOrder ? [JSON.parse(storedOrder)] : []);
    } catch (error) {
      console.error('Error loading failed orders:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRetryOrder = async (order) => {
    setRetrying(true);
    try {
      const response = await api.post('/api/orders/create/', {
        user_id: order.user_id,
        delivery_location: order.delivery_location,
        pickup_location: order.pickup_location,
        total_amount: order.total_amount,
        cart_items: order.cart_items,
        transaction_id: order.transaction_id,
      });
      localStorage.removeItem('failedOrder');
      clearCart();
      toast.success('Your order is saved.');
      navigate(`/orders/${response.data.order_slug}`);
    } catch (error) {
      console.error('Error retrying order:', error);
      toast.error("That didn't work. Contact us and we'll finish it for you.");
    } finally {
      setRetrying(false);
    }
  };

  const supportMail = () => {
    const o = failedOrders[0];
    const subject = encodeURIComponent('Help with a paid order that did not complete');
    const body = encodeURIComponent(
      `Hi KleanKickx, my payment went through but the order didn't complete.\n\n` +
      `Transaction ID: ${o?.transaction_id || 'N/A'}\nAmount: ${o?.total_amount || 'N/A'}\nDate: ${new Date().toLocaleString()}`,
    );
    return `mailto:support@kleankickx.com?subject=${subject}&body=${body}`;
  };

  const order = failedOrders[0];

  return (
    <div className="kkac kkrs">
      <style>{RESULT_CSS}</style>
      <div className="kkrs-wrap">
        {loading ? (
          <header className="kkrs-top" aria-busy="true"><h1>Checking…</h1><div className="kkrs-bar" /></header>
        ) : order ? (
          <>
            <header className="kkrs-top">
              <Mark tone="wait">{Icons.alert}</Mark>
              <p className="kkac-eyebrow">Your money is safe</p>
              <h1>Order not finished</h1>
              <p className="sub">Your payment went through, but we couldn't finish saving the order. Try again below, or send us the details and we'll complete it.</p>
            </header>
            <section className="kkrs-receipt" aria-label="Payment details">
              <p className="kkac-eyebrow" style={{ marginBottom: 8 }}>Payment</p>
              <div className="kkrs-row"><span>Transaction</span><span>{order.transaction_id}</span></div>
              <div className="kkrs-row"><span>Items</span><span>{order.cart_items?.length || 0}</span></div>
              <div className="kkrs-row total"><span>Paid</span><span>{cedi(order.total_amount)}</span></div>
            </section>
            <div className="kkrs-actions two">
              <button type="button" className="kkac-btn go" onClick={() => handleRetryOrder(order)} disabled={retrying}>
                {retrying ? <><span className="kkac-spin" aria-hidden="true" /> Saving…</> : <>Try again <span className="ar" aria-hidden="true">→</span></>}
              </button>
              <a className="kkac-btn" href={supportMail()}>Email support</a>
            </div>
            <p className="kkrs-help">Prefer to chat? Message us on <a href="https://wa.me/233536278834" target="_blank" rel="noreferrer">WhatsApp</a> with the transaction number.</p>
          </>
        ) : (
          <>
            <header className="kkrs-top">
              <Mark tone="ok">{Icons.check}</Mark>
              <p className="kkac-eyebrow">All clear</p>
              <h1>Nothing to fix</h1>
              <p className="sub">There's no unfinished order on this device. Your orders are all in your account.</p>
            </header>
            <div className="kkrs-actions two">
              <Link to="/orders" className="kkac-btn go">My orders <span className="ar" aria-hidden="true">→</span></Link>
              <Link to="/#services" className="kkac-btn">Book a Klean</Link>
            </div>
          </>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default FailedOrders;
