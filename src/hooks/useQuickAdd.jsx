// src/hooks/useQuickAdd.jsx
// One-click "add to cart" for any page. It calls the existing CartContext.addToCart
// with the same arguments Services.jsx uses, so cart, abandoned-cart and checkout
// logic are unchanged. The only difference: the customer stays on the page and gets
// an "Added to cart" banner (components/CartNotice.jsx) instead of being sent away.
import { useContext, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { useCartNotice } from '../components/CartNotice';

export default function useQuickAdd() {
  const { addToCart } = useContext(CartContext);
  const { user, isAuthenticated } = useContext(AuthContext);
  const { showAdded } = useCartNotice();
  const navigate = useNavigate();
  const location = useLocation();
  const [addingId, setAddingId] = useState(null);

  const quickAdd = useCallback(async (service) => {
    if (!service) return;
    const { id, name, price, is_free_signup_service: isFree } = service;

    // Free first Standard Klean: needs an account, one per account (same rules as Services.jsx)
    if (isFree) {
      if (!isAuthenticated) {
        navigate('/auth/register', {
          state: { from: location.pathname, message: `Sign up to claim your free ${name}.`, highlightServiceId: id },
        });
        return;
      }
      if (user?.free_signup_service_used) {
        toast.info('You have already used your free Standard Klean.');
        return;
      }
    }

    setAddingId(id);
    try {
      if (isFree) {
        await addToCart(id, 1, { name, price });
      } else {
        await addToCart(id, 1, { id, name, price, service_type: service.service_type });
      }
      showAdded({ id, name: isFree ? `Free ${name}` : name, price: isFree ? 0 : price, image: service.image });
    } catch (err) {
      console.error('Quick add failed:', err);
      toast.error('Could not add that to your cart. Please try again.');
    } finally {
      setAddingId(null);
    }
  }, [addToCart, isAuthenticated, user, navigate, location.pathname, showAdded]);

  return { quickAdd, addingId };
}
