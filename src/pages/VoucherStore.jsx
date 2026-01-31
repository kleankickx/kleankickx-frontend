import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { 
  FaGift, FaTag, FaClock, FaShoppingCart, 
  FaSpinner, FaExclamationTriangle, FaHeart,
  FaUsers, FaStar, FaCheckCircle
} from 'react-icons/fa';
import { motion } from 'framer-motion';
import { AuthContext } from '../context/AuthContext';

const VoucherStore = () => {
  const [voucherTypes, setVoucherTypes] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [giftData, setGiftData] = useState({
    quantity: 1,
    recipientEmail: '',
    giftMessage: '',
    sendToSelf: true
  });
  const { api } = useContext(AuthContext);
  
  const navigate = useNavigate();
  
  // Get base URL from environment
  const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000';

  useEffect(() => {
    fetchVoucherTypes();
    fetchCampaigns();
  }, []);

  // In your VoucherStore.jsx - Add this useEffect
    useEffect(() => {
    const handlePaymentRedirect = () => {
        const urlParams = new URLSearchParams(window.location.search);
        const paymentStatus = urlParams.get('payment_status');
        const orderNumber = urlParams.get('order');
        
        if (paymentStatus === 'success' && orderNumber) {
        toast.success(
            <div className="flex items-center">
            <FaCheckCircle className="mr-2 text-green-500" />
            Payment successful! Your vouchers have been created.
            </div>
        );
        
        // Clear URL parameters
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
        
        // Redirect to vouchers page
        setTimeout(() => {
            navigate(`/account/vouchers?order=${orderNumber}`);
        }, 2000);
        } else if (paymentStatus === 'failed') {
        toast.error('Payment failed. Please try again.');
        // Clear URL parameters
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
        }
    };
    
    handlePaymentRedirect();
    }, [navigate]);

  const fetchVoucherTypes = async () => {
    try {
      const response = await api.get(`/api/vouchers/types/?in_stock=true`);
      
      // Handle response format
      let vouchersData = response.data;
      if (response.data && response.data.results) {
        vouchersData = response.data.results;
      }
      
      if (Array.isArray(vouchersData)) {
        setVoucherTypes(vouchersData);
      } else {
        console.error('Unexpected API response format:', response.data);
        setVoucherTypes([]);
        toast.error('Failed to load voucher data');
      }
      
    } catch (error) {
      console.error('Error fetching vouchers:', error);
      setVoucherTypes([]);
      toast.error('Failed to load vouchers');
    } finally {
      setLoading(false);
    }
  };

  const fetchCampaigns = async () => {
    try {
      const response = await axios.get(`/api/vouchers/campaigns/`);
      let campaignsData = response.data;
      
      if (response.data && response.data.results) {
        campaignsData = response.data.results;
      }
      
      if (Array.isArray(campaignsData)) {
        setCampaigns(campaignsData);
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      setCampaigns([]);
    }
  };

  const handlePurchaseClick = (voucher) => {
    setSelectedVoucher(voucher);
    setGiftData({
      quantity: 1,
      recipientEmail: '',
      giftMessage: '',
      sendToSelf: true
    });
    setShowGiftModal(true);
  };

  const initiatePurchase = async () => {
    if (!selectedVoucher) return;

    // Validate gift data
    if (!giftData.sendToSelf && !giftData.recipientEmail) {
      toast.error('Please enter recipient email or select "Send to myself"');
      return;
    }

    if (!giftData.sendToSelf && giftData.recipientEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(giftData.recipientEmail)) {
        toast.error('Please enter a valid email address');
        return;
      }
    }

    setPurchasing(true);

    try {
      // Prepare purchase data
      const purchaseData = {
        voucher_type_id: selectedVoucher.id,
        quantity: giftData.quantity,
        send_to_self: giftData.sendToSelf
      };

      // Add optional fields
      if (!giftData.sendToSelf) {
        purchaseData.recipient_email = giftData.recipientEmail;
      }
      if (giftData.giftMessage) {
        purchaseData.gift_message = giftData.giftMessage;
      }

      // Make API call to initiate purchase
      const response = await api.post(
        `/api/vouchers/purchase/`,
        purchaseData
      );

      if (response.data.success && response.data.payment_url) {
        // Store order info for after payment redirect
        localStorage.setItem('pending_voucher_order', JSON.stringify({
          order_number: response.data.order_number,
          voucher_type: selectedVoucher.name,
          quantity: giftData.quantity,
          total_amount: response.data.total_amount
        }));

        // Redirect to Paystack payment page
        window.location.href = response.data.payment_url;
      } else {
        toast.error(response.data.message || 'Failed to initialize payment');
      }

    } catch (error) {
      console.error('Purchase error:', error);
      
      if (error.response) {
        // Server responded with error
        const errorMessage = error.response.data?.message || 
                            error.response.data?.error || 
                            'Purchase failed';
        toast.error(errorMessage);
        
        // Handle specific error cases
        if (error.response.status === 401) {
          // Token expired, redirect to login
          toast.info('Please login again');
          navigate('/login');
        } else if (error.response.status === 400) {
          // Validation errors
          if (error.response.data?.voucher_type_id) {
            toast.error('Invalid voucher selected');
          } else if (error.response.data?.quantity) {
            toast.error('Invalid quantity');
          }
        } else if (error.response.status === 403) {
          toast.error('You do not have permission to purchase vouchers');
        }
      } else if (error.request) {
        // Request made but no response
        toast.error('Network error. Please check your connection.');
      } else {
        // Other errors
        toast.error('An unexpected error occurred');
      }
    } finally {
      setPurchasing(false);
      setShowGiftModal(false);
    }
  };

  // Check for successful payment redirect
  useEffect(() => {
    const checkPaymentResult = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const paymentStatus = urlParams.get('payment_status');
      const orderNumber = urlParams.get('order_number');
      
      if (paymentStatus === 'success' && orderNumber) {
        toast.success(
          <div className="flex items-center">
            <FaCheckCircle className="mr-2 text-green-500" />
            Payment successful! Your vouchers are being created.
          </div>
        );
        
        // Clear URL parameters
        window.history.replaceState({}, document.title, window.location.pathname);
        
        // Redirect to orders page after a delay
        setTimeout(() => {
          navigate(`/account/vouchers?order=${orderNumber}`);
        }, 2000);
      } else if (paymentStatus === 'failed') {
        toast.error('Payment failed. Please try again.');
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    };

    checkPaymentResult();
  }, [navigate]);

  // Filter vouchers by selected campaign
  const filteredVouchers = selectedCampaign 
    ? voucherTypes.filter(voucher => 
        voucher.campaigns && 
        Array.isArray(voucher.campaigns) && 
        voucher.campaigns.includes(selectedCampaign.id))
    : voucherTypes;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <FaSpinner className="animate-spin text-4xl text-primary mx-auto mb-4" />
          <p className="text-gray-600">Loading vouchers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Gift Vouchers</h1>
        <p className="text-gray-600 mt-2">
          Give the gift of clean sneakers! Purchase vouchers at 10% discount.
        </p>
      </div>

      {/* Campaign Selector */}
      {campaigns.length > 0 && (
        <div className="max-w-7xl mx-auto mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Special Campaigns</h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setSelectedCampaign(null)}
              className={`px-4 py-2 rounded-full border ${
                !selectedCampaign 
                  ? 'bg-primary text-white border-primary' 
                  : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
              }`}
            >
              All Vouchers
            </button>
            {campaigns.map(campaign => (
              <button
                key={campaign.id}
                onClick={() => setSelectedCampaign(campaign)}
                className={`px-4 py-2 rounded-full border ${
                  selectedCampaign?.id === campaign.id
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                }`}
              >
                {campaign.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Campaign Banner */}
      {selectedCampaign && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-7xl mx-auto mb-8 rounded-2xl p-8 text-white relative overflow-hidden"
          style={{ backgroundColor: selectedCampaign.theme_color || '#FF6B8B' }}
        >
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <FaHeart className="animate-pulse" />
              <span className="font-medium">Special Offer</span>
            </div>
            <h1 className="text-4xl font-bold mb-4">{selectedCampaign.name}</h1>
            <p className="text-xl opacity-90 mb-6">{selectedCampaign.description}</p>
            <p className="text-sm opacity-75">Limited time offer</p>
          </div>
        </motion.div>
      )}

      {/* Results Count */}
      <div className="max-w-7xl mx-auto mb-6">
        <p className="text-gray-600">
          Showing {filteredVouchers.length} voucher{filteredVouchers.length !== 1 ? 's' : ''}
          {selectedCampaign && ` in ${selectedCampaign.name}`}
        </p>
      </div>

      {/* Voucher Grid */}
      <div className="max-w-7xl mx-auto">
        {filteredVouchers.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm">
            <FaGift className="text-5xl text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-700 mb-2">No vouchers available</h3>
            <p className="text-gray-600 mb-6">
              {selectedCampaign 
                ? `No vouchers available for ${selectedCampaign.name} yet.`
                : 'No vouchers have been created yet.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVouchers.map((voucher, index) => {
              const serviceName = voucher.service_details?.name || voucher.service?.name || 'Cleaning Service';
              const serviceDescription = voucher.service_details?.description || voucher.service?.description || '';
              const availableStock = voucher.available_stock || (voucher.stock_quantity - voucher.sold_quantity) || 0;
              const discountAmount = (voucher.original_price || 0) - (voucher.discounted_price || 0);
              
              return (
                <motion.div
                  key={voucher.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 hover:shadow-xl transition-shadow duration-300"
                >
                  {/* Badge */}
                  <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold">{voucher.name}</span>
                      <span className="text-sm bg-white/20 px-2 py-1 rounded-full">
                        {availableStock} left
                      </span>
                    </div>
                  </div>

                  <div className="p-6">
                    {/* Service Info */}
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {serviceName}
                      </h3>
                      {serviceDescription && (
                        <p className="text-gray-600 text-sm line-clamp-2">{serviceDescription}</p>
                      )}
                    </div>

                    {/* Included Quantity */}
                    {voucher.service_details?.included_quantity && (
                      <div className="flex items-center text-sm text-gray-500 mb-4">
                        <FaUsers className="mr-2" />
                        For {voucher.service_details.included_quantity} sneakers
                      </div>
                    )}

                    {/* Pricing */}
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Original Price:</span>
                        <span className="text-lg font-bold line-through text-gray-400">
                          ₵{voucher.original_price || 0}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-green-600 bg-green-50 p-3 rounded-lg">
                        <span className="font-medium">Voucher Price:</span>
                        <span className="text-xl font-bold">₵{voucher.discounted_price || 0}</span>
                      </div>
                      {voucher.discount_percentage && discountAmount > 0 && (
                        <div className="text-sm text-purple-600 font-medium">
                          <FaTag className="inline mr-1" />
                          Save ₵{discountAmount.toFixed(2)} ({voucher.discount_percentage}% off)
                        </div>
                      )}
                    </div>

                    {/* Validity */}
                    {voucher.validity_months && (
                      <div className="flex items-center text-sm text-gray-500 mb-6">
                        <FaClock className="mr-2" />
                        Valid for {voucher.validity_months} months
                      </div>
                    )}

                    {/* Purchase Button */}
                    <button
                      onClick={() => handlePurchaseClick(voucher)}
                      disabled={availableStock <= 0}
                      className={`w-full py-3 rounded-lg font-bold text-white transition-all flex items-center justify-center gap-2 ${
                        availableStock <= 0
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
                      }`}
                    >
                      <FaShoppingCart />
                      {availableStock <= 0 ? 'Out of Stock' : 'Buy Now'}
                    </button>

                    {/* Stock Warning */}
                    {availableStock <= 5 && availableStock > 0 && (
                      <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                        <div className="flex items-center text-amber-800 text-sm">
                          <FaStar className="mr-2 animate-pulse" />
                          <span className="font-medium">
                            Only {availableStock} left at this price!
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Gift Modal */}
      {showGiftModal && selectedVoucher && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl max-w-md w-full overflow-hidden max-h-[90vh] overflow-y-auto"
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FaGift className="text-2xl" />
                  <h3 className="text-xl font-bold">Purchase Voucher</h3>
                </div>
                <button
                  onClick={() => setShowGiftModal(false)}
                  className="text-white hover:text-gray-200 text-2xl"
                  disabled={purchasing}
                >
                  &times;
                </button>
              </div>
              <p className="mt-2 text-purple-100">
                {selectedVoucher.name} - ₵{selectedVoucher.discounted_price || 0} each
              </p>
            </div>

            <div className="p-6">
              {/* Quantity Selector */}
              <div className="mb-6">
                <label className="block text-gray-700 mb-2 font-medium">Quantity</label>
                <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setGiftData(prev => ({ 
                      ...prev, 
                      quantity: Math.max(1, prev.quantity - 1) 
                    }))}
                    className="w-12 h-12 bg-gray-100 flex items-center justify-center hover:bg-gray-200 disabled:opacity-50"
                    disabled={giftData.quantity <= 1 || purchasing}
                  >
                    −
                  </button>
                  <div className="flex-1 h-12 bg-white flex items-center justify-center font-bold text-lg">
                    {giftData.quantity}
                  </div>
                  <button
                    onClick={() => setGiftData(prev => ({ 
                      ...prev, 
                      quantity: prev.quantity + 1 
                    }))}
                    className="w-12 h-12 bg-gray-100 flex items-center justify-center hover:bg-gray-200 disabled:opacity-50"
                    disabled={purchasing}
                  >
                    +
                  </button>
                </div>
                <div className="text-sm text-gray-500 mt-2">
                  Total: ₵{((selectedVoucher.discounted_price || 0) * giftData.quantity).toFixed(2)}
                </div>
              </div>

              {/* Recipient Options */}
              <div className="space-y-4">
                <div>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={giftData.sendToSelf}
                      onChange={(e) => setGiftData(prev => ({ 
                        ...prev, 
                        sendToSelf: e.target.checked,
                        recipientEmail: e.target.checked ? '' : prev.recipientEmail
                      }))}
                      className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                      disabled={purchasing}
                    />
                    <span className="text-gray-700">Send voucher to myself</span>
                  </label>
                </div>

                {!giftData.sendToSelf && (
                  <>
                    <div>
                      <label className="block text-gray-700 mb-2 font-medium">
                        Recipient's Email
                      </label>
                      <input
                        type="email"
                        value={giftData.recipientEmail}
                        onChange={(e) => setGiftData(prev => ({ 
                          ...prev, 
                          recipientEmail: e.target.value 
                        }))}
                        placeholder="friend@example.com"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50"
                        disabled={purchasing}
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 mb-2 font-medium">
                        Gift Message (Optional)
                      </label>
                      <textarea
                        value={giftData.giftMessage}
                        onChange={(e) => setGiftData(prev => ({ 
                          ...prev, 
                          giftMessage: e.target.value 
                        }))}
                        placeholder="Happy Valentine's! Thinking of you..."
                        rows="3"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50"
                        maxLength="200"
                        disabled={purchasing}
                      />
                      <div className="text-right text-sm text-gray-500 mt-1">
                        {giftData.giftMessage.length}/200
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => setShowGiftModal(false)}
                  disabled={purchasing}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={initiatePurchase}
                  disabled={purchasing}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-bold hover:opacity-90 disabled:opacity-50 flex items-center justify-center"
                >
                  {purchasing ? (
                    <>
                      <FaSpinner className="animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    `Pay ₵${((selectedVoucher.discounted_price || 0) * giftData.quantity).toFixed(2)}`
                  )}
                </button>
              </div>

              {/* Payment Info */}
              <div className="mt-6 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-700">
                  <strong>Secure Payment:</strong> You'll be redirected to Paystack for secure payment processing.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* How It Works Section */}
      <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-gray-200">
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">
          How Voucher Purchases Work
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaShoppingCart className="text-2xl text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Select & Purchase</h3>
            <p className="text-gray-600">
              Choose a voucher, customize your gift, and pay securely with Paystack.
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaGift className="text-2xl text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Instant Delivery</h3>
            <p className="text-gray-600">
              Receive voucher codes instantly via email after payment confirmation.
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaClock className="text-2xl text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Flexible Redemption</h3>
            <p className="text-gray-600">
              Redeem anytime within 6 months for professional sneaker cleaning.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoucherStore;