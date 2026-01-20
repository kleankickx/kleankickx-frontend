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
  SparklesIcon
} from '@heroicons/react/24/outline';
import { FaSpinner } from 'react-icons/fa6';
import axios from 'axios';
import Tooltip from '../components/Tooltip';

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
  const fileInputRefs = useRef({});
  const navigate = useNavigate();
  const baseURL = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:10000';

  const [signupDiscountUsed, setSignupDiscountUsed] = useState(false);
  const [referralDiscountUsed, setReferralDiscountUsed] = useState(false);
  const [availablePromotions, setAvailablePromotions] = useState([]);
  const [appliedPromotion, setAppliedPromotion] = useState(null);

  // Helper function to convert base64 to blob URL
  const base64ToBlobUrl = (base64String) => {
    if (!base64String) return null;
    
    try {
      // Remove data URL prefix if present
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

  // Process and optimize image
  const processImage = (file) => {
    return new Promise((resolve, reject) => {
      // Skip processing for small files (under 1MB)
      if (file.size < 1024 * 1024) {
        resolve(file);
        return;
      }

      const img = new Image();
      const reader = new FileReader();
      
      reader.onload = (e) => {
        img.src = e.target.result;
        
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Calculate new dimensions (max 1200px)
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
          
          // Draw and process image
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convert canvas to blob
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
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    if (!validTypes.includes(file.type)) {
      return { valid: false, message: 'Please upload a valid image (JPEG, PNG, or WebP)' };
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

    // Cleanup function to revoke blob URLs
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

  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchServices(),
          fetchUserSignupDiscountStatus(),
          fetchUserReferralDiscountStatus(),
          fetchAvailablePromotions()
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

  // Get package info
  const getPackageInfo = (service) => {
    if (!service) return null;
    
    // Extract number from PACKAGE_X format
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

  // Calculate savings for package
  const calculatePackageSavings = (service) => {
    if (!isPackageService(service)) return null;
    
    // Find the standard clean individual service
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

  const canUseSignup = user && !signupDiscountUsed?.signup_discount_used && signupDiscount;
  const canUseReferral = user && referralDiscountUsed?.first_order_completed === false && referralDiscount;

  const signupDiscountAmount = canUseSignup
    ? ((parseFloat(subtotal) * parseFloat(signupDiscount.percentage)) / 100)
    : 0;

  const referralDiscountAmount = canUseReferral
    ? ((parseFloat(subtotal) * parseFloat(referralDiscount.percentage)) / 100)
    : 0;

  const promoDiscountAmount = appliedPromotion
    ? (parseFloat(subtotal) * parseFloat(appliedPromotion.discount_percentage)) / 100
    : 0;

  const total = (parseFloat(subtotal) - (promoDiscountAmount + signupDiscountAmount + referralDiscountAmount)).toFixed(2);

  const handleRemove = (id) => {
    const service = getService(id);
    const isPackage = isPackageService(service);
    
    if (isPackage) {
      const packageInfo = getPackageInfo(service);
      toast.info(`Removed ${packageInfo?.sneakers || 'multi'}-sneaker bundle from cart.`);
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
    
    // Check if all items have images (optional)
    const itemsWithoutImages = cart.filter(item => !hasImage(item.service_id));
    
    if (itemsWithoutImages.length > 0) {
      toast.warning('Please add photos for your items before checkout');
      return;
    }
    
    navigate('/checkout');
  };

  const handleImageUpload = async (serviceId, file) => {
    // Validate the image file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      toast.error(validation.message);
      return;
    }
    
    setUploadingImages(prev => ({ ...prev, [serviceId]: true }));
    
    try {
      // Process and optimize the image
      const processedFile = await processImage(file);
      
      // Convert to base64 for storage
      const base64String = await fileToBase64(processedFile);
      
      // Create blob URL for preview
      const blobUrl = URL.createObjectURL(processedFile);
      
      // Store in cart context
      addImageToCartItem(serviceId, processedFile, blobUrl, base64String);
      
      // Store blob URL in component state for preview
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
    // Use existing ref or create new input
    let input = fileInputRefs.current[serviceId];
    if (!input) {
      input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.style.display = 'none';
      document.body.appendChild(input);
      fileInputRefs.current[serviceId] = input;
      
      // Clean up event listener
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
          handleImageUpload(serviceId, file);
        }
        // Reset input for next use
        input.value = '';
      };
    }
    
    input.click();
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
                  const packageInfo = isPackage ? getPackageInfo(service) : null;
                  const packageSavings = isPackage ? calculatePackageSavings(service) : null;
                  
                  return (
                    <div key={item.service_id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                      {/* Bundle Header */}
                      {isPackage && packageInfo && (
                        <div className={`${packageInfo.color} ${packageInfo.borderColor} border-b px-6 py-3`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <ShoppingBagIcon className={`w-5 h-5 ${packageInfo.iconColor}`} />
                              <span className={`font-bold ${packageInfo.textColor}`}>
                                {packageInfo.tagText}
                              </span>
                            </div>
                            {packageSavings && (
                              <div className="flex items-center gap-2">
                                <SparklesIcon className="w-4 h-4 text-amber-500" />
                                <span className="text-sm font-medium text-amber-700">
                                  Save ₵{packageSavings.savings}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      <div className="p-6">
                        <div className="flex flex-col sm:flex-row gap-6">
                          {/* Service Image with Bundle Badge */}
                          <div className="flex-shrink-0">
                            <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-gray-100">
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
                              {isPackage && (
                                <div className="absolute -bottom-2 -left-2 bg-white border border-gray-300 rounded-full p-1.5 shadow-lg">
                                  <div className={`w-6 h-6 rounded-full ${packageInfo.badgeColor} border flex items-center justify-center`}>
                                    <span className={`text-xs font-bold ${packageInfo.textColor}`}>
                                      {packageInfo?.sneakers || 1}
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
                                    <h3 className="font-semibold text-gray-900 text-lg">
                                      {item.service_name || service?.name}
                                    </h3>
                                    {isPackage && (
                                      <div className="mt-1 flex items-center gap-2">
                                        <span className="text-sm text-gray-600">
                                          Bundle of {packageInfo?.sneakers || 3} sneakers
                                        </span>
                                        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                                          Bundle deal
                                        </span>
                                      </div>
                                    )}
                                    <p className="text-primary font-bold text-xl mt-1">
                                      ₵{parseFloat(item.unit_price || service?.price || 0).toFixed(2)}
                                      {isPackage && (
                                        <span className="text-sm text-gray-600 ml-2">
                                          (₵{(parseFloat(item.unit_price || service?.price || 0) / (packageInfo?.sneakers || 1)).toFixed(2)} per sneaker)
                                        </span>
                                      )}
                                    </p>
                                    
                                    {/* Bundle Savings */}
                                    {isPackage && packageSavings && (
                                      <div className="mt-2 bg-green-50 border border-green-200 rounded-lg p-3">
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center gap-2">
                                            <SparklesIcon className="w-4 h-4 text-green-600" />
                                            <span className="text-sm font-medium text-green-800">Bundle Savings</span>
                                          </div>
                                          <div className="text-right">
                                            <div className="text-sm text-gray-500 line-through">₵{packageSavings.regularPrice}</div>
                                            <div className="text-sm font-bold text-green-700">Save ₵{packageSavings.savings} ({packageSavings.savingsPercentage}%)</div>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                  
                                  {/* Desktop Quantity Controls - No restrictions for bundles */}
                                  <div className="hidden sm:flex items-center gap-4">
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
                                    
                                    <Tooltip message="Remove item">
                                      <button 
                                        onClick={() => handleRemove(item.service_id)}
                                        className="p-2 rounded-lg transition-colors text-gray-400 hover:text-red-500 hover:bg-red-50 cursor-pointer"
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
                                      <h4 className="font-medium text-gray-900 mb-1">
                                        Shoe Photo
                                      </h4>
                                      <p className="text-sm text-gray-600">
                                        Add a photo for better service
                                      </p>
                                    </div>
                                    
                                    <div className="flex items-center gap-3">
                                      {itemHasImage ? (
                                        <>
                                          <div className="relative">
                                            <div 
                                              className="w-16 h-16 rounded-lg overflow-hidden border-2 border-green-200 cursor-pointer hover:border-green-300 transition-colors"
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
                                        <button
                                          onClick={() => openGallery(item.service_id)}
                                          disabled={uploadingImages[item.service_id]}
                                          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium cursor-pointer disabled:opacity-50 transition-colors"
                                        >
                                          {uploadingImages[item.service_id] ? (
                                            <>
                                              <FaSpinner className="animate-spin h-4 w-4" />
                                              Uploading...
                                            </>
                                          ) : (
                                            <>
                                              <FolderIcon className="w-5 h-5" />
                                              Add Photo from Gallery
                                            </>
                                          )}
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Mobile Footer - No restrictions */}
                        <div className="mt-6 pt-6 border-t border-gray-100 sm:hidden">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
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
                              
                              <button 
                                onClick={() => handleRemove(item.service_id)}
                                className="p-2 rounded-lg transition-colors text-gray-400 hover:text-red-500 hover:bg-red-50"
                              >
                                <TrashIcon className="w-5 h-5" />
                              </button>
                            </div>
                            
                            <div className="text-right">
                              <p className="text-sm text-gray-600">Item Total</p>
                              <p className="text-lg font-bold text-gray-900">
                                ₵{((service?.price || item.unit_price || 0) * item.quantity).toFixed(2)}
                              </p>
                              {isPackage && (
                                <p className="text-xs text-gray-500">
                                  ({packageInfo?.sneakers} sneakers per bundle)
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Info Card */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <PhotoIcon className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-blue-900 mb-2">Why add shoe photos?</h4>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>• Ensures accurate cleaning service</li>
                        <li>• Helps identify your specific shoes</li>
                        <li>• Documents any pre-existing conditions</li>
                        <li>• Improves service quality</li>
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
                  <div className="space-y-3 mb-6">
                    {cart.map((item) => {
                      const service = getService(item.service_id);
                      const itemHasImage = hasImage(item.service_id);
                      const isPackage = isPackageService(service);
                      
                      return (
                        <div key={item.service_id} className="flex justify-between items-center">
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
                          </div>
                          <span className="font-medium">
                            ₵{((service?.price || item.unit_price || 0) * item.quantity).toFixed(2)}
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

                    {/* Total */}
                    <div className="border-t border-gray-200 pt-4">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-gray-900 text-lg">Total</span>
                        <div className="text-right">
                          {(canUseSignup || canUseReferral || appliedPromotion) && (
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
                      className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3.5 rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
                  className="px-8 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors cursor-pointer"
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