// src/hooks/useQuickAdd.jsx
// One-click "add to cart" for any page. It calls the existing CartContext.addToCart
// with the same arguments Services.jsx uses, so cart, abandoned-cart and checkout
// logic are unchanged. The only difference: the customer stays on the page and gets
// a toast with a "View cart" link instead of being sent somewhere else.
import { useContext, useState, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';

const AddedToast = ({ name }) => (
  <span>
    {name} is in your cart.{' '}
    <Link to="/cart" style={{ fontWeight: 700, textDecoration: 'underline' }}>View cart</Link>
  </span>
);

export default function useQuickAdd() {
  const { addToCart } = useContext(CartContext);
  const { user, isAuthenticated } = useContext(AuthContext);
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
      toast.success(<AddedToast name={isFree ? `Free ${name}` : name} />);
    } catch (err) {
      console.error('Quick add failed:', err);
      toast.error('Could not add that to your cart. Please try again.');
    } finally {
      setAddingId(null);
    }
  }, [addToCart, isAuthenticated, user, navigate, location.pathname]);

  return { quickAdd, addingId };
}
