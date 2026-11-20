// src/pages/Cart.jsx
// Full-page cart. Most people use the slide-out cart (components/CartDrawer.jsx);
// this page shows the same panel for links that land here directly: abandoned-cart
// emails (/cart?recover=<id>), the login redirect after recovery, and bookmarks.
import { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../api';
import { CartContext } from '../context/CartContext';
import { CartPanel } from '../components/CartDrawer';

const Cart = () => {
  const { refreshCart, cart } = useContext(CartContext);
  const navigate = useNavigate();
  const [recovering, setRecovering] = useState(false);

  // Restore an abandoned cart from ?recover=<cart id> (same flow as before)
  useEffect(() => {
    const recoverCartId = new URLSearchParams(window.location.search).get('recover');
    if (!recoverCartId) return;

    (async () => {
      setRecovering(true);
      try {
        const { data } = await api.post('/api/cart/recover/', { cart_id: recoverCartId });
        if (data.status === 'already_recovered') {
          toast.info(data.message || 'This cart has already been restored.', { autoClose: 4000 });
        } else if (data.status === 'already_active') {
          toast.info(data.message || 'Your cart is already active.', { autoClose: 3000 });
        } else {
          await refreshCart();
          toast.success(data.message || 'Your cart has been restored.', { autoClose: 3000 });
        }
        window.history.replaceState({}, '', '/cart');
      } catch (error) {
        window.history.replaceState({}, '', '/cart');
        if (error.response?.status === 401) {
          sessionStorage.setItem('pending_recovery_cart_id', recoverCartId);
          toast.info('Please sign in to restore your cart', { autoClose: 3000 });
          navigate('/auth/login', {
            state: { from: '/cart', pendingRecovery: recoverCartId, message: 'Sign in to restore your saved cart!' },
          });
        } else {
          toast.error(error.response?.data?.error || 'Could not restore your cart. Please try again.', { autoClose: 4000 });
        }
      } finally {
        setRecovering(false);
      }
    })();
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <section className="kkc kkc-page">
      <div className="kkc-card">
        <header className="kkc-head">
          <div>
            <h1 className="kkc-title">Your cart</h1>
          </div>
        </header>
        <CartPanel />
      </div>
    </section>
  );
};

export default Cart;
