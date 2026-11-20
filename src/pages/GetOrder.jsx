// src/pages/GetOrder.jsx

import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams, useSearchParams, Link } from 'react-router-dom';
import Footer from '../components/Footer';
import api from '../api';
import { trackOrderPurchase } from '../utils/analytics';
import OrderStatusStepper from '../components/OrderStatusStepper';
import PairPhotos from '../components/PairPhotos';
import { orderStatus, STATUS_TAG_CSS } from '../utils/orderStatus';

const ease = [0.77, 0, 0.18, 1];
const cedi = (v) => `₵${(parseFloat(v) || 0).toFixed(2)}`;

const Close = () => (
    <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true"><path d="M2 2l12 12M14 2L2 14" stroke="currentColor" strokeWidth="2.2" /></svg>
);

// Cancel confirmation
const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, orderRef, isDeleting }) => (
    <AnimatePresence>
        {isOpen && (
            <motion.div className="kkd-scrim" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <motion.div className="kkd-dialog" role="alertdialog" aria-modal="true" aria-labelledby="kkd-cancel-h"
                    onClick={(e) => e.stopPropagation()}
                    initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 30, opacity: 0 }} transition={{ duration: 0.4, ease }}>
                    <div className="kkd-dialog-head">
                        <div>
                            <p className="kkd-eyebrow red">Order #{orderRef}</p>
                            <h2 id="kkd-cancel-h">{isDeleting ? 'Cancelling…' : 'Cancel this order?'}</h2>
                        </div>
                        <button type="button" className="kkd-x" onClick={onClose} disabled={isDeleting} aria-label="Close"><Close /></button>
                    </div>
                    <p className="kkd-dialog-p">
                        {isDeleting ? 'One moment while we cancel it.' : "It hasn't been paid for yet, so nothing will be charged. This can't be undone."}
                    </p>
                    <div className="kkd-dialog-row">
                        <button type="button" className="kkd-btn ghost" onClick={onClose} disabled={isDeleting}>Keep order</button>
                        <button type="button" className="kkd-btn danger" onClick={onConfirm} disabled={isDeleting}>
                            {isDeleting ? <><span className="kkd-spin" aria-hidden="true" /> Cancelling</> : 'Yes, cancel it'}
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        )}
    </AnimatePresence>
);

// Payment needed / failed
const PaymentStatusBanner = ({ order, onRetryPayment }) => {
    const paymentStatus = order.payment_status?.toUpperCase();
    if (order.status === 'CANCELLED') return null;
    if (paymentStatus !== 'PENDING' && paymentStatus !== 'FAILED') return null;
    const isFailed = paymentStatus === 'FAILED';

    return (
        <motion.div className={`kkd-alert ${isFailed ? 'bad' : 'wait'}`} role="status"
            initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease }}>
            <div>
                <p className="kkd-eyebrow">{isFailed ? 'Payment failed' : 'Payment needed'}</p>
                <h2>{isFailed ? "That payment didn't go through" : 'Finish paying to start your Klean'}</h2>
                <p>
                    {isFailed
                        ? order.payment_failure_reason || 'Nothing was charged. Try again, or contact us if it keeps happening.'
                        : "We'll start on your sneakers as soon as payment is confirmed."}
                </p>
            </div>
            <button type="button" className="kkd-btn go" onClick={onRetryPayment}>
                {isFailed ? 'Try payment again' : `Pay ${cedi(order.total_amount || order.total)}`} <span className="ar" aria-hidden="true">→</span>
            </button>
        </motion.div>
    );
};

// Full-size photo
const ImageModal = ({ isOpen, onClose, imageUrl, imageAlt }) => {
    useEffect(() => {
        if (!isOpen) return undefined;
        const onKey = (e) => e.key === 'Escape' && onClose();
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [isOpen, onClose]);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div className="kkd-scrim dark" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <button type="button" className="kkd-x light" onClick={onClose} aria-label="Close photo"><Close /></button>
                    <motion.img src={imageUrl} alt={imageAlt || 'Order item photo'} className="kkd-full" onClick={(e) => e.stopPropagation()}
                        initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.35, ease }} />
                </motion.div>
            )}
        </AnimatePresence>
    );
};

