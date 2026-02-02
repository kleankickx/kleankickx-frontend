import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { 
  FaGift, FaTag, FaShoppingCart, 
  FaSpinner, FaExclamationTriangle, FaHeart,
  FaStar, FaCheckCircle,
  FaBox, FaFire, FaPercent, FaShieldAlt,
  FaRegCreditCard, FaBoxOpen, FaArrowRight,
  FaCrown, FaAward, FaPlus, FaMinus
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthContext } from '../context/AuthContext';

const VoucherStore = () => {
  const [voucherTypes, setVoucherTypes] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [loadedImages, setLoadedImages] = useState({});
  const [purchaseData, setPurchaseData] = useState({
    quantity: 1,
    sendToSelf: true,
    recipientEmail: '',
    giftMessage: '',
    step: 1 // 1: Quantity, 2: Recipient, 3: Review
  });
  const { api } = useContext(AuthContext);
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchVoucherTypes();
    fetchCampaigns();
  }, []);

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
        
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
        
        setTimeout(() => {
          navigate(`/account/vouchers?order=${orderNumber}`);
        }, 2000);
      } else if (paymentStatus === 'failed') {
        toast.error('Payment failed. Please try again.');
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
      }
    };
    
    handlePaymentRedirect();
  }, [navigate]);

  const fetchVoucherTypes = async () => {
    try {
      const response = await api.get(`/api/vouchers/types/?in_stock=true`);
      
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
    setPurchaseData({
      quantity: 1,
      sendToSelf: true,
      recipientEmail: '',
      giftMessage: '',
      step: 1
    });
    setShowPurchaseModal(true);
  };

  const handleImageLoad = (voucherId) => {
    setLoadedImages(prev => ({ ...prev, [voucherId]: true }));
  };

  const initiatePurchase = async () => {
    if (!selectedVoucher) return;

    if (!purchaseData.sendToSelf && !purchaseData.recipientEmail) {
      toast.error('Please enter recipient email or select "Send to myself"');
      setPurchaseData(prev => ({ ...prev, step: 2 }));
      return;
    }

    if (!purchaseData.sendToSelf && purchaseData.recipientEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(purchaseData.recipientEmail)) {
        toast.error('Please enter a valid email address');
        return;
      }
    }

    setPurchasing(true);

    try {
      const purchasePayload = {
        voucher_type_id: selectedVoucher.id,
        quantity: purchaseData.quantity,
        send_to_self: purchaseData.sendToSelf
      };

      if (!purchaseData.sendToSelf) {
        purchasePayload.recipient_email = purchaseData.recipientEmail;
      }
      if (purchaseData.giftMessage) {
        purchasePayload.gift_message = purchaseData.giftMessage;
      }

      const response = await api.post(
        `/api/vouchers/purchase/`,
        purchasePayload
      );

      if (response.data.success && response.data.payment_url) {
        localStorage.setItem('pending_voucher_order', JSON.stringify({
          order_number: response.data.order_number,
          voucher_type: selectedVoucher.name,
          quantity: purchaseData.quantity,
          total_amount: response.data.total_amount
        }));

        window.location.href = response.data.payment_url;
      } else {
        toast.error(response.data.message || 'Failed to initialize payment');
      }

    } catch (error) {
      console.error('Purchase error:', error);
      
      if (error.response) {
        const errorMessage = error.response.data?.message || 
                            error.response.data?.error || 
                            'Purchase failed';
        toast.error(errorMessage);
        
        if (error.response.status === 401) {
          toast.info('Please login again');
          navigate('/login');
        } else if (error.response.status === 400) {
          if (error.response.data?.voucher_type_id) {
            toast.error('Invalid voucher selected');
          } else if (error.response.data?.quantity) {
            toast.error('Invalid quantity');
          }
        } else if (error.response.status === 403) {
          toast.error('You do not have permission to purchase vouchers');
        }
      } else if (error.request) {
        toast.error('Network error. Please check your connection.');
      } else {
        toast.error('An unexpected error occurred');
      }
    } finally {
      setPurchasing(false);
      setShowPurchaseModal(false);
    }
  };

  const filteredVouchers = selectedCampaign 
    ? voucherTypes.filter(voucher => 
        voucher.campaigns && 
        Array.isArray(voucher.campaigns) && 
        voucher.campaigns.includes(selectedCampaign.id))
    : voucherTypes;

  const getStockStatus = (availableStock) => {
    if (availableStock <= 0) return { 
      text: 'Out of Stock', 
      color: 'bg-red-100 text-red-800 border border-red-200',
      icon: <FaExclamationTriangle className="text-red-500" />
    };
    if (availableStock <= 5) return { 
      text: `${availableStock} Left`, 
      color: 'bg-amber-100 text-amber-800 border border-amber-200',
      icon: <FaFire className="text-amber-500" />
    };
    if (availableStock <= 10) return { 
      text: 'Low Stock', 
      color: 'bg-orange-100 text-orange-800 border border-orange-200',
      icon: <FaBoxOpen className="text-orange-500" />
    };
    return { 
      text: `${availableStock} Available`, 
      color: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
      icon: <FaCheckCircle className="text-emerald-500" />
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white">
        <div className="text-center">
          <div className="relative">
            <FaSpinner className="animate-spin text-4xl text-green-600 mx-auto mb-4" />
            <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-emerald-600 blur-xl opacity-20"></div>
          </div>
          <p className="text-gray-600 font-medium mt-2">Loading voucher collection...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-8 px-4 sm:px-6 lg:px-12">
      {/* Header - Clean Left Aligned */}
      <div className="max-w-7xl mx-auto mb-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
          <span className="text-green-600">Gift Vouchers</span>
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl">
            Give the gift of pristine sneakers! Purchase vouchers at 10% discount and save on premium cleaning services.
          </p>
        </div>

        {/* Campaign Selector - Minimal */}
        {campaigns.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-700 mb-3">Special Campaigns</h2>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCampaign(null)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  !selectedCampaign 
                    ? 'bg-green-600 text-white shadow-sm' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Vouchers
              </button>
              {campaigns.map(campaign => (
                <button
                  key={campaign.id}
                  onClick={() => setSelectedCampaign(campaign)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    selectedCampaign?.id === campaign.id
                      ? 'bg-green-600 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {campaign.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Campaign Banner */}
      {selectedCampaign && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-7xl mx-auto mb-8 rounded-xl overflow-hidden bg-gradient-to-r from-green-600 to-emerald-600"
        >
          <div className="p-6 text-white">
            <div className="flex items-center gap-3 mb-2">
              <FaStar className="text-yellow-300" />
              <span className="font-semibold">SPECIAL OFFER</span>
            </div>
            <h2 className="text-2xl font-bold mb-2">{selectedCampaign.name}</h2>
            <p className="text-green-100">{selectedCampaign.description}</p>
          </div>
        </motion.div>
      )}

      {/* Results Count */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex items-center justify-between">
          <p className="text-gray-700">
            <span className="font-semibold">{filteredVouchers.length}</span> voucher{filteredVouchers.length !== 1 ? 's' : ''} available
          </p>
          {selectedCampaign && (
            <span className="text-sm text-gray-500 px-3 py-1 bg-gray-100 rounded-full">
              {selectedCampaign.name}
            </span>
          )}
        </div>
      </div>

      {/* Voucher Grid - Casual Design */}
      <div className="max-w-7xl mx-auto">
        {filteredVouchers.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaGift className="text-2xl text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No vouchers available</h3>
            <p className="text-gray-600 mb-6">
              {selectedCampaign 
                ? `Check back soon for "${selectedCampaign.name}" vouchers.`
                : 'New vouchers coming soon!'}
            </p>
            <button 
              onClick={() => setSelectedCampaign(null)}
              className="px-5 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
            >
              View All
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVouchers.map((voucher, index) => {
              const serviceName = voucher.service_details?.name || voucher.service?.name || 'Premium Cleaning';
              const availableStock = voucher.available_stock || (voucher.stock_quantity - voucher.sold_quantity) || 0;
              const discountAmount = (voucher.original_price || 0) - (voucher.discounted_price || 0);
              const stockStatus = getStockStatus(availableStock);
              const imageUrl = voucher.voucher_card_image_url || voucher.voucher_card_thumbnail_url;
              
              return (
                <motion.div
                  key={voucher.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  whileHover={{ 
                    y: -4,
                    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
                  }}
                  className="bg-white rounded-xl border border-gray-200 overflow-hidden transition-all duration-200"
                >
                  {/* Stock Badge */}
                  <div className="absolute top-3 right-3 z-10">
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${stockStatus.color}`}>
                      {stockStatus.icon}
                      {stockStatus.text}
                    </div>
                  </div>

                  {/* Discount Badge */}
                  {voucher.discount_percentage > 0 && (
                    <div className="absolute top-3 left-3 z-10">
                      <div className="px-3 py-1.5 bg-green-600 text-white rounded-full text-sm font-bold">
                        {voucher.discount_percentage}% OFF
                      </div>
                    </div>
                  )}

                  {/* Image */}
                  <div className="h-48 overflow-hidden bg-gray-100">
                    {imageUrl ? (
                      <>
                        {!loadedImages[voucher.id] && (
                          <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse"></div>
                        )}
                        <img 
                          src={imageUrl} 
                          alt={voucher.name}
                          className={`w-full h-full object-cover ${!loadedImages[voucher.id] ? 'opacity-0' : 'opacity-100'}`}
                          onLoad={() => handleImageLoad(voucher.id)}
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.parentElement.innerHTML = `
                              <div class="w-full h-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                                <FaGift class="text-3xl text-white opacity-50" />
                              </div>
                            `;
                          }}
                        />
                      </>
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                        <FaGift className="text-3xl text-white opacity-50" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-1">
                      {voucher.name}
                    </h3>
                    
                    <div className="text-sm text-gray-600 mb-4">
                      <span className="font-medium">{serviceName}</span>
                      {voucher.service_details?.included_quantity && (
                        <span className="ml-2">• {voucher.service_details.included_quantity} sneakers</span>
                      )}
                    </div>

                    {/* Pricing */}
                    <div className="mb-4">
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="text-2xl font-bold text-gray-900">
                          ₵{voucher.discounted_price || 0}
                        </span>
                        {voucher.original_price > voucher.discounted_price && (
                          <span className="text-sm text-gray-400 line-through">
                            ₵{voucher.original_price}
                          </span>
                        )}
                      </div>
                      {discountAmount > 0 && (
                        <div className="text-sm text-green-600 font-medium">
                          Save ₵{discountAmount.toFixed(2)}
                        </div>
                      )}
                    </div>

                    {/* Validity */}
                    {voucher.validity_months && (
                      <div className="flex items-center text-sm text-gray-500 mb-6">
                        <FaCheckCircle className="mr-2 text-green-500" />
                        Valid for {voucher.validity_months} months
                      </div>
                    )}

                    {/* Purchase Button */}
                    <button
                      onClick={() => handlePurchaseClick(voucher)}
                      disabled={availableStock <= 0}
                      className={`w-full py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                        availableStock <= 0
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      <FaShoppingCart />
                      {availableStock <= 0 ? 'Out of Stock' : 'Purchase Now'}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* How It Works - Simple */}
      <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: FaShoppingCart, title: "Choose Voucher", desc: "Select from our collection" },
            { icon: FaRegCreditCard, title: "Secure Payment", desc: "Quick & safe checkout" },
            { icon: FaGift, title: "Get Voucher", desc: "Instant email delivery" }
          ].map((step, index) => (
            <div key={index} className="text-center p-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <step.icon className="text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{step.title}</h3>
              <p className="text-sm text-gray-600">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Enhanced Purchase Modal - Multi-step */}
      <AnimatePresence>
        {showPurchaseModal && selectedVoucher && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl max-w-md w-full overflow-hidden shadow-xl"
            >
              {/* Modal Header with Steps */}
              <div className="">
                <div className="flex items-center justify-between p-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Purchase Voucher</h3>
                    <p className="text-sm text-gray-600">{selectedVoucher.name}</p>
                  </div>
                  <button
                    onClick={() => setShowPurchaseModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                    disabled={purchasing}
                  >
                    ✕
                  </button>
                </div>
                
                {/* Progress Steps */}
                <div className="px-6 pb-4">
                  <div className="flex items-center justify-between relative">
                    <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-200 -translate-y-1/2"></div>
                    {[1, 2, 3].map((step) => (
                      <div key={step} className="relative z-10">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                          purchaseData.step >= step 
                            ? 'bg-green-600 text-white' 
                            : 'bg-gray-200 text-gray-600'
                        }`}>
                          {step}
                        </div>
                        <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 whitespace-nowrap text-xs">
                          {step === 1 && 'Quantity'}
                          {step === 2 && 'Recipient'}
                          {step === 3 && 'Review'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-6">
                {/* Step 1: Quantity Selection */}
                {purchaseData.step === 1 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Select Quantity</h4>
                    
                    <div className="mb-6">
                      <div className="flex items-center justify-center mb-8">
                        <button
                          onClick={() => setPurchaseData(prev => ({ 
                            ...prev, 
                            quantity: Math.max(1, prev.quantity - 1) 
                          }))}
                          className="w-12 h-12 rounded-lg border-2 border-gray-300 flex items-center justify-center hover:border-gray-400 disabled:opacity-50"
                          disabled={purchaseData.quantity <= 1 || purchasing}
                        >
                          <FaMinus className="text-gray-600" />
                        </button>
                        
                        <div className="mx-8">
                          <div className="text-5xl font-bold text-gray-900 mb-1">{purchaseData.quantity}</div>
                          <div className="text-sm text-gray-500 text-center">
                            voucher{purchaseData.quantity !== 1 ? 's' : ''}
                          </div>
                        </div>
                        
                        <button
                          onClick={() => setPurchaseData(prev => ({ 
                            ...prev, 
                            quantity: Math.min(selectedVoucher.available_stock || 10, prev.quantity + 1) 
                          }))}
                          className="w-12 h-12 rounded-lg border-2 border-gray-300 flex items-center justify-center hover:border-gray-400 disabled:opacity-50"
                          disabled={purchasing || purchaseData.quantity >= (selectedVoucher.available_stock || 10)}
                        >
                          <FaPlus className="text-gray-600" />
                        </button>
                      </div>
                      
                      <div className="text-center text-sm text-gray-500">
                        Maximum: {selectedVoucher.available_stock || 10} vouchers
                      </div>
                    </div>

                    {/* Price Summary */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-6">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-600">Unit Price</span>
                        <span className="font-medium">₵{selectedVoucher.discounted_price || 0}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Total</span>
                        <span className="text-xl font-bold text-green-600">
                          ₵{((selectedVoucher.discounted_price || 0) * purchaseData.quantity).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => setPurchaseData(prev => ({ ...prev, step: 2 }))}
                      className="w-full py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                    >
                      Continue to Recipient
                    </button>
                  </motion.div>
                )}

                {/* Step 2: Recipient Selection */}
                {purchaseData.step === 2 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Select Recipient</h4>
                    
                    <div className="space-y-4 mb-6">
                      <button
                        onClick={() => setPurchaseData(prev => ({ 
                          ...prev, 
                          sendToSelf: true,
                          recipientEmail: '',
                          giftMessage: ''
                        }))}
                        className={`w-full p-4 rounded-lg border text-left transition-colors ${
                          purchaseData.sendToSelf 
                            ? 'border-green-500 bg-green-50' 
                            : 'border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center">
                          <div className={`w-5 h-5 rounded-full border flex items-center justify-center mr-3 ${
                            purchaseData.sendToSelf 
                              ? 'border-green-500 bg-green-500' 
                              : 'border-gray-400'
                          }`}>
                            {purchaseData.sendToSelf && (
                              <div className="w-2 h-2 bg-white rounded-full"></div>
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">Send to myself</div>
                            <div className="text-sm text-gray-600">Voucher will be added to your account</div>
                          </div>
                        </div>
                      </button>

                      <button
                        onClick={() => setPurchaseData(prev => ({ 
                          ...prev, 
                          sendToSelf: false 
                        }))}
                        className={`w-full p-4 rounded-lg border text-left transition-colors ${
                          !purchaseData.sendToSelf 
                            ? 'border-green-500 bg-green-50' 
                            : 'border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center">
                          <div className={`w-5 h-5 rounded-full border flex items-center justify-center mr-3 ${
                            !purchaseData.sendToSelf 
                              ? 'border-green-500 bg-green-500' 
                              : 'border-gray-400'
                          }`}>
                            {!purchaseData.sendToSelf && (
                              <div className="w-2 h-2 bg-white rounded-full"></div>
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">Send as a gift</div>
                            <div className="text-sm text-gray-600">Perfect for birthdays & celebrations</div>
                          </div>
                        </div>
                      </button>
                    </div>

                    {!purchaseData.sendToSelf && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mb-6 space-y-4"
                      >
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Recipient's Email
                          </label>
                          <input
                            type="email"
                            value={purchaseData.recipientEmail}
                            onChange={(e) => setPurchaseData(prev => ({ 
                              ...prev, 
                              recipientEmail: e.target.value 
                            }))}
                            placeholder="friend@example.com"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Gift Message (Optional)
                          </label>
                          <textarea
                            value={purchaseData.giftMessage}
                            onChange={(e) => setPurchaseData(prev => ({ 
                              ...prev, 
                              giftMessage: e.target.value 
                            }))}
                            placeholder="Add a personal message..."
                            rows="3"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          />
                        </div>
                      </motion.div>
                    )}

                    <div className="flex gap-3">
                      <button
                        onClick={() => setPurchaseData(prev => ({ ...prev, step: 1 }))}
                        className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                      >
                        Back
                      </button>
                      <button
                        onClick={() => setPurchaseData(prev => ({ ...prev, step: 3 }))}
                        className="flex-1 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                      >
                        Continue to Review
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Step 3: Review & Payment */}
                {purchaseData.step === 3 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Review & Payment</h4>
                    
                    {/* Order Summary */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-6">
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Voucher</span>
                          <span className="font-medium">{selectedVoucher.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Quantity</span>
                          <span className="font-medium">{purchaseData.quantity}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Recipient</span>
                          <span className="font-medium">
                            {purchaseData.sendToSelf ? 'Myself' : purchaseData.recipientEmail}
                          </span>
                        </div>
                        <div className="pt-3 border-t border-gray-200">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Total Amount</span>
                            <span className="text-xl font-bold text-green-600">
                              ₵{((selectedVoucher.discounted_price || 0) * purchaseData.quantity).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Security Info */}
                    <div className="flex items-center justify-center text-sm text-gray-500 mb-6">
                      <FaShieldAlt className="mr-2 text-green-500" />
                      Secure payment powered by Paystack
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => setPurchaseData(prev => ({ ...prev, step: 2 }))}
                        className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                        disabled={purchasing}
                      >
                        Back
                      </button>
                      <button
                        onClick={initiatePurchase}
                        disabled={purchasing}
                        className="flex-1 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {purchasing ? (
                          <>
                            <FaSpinner className="animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <FaRegCreditCard />
                            Pay Now
                          </>
                        )}
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VoucherStore;