// src/pages/PartnerDashboard.jsx - Fixed status handling
import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';
import { 
  Building, 
  ShoppingBag, 
  DollarSign, 
  Package, 
  Clock, 
  CheckCircle,
  TrendingUp,
  Eye,
  LogOut,
  User,
  AlertCircle,
  XCircle,
  FileCheck,
  Mail,
  Ban,
  MinusCircle
} from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../api';

const PartnerDashboard = () => {
  const navigate = useNavigate();
  const { user, partnerData, isPartner, logout, refreshUserData } = useContext(AuthContext);
  const { clearCart } = useContext(CartContext);
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({
    total_orders: 0,
    total_spent: 0,
    pending_orders: 0,
    completed_orders: 0,
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [toastShown, setToastShown] = useState(false);

  // Get partner status from partnerData - with fallback to ACTIVE if not set
  // IMPORTANT: Check if status exists, if not default to ACTIVE for backward compatibility
  const partnerStatus = partnerData?.status || 'ACTIVE';
  
  // Log the status for debugging
  console.log('Partner Status:', partnerStatus);
  console.log('Full partnerData:', partnerData);
  
  // Determine if partner can place orders based on status
  const canPlaceOrders = partnerStatus === 'ACTIVE';
  const isUnderReview = partnerStatus === 'PENDING_REVIEW';
  const isSuspended = partnerStatus === 'SUSPENDED';
  const isRejected = partnerStatus === 'REJECTED';
  const isInactive = partnerStatus === 'INACTIVE';
  const isBlocked = !canPlaceOrders;

  // Get status display info
  const getStatusDisplay = () => {
    const statusMap = {
      'PENDING_REVIEW': {
        label: 'Under Review',
        color: 'amber',
        icon: Clock,
        message: 'Your account is being reviewed by our partnership team.',
        bgColor: 'from-amber-600 to-amber-700'
      },
      'ACTIVE': {
        label: 'Active',
        color: 'green',
        icon: CheckCircle,
        message: 'Your account is active and fully operational.',
        bgColor: 'from-primary to-primary/90'
      },
      'SUSPENDED': {
        label: 'Suspended',
        color: 'red',
        icon: AlertCircle,
        message: 'Your account has been suspended. Please contact support.',
        bgColor: 'from-red-600 to-red-700'
      },
      'REJECTED': {
        label: 'Rejected',
        color: 'red',
        icon: XCircle,
        message: 'Your partnership application has been rejected.',
        bgColor: 'from-red-600 to-red-700'
      },
      'INACTIVE': {
        label: 'Inactive',
        color: 'gray',
        icon: MinusCircle,
        message: 'Your account is currently inactive.',
        bgColor: 'from-gray-600 to-gray-700'
      },
    };
    return statusMap[partnerStatus] || statusMap['ACTIVE']; // Default to ACTIVE if status not found
  };

  const statusDisplay = getStatusDisplay();
  const StatusIcon = statusDisplay.icon;

  // Redirect if not partner
  useEffect(() => {
    if (!isPartner && !loading) {
      navigate('/', { replace: true });
    }
  }, [isPartner, navigate, loading]);

  // Fetch partner orders
  useEffect(() => {
    const fetchPartnerOrders = async () => {
      try {
        const response = await api.get('/api/partner/orders/');
        setOrders(response.data.orders || []);
        setStats(response.data.summary || {
          total_orders: 0,
          total_spent: 0,
          pending_orders: 0,
          completed_orders: 0,
        });
      } catch (error) {
        console.error('Failed to fetch partner orders:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (isPartner) {
      fetchPartnerOrders();
    }
  }, [isPartner]);

  

  const getStatusBadge = (status) => {
    const statusConfig = {
      'PENDING': { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
      'PROCESSING': { color: 'bg-blue-100 text-blue-800', label: 'Processing' },
      'SCHEDULED_FOR_DELIVERY': { color: 'bg-purple-100 text-purple-800', label: 'Scheduled for Delivery' },
      'DELIVERED': { color: 'bg-green-100 text-green-800', label: 'Delivered' },
      'CANCELLED': { color: 'bg-red-100 text-red-800', label: 'Cancelled' },
      'COMPLETED': { color: 'bg-green-100 text-green-800', label: 'Completed' },
    };
    return statusConfig[status] || { color: 'bg-gray-100 text-gray-800', label: status };
  };

  const StatCard = ({ icon: Icon, title, value, subtitle, color }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );

  const handleLogout = async () => {
    try {
      await clearCart();
    } catch (err) {
      console.error('Error clearing cart on logout:', err);
    }
    logout();
  };

  const handleBrowseServices = () => {
    if (!canPlaceOrders) {
      const messages = {
        'PENDING_REVIEW': 'Your partner account is under review. You cannot place orders until your account is activated.',
        'SUSPENDED': 'Your account has been suspended. Please contact support.',
        'REJECTED': 'Your partnership application has been rejected.',
        'INACTIVE': 'Your account is inactive. Please contact support.'
      };
      
      toast.warning(
        messages[partnerStatus] || 'You cannot place orders at this time.',
        {
          position: 'top-right',
          autoClose: 5000,
        }
      );
      return;
    }
    navigate('/partner/services');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Show different UI for rejected status
  if (isRejected) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <XCircle className="h-10 w-10 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Application Rejected</h2>
          <p className="text-gray-600 mb-4">
            We're sorry, but your partnership application has been rejected.
          </p>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-left">
            <p className="text-red-700 text-sm">
              If you believe this is a mistake or would like more information, please contact our partnership team.
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with dynamic status color */}
      <div className={`bg-gradient-to-r ${statusDisplay.bgColor} text-white`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <div className="flex items-start gap-3">
                <Building className="h-8 w-8" />
                <div>
                  <h1 className="text-2xl font-bold">Partner Dashboard</h1>
                  <p className="mt-1 text-white/80 text-sm">
                    Welcome back, {partnerData?.company_name || user?.first_name || 'Partner'}
                  </p>
                  <div className={`mt-2 inline-flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full text-sm`}>
                    <StatusIcon className="h-4 w-4" />
                    <span>{statusDisplay.label}</span>
                  </div>
                </div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="hidden lg:flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status Alert Banner for non-active statuses - ONLY show if NOT ACTIVE */}
        {!canPlaceOrders && partnerStatus && partnerStatus !== 'ACTIVE' && (
          <div className={`mb-6 ${
            isUnderReview ? 'bg-amber-50 border-amber-500' :
            isSuspended ? 'bg-red-50 border-red-500' :
            isInactive ? 'bg-gray-50 border-gray-500' :
            'bg-amber-50 border-amber-500'
          } border-l-4 p-4 rounded-r-lg shadow-sm`}>
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <StatusIcon className={`h-5 w-5 ${
                  isUnderReview ? 'text-amber-500' :
                  isSuspended ? 'text-red-500' :
                  isInactive ? 'text-gray-500' :
                  'text-amber-500'
                }`} />
              </div>
              <div className="ml-3">
                <h3 className={`text-sm font-medium ${
                  isUnderReview ? 'text-amber-800' :
                  isSuspended ? 'text-red-800' :
                  isInactive ? 'text-gray-800' :
                  'text-amber-800'
                }`}>
                  {statusDisplay.label}
                </h3>
                <div className={`mt-1 text-sm ${
                  isUnderReview ? 'text-amber-700' :
                  isSuspended ? 'text-red-700' :
                  isInactive ? 'text-gray-700' :
                  'text-amber-700'
                } space-y-1`}>
                  <p>{statusDisplay.message}</p>
                  {isUnderReview && (
                    <>
                      <p className="text-xs">
                        Both parties must agree on contracts before you can proceed with orders.
                      </p>
                      <div className="mt-2 flex items-center gap-2 text-xs">
                        <Mail className="h-4 w-4" />
                        <span>Check your email for updates from our partnership team</span>
                      </div>
                    </>
                  )}
                  {isSuspended && (
                    <div className="mt-2">
                      <button
                        onClick={() => window.location.href = 'mailto:support@kleankickx.com'}
                        className="text-xs bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded transition-colors"
                      >
                        Contact Support
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={ShoppingBag}
            title="Total Orders"
            value={canPlaceOrders ? stats.total_orders : '—'}
            subtitle={canPlaceOrders ? `${stats.pending_orders} pending` : statusDisplay.label}
            color={canPlaceOrders ? 'bg-blue-600' : 'bg-gray-400'}
          />
          <StatCard
            icon={DollarSign}
            title="Total Spent"
            value={canPlaceOrders ? `GHS ${parseFloat(stats.total_spent || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
            color={canPlaceOrders ? 'bg-green-600' : 'bg-gray-400'}
          />
          <StatCard
            icon={Package}
            title="Completed Orders"
            value={canPlaceOrders ? stats.completed_orders : '—'}
            color={canPlaceOrders ? 'bg-purple-600' : 'bg-gray-400'}
          />
          <StatCard
            icon={TrendingUp}
            title="Partner Since"
            value={partnerData?.created_at ? new Date(partnerData.created_at).toLocaleDateString() : 'N/A'}
            color="bg-orange-600"
          />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div
            onClick={handleBrowseServices}
            className={`${
              canPlaceOrders 
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 cursor-pointer hover:shadow-md' 
                : 'bg-gradient-to-r from-gray-400 to-gray-500 cursor-not-allowed opacity-60'
            } text-white p-6 rounded-xl shadow-sm transition-all text-left relative`}
          >
            {!canPlaceOrders && (
              <div className="absolute top-2 right-2 bg-amber-500 text-white text-xs px-2 py-1 rounded-full">
                <Clock className="h-3 w-3 inline mr-1" />
                {isUnderReview ? 'Under Review' : isSuspended ? 'Suspended' : 'Locked'}
              </div>
            )}
            <div className="flex items-start gap-3">
              <ShoppingBag className="h-8 w-8" />
              <div>
                <h3 className="font-semibold text-lg">Browse Wholesale Services</h3>
                <p className={`${canPlaceOrders ? 'text-blue-100' : 'text-gray-200'} text-sm mt-1`}>
                  {canPlaceOrders 
                    ? 'View our wholesale catalog and place bulk orders' 
                    : isUnderReview 
                      ? 'Account under review - ordering is temporarily disabled'
                      : isSuspended
                        ? 'Account suspended - contact support'
                        : 'Account inactive - contact support'}
                </p>
              </div>
            </div>
          </div>

          <button
          onClick={() => navigate('/partner/invoices')}
          className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all text-left"
        >
          <div className="flex items-start gap-3">
            <FileText className="h-8 w-8" />
            <div>
              <h3 className="font-semibold text-lg">View Invoices</h3>
              <p className="text-purple-100 text-sm mt-1">Manage your invoices and make payments</p>
            </div>
          </div>
        </button>
  
          
          <button
            onClick={() => navigate('/partner/profile')}
            className="bg-gradient-to-r from-gray-600 to-gray-700 text-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all text-left"
          >
            <div className="flex items-start gap-3">
              <User className="h-8 w-8" />
              <div>
                <h3 className="font-semibold text-lg">Manage Profile</h3>
                <p className="text-gray-200 text-sm mt-1">Update your company information and preferences</p>
              </div>
            </div>
          </button>
        </div>

        {/* Tabs - Order History & Profile */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-6 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'overview'
                    ? 'border-b-2 border-primary text-primary'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Order History
              </button>
              <button
                onClick={() => setActiveTab('profile')}
                className={`px-6 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'profile'
                    ? 'border-b-2 border-primary text-primary'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Company Profile
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <>
                {!canPlaceOrders ? (
                  <div className="text-center py-12">
                    {isUnderReview && <Clock className="mx-auto h-12 w-12 text-amber-400" />}
                    {isSuspended && <Ban className="mx-auto h-12 w-12 text-red-400" />}
                    {isInactive && <MinusCircle className="mx-auto h-12 w-12 text-gray-400" />}
                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                      {statusDisplay.label}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 max-w-sm mx-auto">
                      {statusDisplay.message}
                    </p>
                    {isUnderReview && (
                      <div className="mt-4 p-4 bg-amber-50 rounded-lg border border-amber-200 max-w-md mx-auto">
                        <div className="flex items-start gap-2 text-amber-700 text-sm">
                          <FileCheck className="h-5 w-5 flex-shrink-0 mt-0.5" />
                          <p>
                            Our partnership team is reviewing your application. 
                            Both parties must agree on contracts before you can proceed.
                            You'll receive an email notification once approved.
                          </p>
                        </div>
                      </div>
                    )}
                    {isSuspended && (
                      <div className="mt-4">
                        <button
                          onClick={() => window.location.href = 'mailto:support@kleankickx.com'}
                          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                        >
                          Contact Support
                        </button>
                      </div>
                    )}
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No orders yet</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Get started by placing your first wholesale order.
                    </p>
                    <div className="mt-6">
                      <button
                        onClick={() => navigate('/partner/services')}
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90"
                      >
                        Browse Services
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Order #
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Total
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Items
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {orders.map((order) => {
                          const status = getStatusBadge(order.status);
                          return (
                            <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {order.reference_code}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {new Date(order.created_at).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                GHS {parseFloat(order.total).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${status.color}`}>
                                  {status.label}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {order.items?.length || 0} item(s)
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button
                                  onClick={() => navigate(`/partner/orders/${order.reference_code}`)}
                                  className="text-primary hover:text-primary/80 inline-flex items-center gap-1"
                                >
                                  <Eye className="h-4 w-4" />
                                  View
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}

            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                    <p className="text-gray-900 font-medium">{partnerData?.company_name || 'N/A'}</p>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Corporate Email</label>
                    <p className="text-gray-900">{partnerData?.corporate_email || 'N/A'}</p>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <p className="text-gray-900">{partnerData?.phone_number || 'N/A'}</p>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Account Status</label>
                    <p className={`font-medium ${
                      isUnderReview ? 'text-amber-600' : 
                      canPlaceOrders ? 'text-green-600' : 
                      isSuspended ? 'text-red-600' :
                      isRejected ? 'text-red-600' :
                      'text-gray-600'
                    }`}>
                      {statusDisplay.label}
                    </p>
                    {isUnderReview && (
                      <p className="text-xs text-amber-500 mt-1">
                        Awaiting contract agreement and approval
                      </p>
                    )}
                    {isSuspended && (
                      <p className="text-xs text-red-500 mt-1">
                        Contact support to resolve
                      </p>
                    )}
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tax ID</label>
                    <p className="text-gray-900">{partnerData?.tax_id || 'Not provided'}</p>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Billing Address</label>
                    <p className="text-gray-900">{partnerData?.billing_address || 'Not provided'}</p>
                  </div>
                </div>

                <div className={`${
                  isUnderReview ? 'bg-amber-50 border-amber-200' : 
                  canPlaceOrders ? 'bg-blue-50 border-blue-200' :
                  isSuspended ? 'bg-red-50 border-red-200' :
                  'bg-gray-50 border-gray-200'
                } border rounded-lg p-4`}>
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      {isUnderReview && <AlertCircle className="h-5 w-5 text-amber-600" />}
                      {canPlaceOrders && (
                        <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                      {isSuspended && <AlertCircle className="h-5 w-5 text-red-600" />}
                    </div>
                    <div className={`text-sm ${
                      isUnderReview ? 'text-amber-800' : 
                      canPlaceOrders ? 'text-blue-800' :
                      isSuspended ? 'text-red-800' :
                      'text-gray-800'
                    }`}>
                      <p className="font-medium mb-1">
                        {isUnderReview ? 'Account Under Review' : 
                         canPlaceOrders ? 'Need to update your information?' :
                         isSuspended ? 'Account Suspended' :
                         'Account Status'}
                      </p>
                      {isUnderReview ? (
                        <div className="space-y-1">
                          <p>Your partner account is currently under review. Our team will reach out to finalize the partnership agreement.</p>
                          <p className="text-xs mt-1">Contact our partnership team at <span className="font-medium">partners@kleankickx.com</span> for any questions.</p>
                        </div>
                      ) : canPlaceOrders ? (
                        <p>Contact our partnership team at <span className="font-medium">partners@kleankickx.com</span> to make changes to your business profile.</p>
                      ) : isSuspended ? (
                        <div className="space-y-1">
                          <p>Your account has been suspended. Please contact support immediately.</p>
                          <button
                            onClick={() => window.location.href = 'mailto:support@kleankickx.com'}
                            className="mt-2 text-xs bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded transition-colors"
                          >
                            Contact Support
                          </button>
                        </div>
                      ) : (
                        <p>Please contact support for more information about your account status.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PartnerDashboard;