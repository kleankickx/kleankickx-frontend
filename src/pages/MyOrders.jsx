import React, { useEffect, useState, useContext, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import Footer from '../components/Footer';
import api from '../api';
import { orderPrice } from '../utils/orderPrice';
import { orderStatus, STATUS_TAG_CSS } from '../utils/orderStatus';

// --- Constants ---
const PAGE_SIZE = 10;

const MyOrders = () => {
  const { isAuthenticated, user } = useContext(AuthContext);
  const ordersContainerRef = useRef(null);
  const ordersGridRef = useRef(null);
  
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- PAGINATION AND FILTER STATE ---
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  // The page being loaded; currentPage stays on the page shown until it arrives.
  const [requestedPage, setRequestedPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const requestIdRef = useRef(0);

  const totalPages = useMemo(() => Math.ceil(totalCount / PAGE_SIZE), [totalCount]);

  // Wait until typing pauses before searching.
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 350);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // --- FETCH ---
  useEffect(() => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({ page: requestedPage, page_size: PAGE_SIZE, sort_by: sortBy });
    if (statusFilter !== 'all') params.set('status_filter', statusFilter);
    if (debouncedSearch) params.set('search', debouncedSearch);

    api
      .get(`/api/orders/?${params.toString()}`)
      .then((response) => {
        if (requestId !== requestIdRef.current) return; // a newer request replaced this one
        setOrders(response.data.results || []);
        setTotalCount(response.data.count || 0);
        setCurrentPage(requestedPage);
      })
      .catch((err) => {
        if (requestId !== requestIdRef.current) return;
        console.error('Error fetching orders:', err);
        const errorMessage = err.response?.data?.detail || 'Failed to load orders. Please try again.';
        setError(errorMessage);
        toast.error(errorMessage, { position: 'top-right', autoClose: 3000 });
      })
      .finally(() => {
        if (requestId === requestIdRef.current) setLoading(false);
      });
  }, [isAuthenticated, user, requestedPage, statusFilter, sortBy, debouncedSearch, reloadKey]);

  const fetchOrders = () => setReloadKey((key) => key + 1);

  // --- HANDLERS ---
  const handleStatusChange = (newStatus) => {
    setRequestedPage(1);
    setStatusFilter(newStatus);
  };

  const handleSortChange = (newSort) => {
    setRequestedPage(1);
    setSortBy(newSort);
  };

  const handleSearchChange = (e) => {
    setRequestedPage(1);
    setSearchTerm(e.target.value);
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages || newPage === requestedPage) return;
    setRequestedPage(newPage);
    // Bring the top of the list into view while the next page loads.
    if (ordersContainerRef.current) {
      const top = ordersContainerRef.current.getBoundingClientRect().top + window.pageYOffset - 100;
      if (window.pageYOffset > top) window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  const isPaging = loading && orders.length > 0;

  const displayOrders = orders;

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };
  const formatTime = (dateString) => (dateString
    ? new Date(dateString).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    : '');

  const filtering = Boolean(searchTerm || statusFilter !== 'all');

  // --- PAGINATION ---
  const PaginationControls = () => {
    // 1 … 4 5 [6] 7 8 … 20
    const pageNumbers = (() => {
      const pages = [];
      const start = Math.max(1, Math.min(requestedPage - 2, totalPages - 4));
      const end = Math.min(totalPages, start + 4);
      if (start > 1) pages.push(1);
      if (start > 2) pages.push('gap-start');
      for (let i = start; i <= end; i++) pages.push(i);
      if (end < totalPages - 1) pages.push('gap-end');
      if (end < totalPages) pages.push(totalPages);
      return pages;
    })();

    const first = (currentPage - 1) * PAGE_SIZE + 1;
    const last = Math.min(currentPage * PAGE_SIZE, totalCount);
    const canPrev = requestedPage > 1;
    const canNext = requestedPage < totalPages;

    return (
      <nav aria-label="Orders pages" className="kko-pages">
        <p aria-live="polite">Showing <b>{first}–{last}</b> of <b>{totalCount}</b></p>
        <div>
          <button type="button" className="kko-pg" onClick={() => handlePageChange(requestedPage - 1)} disabled={!canPrev} aria-label="Previous page">←</button>
          {pageNumbers.map((page) => (typeof page !== 'number' ? (
            <span key={page} className="kko-pg-gap" aria-hidden="true">…</span>
          ) : (
            <button key={page} type="button" onClick={() => handlePageChange(page)}
              aria-current={page === requestedPage ? 'page' : undefined} aria-label={`Page ${page}`}
              className={`kko-pg num ${page === requestedPage ? 'on' : ''}`}>
              {page === requestedPage && loading ? <span className="kko-spin" aria-hidden="true" /> : page}
            </button>
          )))}
          <button type="button" className="kko-pg" onClick={() => handlePageChange(requestedPage + 1)} disabled={!canNext} aria-label="Next page">→</button>
        </div>
      </nav>
    );
  };

  const OrderRow = ({ order, index }) => {
    const items = order.items || [];
    const firstItem = items[0];
    const pairs = items.reduce((n, item) => n + (Number(item.quantity) || 1), 0);
    const more = items.length - 1;
    const price = orderPrice(order);
    const status = orderStatus(order.status, order.is_self_handled);

    return (
      <motion.li
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: Math.min(index, 8) * 0.04, ease: [0.77, 0, 0.18, 1] }}
      >
        <Link to={`/orders/${order.reference_code}`} className="kko-card">
          <span className="kko-card-top">
            <span className={`kk-st ${status.tone}`}>{status.label}</span>
            <span className="kko-date">{formatDate(order.created_at)} · {formatTime(order.created_at)}</span>
          </span>
          <span className="kko-ref">#{order.reference_code}</span>
          <span className="kko-what">
            <span className="kko-thumb" aria-hidden="true">
              {firstItem?.service?.image
                ? <img src={firstItem.service.image} alt="" loading="lazy" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                : <svg viewBox="0 0 24 24" width="22" height="22"><path d="M3 15c0-3 2-5 5-5h2l3 3h6c1.7 0 2 1.4 2 2v2H3z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /></svg>}
            </span>
            <span className="kko-what-text">
              <span className="kko-svc">{firstItem?.service?.name || 'Sneaker Klean'}{more > 0 && <i> +{more} more</i>}</span>
              <span className="kko-pairs">{pairs} {pairs === 1 ? 'pair' : 'pairs'}</span>
            </span>
          </span>
          <span className="kko-foot">
            <span className="kko-total">
              {price.was > 0 && <s>₵{price.was.toFixed(2)}</s>}
              {price.label
                ? <span className={`kko-amt small ${price.voucher ? 'g' : 'a'}`}>{price.label}</span>
                : <span className="kko-amt">₵{price.total.toFixed(2)}</span>}
              {!price.label && price.voucher && <span className="kko-note g">Voucher applied</span>}
              {!price.label && !price.voucher && price.free && <span className="kko-note a">Free signup service</span>}
            </span>
            <span className="kko-view">View <span className="kko-ar" aria-hidden="true">→</span></span>
          </span>
        </Link>
      </motion.li>
    );
  };

  const statusOptions = [
    { value: 'all', label: 'All statuses' },
    { value: 'pending', label: 'Pending' },
    { value: 'processing', label: 'Processing' },
    { value: 'pickup', label: 'Pickup' },
    { value: 'cleaning_ongoing', label: 'Cleaning' },
    { value: 'cleaning_completed', label: 'Clean' },
    { value: 'scheduled_for_delivery', label: 'Delivery booked' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  const sortOptions = [
    { value: 'newest', label: 'Newest first' },
    { value: 'oldest', label: 'Oldest first' },
    { value: 'total_high', label: 'Total: high to low' },
    { value: 'total_low', label: 'Total: low to high' }
  ];

  return (
    <div className="kko">
      <style>{`
        .kko{--ink:#0A0B0A;--paper:#F7F9F6;--line:#D9DFD7;--muted:#4D564C;--green:#1A7A1A;
          --display:"Anton","Arial Narrow",Impact,sans-serif;--spring:cubic-bezier(.2,1.25,.3,1);--swift:cubic-bezier(.77,0,.18,1);
          background:var(--paper);color:var(--ink);font-family:"League Spartan",system-ui,sans-serif;min-height:100vh}
        ${STATUS_TAG_CSS}
        .kko-wrap{max-width:1200px;margin:0 auto;padding:0 20px 72px}
        .kko-eyebrow{margin:0;font-size:12px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:var(--green)}
        .kko-hero{display:flex;align-items:flex-end;justify-content:space-between;gap:20px;padding:48px 0 28px;border-bottom:2px solid var(--ink)}
        .kko-hero h1{margin:8px 0 0;font-family:var(--display);font-weight:400;text-transform:uppercase;font-size:clamp(56px,8vw,104px);line-height:.88}
        .kko-count{margin:0;display:flex;flex-direction:column;align-items:flex-end;text-align:right;flex:none}
        .kko-count b{font-family:var(--display);font-weight:400;font-size:clamp(56px,8vw,104px);line-height:.88;color:var(--green);font-variant-numeric:tabular-nums}
        .kko-count span{margin-top:8px;font-size:12px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:var(--muted)}
        .kko-hero p.sub{margin:12px 0 0;color:var(--muted);font-size:17px}
        .kko-btn{display:inline-flex;align-items:center;justify-content:center;gap:10px;height:52px;padding:0 22px;border:2px solid var(--green);border-radius:2px;
          background:var(--green);color:#fff;font:inherit;font-size:15px;font-weight:700;text-decoration:none;cursor:pointer;transition:background .2s,border-color .2s,color .2s}
        .kko-btn .ar{transition:transform .3s var(--spring)}
        .kko-btn:hover{background:var(--ink);border-color:var(--ink);color:#fff}
        .kko-btn:hover .ar{transform:translateX(5px)}
        .kko-btn.ghost{background:transparent;color:var(--ink);border-color:var(--ink)}
        .kko-btn.ghost:hover{background:var(--ink);color:#fff}
        .kko-tools{display:flex;flex-wrap:wrap;gap:10px;padding:20px 0}
        .kko-search{flex:1 1 260px;position:relative}
        .kko-search svg{position:absolute;left:14px;top:50%;transform:translateY(-50%);color:var(--muted);pointer-events:none}
        .kko-search input,.kko-sel select{width:100%;height:48px;border:1.5px solid var(--line);border-radius:2px;background:#fff;font:inherit;font-size:15px;color:var(--ink);
          outline:none;transition:border-color .2s,box-shadow .2s}
        .kko-search input{padding:0 14px 0 42px}
        .kko-search input:focus,.kko-sel select:focus{border-color:var(--ink);box-shadow:0 3px 0 0 var(--green)}
        .kko-sel{position:relative;flex:0 1 210px}
        .kko-sel select{appearance:none;-webkit-appearance:none;padding:0 38px 0 14px;cursor:pointer}
        .kko-sel::after{content:"";position:absolute;right:16px;top:50%;width:8px;height:8px;border-right:2px solid var(--ink);border-bottom:2px solid var(--ink);transform:translateY(-70%) rotate(45deg);pointer-events:none}
        .kko-list{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:20px;position:relative;transition:opacity .2s}
        .kko-list > li{min-width:0}
        .kko-list.paging{opacity:.5;pointer-events:none}
        .kko-progress{position:absolute;left:0;right:0;top:-12px;height:2px;overflow:hidden}
        .kko-progress::after{content:"";position:absolute;top:0;bottom:0;width:30%;background:var(--green);animation:kkoSlide 1s var(--swift) infinite}
        @keyframes kkoSlide{from{left:-30%}to{left:100%}}
        .kko-card{height:100%;display:flex;flex-direction:column;gap:14px;padding:20px;background:#fff;border:1px solid var(--line);color:var(--ink);text-decoration:none;
          transition:transform .4s var(--spring),border-color .2s,box-shadow .3s}
        .kko-card:hover{transform:translateY(-4px);border-color:var(--ink);box-shadow:0 18px 40px -28px rgba(10,11,10,.45)}
        .kko-card:focus-visible{outline:2px solid var(--green);outline-offset:3px}
        .kko-card-top{display:flex;justify-content:space-between;align-items:center;gap:10px}
        .kko-date{font-size:13px;color:var(--muted);text-align:right}
        .kko-ref{font-family:var(--display);font-size:34px;line-height:.95;letter-spacing:.01em;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .kko-what{display:flex;align-items:center;gap:12px;padding:10px;background:var(--paper);border:1px solid var(--line)}
        .kko-thumb{flex:none;width:52px;height:52px;display:grid;place-items:center;background:#fff;border:1px solid var(--line);overflow:hidden;color:var(--muted)}
        .kko-thumb img{width:100%;height:100%;object-fit:cover}
        .kko-what-text{display:flex;flex-direction:column;gap:2px;min-width:0}
        .kko-svc{font-size:16px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .kko-svc i{font-style:normal;font-weight:500;color:var(--green)}
        .kko-pairs{font-size:13px;color:var(--muted)}
        .kko-foot{display:flex;justify-content:space-between;align-items:flex-end;gap:12px;margin-top:auto;padding-top:14px;border-top:2px solid var(--ink)}
        .kko-total{display:flex;flex-direction:column;gap:2px;min-width:0}
        .kko-total s{font-size:13px;color:var(--muted)}
        .kko-amt{font-family:var(--display);font-size:34px;line-height:1;font-variant-numeric:tabular-nums}
        .kko-amt.small{font-family:inherit;font-size:15px;font-weight:700}
        .kko-amt.g,.kko-note.g{color:var(--green)}
        .kko-amt.a,.kko-note.a{color:#9A5B00}
        .kko-note{font-size:12px;font-weight:600}
        .kko-view{display:inline-flex;align-items:center;gap:8px;font-size:13px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;transition:color .2s}
        .kko-ar{font-size:18px;transition:transform .3s var(--spring)}
        .kko-card:hover .kko-view{color:var(--green)}
        .kko-card:hover .kko-ar{transform:translateX(5px)}
        .kko-skel{height:250px;border:1px solid var(--line);background:linear-gradient(90deg,#fff 0%,rgba(217,223,215,.6) 50%,#fff 100%);background-size:200% 100%;animation:kkoShim 1.3s linear infinite}
        @keyframes kkoShim{to{background-position:-200% 0}}
        .kko-empty{padding:64px 24px;border:2px dashed var(--line);text-align:center;margin-top:20px}
        .kko-empty h2{margin:0;font-family:var(--display);font-weight:400;text-transform:uppercase;font-size:44px;line-height:.95}
        .kko-empty p{margin:12px auto 22px;max-width:42ch;color:var(--muted)}
        .kko-empty.err h2{color:#B42318}
        .kko-pages{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:14px;margin-top:24px}
        .kko-pages p{margin:0;font-size:14px;color:var(--muted)}
        .kko-pages p b{color:var(--ink)}
        .kko-pages div{display:flex;align-items:center;gap:6px}
        .kko-pg{min-width:42px;height:42px;padding:0 10px;display:inline-grid;place-items:center;border:1.5px solid var(--line);border-radius:2px;background:#fff;
          font:inherit;font-size:15px;font-weight:700;color:var(--ink);cursor:pointer;transition:border-color .2s,background .2s,color .2s}
        .kko-pg:hover:not(:disabled){border-color:var(--ink)}
        .kko-pg.on{background:var(--ink);border-color:var(--ink);color:#fff}
        .kko-pg:disabled{opacity:.35;cursor:default}
        .kko-pg-gap{width:20px;text-align:center;color:var(--muted)}
        .kko-spin{width:14px;height:14px;border-radius:50%;border:2px solid rgba(255,255,255,.35);border-top-color:#fff;animation:kkoSpin .8s linear infinite}
        @keyframes kkoSpin{to{transform:rotate(360deg)}}
        @media (max-width:640px){
          .kko-hero{padding:34px 0 22px}
          .kko-sel{flex:1 1 calc(50% - 5px)}
          .kko-list{grid-template-columns:1fr;gap:14px}
          .kko-card{padding:18px 16px}
          .kko-ref{font-size:30px}
          .kko-pages{flex-direction:column-reverse}
          .kko-pages div{gap:4px}
          .kko-pg{min-width:34px;height:40px;padding:0 6px;font-size:14px}
          .kko-pg-gap{width:14px}
        }
        @media (prefers-reduced-motion:reduce){.kko-progress::after,.kko-skel{animation:none}}
      `}</style>

      <div className="kko-wrap">
        <header className="kko-hero">
          <div>
            <p className="kko-eyebrow">Your account</p>
            <h1>Orders</h1>
            <p className="sub">{totalCount > 0 ? 'Track every pair, from pickup to fresh.' : 'Your order history will appear here.'}</p>
          </div>
          {totalCount > 0 && (
            <p className="kko-count" aria-label={`${totalCount} orders in total`}>
              <b>{String(totalCount).padStart(2, '0')}</b>
              <span>{totalCount === 1 ? 'Order' : 'Orders'} total</span>
            </p>
          )}
        </header>

        <div className="kko-tools">
          <label className="kko-search">
            <span className="sr-only">Search orders</span>
            <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" strokeWidth="2" /><path d="M15.5 15.5L21 21" stroke="currentColor" strokeWidth="2" /></svg>
            <input type="search" placeholder="Search by order number or service" value={searchTerm} onChange={handleSearchChange} />
          </label>
          <label className="kko-sel">
            <span className="sr-only">Status</span>
            <select value={statusFilter} onChange={(e) => handleStatusChange(e.target.value)}>
              {statusOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </label>
          <label className="kko-sel">
            <span className="sr-only">Sort</span>
            <select value={sortBy} onChange={(e) => handleSortChange(e.target.value)}>
              {sortOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </label>
        </div>

        <div ref={ordersContainerRef}>
          {loading && orders.length === 0 && !error ? (
            <ul className="kko-list" aria-busy="true" aria-label="Loading your orders">
              {Array.from({ length: 6 }, (_, i) => <li key={i} className="kko-skel" />)}
            </ul>
          ) : error ? (
            <div className="kko-empty err" role="alert">
              <h2>Couldn't load orders</h2>
              <p>{error}</p>
              <button type="button" className="kko-btn ghost" onClick={fetchOrders}>Try again</button>
            </div>
          ) : displayOrders.length === 0 ? (
            <div className="kko-empty">
              <h2>{filtering ? 'No matches' : 'No orders yet'}</h2>
              <p>{filtering ? 'Nothing matches that search or filter. Try another, or clear them.' : 'Book your first Klean and you can follow every step of it here.'}</p>
              {filtering ? (
                <button type="button" className="kko-btn ghost" onClick={() => { setSearchTerm(''); handleStatusChange('all'); }}>Clear filters</button>
              ) : (
                <Link to="/services" className="kko-btn">Book your first Klean <span className="ar" aria-hidden="true">→</span></Link>
              )}
            </div>
          ) : (
            <>
              <ol ref={ordersGridRef} className={`kko-list ${isPaging ? 'paging' : ''}`} aria-busy={isPaging}>
                {isPaging && <li className="kko-progress" aria-hidden="true" />}
                {displayOrders.map((order, i) => <OrderRow key={order.reference_code} order={order} index={i} />)}
              </ol>
              {totalPages > 1 && <PaginationControls />}
            </>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default MyOrders;
