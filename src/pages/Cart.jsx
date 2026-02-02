import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { 
  TrashIcon, 
  MinusIcon, 
  PlusIcon, 
  PhotoIcon,
  XMarkIcon,
  FolderIcon,
  ShoppingBagIcon,
  CameraIcon,
  CheckCircleIcon,
  GiftIcon,
  InformationCircleIcon,
  SparklesIcon,
  TicketIcon
} from '@heroicons/react/24/outline';
import { FaSpinner, FaGift, FaTag } from 'react-icons/fa6';
import { FaTimes } from 'react-icons/fa';
import axios from 'axios';
import heic2any from 'heic2any';

const Cart = () => {
  const { 
    cart, 
    updateQuantity, 
    removeFromCart, 
    addImageToCartItem, 
    removeImageFromCartItem,
    hasImage,
    getImageBase64
  } = useContext(CartContext);
  const { discounts, user, api } = useContext(AuthContext);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [serviceLoading, setServiceLoading] = useState({});
  const [uploadingImages, setUploadingImages] = useState({});
  const [previewImage, setPreviewImage] = useState(null);
  const [imagePreviews, setImagePreviews] = useState({});
  const [cameraMode, setCameraMode] = useState(null);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [isFrontCamera, setIsFrontCamera] = useState(false);
  const [voucherDetails, setVoucherDetails] = useState({});
  const fileInputRefs = useRef({});
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const navigate = useNavigate();
  const baseURL = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:10000';

  const [signupDiscountUsed, setSignupDiscountUsed] = useState(false);
  const [referralDiscountUsed, setReferralDiscountUsed] = useState(false);
  const [availablePromotions, setAvailablePromotions] = useState([]);
  const [appliedPromotion, setAppliedPromotion] = useState(null);
  const [redeemedPointsDiscount, setRedeemedPointsDiscount] = useState({});

  // Fetch voucher details for items in cart
  useEffect(() => {
    const fetchVoucherDetails = async () => {
      const voucherItems = cart.filter(item => item.is_voucher_redeem);
      
      for (const item of voucherItems) {
        if (item.voucher_code && !voucherDetails[item.service_id]) {
          try {
            const response = await api.post('/api/vouchers/redeem/', {
              voucher_code: item.voucher_code
            });
            
            if (response.data.voucher) {
              setVoucherDetails(prev => ({
                ...prev,
                [item.service_id]: response.data.voucher
              }));
            }
          } catch (error) {
            console.error('Error fetching voucher details:', error);
          }
        }
      }
    };

    if (user && cart.some(item => item.is_voucher_redeem)) {
      fetchVoucherDetails();
    }
  }, [cart, user, api]);

  // Check if any voucher in cart has already been redeemed elsewhere
  useEffect(() => {
    const checkVoucherStatus = async () => {
      const voucherItems = cart.filter(item => item.is_voucher_redeem);
      
      for (const item of voucherItems) {
        if (item.voucher_code) {
          try {
            const response = await api.post('/api/vouchers/redeem/', {
              voucher_code: item.voucher_code
            });
            
            // Check if voucher is already redeemed
            if (response.data.voucher?.status === 'REDEEMED') {
              toast.error(
                <div className="flex items-center gap-2">
                  <FaTimes className="text-red-500" />
                  <span>Voucher {item.voucher_code} has already been redeemed!</span>
                </div>,
                { autoClose: 5000 }
              );
              
              // Remove the invalid voucher from cart
              removeFromCart(item.service_id);
            }
            
            // Also check if voucher is expired
            if (response.data.voucher?.valid_until) {
              const expiryDate = new Date(response.data.voucher.valid_until);
              const today = new Date();
              if (expiryDate < today) {
                toast.error(
                  <div className="flex items-center gap-2">
                    <FaTimes className="text-red-500" />
                    <span>Voucher {item.voucher_code} has expired!</span>
                  </div>,
                  { autoClose: 5000 }
                );
                removeFromCart(item.service_id);
              }
            }
          } catch (error) {
            // If 404 or error, voucher might not exist
            if (error.response?.status === 404) {
              toast.error(
                <div className="flex items-center gap-2">
                  <FaTimes className="text-red-500" />
                  <span>Voucher {item.voucher_code} is invalid or expired!</span>
                </div>,
                { autoClose: 5000 }
              );
              removeFromCart(item.service_id);
            }
          }
        }
      }
    };

    if (user && cart.some(item => item.is_voucher_redeem)) {
      checkVoucherStatus();
    }
  }, [cart, user, api, removeFromCart]);

  const base64ToBlobUrl = (base64String) => {
    if (!base64String) return null;
    try {
      const base64Data = base64String.includes('base64,') ? base64String.split(',')[1] : base64String;
      const byteCharacters = atob(base64Data);
      const byteArrays = [];
      for (let offset = 0; offset < byteCharacters.length; offset += 512) {
        const slice = byteCharacters.slice(offset, offset + 512);
        const byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) byteNumbers[i] = slice.charCodeAt(i);
        byteArrays.push(new Uint8Array(byteNumbers));
      }
      return URL.createObjectURL(new Blob(byteArrays, { type: 'image/jpeg' }));
    } catch (error) {
      console.error('Failed to convert base64 to blob URL:', error);
      return null;
    }
  };

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const convertHeicToJpeg = async (file) => {
    try {
      const result = await heic2any({
        blob: file,
        toType: 'image/jpeg',
        quality: 0.8
      });
      
      return new File([result], file.name.replace(/\.heic$/i, '.jpg'), {
        type: 'image/jpeg',
        lastModified: Date.now()
      });
    } catch (error) {
      console.error('Error converting HEIC to JPEG:', error);
      throw new Error('Failed to convert HEIC image');
    }
  };

  const processImage = async (file) => {
    const isHeic = file.type === 'image/heic' || file.type === 'image/heif' || 
                   file.name.toLowerCase().endsWith('.heic') || 
                   file.name.toLowerCase().endsWith('.heif');
    
    if (isHeic) {
      const jpegFile = await convertHeicToJpeg(file);
      return await processJpegImage(jpegFile);
    }
    
    return await processJpegImage(file);
  };

  const processJpegImage = (file) => {
    return new Promise((resolve, reject) => {
      if (file.size < 1024 * 1024) return resolve(file);
      const img = new Image();
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          let { width, height } = img;
          const maxSize = 1200;
          if (width > height && width > maxSize) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          } else if (height > maxSize) {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => {
            if (!blob) return reject(new Error('Failed to process image'));
            resolve(new File([blob], file.name || `image-${Date.now()}.jpg`, { type: 'image/jpeg' }));
          }, 'image/jpeg', 0.85);
        };
      };
      reader.readAsDataURL(file);
    });
  };

  const validateImageFile = (file) => {
    const validTypes = [
      'image/jpeg', 
      'image/jpg', 
      'image/png', 
      'image/webp',
      'image/heic',
      'image/heif'
    ];
    
    const fileName = file.name.toLowerCase();
    const isHeicByExtension = fileName.endsWith('.heic') || fileName.endsWith('.heif');
    const isHeicByType = file.type === 'image/heic' || file.type === 'image/heif';
    
    if (!validTypes.includes(file.type) && !isHeicByExtension && !isHeicByType) {
      return { 
        valid: false, 
        message: 'Please upload a valid image (JPEG, PNG, WebP, or HEIC)' 
      };
    }
    
    if (file.size > 15 * 1024 * 1024) {
      return { 
        valid: false, 
        message: 'Image size should be less than 15MB' 
      };
    }
    
    return { valid: true };
  };

  // Initialize image previews
  useEffect(() => {
    const newPreviews = {};
    cart.forEach(item => {
      if (item.service_id && hasImage(item.service_id)) {
        const base64 = getImageBase64(item.service_id);
        const blobUrl = base64ToBlobUrl(base64);
        if (blobUrl) newPreviews[item.service_id] = blobUrl;
      }
    });
    setImagePreviews(newPreviews);
    return () => Object.values(newPreviews).forEach(URL.revokeObjectURL);
  }, [cart]);

  // Fetch services and discount data
  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      try {
        // Fetch services
        if (cart.length > 0) {
          const servicePromises = cart.filter(item => item.service_id).map(async (item) => {
            try {
              setServiceLoading(prev => ({ ...prev, [item.service_id]: true }));
              const response = await axios.get(`${baseURL}/api/services/${item.service_id}/`);
              return response.data;
            } catch (error) {
              console.error(`Error fetching service ${item.service_id}:`, error);
              return null;
            } finally {
              setServiceLoading(prev => ({ ...prev, [item.service_id]: false }));
            }
          });
          
          const responses = await Promise.all(servicePromises);
          const validServices = responses.filter(service => service !== null);
          setServices(validServices);
        }

        // Fetch discount statuses
        if (user) {
          try {
            const signupStatus = await api.get('/api/discounts/signup/status/');
            setSignupDiscountUsed(signupStatus.data);
          } catch (error) {
            console.log("Error fetching signup discount status:", error);
          }

          try {
            const referralStatus = await api.get('/api/discounts/referral/status/');
            setReferralDiscountUsed(referralStatus.data);
          } catch (error) {
            console.log("Error fetching referral discount status:", error);
          }

          try {
            const promotions = await api.get('/api/promotions/today');
            setAvailablePromotions(promotions.data);
            const validPromotion = promotions.data.find(promo => 
              new Date(promo.end_date) > new Date() && promo.is_active === true
            );
            if (validPromotion) {
              setAppliedPromotion(validPromotion);
              if (cart.length > 0) {
                toast.success(`🎉 ${validPromotion.discount_percentage}% promotion applied automatically!`);
              }
            }
          } catch (error) {
            console.log("Error fetching promotions:", error);
          }

          try {
            const pointsDiscount = await api.get('/api/referrals/active-discount/');
            if (Object.keys(pointsDiscount.data).length !== 0) {
              setRedeemedPointsDiscount(pointsDiscount.data);
            } else {
              setRedeemedPointsDiscount(null);
            }
          } catch (error) {
            if (error.response && error.response.status === 404) {
              setRedeemedPointsDiscount(null);
            } else {
              console.log("Error fetching redeemed points discount:", error);
            }
          }
        }
      } catch (error) {
        toast.error('Failed to load service details');
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, []);

  // Camera functions
  const startCamera = async () => {
    try {
      stopCamera();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: isFrontCamera ? 'user' : 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => videoRef.current.play();
      }
    } catch (err) {
      toast.error("Camera access denied or unavailable.");
      setShowCameraModal(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);

    canvas.toBlob(async (blob) => {
      const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
      stopCamera();
      setShowCameraModal(false);
      await handleImageUpload(cameraMode, file);
      setCameraMode(null);
    }, 'image/jpeg', 0.9);
  };

  const openCamera = (serviceId) => {
    setCameraMode(serviceId);
    setShowCameraModal(true);
    setTimeout(startCamera, 300);
  };

  const switchCamera = () => {
    setIsFrontCamera(!isFrontCamera);
    setTimeout(startCamera, 100);
  };

  // Image handling
  const handleImageUpload = async (serviceId, file) => {
    const validation = validateImageFile(file);
    if (!validation.valid) return toast.error(validation.message);
    
    setUploadingImages(prev => ({ ...prev, [serviceId]: true }));
    
    try {
      const isHeic = file.type === 'image/heic' || file.type === 'image/heif' || 
                     file.name.toLowerCase().endsWith('.heic') || 
                     file.name.toLowerCase().endsWith('.heif');
      
      if (isHeic) {
        toast.info('Processing HEIC image... This may take a moment.');
      }
      
      const processedFile = await processImage(file);
      const base64String = await fileToBase64(processedFile);
      const blobUrl = URL.createObjectURL(processedFile);
      
      addImageToCartItem(serviceId, processedFile, blobUrl, base64String);
      
      setImagePreviews(prev => ({
        ...prev,
        [serviceId]: blobUrl
      }));
      
      toast.success('Photo added successfully!');
      
    } catch (error) {
      console.error('Image upload failed:', error);
      if (error.message.includes('HEIC')) {
        toast.error('Failed to convert HEIC image. Please try uploading as JPEG or PNG.');
      } else {
        toast.error(error.message || 'Failed to upload image');
      }
    } finally {
      setUploadingImages(prev => ({ ...prev, [serviceId]: false }));
    }
  };

  const handleImageRemove = (serviceId) => {
    if (imagePreviews[serviceId]) URL.revokeObjectURL(imagePreviews[serviceId]);
    removeImageFromCartItem(serviceId);
    setImagePreviews(prev => {
      const next = { ...prev };
      delete next[serviceId];
      return next;
    });
  };

  const openGallery = (serviceId) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,image/heic,image/heif,.heic,.heif';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        handleImageUpload(serviceId, file);
      }
      input.value = '';
    };
    input.click();
  };

  // Service helpers
  const getService = (id) => {
    const service = services.find(s => s.id === id);
    if (!service) {
      // Check if it's a voucher item in cart
      const cartItem = cart.find(item => item.service_id === id);
      
      return {
        id,
        name: cartItem?.service_name || 'Loading service...',
        description: cartItem?.is_voucher_redeem ? 
          'Voucher redemption service' : 
          'Cleaning service',
        price: cartItem?.original_price || 0,
        image: '/placeholder-shoe.jpg',
        service_type: cartItem?.service_type || 'UNKNOWN',
        included_quantity: cartItem?.included_quantity || 1,
        is_free_signup_service: cartItem?.is_free_signup_service || false
      };
    }
    return service;
  };
  
  const isPackageService = (s) => s?.service_type?.startsWith('PACKAGE_');
  const isFreeService = (s) => s?.is_free_signup_service === true;
  const isVoucherService = (item) => item.is_voucher_redeem === true;

  const getPackageInfo = (service) => {
    const types = {
      'PACKAGE_3': { color: 'bg-blue-50', textColor: 'text-blue-700', badgeColor: 'bg-blue-100', tagText: '3-SNEAKER BUNDLE', sneakers: 3 },
      'PACKAGE_5': { color: 'bg-purple-50', textColor: 'text-purple-700', badgeColor: 'bg-purple-100', tagText: '5-SNEAKER BUNDLE', sneakers: 5 },
      'PACKAGE_10': { color: 'bg-green-50', textColor: 'text-green-700', badgeColor: 'bg-green-100', tagText: '10-SNEAKER BUNDLE', sneakers: 10 },
      'PACKAGE_20': { color: 'bg-orange-50', textColor: 'text-orange-700', badgeColor: 'bg-orange-100', tagText: '20-SNEAKER BUNDLE', sneakers: 20 },
    };
    return types[service.service_type] || { color: 'bg-gray-50', textColor: 'text-gray-700', tagText: 'BUNDLE DEAL', sneakers: 1 };
  };

  // Calculations - Vouchers have price 0
  const subtotal = cart.reduce((t, item) => {
    if (item.is_voucher_redeem) {
      return t + 0; // Vouchers are free
    }
    return t + (getService(item.service_id).price || item.unit_price || 0) * item.quantity;
  }, 0).toFixed(2);

  const signupDiscount = discounts?.find(d => d.discount_type === 'signup');
  const referralDiscount = discounts?.find(d => d.discount_type === 'referral');

  const canUseSignup = user && !signupDiscountUsed?.signup_discount_used && signupDiscount && signupDiscount.is_active;
  const canUseReferral = user && referralDiscountUsed?.first_order_completed === false && referralDiscount;
  const canUseRedeemedPoints = user && redeemedPointsDiscount && !redeemedPointsDiscount.is_applied;

  const signupDiscountAmount = canUseSignup
    ? ((parseFloat(subtotal) * parseFloat(signupDiscount.percentage)) / 100)
    : 0;

  const referralDiscountAmount = canUseReferral
    ? ((parseFloat(subtotal) * parseFloat(referralDiscount.percentage)) / 100)
    : 0;

  const promoDiscountAmount = appliedPromotion
    ? (parseFloat(subtotal) * parseFloat(appliedPromotion.discount_percentage)) / 100
    : 0;

  const redeemedPointsDiscountAmount = canUseRedeemedPoints
    ? ((parseFloat(subtotal) * parseFloat(redeemedPointsDiscount.percentage)) / 100)
    : 0;

  const total = (parseFloat(subtotal) - (promoDiscountAmount + signupDiscountAmount + referralDiscountAmount + redeemedPointsDiscountAmount)).toFixed(2);

  // Render functions
  const CameraModal = () => !showCameraModal ? null : (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4">
        <button onClick={() => { stopCamera(); setShowCameraModal(false); }} className="text-white p-2 bg-black/50 rounded-full">
          <FaTimes size={24}/>
        </button>
        <button onClick={switchCamera} className="text-white p-2 bg-black/50 rounded-full">
          <CameraIcon className="w-6 h-6"/>
        </button>
      </div>
      <video ref={videoRef} className="flex-1 w-full h-full object-cover" playsInline />
      <canvas ref={canvasRef} className="hidden" />
      <div className="absolute bottom-10 left-0 right-0 flex justify-center">
        <button onClick={capturePhoto} className="w-20 h-20 bg-white rounded-full border-4 border-gray-300 shadow-xl active:scale-95 transition-transform" />
      </div>
    </div>
  );

  // Format date for voucher expiration
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <section className="bg-gray-50 min-h-screen py-6 px-4 sm:px-6 lg:px-8">
      <CameraModal />
      
      {previewImage && (
        <div className="fixed inset-0 bg-black/90 z-40 flex items-center justify-center p-4" onClick={() => setPreviewImage(null)}>
          <img src={previewImage} className="max-w-full max-h-full rounded-lg" alt="Preview" />
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Shopping Cart</h1>
              <p className="text-gray-600 mt-1">{cart.length} item{cart.length !== 1 ? 's' : ''} in your cart</p>
            </div>
            <button
              onClick={() => navigate('/services')}
              className="px-5 py-2.5 bg-primary border border-gray-300 rounded-lg font-medium text-white hover:bg-primary/80 transition-colors text-sm"
            >
              Continue Shopping
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <FaSpinner className="animate-spin text-primary" size={40} />
          </div>
        ) : cart.length > 0 ? (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left Column - Cart Items */}
            <div className="lg:col-span-2 space-y-5">
              {cart.map((item) => {
                const service = getService(item.service_id);
                const isPkg = isPackageService(service);
                const isFree = isFreeService(service);
                const isVoucher = isVoucherService(item);
                const pkgInfo = isPkg ? getPackageInfo(service) : null;
                const hasImg = hasImage(item.service_id);
                const previewUrl = imagePreviews[item.service_id];
                const voucher = voucherDetails[item.service_id];
                const isLoading = serviceLoading[item.service_id];

                return (
                  <div key={item.service_id} className={`bg-white rounded-xl shadow-sm border overflow-hidden ${
                    isVoucher ? 'border-emerald-300 border-2' : 'border-gray-200' // Emerald border
                  }`}>
                    {/* Service Type Badge */}
                    <div className={`px-5 py-2.5 ${
                      isVoucher ? 'bg-gradient-to-r from-emerald-600 to-green-600' : // Green only gradient
                      isFree ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 
                      pkgInfo?.color || 'bg-gray-100'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {isVoucher ? (
                            <>
                              <FaGift className="w-5 h-5 text-white" />
                              <span className="text-white font-semibold text-sm">VOUCHER REDEMPTION</span>
                            </>
                          ) : isFree ? (
                            <>
                              <GiftIcon className="w-5 h-5 text-white" />
                              <span className="text-white font-semibold text-sm">FREE SERVICE</span>
                            </>
                          ) : (
                            <>
                              <ShoppingBagIcon className={`w-5 h-5 ${isPkg ? pkgInfo?.textColor : 'text-gray-700'}`} />
                              <span className={`${isPkg ? pkgInfo?.textColor : 'text-gray-700'} font-semibold text-sm`}>
                                {isPkg ? pkgInfo?.tagText : 'STANDARD SERVICE'}
                              </span>
                            </>
                          )}
                        </div>
                        {isPkg && (
                          <span className={`${pkgInfo?.badgeColor} px-2.5 py-1 rounded-full text-xs font-medium ${pkgInfo?.textColor}`}>
                            {pkgInfo?.sneakers} sneakers
                          </span>
                        )}
                        {isVoucher && item.voucher_code && (
                          <code className="bg-white/20 px-2.5 py-1 rounded text-xs font-mono text-white">
                            {item.voucher_code}
                          </code>
                        )}
                      </div>
                    </div>

                    <div className="p-5">
                      {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <FaSpinner className="animate-spin text-emerald-600 mr-3" /> {/* Emerald color */}
                          <span className="text-gray-600">Loading service details...</span>
                        </div>
                      ) : (
                        <div className="flex flex-col sm:flex-row gap-5">
                          {/* Service Image */}
                          <div className="w-full sm:w-24 h-24 flex-shrink-0">
                            <div className="relative w-full h-full rounded-lg overflow-hidden bg-gray-100">
                              <img
                                src={service.image || '/placeholder-shoe.jpg'}
                                alt={service.name}
                                className="w-full h-full object-cover"
                              />
                              {isVoucher && (
                                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-green-500/20 flex items-center justify-center"> {/* Green gradient */}
                                  <FaGift className="text-white text-2xl" />
                                </div>
                              )}
                              {isFree && !isVoucher && (
                                <div className="absolute top-2 right-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-2 py-1 rounded text-xs font-bold shadow">
                                  FREE
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Item Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                              <div className="flex-1 min-w-0 pr-3">
                                <h3 className="font-bold text-gray-900 text-base mb-1">{service.name}</h3>
                                <p className="text-gray-600 text-sm line-clamp-2">{service.description}</p>
                                
                                {/* Voucher Details */}
                                {isVoucher && item.voucher_code && (
                                  <div className="mt-3 p-3 bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg border border-emerald-200"> {/* Green gradient */}
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <FaTag className="text-emerald-600" /> {/* Emerald color */}
                                        <span className="text-sm font-medium text-emerald-800">Voucher Code:</span> {/* Emerald color */}
                                        <code className="font-mono font-bold text-emerald-900 bg-white px-2 py-1 rounded text-sm"> {/* Emerald color */}
                                          {item.voucher_code}
                                        </code>
                                      </div>
                                      {voucher?.valid_until && (
                                        <div className="text-xs text-emerald-600"> {/* Emerald color */}
                                          Expires: {formatDate(voucher.valid_until)}
                                        </div>
                                      )}
                                    </div>
                                    {item.voucher_value && (
                                      <div className="mt-2 text-sm text-emerald-700"> {/* Emerald color */}
                                        <span className="font-medium">Original Value:</span> ₵{item.voucher_value}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                              <button
                                onClick={() => removeFromCart(item.service_id)}
                                className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                              >
                                <TrashIcon className="w-5 h-5" />
                              </button>
                            </div>

                            <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-4 gap-3">
                              <div className="flex items-center gap-3">
                                {!isFree && !isVoucher && (
                                  <div className="flex items-center bg-gray-50 rounded-xl p-1 border border-gray-200">
                                    <button
                                      onClick={() => updateQuantity(item.service_id, -1)}
                                      disabled={item.quantity <= 1}
                                      className="w-10 h-10 flex items-center justify-center text-gray-700 hover:bg-white hover:text-primary rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                      <MinusIcon className="w-5 h-5" />
                                    </button>
                                    <span className="w-12 text-center font-bold text-gray-900 text-lg">{item.quantity}</span>
                                    <button
                                      onClick={() => updateQuantity(item.service_id, 1)}
                                      className="w-10 h-10 flex items-center justify-center text-gray-700 hover:bg-white hover:text-primary rounded-lg transition-colors"
                                    >
                                      <PlusIcon className="w-5 h-5" />
                                    </button>
                                  </div>
                                )}
                                {(isFree || isVoucher) && (
                                  <div className={`px-3 py-1.5 rounded-lg border ${
                                    isVoucher ? 'bg-gradient-to-r from-emerald-100 to-green-100 border-emerald-200' : // Green gradient
                                    'bg-gradient-to-r from-green-100 to-emerald-100 border-green-200'
                                  }`}>
                                    <span className={`font-medium text-sm ${
                                      isVoucher ? 'text-emerald-700' : 'text-green-700' // Emerald color
                                    }`}>
                                      {isVoucher ? 'Voucher Applied' : 'Free Service'}
                                    </span>
                                  </div>
                                )}
                              </div>
                              
                              <div className="text-right">
                                <div className={`font-bold ${
                                  isVoucher ? 'text-emerald-600' : // Emerald color
                                  isFree ? 'text-green-600' : 
                                  'text-gray-900'
                                } text-lg`}>
                                  {isVoucher ? (
                                    <>
                                      <span className="line-through text-gray-400 text-sm mr-2">
                                        ₵{service.price}
                                      </span>
                                      <span className="bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent"> {/* Green gradient */}
                                        FREE
                                      </span>
                                    </>
                                  ) : isFree ? (
                                    <>
                                      <span className="line-through text-gray-400 text-sm mr-2">
                                        ₵{service.price}
                                      </span>
                                      FREE
                                    </>
                                  ) : (
                                    `₵${(service.price * item.quantity).toFixed(2)}`
                                  )}
                                </div>
                                {isPkg && (
                                  <div className="text-sm text-green-600 font-medium">
                                    Save with bundle
                                  </div>
                                )}
                                {isVoucher && item.voucher_value && (
                                  <div className="text-sm text-emerald-600 font-medium"> {/* Emerald color */}
                                    {service.included_quantity || 1}-pair bundle
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Photo Upload Section */}
                            <div className="border-t border-gray-100 mt-4 pt-4">
                              <div className="hidden sm:flex flex-row items-center justify-between gap-3">
                                <div>
                                  <h4 className="font-medium text-gray-900 text-base mb-1">Shoe Photo</h4>
                                  <p className="text-gray-600 text-sm">
                                    {hasImg ? 'Photo added successfully' : 'Required for service processing'}
                                  </p>
                                  {isVoucher && (
                                    <p className="text-xs text-yellow-600 mt-1">
                                      📸 Voucher services also require shoe photos
                                    </p>
                                  )}
                                  <p className="text-xs text-gray-500 mt-1">
                                    Supports JPEG, PNG, WebP, HEIC (max 15MB)
                                  </p>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  {hasImg ? (
                                    <>
                                      <div className="relative">
                                        <img
                                          src={previewUrl}
                                          alt="Shoe preview"
                                          className="w-16 h-16 rounded-lg object-cover border-2 border-green-200 cursor-pointer"
                                          onClick={() => setPreviewImage(previewUrl)}
                                        />
                                        <button
                                          onClick={() => handleImageRemove(item.service_id)}
                                          className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                                        >
                                          <XMarkIcon className="w-3 h-3" />
                                        </button>
                                      </div>
                                      <button
                                        onClick={() => setPreviewImage(previewUrl)}
                                        className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                                      >
                                        View
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      <button
                                        onClick={() => openCamera(item.service_id)}
                                        disabled={uploadingImages[item.service_id]}
                                        className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all disabled:opacity-50 text-sm"
                                      >
                                        {uploadingImages[item.service_id] ? (
                                          <>
                                            <FaSpinner className="animate-spin w-4 h-4" />
                                            Uploading...
                                          </>
                                        ) : (
                                          <>
                                            <CameraIcon className="w-4 h-4" />
                                            Take Photo
                                          </>
                                        )}
                                      </button>
                                      <button
                                        onClick={() => openGallery(item.service_id)}
                                        disabled={uploadingImages[item.service_id]}
                                        className="flex items-center gap-2 px-4 py-2.5 bg-gray-700 text-white rounded-lg font-medium hover:bg-gray-800 transition-all disabled:opacity-50 text-sm"
                                      >
                                        <FolderIcon className="w-4 h-4" />
                                        Gallery
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>

                              {/* Mobile Layout */}
                              <div className="sm:hidden flex flex-col gap-3">
                                <div>
                                  <h4 className="font-medium text-gray-900 text-base mb-1">Shoe Photo</h4>
                                  <p className="text-gray-600 text-sm mb-3">
                                    {hasImg ? 'Photo added successfully' : 'Required for service processing'}
                                  </p>
                                  {isVoucher && (
                                    <p className="text-xs text-yellow-600 mb-3">
                                      📸 Voucher services also require shoe photos
                                    </p>
                                  )}
                                  <p className="text-xs text-gray-500 mb-3">
                                    Supports JPEG, PNG, WebP, HEIC (max 15MB)
                                  </p>
                                </div>
                                
                                <div className="flex items-start gap-3">
                                  {hasImg ? (
                                    <>
                                      <div className="relative">
                                        <img
                                          src={previewUrl}
                                          alt="Shoe preview"
                                          className="w-16 h-16 rounded-lg object-cover border-2 border-green-200 cursor-pointer"
                                          onClick={() => setPreviewImage(previewUrl)}
                                        />
                                        <button
                                          onClick={() => handleImageRemove(item.service_id)}
                                          className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                                        >
                                          <XMarkIcon className="w-3 h-3" />
                                        </button>
                                      </div>
                                      <div className="flex flex-col">
                                        <span className="text-sm text-gray-600 mb-1">Shoe preview</span>
                                        <button
                                          onClick={() => setPreviewImage(previewUrl)}
                                          className="text-blue-600 hover:text-blue-800 font-medium text-sm text-left"
                                        >
                                          View
                                        </button>
                                      </div>
                                    </>
                                  ) : (
                                    <div className="flex flex-wrap gap-2 w-full">
                                      <button
                                        onClick={() => openCamera(item.service_id)}
                                        disabled={uploadingImages[item.service_id]}
                                        className="flex-1 min-w-[140px] flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all disabled:opacity-50 text-sm"
                                      >
                                        {uploadingImages[item.service_id] ? (
                                          <>
                                            <FaSpinner className="animate-spin w-4 h-4" />
                                            Uploading...
                                          </>
                                        ) : (
                                          <>
                                            <CameraIcon className="w-4 h-4" />
                                            Take Photo
                                          </>
                                        )}
                                      </button>
                                      <button
                                        onClick={() => openGallery(item.service_id)}
                                        disabled={uploadingImages[item.service_id]}
                                        className="flex-1 min-w-[140px] flex items-center justify-center gap-2 px-4 py-3 bg-gray-700 text-white rounded-lg font-medium hover:bg-gray-800 transition-all disabled:opacity-50 text-sm"
                                      >
                                        <FolderIcon className="w-4 h-4" />
                                        Gallery
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Photo Requirements Card */}
              <div className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-xl p-5"> {/* Updated to green gradient */}
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-gradient-to-r from-emerald-100 to-green-100 rounded-lg"> {/* Updated to green gradient */}
                    <PhotoIcon className="w-6 h-6 text-emerald-600" /> {/* Emerald color */}
                  </div>
                  <div>
                    <h4 className="font-medium text-emerald-900 mb-2">Why add shoe photos?</h4> {/* Emerald color */}
                    <ul className="text-sm text-emerald-800 space-y-1"> {/* Emerald color */}
                      <li>• Ensures accurate cleaning service</li>
                      <li>• Helps identify your specific shoes</li>
                      <li>• Documents any pre-existing conditions</li>
                      <li>• Improves service quality</li>
                      <li>• Required for ALL cleaning services (including voucher redemptions)</li>
                    </ul>
                    <p className="text-xs text-emerald-600 mt-3"> {/* Emerald color */}
                      📸 Supports: JPEG, PNG, WebP, and HEIC formats
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 sticky top-20">
                <h2 className="text-lg font-bold text-gray-900 mb-5">Order Summary</h2>
                
                <div className="space-y-4">
                  {/* Items List */}
                  <div className="space-y-3 max-h-56 overflow-y-auto pr-2">
                    {cart.map((item) => {
                      const service = getService(item.service_id);
                      const isFree = isFreeService(service);
                      const isVoucher = isVoucherService(item);
                      
                      return (
                        <div key={item.service_id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                          <div className="flex items-center gap-2 max-w-[70%]">
                            <span className="text-gray-700 text-sm truncate">{service.name}</span>
                            <span className="text-gray-500 text-xs">×{item.quantity}</span>
                            {isVoucher && (
                              <span className="text-xs bg-gradient-to-r from-emerald-500 to-green-500 text-white px-2 py-0.5 rounded"> {/* Green gradient */}
                                Voucher
                              </span>
                            )}
                            {isFree && !isVoucher && (
                              <span className="text-xs bg-gradient-to-r from-green-500 to-emerald-500 text-white px-2 py-0.5 rounded">
                                Free
                              </span>
                            )}
                          </div>
                          <span className={`font-medium ${
                            isVoucher ? 'text-emerald-600' : // Emerald color
                            isFree ? 'text-green-600' : ''
                          } text-sm`}>
                            {isVoucher || isFree ? 'FREE' : `₵${(service.price * item.quantity).toFixed(2)}`}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Voucher Summary (if any) */}
                  {cart.some(item => item.is_voucher_redeem) && (
                    <div className="p-3 bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-lg"> {/* Green gradient */}
                      <div className="flex items-center gap-2 text-emerald-700 mb-2"> {/* Emerald color */}
                        <FaGift className="text-emerald-600" /> {/* Emerald color */}
                        <span className="font-medium text-sm">Voucher Savings</span>
                      </div>
                      <p className="text-xs text-emerald-600"> {/* Emerald color */}
                        Your voucher covers the full cost of {cart.filter(item => item.is_voucher_redeem).length} service(s)
                      </p>
                    </div>
                  )}

                  {/* Totals */}
                  <div className="space-y-3 pt-4 border-t border-gray-200">
                    <div className="flex justify-between text-gray-700">
                      <span className="text-sm">Subtotal</span>
                      <span className="font-medium">₵{subtotal}</span>
                    </div>
                    
                    {/* Discounts */}
                    {canUseSignup && signupDiscountAmount > 0 && (
                      <div className="flex justify-between text-green-600 bg-green-50 rounded-lg p-2.5">
                        <div className="flex items-center gap-1.5">
                          <SparklesIcon className="w-4 h-4" />
                          <span className="text-sm font-medium">Welcome Discount</span>
                        </div>
                        <span className="font-medium">-₵{signupDiscountAmount.toFixed(2)}</span>
                      </div>
                    )}

                    {canUseReferral && referralDiscountAmount > 0 && (
                      <div className="flex justify-between text-emerald-600 bg-emerald-50 rounded-lg p-2.5"> {/* Emerald color */}
                        <div className="flex items-center gap-1.5">
                          <GiftIcon className="w-4 h-4" />
                          <span className="text-sm font-medium">Referral Bonus</span>
                        </div>
                        <span className="font-medium">-₵{referralDiscountAmount.toFixed(2)}</span>
                      </div>
                    )}

                    {appliedPromotion && promoDiscountAmount > 0 && (
                      <div className="flex justify-between text-purple-600 bg-purple-50 rounded-lg p-2.5">
                        <div className="flex items-center gap-1.5">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                          </svg>
                          <span className="text-sm font-medium">Promotion</span>
                        </div>
                        <span className="font-medium">-₵{promoDiscountAmount.toFixed(2)}</span>
                      </div>
                    )}

                    {canUseRedeemedPoints && redeemedPointsDiscountAmount > 0 && (
                      <div className="flex justify-between text-amber-600 bg-amber-50 rounded-lg p-2.5">
                        <div className="flex items-center gap-1.5">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-sm font-medium">Points Discount</span>
                        </div>
                        <span className="font-medium">-₵{redeemedPointsDiscountAmount.toFixed(2)}</span>
                      </div>
                    )}

                    <div className="flex justify-between pt-4 border-t border-gray-200">
                      <div>
                        <span className="font-bold text-gray-900">Total</span>
                      </div>
                      <div className="text-right">
                        {(canUseSignup || canUseReferral || appliedPromotion || canUseRedeemedPoints) && parseFloat(total) > 0 && (
                          <div className="text-sm text-gray-500 line-through mb-1">₵{subtotal}</div>
                        )}
                        <div className="text-xl font-bold text-gray-900">₵{total}</div>
                      </div>
                    </div>
                  </div>

                  {/* Checkout Button */}
                  <button
                    onClick={() => {
                      // Check if ALL items have photos (including voucher items)
                      const allHavePhotos = cart.every(i => hasImage(i.service_id));
                      
                      if (allHavePhotos) {
                        navigate('/checkout');
                      } else {
                        // Count how many items are missing photos
                        const missingPhotos = cart.filter(i => !hasImage(i.service_id)).length;
                        toast.warning(
                          `Please add photos for ${missingPhotos} item${missingPhotos !== 1 ? 's' : ''} before checkout`,
                          { autoClose: 5000 }
                        );
                      }
                    }}
                    className="w-full bg-primary text-white font-bold py-3.5 rounded-lg transition-all duration-200 shadow hover:shadow-lg mt-5 text-base"
                  >
                    Proceed to Checkout
                  </button>

                  {/* Discount Info */}
                  {(canUseSignup || canUseReferral || canUseRedeemedPoints) && (
                    <div className="mt-3 p-3 bg-emerald-50 rounded-lg border border-emerald-100"> {/* Emerald color */}
                      <p className="text-emerald-700 text-xs"> {/* Emerald color */}
                        {canUseSignup && "🎉 Welcome discount applied! "}
                        {canUseReferral && "🎁 Referral bonus applied! "}
                        {canUseRedeemedPoints && "⭐ Points discount applied! "}
                        Discounts will be applied at checkout.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Empty Cart State
          <div className="text-center py-14 bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 bg-gray-100 rounded-full mx-auto mb-5 flex items-center justify-center">
                <ShoppingBagIcon className="w-10 h-10 text-gray-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Your cart is empty</h2>
              <p className="text-gray-600 mb-7">Add some sneaker cleaning services to get started</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => navigate('/services')}
                  className="px-8 py-3.5 bg-primary text-white rounded-lg font-bold hover:opacity-90 transition-all text-base"
                >
                  Browse Services
                </button>
                <button
                  onClick={() => navigate('/redeem')}
                  className="px-8 py-3.5 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-lg font-bold hover:opacity-90 transition-all text-base" // Green gradient
                >
                  Redeem Voucher
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default Cart;