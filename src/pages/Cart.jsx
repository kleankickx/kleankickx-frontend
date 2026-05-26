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

// ─── Skeletons ────────────────────────────────────────────────────────────────

const CartItemSkeleton = () => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-pulse">
    <div className="px-5 py-2.5 bg-gray-100">
      <div className="h-4 bg-gray-200 rounded w-32" />
    </div>
    <div className="p-5">
      <div className="flex flex-col sm:flex-row gap-5">
        <div className="w-full sm:w-24 h-24 bg-gray-200 rounded-lg" />
        <div className="flex-1">
          <div className="flex justify-between">
            <div className="flex-1">
              <div className="h-5 bg-gray-200 rounded w-40 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-full max-w-md" />
            </div>
            <div className="w-8 h-8 bg-gray-200 rounded-full" />
          </div>
          <div className="flex flex-col sm:flex-row justify-between mt-4 gap-3">
            <div className="flex items-center bg-gray-50 rounded-xl p-1 border border-gray-200">
              <div className="w-10 h-10 bg-gray-200 rounded-lg" />
              <div className="w-12 h-5 bg-gray-200 mx-2 rounded" />
              <div className="w-10 h-10 bg-gray-200 rounded-lg" />
            </div>
            <div className="w-24 h-6 bg-gray-200 rounded" />
          </div>
          <div className="border-t border-gray-100 mt-4 pt-4">
            <div className="flex justify-between">
              <div className="h-4 bg-gray-200 rounded w-32" />
              <div className="flex gap-2">
                <div className="w-24 h-8 bg-gray-200 rounded-lg" />
                <div className="w-24 h-8 bg-gray-200 rounded-lg" />
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
    <div className="h-6 bg-gray-200 rounded w-32 mb-5" />
    <div className="space-y-3">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="flex justify-between">
          <div className="h-4 bg-gray-200 rounded w-20" />
          <div className="h-4 bg-gray-200 rounded w-16" />
        </div>
      ))}
      <div className="border-t border-gray-200 pt-4 mt-4 flex justify-between">
        <div className="h-5 bg-gray-200 rounded w-16" />
        <div className="h-5 bg-gray-200 rounded w-20" />
      </div>
      <div className="h-12 bg-gray-200 rounded-lg mt-5" />
    </div>
  </div>
);

