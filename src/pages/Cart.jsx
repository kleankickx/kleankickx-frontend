// src/pages/Cart.jsx
import React, { useState, useEffect, useContext, useCallback, useRef } from 'react';
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
  ShoppingBagIcon,
  CameraIcon,
  GiftIcon,
  SparklesIcon,
  TicketIcon,
} from '@heroicons/react/24/outline';
import { FaSpinner, FaGift, FaTag, FaCamera, FaImage } from 'react-icons/fa';
import { FaTimes } from 'react-icons/fa';
import heic2any from 'heic2any';
import Footer from '../components/Footer';
import api from '../api';

// Loading Skeleton Components
const CartItemSkeleton = () => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-pulse">
    <div className="px-5 py-2.5 bg-gray-100">
      <div className="h-4 bg-gray-200 rounded w-32"></div>
    </div>
    <div className="p-5">
      <div className="flex flex-col sm:flex-row gap-5">
        <div className="w-full sm:w-24 h-24 bg-gray-200 rounded-lg"></div>
        <div className="flex-1">
          <div className="flex justify-between">
            <div className="flex-1">
              <div className="h-5 bg-gray-200 rounded w-40 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-full max-w-md"></div>
            </div>
            <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
          </div>
          <div className="flex flex-col sm:flex-row justify-between mt-4 gap-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center bg-gray-50 rounded-xl p-1 border border-gray-200">
                <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                <div className="w-12 h-5 bg-gray-200 mx-2 rounded"></div>
                <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
              </div>
            </div>
            <div className="w-24 h-6 bg-gray-200 rounded"></div>
          </div>
          <div className="border-t border-gray-100 mt-4 pt-4">
            <div className="flex justify-between">
              <div className="h-4 bg-gray-200 rounded w-32"></div>
              <div className="flex gap-2">
                <div className="w-24 h-8 bg-gray-200 rounded-lg"></div>
                <div className="w-24 h-8 bg-gray-200 rounded-lg"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const OrderSummarySkeleton = () => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 sticky top-20 animate-pulse">
    <div className="h-6 bg-gray-200 rounded w-32 mb-5"></div>
    <div className="space-y-3">
      <div className="flex justify-between">
        <div className="h-4 bg-gray-200 rounded w-20"></div>
        <div className="h-4 bg-gray-200 rounded w-16"></div>
      </div>
      <div className="flex justify-between">
        <div className="h-4 bg-gray-200 rounded w-20"></div>
        <div className="h-4 bg-gray-200 rounded w-16"></div>
      </div>
      <div className="flex justify-between">
        <div className="h-4 bg-gray-200 rounded w-20"></div>
        <div className="h-4 bg-gray-200 rounded w-16"></div>
      </div>
      <div className="border-t border-gray-200 pt-4 mt-4">
        <div className="flex justify-between">
          <div className="h-5 bg-gray-200 rounded w-16"></div>
          <div className="h-5 bg-gray-200 rounded w-20"></div>
        </div>
      </div>
      <div className="h-12 bg-gray-200 rounded-lg mt-5"></div>
    </div>
  </div>
);

