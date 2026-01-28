import React, { useEffect, useState, useContext, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  FaEllipsisH
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import Footer from '../components/Footer';

// --- Constants ---
const PAGE_SIZE = 10;

const MyOrders = () => {
  const { isAuthenticated, user, api } = useContext(AuthContext);
  const navigate = useNavigate();
  const ordersContainerRef = useRef(null);
  const ordersGridRef = useRef(null);
  
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- PAGINATION AND FILTER STATE ---
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [nextUrl, setNextUrl] = useState(null);
  const [prevUrl, setPrevUrl] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  const totalPages = useMemo(() => Math.ceil(totalCount / PAGE_SIZE), [totalCount]);

  // --- FETCH FUNCTION ---
  const fetchOrders = async (page = currentPage, status = statusFilter, sort = sortBy) => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({
      page: page,
      page_size: PAGE_SIZE,
      status_filter: status === 'all' ? '' : status,
      sort_by: sort,
      search: searchTerm,
    });
    
    const queryString = params.toString().replace(/=(&|$)/g, '').replace(/&&/g, '&');
    const url = `/api/orders/?${queryString}`;

    try {
      const response = await api.get(url);
      
      setOrders(response.data.results || []);
      setTotalCount(response.data.count || 0);
      setNextUrl(response.data.next);
      setPrevUrl(response.data.previous);
      setCurrentPage(page);

      // Scroll to the orders grid section instead of window top
      if (ordersGridRef.current) {
        const headerOffset = 100; // Adjust based on your header height
        const elementPosition = ordersGridRef.current.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }

    } catch (err) {
      console.error('Error fetching orders:', err);
      const errorMessage = err.response?.data?.detail || 'Failed to load orders. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage, { position: 'top-right', autoClose: 3000 });
    } finally {
      setLoading(false);
    }
  };

  // --- EFFECT ---
  useEffect(() => {
    fetchOrders(currentPage, statusFilter, sortBy);
  }, [isAuthenticated, user, navigate, currentPage, statusFilter, sortBy, searchTerm]);

  // --- HANDLERS ---
  const handleStatusChange = (newStatus) => {
    setCurrentPage(1);
    setStatusFilter(newStatus);
  };

  const handleSortChange = (newSort) => {
    setCurrentPage(1);
    setSortBy(newSort);
  };
  
  const handleSearchChange = (e) => {
    setCurrentPage(1);
    setSearchTerm(e.target.value);
  }

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

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

  // --- BEAUTIFUL PAGINATION COMPONENT ---
  const PaginationControls = () => {
    const generatePageNumbers = () => {
      const pages = [];
      const maxVisiblePages = 5; // Reduced for better mobile experience
      let startPage = Math.max(1, currentPage - 2); // Adjusted for 5 pages
      let endPage = Math.min(totalPages, currentPage + 2);

      if (endPage - startPage + 1 < maxVisiblePages) {
        if (currentPage < totalPages / 2) {
          endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
        } else {
          startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }
      }

      // Always show first page
      if (startPage > 1) {
        pages.push(1);
        if (startPage > 2) {
          pages.push('ellipsis-start');
        }
      }

      // Middle pages
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }

      // Always show last page
      if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
          pages.push('ellipsis-end');
        }
        pages.push(totalPages);
      }

      return pages;
    };

    const pageNumbers = generatePageNumbers();

    return (
      <div className="w-full mt-6 bg-white p-4 sm:p-6 rounded-2xl shadow-lg border border-gray-100">
        {/* Mobile Layout - Stacked */}
        <div className="flex flex-col gap-4 sm:hidden">
          {/* Page Info Top */}
          <div className="text-center text-sm text-gray-600">
            Showing <span className="font-semibold text-gray-900">{(currentPage - 1) * PAGE_SIZE + 1}-{Math.min(currentPage * PAGE_SIZE, totalCount)}</span> of{' '}
            <span className="font-semibold text-gray-900">{totalCount}</span> orders
          </div>

          {/* Pagination Controls - Centered */}
          <div className="flex items-center justify-center w-full gap-1">
            {/* Previous Button */}
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={!prevUrl || loading}
              className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-lg transition-all duration-200 cursor-pointer text-xs sm:text-sm ${
                prevUrl && !loading
                  ? 'bg-primary text-white hover:bg-primary/90 shadow-md hover:shadow-lg'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              <FaChevronLeft className="w-2 h-2 sm:w-3 sm:h-3" />
            </button>

            {/* Page Numbers - Scrollable on mobile */}
            <div className="flex items-center gap-1 scrollbar-hide">
              {pageNumbers.map((page, index) => {
                if (page === 'ellipsis-start' || page === 'ellipsis-end') {
                  return (
                    <span
                      key={`ellipsis-${index}`}
                      className="flex items-center justify-center w-6 h-8 text-gray-400 flex-shrink-0"
                    >
                      <FaEllipsisH className="w-3 h-3" />
                    </span>
                  );
                }

                return (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`flex items-center justify-center w-8 h-8 rounded-lg font-medium transition-all duration-200 cursor-pointer text-xs sm:text-sm flex-shrink-0 ${
                      currentPage === page
                        ? 'bg-primary text-white shadow-lg scale-105'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 hover:border-primary hover:text-primary'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
            </div>

            {/* Next Button */}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={!nextUrl || loading}
              className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-lg transition-all duration-200 cursor-pointer text-xs sm:text-sm ${
                nextUrl && !loading
                  ? 'bg-primary text-white hover:bg-primary/90 shadow-md hover:shadow-lg'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              <FaChevronRight className="w-2 h-2 sm:w-3 sm:h-3" />
            </button>
          </div>

          {/* Page Info Bottom */}
          <div className="text-center text-sm text-gray-600">
            Page <span className="font-semibold text-gray-900">{currentPage}</span> of{' '}
            <span className="font-semibold text-gray-900">{totalPages}</span>
          </div>
        </div>

        {/* Desktop Layout - Horizontal */}
        <div className="hidden sm:flex flex-col lg:flex-row justify-between items-center gap-4 lg:gap-6">
          {/* Page Info Left */}
          <div className="text-sm text-gray-600 whitespace-nowrap">
            Showing <span className="font-semibold text-gray-900">{(currentPage - 1) * PAGE_SIZE + 1}-{Math.min(currentPage * PAGE_SIZE, totalCount)}</span> of{' '}
            <span className="font-semibold text-gray-900">{totalCount}</span> orders
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center gap-2">
            {/* Previous Button */}
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={!prevUrl || loading}
              className={`flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-200 cursor-pointer ${
                prevUrl && !loading
                  ? 'bg-primary text-white hover:bg-primary/90 shadow-md hover:shadow-lg transform hover:scale-105'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              <FaChevronLeft className="w-3 h-3" />
            </button>

            {/* Page Numbers */}
            <div className="flex items-center gap-1">
              {pageNumbers.map((page, index) => {
                if (page === 'ellipsis-start' || page === 'ellipsis-end') {
                  return (
                    <span
                      key={`ellipsis-${index}`}
                      className="flex items-center justify-center w-10 h-10 text-gray-400"
                    >
                      <FaEllipsisH className="w-4 h-4" />
                    </span>
                  );
                }

                return (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`flex items-center justify-center w-10 h-10 rounded-lg font-medium transition-all duration-200 cursor-pointer ${
                      currentPage === page
                        ? 'bg-primary text-white shadow-lg scale-105'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 hover:border-primary hover:text-primary'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
            </div>

            {/* Next Button */}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={!nextUrl || loading}
              className={`flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-200 cursor-pointer ${
                nextUrl && !loading
                  ? 'bg-primary text-white hover:bg-primary/90 shadow-md hover:shadow-lg transform hover:scale-105'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              <FaChevronRight className="w-3 h-3" />
            </button>
          </div>

          {/* Page Info Right */}
          <div className="text-sm text-gray-600 whitespace-nowrap">
            Page <span className="font-semibold text-gray-900">{currentPage}</span> of{' '}
            <span className="font-semibold text-gray-900">{totalPages}</span>
          </div>
        </div>
      </div>
    );
  };

  // --- REDESIGNED ORDER CARD COMPONENT ---
  const OrderCard = ({ order }) => {
    const firstItem = order.items?.[0];
    const additionalItemsCount = order.items?.length - 1;
    const hasDiscounts = order.is_discounted;
    const totalBeforeDiscount = order.total_before_discount; 

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

          {/* Order Summary - Simplified */}
          <div className="border-t border-gray-100 pt-4">
            <div className="space-y-2">
              {/* Final Total */}
              <div className="flex justify-between items-center pt-2">
                <span className="text-base font-semibold text-gray-900">Total</span>
                <div className="flex items-center gap-3">
                  {hasDiscounts && (
                    <div className="text-xs text-gray-500 line-through">
                      ₵{totalBeforeDiscount?.toFixed(2) || '0.00'}
                    </div>
                  )}
                  <div className="text-lg font-bold text-green-700">
                    ₵{parseFloat(order.total).toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
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
          {loading && orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-4 bg-white rounded-xl shadow-xs border border-gray-100">
              <FaSpinner className="animate-spin text-primary text-4xl" />
              <p className="text-gray-600">Loading your orders...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-4 bg-white rounded-xl shadow-xs border border-gray-100">
              <FaExclamationCircle className="text-red-500 text-4xl" />
              <p className="text-gray-700 max-w-md text-center">{error}</p>
              <button 
                onClick={() => fetchOrders(currentPage, statusFilter, sortBy)}
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
              {/* Orders Grid */}
              <div className="relative">
                <div ref={ordersGridRef} className={`transition-opacity duration-300 ${loading ? 'hidden' : ''}`}>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    <AnimatePresence>
                      {displayOrders.map((order) => (
                        <OrderCard key={order.reference_code} order={order} />
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
                
                {/* Loading Overlay */}
                {loading && (
                  <div className="flex flex-col items-center justify-center py-16 space-y-4 bg-white rounded-xl shadow-xs border border-gray-100">
                    <FaSpinner className="animate-spin text-primary text-4xl" />
                    <p className="text-gray-600">Loading your orders...</p>
                  </div>
                )}
              </div>
              
              {/* Beautiful Pagination */}
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