// One line of the order
const OrderItemRow = ({ item, onImageClick }) => {
    const photo = item.image_url || item.photo;
    const isCovered = Boolean(item.covered_label);
    const qty = Number(item.quantity) || 1;

    return (
        <li className="kkd-item">
            <span className="kkd-item-pic" aria-hidden="true">
                {item.service?.image ? <img src={item.service.image} alt="" loading="lazy" /> : null}
            </span>
            <div className="kkd-item-main">
                <p className="kkd-item-name">{item.service?.name}</p>
                <p className="kkd-item-meta">
                    {qty} {qty === 1 ? 'pair' : 'pairs'}
                    {!isCovered && qty > 1 && <> · {cedi(item.unit_price || item.price)} each</>}
                </p>
                {isCovered && <span className={`kkd-tag ${item.is_voucher_redeem ? 'g' : 'a'}`}>{item.covered_label}</span>}
                {photo && (
                    <button type="button" className="kkd-item-photo" onClick={() => onImageClick(photo, item.service?.name)}>
                        <img src={photo} alt="" /> View your photo
                    </button>
                )}
            </div>
            <div className="kkd-item-price">
                {isCovered ? (
                    <>
                        {parseFloat(item.full_value) > 0 && <s>{cedi(item.full_value)}</s>}
                        <b className={item.is_voucher_redeem ? 'g' : 'a'}>{item.is_voucher_redeem ? 'Voucher' : 'Free'}</b>
                    </>
                ) : (
                    <b>{cedi(item.total_price || item.unit_price * item.quantity)}</b>
                )}
            </div>
        </li>
    );
};

const Address = ({ label, address, cost }) => (
    <div className="kkd-addr">
        <p className="kkd-eyebrow">{label}</p>
        <p className="kkd-addr-name">{address.location_name}</p>
        {address.street_address && <p>{address.street_address}</p>}
        {address.region && <p>{address.region}</p>}
        <p className="kkd-addr-fee">Fee <b>{cost ? cedi(cost) : '—'}</b></p>
    </div>
);

const Row = ({ k, v, tone }) => (
    <div className={`kkd-sum-row ${tone || ''}`}><span>{k}</span><span>{v}</span></div>
);

