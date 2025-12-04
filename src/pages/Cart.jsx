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
  CameraIcon,
  XMarkIcon,
  PhotoIcon
} from '@heroicons/react/24/outline';
import { FaSpinner, FaTags } from 'react-icons/fa6';
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

  // Improved mobile camera capture handler
  const processCameraImage = (file) => {
    return new Promise((resolve, reject) => {
      // Create an image element to load and process the camera image
      const img = new Image();
      const reader = new FileReader();
      
      reader.onload = (e) => {
        img.src = e.target.result;
        
        img.onload = () => {
          // Create a canvas to process the image
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Set canvas dimensions (max 800px width for mobile optimization)
          const maxWidth = 800;
          const scaleSize = maxWidth / img.width;
          canvas.width = maxWidth;
          canvas.height = img.height * scaleSize;
          
          // Draw and process image
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          // Convert canvas to blob with proper orientation
          canvas.toBlob((blob) => {
            if (!blob) {
              reject(new Error('Failed to process image'));
              return;
            }
            
            // Create a new File from the processed blob
            const processedFile = new File([blob], file.name || `camera-${Date.now()}.jpg`, {
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            
            resolve(processedFile);
          }, 'image/jpeg', 0.85); // 85% quality for mobile optimization
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
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    if (!validTypes.includes(file.type)) {
      return { valid: false, message: 'Please upload a valid image (JPEG, PNG, or WebP)' };
    }
    
    if (file.size > maxSize) {
      return { valid: false, message: 'Image size should be less than 5MB' };
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
    if (imagePreviews[id]) {
      URL.revokeObjectURL(imagePreviews[id]);
      setImagePreviews(prev => {
        const newPreviews = { ...prev };
        delete newPreviews[id];
        return newPreviews;
      });
    }
    removeFromCart(id);
    toast.info('Item removed');
  };

  const handleCheckout = async () => {
    if (!cart.length) return toast.error('Your cart is empty');
    
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
      let processedFile = file;
      
      // Check if this is likely a camera capture (large size, needs processing)
      if (file.size > 2 * 1024 * 1024) { // If larger than 2MB
        toast.info('Optimizing image for upload...');
        processedFile = await processCameraImage(file);
      }
      
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

  // Mobile-friendly file input handler
  const handleFileInputClick = (serviceId) => {
    // For mobile, we need to create a new input each time to reset it
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment'; // Use camera on mobile
    
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        handleImageUpload(serviceId, file);
      }
    };
    
    // Trigger click on the new input
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
                  
                  return (
                    <div key={item.service_id} className="bg-white rounded-xl shadow-sm border border-gray-200">
                      <div className="p-6">
                        <div className="flex flex-col sm:flex-row gap-6">
                          {/* Service Image */}
                          <div className="flex-shrink-0">
                            <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-gray-100">
                              <img 
                                src={service.image || '/placeholder-shoe.jpg'} 
                                alt={service.name}
                                className="w-full h-full object-cover"
                              />
                              {itemHasImage && (
                                <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full p-1.5 shadow-lg">
                                  <PhotoIcon className="w-4 h-4" />
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
                                      {item.service_name || service.name}
                                    </h3>
                                    <p className="text-primary font-bold text-xl mt-1">
                                      ₵{parseFloat(item.unit_price || service.price || 0).toFixed(2)}
                                    </p>
                                  </div>
                                  
                                  {/* Desktop Quantity Controls */}
                                  <div className="hidden sm:flex items-center gap-4">
                                    <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2">
                                      <button 
                                        onClick={() => updateQuantity(item.service_id, -1)}
                                        className="w-8 h-8 rounded flex items-center justify-center hover:bg-white disabled:opacity-40 cursor-pointer transition-colors"
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
                                        className="text-gray-400 hover:text-red-500 p-2 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                      >
                                        <TrashIcon className="w-5 h-5" />
                                      </button>
                                    </Tooltip>
                                  </div>
                                </div>

                                {/* Image Upload Section */}
                                <div className="mt-6 pt-6 border-t border-gray-100">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <h4 className="font-medium text-gray-900 mb-1">Shoe Photo</h4>
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
                                          onClick={() => handleFileInputClick(item.service_id)}
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
                                              <CameraIcon className="w-5 h-5" />
                                              Add Photo
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

                        {/* Mobile Footer */}
                        <div className="mt-6 pt-6 border-t border-gray-100 sm:hidden">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2">
                                <button 
                                  onClick={() => updateQuantity(item.service_id, -1)}
                                  className="w-8 h-8 rounded flex items-center justify-center hover:bg-white disabled:opacity-40 cursor-pointer"
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
                                className="text-gray-400 hover:text-red-500 p-2 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <TrashIcon className="w-5 h-5" />
                              </button>
                            </div>
                            
                            <div className="text-right">
                              <p className="text-sm text-gray-600">Item Total</p>
                              <p className="text-lg font-bold text-gray-900">
                                ₵{((service?.price || item.unit_price || 0) * item.quantity).toFixed(2)}
                              </p>
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
                      
                      return (
                        <div key={item.service_id} className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-700">
                              {item.service_name || service.name}
                            </span>
                            <span className="text-gray-500">×{item.quantity}</span>
                            {itemHasImage && (
                              <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                                Photo
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