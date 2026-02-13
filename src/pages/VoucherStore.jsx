import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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

// Default fallback banner if campaign has no image
import defaultBanner from '../assets/valentine_voucher_banner.webp';

const VoucherStore = () => {
  const [voucherTypes, setVoucherTypes] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [loadedImages, setLoadedImages] = useState({});
  const [campaignImageLoaded, setCampaignImageLoaded] = useState(false);
  const [purchaseData, setPurchaseData] = useState({
    quantity: 1,
    sendToSelf: true,
    recipientEmail: '',
    giftMessage: '',
    step: 1
  });
  
  const { api, isAuthenticated, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  // Track if we've already processed the URL for this session
  const [hasProcessedInitialUrl, setHasProcessedInitialUrl] = useState(false);

  useEffect(() => {
    fetchVoucherTypes();
    fetchCampaigns();
    
    // Clear any session storage on mount
    sessionStorage.removeItem('pending_voucher_purchase');
    sessionStorage.removeItem('pending_voucher_order');
  }, []);

  useEffect(() => {
    // Check for payment redirect
    const handlePaymentRedirect = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const paymentStatus = urlParams.get('payment_status');
      const orderNumber = urlParams.get('order');
      
      if (paymentStatus === 'success' && orderNumber) {
        // Clear all session storage
        sessionStorage.removeItem('pending_voucher_purchase');
        sessionStorage.removeItem('pending_voucher_order');
        
        toast.success(
          <div className="flex items-center">
            <FaCheckCircle className="mr-2 text-green-500" />
            Payment successful! Your vouchers have been created.
          </div>
        );
        
        // Clean URL
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
        
        setTimeout(() => {
          navigate(`/account/vouchers?order=${orderNumber}`);
        }, 2000);
      } else if (paymentStatus === 'failed' || paymentStatus === 'cancelled') {
        sessionStorage.removeItem('pending_voucher_order');
        toast.error('Payment was cancelled or failed. Please try again.');
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
      }
    };
    
    handlePaymentRedirect();
  }, [navigate]);

  // ONLY ONE WAY TO OPEN MODAL: URL parameters after login redirect
  useEffect(() => {
    // Don't process if we've already done it or if no voucher types loaded yet
    if (hasProcessedInitialUrl || voucherTypes.length === 0 || !isAuthenticated) {
      return;
    }

    const searchParams = new URLSearchParams(location.search);
    const voucherId = searchParams.get('voucher');
    const purchaseStep = searchParams.get('step');
    
    // Only open modal if BOTH parameters are present
    if (voucherId && purchaseStep === 'purchase') {
      // Mark as processed immediately
      setHasProcessedInitialUrl(true);
      
      // Clear URL parameters
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
      
      // Find the voucher
      const voucher = voucherTypes.find(v => v.id === parseInt(voucherId));
      if (voucher) {
        // Don't show toast - just open modal quietly
        setSelectedVoucher(voucher);
        setShowPurchaseModal(true);
        setPurchaseData({
          quantity: 1,
          sendToSelf: true,
          recipientEmail: '',
          giftMessage: '',
          step: 1
        });
      }
    }
  }, [location.search, voucherTypes, isAuthenticated, hasProcessedInitialUrl]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      sessionStorage.removeItem('pending_voucher_purchase');
    };
  }, []);

  const fetchVoucherTypes = async () => {
    try {
      setLoading(true);
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
      const response = await api.get(`/api/vouchers/campaigns/`);
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

  const handleCampaignClick = async (campaign) => {
    // Close modal if open
    if (showPurchaseModal) {
      handleCloseModal();
    }
    
    setSelectedCampaign(campaign);
    setCampaignImageLoaded(false);
    
    if (campaign) {
      try {
        setLoading(true);
        const response = await api.get(`/api/vouchers/campaigns/${campaign.id}/vouchers/`);
        let campaignVouchers = response.data;
        
        if (response.data && response.data.results) {
          campaignVouchers = response.data.results;
        }
        
        if (Array.isArray(campaignVouchers)) {
          setVoucherTypes(campaignVouchers);
        } else {
          const filtered = voucherTypes.filter(voucher => {
            if (!voucher.campaigns) return false;
            
            if (Array.isArray(voucher.campaigns) && voucher.campaigns.length > 0) {
              if (typeof voucher.campaigns[0] === 'number') {
                return voucher.campaigns.includes(campaign.id);
              }
              if (typeof voucher.campaigns[0] === 'object') {
                return voucher.campaigns.some(c => c.id === campaign.id);
              }
            }
            
            return false;
          });
          
          setVoucherTypes(filtered);
        }
        
      } catch (error) {
        console.error('Error fetching campaign vouchers:', error);
        await filterVouchersByCampaign(campaign);
      } finally {
        setLoading(false);
      }
    } else {
      await fetchVoucherTypes();
    }
  };

  const filterVouchersByCampaign = async (campaign) => {
    try {
      const response = await api.get(`/api/vouchers/types/?in_stock=true`);
      let allVouchers = response.data;
      
      if (response.data && response.data.results) {
        allVouchers = response.data.results;
      }
      
      if (Array.isArray(allVouchers)) {
        const filtered = allVouchers.filter(voucher => {
          if (!voucher.campaigns) return false;
          
          if (Array.isArray(voucher.campaigns)) {
            if (voucher.campaigns.length === 0) return false;
            
            if (typeof voucher.campaigns[0] === 'number') {
              return voucher.campaigns.includes(campaign.id);
            }
            
            if (typeof voucher.campaigns[0] === 'object') {
              return voucher.campaigns.some(c => c.id === campaign.id);
            }
            
            if (typeof voucher.campaigns[0] === 'string') {
              return voucher.campaigns.some(c => parseInt(c) === campaign.id);
            }
          }
          
          if (typeof voucher.campaigns === 'string') {
            const ids = voucher.campaigns.split(',').map(id => parseInt(id.trim()));
            return ids.includes(campaign.id);
          }
          
          return false;
        });
        
        setVoucherTypes(filtered);
      }
    } catch (error) {
      console.error('Error filtering vouchers:', error);
    }
  };

  const handlePurchaseClick = (voucher) => {
    // Check authentication first
    if (!isAuthenticated) {
      // Use URL parameters ONLY - no session storage
      toast.info(
        <div className="flex items-center">
          <FaGift className="mr-2 text-green-500" />
          Please login to purchase "{voucher.name}"
        </div>,
        {
          autoClose: 5000
        }
      );
      
      // Navigate to login with URL parameters
      navigate(`/auth/login?continue=${encodeURIComponent(`/vouchers?voucher=${voucher.id}&step=purchase`)}`);
      return;
    }
    
    // Check if user is verified if required
    if (user && user.is_verified === false) {
      toast.warn('Please verify your email before making a purchase');
      navigate(`/auth/confirm-email/?email=${user?.email}&isVerified=false&next=${encodeURIComponent(`/vouchers?voucher=${voucher.id}&step=purchase`)}`);
      return;
    }
    
    // If authenticated and verified, proceed with purchase modal
    // Reset the URL processing flag so we can manually open modal
    setHasProcessedInitialUrl(true);
    
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

  const handleCloseModal = () => {
    // Clear everything when modal is closed
    setShowPurchaseModal(false);
    setSelectedVoucher(null);
    setPurchasing(false);
    setPurchaseData({
      quantity: 1,
      sendToSelf: true,
      recipientEmail: '',
      giftMessage: '',
      step: 1
    });
    
    // Clear session storage
    sessionStorage.removeItem('pending_voucher_purchase');
    sessionStorage.removeItem('pending_voucher_order');
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
        // Use sessionStorage only for payment flow (will clear on tab close)
        const orderData = {
          order_number: response.data.order_number,
          voucher_type: selectedVoucher.name,
          quantity: purchaseData.quantity,
          total_amount: response.data.total_amount,
          timestamp: new Date().toISOString(),
          status: 'pending_payment'
        };
        
        sessionStorage.setItem('pending_voucher_order', JSON.stringify(orderData));
        
        // Navigate to payment URL
        window.location.href = response.data.payment_url;
      } else {
        toast.error(response.data.message || 'Failed to initialize payment');
        setPurchasing(false);
      }

    } catch (error) {
      console.error('Purchase error:', error);
      
      sessionStorage.removeItem('pending_voucher_order');
      
      if (error.response) {
        const errorMessage = error.response.data?.message || 
                            error.response.data?.error || 
                            'Purchase failed';
        toast.error(errorMessage);
        
        if (error.response.status === 401) {
          toast.info('Session expired. Please login again');
          navigate(`/auth/login?continue=${encodeURIComponent(`/vouchers?voucher=${selectedVoucher.id}&step=purchase`)}`);
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
      
      setPurchasing(false);
    }
  };

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

  // Helper function to determine overlay gradient based on campaign name/theme
  const getCampaignOverlay = (campaign) => {
    if (!campaign) return 'bg-gradient-to-r from-black/60 to-black/40';
    
    const name = campaign.name?.toLowerCase() || '';
    const themeColor = campaign.theme_color || '';
    
    // Custom gradients based on campaign name
    if (name.includes('valentine') || name.includes('love') || name.includes('heart')) {
      return 'bg-gradient-to-r from-red-900/70 via-pink-800/60 to-purple-900/70';
    } else if (name.includes('christmas') || name.includes('xmas')) {
      return 'bg-gradient-to-r from-green-900/70 to-red-900/70';
    } else if (name.includes('summer')) {
      return 'bg-gradient-to-r from-yellow-900/60 to-orange-900/60';
    } else if (name.includes('spring')) {
      return 'bg-gradient-to-r from-green-900/60 to-blue-900/60';
    } else if (name.includes('birthday')) {
      return 'bg-gradient-to-r from-purple-900/60 to-pink-900/60';
    } else if (name.includes('black friday')) {
      return 'bg-gradient-to-r from-black/80 to-gray-900/80';
    } else if (name.includes('new year')) {
      return 'bg-gradient-to-r from-blue-900/70 to-purple-900/70';
    }
    
    // Use theme color if provided
    if (themeColor) {
      // Convert hex to rgba for gradient
      const hex = themeColor.replace('#', '');
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      return `bg-gradient-to-r from-[rgba(${r},${g},${b},0.8)] to-[rgba(${r},${g},${b},0.6)]`;
    }
    
    // Default gradient
    return 'bg-gradient-to-r from-green-900/70 to-emerald-900/70';
  };

  if (loading) {
    return (
      <div className="min-h-[90vh] flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <FaSpinner className="animate-spin text-4xl text-green-600 mx-auto mb-4" />
          </div>
          <p className="text-gray-600 mt-2">Loading voucher collection...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-8 px-4 md:px-8 lg:px-24">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            <span className="">Gift Vouchers</span>
          </h1>
          <p className="text-gray-600 max-w-2xl">
            Give the gift of pristine sneakers! Purchase vouchers at 10% discount and save on premium cleaning services.
          </p>
        </div>

        {/* Campaign Selector */}
        {campaigns.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-700 mb-3">Special Campaigns</h2>
            <div className="flex flex-wrap gap-2 overflow-x-auto">
              <button
                onClick={() => handleCampaignClick(null)}
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
                  onClick={() => handleCampaignClick(campaign)}
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

      {/* Campaign Banner - Now with Image */}
      {selectedCampaign && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-7xl mx-auto mb-8 rounded-xl overflow-hidden relative cursor-pointer group"
          onClick={() => {
            const voucherGrid = document.querySelector('.vouchers-grid');
            if (voucherGrid) {
              const offsetTop = voucherGrid.offsetTop - 100;
              window.scrollTo({ top: offsetTop, behavior: 'smooth' });
            }
          }}
        >
          {/* Banner Image */}
          <div className="relative h-[180px] overflow-hidden">
            {/* Loading placeholder */}
            {!campaignImageLoaded && (
              <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse"></div>
            )}
            
            {/* Actual image */}
            <img
              src={selectedCampaign.banner_image_url || defaultBanner}
              alt={selectedCampaign.name}
              className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 ${
                !campaignImageLoaded ? 'opacity-0' : 'opacity-100'
              }`}
              onLoad={() => setCampaignImageLoaded(true)}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = defaultBanner;
              }}
            />
            
            {/* Gradient Overlay */}
            <div className={`absolute inset-0 ${getCampaignOverlay(selectedCampaign)}`}></div>
            
            {/* Content Overlay */}
            <div className="absolute inset-0 ">
              <div className="text-white max-w-3xl px-4 py-4">
                {/* Special Offer Badge */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="inline-flex gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-4 border border-white/30"
                >
                  <FaStar className="text-yellow-300 animate-pulse" />
                  <span className="font-semibold text-sm uppercase tracking-wider">SPECIAL OFFER</span>
                </motion.div>
                
                {/* Campaign Name */}
                <motion.h2 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-3xl font-bold mb-2 drop-shadow-lg"
                >
                  {selectedCampaign.name}
                </motion.h2>
                
                {/* Campaign Description */}
                {selectedCampaign.description && (
                  <motion.p 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-base mb-6 text-white/90 max-w-2xl"
                  >
                    {selectedCampaign.description}
                  </motion.p>
                )}
                
                
                {/* Scroll Indicator */}
                {/* <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="mt-6"
                >
                  <div className="animate-bounce">
                    <FaArrowRight className="text-white text-xl rotate-90 mx-auto opacity-70" />
                  </div>
                </motion.div> */}
              </div>
            </div>
            
            {/* Theme Color Accent Line */}
            <div 
              className="absolute bottom-0 left-0 right-0 h-1"
              style={{ backgroundColor: selectedCampaign.theme_color || '#10b981' }}
            />
          </div>
        </motion.div>
      )}

      {/* Results Count */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex">
          <p className="text-gray-700">
            <span className="font-semibold">{voucherTypes.length}</span> voucher{voucherTypes.length !== 1 ? 's' : ''} available
            {selectedCampaign && (
              <span className="ml-2 text-sm text-gray-500">
                in "{selectedCampaign.name}"
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Voucher Grid */}
      <div className="max-w-7xl mx-auto vouchers-grid">
        {voucherTypes.length === 0 ? (
          <div className="text-center py-16  bg-white rounded-xl border border-gray-200">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaGift className="text-2xl text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              {selectedCampaign ? `No vouchers found for "${selectedCampaign.name}"` : 'No vouchers available'}
            </h3>
            <p className="text-gray-600 mb-6">
              {selectedCampaign 
                ? `Check back soon for "${selectedCampaign.name}" vouchers.`
                : 'New vouchers coming soon!'}
            </p>
            <button 
              onClick={() => handleCampaignClick(null)}
              className="px-5 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
            >
              View All Vouchers
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {voucherTypes.map((voucher, index) => {
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

      {/* How It Works */}
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

      {/* Enhanced Purchase Modal */}
      <AnimatePresence>
        {showPurchaseModal && selectedVoucher && (
          <div 
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={handleCloseModal}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl max-w-md w-full overflow-hidden shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header with Steps */}
              <div className="">
                <div className="flex items-center justify-between p-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Purchase Voucher</h3>
                    <p className="text-sm text-gray-600">{selectedVoucher.name}</p>
                  </div>
                  <button
                    onClick={handleCloseModal}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
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