const Cart = () => {
  const {
    cart,
    loading: cartLoading,
    updateQuantity,
    removeFromCart,
    addImageToCartItem,
    removeImageFromCartItem,
    hasImage,
    getImageBase64,
    getCartItemCount,
    cartMeta,
    refreshCart,
  } = useContext(CartContext);

  const { discounts, user } = useContext(AuthContext);
  const [services, setServices] = useState({});
  const [loadingServices, setLoadingServices] = useState(true);
  const [uploadingImages, setUploadingImages] = useState({});
  const [imageUploadProgress, setImageUploadProgress] = useState({});
  const [previewImage, setPreviewImage] = useState(null);
  const [isRecovering, setIsRecovering] = useState(false);
  const [imagePreviews, setImagePreviews] = useState({});
  const [cameraMode, setCameraMode] = useState(null);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [isFrontCamera, setIsFrontCamera] = useState(false);
  const [voucherDetails, setVoucherDetails] = useState({});
  const [removingImageId, setRemovingImageId] = useState(null);
  const [isPageLoading, setIsPageLoading] = useState(true);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const navigate = useNavigate();

  const [signupDiscountUsed, setSignupDiscountUsed] = useState(false);
  const [referralDiscountUsed, setReferralDiscountUsed] = useState(false);
  const [availablePromotions, setAvailablePromotions] = useState([]);
  const [appliedPromotion, setAppliedPromotion] = useState(null);
  const [redeemedPointsDiscount, setRedeemedPointsDiscount] = useState(null);

  // Force refresh on mount
  useEffect(() => {
    const loadData = async () => {
      setIsPageLoading(true);
      await refreshCart();
      setTimeout(() => setIsPageLoading(false), 300);
    };
    loadData();
  }, [refreshCart]);

  // Check for recovery parameter
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const recoverCartId = urlParams.get('recover');

    if (recoverCartId && (!cart || cart.length === 0)) {
      const shouldRecover = window.confirm('We noticed you had items in your cart. Would you like to restore them?');
      
      if (shouldRecover) {
        setIsRecovering(true);
        api.post('/api/cart/recover/', { cart_id: recoverCartId })
          .then(() => {
            refreshCart();
            alert('Your cart has been restored successfully!');
          })
          .catch((err) => {
            console.error('Failed to recover cart:', err);
            alert('Could not restore your cart. Please try again.');
          })
          .finally(() => {
            setIsRecovering(false);
          });
      }
      
      window.history.replaceState({}, '', '/cart');
    }
  }, [cart, refreshCart]);

  // Load image previews from cart context
  useEffect(() => {
    if (!cart) return;

    const loadImagePreviews = async () => {
      const previews = {};
      
      for (const item of cart) {
        if (item.id && hasImage(item.id)) {
          const base64 = getImageBase64(item.id);
          if (base64) {
            let dataUrl = base64;
            if (!base64.startsWith('data:')) {
              if (base64.startsWith('/9j/')) {
                dataUrl = `data:image/jpeg;base64,${base64}`;
              } else if (base64.startsWith('iVBOR')) {
                dataUrl = `data:image/png;base64,${base64}`;
              } else {
                dataUrl = `data:image/jpeg;base64,${base64}`;
              }
            }
            previews[item.id] = dataUrl;
          }
        }
      }
      
      setImagePreviews(previews);
    };
    
    loadImagePreviews();
  }, [cart, hasImage, getImageBase64]);

  // Refresh previews when cart changes
  useEffect(() => {
    if (cart && cart.length > 0) {
      const previews = { ...imagePreviews };
      let hasChanges = false;
      
      for (const item of cart) {
        if (item.id && hasImage(item.id) && !previews[item.id]) {
          const base64 = getImageBase64(item.id);
          if (base64) {
            let dataUrl = base64;
            if (!base64.startsWith('data:')) {
              if (base64.startsWith('/9j/')) {
                dataUrl = `data:image/jpeg;base64,${base64}`;
              } else if (base64.startsWith('iVBOR')) {
                dataUrl = `data:image/png;base64,${base64}`;
              } else {
                dataUrl = `data:image/jpeg;base64,${base64}`;
              }
            }
            previews[item.id] = dataUrl;
            hasChanges = true;
          }
        }
      }
      
      if (hasChanges) {
        setImagePreviews(previews);
      }
    }
  }, [cart, hasImage, getImageBase64, imagePreviews]);

  // Quantity / Remove handlers
  const handleQuantityChange = useCallback(
    async (itemId, currentQuantity, delta) => {
      const newQuantity = currentQuantity + delta;
      if (newQuantity < 1) return;
      await updateQuantity(itemId, newQuantity);
    },
    [updateQuantity]
  );

  const handleRemoveFromCart = useCallback(
    async (itemId) => {
      await removeFromCart(itemId);
      setImagePreviews(prev => {
        const next = { ...prev };
        delete next[itemId];
        return next;
      });
    },
    [removeFromCart]
  );

  // Image removal
  const handleImageRemove = useCallback(async (itemId) => {
    setRemovingImageId(itemId);
    
    setImagePreviews((prev) => {
      const next = { ...prev };
      delete next[itemId];
      return next;
    });

    try {
      await removeImageFromCartItem(itemId);
      toast.success('Photo removed successfully!', { autoClose: 2000 });
    } catch (error) {
      console.error('Failed to remove image:', error);
      toast.error('Failed to remove photo. Please try again.');
      await refreshCart();
    } finally {
      setRemovingImageId(null);
    }
  }, [removeImageFromCartItem, refreshCart]);

  // Fetch service details
  useEffect(() => {
    const fetchServiceDetails = async () => {
      if (!cart || cart.length === 0) {
        setServices({});
        setLoadingServices(false);
        return;
      }

      const newServiceIds = cart
        .map((item) => item.service || item.service_id)
        .filter((id) => id && !services[id]);

      if (newServiceIds.length === 0) {
        setLoadingServices(false);
        return;
      }

      setLoadingServices(true);
      const serviceMap = { ...services };

      for (const item of cart) {
        const serviceId = item.service || item.service_id;
        if (serviceId && !serviceMap[serviceId]) {
          try {
            const response = await api.get(`/api/services/${serviceId}/`);
            serviceMap[serviceId] = response.data;
          } catch (error) {
            console.error(`Error fetching service ${serviceId}:`, error);
            serviceMap[serviceId] = {
              id: serviceId,
              name: item.service_name,
              price: item.unit_price,
              description: item.is_voucher_redeem
                ? 'Voucher redemption service'
                : 'Cleaning service',
              service_type: item.service_type,
              included_quantity: item.included_quantity,
              is_free_signup_service: item.is_free_signup_service,
              image: null,
            };
          }
        }
      }
      setServices(serviceMap);
      setLoadingServices(false);
    };

    fetchServiceDetails();
  }, [cart]);

  // File to Base64 conversion
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
        quality: 0.8,
      });
      return new File([result], file.name.replace(/\.heic$/i, '.jpg'), {
        type: 'image/jpeg',
        lastModified: Date.now(),
      });
    } catch (error) {
      console.error('Error converting HEIC to JPEG:', error);
      throw new Error('Failed to convert HEIC image');
    }
  };

  const processImage = async (file, onProgress) => {
    const isHeic =
      file.type === 'image/heic' ||
      file.type === 'image/heif' ||
      file.name.toLowerCase().endsWith('.heic') ||
      file.name.toLowerCase().endsWith('.heif');

    if (isHeic) {
      const jpegFile = await convertHeicToJpeg(file);
      return await processJpegImage(jpegFile, onProgress);
    }

    return await processJpegImage(file, onProgress);
  };

  const processJpegImage = (file, onProgress) => {
    return new Promise((resolve, reject) => {
      if (file.size < 1024 * 1024) return resolve(file);

      onProgress?.(30);

      const img = new Image();
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target.result;
        img.onload = () => {
          onProgress?.(60);
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
            onProgress?.(90);
            resolve(
              new File([blob], file.name || `image-${Date.now()}.jpg`, {
                type: 'image/jpeg',
              })
            );
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
      'image/heif',
    ];

    const fileName = file.name.toLowerCase();
    const isHeicByExtension = fileName.endsWith('.heic') || fileName.endsWith('.heif');
    const isHeicByType = file.type === 'image/heic' || file.type === 'image/heif';

    if (!validTypes.includes(file.type) && !isHeicByExtension && !isHeicByType) {
      return {
        valid: false,
        message: 'Please upload a valid image (JPEG, PNG, WebP, or HEIC)',
      };
    }

    if (file.size > 15 * 1024 * 1024) {
      return {
        valid: false,
        message: 'Image size should be less than 15MB',
      };
    }

    return { valid: true };
  };

  // Camera functions
  const startCamera = async () => {
    try {
      stopCamera();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: isFrontCamera ? 'user' : 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => videoRef.current.play();
      }
    } catch (err) {
      toast.error('Camera access denied or unavailable.');
      setShowCameraModal(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
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
      const file = new File([blob], `capture-${Date.now()}.jpg`, {
        type: 'image/jpeg',
      });
      stopCamera();
      setShowCameraModal(false);
      await handleImageUpload(cameraMode, file);
      setCameraMode(null);
    }, 'image/jpeg', 0.9);
  };

  const openCamera = (itemId) => {
    setCameraMode(itemId);
    setShowCameraModal(true);
    setTimeout(startCamera, 300);
  };

  const switchCamera = () => {
    setIsFrontCamera(!isFrontCamera);
    setTimeout(startCamera, 100);
  };

  // Image upload handler
  const handleImageUpload = async (itemId, file) => {
    const validation = validateImageFile(file);
    if (!validation.valid) {
      toast.error(validation.message);
      return;
    }

    setUploadingImages((prev) => ({ ...prev, [itemId]: true }));
    setImageUploadProgress((prev) => ({ ...prev, [itemId]: 0 }));

    try {
      // Show immediate local preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreviews((prev) => ({
          ...prev,
          [itemId]: e.target.result,
        }));
      };
      reader.readAsDataURL(file);

      const progressInterval = setInterval(() => {
        setImageUploadProgress((prev) => {
          const current = prev[itemId] || 0;
          if (current < 90) {
            return { ...prev, [itemId]: Math.min(current + 10, 90) };
          }
          return prev;
        });
      }, 200);

      const isHeic = file.type === 'image/heic' || 
                     file.type === 'image/heif' ||
                     file.name.toLowerCase().endsWith('.heic') ||
                     file.name.toLowerCase().endsWith('.heif');

      if (isHeic) {
        toast.info('Processing HEIC image... This may take a moment.');
      }

      const processedFile = await processImage(file, (progress) => {
        setImageUploadProgress((prev) => ({ ...prev, [itemId]: progress }));
      });

      clearInterval(progressInterval);
      setImageUploadProgress((prev) => ({ ...prev, [itemId]: 95 }));

      const base64String = await fileToBase64(processedFile);
      
      let rawBase64 = base64String;
      if (base64String.includes(',')) {
        rawBase64 = base64String.split(',')[1];
      }

      if (!rawBase64) {
        throw new Error('Failed to convert file to base64');
      }

      await addImageToCartItem(itemId, rawBase64);

      setImageUploadProgress((prev) => ({ ...prev, [itemId]: 100 }));

      toast.success('Photo added successfully!', { autoClose: 3000 });

      await refreshCart();

      setTimeout(() => {
        setImageUploadProgress((prev) => {
          const newState = { ...prev };
          delete newState[itemId];
          return newState;
        });
      }, 1000);
    } catch (error) {
      console.error('Image upload failed:', error);
      toast.error(error.message || 'Failed to upload image');
      setImagePreviews((prev) => {
        const next = { ...prev };
        delete next[itemId];
        return next;
      });
      await refreshCart();
    } finally {
      setUploadingImages((prev) => ({ ...prev, [itemId]: false }));
    }
  };

  const openGallery = (itemId) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,image/heic,image/heif,.heic,.heif';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) handleImageUpload(itemId, file);
      input.value = '';
    };
    input.click();
  };

  // Service helpers
  const getService = (item) => {
    const serviceId = item.service || item.service_id;
    const service = services[serviceId];

    if (!service) {
      return {
        id: serviceId,
        name: item.service_name || 'Loading service...',
        description: item.is_voucher_redeem
          ? 'Voucher redemption service'
          : 'Cleaning service',
        price: item.unit_price || 0,
        service_type: item.service_type || 'INDIVIDUAL',
        included_quantity: item.included_quantity || 1,
        is_free_signup_service: item.is_free_signup_service || false,
        image: null,
      };
    }

    return { ...service, image: service.image || null };
  };

  const isPackageService = (service) => service?.service_type?.startsWith('PACKAGE_');
  const isFreeService = (service) => service?.is_free_signup_service === true;
  const isVoucherService = (item) => item.is_voucher_redeem === true;

  const getPackageInfo = (service) => {
    const types = {
      PACKAGE_3: {
        color: 'bg-blue-50',
        textColor: 'text-blue-700',
        badgeColor: 'bg-blue-100',
        tagText: '3-SNEAKER BUNDLE',
        sneakers: 3,
      },
      PACKAGE_5: {
        color: 'bg-purple-50',
        textColor: 'text-purple-700',
        badgeColor: 'bg-purple-100',
        tagText: '5-SNEAKER BUNDLE',
        sneakers: 5,
      },
      PACKAGE_10: {
        color: 'bg-green-50',
        textColor: 'text-green-700',
        badgeColor: 'bg-green-100',
        tagText: '10-SNEAKER BUNDLE',
        sneakers: 10,
      },
      PACKAGE_20: {
        color: 'bg-orange-50',
        textColor: 'text-orange-700',
        badgeColor: 'bg-orange-100',
        tagText: '20-SNEAKER BUNDLE',
        sneakers: 20,
      },
    };
    return (
      types[service.service_type] || {
        color: 'bg-gray-50',
        textColor: 'text-gray-700',
        tagText: 'BUNDLE DEAL',
        sneakers: 1,
      }
    );
  };

  // Calculations
  const subtotal = cartMeta?.total || 0;
  const signupDiscount = discounts?.find((d) => d.discount_type === 'signup');
  const referralDiscount = discounts?.find((d) => d.discount_type === 'referral');

  const canUseSignup =
    user && !signupDiscountUsed?.signup_discount_used && signupDiscount && signupDiscount.is_active;
  const canUseReferral =
    user && referralDiscountUsed?.first_order_completed === false && referralDiscount;
  const canUseRedeemedPoints =
    user && redeemedPointsDiscount && redeemedPointsDiscount.is_applied === false;

  const signupDiscountAmount = canUseSignup
    ? (parseFloat(subtotal) * parseFloat(signupDiscount.percentage)) / 100
    : 0;

  const referralDiscountAmount = canUseReferral
    ? (parseFloat(subtotal) * parseFloat(referralDiscount.percentage)) / 100
    : 0;

  const promoDiscountAmount = appliedPromotion
    ? (parseFloat(subtotal) * parseFloat(appliedPromotion.discount_percentage)) / 100
    : 0;

  const redeemedPointsDiscountAmount =
    canUseRedeemedPoints && redeemedPointsDiscount?.percentage
      ? (parseFloat(subtotal) * parseFloat(redeemedPointsDiscount.percentage)) / 100
      : 0;

  const total = (
    parseFloat(subtotal) -
    (promoDiscountAmount +
      signupDiscountAmount +
      referralDiscountAmount +
      redeemedPointsDiscountAmount)
  ).toFixed(2);

  // Camera Modal Component
  const CameraModalComponent = () =>
    !showCameraModal ? null : (
      <div className="fixed inset-0 bg-black z-50 flex flex-col">
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4">
          <button
            onClick={() => {
              stopCamera();
              setShowCameraModal(false);
            }}
            className="text-white p-2 bg-black/50 rounded-full"
          >
            <FaTimes size={24} />
          </button>
          <button onClick={switchCamera} className="text-white p-2 bg-black/50 rounded-full">
            <CameraIcon className="w-6 h-6" />
          </button>
        </div>
        <video ref={videoRef} className="flex-1 w-full h-full object-cover" playsInline />
        <canvas ref={canvasRef} className="hidden" />
        <div className="absolute bottom-10 left-0 right-0 flex justify-center">
          <button
            onClick={capturePhoto}
            className="w-20 h-20 bg-white rounded-full border-4 border-gray-300 shadow-xl active:scale-95 transition-transform"
          />
        </div>
      </div>
    );

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Loading indicator component
  const ImageUploadLoader = ({ progress }) => (
    <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg min-w-[120px]">
      <FaSpinner className="animate-spin text-primary w-6 h-6 mb-2" />
      <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2">
        <div
          className="bg-primary h-1.5 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      <span className="text-xs text-gray-500">{progress}%</span>
      <span className="text-xs text-gray-400 mt-1">Processing image...</span>
    </div>
  );

  // Loading overlay for recovery
  if (isRecovering) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8 flex flex-col items-center gap-4">
          <FaSpinner className="animate-spin w-12 h-12 text-primary" />
          <p className="text-gray-700 font-medium">Restoring your cart...</p>
        </div>
      </div>
    );
  }

  // Show loading skeletons while page is loading
  if (isPageLoading || (cartLoading && (!cart || cart.length === 0))) {
    return (
      <>
        <section className="bg-gray-50 min-h-screen py-6 px-4 sm:px-6 lg:px-8 mb-8">
          <div className="max-w-6xl mx-auto">
            <div className="mb-6 animate-pulse">
              <div className="flex items-center justify-between">
                <div>
                  <div className="h-8 bg-gray-200 rounded w-48 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-32"></div>
                </div>
                <div className="h-10 bg-gray-200 rounded-lg w-36"></div>
              </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-5">
                <CartItemSkeleton />
                <CartItemSkeleton />
              </div>
              <div className="lg:col-span-1">
                <OrderSummarySkeleton />
              </div>
            </div>
          </div>
        </section>
        <Footer />
      </>
    );
  }

  // Main render
  return (
    <>
      <section className="bg-gray-50 min-h-screen py-6 px-4 sm:px-6 lg:px-8 mb-8">
        <CameraModalComponent />

        {/* Full-screen image preview */}
        {previewImage && (
          <div
            className="fixed inset-0 bg-black/90 z-40 flex items-center justify-center p-4 cursor-pointer"
            onClick={() => setPreviewImage(null)}
          >
            <img
              src={previewImage}
              className="max-w-full max-h-full rounded-lg object-contain"
              alt="Preview"
            />
          </div>
        )}

        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Shopping Cart</h1>
                <p className="text-gray-600 mt-1">
                  {getCartItemCount()} item{getCartItemCount() !== 1 ? 's' : ''} in your cart
                  {user && (
                    <span className="text-xs text-green-600 ml-2">✓ Synced across devices</span>
                  )}
                </p>
              </div>
              <div>
                <button
                  onClick={() => navigate('/services')}
                  className="px-5 py-2.5 bg-primary rounded-lg font-medium text-white cursor-pointer hover:bg-primary/80 text-sm"
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          </div>

          {loadingServices ? (
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-5">
                <CartItemSkeleton />
              </div>
              <div className="lg:col-span-1">
                <OrderSummarySkeleton />
              </div>
            </div>
          ) : cart && cart.length > 0 ? (
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Left Column - Cart Items */}
              <div className="lg:col-span-2 space-y-5">
                {cart.map((item) => {
                  const service = getService(item);
                  const isPkg = isPackageService(service);
                  const isFree = isFreeService(service);
                  const isVoucher = isVoucherService(item);
                  const pkgInfo = isPkg ? getPackageInfo(service) : null;

                  const itemIdentifier = item.id;
                  const previewUrl = imagePreviews[itemIdentifier];
                  const hasImg = hasImage(itemIdentifier) || !!previewUrl;

                  const voucher = voucherDetails[item.service_id];
                  const isUploading = uploadingImages[itemIdentifier];
                  const isRemoving = removingImageId === itemIdentifier;
                  const uploadProgress = imageUploadProgress[itemIdentifier] || 0;

                  return (
                    <div
                      key={item.id}
                      className={`bg-white rounded-xl shadow-sm border overflow-hidden ${
                        isVoucher ? 'border-emerald-300 border-2' : 'border-gray-200'
                      }`}
                    >
                      {/* Service Type Badge */}
                      <div
                        className={`px-5 py-2.5 ${
                          isVoucher
                            ? 'bg-gradient-to-r from-emerald-600 to-green-600'
                            : isFree
                            ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                            : pkgInfo?.color || 'bg-gray-100'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {isVoucher ? (
                              <>
                                <FaGift className="w-5 h-5 text-white" />
                                <span className="text-white font-semibold text-sm">
                                  VOUCHER REDEMPTION
                                </span>
                              </>
                            ) : isFree ? (
                              <>
                                <GiftIcon className="w-5 h-5 text-white" />
                                <span className="text-white font-semibold text-sm">
                                  FREE SERVICE
                                </span>
                              </>
                            ) : (
                              <>
                                <ShoppingBagIcon
                                  className={`w-5 h-5 ${
                                    isPkg ? pkgInfo?.textColor : 'text-gray-700'
                                  }`}
                                />
                                <span
                                  className={`${
                                    isPkg ? pkgInfo?.textColor : 'text-gray-700'
                                  } font-semibold text-sm`}
                                >
                                  {isPkg ? pkgInfo?.tagText : 'STANDARD SERVICE'}
                                </span>
                              </>
                            )}
                          </div>
                          {isPkg && (
                            <span
                              className={`${pkgInfo?.badgeColor} px-2.5 py-1 rounded-full text-xs font-medium ${pkgInfo?.textColor}`}
                            >
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
                        <div className="flex flex-col sm:flex-row gap-5">
                          {/* Service Image */}
                          <div className="w-full sm:w-24 h-24 flex-shrink-0">
                            <div className="relative w-full h-full rounded-lg overflow-hidden bg-gray-100">
                              <img
                                src={service.image || '/placeholder-shoe.jpg'}
                                alt={service.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = '/placeholder-shoe.jpg';
                                }}
                              />
                              {isVoucher && (
                                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-green-500/20 flex items-center justify-center">
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
                                <h3 className="font-bold text-gray-900 text-base mb-1">
                                  {service.name}
                                </h3>
                                <p className="text-gray-600 text-sm line-clamp-2">
                                  {service.description}
                                </p>

                                {/* Voucher Details */}
                                {isVoucher && item.voucher_code && (
                                  <div className="mt-3 p-3 bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg border border-emerald-200">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <FaTag className="text-emerald-600" />
                                        <span className="text-sm font-medium text-emerald-800">
                                          Voucher Code:
                                        </span>
                                        <code className="font-mono font-bold text-emerald-900 bg-white px-2 py-1 rounded text-sm">
                                          {item.voucher_code}
                                        </code>
                                      </div>
                                      {voucher?.valid_until && (
                                        <div className="text-xs text-emerald-600">
                                          Expires: {formatDate(voucher.valid_until)}
                                        </div>
                                      )}
                                    </div>
                                    {item.voucher_value && (
                                      <div className="mt-2 text-sm text-emerald-700">
                                        <span className="font-medium">Original Value:</span> ₵
                                        {item.voucher_value}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                              <button
                                onClick={() => handleRemoveFromCart(itemIdentifier)}
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
                                      onClick={() =>
                                        handleQuantityChange(itemIdentifier, item.quantity, -1)
                                      }
                                      disabled={item.quantity <= 1}
                                      className="w-10 h-10 flex items-center justify-center text-gray-700 hover:bg-white hover:text-primary rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transform transition-transform"
                                    >
                                      <MinusIcon className="w-5 h-5" />
                                    </button>
                                    <span className="w-12 text-center font-bold text-gray-900 text-lg">
                                      {item.quantity}
                                    </span>
                                    <button
                                      onClick={() =>
                                        handleQuantityChange(itemIdentifier, item.quantity, 1)
                                      }
                                      className="w-10 h-10 flex items-center justify-center text-gray-700 hover:bg-white hover:text-primary rounded-lg transition-colors active:scale-95 transform transition-transform"
                                    >
                                      <PlusIcon className="w-5 h-5" />
                                    </button>
                                  </div>
                                )}
                                {(isFree || isVoucher) && (
                                  <div
                                    className={`px-3 py-1.5 rounded-lg border ${
                                      isVoucher
                                        ? 'bg-gradient-to-r from-emerald-100 to-green-100 border-emerald-200'
                                        : 'bg-gradient-to-r from-green-100 to-emerald-100 border-green-200'
                                    }`}
                                  >
                                    <span
                                      className={`font-medium text-sm ${
                                        isVoucher ? 'text-emerald-700' : 'text-green-700'
                                      }`}
                                    >
                                      {isVoucher ? 'Voucher Applied' : 'Free Service'}
                                    </span>
                                  </div>
                                )}
                              </div>

                              <div className="text-right">
                                <div
                                  className={`font-bold ${
                                    isVoucher
                                      ? 'text-emerald-600'
                                      : isFree
                                      ? 'text-green-600'
                                      : 'text-gray-900'
                                  } text-lg`}
                                >
                                  {isVoucher ? (
                                    <>
                                      <span className="line-through text-gray-400 text-sm mr-2">
                                        ₵{service.price}
                                      </span>
                                      <span className="bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
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
                                    `₵${(item.unit_price * item.quantity).toFixed(2)}`
                                  )}
                                </div>
                                {isPkg && (
                                  <div className="text-sm text-green-600 font-medium">
                                    Save with bundle
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Photo Upload Section */}
                            <div className="border-t border-gray-100 mt-4 pt-4">
                              <div className="hidden sm:flex flex-row items-center justify-between gap-3">
                                <div>
                                  <h4 className="font-medium text-gray-900 text-base mb-1">
                                    Shoe Photo
                                  </h4>
                                  <p className="text-gray-600 text-sm">
                                    {hasImg
                                      ? 'Photo added successfully'
                                      : 'Required for service processing'}
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
                                  {isUploading ? (
                                    <ImageUploadLoader progress={uploadProgress} />
                                  ) : isRemoving ? (
                                    <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-600 text-white rounded-lg">
                                      <FaSpinner className="animate-spin w-4 h-4" />
                                      <span className="text-sm">Removing...</span>
                                    </div>
                                  ) : hasImg && previewUrl ? (
                                    <>
                                      <div className="relative group">
                                        <img
                                          src={previewUrl}
                                          alt="Shoe preview"
                                          className="w-16 h-16 rounded-lg object-cover border-2 border-green-200 cursor-pointer hover:opacity-90 transition-opacity"
                                          onClick={() => setPreviewImage(previewUrl)}
                                        />
                                        <button
                                          onClick={() => handleImageRemove(itemIdentifier)}
                                          className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
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
                                        onClick={() => openCamera(itemIdentifier)}
                                        className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all text-sm"
                                      >
                                        <FaCamera className="w-4 h-4" />
                                        Take Photo
                                      </button>
                                      <button
                                        onClick={() => openGallery(itemIdentifier)}
                                        className="flex items-center gap-2 px-4 py-2.5 bg-gray-700 text-white rounded-lg font-medium hover:bg-gray-800 transition-all text-sm"
                                      >
                                        <FaImage className="w-4 h-4" />
                                        Gallery
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>

                              {/* Mobile Layout */}
                              <div className="sm:hidden flex flex-col gap-3">
                                <div>
                                  <h4 className="font-medium text-gray-900 text-base mb-1">
                                    Shoe Photo
                                  </h4>
                                  <p className="text-gray-600 text-sm mb-3">
                                    {hasImg
                                      ? 'Photo added successfully'
                                      : 'Required for service processing'}
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
                                  {isUploading ? (
                                    <ImageUploadLoader progress={uploadProgress} />
                                  ) : isRemoving ? (
                                    <div className="flex items-center gap-2 px-4 py-3 bg-gray-600 text-white rounded-lg w-full justify-center">
                                      <FaSpinner className="animate-spin w-4 h-4" />
                                      <span className="text-sm">Removing...</span>
                                    </div>
                                  ) : hasImg && previewUrl ? (
                                    <>
                                      <div className="relative group">
                                        <img
                                          src={previewUrl}
                                          alt="Shoe preview"
                                          className="w-16 h-16 rounded-lg object-cover border-2 border-green-200 cursor-pointer"
                                          onClick={() => setPreviewImage(previewUrl)}
                                        />
                                        <button
                                          onClick={() => handleImageRemove(itemIdentifier)}
                                          className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                                        >
                                          <XMarkIcon className="w-3 h-3" />
                                        </button>
                                      </div>
                                      <div className="flex flex-col">
                                        <span className="text-sm text-gray-600 mb-1">
                                          Shoe preview
                                        </span>
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
                                        onClick={() => openCamera(itemIdentifier)}
                                        className="flex-1 min-w-[140px] flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all text-sm"
                                      >
                                        <FaCamera className="w-4 h-4" />
                                        Take Photo
                                      </button>
                                      <button
                                        onClick={() => openGallery(itemIdentifier)}
                                        className="flex-1 min-w-[140px] flex items-center justify-center gap-2 px-4 py-3 bg-gray-700 text-white rounded-lg font-medium hover:bg-gray-800 transition-all text-sm"
                                      >
                                        <FaImage className="w-4 h-4" />
                                        Gallery
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Right Column - Order Summary */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 sticky top-20">
                  <h2 className="text-lg font-bold text-gray-900 mb-5">Order Summary</h2>

                  <div className="space-y-4">
                    {/* Items List */}
                    <div className="space-y-3 max-h-56 overflow-y-auto pr-2">
                      {cart.map((item) => {
                        const service = getService(item);
                        const isFree = isFreeService(service);
                        const isVoucher = isVoucherService(item);

                        return (
                          <div
                            key={item.id}
                            className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0"
                          >
                            <div className="flex items-center gap-2 max-w-[70%]">
                              <span className="text-gray-700 text-sm truncate">
                                {service.name}
                              </span>
                              <span className="text-gray-500 text-xs">×{item.quantity}</span>
                              {isVoucher && (
                                <span className="text-xs bg-gradient-to-r from-emerald-500 to-green-500 text-white px-2 py-0.5 rounded">
                                  Voucher
                                </span>
                              )}
                              {isFree && !isVoucher && (
                                <span className="text-xs bg-gradient-to-r from-green-500 to-emerald-500 text-white px-2 py-0.5 rounded">
                                  Free
                                </span>
                              )}
                            </div>
                            <span
                              className={`font-medium ${
                                isVoucher
                                  ? 'text-emerald-600'
                                  : isFree
                                  ? 'text-green-600'
                                  : 'text-gray-900'
                              } text-sm`}
                            >
                              {isVoucher || isFree
                                ? 'FREE'
                                : `₵${(item.unit_price * item.quantity).toFixed(2)}`}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Totals */}
                    <div className="space-y-3 pt-4 border-t border-gray-200">
                      <div className="flex justify-between text-gray-700">
                        <span className="text-sm">Subtotal</span>
                        <span className="font-medium">₵{subtotal.toFixed(2)}</span>
                      </div>

                      {(canUseSignup && signupDiscountAmount > 0) && (
                        <div className="flex justify-between text-green-600 bg-green-50 rounded-lg p-2.5">
                          <div className="flex items-center gap-1.5">
                            <SparklesIcon className="w-4 h-4" />
                            <span className="text-sm font-medium">Welcome Discount</span>
                          </div>
                          <span className="font-medium">-₵{signupDiscountAmount.toFixed(2)}</span>
                        </div>
                      )}

                      {appliedPromotion && promoDiscountAmount > 0 && (
                        <div className="flex justify-between text-purple-600 bg-purple-50 rounded-lg p-2.5">
                          <div className="flex items-center gap-1.5">
                            <TicketIcon className="w-4 h-4" />
                            <span className="text-sm font-medium">Promotion</span>
                          </div>
                          <span className="font-medium">-₵{promoDiscountAmount.toFixed(2)}</span>
                        </div>
                      )}

                      <div className="flex justify-between pt-4 border-t border-gray-200">
                        <div>
                          <span className="font-bold text-gray-900">Total</span>
                        </div>
                        <div className="text-right">
                          {(canUseSignup ||
                            canUseReferral ||
                            appliedPromotion ||
                            canUseRedeemedPoints) &&
                            parseFloat(total) > 0 && (
                              <div className="text-sm text-gray-500 line-through mb-1">
                                ₵{subtotal.toFixed(2)}
                              </div>
                            )}
                          <div className="text-xl font-bold text-gray-900">₵{total}</div>
                        </div>
                      </div>
                    </div>

                    {/* Checkout Button */}
                    <button
                      onClick={() => {
                        const allHavePhotos = cart.every((i) => hasImage(i.id) || imagePreviews[i.id]);
                        const isAnyUploading = Object.values(uploadingImages).some((v) => v === true);

                        if (isAnyUploading) {
                          toast.warning('Please wait for image uploads to complete');
                          return;
                        }

                        if (allHavePhotos) {
                          navigate('/checkout');
                        } else {
                          const missingPhotos = cart.filter((i) => !hasImage(i.id) && !imagePreviews[i.id]).length;
                          toast.warning(
                            `Please add photos for ${missingPhotos} item${
                              missingPhotos !== 1 ? 's' : ''
                            } before checkout`
                          );
                        }
                      }}
                      className="w-full bg-primary text-white font-bold py-3.5 rounded-lg transition-all duration-200 shadow hover:shadow-lg mt-5 text-base active:scale-98 transform transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={Object.values(uploadingImages).some((v) => v === true)}
                    >
                      {Object.values(uploadingImages).some((v) => v === true) ? (
                        <span className="flex items-center justify-center gap-2">
                          <FaSpinner className="animate-spin w-5 h-5" />
                          Uploading Images...
                        </span>
                      ) : (
                        'Proceed to Checkout'
                      )}
                    </button>
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
                <p className="text-gray-600 mb-7">
                  Add some sneaker cleaning services to get started
                </p>
                <div className="mt-4">
                  <button
                    onClick={() => navigate('/services')}
                    className="px-8 cursor-pointer py-3.5 bg-primary text-white rounded-lg hover:opacity-90 transition-all text-base"
                  >
                    Browse Services
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
      <Footer />
    </>
  );
};

export default Cart;