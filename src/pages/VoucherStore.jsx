import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaCheckCircle, FaGift } from 'react-icons/fa';
import Footer from '../components/Footer';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthContext } from '../context/AuthContext';

// Default fallback banner if campaign has no image
import defaultBanner from '../assets/valentine_voucher_banner.webp';
import api from '../api';

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
  
  const { isAuthenticated, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  // Track if we've already processed the URL for this session
  const [hasProcessedInitialUrl, setHasProcessedInitialUrl] = useState(false);
  const [redeemCode, setRedeemCode] = useState('');

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

  const STEP_LABELS = ['Quantity', 'Recipient', 'Review'];
  const money = (v) => {
    const n = Number(v) || 0;
    return `₵${n % 1 ? n.toFixed(2) : n.toLocaleString('en-GH')}`;
  };
  const stockOf = (v) => v.available_stock ?? Math.max(0, (v.stock_quantity || 0) - (v.sold_quantity || 0));
  const total = selectedVoucher ? (Number(selectedVoucher.discounted_price) || 0) * purchaseData.quantity : 0;
  const maxQty = selectedVoucher ? Math.max(1, Math.min(stockOf(selectedVoucher) || 10, 10)) : 10;
  const setStep = (step) => setPurchaseData((p) => ({ ...p, step }));

  return (
    <div className="kkv">
      <style>{`
        .kkv{--ink:#0A0B0A;--paper:#F7F9F6;--card:#fff;--line:#D9DFD7;--muted:#4D564C;--green:#1A7A1A;--tint:#E6F0E4;
          --display:"Anton","Arial Narrow",Impact,sans-serif;--body:"League Spartan",system-ui,sans-serif;
          --spring:cubic-bezier(.2,1.25,.3,1);--swift:cubic-bezier(.77,0,.18,1);
          background:var(--paper);color:var(--ink);font-family:var(--body)}
        .kkv-wrap{max-width:1200px;margin:0 auto;padding:0 20px}
        .kkv-eyebrow{margin:0;font-size:12px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:var(--green)}
        .kkv-hero{padding:56px 0 34px;border-bottom:2px solid var(--ink);display:grid;grid-template-columns:minmax(0,1fr) 380px;gap:32px;align-items:end}
        .kkv-redeem{background:var(--ink);color:#fff;padding:24px}
        .kkv-redeem .kkv-eyebrow{color:#6FD46F}
        .kkv-redeem h2{margin:6px 0 16px;font-family:var(--display);font-weight:400;text-transform:uppercase;font-size:38px;line-height:.95}
        .kkv-redeem input{display:block;width:100%;height:54px;padding:0 14px;border:2px solid #fff;border-radius:2px;background:transparent;color:#fff;outline:none;
          font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:17px;font-weight:600;letter-spacing:.12em;transition:background .2s,box-shadow .2s}
        .kkv-redeem input::placeholder{color:rgba(255,255,255,.45)}
        .kkv-redeem input:focus{background:rgba(255,255,255,.06);box-shadow:0 4px 0 0 #4CB84C}
        .kkv-redeem button{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;height:54px;margin-top:10px;border:2px solid var(--green);border-radius:2px;
          background:var(--green);color:#fff;font:inherit;font-size:16px;font-weight:700;cursor:pointer;transition:background .2s,color .2s,border-color .2s}
        .kkv-redeem button .ar{transition:transform .3s var(--spring)}
        .kkv-redeem button:hover{background:#fff;border-color:#fff;color:var(--ink)}
        .kkv-redeem button:hover .ar{transform:translateX(5px)}
        .kkv-redeem :focus-visible{outline:2px solid #6FD46F;outline-offset:3px}
        @media (max-width:900px){.kkv-hero{grid-template-columns:1fr;gap:26px}}
        .kkv-hero h1{margin:10px 0 0;font-family:var(--display);font-weight:400;text-transform:uppercase;font-size:clamp(56px,9vw,120px);line-height:.88;max-width:11ch}
        .kkv-hero p{margin:18px 0 0;max-width:46ch;font-size:18px;line-height:1.5;color:var(--muted)}
        .kkv-facts{display:flex;flex-wrap:wrap;gap:10px 28px;margin:24px 0 0;padding:0;list-style:none}
        .kkv-facts li{display:flex;align-items:center;gap:10px;font-size:14px;font-weight:600;letter-spacing:.06em;text-transform:uppercase}
        .kkv-facts li span{width:20px;height:20px;display:grid;place-items:center;background:var(--green);color:#fff}
        .kkv-bar{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:14px;padding:22px 0}
        .kkv-chips{display:flex;flex-wrap:wrap;gap:8px}
        .kkv-chip{height:40px;padding:0 16px;border:2px solid var(--ink);border-radius:2px;background:transparent;color:var(--ink);font:inherit;font-size:14px;font-weight:700;cursor:pointer;transition:background .2s,color .2s}
        .kkv-chip:hover{background:var(--ink);color:#fff}
        .kkv-chip.on{background:var(--ink);color:#fff}
        .kkv-count{margin:0;font-size:14px;color:var(--muted)}
        .kkv-count b{color:var(--ink)}
        .kkv-banner{position:relative;overflow:hidden;min-height:200px;margin-bottom:24px;display:flex;align-items:flex-end;padding:24px;color:#fff;border:2px solid var(--ink)}
        .kkv-banner img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transition:transform 1.2s var(--swift)}
        .kkv-banner:hover img{transform:scale(1.04)}
        .kkv-banner::after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,rgba(10,11,10,.85) 0%,rgba(10,11,10,.35) 70%,rgba(10,11,10,.1) 100%)}
        .kkv-banner > div{position:relative;z-index:1;max-width:560px}
        .kkv-banner h2{margin:6px 0 0;font-family:var(--display);font-weight:400;text-transform:uppercase;font-size:clamp(34px,4.6vw,56px);line-height:.92}
        .kkv-banner p{margin:10px 0 0;color:#DDE3DB;font-size:16px;line-height:1.5}
        .kkv-banner .kkv-eyebrow{color:#6FD46F}
        .kkv-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:20px;padding-bottom:20px}
        .kkv-card{position:relative;display:flex;flex-direction:column;background:var(--card);border:1px solid var(--line);transition:transform .4s var(--spring),border-color .2s}
        .kkv-card:hover{transform:translateY(-4px);border-color:var(--ink)}
        .kkv-pic{position:relative;aspect-ratio:4/3;overflow:hidden;background:#fff;border-bottom:1px solid var(--line)}
        .kkv-pic img{width:100%;height:100%;object-fit:contain;display:block;transition:transform .9s var(--swift),opacity .4s}
        .kkv-pic img:not(.in){opacity:0}
        .kkv-card:hover .kkv-pic img{transform:scale(1.05)}
        .kkv-flag{position:absolute;top:0;right:0;z-index:1;background:var(--green);color:#fff;font-size:11px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;padding:6px 10px}
        .kkv-stock{position:absolute;bottom:10px;left:10px;z-index:1;background:rgba(10,11,10,.82);color:#fff;font-size:11px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;padding:5px 8px}
        .kkv-body{display:flex;flex-direction:column;gap:8px;flex:1;padding:20px}
        .kkv-body h3{margin:0;font-family:var(--display);font-weight:400;text-transform:uppercase;font-size:28px;line-height:.95;text-wrap:balance}
        .kkv-meta{margin:0;font-size:14px;color:var(--muted)}
        .kkv-meta i{font-style:normal;opacity:.4;margin:0 6px}
        .kkv-price{display:flex;align-items:baseline;flex-wrap:wrap;gap:4px 12px;margin-top:auto;padding-top:10px}
        .kkv-price strong{font-family:var(--display);font-weight:400;font-size:46px;line-height:1;font-variant-numeric:tabular-nums}
        .kkv-price s{color:var(--muted);font-size:16px}
        .kkv-price em{font-style:normal;font-size:13px;font-weight:700;color:var(--green)}
        .kkv-btn{display:inline-flex;align-items:center;justify-content:center;gap:10px;height:52px;border:2px solid var(--ink);border-radius:2px;background:transparent;
          color:var(--ink);font:inherit;font-size:15px;font-weight:700;cursor:pointer;transition:background .2s,color .2s,border-color .2s,transform .25s var(--spring)}
        .kkv-btn .ar{transition:transform .3s var(--spring)}
        .kkv-btn:hover:not(:disabled){background:var(--ink);color:#fff}
        .kkv-btn:hover:not(:disabled) .ar{transform:translateX(5px)}
        .kkv-btn:active:not(:disabled){transform:scale(.98)}
        .kkv-btn.go{background:var(--green);border-color:var(--green);color:#fff}
        .kkv-btn.go:hover:not(:disabled){background:var(--ink);border-color:var(--ink)}
        .kkv-btn:disabled{opacity:.45;cursor:default}
        .kkv-btn.wide{width:100%}
        .kkv-btn:focus-visible,.kkv-chip:focus-visible{outline:2px solid var(--green);outline-offset:3px}
        .kkv-empty{padding:56px 24px;border:2px dashed var(--line);text-align:center}
        .kkv-empty h3{margin:0;font-family:var(--display);font-weight:400;text-transform:uppercase;font-size:40px;line-height:.95}
        .kkv-empty p{margin:10px auto 20px;max-width:40ch;color:var(--muted)}
        .kkv-how{margin:40px 0 0;padding:28px 0 64px;border-top:2px solid var(--ink)}
        .kkv-how ol{list-style:none;margin:18px 0 0;padding:0;display:grid;grid-template-columns:repeat(3,1fr)}
        .kkv-how li{padding:4px 24px 0 0}
        .kkv-how li + li{padding-left:24px;border-left:1px solid var(--line)}
        .kkv-how .n{font-family:var(--display);font-size:56px;line-height:1;color:var(--green)}
        .kkv-how h3{margin:8px 0 6px;font-family:var(--display);font-weight:400;text-transform:uppercase;font-size:26px}
        .kkv-how p{margin:0;color:var(--muted);line-height:1.5}
        .kkv-skel{height:420px;background:linear-gradient(90deg,var(--line) 0%,#EEF2EC 50%,var(--line) 100%);background-size:200% 100%;animation:kkvShim 1.3s linear infinite}
        @keyframes kkvShim{to{background-position:-200% 0}}
        @media (max-width:760px){
          .kkv-hero{padding:36px 0 26px}.kkv-hero p{font-size:16px}
          .kkv-how ol{grid-template-columns:1fr;gap:22px}.kkv-how li + li{padding-left:0;border-left:0;border-top:1px solid var(--line);padding-top:18px}
          .kkv-grid{grid-template-columns:1fr}
        }

        .kkv-sheet-scrim{position:fixed;inset:0;z-index:60;background:rgba(10,11,10,.5);display:flex;align-items:center;justify-content:center;padding:16px}
        .kkv-sheet{width:100%;max-width:480px;max-height:calc(100vh - 32px);overflow:auto;background:var(--paper);border:2px solid var(--ink);font-family:var(--body);color:var(--ink)}
        @media (max-width:560px){.kkv-sheet-scrim{align-items:flex-end;padding:0}.kkv-sheet{max-width:none;border-width:2px 0 0;max-height:92vh}}
        .kkv-sheet-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;padding:20px 20px 14px;border-bottom:2px solid var(--ink)}
        .kkv-sheet-head h2{margin:4px 0 0;font-family:var(--display);font-weight:400;text-transform:uppercase;font-size:34px;line-height:.92}
        .kkv-x{flex:none;width:42px;height:42px;display:grid;place-items:center;border:2px solid var(--ink);background:none;color:var(--ink);cursor:pointer;transition:background .2s,color .2s,transform .3s var(--spring)}
        .kkv-x:hover{background:var(--ink);color:#fff;transform:rotate(90deg)}
        .kkv-steps{display:grid;grid-template-columns:repeat(3,1fr);border-bottom:1px solid var(--line)}
        .kkv-steps span{padding:12px 0 10px;text-align:center;font-size:11px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);border-bottom:3px solid transparent}
        .kkv-steps span.on{color:var(--ink);border-bottom-color:var(--green)}
        .kkv-steps span.done{color:var(--green)}
        .kkv-sheet-body{padding:22px 20px 20px}
        .kkv-qty{display:flex;align-items:center;justify-content:center;gap:22px;margin:6px 0 4px}
        .kkv-qty button{width:52px;height:52px;border:2px solid var(--ink);background:none;font-size:22px;cursor:pointer;color:var(--ink);transition:background .2s,color .2s}
        .kkv-qty button:hover:not(:disabled){background:var(--ink);color:#fff}
        .kkv-qty button:disabled{opacity:.25;cursor:default}
        .kkv-qty strong{min-width:80px;text-align:center;font-family:var(--display);font-weight:400;font-size:72px;line-height:1;font-variant-numeric:tabular-nums}
        .kkv-hint{margin:0;text-align:center;font-size:13px;color:var(--muted)}
        .kkv-sum{margin:20px 0;border-top:2px solid var(--ink)}
        .kkv-sum div{display:flex;justify-content:space-between;gap:12px;padding:10px 0;border-bottom:1px solid var(--line);font-size:15px}
        .kkv-sum div span:first-child{color:var(--muted)}
        .kkv-sum div.tot{border-bottom:0;align-items:baseline}
        .kkv-sum div.tot strong{font-family:var(--display);font-weight:400;font-size:40px;line-height:1}
        .kkv-opt{display:flex;gap:12px;width:100%;padding:14px;margin-bottom:10px;border:2px solid var(--line);background:var(--card);text-align:left;font:inherit;cursor:pointer;transition:border-color .2s}
        .kkv-opt.on{border-color:var(--green);background:var(--tint)}
        .kkv-opt .dot{flex:none;width:20px;height:20px;border:2px solid var(--ink);display:grid;place-items:center;margin-top:2px}
        .kkv-opt.on .dot{border-color:var(--green);background:var(--green)}
        .kkv-opt.on .dot::after{content:"";width:8px;height:8px;background:#fff}
        .kkv-opt b{display:block;font-size:16px}
        .kkv-opt small{display:block;margin-top:2px;color:var(--muted);font-size:13px}
        .kkv-field{display:flex;flex-direction:column;gap:7px;margin-top:14px}
        .kkv-field label{font-size:12px;font-weight:600;letter-spacing:.12em;text-transform:uppercase}
        .kkv-field label i{font-style:normal;font-weight:500;letter-spacing:.04em;text-transform:none;color:var(--muted);margin-left:6px}
        .kkv-field input,.kkv-field textarea{width:100%;padding:13px 14px;border:1.5px solid var(--line);border-radius:2px;background:var(--card);font:inherit;font-size:16px;color:var(--ink);outline:none;transition:border-color .2s,box-shadow .2s;resize:vertical}
        .kkv-field input:focus,.kkv-field textarea:focus{border-color:var(--ink);box-shadow:0 3px 0 0 var(--green)}
        .kkv-row{display:flex;gap:10px;margin-top:20px}
        .kkv-row .kkv-btn{flex:1}
        .kkv-secure{margin:14px 0 0;text-align:center;font-size:13px;color:var(--muted)}
        .kkv-spin{width:18px;height:18px;border-radius:50%;border:2.5px solid rgba(255,255,255,.35);border-top-color:#fff;animation:kkvSpin .8s linear infinite}
        @keyframes kkvSpin{to{transform:rotate(360deg)}}
      `}</style>

      <div className="kkv-wrap">
        <header className="kkv-hero">
          <div>
            <h1>Give a fresh pair</h1>
            <p>Gift someone a Klean. Pick a voucher, pay, and it arrives by email, ready to redeem online or at the studio.</p>
            <ul className="kkv-facts">
              {['Delivered by email', 'Valid for 6 months', 'Redeem online or in the studio'].map((f) => (
                <li key={f}>
                  <span aria-hidden="true"><svg viewBox="0 0 24 24" width="12" height="12"><path d="M5 12.5l4.2 4.2L19 7" fill="none" stroke="currentColor" strokeWidth="3.2" /></svg></span>
                  {f}
                </li>
              ))}
            </ul>
          </div>

          {/* Already have a voucher? Redeem it right here. */}
          <form
            className="kkv-redeem"
            aria-labelledby="kkv-redeem-h"
            onSubmit={(e) => {
              e.preventDefault();
              const c = redeemCode.trim().toUpperCase();
              navigate(c ? `/redeem?apply_voucher=${encodeURIComponent(c)}` : '/redeem');
            }}
          >
            <p className="kkv-eyebrow">Already have one?</p>
            <h2 id="kkv-redeem-h">Redeem a voucher</h2>
            <label htmlFor="kkv-redeem-code" className="sr-only">Voucher code</label>
            <input
              id="kkv-redeem-code"
              value={redeemCode}
              onChange={(e) => setRedeemCode(e.target.value.toUpperCase())}
              placeholder="ENTER YOUR CODE"
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
            />
            <button type="submit">Redeem <span className="ar" aria-hidden="true">→</span></button>
          </form>
        </header>

        <div className="kkv-bar">
          {campaigns.length > 0 ? (
            <div className="kkv-chips" role="tablist" aria-label="Collections">
              <button type="button" role="tab" aria-selected={!selectedCampaign} className={`kkv-chip ${!selectedCampaign ? 'on' : ''}`}
                onClick={() => handleCampaignClick(null)}>All vouchers</button>
              {campaigns.map((c) => (
                <button key={c.id} type="button" role="tab" aria-selected={selectedCampaign?.id === c.id}
                  className={`kkv-chip ${selectedCampaign?.id === c.id ? 'on' : ''}`} onClick={() => handleCampaignClick(c)}>
                  {c.name}
                </button>
              ))}
            </div>
          ) : <span />}
          {!loading && (
            <p className="kkv-count"><b>{String(voucherTypes.length).padStart(2, '0')}</b> voucher{voucherTypes.length !== 1 ? 's' : ''}{selectedCampaign ? ` in ${selectedCampaign.name}` : ''}</p>
          )}
        </div>

        {selectedCampaign && (
          <motion.section className="kkv-banner" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.77, 0, 0.18, 1] }}>
            <img src={(selectedCampaign.banner_image_url || '').replace(/^http:\/\//, 'https://') || defaultBanner} alt="" onLoad={() => setCampaignImageLoaded(true)}
              onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = defaultBanner; }} />
            <div>
              <p className="kkv-eyebrow">Special collection</p>
              <h2>{selectedCampaign.name}</h2>
              {selectedCampaign.description && <p>{selectedCampaign.description}</p>}
            </div>
          </motion.section>
        )}

        <div className="vouchers-grid">
          {loading ? (
            <div className="kkv-grid">{[0, 1, 2].map((k) => <div key={k} className="kkv-skel" />)}</div>
          ) : voucherTypes.length === 0 ? (
            <div className="kkv-empty">
              <h3>{selectedCampaign ? 'Nothing here yet' : 'Vouchers coming soon'}</h3>
              <p>{selectedCampaign ? `Check back soon for ${selectedCampaign.name} vouchers.` : 'New gift vouchers are on their way. Check back soon.'}</p>
              {selectedCampaign && <button type="button" className="kkv-btn go" style={{ padding: '0 22px' }} onClick={() => handleCampaignClick(null)}>See all vouchers <span className="ar" aria-hidden="true">→</span></button>}
            </div>
          ) : (
            <div className="kkv-grid">
              {voucherTypes.map((voucher, index) => {
                const service = voucher.service_details?.name || 'Sneaker Klean';
                const pairs = Number(voucher.service_details?.included_quantity) || 1;
                const stock = stockOf(voucher);
                const save = (Number(voucher.original_price) || 0) - (Number(voucher.discounted_price) || 0);
                const image = (voucher.voucher_card_image_url || voucher.voucher_card_thumbnail_url || voucher.service_details?.image || '').replace(/^http:\/\//, 'https://');
                const pct = Number(voucher.discount_percentage) || 0;
                return (
                  <motion.article key={voucher.id} className="kkv-card"
                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: index * 0.06, ease: [0.77, 0, 0.18, 1] }}>
                    <div className="kkv-pic">
                      {image && <img src={image} alt="" loading="lazy" ref={(el) => { if (el?.complete && el.naturalWidth && !loadedImages[voucher.id]) handleImageLoad(voucher.id); }}
                        onLoad={() => handleImageLoad(voucher.id)} className={loadedImages[voucher.id] ? 'in' : ''} onError={(e) => { e.currentTarget.style.display = 'none'; }} />}
                      {pct > 0 && <span className="kkv-flag">{pct % 1 ? pct.toFixed(1) : pct}% off</span>}
                      {stock > 0 && stock <= 10 && <span className="kkv-stock">Only {stock} left</span>}
                      {stock <= 0 && <span className="kkv-stock">Sold out</span>}
                    </div>
                    <div className="kkv-body">
                      <h3>{voucher.name}</h3>
                      <p className="kkv-meta">{service}<i>/</i>{pairs} {pairs === 1 ? 'pair' : 'pairs'}{voucher.validity_months ? <><i>/</i>Valid {voucher.validity_months} months</> : null}</p>
                      <div className="kkv-price">
                        <strong>{money(voucher.discounted_price)}</strong>
                        {Number(voucher.original_price) > Number(voucher.discounted_price) && <s>{money(voucher.original_price)}</s>}
                        {save > 0 && <em>Save {money(save)}</em>}
                      </div>
                      <button type="button" className={`kkv-btn ${stock > 0 ? 'go' : ''} wide`} onClick={() => handlePurchaseClick(voucher)} disabled={stock <= 0}>
                        {stock > 0 ? <>Buy this voucher <span className="ar" aria-hidden="true">→</span></> : 'Sold out'}
                      </button>
                    </div>
                  </motion.article>
                );
              })}
            </div>
          )}
        </div>

        <section className="kkv-how" aria-labelledby="kkv-how-h">
          <p className="kkv-eyebrow" id="kkv-how-h">How it works</p>
          <ol>
            {[
              ['Choose', 'Pick a voucher for the Klean you want to give: one pair or a whole bundle.'],
              ['Pay', 'Check out securely with Mobile Money or card through Paystack.'],
              ['Gift', "We email the voucher to you or straight to them, with your message. They book whenever they're ready."],
            ].map(([t, d], i) => (
              <li key={t}><span className="n">{String(i + 1).padStart(2, '0')}</span><h3>{t}</h3><p>{d}</p></li>
            ))}
          </ol>
        </section>
      </div>

      <Footer />

      <AnimatePresence>
        {showPurchaseModal && selectedVoucher && (
          <motion.div className="kkv-sheet-scrim" onClick={() => !purchasing && handleCloseModal()}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="kkv-sheet" role="dialog" aria-modal="true" aria-labelledby="kkv-sheet-title" onClick={(e) => e.stopPropagation()}
              initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }} transition={{ duration: 0.45, ease: [0.77, 0, 0.18, 1] }}>
              <div className="kkv-sheet-head">
                <div>
                  <p className="kkv-eyebrow">Gift voucher</p>
                  <h2 id="kkv-sheet-title">{selectedVoucher.name}</h2>
                </div>
                <button type="button" className="kkv-x" onClick={handleCloseModal} disabled={purchasing} aria-label="Close">
                  <svg viewBox="0 0 16 16" width="13" height="13"><path d="M2 2l12 12M14 2L2 14" stroke="currentColor" strokeWidth="2.2" /></svg>
                </button>
              </div>
              <div className="kkv-steps" aria-hidden="true">
                {STEP_LABELS.map((l, i) => (
                  <span key={l} className={purchaseData.step === i + 1 ? 'on' : purchaseData.step > i + 1 ? 'done' : ''}>{String(i + 1).padStart(2, '0')} {l}</span>
                ))}
              </div>

              <div className="kkv-sheet-body">
                {purchaseData.step === 1 && (
                  <motion.div key="s1" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}>
                    <p className="kkv-eyebrow" style={{ textAlign: 'center' }}>How many?</p>
                    <div className="kkv-qty">
                      <button type="button" aria-label="One fewer" disabled={purchaseData.quantity <= 1}
                        onClick={() => setPurchaseData((p) => ({ ...p, quantity: Math.max(1, p.quantity - 1) }))}>−</button>
                      <strong aria-live="polite">{String(purchaseData.quantity).padStart(2, '0')}</strong>
                      <button type="button" aria-label="One more" disabled={purchaseData.quantity >= maxQty}
                        onClick={() => setPurchaseData((p) => ({ ...p, quantity: Math.min(maxQty, p.quantity + 1) }))}>+</button>
                    </div>
                    <p className="kkv-hint">Up to {maxQty} at a time</p>
                    <div className="kkv-sum">
                      <div><span>Each</span><span>{money(selectedVoucher.discounted_price)}</span></div>
                      <div className="tot"><span>Total</span><strong>{money(total)}</strong></div>
                    </div>
                    <button type="button" className="kkv-btn go wide" onClick={() => setStep(2)}>Continue <span className="ar" aria-hidden="true">→</span></button>
                  </motion.div>
                )}

                {purchaseData.step === 2 && (
                  <motion.div key="s2" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}>
                    <p className="kkv-eyebrow" style={{ marginBottom: 12 }}>Who is it for?</p>
                    <button type="button" className={`kkv-opt ${purchaseData.sendToSelf ? 'on' : ''}`}
                      onClick={() => setPurchaseData((p) => ({ ...p, sendToSelf: true, recipientEmail: '', giftMessage: '' }))}>
                      <span className="dot" aria-hidden="true" />
                      <span><b>Me</b><small>It's added to your account to use or pass on later.</small></span>
                    </button>
                    <button type="button" className={`kkv-opt ${!purchaseData.sendToSelf ? 'on' : ''}`}
                      onClick={() => setPurchaseData((p) => ({ ...p, sendToSelf: false }))}>
                      <span className="dot" aria-hidden="true" />
                      <span><b>Someone else</b><small>We email it to them, with your message.</small></span>
                    </button>
                    {!purchaseData.sendToSelf && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                        <div className="kkv-field">
                          <label htmlFor="kkv-to">Their email</label>
                          <input id="kkv-to" type="email" inputMode="email" placeholder="friend@example.com" value={purchaseData.recipientEmail}
                            onChange={(e) => setPurchaseData((p) => ({ ...p, recipientEmail: e.target.value }))} />
                        </div>
                        <div className="kkv-field">
                          <label htmlFor="kkv-msg">Your message<i>Optional</i></label>
                          <textarea id="kkv-msg" rows={3} placeholder="Happy birthday! Your kicks are on me." value={purchaseData.giftMessage}
                            onChange={(e) => setPurchaseData((p) => ({ ...p, giftMessage: e.target.value }))} />
                        </div>
                      </motion.div>
                    )}
                    <div className="kkv-row">
                      <button type="button" className="kkv-btn" onClick={() => setStep(1)}>Back</button>
                      <button type="button" className="kkv-btn go" onClick={() => {
                        if (!purchaseData.sendToSelf && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(purchaseData.recipientEmail)) {
                          toast.error('Please enter their email address.');
                          return;
                        }
                        setStep(3);
                      }}>Review <span className="ar" aria-hidden="true">→</span></button>
                    </div>
                  </motion.div>
                )}

                {purchaseData.step === 3 && (
                  <motion.div key="s3" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}>
                    <div className="kkv-sum" style={{ marginTop: 0 }}>
                      <div><span>Voucher</span><span>{selectedVoucher.name}</span></div>
                      <div><span>Quantity</span><span>{purchaseData.quantity}</span></div>
                      <div><span>For</span><span>{purchaseData.sendToSelf ? 'Me' : purchaseData.recipientEmail}</span></div>
                      {!purchaseData.sendToSelf && purchaseData.giftMessage && <div><span>Message</span><span style={{ textAlign: 'right' }}>“{purchaseData.giftMessage}”</span></div>}
                      <div className="tot"><span>Total</span><strong>{money(total)}</strong></div>
                    </div>
                    <div className="kkv-row">
                      <button type="button" className="kkv-btn" onClick={() => setStep(2)} disabled={purchasing}>Back</button>
                      <button type="button" className="kkv-btn go" onClick={initiatePurchase} disabled={purchasing}>
                        {purchasing ? <><span className="kkv-spin" aria-hidden="true" /> Opening Paystack…</> : <>Pay {money(total)} <span className="ar" aria-hidden="true">→</span></>}
                      </button>
                    </div>
                    <p className="kkv-secure">Secure payment by Paystack · Mobile Money or card</p>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VoucherStore;