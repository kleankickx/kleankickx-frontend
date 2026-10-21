// src/pages/AccountVouchers.jsx
import React, { useState, useEffect, useContext } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  FaGift, FaCopy, FaCheck, FaClock, FaSpinner,
  FaArrowRight, FaShoppingBag, FaTag,
} from 'react-icons/fa';
import { AuthContext } from '../context/AuthContext';
import api from '../api';

const AccountVouchers = () => {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useContext(AuthContext);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('payment_status') === 'success' && params.get('order')) {
      toast.success('Payment successful — your vouchers are ready.');
      window.history.replaceState({}, document.title, '/account/vouchers');
    }
    fetchUserVouchers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  const fetchUserVouchers = async () => {
    try {
      const { data } = await api.get('/api/vouchers/user-vouchers/');
      setVouchers(data);
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error('Please sign in to view your vouchers');
        navigate('/login');
      } else {
        toast.error('Failed to load vouchers');
      }
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 1800);
    } catch {
      toast.error('Could not copy code');
    }
  };

  const formatDate = (d) =>
    new Date(d).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
    });

  const daysRemaining = (validUntil) =>
    Math.max(0, Math.ceil((new Date(validUntil) - new Date()) / 86400000));

  const statusOf = (voucher) => {
    const days = daysRemaining(voucher.valid_until);
    if (voucher.status === 'REDEEMED') return { key: 'redeemed', label: 'Redeemed' };
    if (voucher.status === 'EXPIRED' || days <= 0) return { key: 'expired', label: 'Expired' };
    if (days <= 7) return { key: 'expiring', label: `${days}d left` };
    return { key: 'active', label: 'Active' };
  };

  const activeVouchers = vouchers.filter((v) => statusOf(v).key !== 'redeemed' && statusOf(v).key !== 'expired');
  const pastVouchers = vouchers.filter((v) => statusOf(v).key === 'redeemed' || statusOf(v).key === 'expired');

  // ── Loading ─────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="flex flex-col items-center gap-3 text-neutral-500">
          <FaSpinner className="animate-spin text-2xl" />
          <p className="text-sm">Loading your vouchers…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">

        {/* ── Header ──────────────────────────────────────────────── */}
        <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-neutral-900 tracking-tight">
              Vouchers
            </h1>
            <p className="text-neutral-500 mt-1 text-sm">
              {vouchers.length === 0
                ? 'No vouchers yet.'
                : `${vouchers.length} total · ${activeVouchers.length} active`}
            </p>
          </div>

          <Link
            to="/vouchers"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg
                       bg-neutral-900 text-white text-sm font-medium
                       hover:bg-neutral-800 transition-colors
                       self-start sm:self-auto"
          >
            <FaGift className="text-xs" />
            Buy vouchers
          </Link>
        </header>

        {/* ── Empty state ─────────────────────────────────────────── */}
        {vouchers.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-200 bg-white py-20 px-6 text-center">
            <div className="mx-auto w-14 h-14 rounded-full bg-neutral-50 flex items-center justify-center mb-5">
              <FaGift className="text-neutral-400" size={22} />
            </div>
            <h3 className="text-lg font-medium text-neutral-900 mb-1">No vouchers yet</h3>
            <p className="text-sm text-neutral-500 max-w-sm mx-auto mb-6">
              Purchase a voucher to gift a cleaning — or redeem one for yourself.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/vouchers"
                className="px-4 py-2 rounded-lg bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800 transition-colors"
              >
                Browse vouchers
              </Link>
              <Link
                to="/services"
                className="px-4 py-2 rounded-lg border border-neutral-200 text-neutral-700 text-sm font-medium hover:bg-neutral-50 transition-colors"
              >
                Book cleaning
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* ── Active vouchers ─────────────────────────────────── */}
            {activeVouchers.length > 0 && (
              <section className="mb-12">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-medium text-neutral-500 uppercase tracking-wide">
                    Active
                  </h2>
                  <span className="text-xs text-neutral-400">
                    {activeVouchers.length}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {activeVouchers.map((voucher) => {
                    const status = statusOf(voucher);
                    const isCopied = copiedCode === voucher.code;

                    return (
                      <article
                        key={voucher.id}
                        className="group relative bg-white rounded-xl
                                   ring-1 ring-neutral-200 hover:ring-neutral-300
                                   transition-all overflow-hidden"
                      >
                        {/* Header row */}
                        <div className="p-5 pb-4 flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 text-neutral-500 text-xs mb-1">
                              <FaTag size={9} />
                              <span className="truncate">{voucher.voucher_type}</span>
                            </div>
                            <h3 className="text-base font-medium text-neutral-900 truncate">
                              {voucher.service_name || 'Cleaning voucher'}
                            </h3>
                          </div>
                          <StatusPill status={status} />
                        </div>

                        {/* Code block */}
                        <div className="px-5 pb-4">
                          <button
                            type="button"
                            onClick={() => copyToClipboard(voucher.code)}
                            className="w-full flex items-center justify-between gap-3
                                       px-3.5 py-2.5 rounded-lg bg-neutral-50
                                       border border-dashed border-neutral-200
                                       hover:bg-neutral-100 transition-colors text-left"
                            aria-label={`Copy voucher code ${voucher.code}`}
                          >
                            <code className="font-mono text-sm font-semibold tracking-wider text-neutral-900 truncate">
                              {voucher.code}
                            </code>
                            {isCopied ? (
                              <FaCheck className="text-emerald-600 shrink-0" size={12} />
                            ) : (
                              <FaCopy className="text-neutral-400 group-hover:text-neutral-600 shrink-0 transition-colors" size={12} />
                            )}
                          </button>
                        </div>

                        {/* Dashed divider — ticket feel */}
                        <div className="relative px-5">
                          <div className="border-t border-dashed border-neutral-200" />
                        </div>

                        {/* Footer meta + CTA */}
                        <div className="p-5 pt-4">
                          <dl className="flex items-center justify-between text-xs text-neutral-500 mb-4">
                            <div>
                              <dt className="sr-only">Value</dt>
                              <dd className="font-medium text-neutral-900 text-sm">
                                ₵{Number(voucher.purchase_price).toFixed(2)}
                              </dd>
                            </div>
                            <div className="text-right">
                              <dt className="text-neutral-400">Expires</dt>
                              <dd>{formatDate(voucher.valid_until)}</dd>
                            </div>
                          </dl>

                          <button
                            type="button"
                            onClick={() =>
                              navigate(`/redeem?apply_voucher=${voucher.code}`)
                            }
                            className="w-full inline-flex items-center justify-center gap-2
                                       py-2.5 rounded-lg bg-neutral-900 text-white
                                       text-sm font-medium hover:bg-neutral-800
                                       transition-colors"
                          >
                            Redeem
                            <FaArrowRight size={10} />
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            )}

            {/* ── Past vouchers ──────────────────────────────────── */}
            {pastVouchers.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-medium text-neutral-500 uppercase tracking-wide">
                    Past
                  </h2>
                  <span className="text-xs text-neutral-400">{pastVouchers.length}</span>
                </div>

                <div className="bg-white rounded-xl ring-1 ring-neutral-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-xs font-medium text-neutral-500 bg-neutral-50/60">
                          <th className="px-5 py-3 font-medium">Code</th>
                          <th className="px-5 py-3 font-medium">Type</th>
                          <th className="px-5 py-3 font-medium">Status</th>
                          <th className="px-5 py-3 font-medium hidden sm:table-cell">Valid until</th>
                          <th className="px-5 py-3 font-medium hidden md:table-cell">Redeemed</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100">
                        {pastVouchers.map((voucher) => {
                          const status = statusOf(voucher);
                          return (
                            <tr key={voucher.id} className="hover:bg-neutral-50/60 transition-colors">
                              <td className="px-5 py-3">
                                <code className="font-mono text-xs text-neutral-700">
                                  {voucher.code}
                                </code>
                              </td>
                              <td className="px-5 py-3 text-neutral-700">
                                {voucher.voucher_type}
                              </td>
                              <td className="px-5 py-3">
                                <StatusPill status={status} />
                              </td>
                              <td className="px-5 py-3 text-neutral-500 hidden sm:table-cell">
                                {formatDate(voucher.valid_until)}
                              </td>
                              <td className="px-5 py-3 text-neutral-500 hidden md:table-cell">
                                {voucher.redeemed_at ? formatDate(voucher.redeemed_at) : '—'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// ── Small status pill component ────────────────────────────────────────────
const StatusPill = ({ status }) => {
  const styles = {
    active:   { dot: 'bg-emerald-500', text: 'text-emerald-700', ring: 'ring-emerald-200', bg: 'bg-emerald-50' },
    expiring: { dot: 'bg-amber-500',   text: 'text-amber-700',   ring: 'ring-amber-200',   bg: 'bg-amber-50' },
    redeemed: { dot: 'bg-neutral-400', text: 'text-neutral-600', ring: 'ring-neutral-200', bg: 'bg-neutral-50' },
    expired:  { dot: 'bg-neutral-300', text: 'text-neutral-500', ring: 'ring-neutral-200', bg: 'bg-neutral-50' },
  };
  const s = styles[status.key] || styles.active;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full
                  text-[11px] font-medium ${s.text} ${s.bg} ring-1 ${s.ring} shrink-0`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} aria-hidden="true" />
      {status.label}
    </span>
  );
};

export default AccountVouchers;