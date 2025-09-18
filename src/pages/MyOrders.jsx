import React, { useEffect, useState, useContext } from 'react';
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
  FaBoxOpen,
  FaSearch,
  FaBroom,
  FaTruck,
  FaCalendarAlt,
  FaCheckDouble,
  FaFilter,
  FaSort,
  FaMoneyBillWave,
  FaMapMarkerAlt,
  FaClock
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

const MyOrders = () => {
  const { isAuthenticated, user, api } = useContext(AuthContext);
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await api.get('/api/orders/');
        console.log(response.data);
        setOrders(response.data);
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError('Failed to load orders. Please try again.');
        toast.error('Failed to load orders', {
          position: 'top-right',
          autoClose: 3000,
        });
      } finally {
        setLoading(false);
      }
    };

    if (!isAuthenticated) {
      setLoading(false);
      setError('Please log in to view your orders.');
      navigate('/login');
      return;
    }
    if (user && !user.is_verified) {
      setLoading(false);
      setError('Please verify your email to view orders.');
      navigate(`/temp-verify-email/?email=${user.email}`);
      toast.warn('Please verify your email before viewing orders.');
      return;
    }
    fetchOrders();
  }, [isAuthenticated, user, navigate]);

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

  const filteredOrders = orders
    .filter(order => {
      const matchesSearch = 
        order.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.status.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || 
        order.status.toLowerCase().replace(/ /g, '_') === statusFilter;
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.created_at) - new Date(a.created_at);
      } else if (sortBy === 'oldest') {
        return new Date(a.created_at) - new Date(b.created_at);
      } else if (sortBy === 'total_high') {
        return parseFloat(b.total) - parseFloat(a.total);
      } else if (sortBy === 'total_low') {
        return parseFloat(a.total) - parseFloat(b.total);
      }
      return 0;
    });

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
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

  const OrderItemCard = ({ item }) => (
    <div className="flex items-center p-3 rounded-lg bg-white border border-gray-100 shadow-xs hover:shadow-sm transition-all duration-200">
      <div className="w-14 h-14 rounded-md bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center overflow-hidden">
        {item.service.image ? (
          <img
            src={item.service.image}
            alt={item.service.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <FaBoxOpen className="text-gray-400 text-lg" />
        )}
      </div>
      <div className="ml-4 flex-1 min-w-0">
        <h4 className="text-sm font-medium text-gray-900 truncate">{item.service.name}</h4>
        <p className="text-xs text-gray-500 mt-1">GHS {parseFloat(item.service.price).toFixed(2)} × {item.quantity}</p>
      </div>
      <div className="text-sm font-medium text-gray-900">
        GHS {(parseFloat(item.service.price) * parseInt(item.quantity)).toFixed(2)}
      </div>
    </div>
  );

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
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-24">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Order History</h1>
              <p className="text-gray-500 mt-2">
                {orders.length > 0 
                  ? `You have ${orders.length} order${orders.length !== 1 ? 's' : ''} in total` 
                  : 'Your order history will appear here'}
              </p>
            </div>
            
            <Link
              to="/services"
              className="inline-flex items-center justify-center px-5 py-3 bg-gradient-to-r from-green-600 to-primary text-white font-medium rounded-lg hover:from-green-500 hover:to-primary transition-all shadow-md hover:shadow-lg"
            >
              <FaShoppingCart className="mr-2" />
              Browse Services
            </Link>
          </div>

          {/* Stats Cards */}
          {/* {orders.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-xl p-4 shadow-xs border border-gray-100">
                <div className="text-sm text-gray-500">Total Orders</div>
                <div className="text-2xl font-bold text-gray-900">{orders.length}</div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-xs border border-gray-100">
                <div className="text-sm text-gray-500">Active Orders</div>
                <div className="text-2xl font-bold text-blue-600">
                  {orders.filter(o => !['delivered', 'cancelled'].includes(o.status.toLowerCase().replace(/ /g, '_'))).length}
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-xs border border-gray-100">
                <div className="text-sm text-gray-500">Total Spent</div>
                <div className="text-2xl font-bold text-gray-900">
                  GHS {orders.reduce((sum, order) => sum + parseFloat(order.total), 0).toFixed(2)}
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-xs border border-gray-100">
                <div className="text-sm text-gray-500">Avg. Order</div>
                <div className="text-2xl font-bold text-gray-900">
                  GHS {(orders.reduce((sum, order) => sum + parseFloat(order.total), 0) / (orders.length || 1)).toFixed(2)}
                </div>
              </div>
            </div>
          )} */}

          {/* Filters and Search */}
          <div className="bg-white rounded-xl p-4 shadow-xs border border-gray-100 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaSearch className="text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search by order # or status..."
                  className="pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaFilter className="text-gray-400" />
                  </div>
                  <select
                    className="pl-10 pr-8 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
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
                    className="pl-10 pr-8 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
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
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-4 bg-white rounded-xl shadow-xs border border-gray-100">
            <FaSpinner className="animate-spin text-primary text-4xl" />
            <p className="text-gray-600">Loading your orders...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-4 bg-white rounded-xl shadow-xs border border-gray-100">
            <FaExclamationCircle className="text-red-500 text-4xl" />
            <p className="text-gray-700 max-w-md text-center">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
            >
              Refresh Page
            </button>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl shadow-xs border border-gray-100">
            <div className="relative mb-6">
              <FaBoxOpen className="text-gray-300 text-6xl" />
              <div className="absolute -inset-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-full opacity-60"></div>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {searchTerm || statusFilter !== 'all' ? 'No orders found' : 'No orders yet'}
            </h3>
            <p className="text-gray-500 mb-6 max-w-md text-center">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'When you place orders, they will appear here for tracking'}
            </p>
            <Link
              to="/services"
              className="px-6 py-3 bg-gradient-to-r from-green-600 to-primary text-white font-medium rounded-lg hover:from-green-500 hover:to-primary transition-all shadow-md hover:shadow-lg"
            >
              Explore Services
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            <AnimatePresence>
              {filteredOrders.map((order) => (
                <motion.div
                  key={order.slug}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-300"
                >
                  <div className="p-6">
                    {/* Order Header */}
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-3 mb-2">
                          <h2 className="text-xl font-semibold text-gray-900">Order #{order.slug}</h2>
                          {getStatusDisplay(order.status)}
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1.5">
                            <FaClock className="text-gray-400" />
                            Placed on {formatDateTime(order.created_at)}
                          </span>
                        </div>
                      </div>
                      
                      <Link
                        to={`/orders/${order.slug}`}
                        className="flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/60 transition-colors font-medium group"
                      >
                        View Details
                        <FaChevronRight className="text-xs transition-transform group-hover:translate-x-0.5" />
                      </Link>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Order Items */}
                      <div className="lg:col-span-2">
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                          <span>Order Items</span>
                          <span className="h-px flex-1 bg-gray-200"></span>
                        </h3>
                        <div className="grid grid-cols-1 gap-3">
                          {order.items?.slice(0, 3).map((item, index) => (
                            <OrderItemCard key={index} item={item} />
                          ))}
                          {order.items?.length > 3 && (
                            <div className="text-center py-3 text-sm text-gray-500 bg-gray-50 rounded-lg">
                              +{order.items.length - 3} more items
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Order Summary */}
                      <div className="lg:col-span-1">
                        <div className="bg-gray-50 p-5 rounded-lg border border-gray-100">
                          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <span>Order Summary</span>
                            <span className="h-px flex-1 bg-gray-200"></span>
                          </h3>
                          <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Subtotal</span>
                              <span className="font-medium">GHS {parseFloat(order.subtotal).toFixed(2)}</span>
                            </div>

                            {order.discounts_applied?.map((discount, index) => {
                              // Check if the current discount is the "redeemed_points" type
                              const isRedeemedPoints = discount.discount_type === "redeemed_points";
                              
                              // Determine the percentage to display
                              // Use the specific percentage from the order object if it's the redeemed points discount
                              const percentageToDisplay = isRedeemedPoints 
                                  ? (order.redeemed_discount_percentage || 0) 
                                  : (discount.percentage || 0);

                              // Calculate the discounted amount
                              const discountAmount = parseFloat(order.subtotal * percentageToDisplay / 100).toFixed(2);

                              return (
                                  <div key={index} className="flex justify-between text-emerald-600">
                                      <span className='capitalize'>
                                          {discount.discount_type} Discount ({percentageToDisplay}%)
                                      </span>
                                      <span className="font-medium">-GHS {discountAmount}</span>
                                  </div>
                              );
                            })}


                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Delivery</span>
                              <span className="font-medium">{order.delivery_cost ? `GHS ${parseFloat(order.delivery_cost).toFixed(2)}` : 'N/A'}</span>
                            </div>
                            
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Pickup</span>
                              <span className="font-medium">{order.pickup_cost ? `GHS ${parseFloat(order.pickup_cost).toFixed(2)}` : 'N/A'}</span>
                            </div>

                            <div className="border-t border-gray-200 pt-3 flex justify-between text-base">
                              <span className="font-semibold">Total</span>
                              <span className="font-bold">
                                {order.discounts_applied && order.discounts_applied.length > 0 ? (
                                  <>
                                    <span className="text-gray-400 line-through mr-2 text-sm">
                                      GHS {(parseFloat(order.subtotal) + parseFloat(order.delivery_cost || 0) + parseFloat(order.pickup_cost || 0)).toFixed(2)}
                                    </span>
                                    GHS {parseFloat(order.total).toFixed(2)}
                                  </>
                                ) : (
                                  `GHS ${parseFloat(order.total).toFixed(2)}`
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyOrders;