import React, { useEffect, useState, useContext, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';
import {
  FaShoppingCart,
  FaSpinner,
  FaExclamationCircle,
  FaCheckCircle,
  FaInfoCircle,
  FaTimesCircle,
  FaChevronRight,
  FaChevronLeft,
  FaBoxOpen,
  FaSearch,
  FaBroom,
  FaTruck,
  FaCalendarAlt,
  FaCheckDouble,
  FaFilter,
  FaSort,
  FaClock,
  FaEllipsisH,
  FaGift,
  FaTag
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import Footer from '../components/Footer';
import api from '../api';
import { orderPrice } from '../utils/orderPrice';

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

  const getStatusDisplay = (status) => {
    const statusConfig = {
      pending: {
        icon: <FaInfoCircle className="text-blue-500" />,
        color: 'text-blue-700',
        bg: 'bg-blue-100',
        border: 'border-blue-200',
        displayText: 'Pending'
      },
      processing: {
        icon: <FaSpinner className="animate-spin text-amber-500" />,
        color: 'text-amber-700',
        bg: 'bg-amber-100',
        border: 'border-amber-200',
        displayText: 'Processing'
      },
      pickup: {
        icon: <FaTruck className="text-indigo-500" />,
        color: 'text-indigo-700',
        bg: 'bg-indigo-100',
        border: 'border-indigo-200',
        displayText: 'Pickup'
      },
      cleaning_ongoing: {
        icon: <FaBroom className="text-purple-500" />,
        color: 'text-purple-700',
        bg: 'bg-purple-100',
        border: 'border-purple-200',
        displayText: 'Cleaning Ongoing'
      },
      cleaning_completed: {
        icon: <FaCheckDouble className="text-green-500" />,
        color: 'text-green-700',
        bg: 'bg-green-100',
        border: 'border-green-200',
        displayText: 'Cleaning Completed'
      },
      scheduled_for_delivery: {
        icon: <FaCalendarAlt className="text-teal-500" />,
        color: 'text-teal-700',
        bg: 'bg-teal-100',
        border: 'border-teal-200',
        displayText: 'Scheduled for Delivery'
      },
      delivered: {
        icon: <FaCheckCircle className="text-emerald-500" />,
        color: 'text-emerald-700',
        bg: 'bg-emerald-100',
        border: 'border-emerald-200',
        displayText: 'Delivered'
      },
      cancelled: {
        icon: <FaTimesCircle className="text-rose-500" />,
        color: 'text-rose-700',
        bg: 'bg-rose-100',
        border: 'border-rose-200',
        displayText: 'Cancelled'
      },
      default: {
        icon: <FaInfoCircle className="text-gray-500" />,
        color: 'text-gray-700',
        bg: 'bg-gray-100',
        border: 'border-gray-200',
        displayText: 'Unknown'
      }
    };
    const statusKey = status?.toLowerCase().replace(/ /g, '_') || 'default';
    const config = statusConfig[statusKey] || statusConfig.default;
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${config.bg} ${config.color} ${config.border} border`}>
        {config.icon}
        {config.displayText}
      </span>
    );
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

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
    const navButton = 'inline-flex items-center gap-2 h-10 px-3 sm:px-4 rounded-lg border text-sm font-medium transition-colors';
    const navState = (enabled) => (enabled
      ? 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50 cursor-pointer'
      : 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed');

    return (
      <nav
        aria-label="Orders pages"
        className="mt-8 flex flex-col-reverse sm:flex-row items-center justify-between gap-4"
      >
        <p className="text-sm text-gray-500" aria-live="polite">
          Showing <span className="font-medium text-gray-900">{first}–{last}</span> of{' '}
          <span className="font-medium text-gray-900">{totalCount}</span> orders
        </p>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => handlePageChange(requestedPage - 1)}
            disabled={!canPrev}
            aria-label="Previous page"
            className={`${navButton} ${navState(canPrev)}`}
          >
            <FaChevronLeft className="w-3 h-3" aria-hidden="true" />
            <span className="hidden sm:inline">Previous</span>
          </button>

          {/* Page numbers on larger screens, "2 / 5" on phones */}
          <span className="sm:hidden px-3 text-sm text-gray-600">
            <span className="font-medium text-gray-900">{requestedPage}</span> / {totalPages}
          </span>
          <div className="hidden sm:flex items-center gap-1">
            {pageNumbers.map((page) =>
              typeof page !== 'number' ? (
                <span key={page} className="w-8 text-center text-gray-400" aria-hidden="true">
                  <FaEllipsisH className="inline w-3 h-3" />
                </span>
              ) : (
                <button
                  key={page}
                  type="button"
                  onClick={() => handlePageChange(page)}
                  aria-current={page === requestedPage ? 'page' : undefined}
                  aria-label={`Page ${page}`}
                  className={`inline-flex items-center justify-center min-w-10 h-10 px-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                    page === requestedPage ? 'bg-primary text-white' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {page === requestedPage && loading ? (
                    <FaSpinner className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                  ) : (
                    page
                  )}
                </button>
              )
            )}
          </div>

          <button
            type="button"
            onClick={() => handlePageChange(requestedPage + 1)}
            disabled={!canNext}
            aria-label="Next page"
            className={`${navButton} ${navState(canNext)}`}
          >
            <span className="hidden sm:inline">Next</span>
            <FaChevronRight className="w-3 h-3" aria-hidden="true" />
          </button>
        </div>
      </nav>
    );
  };

  // Skeleton cards while the first page loads
  const OrderCardSkeleton = () => (
    <div className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse" aria-hidden="true">
      <div className="flex justify-between items-center mb-3">
        <div className="h-5 w-32 bg-gray-200 rounded" />
        <div className="h-6 w-24 bg-gray-100 rounded-full" />
      </div>
      <div className="h-4 w-28 bg-gray-100 rounded mb-5" />
      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg mb-5">
        <div className="w-12 h-12 bg-gray-200 rounded-lg" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-3/4 bg-gray-200 rounded" />
          <div className="h-3 w-1/3 bg-gray-100 rounded" />
        </div>
      </div>
      <div className="flex justify-between items-center border-t border-gray-100 pt-4">
        <div className="h-4 w-12 bg-gray-200 rounded" />
        <div className="h-5 w-20 bg-gray-200 rounded" />
      </div>
      <div className="h-11 w-full bg-gray-100 rounded-lg mt-4" />
    </div>
  );

  // --- REDESIGNED ORDER CARD COMPONENT ---
  const OrderCard = ({ order }) => {
    const firstItem = order.items?.[0];
    const additionalItemsCount = order.items?.length - 1;
    const price = orderPrice(order);

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300"
      >
        <div className="p-5">
          {/* Order Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center gap-2 mb-2">
                <h2 className="text-lg font-bold text-gray-900 truncate">#{order.reference_code}</h2>
                {getStatusDisplay(order.status)}
              </div>
              <div className="flex items-center gap-1.5 text-sm text-gray-500">
                <FaClock className="text-gray-400" />
                {formatDateTime(order.created_at)}
              </div>
            </div>
          </div>

          {/* Order Items - Simplified */}
          <div className="mb-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              {firstItem?.service?.image ? (
                <img
                  src={firstItem.service.image}
                  alt={firstItem.service.name}
                  className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                  onError={(e) => { 
                    e.target.onerror = null; 
                    e.target.src = 'https://placehold.co/100x100/A0AEC0/ffffff?text=Item'; 
                  }}
                />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0">
                  <FaBoxOpen className="text-gray-400 text-lg" />
                </div>
              )}
              
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-gray-900 truncate">
                  {firstItem?.service?.name || 'Service Item'}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Qty: {firstItem?.quantity || 1}
                  {additionalItemsCount > 0 && (
                    <span className="ml-2 text-primary font-medium">
                      +{additionalItemsCount} more item{additionalItemsCount > 1 ? 's' : ''}
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Order total */}
          <div className="border-t border-gray-100 pt-4">
            <div className="flex justify-between items-center gap-3">
              <span className="text-base font-semibold text-gray-900">Total</span>
              <div className="flex items-center gap-3">
                {price.was > 0 && (
                  <span className="text-xs text-gray-400 line-through">₵{price.was.toFixed(2)}</span>
                )}
                {price.label ? (
                  <span className={`inline-flex items-center gap-1.5 text-lg font-bold ${price.voucher ? 'text-green-700' : 'text-amber-700'}`}>
                    {price.voucher ? <FaGift className="w-4 h-4" aria-hidden="true" /> : <FaTag className="w-4 h-4" aria-hidden="true" />}
                    {price.label}
                  </span>
                ) : (
                  <span className="text-lg font-bold text-green-700">₵{price.total.toFixed(2)}</span>
                )}
              </div>
            </div>
            {price.voucher && !price.label && (
              <p className="mt-1 text-right text-xs text-green-700">Voucher applied</p>
            )}
            {price.free && !price.voucher && !price.label && (
              <p className="mt-1 text-right text-xs text-amber-700">Includes a free signup service</p>
            )}
          </div>

          <Link
            to={`/orders/${order.reference_code}`}
            className="mt-4 inline-flex items-center justify-center w-full px-4 py-3 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/70 transition-colors"
          >
            View Details
          </Link>
        </div>
      </motion.div>
    );
  };

  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'pending', label: 'Pending' },
    { value: 'processing', label: 'Processing' },
    { value: 'pickup', label: 'Pickup' },
    { value: 'cleaning_ongoing', label: 'Cleaning Ongoing' },
    { value: 'cleaning_completed', label: 'Cleaning Completed' },
    { value: 'scheduled_for_delivery', label: 'Scheduled for Delivery' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'total_high', label: 'Total: High to Low' },
    { value: 'total_low', label: 'Total: Low to High' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 pt-8">
      <div className="px-6 md:px-8 lg:px-24 mb-12">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
              <p className="text-gray-500 mt-2">
                {totalCount > 0 
                  ? `Manage and track your laundry orders` 
                  : 'Your order history will appear here'}
              </p>
            </div>
            
            <Link
              to="/services"
              className="inline-flex items-center justify-center px-5 py-3 bg-gradient-to-r from-green-600 to-green-600 text-white font-medium rounded-lg hover:from-green-500 hover:to-green-500 transition-all shadow-md hover:shadow-lg cursor-pointer"
            >
              <FaShoppingCart className="mr-2" />
              New Order
            </Link>
          </div>

          {/* Filters and Search */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaSearch className="text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search orders..."
                  className="pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary w-full text-sm"
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaFilter className="text-gray-400" />
                  </div>
                  <select
                    className="pl-10 pr-8 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary appearance-none text-sm"
                    value={statusFilter}
                    onChange={(e) => handleStatusChange(e.target.value)}
                  >
                    {statusOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaSort className="text-gray-400" />
                  </div>
                  <select
                    className="pl-10 pr-8 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary appearance-none text-sm"
                    value={sortBy}
                    onChange={(e) => handleSortChange(e.target.value)}
                  >
                    {sortOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div ref={ordersContainerRef}>
          {loading && orders.length === 0 && !error ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6" aria-busy="true" aria-label="Loading your orders">
              {Array.from({ length: 6 }, (_, i) => <OrderCardSkeleton key={i} />)}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-4 bg-white rounded-xl shadow-xs border border-gray-100">
              <FaExclamationCircle className="text-red-500 text-4xl" />
              <p className="text-gray-700 max-w-md text-center">{error}</p>
              <button 
                onClick={fetchOrders}
                className="px-5 py-2.5 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
              >
                Try Again
              </button>
            </div>
          ) : displayOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl shadow-xs border border-gray-100">
              <FaBoxOpen className="text-gray-300 text-6xl mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {searchTerm || statusFilter !== 'all' ? 'No orders found' : 'No orders yet'}
              </h3>
              <p className="text-gray-500 mb-6 text-center">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filters'
                  : 'Get started by placing your first order'}
              </p>
              <Link
                to="/services"
                className="px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary/70 transition-all"
              >
                Place Your First Order
              </Link>
            </div>
          ) : (
            <>
              {/* Orders grid: while another page loads, keep these visible but dimmed */}
              <div className="relative" aria-busy={isPaging}>
                {isPaging && (
                  <div className="absolute inset-x-0 -top-3 h-1 overflow-hidden rounded-full bg-primary/10" aria-hidden="true">
                    <div className="orders-progress h-full w-1/3 rounded-full bg-primary" />
                  </div>
                )}
                <div
                  ref={ordersGridRef}
                  className={`grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 transition-opacity duration-200 ${
                    isPaging ? 'opacity-50 pointer-events-none select-none' : ''
                  }`}
                >
                  <AnimatePresence>
                    {displayOrders.map((order) => (
                      <OrderCard key={order.reference_code} order={order} />
                    ))}
                  </AnimatePresence>
                </div>
              </div>

              {/* Pagination */}
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