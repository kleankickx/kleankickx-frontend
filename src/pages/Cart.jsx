import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { 
  TrashIcon, 
  MinusIcon, 
  PlusIcon, 
  ArrowPathIcon,
  PhotoIcon,
  XMarkIcon,
  FolderIcon,
  ShoppingBagIcon,
  SparklesIcon,
  CameraIcon,
  CheckCircleIcon,
  GiftIcon
} from '@heroicons/react/24/outline';
import { FaSpinner } from 'react-icons/fa6';
import { FaInfoCircle, FaCamera } from "react-icons/fa";
import axios from 'axios';
import Tooltip from '../components/Tooltip';
import * as heic2any from 'heic2any'; // For HEIC support

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
  const [error, setError] = useState(null);
  const [uploadingImages, setUploadingImages] = useState({});
  const [previewImage, setPreviewImage] = useState(null);
  const [imagePreviews, setImagePreviews] = useState({});
  const [cameraMode, setCameraMode] = useState(null); // Track which service is in camera mode
  const [showCameraModal, setShowCameraModal] = useState(false);
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
  const [freeServiceUsed, setFreeServiceUsed] = useState(false);

  // Helper function to convert base64 to blob URL
  const base64ToBlobUrl = (base64String) => {
    if (!base64String) return null;
    
    try {
      const base64Data = base64String.includes('base64,') 
        ? base64String.split(',')[1] 
        : base64String;
      
      const byteCharacters = atob(base64Data);
      const byteArrays = [];
      
      for (let offset = 0; offset < byteCharacters.length; offset += 512) {
        const slice = byteCharacters.slice(offset, offset + 512);
        const byteNumbers = new Array(slice.length);
        
        for (let i = 0; i < slice.length; i++) {
          byteNumbers[i] = slice.charCodeAt(i);
        }
        
        const byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
      }
      
      const blob = new Blob(byteArrays, { type: 'image/jpeg' });
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error('Failed to convert base64 to blob URL:', error);
      return null;
    }
  };

  // Helper function to convert File to base64
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  // Convert HEIC to JPEG
  const convertHeicToJpeg = async (heicFile) => {
    try {
      const convertedBlob = await heic2any({
        blob: heicFile,
        toType: 'image/jpeg',
        quality: 0.85
      });
      
      return new File([convertedBlob], 
        heicFile.name.replace(/\.heic$/i, '.jpg') || `converted-${Date.now()}.jpg`, 
        { type: 'image/jpeg', lastModified: Date.now() }
      );
    } catch (error) {
      console.error('HEIC conversion failed:', error);
      throw new Error('Failed to convert HEIC image');
    }
  };

  // Process and optimize image
  const processImage = async (file) => {
    // Check if file is HEIC
    if (file.type === 'image/heic' || file.type === 'image/heif' || file.name.toLowerCase().endsWith('.heic')) {
      file = await convertHeicToJpeg(file);
    }

    // Skip processing for small files (under 1MB)
    if (file.size < 1024 * 1024) {
      return file;
    }

    return new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();
      
      reader.onload = (e) => {
        img.src = e.target.result;
        
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          let width = img.width;
          let height = img.height;
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
            if (!blob) {
              reject(new Error('Failed to process image'));
              return;
            }
            
            const processedFile = new File([blob], file.name || `image-${Date.now()}.jpg`, {
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            
            resolve(processedFile);
          }, 'image/jpeg', 0.85);
        };
        
        img.onerror = () => {
          reject(new Error('Failed to load image'));
        };
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      reader.readAsDataURL(file);
    });
  };

  // Helper function to validate image file
  const validateImageFile = (file) => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    const fileExtension = file.name.toLowerCase();
    const isHeic = file.type === 'image/heic' || file.type === 'image/heif' || fileExtension.endsWith('.heic');
    
    if (!validTypes.includes(file.type) && !isHeic) {
      return { valid: false, message: 'Please upload a valid image (JPEG, PNG, WebP, or HEIC)' };
    }
    
    if (file.size > maxSize) {
      return { valid: false, message: 'Image size should be less than 10MB' };
    }
    
    return { valid: true };
  };

  // Initialize image previews from base64 in cart items
  useEffect(() => {
    const newPreviews = {};
    cart.forEach(item => {
      if (item.service_id && hasImage(item.service_id)) {
        const base64 = getImageBase64(item.service_id);
        if (base64) {
          const blobUrl = base64ToBlobUrl(base64);
          if (blobUrl) {
            newPreviews[item.service_id] = blobUrl;
          }
        }
      }
    });
    setImagePreviews(newPreviews);

    return () => {
      Object.values(newPreviews).forEach(blobUrl => {
        if (blobUrl) {
          URL.revokeObjectURL(blobUrl);
        }
      });
    };
  }, [cart]);

  const fetchServices = async () => {
    try {
      const servicePromises = cart
        .filter(item => item.service_id)
        .map(item => axios.get(`${baseURL}/api/services/${item.service_id}/`));

      const responses = await Promise.all(servicePromises);
      setServices(responses.map(res => res.data));
    } catch (error) {
      console.error('Failed to fetch services:', error);
      setError('Failed to load service details. Please try again.');
      toast.error('Failed to load some service details');
    }
  };

  const fetchUserSignupDiscountStatus = async () => {
    try {
      const { data } = await api.get('/api/discounts/signup/status/');
      setSignupDiscountUsed(data);
    } catch (error) {
      console.error("Error fetching signup discount status:", error);
    }
  };

  const fetchUserReferralDiscountStatus = async () => {
    try {
      const { data } = await api.get('/api/discounts/referral/status/');
      setReferralDiscountUsed(data);
    } catch (error) {
      console.error("Error fetching referral discount status:", error);
    }
  };

  const fetchAvailablePromotions = async () => {
    try {
      const response = await api.get('/api/promotions/today');
      const promotions = response.data;
      setAvailablePromotions(promotions);
      
      if (promotions.length > 0) {
        const validPromotion = promotions.find(promo => 
          new Date(promo.end_date) > new Date() && 
          promo.is_active === true
        );
        
        if (validPromotion) {
          setAppliedPromotion(validPromotion);
          if (cart.length > 0){
            toast.success(`🎉 ${validPromotion.discount_percentage}% promotion applied automatically!`);
          }
        }
      }
    } catch (error) {
      console.log("Error fetching promotions:", error);
    }
  }

  const fetchRedeemedPointsDiscount = async () => {
    try {
      const response = await api.get('/api/referrals/active-discount/');
      if (Object.keys(response.data).length !== 0) {
        setRedeemedPointsDiscount(response.data);
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

  const fetchFreeServiceStatus = async () => {
    try {
      const { data } = await api.get('/api/discounts/free-service/status/');
      setFreeServiceUsed(data.free_signup_service_used);
    } catch (error) {
      console.error("Error fetching free service status:", error);
    }
  }

  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchServices(),
          fetchUserSignupDiscountStatus(),
          fetchUserReferralDiscountStatus(),
          fetchAvailablePromotions(),
          fetchRedeemedPointsDiscount(),
          fetchFreeServiceStatus(),
        ]);
      } catch (err) {
        console.error("Initialization error:", err);
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, []);

  const getService = (id) => services.find((s) => s.id === id) || {};
  
  // Check if service is a package
  const isPackageService = (service) => {
    return service && service.service_type?.startsWith('PACKAGE_');
  };

  // Check if service is free
  const isFreeService = (service) => {
    return service && service.price === 0;
  };

  // Get package info
  const getPackageInfo = (service) => {
    if (!service) return null;
    
    const match = service.service_type?.match(/PACKAGE_(\d+)/);
    const sneakerCount = match ? parseInt(match[1]) : 1;
    
    const colors = {
      'PACKAGE_3': {
        color: 'bg-blue-50 border-blue-200',
        textColor: 'text-blue-700',
        borderColor: 'border-blue-300',
        iconColor: 'text-blue-600',
        badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
        gradientColor: 'from-blue-500 to-blue-600'
      },
      'PACKAGE_5': {
        color: 'bg-purple-50 border-purple-200',
        textColor: 'text-purple-700',
        borderColor: 'border-purple-300',
        iconColor: 'text-purple-600',
        badgeColor: 'bg-purple-100 text-purple-800 border-purple-300',
        gradientColor: 'from-purple-500 to-purple-600'
      },
      'PACKAGE_10': {
        color: 'bg-green-50 border-green-200',
        textColor: 'text-green-700',
        borderColor: 'border-green-300',
        iconColor: 'text-green-600',
        badgeColor: 'bg-green-100 text-green-800 border-green-300',
        gradientColor: 'from-green-500 to-green-600'
      },
      'PACKAGE_20': {
        color: 'bg-orange-50 border-orange-200',
        textColor: 'text-orange-700',
        borderColor: 'border-orange-300',
        iconColor: 'text-orange-600',
        badgeColor: 'bg-orange-100 text-orange-800 border-orange-300',
        gradientColor: 'from-orange-500 to-orange-600'
      }
    };
    
    const defaultColors = {
      color: 'bg-gray-50 border-gray-200',
      textColor: 'text-gray-700',
      borderColor: 'border-gray-300',
      iconColor: 'text-gray-600',
      badgeColor: 'bg-gray-100 text-gray-800 border-gray-300',
      gradientColor: 'from-gray-500 to-gray-600'
    };
    
    return {
      sneakers: sneakerCount,
      tagText: `${sneakerCount}-SNEAKER BUNDLE`,
      ...(colors[service.service_type] || defaultColors)
    };
  };

  // Get free service info
  const getFreeServiceInfo = (service) => {
    return {
      color: 'bg-gradient-to-r from-green-50 to-emerald-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-800',
      iconColor: 'text-green-600',
      badgeColor: 'bg-gradient-to-r from-green-500 to-emerald-500 text-white',
      tagText: 'FREE CLEANING',
      gradientColor: 'from-green-400 to-emerald-500'
    };
  };

  // Calculate savings for package
  const calculatePackageSavings = (service) => {
    if (!isPackageService(service)) return null;
    
    const standardService = services.find(s => 
      s.name.toLowerCase().includes('standard') && 
      !isPackageService(s)
    );
    
    if (!standardService) return null;
    
    const regularPrice = standardService.price * (service.included_quantity || 1);
    const savings = regularPrice - service.price;
    const savingsPercentage = Math.round((savings / regularPrice) * 100);
    
    return {
      regularPrice: regularPrice.toFixed(2),
      savings: savings.toFixed(2),
      savingsPercentage
    };
  };

  const subtotal = cart
    .reduce((t, item) => {
      const service = getService(item.service_id);
      return t + (service?.price || item.unit_price || 0) * item.quantity;
    }, 0)
    .toFixed(2);

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

  const handleRemove = (id) => {
    const service = getService(id);
    const isPackage = isPackageService(service);
    const isFree = isFreeService(service);
    
    if (isPackage) {
      const packageInfo = getPackageInfo(service);
      toast.info(`Removed ${packageInfo?.sneakers || 'multi'}-sneaker bundle from cart.`);
    } else if (isFree) {
      toast.info('Removed free cleaning service from cart.');
    }
    
    if (imagePreviews[id]) {
      URL.revokeObjectURL(imagePreviews[id]);
      setImagePreviews(prev => {
        const newPreviews = { ...prev };
        delete newPreviews[id];
        return newPreviews;
      });
    }
    removeFromCart(id);
  };

  const handleCheckout = async () => {
    if (!cart.length) return toast.error('Your cart is empty');
    
    const itemsWithoutImages = cart.filter(item => !hasImage(item.service_id));
    
    if (itemsWithoutImages.length > 0) {
      toast.warning('Please add photos for your items before checkout');
      return;
    }
    
    navigate('/checkout');
  };

  const handleImageUpload = async (serviceId, file) => {
    const validation = validateImageFile(file);
    if (!validation.valid) {
      toast.error(validation.message);
      return;
    }
    
    setUploadingImages(prev => ({ ...prev, [serviceId]: true }));
    
    try {
      const processedFile = await processImage(file);
      const base64String = await fileToBase64(processedFile);
      const blobUrl = URL.createObjectURL(processedFile);
      
      addImageToCartItem(serviceId, processedFile, blobUrl, base64String);
      
      setImagePreviews(prev => ({
        ...prev,
        [serviceId]: blobUrl
      }));
      
      toast.success('Photo uploaded successfully!');
      
    } catch (error) {
      console.error('Image upload failed:', error);
      toast.error(error.message || 'Failed to upload image');
    } finally {
      setUploadingImages(prev => ({ ...prev, [serviceId]: false }));
    }
  };

  const handleImageRemove = async (serviceId) => {
    try {
      if (imagePreviews[serviceId]) {
        URL.revokeObjectURL(imagePreviews[serviceId]);
        setImagePreviews(prev => {
          const newPreviews = { ...prev };
          delete newPreviews[serviceId];
          return newPreviews;
        });
      }
      
      removeImageFromCartItem(serviceId);
      toast.info('Photo removed');
    } catch (error) {
      console.error('Failed to remove image:', error);
      toast.error('Failed to remove photo');
    }
  };

  // Open gallery/file picker
  const openGallery = (serviceId) => {
    let input = fileInputRefs.current[serviceId];
    if (!input) {
      input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*,image/heic,image/heif,.heic';
      input.capture = 'environment'; // For mobile, prefer rear camera
      input.style.display = 'none';
      document.body.appendChild(input);
      fileInputRefs.current[serviceId] = input;
      
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
          handleImageUpload(serviceId, file);
        }
        input.value = '';
      };
    }
    
    input.click();
  };

  // Open camera
  const openCamera = (serviceId) => {
    setCameraMode(serviceId);
    setShowCameraModal(true);
    
    // Start camera after modal opens
    setTimeout(() => {
      startCamera();
    }, 100);
  };

  // Start camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use rear camera
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (error) {
      console.error('Camera error:', error);
      toast.error('Could not access camera. Please check permissions.');
      setShowCameraModal(false);
    }
  };

  // Capture photo from camera
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convert canvas to blob
    canvas.toBlob(async (blob) => {
      if (!blob) {
        toast.error('Failed to capture photo');
        return;
      }
      
      // Create file from blob
      const file = new File([blob], `camera-${Date.now()}.jpg`, {
        type: 'image/jpeg',
        lastModified: Date.now()
      });
      
      // Upload the captured photo
      await handleImageUpload(cameraMode, file);
      
      // Stop camera and close modal
      stopCamera();
      setShowCameraModal(false);
      setCameraMode(null);
      
    }, 'image/jpeg', 0.9);
  };

  // Stop camera
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      const tracks = stream.getTracks();
      
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  // Close camera modal
  const closeCameraModal = () => {
    stopCamera();
    setShowCameraModal(false);
    setCameraMode(null);
  };

  const ImagePreviewModal = () => {
    if (!previewImage) return null;
    
    return (
      <div 
        className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 cursor-pointer"
        onClick={() => setPreviewImage(null)}
      >
        <div className="relative w-full max-w-4xl max-h-[90vh]">
          <button 
            onClick={() => setPreviewImage(null)}
            className="absolute -top-12 right-0 text-white hover:text-gray-300 p-2 cursor-pointer"
          >
            <XMarkIcon className="w-8 h-8" />
          </button>
          <img 
            src={previewImage} 
            alt="Preview" 
            className="w-full h-full max-h-[80vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      </div>
    );
  };

  const CameraModal = () => {
    if (!showCameraModal) return null;
    
    return (
      <div className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4">
        <div className="relative w-full max-w-2xl bg-black rounded-2xl overflow-hidden">
          <div className="absolute top-4 right-4 z-10">
            <button
              onClick={closeCameraModal}
              className="bg-black/50 text-white rounded-full p-2 hover:bg-black/70 cursor-pointer"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
          
          <div className="relative aspect-video bg-black">
            <video
              ref={videoRef}
              className="w-full h-full object-contain"
              playsInline
            />
            <canvas
              ref={canvasRef}
              className="hidden"
            />
            
            {/* Camera overlay grid */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-64 h-64 border-2 border-white/30 rounded-lg"></div>
            </div>
            
            {/* Camera controls */}
            <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-6">
              <button
                onClick={capturePhoto}
                className="w-16 h-16 bg-white rounded-full border-4 border-gray-300 hover:scale-105 transition-transform cursor-pointer"
              >
                <div className="w-12 h-12 bg-white rounded-full mx-auto"></div>
              </button>
            </div>
          </div>
          
          <div className="p-6 text-white text-center">
            <p className="text-lg font-medium mb-2">Take a clear photo of your shoes</p>
            <p className="text-gray-300 text-sm">
              Position the shoes within the frame and tap the capture button
            </p>
          </div>
        </div>
      </div>
    );
  };

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen flex-col space-y-4 px-4">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md max-w-md w-full">
          <div className="flex items-center gap-3">
            <svg className="h-6 w-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-700">{error}</p>
          </div>
          <button
            onClick={fetchServices}
            className="mt-3 flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors cursor-pointer"
          >
            <ArrowPathIcon className="w-5 h-5" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <section className="bg-gradient-to-br from-green-50 to-white min-h-screen py-8 px-4 lg:px-24">
      <ImagePreviewModal />
      <CameraModal />
      
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Your Cart</h1>
          <p className="text-gray-600 mt-2">{cart.length} item{cart.length !== 1 ? 's' : ''} in cart</p>
        </div>

        {!loading ? (
          cart.length > 0 ? (
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Cart Items - Left Column */}
              <div className="lg:col-span-2 space-y-6">
                {cart.map((item) => {
                  const service = getService(item.service_id);
                  const itemHasImage = hasImage(item.service_id);
                  const previewUrl = imagePreviews[item.service_id];
                  const isPackage = isPackageService(service);
                  const isFree = isFreeService(service);
                  const packageInfo = isPackage ? getPackageInfo(service) : null;
                  const freeServiceInfo = isFree ? getFreeServiceInfo(service) : null;
                  const packageSavings = isPackage ? calculatePackageSavings(service) : null;
                  
                  return (
                    <div key={item.service_id} className={`
                      rounded-xl shadow-sm border overflow-hidden transition-all duration-300
                      ${isFree ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200' : 
                        isPackage ? `${packageInfo?.color} ${packageInfo?.borderColor}` : 
                        'bg-white border-gray-200'}
                    `}>
                      {/* Service Type Header */}
                      {(isPackage || isFree) && (
                        <div className={`
                          border-b px-6 py-3 flex items-center justify-between
                          ${isFree ? 'bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-300/30' : 
                            isPackage ? `${packageInfo?.color} ${packageInfo?.borderColor}` : ''}
                        `}>
                          <div className="flex items-center gap-2">
                            {isFree ? (
                              <>
                                <GiftIcon className="w-5 h-5 text-green-600" />
                                <span className="font-bold text-green-800">
                                  FREE CLEANING SERVICE
                                </span>
                              </>
                            ) : isPackage ? (
                              <>
                                <ShoppingBagIcon className={`w-5 h-5 ${packageInfo?.iconColor}`} />
                                <span className={`font-bold ${packageInfo?.textColor}`}>
                                  {packageInfo?.tagText}
                                </span>
                              </>
                            ) : null}
                          </div>
                          {isPackage && packageSavings && (
                            <div className="flex items-center gap-2">
                              <SparklesIcon className="w-4 h-4 text-amber-500" />
                              <span className="text-sm font-medium text-amber-700">
                                Save ₵{packageSavings.savings}
                              </span>
                            </div>
                          )}
                          {isFree && (
                            <div className="flex items-center gap-2">
                              <CheckCircleIcon className="w-4 h-4 text-green-600" />
                              <span className="text-sm font-medium text-green-700">
                                100% FREE
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                      
                      <div className="p-6">
                        <div className="flex flex-col sm:flex-row gap-6">
                          {/* Service Image */}
                          <div className="flex-shrink-0">
                            <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-gray-100 border-2 border-white shadow-md">
                              <img 
                                src={service?.image || '/placeholder-shoe.jpg'} 
                                alt={service?.name}
                                className="w-full h-full object-cover"
                              />
                              {itemHasImage && (
                                <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full p-1.5 shadow-lg">
                                  <PhotoIcon className="w-4 h-4" />
                                </div>
                              )}
                              {(isPackage || isFree) && (
                                <div className={`
                                  absolute -bottom-2 -left-2 rounded-full p-1.5 shadow-lg
                                  ${isFree ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 
                                    'bg-white border border-gray-300'}
                                `}>
                                  <div className={`
                                    w-6 h-6 rounded-full border flex items-center justify-center
                                    ${isFree ? 'bg-white' : packageInfo?.badgeColor}
                                  `}>
                                    <span className={`
                                      text-xs font-bold
                                      ${isFree ? 'text-green-700' : packageInfo?.textColor}
                                    `}>
                                      {isFree ? 'FREE' : (packageInfo?.sneakers || 1)}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Item Details */}
                          <div className="flex-1">
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <h3 className={`font-semibold text-lg ${isFree ? 'text-green-900' : 'text-gray-900'}`}>
                                      {item.service_name || service?.name}
                                    </h3>
                                    {isPackage && (
                                      <div className="mt-1 flex items-center gap-2">
                                        <span className="text-sm text-gray-600">
                                          Bundle of {packageInfo?.sneakers || 3} sneakers
                                        </span>
                                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                                          Bundle deal
                                        </span>
                                      </div>
                                    )}
                                    {isFree && (
                                      <div className="mt-1 flex items-center gap-2">
                                        <span className="text-sm text-green-700 font-medium">
                                          First-time free cleaning
                                        </span>
                                        <span className="text-xs bg-gradient-to-r from-green-500 to-emerald-500 text-white px-2 py-0.5 rounded">
                                          Free
                                        </span>
                                      </div>
                                    )}
                                    <p className={`font-bold text-xl mt-1 ${isFree ? 'text-green-700' : 'text-primary'}`}>
                                      {isFree ? (
                                        <>
                                          <span className="text-gray-500 line-through text-lg mr-2">
                                            ₵{parseFloat(service?.original_price || 0).toFixed(2)}
                                          </span>
                                          FREE
                                        </>
                                      ) : (
                                        `₵${parseFloat(item.unit_price || service?.price || 0).toFixed(2)}`
                                      )}
                                    </p>
                                    
                                    {/* Bundle Savings */}
                                    {isPackage && packageSavings && (
                                      <div className="mt-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center gap-2">
                                            <SparklesIcon className="w-4 h-4 text-blue-600" />
                                            <span className="text-sm font-medium text-blue-800">Bundle Savings</span>
                                          </div>
                                          <div className="text-right">
                                            <div className="text-sm text-gray-500 line-through">₵{packageSavings.regularPrice}</div>
                                            <div className="text-sm font-bold text-blue-700">
                                              Save ₵{packageSavings.savings} ({packageSavings.savingsPercentage}%)
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    )}

                                    {/* Free Service Note */}
                                    {isFree && (
                                      <div className="mt-2 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-3">
                                        <div className="flex items-start gap-2">
                                          <GiftIcon className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                                          <div>
                                            <p className="text-sm font-medium text-green-800 mb-1">
                                              Free Cleaning Included
                                            </p>
                                            <p className="text-xs text-green-700">
                                              This service is completely free as part of your welcome offer. 
                                              No payment required at checkout.
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                  
                                  {/* Desktop Quantity Controls */}
                                  <div className="hidden sm:flex items-center gap-4">
                                    {!isFree && (
                                      <div className="flex items-center gap-2 rounded-lg px-3 py-2 bg-gray-100">
                                        <button 
                                          onClick={() => updateQuantity(item.service_id, -1)}
                                          className="w-8 h-8 rounded flex items-center justify-center hover:bg-white cursor-pointer disabled:opacity-40 transition-colors"
                                          disabled={item.quantity <= 1}
                                        >
                                          <MinusIcon className="w-4 h-4" />
                                        </button>
                                        <span className="w-8 text-center font-semibold text-gray-900">
                                          {item.quantity}
                                        </span>
                                        <button 
                                          onClick={() => updateQuantity(item.service_id, 1)}
                                          className="w-8 h-8 rounded flex items-center justify-center hover:bg-white cursor-pointer transition-colors"
                                        >
                                          <PlusIcon className="w-4 h-4" />
                                        </button>
                                      </div>
                                    )}
                                    
                                    <Tooltip message={isFree ? "Remove free service" : "Remove item"}>
                                      <button 
                                        onClick={() => handleRemove(item.service_id)}
                                        className={`p-2 rounded-lg transition-colors hover:bg-red-50 cursor-pointer ${
                                          isFree ? 'text-green-600 hover:text-red-500' : 'text-gray-400 hover:text-red-500'
                                        }`}
                                      >
                                        <TrashIcon className="w-5 h-5" />
                                      </button>
                                    </Tooltip>
                                  </div>
                                </div>

                                {/* Image Upload Section */}
                                <div className="mt-6 pt-6 border-t border-gray-100">
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div>
                                      <h4 className={`font-medium mb-1 ${isFree ? 'text-green-900' : 'text-gray-900'}`}>
                                        Shoe Photo
                                      </h4>
                                      <p className="text-sm text-gray-600">
                                        Add a photo for better service (required)
                                      </p>
                                    </div>
                                    
                                    <div className="flex items-center gap-3">
                                      {itemHasImage ? (
                                        <>
                                          <div className="relative">
                                            <div 
                                              className={`w-16 h-16 rounded-lg overflow-hidden border-2 cursor-pointer hover:border-green-300 transition-colors ${
                                                previewUrl ? 'border-green-200' : 'border-gray-200'
                                              }`}
                                              onClick={() => setPreviewImage(previewUrl)}
                                            >
                                              {previewUrl ? (
                                                <img 
                                                  src={previewUrl} 
                                                  alt="Shoe photo"
                                                  className="w-full h-full object-cover"
                                                />
                                              ) : (
                                                <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                                                  <PhotoIcon className="w-8 h-8 text-gray-400" />
                                                </div>
                                              )}
                                            </div>
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleImageRemove(item.service_id);
                                              }}
                                              className="absolute -top-2 -right-2 bg-white border border-gray-200 text-red-500 rounded-full p-1 shadow hover:shadow-md cursor-pointer transition-all hover:scale-110"
                                            >
                                              <XMarkIcon className="w-3 h-3" />
                                            </button>
                                          </div>
                                          <div>
                                            <p className="text-sm font-medium text-green-700">Uploaded</p>
                                            <button
                                              onClick={() => previewUrl && setPreviewImage(previewUrl)}
                                              className="text-sm text-blue-600 hover:text-blue-800 cursor-pointer disabled:opacity-50"
                                              disabled={!previewUrl}
                                            >
                                              View photo
                                            </button>
                                          </div>
                                        </>
                                      ) : (
                                        <div className="flex flex-col sm:flex-row gap-3">
                                          <button
                                            onClick={() => openCamera(item.service_id)}
                                            disabled={uploadingImages[item.service_id]}
                                            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-medium cursor-pointer disabled:opacity-50 transition-all shadow-md hover:shadow-lg"
                                          >
                                            {uploadingImages[item.service_id] ? (
                                              <>
                                                <FaSpinner className="animate-spin h-4 w-4" />
                                                Uploading...
                                              </>
                                            ) : (
                                              <>
                                                <CameraIcon className="w-5 h-5" />
                                                Take Photo
                                              </>
                                            )}
                                          </button>
                                          <button
                                            onClick={() => openGallery(item.service_id)}
                                            disabled={uploadingImages[item.service_id]}
                                            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-lg font-medium cursor-pointer disabled:opacity-50 transition-all shadow-md hover:shadow-lg"
                                          >
                                            <FolderIcon className="w-5 h-5" />
                                            From Gallery
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  {!itemHasImage && (
                                    <div className="mt-3 text-sm text-gray-600 flex items-center gap-2">
                                      <FaInfoCircle className="w-4 h-4 text-blue-500" />
                                      <span>Supports JPEG, PNG, WebP, HEIC formats (max 10MB)</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Mobile Footer */}
                        <div className="mt-6 pt-6 border-t border-gray-100 sm:hidden">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {!isFree && (
                                <div className="flex items-center gap-2 rounded-lg px-3 py-2 bg-gray-100">
                                  <button 
                                    onClick={() => updateQuantity(item.service_id, -1)}
                                    className="w-8 h-8 rounded flex items-center justify-center hover:bg-white cursor-pointer disabled:opacity-40"
                                    disabled={item.quantity <= 1}
                                  >
                                    <MinusIcon className="w-4 h-4" />
                                  </button>
                                  <span className="w-8 text-center font-semibold text-gray-900">
                                    {item.quantity}
                                  </span>
                                  <button 
                                    onClick={() => updateQuantity(item.service_id, 1)}
                                    className="w-8 h-8 rounded flex items-center justify-center hover:bg-white cursor-pointer"
                                  >
                                    <PlusIcon className="w-4 h-4" />
                                  </button>
                                </div>
                              )}
                              
                              <button 
                                onClick={() => handleRemove(item.service_id)}
                                className={`p-2 rounded-lg transition-colors ${
                                  isFree ? 'text-green-600 hover:text-red-500 hover:bg-red-50' : 
                                         'text-gray-400 hover:text-red-500 hover:bg-red-50'
                                }`}
                              >
                                <TrashIcon className="w-5 h-5" />
                              </button>
                            </div>
                            
                            <div className="text-right">
                              <p className={`text-sm ${isFree ? 'text-green-700' : 'text-gray-600'}`}>
                                {isFree ? 'Free Service' : 'Item Total'}
                              </p>
                              <p className={`text-lg font-bold ${isFree ? 'text-green-800' : 'text-gray-900'}`}>
                                {isFree ? (
                                  <>
                                    <span className="text-gray-500 line-through text-sm mr-2">
                                      ₵{((service?.original_price || 0) * item.quantity).toFixed(2)}
                                    </span>
                                    FREE
                                  </>
                                ) : (
                                  `₵${((service?.price || item.unit_price || 0) * item.quantity).toFixed(2)}`
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Info Card */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-lg">
                      <PhotoIcon className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-blue-900 mb-2">Why add shoe photos?</h4>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>• Ensures accurate cleaning service</li>
                        <li>• Helps identify your specific shoes</li>
                        <li>• Documents any pre-existing conditions</li>
                        <li>• Improves service quality</li>
                        <li>• Required for free cleaning services</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Summary - Right Column */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-32">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Order Summary</h3>
                  
                  {/* Items List */}
                  <div className="space-y-3 mb-6 max-h-60 overflow-y-auto pr-2">
                    {cart.map((item) => {
                      const service = getService(item.service_id);
                      const itemHasImage = hasImage(item.service_id);
                      const isPackage = isPackageService(service);
                      const isFree = isFreeService(service);
                      
                      return (
                        <div key={item.service_id} className="flex justify-between items-center py-2">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-700">
                              {item.service_name || service?.name}
                            </span>
                            <span className="text-gray-500">×{item.quantity}</span>
                            {itemHasImage && (
                              <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                                Photo
                              </span>
                            )}
                            {isPackage && (
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                                Bundle
                              </span>
                            )}
                            {isFree && (
                              <span className="text-xs bg-gradient-to-r from-green-500 to-emerald-500 text-white px-2 py-0.5 rounded">
                                Free
                              </span>
                            )}
                          </div>
                          <span className={`font-medium ${isFree ? 'text-green-700' : ''}`}>
                            {isFree ? 'FREE' : `₵${((service?.price || item.unit_price || 0) * item.quantity).toFixed(2)}`}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="space-y-4">
                    {/* Subtotal */}
                    <div className="flex justify-between text-gray-700">
                      <span>Subtotal</span>
                      <span>₵{subtotal}</span>
                    </div>

                    {/* Discounts */}
                    {canUseSignup && (
                      <div className="bg-green-50 rounded-lg p-3">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-green-800">Welcome Discount</span>
                          <span className="font-medium text-green-800">-₵{signupDiscountAmount.toFixed(2)}</span>
                        </div>
                      </div>
                    )}

                    {canUseReferral && (
                      <div className="bg-blue-50 rounded-lg p-3">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-blue-800">Referral Bonus</span>
                          <span className="font-medium text-blue-800">-₵{referralDiscountAmount.toFixed(2)}</span>
                        </div>
                      </div>
                    )}

                    {appliedPromotion && (
                      <div className="bg-purple-50 rounded-lg p-3">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-purple-800">Promotion</span>
                          <span className="font-medium text-purple-800">-₵{promoDiscountAmount.toFixed(2)}</span>
                        </div>
                      </div>
                    )}

                    {canUseRedeemedPoints && redeemedPointsDiscount && (
                      <div className="mt-4 p-3 bg-amber-50 rounded-lg text-sm text-amber-700 flex items-start">
                        <FaInfoCircle className="w-4 h-4 mt-0.5 mr-2 flex-shrink-0" />
                        <span>Your {redeemedPointsDiscount.percentage}% redeemed points discount has been applied!</span>
                      </div>
                    )}

                    {/* Total */}
                    <div className="border-t border-gray-200 pt-4">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-gray-900 text-lg">Total</span>
                        <div className="text-right">
                          {(canUseSignup || canUseReferral || appliedPromotion || canUseRedeemedPoints) && (
                            <div className="text-sm text-gray-500 line-through mb-1">
                              ₵{subtotal}
                            </div>
                          )}
                          <span className="text-2xl font-bold text-primary">
                            ₵{total}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Checkout Button */}
                    <button
                      onClick={handleCheckout}
                      disabled={services.length === 0 || cart.length === 0}
                      className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3.5 rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                    >
                      Proceed to Checkout
                    </button>

                    {/* Continue Shopping */}
                    <button
                      onClick={() => navigate('/services')}
                      className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-3 rounded-lg transition-colors cursor-pointer"
                    >
                      Continue Shopping
                    </button>

                    {/* Free Service Note */}
                    {cart.some(item => isFreeService(getService(item.service_id))) && (
                      <div className="mt-4 p-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-2">
                          <GiftIcon className="w-5 h-5 text-green-600 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-green-800">Free Cleaning Service</p>
                            <p className="text-xs text-green-700 mt-0.5">
                              Your order includes a free cleaning service. No payment required!
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Empty Cart State
            <div className="text-center py-16">
              <div className="max-w-md mx-auto">
                <div className="w-24 h-24 bg-gray-100 rounded-full mx-auto mb-6 flex items-center justify-center">
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-3">Your cart is empty</h2>
                <p className="text-gray-600 mb-8">Add some services to get started</p>
                <button
                  onClick={() => navigate('/services')}
                  className="px-8 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors cursor-pointer shadow-md hover:shadow-lg"
                >
                  Browse Services
                </button>
              </div>
            </div>
          )
        ) : (
          // Loading State
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <FaSpinner className="animate-spin h-10 w-10 text-primary mx-auto mb-4" />
              <p className="text-gray-600">Loading your cart...</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default Cart;