// Main Component
const GetOrder = () => {
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [photo, setPhoto] = useState(null);
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { orderReferenceCode } = useParams();

    const handlePaymentRetry = () => {
        if (order?.total && order.reference_code) {
            toast.info(`Redirecting to payment for GHS ${parseFloat(order.total).toFixed(2)}...`, { autoClose: 2000 });
            navigate(`/checkout/retry/${order.reference_code}`);
        } else {
            toast.error("Cannot process payment. Order reference code or total amount is missing.", { autoClose: 3000 });
        }
    };

    const handleDeleteOrder = async () => {
        if (!order || deleting) return;

        setDeleting(true);

        try {
            await api.delete(`/api/orders/${order.reference_code}/`);

            toast.success('Order cancelled.', { autoClose: 3000 });

            setShowDeleteModal(false);

            // Update the local order state to show it's cancelled
            setOrder(prevOrder => ({
                ...prevOrder,
                status: 'CANCELLED',
                cancelled_at: new Date().toISOString()
            }));

        } catch (error) {
            console.error('Error deleting order:', error);

            const errorMessage = error.response?.data?.error ||
                               error.response?.data?.detail ||
                               'Failed to cancel order. Please try again or contact support.';

            toast.error(errorMessage, { autoClose: 5000 });

            setShowDeleteModal(false);

        } finally {
            setDeleting(false);
        }
    };

    const canDeleteOrder = () => {
        const paymentStatus = order?.payment_status?.toUpperCase();
        const orderStatusKey = order?.status?.toUpperCase();
        // Only allow deletion for pending or failed payments AND if order is not already cancelled
        return (paymentStatus === 'PENDING' || paymentStatus === 'FAILED') &&
               orderStatusKey !== 'CANCELLED';
    };

    // GA4 purchase: fallback for customers who reach the order page first.
    // Shared helper, fires once per order (see utils/analytics.js).
    useEffect(() => {
        trackOrderPurchase(order, 'order_page');
    }, [order]);

    useEffect(() => {
        // Paystack sends customers back with ?payment_status=success|pending|failed
        // (older links used ?payment=). toastId stops a double alert in dev StrictMode.
        const paymentStatus = searchParams.get('payment_status') || searchParams.get('payment');

        if (paymentStatus === 'success') {
            toast.success("Order placed and paid. We'll be in touch about pickup.", { toastId: 'payment-return', autoClose: 6000 });
            sessionStorage.removeItem('pending_order_ref');
            sessionStorage.removeItem('paystack_ref');
        } else if (paymentStatus === 'pending') {
            toast.info("Your order is placed. We're still confirming the payment, which can take a minute for Mobile Money.", { toastId: 'payment-return', autoClose: 8000 });
        } else if (paymentStatus === 'failed') {
            toast.error("The payment didn't go through. Your order is saved, so you can try again from here.", { toastId: 'payment-return', autoClose: 8000 });
        }

        if (paymentStatus) {
            window.history.replaceState({}, '', window.location.pathname);
        }
    }, [searchParams]);

    useEffect(() => {
        const fetchOrder = async () => {
            setLoading(true);
            setError(null);

            try {
                const response = await api.get(`/api/orders/${orderReferenceCode}/`);
                setOrder(response.data);
            } catch (err) {
                console.error('Error fetching order:', err);
                const errorMessage = err.response?.status === 404
                    ? 'Order not found or access denied.'
                    : 'Failed to load order details. Please try again.';
                setError(errorMessage);
                toast.error(errorMessage, {
                    autoClose: 3000,
                });
            } finally {
                setLoading(false);
            }
        };

        if (!orderReferenceCode) {
            setError('Invalid order URL');
            return;
        }

        fetchOrder();
    }, [orderReferenceCode, navigate, api]);

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // What vouchers / the free signup offer paid for (their items are stored at GHS 0)
    const coverage = order?.coverage;
    const isCovered = Boolean(coverage?.has_voucher || coverage?.has_free_item);
    const cancelled = order?.status === 'CANCELLED';
    const status = orderStatus(order?.status, order?.is_self_handled);

    const paymentLabel = (s) => ({
        SUCCESS: ['Paid', 'live'],
        PENDING: ['Awaiting payment', 'wait'],
        FAILED: ['Failed', 'bad'],
        REFUNDED: ['Refunded', 'done'],
        PARTIAL_REFUND: ['Partly refunded', 'done'],
        COVERED: [coverage?.has_voucher ? 'Paid with voucher' : 'Free', 'live'],
    }[s?.toUpperCase()] || ['N/A', 'done']);

    const items = order?.items || [];
    const pairs = items.reduce((n, i) => n + (Number(i.quantity) || 1), 0);
    const legacyPhotos = items.filter((i) => i.image_url || i.photo);
    const fees = order && !order.is_self_handled
        ? parseFloat(order.delivery_cost || 0) + parseFloat(order.pickup_cost || 0) : 0;
    const before = order ? parseFloat(isCovered ? coverage.items_value : order.subtotal) + fees : 0;
    const total = order ? parseFloat(order.total_amount || order.total) : 0;
    const [payText, payTone] = paymentLabel(order?.payment_status);

    return (
        <div className="kkd">
            <style>{`
                .kkd{--ink:#0A0B0A;--paper:#F7F9F6;--line:#D9DFD7;--muted:#4D564C;--green:#1A7A1A;--amber:#9A5B00;--red:#B42318;
                  --display:"Anton","Arial Narrow",Impact,sans-serif;--spring:cubic-bezier(.2,1.25,.3,1);--swift:cubic-bezier(.77,0,.18,1);
                  background:var(--paper);color:var(--ink);font-family:"League Spartan",system-ui,sans-serif;min-height:100vh}
                ${STATUS_TAG_CSS}
                .kkd-wrap{max-width:1200px;margin:0 auto;padding:0 20px 72px}
                .kkd-eyebrow{margin:0;font-size:12px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:var(--green)}
                .kkd-eyebrow.red{color:var(--red)}
                .kkd-back{display:inline-flex;align-items:center;gap:8px;margin-top:28px;font-size:13px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);text-decoration:none}
                .kkd-back span{transition:transform .3s var(--spring)}
                .kkd-back:hover{color:var(--ink)}
                .kkd-back:hover span{transform:translateX(-4px)}
                .kkd-top{display:flex;flex-wrap:wrap;align-items:flex-end;justify-content:space-between;gap:18px;padding:18px 0 24px;border-bottom:2px solid var(--ink)}
                .kkd-top h1{margin:8px 0 0;font-family:var(--display);font-weight:400;text-transform:uppercase;font-size:clamp(44px,7vw,92px);line-height:.88;word-break:break-all}
                .kkd-meta{display:flex;flex-wrap:wrap;align-items:center;gap:8px 14px;margin:14px 0 0;font-size:15px;color:var(--muted)}
                .kkd-tag{display:inline-flex;align-items:center;height:24px;padding:0 8px;border-radius:2px;font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;background:#fff;border:1px solid var(--line);color:var(--ink)}
                .kkd-tag.g{background:#E9F4E7;border-color:transparent;color:var(--green)}
                .kkd-tag.a{background:#FFF6E5;border-color:transparent;color:var(--amber)}
                .kkd-btn{display:inline-flex;align-items:center;justify-content:center;gap:10px;height:50px;padding:0 20px;border:2px solid var(--ink);border-radius:2px;background:transparent;
                  color:var(--ink);font:inherit;font-size:15px;font-weight:700;text-decoration:none;cursor:pointer;white-space:nowrap;transition:background .2s,color .2s,border-color .2s,transform .25s var(--spring)}
                .kkd-btn .ar{transition:transform .3s var(--spring)}
                .kkd-btn:hover:not(:disabled){background:var(--ink);color:#fff}
                .kkd-btn:hover:not(:disabled) .ar{transform:translateX(5px)}
                .kkd-btn:active:not(:disabled){transform:scale(.98)}
                .kkd-btn:disabled{opacity:.5;cursor:default}
                .kkd-btn.go{background:var(--green);border-color:var(--green);color:#fff}
                .kkd-btn.go:hover:not(:disabled){background:var(--ink);border-color:var(--ink)}
                .kkd-btn.danger{background:var(--red);border-color:var(--red);color:#fff}
                .kkd-btn.danger:hover:not(:disabled){background:#8E1B12;border-color:#8E1B12}
                .kkd-btn.ghost-red{border-color:var(--red);color:var(--red);height:44px;font-size:14px}
                .kkd-btn.ghost-red:hover:not(:disabled){background:var(--red);color:#fff}
                .kkd-btn:focus-visible,.kkd-back:focus-visible,.kkd :focus-visible{outline:2px solid var(--green);outline-offset:3px}

                .kkd-alert{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:16px 24px;margin-top:24px;padding:20px 22px;background:#fff;border:1px solid var(--line);border-left:6px solid var(--amber)}
                .kkd-alert.bad{border-left-color:var(--red)}
                .kkd-alert.wait .kkd-eyebrow{color:var(--amber)}
                .kkd-alert.bad .kkd-eyebrow{color:var(--red)}
                .kkd-alert > div{flex:1 1 320px}
                .kkd-alert h2{margin:6px 0 0;font-family:var(--display);font-weight:400;text-transform:uppercase;font-size:30px;line-height:.95}
                .kkd-alert p:not(.kkd-eyebrow){margin:8px 0 0;color:var(--muted);line-height:1.5}

                .kkd-grid{display:grid;grid-template-columns:minmax(0,1fr) 360px;gap:24px;align-items:start;margin-top:24px}
                .kkd-main,.kkd-side{display:flex;flex-direction:column;gap:24px;min-width:0}
                .kkd-side{position:sticky;top:96px}
                .kkd-card{background:#fff;border:1px solid var(--line);padding:22px}
                .kkd-card-head{display:flex;justify-content:space-between;align-items:baseline;gap:12px;padding-bottom:14px;border-bottom:2px solid var(--ink)}
                .kkd-card-head h2{margin:0;font-family:var(--display);font-weight:400;text-transform:uppercase;font-size:30px;line-height:1}
                .kkd-card-head span{font-size:13px;color:var(--muted)}

                .kkd-items{list-style:none;margin:0;padding:0}
                .kkd-item{display:grid;grid-template-columns:64px 1fr auto;gap:16px;align-items:start;padding:16px 0;border-bottom:1px solid var(--line)}
                .kkd-item:last-child{border-bottom:0;padding-bottom:0}
                .kkd-item-pic{width:64px;height:64px;background:var(--paper);border:1px solid var(--line);overflow:hidden}
                .kkd-item-pic img{width:100%;height:100%;object-fit:cover;display:block}
                .kkd-item-main{min-width:0;display:flex;flex-direction:column;align-items:flex-start;gap:4px}
                .kkd-item-name{margin:0;font-size:17px;font-weight:700}
                .kkd-item-meta{margin:0;font-size:14px;color:var(--muted)}
                .kkd-item-photo{display:inline-flex;align-items:center;gap:8px;margin-top:4px;padding:0;border:0;background:none;font:inherit;font-size:13px;font-weight:600;color:var(--ink);text-decoration:underline;text-underline-offset:3px;cursor:pointer}
                .kkd-item-photo img{width:30px;height:30px;object-fit:cover;border:1px solid var(--line)}
                .kkd-item-photo:hover{color:var(--green)}
                .kkd-item-price{text-align:right;display:flex;flex-direction:column;align-items:flex-end;gap:2px}
                .kkd-item-price s{font-size:13px;color:var(--muted)}
                .kkd-item-price b{font-family:var(--display);font-weight:400;font-size:24px;line-height:1;font-variant-numeric:tabular-nums}
                .kkd-item-price b.g{color:var(--green);font-family:inherit;font-weight:700;font-size:14px;text-transform:uppercase;letter-spacing:.08em}
                .kkd-item-price b.a{color:var(--amber);font-family:inherit;font-weight:700;font-size:14px;text-transform:uppercase;letter-spacing:.08em}

                .kkd-gallery{display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:10px;margin-top:16px}
                .kkd-gallery button{position:relative;aspect-ratio:1;padding:0;border:1px solid var(--line);background:var(--paper);overflow:hidden;cursor:zoom-in}
                .kkd-gallery img{width:100%;height:100%;object-fit:cover;transition:transform .6s var(--swift)}
                .kkd-gallery button:hover img{transform:scale(1.06)}

                .kkd-addrs{display:grid;grid-template-columns:1fr 1fr;gap:0;margin-top:4px}
                .kkd-addr{padding:16px 18px 4px 0}
                .kkd-addr + .kkd-addr{padding-left:18px;border-left:1px solid var(--line)}
                .kkd-addr p{margin:3px 0 0;color:var(--muted);font-size:15px}
                .kkd-addr .kkd-eyebrow{margin:0 0 8px}
                .kkd-addr .kkd-addr-name{color:var(--ink);font-weight:700;font-size:17px}
                .kkd-addr .kkd-addr-fee{margin-top:10px;font-size:13px}
                .kkd-addr-fee b{color:var(--ink)}
                .kkd-self{margin-top:16px;display:grid;gap:12px}
                .kkd-self p{margin:0;color:var(--muted);line-height:1.55}
                .kkd-self b{color:var(--ink)}

                .kkd-sum{background:var(--ink);color:#fff;border:0}
                .kkd-sum .kkd-card-head{border-bottom-color:rgba(255,255,255,.9)}
                .kkd-sum .kkd-card-head span{color:#A9B3A7}
                .kkd-sum-row{display:flex;justify-content:space-between;gap:14px;padding:11px 0;border-bottom:1px solid rgba(255,255,255,.12);font-size:15px}
                .kkd-sum-row span:first-child{color:#C4CCC2}
                .kkd-sum-row.g span{color:#6FD46F !important}
                .kkd-sum-row.a span{color:#F2B544 !important}
                .kkd-total{display:flex;justify-content:space-between;align-items:flex-end;gap:14px;padding-top:16px}
                .kkd-total > span{font-size:13px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:#C4CCC2}
                .kkd-total div{text-align:right}
                .kkd-total s{display:block;font-size:14px;color:#A9B3A7}
                .kkd-total strong{display:block;font-family:var(--display);font-weight:400;font-size:52px;line-height:1;font-variant-numeric:tabular-nums}
                .kkd-sum-note{margin:16px 0 0;padding-top:14px;border-top:1px solid rgba(255,255,255,.12);font-size:13px;line-height:1.5;color:#C4CCC2}

                .kkd-dl{margin:0}
                .kkd-dl div{display:flex;justify-content:space-between;align-items:center;gap:14px;padding:11px 0;border-bottom:1px solid var(--line);font-size:15px}
                .kkd-dl div:last-child{border-bottom:0;padding-bottom:0}
                .kkd-dl dt{color:var(--muted)}
                .kkd-dl dd{margin:0;text-align:right;font-weight:600;min-width:0;overflow-wrap:anywhere}
                .kkd-who{padding:14px 0 6px}
                .kkd-who p{margin:0}
                .kkd-who .n{font-family:var(--display);font-size:26px;text-transform:uppercase;line-height:1}
                .kkd-who .m{margin-top:4px;font-size:14px;color:var(--muted);overflow-wrap:anywhere}

                .kkd-help{display:grid;gap:8px;margin-top:14px}
                .kkd-help a{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:14px 16px;border:1.5px solid var(--line);color:var(--ink);text-decoration:none;font-weight:600;transition:border-color .2s}
                .kkd-help a small{display:block;font-size:12px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:var(--muted)}
                .kkd-help a .ar{transition:transform .3s var(--spring)}
                .kkd-help a:hover{border-color:var(--ink)}
                .kkd-help a:hover .ar{transform:translateX(4px);color:var(--green)}

                .kkd-skel{background:linear-gradient(90deg,var(--line) 0%,#EEF2EC 50%,var(--line) 100%);background-size:200% 100%;animation:kkdShim 1.3s linear infinite}
                @keyframes kkdShim{to{background-position:-200% 0}}
                .kkd-error{margin-top:28px;padding:56px 24px;border:2px dashed var(--line);text-align:center}
                .kkd-error h2{margin:0;font-family:var(--display);font-weight:400;text-transform:uppercase;font-size:44px;line-height:.95}
                .kkd-error p{margin:12px auto 22px;max-width:42ch;color:var(--muted)}
                .kkd-error div{display:flex;flex-wrap:wrap;justify-content:center;gap:10px}

                .kkd-scrim{position:fixed;inset:0;z-index:70;background:rgba(10,11,10,.5);display:flex;align-items:center;justify-content:center;padding:16px}
                .kkd-scrim.dark{background:rgba(10,11,10,.92);cursor:zoom-out}
                .kkd-dialog{width:100%;max-width:440px;background:var(--paper);border:2px solid var(--ink);font-family:"League Spartan",system-ui,sans-serif;color:var(--ink)}
                .kkd-dialog-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;padding:20px 20px 14px;border-bottom:2px solid var(--ink)}
                .kkd-dialog-head h2{margin:6px 0 0;font-family:var(--display);font-weight:400;text-transform:uppercase;font-size:32px;line-height:.95}
                .kkd-dialog-p{margin:0;padding:18px 20px 0;color:var(--muted);line-height:1.5}
                .kkd-dialog-row{display:flex;gap:10px;padding:20px}
                .kkd-dialog-row .kkd-btn{flex:1}
                .kkd-x{flex:none;width:42px;height:42px;display:grid;place-items:center;border:2px solid var(--ink);background:none;color:var(--ink);cursor:pointer;transition:background .2s,color .2s,transform .3s var(--spring)}
                .kkd-x:hover:not(:disabled){background:var(--ink);color:#fff;transform:rotate(90deg)}
                .kkd-x.light{position:absolute;top:16px;right:16px;border-color:#fff;color:#fff}
                .kkd-x.light:hover{background:#fff;color:var(--ink)}
                .kkd-full{max-width:min(1000px,100%);max-height:86vh;object-fit:contain;cursor:default}
                .kkd-spin{width:16px;height:16px;border-radius:50%;border:2.5px solid rgba(255,255,255,.35);border-top-color:#fff;animation:kkdSpin .8s linear infinite}
                @keyframes kkdSpin{to{transform:rotate(360deg)}}

                .kkd .kk-pp{border-radius:0;box-shadow:none;border:1px solid var(--line);padding:22px;margin:0}
                .kkd .kk-pp h2{font-family:var(--display);font-weight:400;text-transform:uppercase;font-size:30px;line-height:1}
                .kkd .kk-pp-head{padding-bottom:14px;border-bottom:2px solid var(--ink);margin-bottom:14px}
                .kkd .kk-pp-bar{height:6px;border-radius:0}
                .kkd .kk-pp-bar span{border-radius:0}
                .kkd .kk-pp-thumb{border-radius:0}

                @media (max-width:980px){
                  .kkd-grid{grid-template-columns:1fr}
                  .kkd-side{position:static}
                }
                @media (max-width:640px){
                  .kkd-top{padding-bottom:20px}
                  .kkd-top .kkd-btn{width:100%}
                  .kkd-card,.kkd .kk-pp{padding:18px 16px}
                  .kkd-card-head h2,.kkd .kk-pp h2{font-size:26px}
                  .kkd-item{grid-template-columns:52px 1fr auto;gap:12px}
                  .kkd-item-pic{width:52px;height:52px}
                  .kkd-addrs{grid-template-columns:1fr}
                  .kkd-addr{padding-right:0}
                  .kkd-addr + .kkd-addr{padding-left:0;border-left:0;border-top:1px solid var(--line);margin-top:12px}
                  .kkd-alert .kkd-btn{width:100%}
                  .kkd-total strong{font-size:44px}
                }
                @media (prefers-reduced-motion:reduce){.kkd-skel{animation:none}}
            `}</style>

            <DeleteConfirmationModal
                isOpen={showDeleteModal}
                onClose={() => !deleting && setShowDeleteModal(false)}
                onConfirm={handleDeleteOrder}
                orderRef={orderReferenceCode}
                isDeleting={deleting}
            />
            <ImageModal isOpen={!!photo} onClose={() => setPhoto(null)} imageUrl={photo?.url} imageAlt={photo?.alt} />

            <div className="kkd-wrap">
                <Link to="/orders" className="kkd-back"><span aria-hidden="true">←</span> All orders</Link>

                <header className="kkd-top">
                    <div>
                        <h1>#{orderReferenceCode}</h1>
                        {order && (
                            <div className="kkd-meta">
                                <span className={`kk-st ${status.tone}`}>{status.label}</span>
                                <span>Placed {formatDate(order.created_at)}</span>
                                {order.is_self_handled && <span className="kkd-tag">Drop-off &amp; collect</span>}
                                {coverage?.has_voucher && <span className="kkd-tag g">Voucher</span>}
                                {coverage?.has_free_item && <span className="kkd-tag a">Free signup service</span>}
                            </div>
                        )}
                    </div>
                    {order && canDeleteOrder() && (
                        <button type="button" className="kkd-btn ghost-red" onClick={() => setShowDeleteModal(true)} disabled={deleting}>
                            {deleting ? 'Cancelling…' : 'Cancel order'}
                        </button>
                    )}
                </header>

                {order && !cancelled && <PaymentStatusBanner order={order} onRetryPayment={handlePaymentRetry} />}

                {cancelled && (
                    <motion.div className="kkd-alert bad" initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease }}>
                        <div>
                            <p className="kkd-eyebrow">Cancelled{order.cancelled_at ? ` · ${formatDate(order.cancelled_at)}` : ''}</p>
                            <h2>This order was cancelled</h2>
                            <p>If that's a mistake, get in touch and we'll sort it out.</p>
                        </div>
                        <a className="kkd-btn" href="https://wa.me/233536278834" target="_blank" rel="noreferrer">Contact us <span className="ar" aria-hidden="true">→</span></a>
                    </motion.div>
                )}

                {loading && (
                    <div className="kkd-grid" aria-busy="true" aria-label="Loading order">
                        <div className="kkd-main"><div className="kkd-skel" style={{ height: 190 }} /><div className="kkd-skel" style={{ height: 260 }} /></div>
                        <div className="kkd-side"><div className="kkd-skel" style={{ height: 320 }} /></div>
                    </div>
                )}

                {error && !loading && (
                    <div className="kkd-error" role="alert">
                        <h2>{error.startsWith('Order not found') ? 'Order not found' : "Couldn't load this order"}</h2>
                        <p>{error.startsWith('Order not found') ? "We couldn't find that order on your account. Check the number, or see all your orders." : error}</p>
                        <div>
                            <button type="button" className="kkd-btn" onClick={() => window.location.reload()}>Try again</button>
                            <Link to="/orders" className="kkd-btn go">All orders <span className="ar" aria-hidden="true">→</span></Link>
                        </div>
                    </div>
                )}

                {order && !loading && (
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease }}>
                        {!cancelled && (
                            <div style={{ marginTop: 24 }}>
                                <OrderStatusStepper status={order.status} createdAt={order.created_at} updatedAt={order.updated_at} selfHandled={order.is_self_handled} />
                            </div>
                        )}

                        <div className="kkd-grid">
                            <div className="kkd-main">
                                {items.length > 0 && (
                                    <section className="kkd-card" aria-labelledby="kkd-items-h">
                                        <div className="kkd-card-head">
                                            <h2 id="kkd-items-h">Your Kleans</h2>
                                            <span>{pairs} {pairs === 1 ? 'pair' : 'pairs'}</span>
                                        </div>
                                        <ul className="kkd-items">
                                            {items.map((item, index) => (
                                                <OrderItemRow key={index} item={item} onImageClick={(url, alt) => setPhoto({ url, alt })} />
                                            ))}
                                        </ul>
                                    </section>
                                )}

                                {/* Customer's photo of each pair (record of condition) */}
                                <PairPhotos order={order} />

                                {legacyPhotos.length > 1 && (
                                    <section className="kkd-card" aria-labelledby="kkd-photos-h">
                                        <div className="kkd-card-head">
                                            <h2 id="kkd-photos-h">Your photos</h2>
                                            <span>{legacyPhotos.length}</span>
                                        </div>
                                        <div className="kkd-gallery">
                                            {legacyPhotos.map((item, i) => (
                                                <button key={i} type="button" aria-label={`Open photo for ${item.service?.name}`}
                                                    onClick={() => setPhoto({ url: item.image_url || item.photo, alt: item.service?.name })}>
                                                    <img src={item.image_url || item.photo} alt="" loading="lazy" />
                                                </button>
                                            ))}
                                        </div>
                                    </section>
                                )}

                                {order.is_self_handled ? (
                                    <section className="kkd-card" aria-labelledby="kkd-where-h">
                                        <div className="kkd-card-head"><h2 id="kkd-where-h">Drop-off &amp; collect</h2></div>
                                        <div className="kkd-self">
                                            <p><b>You bring your sneakers to the studio and collect them when they're ready.</b> No pickup or delivery fees.</p>
                                            {!cancelled && <p>Once payment is confirmed, drop them off any time we're open. We'll message you when they're ready to collect.</p>}
                                            <p>Studio: 29 Golf Hills St, Accra · <a href="tel:+233536278834" style={{ color: 'inherit' }}>+233 53 627 8834</a></p>
                                        </div>
                                    </section>
                                ) : (order.delivery_address || order.pickup_address) && (
                                    <section className="kkd-card" aria-labelledby="kkd-where-h">
                                        <div className="kkd-card-head"><h2 id="kkd-where-h">Pickup &amp; delivery</h2></div>
                                        <div className="kkd-addrs">
                                            {order.pickup_address && <Address label="We collect from" address={order.pickup_address} cost={order.pickup_cost} />}
                                            {order.delivery_address && <Address label="We deliver to" address={order.delivery_address} cost={order.delivery_cost} />}
                                        </div>
                                    </section>
                                )}
                            </div>

                            <aside className="kkd-side">
                                <section className="kkd-card kkd-sum" aria-labelledby="kkd-sum-h">
                                    <div className="kkd-card-head">
                                        <h2 id="kkd-sum-h">Summary</h2>
                                        <span>{items.length} {items.length === 1 ? 'item' : 'items'}</span>
                                    </div>
                                    <Row k="Subtotal" v={cedi(isCovered ? coverage.items_value : (order.subtotal || order.total))} />
                                    {coverage?.has_voucher && (
                                        <Row tone="g" k={`Voucher${coverage.voucher_codes?.length ? ` (${coverage.voucher_codes.join(', ')})` : ''}`} v={`−${cedi(coverage.voucher_total)}`} />
                                    )}
                                    {coverage?.has_free_item && (
                                        <Row tone="a" k="Free signup service" v={parseFloat(coverage.free_total) > 0 ? `−${cedi(coverage.free_total)}` : 'Free'} />
                                    )}
                                    {order.discounts_applied?.map((discount, index) => {
                                        const pct = discount.discount_type === 'redeemed_points'
                                            ? (order.redeemed_discount_percentage || 0)
                                            : (discount.percentage || 0);
                                        const name = discount.discount_type.replace('_', ' ');
                                        return (
                                            <Row key={index} tone="g" k={`${name.charAt(0).toUpperCase()}${name.slice(1)} discount (${pct}%)`}
                                                v={`−${cedi(order.subtotal * pct / 100)}`} />
                                        );
                                    })}
                                    {order.is_self_handled ? (
                                        <Row k="Pickup & delivery" v="None (drop-off)" />
                                    ) : (
                                        <>
                                            <Row k="Pickup" v={order.pickup_cost ? cedi(order.pickup_cost) : '—'} />
                                            <Row k="Delivery" v={order.delivery_cost ? cedi(order.delivery_cost) : '—'} />
                                        </>
                                    )}
                                    <div className="kkd-total">
                                        <span>Total</span>
                                        <div>
                                            {(order.discounts_applied?.length > 0 || isCovered) && before > total && <s>{cedi(before)}</s>}
                                            <strong>{cedi(total)}</strong>
                                        </div>
                                    </div>
                                    {coverage?.payment_note && <p className="kkd-sum-note">{coverage.payment_note}</p>}
                                </section>

                                <section className="kkd-card" aria-labelledby="kkd-det-h">
                                    <div className="kkd-card-head"><h2 id="kkd-det-h">Details</h2></div>
                                    <div className="kkd-who">
                                        <p className="n">{[order.first_name, order.last_name].filter(Boolean).join(' ') || 'Customer'}</p>
                                        {order.email && <p className="m">{order.email}</p>}
                                        {order.phone_number && <p className="m">{order.phone_number}</p>}
                                    </div>
                                    <dl className="kkd-dl">
                                        <div><dt>Payment</dt><dd><span className={`kk-st ${payTone}`}>{payText}</span></dd></div>
                                        <div><dt>Method</dt><dd style={{ textTransform: 'capitalize' }}>{(order.payment_method || 'N/A').replace(/_/g, ' ')}</dd></div>
                                        <div><dt>Placed</dt><dd>{formatDate(order.created_at)}</dd></div>
                                    </dl>
                                </section>

                                <section className="kkd-card" aria-labelledby="kkd-help-h">
                                    <div className="kkd-card-head"><h2 id="kkd-help-h">Need help?</h2></div>
                                    <div className="kkd-help">
                                        <a href="https://wa.me/233536278834" target="_blank" rel="noreferrer"><span><small>WhatsApp</small>+233 53 627 8834</span><span className="ar" aria-hidden="true">→</span></a>
                                        <a href="mailto:support@kleankickx.com"><span><small>Email</small>support@kleankickx.com</span><span className="ar" aria-hidden="true">→</span></a>
                                    </div>
                                </section>
                            </aside>
                        </div>
                    </motion.div>
                )}
            </div>
            <Footer />
        </div>
    );
};

export default GetOrder;