const PageSkeleton = ({ count = 2 }) => (
  <>
    <section className="bg-gray-50 min-h-screen py-6 px-4 sm:px-6 lg:px-8 mb-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 animate-pulse">
          <div className="flex items-center justify-between">
            <div>
              <div className="h-8 bg-gray-200 rounded w-48 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-32" />
            </div>
            <div className="h-10 bg-gray-200 rounded-lg w-36" />
          </div>
        </div>
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">
            {[...Array(count)].map((_, i) => <CartItemSkeleton key={i} />)}
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

// ─── Main Component ───────────────────────────────────────────────────────────

const Cart = () => {
  const {
    cart,
    loading: cartLoading,
    initialized,
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
  const [loadingServices, setLoadingServices] = useState(false);
  const [uploadingImages, setUploadingImages] = useState({});
  const [imageUploadProgress, setImageUploadProgress] = useState({});
  // Stage labels shown alongside the progress bar — one entry per uploading item
  const [imageUploadStage, setImageUploadStage] = useState({});
  const [previewImage, setPreviewImage] = useState(null);
  const [isRecovering, setIsRecovering] = useState(false);
  const [imagePreviews, setImagePreviews] = useState({});
  const [cameraMode, setCameraMode] = useState(null);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [isFrontCamera, setIsFrontCamera] = useState(false);
  const [voucherDetails] = useState({});
  const [removingImageId, setRemovingImageId] = useState(null);

  const [appliedPromotion] = useState(null);
  const [signupDiscountUsed] = useState(false);
  const [referralDiscountUsed] = useState(false);
  const [redeemedPointsDiscount] = useState(null);
  const [removingItemId, setRemovingItemId] = useState(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const navigate = useNavigate();

 // ── Auto-recover cart from URL param ──────────────────────────────────────
useEffect(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const recoverCartId = urlParams.get('recover');
  
  if (!recoverCartId) return;

  const attemptRecovery = async () => {
    setIsRecovering(true);
    
    try {
      // Try to recover the cart
      const response = await api.post('/api/cart/recover/', { cart_id: recoverCartId });
      
      // Check the response status
      if (response.data.status === 'already_recovered') {
        toast.info(response.data.message || 'This cart has already been restored.', {
          autoClose: 4000,
        });
      } else if (response.data.status === 'already_active') {
        toast.info(response.data.message || 'Your cart is already active.', {
          autoClose: 3000,
        });
      } else {
        // Success - cart recovered
        await refreshCart();
        toast.success(response.data.message || 'Your cart has been restored successfully!', { 
          autoClose: 3000 
        });
      }
      
      // Clear URL
      window.history.replaceState({}, '', '/cart');
      
    } catch (error) {
      console.error('Failed to recover cart:', error);
      
      // If error is 401 (Unauthorized), redirect to login
      if (error.response?.status === 401) {
        // Store cart ID for recovery after login
        sessionStorage.setItem('pending_recovery_cart_id', recoverCartId);
        
        toast.info('Please sign in to restore your cart', {
          position: 'top-right',
          autoClose: 3000,
        });
        
        // Clear URL before redirect
        window.history.replaceState({}, '', '/cart');
        
        // Redirect to login
        navigate('/auth/login', {
          state: {
            from: '/cart',
            pendingRecovery: recoverCartId,
            message: 'Sign in to restore your saved cart!'
          }
        });
      } else if (error.response?.data?.error) {
        toast.error(error.response.data.error, { autoClose: 4000 });
        window.history.replaceState({}, '', '/cart');
      } else {
        toast.error('Could not restore your cart. Please try again.', { autoClose: 4000 });
        window.history.replaceState({}, '', '/cart');
      }
    } finally {
      setIsRecovering(false);
    }
  };
  
  attemptRecovery();
}, []);

  // ── Sync image previews whenever cart data changes ────────────────────────
  useEffect(() => {
    if (!cart) return;
    const previews = {};
    for (const item of cart) {
      if (!item.id || !hasImage(item.id)) continue;
      const base64 = getImageBase64(item.id);
      if (!base64) continue;
      previews[item.id] = base64.startsWith('data:')
        ? base64
        : base64.startsWith('/9j/')
          ? `data:image/jpeg;base64,${base64}`
          : base64.startsWith('iVBOR')
            ? `data:image/png;base64,${base64}`
            : `data:image/jpeg;base64,${base64}`;
    }
    setImagePreviews(previews);
  }, [cart, hasImage, getImageBase64]);

  // ── Fetch service details for any new cart items ──────────────────────────
  useEffect(() => {
    if (!cart || cart.length === 0) {
      setServices({});
      setLoadingServices(false);
      return;
    }

    const missing = cart
      .map((item) => item.service || item.service_id)
      .filter((id) => id && !services[id]);

    if (missing.length === 0) {
      setLoadingServices(false);
      return;
    }

    setLoadingServices(true);
    const serviceMap = { ...services };

    (async () => {
      for (const item of cart) {
        const serviceId = item.service || item.service_id;
        if (!serviceId || serviceMap[serviceId]) continue;
        try {
          const { data } = await api.get(`/api/services/${serviceId}/`);
          serviceMap[serviceId] = data;
        } catch {
          serviceMap[serviceId] = {
            id: serviceId,
            name: item.service_name,
            price: item.unit_price,
            description: item.is_voucher_redeem ? 'Voucher redemption service' : 'Cleaning service',
            service_type: item.service_type,
            included_quantity: item.included_quantity,
            is_free_signup_service: item.is_free_signup_service,
            image: null,
          };
        }
      }
      setServices(serviceMap);
      setLoadingServices(false);
    })();
  }, [cart]);

  // ── Quantity / remove ─────────────────────────────────────────────────────
  const handleQuantityChange = useCallback(
    async (itemId, currentQty, delta) => {
      const next = currentQty + delta;
      if (next < 1) return;
      await updateQuantity(itemId, next);
    },
    [updateQuantity]
  );

  const handleRemoveFromCart = useCallback(async (itemId) => {
    setRemovingItemId(itemId);
    
    // Remove preview immediately
    setImagePreviews(prev => {
      const next = { ...prev };
      delete next[itemId];
      return next;
    });
    
    await removeFromCart(itemId);
    setRemovingItemId(null);
  }, [removeFromCart]);

  // ── Image removal ─────────────────────────────────────────────────────────
  const handleImageRemove = useCallback(async (itemId) => {
    setRemovingImageId(itemId);
    setImagePreviews((prev) => { const n = { ...prev }; delete n[itemId]; return n; });
    try {
      await removeImageFromCartItem(itemId);
      toast.success('Photo removed successfully!', { autoClose: 2000 });
    } catch {
      toast.error('Failed to remove photo. Please try again.');
      await refreshCart();
    } finally {
      setRemovingImageId(null);
    }
  }, [removeImageFromCartItem, refreshCart]);

  // ── Image helpers ─────────────────────────────────────────────────────────
  const fileToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const r = new FileReader();
      r.readAsDataURL(file);
      r.onload = () => resolve(r.result);
      r.onerror = reject;
    });

  const convertHeicToJpeg = async (file) => {
    const result = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.8 });
    return new File([result], file.name.replace(/\.heic$/i, '.jpg'), { type: 'image/jpeg', lastModified: Date.now() });
  };

  const processJpegImage = (file, onProgress) =>
    new Promise((resolve, reject) => {
      if (file.size < 1024 * 1024) return resolve(file);
      onProgress?.(30);
      const img = new Image();
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target.result;
        img.onload = () => {
          onProgress?.(60);
          const canvas = document.createElement('canvas');
          let { width, height } = img;
          const max = 1200;
          if (width > height && width > max) { height = Math.round(height * max / width); width = max; }
          else if (height > max) { width = Math.round(width * max / height); height = max; }
          canvas.width = width; canvas.height = height;
          canvas.getContext('2d').drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => {
            if (!blob) return reject(new Error('Failed to process image'));
            onProgress?.(90);
            resolve(new File([blob], file.name || `image-${Date.now()}.jpg`, { type: 'image/jpeg' }));
          }, 'image/jpeg', 0.85);
        };
      };
      reader.readAsDataURL(file);
    });

  const processImage = async (file, onProgress) => {
    const isHeic = file.type === 'image/heic' || file.type === 'image/heif' ||
      file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif');
    return processJpegImage(isHeic ? await convertHeicToJpeg(file) : file, onProgress);
  };

  const validateImageFile = (file) => {
    const valid = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
    const name = file.name.toLowerCase();
    const isHeic = name.endsWith('.heic') || name.endsWith('.heif');
    if (!valid.includes(file.type) && !isHeic) return { valid: false, message: 'Please upload a valid image (JPEG, PNG, WebP, or HEIC)' };
    if (file.size > 15 * 1024 * 1024) return { valid: false, message: 'Image size should be less than 15MB' };
    return { valid: true };
  };

  // ── Camera ────────────────────────────────────────────────────────────────
  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
  };

  const startCamera = async () => {
    try {
      stopCamera();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: isFrontCamera ? 'user' : 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => videoRef.current.play();
      }
    } catch {
      toast.error('Camera access denied or unavailable.');
      setShowCameraModal(false);
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

  const openCamera = (itemId) => { setCameraMode(itemId); setShowCameraModal(true); setTimeout(startCamera, 300); };
  const switchCamera = () => { setIsFrontCamera((v) => !v); setTimeout(startCamera, 100); };

  // ── Image upload ──────────────────────────────────────────────────────────
  //
  // Progress is tied to real pipeline stages — no fake timers.
  //
  // Stage breakdown (% ranges are stable budgets per stage):
  //   0–15  Reading file into memory      (FileReader onprogress — real bytes)
  //   15–20 HEIC conversion start         (indeterminate — single jump)
  //   20–55 Image compression             (canvas processImage onProgress callback)
  //   55–60 Base64 encoding               (synchronous — single jump on completion)
  //   60–95 API upload                    (axios onUploadProgress — real bytes)
  //   95–100 Server processing + refresh  (single jump on API 2xx)

  const setProgress = (itemId, pct, stage) => {
    setImageUploadProgress((p) => ({ ...p, [itemId]: Math.round(pct) }));
    if (stage) setImageUploadStage((p) => ({ ...p, [itemId]: stage }));
  };

  const handleImageUpload = async (itemId, file) => {
    const v = validateImageFile(file);
    if (!v.valid) { toast.error(v.message); return; }

    setUploadingImages((p) => ({ ...p, [itemId]: true }));
    setProgress(itemId, 0, 'Reading file…');

    try {
      // ── Stage 1: Read file for preview + measure real read progress (0–15%) ──
      const previewDataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onprogress = (e) => {
          if (e.lengthComputable) {
            setProgress(itemId, (e.loaded / e.total) * 15, 'Reading file…');
          }
        };
        reader.onload = (e) => {
          setImagePreviews((p) => ({ ...p, [itemId]: e.target.result }));
          resolve(e.target.result);
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
      });

      // ── Stage 2: HEIC detection + conversion start (15–20%) ──
      const isHeic = file.type === 'image/heic' || file.type === 'image/heif' ||
        file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif');

      if (isHeic) {
        setProgress(itemId, 15, 'Converting HEIC…');
      } else {
        setProgress(itemId, 15, 'Preparing image…');
      }

      // ── Stage 3: Compression (20–55%) via processImage onProgress callback ──
      // processImage already calls onProgress with values 30, 60, 90 internally.
      // We remap those into our 20–55% budget.
      const processed = await processImage(file, (internalPct) => {
        // internalPct is 30 / 60 / 90 from processJpegImage
        const remapped = 20 + (internalPct / 100) * 35;
        const stage = internalPct < 60 ? 'Compressing image…' : 'Finalising image…';
        setProgress(itemId, remapped, stage);
      });

      // If file was small enough to skip compression (returned immediately),
      // make sure we still advance past stage 3.
      setProgress(itemId, 55, 'Encoding…');

      // ── Stage 4: Base64 encode (55–60%) — synchronous, single jump ──
      const b64 = await fileToBase64(processed);
      const raw = b64.includes(',') ? b64.split(',')[1] : b64;
      if (!raw) throw new Error('Failed to convert file to base64');
      setProgress(itemId, 60, 'Uploading…');

      // ── Stage 5: API upload with real byte progress (60–95%) ──
      // addImageToCartItem goes through CartContext which calls api.post internally.
      // We need onUploadProgress, so we call api directly here and let
      // CartContext.loadCart sync the result.
      await api.post(
        `/api/cart/items/${itemId}/add-image/`,
        { image_base64: raw },
        {
          onUploadProgress: (e) => {
            if (e.lengthComputable) {
              const uploadPct = 60 + (e.loaded / e.total) * 35;
              setProgress(itemId, uploadPct, 'Uploading…');
            }
          },
        }
      );

      // ── Stage 6: Server confirmed, refreshing cart (95–100%) ──
      setProgress(itemId, 95, 'Saving…');
      await refreshCart();
      setProgress(itemId, 100, 'Done!');

      toast.success('Photo added successfully!', { autoClose: 3000 });
      setTimeout(() => {
        setImageUploadProgress((p) => { const s = { ...p }; delete s[itemId]; return s; });
        setImageUploadStage((p) => { const s = { ...p }; delete s[itemId]; return s; });
      }, 1200);

    } catch (error) {
      toast.error(error.message || 'Failed to upload image');
      setImagePreviews((p) => { const s = { ...p }; delete s[itemId]; return s; });
      setImageUploadProgress((p) => { const s = { ...p }; delete s[itemId]; return s; });
      setImageUploadStage((p) => { const s = { ...p }; delete s[itemId]; return s; });
      await refreshCart();
    } finally {
      setUploadingImages((p) => ({ ...p, [itemId]: false }));
    }
  };

  const openGallery = (itemId) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,image/heic,image/heif,.heic,.heif';
    input.onchange = (e) => { const f = e.target.files[0]; if (f) handleImageUpload(itemId, f); input.value = ''; };
    input.click();
  };

  // ── Service helpers ───────────────────────────────────────────────────────
  const getService = (item) => {
    const id = item.service || item.service_id;
    const svc = services[id];
    if (!svc) return {
      id, name: item.service_name || 'Loading...',
      description: item.is_voucher_redeem ? 'Voucher redemption service' : 'Cleaning service',
      price: item.unit_price || 0, service_type: item.service_type || 'INDIVIDUAL',
      included_quantity: item.included_quantity || 1,
      is_free_signup_service: item.is_free_signup_service || false, image: null,
    };
    return { ...svc, image: svc.image || null };
  };

  const isPackageService = (s) => s?.service_type?.startsWith('PACKAGE_');
  const isFreeService = (s) => s?.is_free_signup_service === true;
  const isVoucherService = (i) => i.is_voucher_redeem === true;

  const getPackageInfo = (service) => ({
    PACKAGE_3: { color: 'bg-blue-50', textColor: 'text-blue-700', badgeColor: 'bg-blue-100', tagText: '3-SNEAKER BUNDLE', sneakers: 3 },
    PACKAGE_5: { color: 'bg-purple-50', textColor: 'text-purple-700', badgeColor: 'bg-purple-100', tagText: '5-SNEAKER BUNDLE', sneakers: 5 },
    PACKAGE_10: { color: 'bg-green-50', textColor: 'text-green-700', badgeColor: 'bg-green-100', tagText: '10-SNEAKER BUNDLE', sneakers: 10 },
    PACKAGE_20: { color: 'bg-orange-50', textColor: 'text-orange-700', badgeColor: 'bg-orange-100', tagText: '20-SNEAKER BUNDLE', sneakers: 20 },
  }[service.service_type] || { color: 'bg-gray-50', textColor: 'text-gray-700', tagText: 'BUNDLE DEAL', sneakers: 1 });

  const formatDate = (d) => d
    ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    : 'N/A';

  // ── Totals ────────────────────────────────────────────────────────────────
  const subtotal = cartMeta?.total || 0;
  const signupDiscount = discounts?.find((d) => d.discount_type === 'signup');
  const referralDiscount = discounts?.find((d) => d.discount_type === 'referral');
  const canUseSignup = user && !signupDiscountUsed?.signup_discount_used && signupDiscount?.is_active;
  const canUseReferral = user && referralDiscountUsed?.first_order_completed === false && referralDiscount;
  const canUseRedeemedPoints = user && redeemedPointsDiscount?.is_applied === false;
  const signupAmt = canUseSignup ? (parseFloat(subtotal) * parseFloat(signupDiscount.percentage)) / 100 : 0;
  const referralAmt = canUseReferral ? (parseFloat(subtotal) * parseFloat(referralDiscount.percentage)) / 100 : 0;
  const promoAmt = appliedPromotion ? (parseFloat(subtotal) * parseFloat(appliedPromotion.discount_percentage)) / 100 : 0;
  const pointsAmt = canUseRedeemedPoints && redeemedPointsDiscount?.percentage
    ? (parseFloat(subtotal) * parseFloat(redeemedPointsDiscount.percentage)) / 100 : 0;
  const total = (parseFloat(subtotal) - (promoAmt + signupAmt + referralAmt + pointsAmt)).toFixed(2);
  const isAnyUploading = Object.values(uploadingImages).some(Boolean);

  // ── Sub-components ────────────────────────────────────────────────────────
  const ImageUploadLoader = ({ progress, stage }) => {
    const isDone = progress >= 100;
    return (
      <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg min-w-[140px]">
        {isDone
          ? <div className="w-6 h-6 mb-2 text-green-500">✓</div>
          : <FaSpinner className="animate-spin text-primary w-6 h-6 mb-2" />}
        <div className="w-full bg-gray-200 rounded-full h-1.5 mb-1.5">
          <div
            className={`h-1.5 rounded-full transition-all duration-300 ${isDone ? 'bg-green-500' : 'bg-primary'}`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-xs font-medium text-gray-600">{progress}%</span>
        {stage && <span className="text-xs text-gray-400 mt-0.5 text-center leading-tight">{stage}</span>}
      </div>
    );
  };

  const CameraModal = () => !showCameraModal ? null : (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4">
        <button onClick={() => { stopCamera(); setShowCameraModal(false); }} className="text-white p-2 bg-black/50 rounded-full">
          <FaTimes size={24} />
        </button>
        <button onClick={switchCamera} className="text-white p-2 bg-black/50 rounded-full">
          <CameraIcon className="w-6 h-6" />
        </button>
      </div>
      <video ref={videoRef} className="flex-1 w-full h-full object-cover" playsInline />
      <canvas ref={canvasRef} className="hidden" />
      <div className="absolute bottom-10 left-0 right-0 flex justify-center">
        <button onClick={capturePhoto} className="w-20 h-20 bg-white rounded-full border-4 border-gray-300 shadow-xl active:scale-95 transition-transform" />
      </div>
    </div>
  );

  // ── GATE: show skeleton until context has finished its initial fetch ───────
  if (!initialized || cartLoading) {
    return <PageSkeleton count={cart?.length > 0 ? cart.length : 2} />;
  }

  if (cart.length > 0 && loadingServices) {
    return <PageSkeleton count={cart.length} />;
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <section className="bg-gray-50 min-h-screen py-6 px-4 sm:px-6 lg:px-8 mb-8">
        <CameraModal />

        {isRecovering && (
          <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center">
            <div className="bg-white rounded-xl px-10 py-8 flex flex-col items-center gap-4 shadow-2xl">
              <FaSpinner className="animate-spin w-10 h-10 text-primary" />
              <p className="text-gray-700 font-semibold text-base">Restoring your cart...</p>
            </div>
          </div>
        )}

        {previewImage && (
          <div className="fixed inset-0 bg-black/90 z-40 flex items-center justify-center p-4 cursor-pointer" onClick={() => setPreviewImage(null)}>
            <img src={previewImage} className="max-w-full max-h-full rounded-lg object-contain" alt="Preview" />
          </div>
        )}

        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Shopping Cart</h1>
              <p className="text-gray-600 mt-1">
                {getCartItemCount()} item{getCartItemCount() !== 1 ? 's' : ''} in your cart
                {user && <span className="text-xs text-green-600 ml-2">✓ Synced across devices</span>}
              </p>
            </div>
            <button onClick={() => navigate('/services')} className="px-5 py-2.5 bg-primary rounded-lg font-medium text-white hover:bg-primary/80 text-sm flex items-center justify-center gap-2 cursor-pointer">
              <ShoppingBagIcon className="w-5 h-5" />
              Continue kleaning
            </button>
          </div>

          {cart.length > 0 ? (
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Cart Items */}
              <div className="lg:col-span-2 space-y-5">
                {cart.map((item) => {
                  const service = getService(item);
                  const isPkg = isPackageService(service);
                  const isFree = isFreeService(service);
                  const isVoucher = isVoucherService(item);
                  const pkgInfo = isPkg ? getPackageInfo(service) : null;
                  const previewUrl = imagePreviews[item.id];
                  const hasImg = hasImage(item.id) || !!previewUrl;
                  const isUploading = uploadingImages[item.id];
                  const isRemoving = removingImageId === item.id;
                  const progress = imageUploadProgress[item.id] || 0;

                  return (
                    <div key={item.id} className={`bg-white rounded-xl shadow-sm border overflow-hidden ${isVoucher ? 'border-emerald-300 border-2' : 'border-gray-200'}`}>
                      {/* Badge */}
                      <div className={`px-5 py-2.5 ${isVoucher ? 'bg-gradient-to-r from-emerald-600 to-green-600' : isFree ? 'bg-gradient-to-r from-green-500 to-emerald-500' : pkgInfo?.color || 'bg-gray-100'}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {isVoucher ? (<><FaGift className="w-5 h-5 text-white" /><span className="text-white font-semibold text-sm">VOUCHER REDEMPTION</span></>)
                              : isFree ? (<><GiftIcon className="w-5 h-5 text-white" /><span className="text-white font-semibold text-sm">FREE SERVICE</span></>)
                              : (<><ShoppingBagIcon className={`w-5 h-5 ${isPkg ? pkgInfo?.textColor : 'text-gray-700'}`} /><span className={`${isPkg ? pkgInfo?.textColor : 'text-gray-700'} font-semibold text-sm`}>{isPkg ? pkgInfo?.tagText : 'STANDARD SERVICE'}</span></>)}
                          </div>
                          {isPkg && <span className={`${pkgInfo?.badgeColor} px-2.5 py-1 rounded-full text-xs font-medium ${pkgInfo?.textColor}`}>{pkgInfo?.sneakers} sneakers</span>}
                          {isVoucher && item.voucher_code && <code className="bg-white/20 px-2.5 py-1 rounded text-xs font-mono text-white">{item.voucher_code}</code>}
                        </div>
                      </div>

                      <div className="p-5">
                        <div className="flex flex-col sm:flex-row gap-5">
                          {/* Service image */}
                          <div className="w-full sm:w-24 h-24 flex-shrink-0">
                            <div className="relative w-full h-full rounded-lg overflow-hidden bg-gray-100">
                              <img src={service.image || '/placeholder-shoe.jpg'} alt={service.name} className="w-full h-full object-cover"
                                onError={(e) => { e.target.onerror = null; e.target.src = '/placeholder-shoe.jpg'; }} />
                              {isVoucher && <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-green-500/20 flex items-center justify-center"><FaGift className="text-white text-2xl" /></div>}
                              {isFree && !isVoucher && <div className="absolute top-2 right-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-2 py-1 rounded text-xs font-bold shadow">FREE</div>}
                            </div>
                          </div>

                          {/* Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                              <div className="flex-1 min-w-0 pr-3">
                                <h3 className="font-bold text-gray-900 text-base mb-1">{service.name}</h3>
                                <p className="text-gray-600 text-sm line-clamp-2">{service.description}</p>
                                {isVoucher && item.voucher_code && (
                                  <div className="mt-3 p-3 bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg border border-emerald-200">
                                    <div className="flex items-center justify-between flex-wrap gap-2">
                                      <div className="flex items-center gap-2">
                                        <FaTag className="text-emerald-600" />
                                        <span className="text-sm font-medium text-emerald-800">Voucher Code:</span>
                                        <code className="font-mono font-bold text-emerald-900 bg-white px-2 py-1 rounded text-sm">{item.voucher_code}</code>
                                      </div>
                                      {voucherDetails[item.service_id]?.valid_until && <div className="text-xs text-emerald-600">Expires: {formatDate(voucherDetails[item.service_id].valid_until)}</div>}
                                    </div>
                                    {item.voucher_value && <div className="mt-2 text-sm text-emerald-700"><span className="font-medium">Original Value:</span> ₵{item.voucher_value}</div>}
                                  </div>
                                )}
                              </div>
                              <button
                                onClick={() => handleRemoveFromCart(item.id)}
                                className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0 relative cursor-pointer hover:scale-95"
                                disabled={removingItemId === item.id}
                              >
                                {removingItemId === item.id ? (
                                  <FaSpinner className="w-5 h-5 animate-spin" />
                                ) : (
                                  <TrashIcon className="w-5 h-5" />
                                )}
                              </button>
                            </div>

                            <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-4 gap-3">
                              <div className="flex items-center gap-3">
                                {!isFree && !isVoucher ? (
                                  <div className="flex items-center bg-gray-50 rounded-xl p-1 border border-gray-200">
                                    <button onClick={() => handleQuantityChange(item.id, item.quantity, -1)} disabled={item.quantity <= 1}
                                      className="w-10 h-10 flex items-center justify-center text-gray-700 hover:bg-white hover:text-primary rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed active:scale-95">
                                      <MinusIcon className="w-5 h-5" />
                                    </button>
                                    <span className="w-12 text-center font-bold text-gray-900 text-lg">{item.quantity}</span>
                                    <button onClick={() => handleQuantityChange(item.id, item.quantity, 1)}
                                      className="w-10 h-10 flex items-center justify-center text-gray-700 hover:bg-white hover:text-primary rounded-lg transition-colors active:scale-95">
                                      <PlusIcon className="w-5 h-5" />
                                    </button>
                                  </div>
                                ) : (
                                  <div className={`px-3 py-1.5 rounded-lg border ${isVoucher ? 'bg-gradient-to-r from-emerald-100 to-green-100 border-emerald-200' : 'bg-gradient-to-r from-green-100 to-emerald-100 border-green-200'}`}>
                                    <span className={`font-medium text-sm ${isVoucher ? 'text-emerald-700' : 'text-green-700'}`}>{isVoucher ? 'Voucher Applied' : 'Free Service'}</span>
                                  </div>
                                )}
                              </div>
                              <div className="text-right">
                                <div className={`font-bold text-lg ${isVoucher ? 'text-emerald-600' : isFree ? 'text-green-600' : 'text-gray-900'}`}>
                                  {isVoucher ? (<><span className="line-through text-gray-400 text-sm mr-2">₵{service.price}</span><span className="bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">FREE</span></>)
                                    : isFree ? (<><span className="line-through text-gray-400 text-sm mr-2">₵{service.price}</span>FREE</>)
                                    : `₵${(item.unit_price * item.quantity).toFixed(2)}`}
                                </div>
                                {isPkg && <div className="text-sm text-green-600 font-medium">Save with bundle</div>}
                              </div>
                            </div>

                            {/* Photo upload */}
                            <div className="border-t border-gray-100 mt-4 pt-4">
                              {/* Desktop */}
                              <div className="hidden sm:flex flex-row items-center justify-between gap-3">
                                <div>
                                  <h4 className="font-medium text-gray-900 text-base mb-1">Shoe Photo</h4>
                                  <p className="text-gray-600 text-sm">{hasImg ? 'Photo added successfully' : 'Required for service processing'}</p>
                                  {isVoucher && <p className="text-xs text-yellow-600 mt-1">📸 Voucher services also require shoe photos</p>}
                                  <p className="text-xs text-gray-500 mt-1">Supports JPEG, PNG, WebP, HEIC (max 15MB)</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  {isUploading ? <ImageUploadLoader progress={progress} stage={imageUploadStage[item.id]} />
                                    : isRemoving ? (
                                      <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-600 text-white rounded-lg">
                                        <FaSpinner className="animate-spin w-4 h-4" /><span className="text-sm">Removing...</span>
                                      </div>
                                    ) : hasImg && previewUrl ? (
                                      <>
                                        <div className="relative group">
                                          <img src={previewUrl} alt="Shoe preview" className="w-16 h-16 rounded-lg object-cover border-2 border-green-200 cursor-pointer hover:opacity-90 transition-opacity" onClick={() => setPreviewImage(previewUrl)} />
                                          <button onClick={() => handleImageRemove(item.id)} className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100">
                                            <XMarkIcon className="w-3 h-3" />
                                          </button>
                                        </div>
                                        <button onClick={() => setPreviewImage(previewUrl)} className="text-blue-600 hover:text-blue-800 font-medium text-sm">View</button>
                                      </>
                                    ) : (
                                      <>
                                        <button onClick={() => openCamera(item.id)} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all text-sm">
                                          <FaCamera className="w-4 h-4" />Take Photo
                                        </button>
                                        <button onClick={() => openGallery(item.id)} className="flex items-center gap-2 px-4 py-2.5 bg-gray-700 text-white rounded-lg font-medium hover:bg-gray-800 transition-all text-sm">
                                          <FaImage className="w-4 h-4" />Gallery
                                        </button>
                                      </>
                                    )}
                                </div>
                              </div>

                              {/* Mobile */}
                              <div className="sm:hidden flex flex-col gap-3">
                                <div>
                                  <h4 className="font-medium text-gray-900 text-base mb-1">Shoe Photo</h4>
                                  <p className="text-gray-600 text-sm mb-3">{hasImg ? 'Photo added successfully' : 'Required for service processing'}</p>
                                  {isVoucher && <p className="text-xs text-yellow-600 mb-3">📸 Voucher services also require shoe photos</p>}
                                  <p className="text-xs text-gray-500 mb-3">Supports JPEG, PNG, WebP, HEIC (max 15MB)</p>
                                </div>
                                <div className="flex items-start gap-3">
                                  {isUploading ? <ImageUploadLoader progress={progress} stage={imageUploadStage[item.id]} />
                                    : isRemoving ? (
                                      <div className="flex items-center gap-2 px-4 py-3 bg-gray-600 text-white rounded-lg w-full justify-center">
                                        <FaSpinner className="animate-spin w-4 h-4" /><span className="text-sm">Removing...</span>
                                      </div>
                                    ) : hasImg && previewUrl ? (
                                      <>
                                        <div className="relative group">
                                          <img src={previewUrl} alt="Shoe preview" className="w-16 h-16 rounded-lg object-cover border-2 border-green-200 cursor-pointer" onClick={() => setPreviewImage(previewUrl)} />
                                          <button onClick={() => handleImageRemove(item.id)} className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors">
                                            <XMarkIcon className="w-3 h-3" />
                                          </button>
                                        </div>
                                        <div className="flex flex-col">
                                          <span className="text-sm text-gray-600 mb-1">Shoe preview</span>
                                          <button onClick={() => setPreviewImage(previewUrl)} className="text-blue-600 hover:text-blue-800 font-medium text-sm text-left">View</button>
                                        </div>
                                      </>
                                    ) : (
                                      <div className="flex flex-wrap gap-2 w-full">
                                        <button onClick={() => openCamera(item.id)} className="flex-1 min-w-[140px] flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all text-sm">
                                          <FaCamera className="w-4 h-4" />Take Photo
                                        </button>
                                        <button onClick={() => openGallery(item.id)} className="flex-1 min-w-[140px] flex items-center justify-center gap-2 px-4 py-3 bg-gray-700 text-white rounded-lg font-medium hover:bg-gray-800 transition-all text-sm">
                                          <FaImage className="w-4 h-4" />Gallery
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

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 sticky top-20">
                  <h2 className="text-lg font-bold text-gray-900 mb-5">Order Summary</h2>
                  <div className="space-y-4">
                    <div className="space-y-3 max-h-56 overflow-y-auto pr-2">
                      {cart.map((item) => {
                        const service = getService(item);
                        const isFree = isFreeService(service);
                        const isVoucher = isVoucherService(item);
                        return (
                          <div key={item.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                            <div className="flex items-center gap-2 max-w-[70%]">
                              <span className="text-gray-700 text-sm truncate">{service.name}</span>
                              <span className="text-gray-500 text-xs">×{item.quantity}</span>
                              {isVoucher && <span className="text-xs bg-gradient-to-r from-emerald-500 to-green-500 text-white px-2 py-0.5 rounded">Voucher</span>}
                              {isFree && !isVoucher && <span className="text-xs bg-gradient-to-r from-green-500 to-emerald-500 text-white px-2 py-0.5 rounded">Free</span>}
                            </div>
                            <span className={`font-medium text-sm ${isVoucher ? 'text-emerald-600' : isFree ? 'text-green-600' : 'text-gray-900'}`}>
                              {isVoucher || isFree ? 'FREE' : `₵${(item.unit_price * item.quantity).toFixed(2)}`}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    <div className="space-y-3 pt-4 border-t border-gray-200">
                      <div className="flex justify-between text-gray-700">
                        <span className="text-sm">Subtotal</span>
                        <span className="font-medium">₵{subtotal.toFixed(2)}</span>
                      </div>
                      {canUseSignup && signupAmt > 0 && (
                        <div className="flex justify-between text-green-600 bg-green-50 rounded-lg p-2.5">
                          <div className="flex items-center gap-1.5"><SparklesIcon className="w-4 h-4" /><span className="text-sm font-medium">Welcome Discount</span></div>
                          <span className="font-medium">-₵{signupAmt.toFixed(2)}</span>
                        </div>
                      )}
                      {appliedPromotion && promoAmt > 0 && (
                        <div className="flex justify-between text-purple-600 bg-purple-50 rounded-lg p-2.5">
                          <div className="flex items-center gap-1.5"><TicketIcon className="w-4 h-4" /><span className="text-sm font-medium">Promotion</span></div>
                          <span className="font-medium">-₵{promoAmt.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between pt-4 border-t border-gray-200">
                        <span className="font-bold text-gray-900">Total</span>
                        <div className="text-right">
                          {(canUseSignup || canUseReferral || appliedPromotion || canUseRedeemedPoints) && parseFloat(total) > 0 && (
                            <div className="text-sm text-gray-500 line-through mb-1">₵{subtotal.toFixed(2)}</div>
                          )}
                          <div className="text-xl font-bold text-gray-900">₵{total}</div>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        if (isAnyUploading) { toast.warning('Please wait for image uploads to complete'); return; }
                        const allHavePhotos = cart.every((i) => hasImage(i.id) || imagePreviews[i.id]);
                        if (allHavePhotos) {
                          navigate('/checkout');
                        } else {
                          const n = cart.filter((i) => !hasImage(i.id) && !imagePreviews[i.id]).length;
                          toast.warning(`Please add photos for ${n} item${n !== 1 ? 's' : ''} before checkout`);
                        }
                      }}
                      disabled={isAnyUploading}
                      className="w-full bg-primary text-white font-bold py-3.5 rounded-lg transition-all duration-200 shadow hover:shadow-lg mt-5 text-base active:scale-95 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                    >
                      {isAnyUploading
                        ? <span className="flex items-center justify-center gap-2"><FaSpinner className="animate-spin w-5 h-5" />Uploading Images...</span>
                        : 'Proceed to Checkout'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Empty Cart State
            <div className="text-center py-14 bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="flex flex-col items-center justify-center">
                <div className="w-20 h-20 bg-gray-100 rounded-full mx-auto mb-5 flex items-center justify-center">
                  <ShoppingBagIcon className="w-10 h-10 text-gray-400" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">Your cart is empty</h2>
                <p className="text-gray-600 mb-7">Add some sneaker cleaning services to get started</p>
                <button onClick={() => navigate('/services')} className="px-8 py-3.5 bg-primary text-white rounded-lg hover:opacity-90 transition-all text-base cursor-pointer">
                  Browse Services
                </button>
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