// src/pages/RedeemVoucher.jsx
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api';
import Footer from '../components/Footer';
import { useCartDrawer } from '../components/CartDrawer';

const RedeemVoucher = () => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [voucherDetails, setVoucherDetails] = useState(null);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useContext(AuthContext);
  const { addToCart, cart } = useContext(CartContext);
  const { openCart } = useCartDrawer();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const urlCode = params.get('apply_voucher');
    const token = params.get('token');

    if (urlCode) {
      setCode(urlCode);
      if (urlCode.trim().length >= 8) handleVerifyVoucher(urlCode, null);
    }
    if (token) handleVerifyVoucher(null, token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  const handleVerifyVoucher = async (voucherCode = null, token = null) => {
    if (!voucherCode && !token) {
      setError('Please enter a voucher code');
      return;
    }

    setVerifying(true);
    setError('');
    setVoucherDetails(null);

    try {
      const requestData = {};
      if (voucherCode) requestData.voucher_code = voucherCode.trim().toUpperCase();
      if (token) requestData.token = token;

      const response = await api.post('/api/vouchers/redeem/', requestData);

      if (response.data.error) {
        let errorMsg = response.data.error;
        let errorDetails = response.data.details || '';

        if (response.data.error === 'This voucher has already been redeemed') {
          errorMsg = 'Already redeemed';
          if (response.data.voucher?.redeemed_by) {
            errorDetails = `Used by: ${response.data.voucher.redeemed_by}`;
          }
        } else if (response.data.error === 'This voucher has expired') {
          errorMsg = 'Expired';
        } else if (response.data.error === 'This voucher has been cancelled') {
          errorMsg = 'Cancelled';
        }

        setError(errorDetails ? `${errorMsg}. ${errorDetails}` : errorMsg);
        toast.error(errorMsg, { autoClose: 5000 });
        return;
      }

      setVoucherDetails({
        ...response.data.voucher,
        service_id: response.data.service_id,
        service_name: response.data.service_name,
        value: response.data.value,
        is_own_voucher: response.data.is_own_voucher || false,
      });

      toast.success('Voucher checked. It is ready to use.', { autoClose: 3000 });
    } catch (err) {
      console.error('Voucher verification error:', err);
      let errorMsg = 'Unable to verify voucher';
      if (err.response?.status === 404) errorMsg = 'Invalid voucher code';
      else if (err.response?.data?.error) errorMsg = err.response.data.error;

      setError(errorMsg);
      toast.error(errorMsg, { autoClose: 5000 });
    } finally {
      setVerifying(false);
    }
  };

  const handleRedeemToCart = async () => {
    if (!voucherDetails) return;

    setLoading(true);
    try {
      if (!isAuthenticated) {
        toast.info('Please sign in to redeem your voucher');
        navigate('/auth/login', {
          state: { from: '/redeem', voucherCode: code },
        });
        return;
      }

      const alreadyInCart = cart.some(
        (item) =>
          item.is_voucher_redeem &&
          item.voucher_code === voucherDetails.code
      );
      if (alreadyInCart) {
        toast.info('This voucher is already in your cart');
        openCart();
        return;
      }

      // Fetch service so backend gets the correct service_type etc.
      let service = null;
      try {
        const serviceResponse = await api.get(
          `/api/services/${voucherDetails.service_id}/`
        );
        service = serviceResponse.data;
      } catch (err) {
        console.warn('Could not load service details:', err);
      }

      const serviceData = {
        name: service?.name || voucherDetails.service_name,
        price: 0,
        service_type: service?.service_type,
        included_quantity: service?.included_quantity || 1,
        is_voucher_redeem: true,
        voucher_code: voucherDetails.code,
        voucher_id: voucherDetails.id,
        voucher_value: voucherDetails.value,
        original_price: service?.price ?? voucherDetails.value,
      };

      // Correct 3-arg call: (serviceId, quantity, serviceData)
      await addToCart(voucherDetails.service_id, 1, serviceData);

      openCart();
    } catch (err) {
      console.error('Redeem error:', err);
      const msg =
        err.response?.data?.error ||
        err.response?.data?.detail ||
        err.message ||
        'Failed to add voucher to cart';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handlePaste = async () => {
    try {
      const text = (await navigator.clipboard.readText()).trim().toUpperCase();
      setCode(text);
      setTimeout(() => handleVerifyVoucher(text), 200);
    } catch {
      toast.error("Couldn't read the clipboard. Type the code instead.");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (voucherDetails) handleRedeemToCart();
    else handleVerifyVoucher(code);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  };

  const clearForm = () => {
    setCode('');
    setError('');
    setVoucherDetails(null);
  };

  const busy = verifying || loading;

  return (
    <div className="kkr">
      <style>{`
        .kkr{--ink:#0A0B0A;--paper:#F7F9F6;--line:#D9DFD7;--muted:#4D564C;--green:#1A7A1A;--red:#B42318;
          --display:"Anton","Arial Narrow",Impact,sans-serif;--spring:cubic-bezier(.2,1.25,.3,1);--swift:cubic-bezier(.77,0,.18,1);
          background:var(--paper);color:var(--ink);font-family:"League Spartan",system-ui,sans-serif;min-height:100vh}
        .kkr-wrap{max-width:1200px;margin:0 auto;padding:0 20px 72px}
        .kkr-eyebrow{margin:0;font-size:12px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:var(--green)}
        .kkr-hero{padding:48px 0 28px;border-bottom:2px solid var(--ink)}
        .kkr-hero h1{margin:8px 0 0;font-family:var(--display);font-weight:400;text-transform:uppercase;font-size:clamp(52px,8vw,104px);line-height:.88;max-width:12ch}
        .kkr-hero p.sub{margin:14px 0 0;max-width:46ch;color:var(--muted);font-size:18px;line-height:1.5}
        .kkr-grid{display:grid;grid-template-columns:minmax(0,1.05fr) minmax(0,.95fr);gap:28px;margin-top:28px;align-items:start}
        .kkr-card{background:#fff;border:1px solid var(--line);padding:24px}
        .kkr-label{display:flex;justify-content:space-between;align-items:baseline;margin:0 0 10px;font-size:12px;font-weight:600;letter-spacing:.14em;text-transform:uppercase}
        .kkr-label button{border:0;background:none;padding:0;font:inherit;color:var(--muted);cursor:pointer;text-decoration:underline;text-underline-offset:3px}
        .kkr-label button:hover{color:var(--ink)}
        .kkr-row{display:flex;gap:8px}
        .kkr-input{flex:1;min-width:0;height:64px;padding:0 16px;border:2px solid var(--ink);border-radius:2px;background:var(--paper);
          font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:22px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:var(--ink);outline:none;
          transition:box-shadow .2s,background .2s}
        .kkr-input::placeholder{color:#A9B3A7;letter-spacing:.14em}
        .kkr-input:focus{background:#fff;box-shadow:0 4px 0 0 var(--green)}
        .kkr-input.err{border-color:var(--red)}
        .kkr-input.ok{border-color:var(--green)}
        .kkr-paste{flex:none;height:64px;padding:0 18px;border:2px solid var(--ink);border-radius:2px;background:transparent;font:inherit;font-size:14px;font-weight:700;cursor:pointer;
          transition:background .2s,color .2s}
        .kkr-paste:hover:not(:disabled){background:var(--ink);color:#fff}
        .kkr-error{margin:12px 0 0;padding:10px 12px;border-left:3px solid var(--red);background:#FDECEA;color:#7A1A12;font-size:14px;line-height:1.45}
        .kkr-btn{display:inline-flex;align-items:center;justify-content:center;gap:10px;height:56px;padding:0 22px;border:2px solid var(--ink);border-radius:2px;background:transparent;
          color:var(--ink);font:inherit;font-size:16px;font-weight:700;text-decoration:none;cursor:pointer;transition:background .2s,color .2s,border-color .2s,transform .25s var(--spring)}
        .kkr-btn .ar{transition:transform .3s var(--spring)}
        .kkr-btn:hover:not(:disabled){background:var(--ink);color:#fff}
        .kkr-btn:hover:not(:disabled) .ar{transform:translateX(5px)}
        .kkr-btn:active:not(:disabled){transform:scale(.98)}
        .kkr-btn:disabled{opacity:.45;cursor:default}
        .kkr-btn.go{background:var(--green);border-color:var(--green);color:#fff}
        .kkr-btn.go:hover:not(:disabled){background:var(--ink);border-color:var(--ink)}
        .kkr-btn.wide{width:100%;margin-top:16px}
        .kkr :focus-visible{outline:2px solid var(--green);outline-offset:3px}
        .kkr-spin{width:16px;height:16px;border-radius:50%;border:2.5px solid rgba(255,255,255,.35);border-top-color:#fff;animation:kkrSpin .8s linear infinite}
        @keyframes kkrSpin{to{transform:rotate(360deg)}}
        .kkr-tips{list-style:none;margin:20px 0 0;padding:16px 0 0;border-top:1px solid var(--line);display:grid;gap:8px;font-size:14px;color:var(--muted)}
        .kkr-tips li{display:flex;gap:10px}
        .kkr-tips li::before{content:"";flex:none;width:6px;height:6px;margin-top:7px;background:var(--green)}
        .kkr-links{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:16px}
        .kkr-link{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:16px;border:1.5px solid var(--line);background:#fff;color:var(--ink);text-decoration:none;font-weight:700;transition:border-color .2s}
        .kkr-link small{display:block;font-size:12px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);margin-bottom:2px}
        .kkr-link .ar{transition:transform .3s var(--spring)}
        .kkr-link:hover{border-color:var(--ink)}
        .kkr-link:hover .ar{transform:translateX(5px);color:var(--green)}

        .kkr-steps{list-style:none;margin:0;padding:0;border-top:2px solid var(--ink)}
        .kkr-steps li{display:grid;grid-template-columns:64px 1fr;gap:14px;padding:18px 0;border-bottom:1px solid var(--line)}
        .kkr-steps .n{font-family:var(--display);font-size:44px;line-height:1;color:var(--green)}
        .kkr-steps h3{margin:2px 0 4px;font-family:var(--display);font-weight:400;text-transform:uppercase;font-size:24px;line-height:1}
        .kkr-steps p{margin:0;color:var(--muted);line-height:1.5}

        .kkr-ticket{position:relative;background:var(--ink);color:#fff;padding:26px 24px 22px}
        .kkr-ticket::before,.kkr-ticket::after{content:"";position:absolute;top:118px;width:22px;height:22px;border-radius:50%;background:var(--paper)}
        .kkr-ticket::before{left:-11px}.kkr-ticket::after{right:-11px}
        .kkr-ticket .kkr-eyebrow{color:#6FD46F}
        .kkr-ticket h2{margin:8px 0 0;font-family:var(--display);font-weight:400;text-transform:uppercase;font-size:clamp(36px,4.4vw,52px);line-height:.92}
        .kkr-perf{margin:22px -24px 18px;border-top:2px dashed rgba(255,255,255,.28)}
        .kkr-facts{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}
        .kkr-facts dt{font-size:11px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:#A9B3A7}
        .kkr-facts dd{margin:4px 0 0;font-size:16px;font-weight:700;overflow-wrap:anywhere}
        .kkr-facts dd.big{font-family:var(--display);font-weight:400;font-size:30px;line-height:1}
        .kkr-ticket-note{margin:18px 0 0;font-size:14px;color:#C4CCC2;line-height:1.5}

        .kkr-help{margin-top:16px;font-size:14px;color:var(--muted);line-height:1.6}
        .kkr-help a{color:var(--ink);font-weight:600;text-decoration:underline;text-underline-offset:3px}
        @media (max-width:900px){.kkr-grid{grid-template-columns:1fr}}
        @media (max-width:560px){
          .kkr-hero{padding:34px 0 22px}.kkr-hero p.sub{font-size:16px}
          .kkr-card{padding:18px 16px}
          .kkr-input{font-size:18px;height:58px;padding:0 12px;letter-spacing:.1em}
          .kkr-paste{height:58px;padding:0 14px}
          .kkr-links{grid-template-columns:1fr}
          .kkr-facts{grid-template-columns:1fr 1fr}
        }
      `}</style>

      <div className="kkr-wrap">
        <header className="kkr-hero">
          <p className="kkr-eyebrow">Gift vouchers</p>
          <h1>Redeem a voucher</h1>
          <p className="sub">Got a code from a friend, or bought one for yourself? Enter it here and we'll add the Klean to your cart, already paid for.</p>
        </header>

        <div className="kkr-grid">
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.77, 0, 0.18, 1] }}>
            <form className="kkr-card" onSubmit={handleSubmit} noValidate>
              <p className="kkr-label">
                <label htmlFor="kkr-code">Voucher code</label>
                {code && <button type="button" onClick={clearForm} disabled={busy}>Clear</button>}
              </p>
              <div className="kkr-row">
                <input
                  id="kkr-code"
                  className={`kkr-input ${error ? 'err' : voucherDetails ? 'ok' : ''}`}
                  type="text"
                  inputMode="text"
                  autoComplete="off"
                  autoCapitalize="characters"
                  spellCheck={false}
                  value={code}
                  onChange={(e) => { setCode(e.target.value.toUpperCase()); if (error) setError(''); if (voucherDetails) setVoucherDetails(null); }}
                  placeholder="XXXX-XXXX-XXXX"
                  disabled={busy}
                  aria-invalid={!!error}
                  aria-describedby={error ? 'kkr-err' : undefined}
                  autoFocus
                />
                <button type="button" className="kkr-paste" onClick={handlePaste} disabled={busy}>Paste</button>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.p id="kkr-err" className="kkr-error" role="alert"
                    initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>

              <button type="submit" className="kkr-btn go wide" disabled={busy || !code.trim()}>
                {verifying ? <><span className="kkr-spin" aria-hidden="true" /> Checking code</>
                  : loading ? <><span className="kkr-spin" aria-hidden="true" /> Adding to cart</>
                  : voucherDetails ? <>Add to cart <span className="ar" aria-hidden="true">→</span></>
                  : <>Check code <span className="ar" aria-hidden="true">→</span></>}
              </button>

              <ul className="kkr-tips">
                <li>Capital or small letters both work.</li>
                <li>Watch for look-alikes: 0 and O, 1 and I.</li>
                <li>Vouchers are valid for 6 months from purchase.</li>
              </ul>
            </form>

            <div className="kkr-links">
              <Link to="/vouchers" className="kkr-link"><span><small>Give one</small>Buy a gift voucher</span><span className="ar" aria-hidden="true">→</span></Link>
              <Link to="/account/vouchers" className="kkr-link"><span><small>Your account</small>My vouchers</span><span className="ar" aria-hidden="true">→</span></Link>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.08, ease: [0.77, 0, 0.18, 1] }}>
            <AnimatePresence mode="wait">
              {voucherDetails ? (
                <motion.section key="ticket" className="kkr-ticket" aria-live="polite"
                  initial={{ opacity: 0, y: 16, rotate: -1 }} animate={{ opacity: 1, y: 0, rotate: 0 }} exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.5, ease: [0.2, 1.25, 0.3, 1] }}>
                  <p className="kkr-eyebrow">Verified · ready to use</p>
                  <h2>{voucherDetails.service_name}</h2>
                  <div className="kkr-perf" aria-hidden="true" />
                  <dl className="kkr-facts">
                    <div><dt>Value</dt><dd className="big">₵{Number(voucherDetails.value || 0).toLocaleString('en-GH')}</dd></div>
                    <div><dt>Valid until</dt><dd>{formatDate(voucherDetails.valid_until)}</dd></div>
                    <div><dt>Code</dt><dd style={{ fontFamily: 'ui-monospace,Menlo,Consolas,monospace' }}>{voucherDetails.code}</dd></div>
                  </dl>
                  <p className="kkr-ticket-note">
                    {isAuthenticated
                      ? 'Add it to your cart, then choose pickup and delivery at checkout. Nothing to pay for the service.'
                      : "Log in first and it'll be waiting. You'll choose pickup and delivery at checkout."}
                  </p>
                </motion.section>
              ) : (
                <motion.section key="how" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <p className="kkr-eyebrow" style={{ marginBottom: 12 }}>How it works</p>
                  <ol className="kkr-steps">
                    {[
                      ['Enter the code', 'Type or paste the code from your voucher email.'],
                      ['We check it', 'You will see the service it covers and when it expires.'],
                      ['Book your Klean', 'It goes in your cart at no cost. Pick pickup and delivery at checkout.'],
                    ].map(([t, d], i) => (
                      <li key={t}><span className="n">{String(i + 1).padStart(2, '0')}</span><div><h3>{t}</h3><p>{d}</p></div></li>
                    ))}
                  </ol>
                </motion.section>
              )}
            </AnimatePresence>
            <p className="kkr-help">
              Code not working? Message us on <a href="https://wa.me/233536278834" target="_blank" rel="noreferrer">WhatsApp</a> or
              email <a href="mailto:support@kleankickx.com">support@kleankickx.com</a> with the code and we'll sort it out.
            </p>
          </motion.div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default RedeemVoucher;
