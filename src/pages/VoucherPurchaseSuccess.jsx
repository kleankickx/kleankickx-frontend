// src/pages/VoucherPurchaseSuccess.jsx
// After paying for vouchers (/vouchers/purchase/success?order=…&payment_status=success).
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import Confetti from 'react-confetti';
import { motion } from 'framer-motion';
import Footer from '../components/Footer';
import { RESULT_CSS, Mark, Icons } from '../components/ResultShell';

const VoucherPurchaseSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [ok, setOk] = useState(false);
  const [orderNo, setOrderNo] = useState('');
  const [showConfetti, setShowConfetti] = useState(true);
  const [size, setSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const order = params.get('order');
    if (order && params.get('payment_status') === 'success') {
      setOk(true);
      setOrderNo(order);
      window.history.replaceState({}, document.title, window.location.pathname);
      const onResize = () => setSize({ width: window.innerWidth, height: window.innerHeight });
      window.addEventListener('resize', onResize);
      return () => window.removeEventListener('resize', onResize);
    }
    if (!ok) navigate('/vouchers', { replace: true });
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location, navigate]);

  useEffect(() => {
    const t = setTimeout(() => setShowConfetti(false), 5000);
    return () => clearTimeout(t);
  }, []);

  if (!ok) return null;

  return (
    <div className="kkac kkrs" style={{ position: 'relative', overflow: 'hidden' }}>
      <style>{RESULT_CSS}</style>
      {showConfetti && !reduce && (
        <Confetti width={size.width} height={size.height} recycle={false} numberOfPieces={140} gravity={0.12}
          colors={['#1A7A1A', '#4CB84C', '#0A0B0A', '#D9DFD7']} />
      )}
      <div className="kkrs-wrap">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.77, 0, 0.18, 1] }}>
          <header className="kkrs-top">
            <Mark tone="ok">{Icons.gift}</Mark>
            <p className="kkac-eyebrow">Payment confirmed{orderNo ? ` · ${orderNo}` : ''}</p>
            <h1>Vouchers ready</h1>
            <p className="sub">Thank you. Your vouchers are paid for and on their way by email, to you or to the person you're gifting.</p>
          </header>

          <ol className="kkrs-steps">
            <li><span className="n">01</span><div><b>Check your email</b><p>The voucher codes arrive in a minute or two. Check spam if you don't see them.</p></div></li>
            <li><span className="n">02</span><div><b>Find them in your account</b><p>Every code is in My vouchers, with a Share button for WhatsApp.</p></div></li>
            <li><span className="n">03</span><div><b>Redeem any time</b><p>Valid for 6 months. Enter the code at Redeem a voucher when booking.</p></div></li>
          </ol>

          <div className="kkrs-actions two">
            <Link to="/account/vouchers" className="kkac-btn go">My vouchers <span className="ar" aria-hidden="true">→</span></Link>
            <Link to="/vouchers" className="kkac-btn">Buy another</Link>
          </div>
          <p className="kkrs-help">Didn't get the email? Message us on <a href="https://wa.me/233536278834" target="_blank" rel="noreferrer">WhatsApp</a> or email <a href="mailto:support@kleankickx.com">support@kleankickx.com</a>.</p>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
};

export default VoucherPurchaseSuccess;
