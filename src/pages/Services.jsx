// src/components/Services.jsx
import React, { useState, useEffect, useContext, useRef } from 'react';
import axios from 'axios';
import { CartContext } from '../context/CartContext';
import { toast } from 'react-toastify';
import { useNavigate, useLocation } from 'react-router-dom';
import bgImage from '../assets/kleankickx_care.png';
import { motion } from 'framer-motion';
import Footer from '../components/Footer';
import { FaSpinner, FaChevronDown, FaChevronUp } from 'react-icons/fa6';
import { FaCheckCircle, FaExclamationTriangle, FaGift, FaTimes } from 'react-icons/fa';
import { AuthContext } from '../context/AuthContext';

const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } },
};

const Services = () => {
  const [services, setServices] = useState([]);
  const [sortedServices, setSortedServices] = useState([]);
  const [error, setError] = useState('');
  const [expandedDescriptions, setExpandedDescriptions] = useState({});
  const [redeemingFreeService, setRedeemingFreeService] = useState(false);
  const [highlightedService, setHighlightedService] = useState(null);
  const [showAlreadyClaimedModal, setShowAlreadyClaimedModal] = useState(false);
  const { cart, addToCart } = useContext(CartContext);
  const [loading, setLoading] = useState(true);
  const { user, isAuthenticated, refreshUserData } = useContext(AuthContext);
  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:10000';
  const navigate = useNavigate();
  const location = useLocation();
  
  // Refs for service cards
  const servicesSectionRef = useRef(null);
  const serviceCardRefs = useRef({});

  // Check if there's a service ID to highlight from location state
  useEffect(() => {
    if (location.state?.highlightServiceId) {
      const serviceId = location.state.highlightServiceId;
      setHighlightedService(serviceId);
      
      // Scroll to the services section
      setTimeout(() => {
        if (servicesSectionRef.current) {
          servicesSectionRef.current.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
          });
        }
        
        // Highlight animation
        setTimeout(() => {
          const cardElement = serviceCardRefs.current[serviceId];
          if (cardElement) {
            cardElement.scrollIntoView({
              behavior: 'smooth',
              block: 'center',
              inline: 'center'
            });
          }
        }, 500);
      }, 300);
      
      // Show success message if available
      if (location.state?.showSuccessMessage) {
        toast.success(location.state.showSuccessMessage, {
          position: 'top-right',
          autoClose: 5000,
        });
      }
      
      // Remove highlight after animation
      setTimeout(() => {
        setHighlightedService(null);
        // Clear the location state
        navigate(location.pathname, { replace: true, state: {} });
      }, 5000);
    }
  }, [location.state, navigate, location.pathname]);

  // Check if user has already claimed free service when they return from login
  useEffect(() => {
    const checkFreeServiceStatus = () => {
      if (isAuthenticated && user && user.free_signup_service_used && location.state?.highlightServiceId) {
        // User just returned from login and has already claimed their free service
        // Show modal after a short delay
        setTimeout(() => {
          setShowAlreadyClaimedModal(true);
        }, 1000);
      }
    };
    
    checkFreeServiceStatus();
  }, [isAuthenticated, user, location.state]);

  // Replace the useEffect that fetches services with this:
  useEffect(() => {
    const controller = new AbortController();
    let mounted = true;

    const fetchServices = async () => {
      if (!mounted) return;
      
      setLoading(true);
      try {
        // Get the token from localStorage
        const token = localStorage.getItem('access_token');
        
        // Determine which endpoint to use based on authentication
        let endpoint = `${backendUrl}/api/services/public/`;
        let headers = {};
        
        if (isAuthenticated && token) {
          // User is authenticated, use authenticated endpoint
          endpoint = `${backendUrl}/api/services/authenticated/`;
          headers = {
            'Authorization': `Bearer ${token}`
          };
        }
        
        console.log(`Fetching from: ${endpoint}`);
        console.log(`User authenticated: ${isAuthenticated}`);
        
        const response = await axios.get(endpoint, { 
          headers,
          signal: controller.signal 
        });
        const servicesData = response.data;
        
        // DEBUG: Log the services to see what we're getting
        console.log('Services received:', servicesData);
        
        // Find the standard clean price for savings calculation
        const standardService = servicesData.find(service => 
          service.name.toLowerCase().includes('standard') && 
          !service.service_type?.startsWith('PACKAGE_') &&
          !service.is_free_signup_service
        );
        
        console.log('Standard service found:', standardService);
        
        // Calculate savings for bundle services
        const servicesWithSavings = servicesData.map(service => {
          if (service.service_type?.startsWith('PACKAGE_') && standardService) {
            const sneakerCount = service.included_quantity || 1;
            const individualTotal = standardService.price * sneakerCount;
            const savingsAmount = individualTotal - service.price;
            
            if (savingsAmount > 0) {
              return {
                ...service,
                savingsAmount: savingsAmount.toFixed(2),
                perSneakerPrice: (service.price / sneakerCount).toFixed(2)
              };
            }
          }
          return service;
        });
        
        console.log('Services with savings:', servicesWithSavings);
        
        // Sort services: free services first (price 0), then others by price from lowest to highest
        const sorted = [...servicesWithSavings].sort((a, b) => {
          // Free services (price 0) come first
          if (a.is_free_signup_service && !b.is_free_signup_service) return -1;
          if (!a.is_free_signup_service && b.is_free_signup_service) return 1;
          
          // Then sort by price from lowest to highest
          return a.price - b.price;
        });
        
        console.log('Sorted services:', sorted);
        
        if (mounted) {
          setServices(servicesWithSavings);
          setSortedServices(sorted);
        }
        
        // Only refresh user data if we're authenticated AND user doesn't have free service info
        // But check if we already have the data from token first
        if (mounted && isAuthenticated && !user?.free_signup_service_used) {
          console.log('Refreshing user data to get free service info...');
          try {
            await refreshUserData();
          } catch (err) {
            console.error('Failed to refresh user data:', err);
          }
        }
        
      } catch (err) {
        if (axios.isCancel(err)) {
          console.log('Request canceled:', err.message);
          return;
        }
        
        console.error('Error fetching services:', err);
        
        // Check if it's an authentication error
        if (err.response?.status === 401) {
          console.log('Authentication failed, falling back to public endpoint');
          
          // Try public endpoint as fallback
          try {
            const publicResponse = await axios.get(`${backendUrl}/api/services/public/`, {
              signal: controller.signal
            });
            
            if (mounted) {
              const publicServices = publicResponse.data;
              
              // Sort the public services by price from lowest to highest
              const sortedPublicServices = [...publicServices].sort((a, b) => {
                // Free services (price 0) come first
                if (a.is_free_signup_service && !b.is_free_signup_service) return -1;
                if (!a.is_free_signup_service && b.is_free_signup_service) return 1;
                
                // Then sort by price from lowest to highest
                return a.price - b.price;
              });
              
              setServices(publicServices);
              setSortedServices(sortedPublicServices);
            }
          } catch (fallbackErr) {
            if (mounted && !axios.isCancel(fallbackErr)) {
              setError('Failed to load services.');
              toast.error('Failed to load services. Please try again.');
            }
          }
        } else if (mounted && !axios.isCancel(err)) {
          setError('Failed to load services.');
          toast.error('Failed to load services. Please try again.');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };
    
    fetchServices();
    
    // Cleanup function
    return () => {
      mounted = false;
      controller.abort();
    };
  }, [isAuthenticated]); // Only depend on isAuthenticated, not user or refreshUserData

  const getServiceStatus = (serviceName) => {
    const name = serviceName.toLowerCase();
    const isPriority = name.includes('priority') || name.includes('express') || name.includes('rush');
    
    return {
      isPriority,
      bannerText: isPriority ? 'NEXT DAY' : '72 HOURS',
      badgeText: isPriority ? 'delivered next day' : 'delivered in 72h'
    };
  };

  // Check if service is a bundle package
  const isBundleService = (service) => {
    return service?.service_type?.startsWith('PACKAGE_');
  };

  // Check if user is eligible for free service
  const isEligibleForFreeService = () => {
    return isAuthenticated && user && !user.free_signup_service_used;
  };

  // Get user's free service status
  const getUserFreeServiceStatus = () => {
    if (!isAuthenticated || !user) {
      return { 
        isAuthenticated: false, 
        hasUsed: false, 
        serviceName: null 
      };
    }
    return {
      isAuthenticated: true,
      hasUsed: !!user.free_signup_service_used,
      serviceName: user.free_signup_service_used?.name || null
    };
  };

  // Handle free service button click for unauthenticated users
  const handleFreeServiceClick = (service) => {
    if (!isAuthenticated) {
      // Navigate to login with return URL and service info
      navigate('/auth/login', { 
        state: { 
          from: '/services',
          message: `Sign in to claim your FREE ${service.name}!`,
          highlightServiceId: service.id
        } 
      });
      return;
    }
    
    // If authenticated, proceed with adding to cart
    handleAddToCart(service);
  };

  // Handle adding to cart with free service logic
  const handleAddToCart = async (service) => {
    const { id, name, price, is_free_signup_service, service_type, included_quantity } = service;
    
    // Check if this is a free service
    if (is_free_signup_service) {
      if (!isAuthenticated) {
        // This should not happen as we handle it in handleFreeServiceClick,
        // but keep as fallback
        toast.info('Please sign in to claim your free service!');
        navigate('/auth/login', { 
          state: { 
            from: '/services',
            message: `Sign in to claim your FREE ${name}!`,
            highlightServiceId: id 
          } 
        });
        return;
      }
      
      // Check if user has already used free service
      if (user?.free_signup_service_used) {
        // Show the already claimed modal
        setShowAlreadyClaimedModal(true);
        return;
      }
      
      // Check if user is eligible
      if (!isEligibleForFreeService()) {
        toast.error('You are not eligible for a free service.');
        return;
      }
      
      // Add free service to cart with service data
      addToCart(id, name, price, 1, {
        is_free_signup_service: true,
        service_type: service_type,
        included_quantity: included_quantity,
        original_price: service.original_price // If available
      });
      toast.success(`Free ${name} added to cart! You can checkout to claim it.`);
      navigate('/cart');
      return;
    }
    
    // Regular service handling
    const isInCart = cart.some(item => item.service_id === id);
    
    if (isInCart) {
      toast.info(`${name} is already in your cart!`);
    } else {
      // Add service with all data
      addToCart(id, name, price, 1, {
        is_free_signup_service: false,
        service_type: service_type,
        included_quantity: included_quantity
      });
      toast.success(`${name} added to cart!`);
    }
    navigate('/cart');
  };

  const toggleDescription = (serviceId) => {
    setExpandedDescriptions(prev => ({
      ...prev,
      [serviceId]: !prev[serviceId]
    }));
  };

  // Function to scroll to services section
  const scrollToServices = () => {
    if (servicesSectionRef.current) {
      servicesSectionRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  // Close the already claimed modal
  const closeAlreadyClaimedModal = () => {
    setShowAlreadyClaimedModal(false);
    // Clear the location state
    navigate(location.pathname, { replace: true, state: {} });
  };

  // Render Already Claimed Modal
  const renderAlreadyClaimedModal = () => {
    const freeServiceStatus = getUserFreeServiceStatus();
    
    if (!showAlreadyClaimedModal) return null;
    
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden"
        >
          {/* Modal Header */}
          <div className="bg-gradient-to-r from-primary to-green-500 p-4 relative">
            <button
              onClick={closeAlreadyClaimedModal}
              className="absolute top-3 right-3 text-white/80 hover:text-white transition-colors"
            >
              <FaTimes className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-full">
                <FaExclamationTriangle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Oops! Already Claimed 🎁</h3>
                <p className="text-white/90 text-sm mt-1">Welcome back!</p>
              </div>
            </div>
          </div>
          
          {/* Modal Body */}
          <div className="p-6">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-100 to-red-100 rounded-full mb-4">
                <FaGift className="w-8 h-8 text-green-500" />
              </div>
              
              <h4 className="text-lg font-semibold text-gray-800 mb-2">
                Your Free Service Has Been Claimed
              </h4>
              
              <p className="text-gray-600 mb-4">
                It looks like you've already used your welcome gift:
              </p>
              
              <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-center gap-2">
                  <FaCheckCircle className="text-green-500 w-5 h-5" />
                  <span className="font-bold text-primary">
                    {freeServiceStatus.serviceName || 'Free Service'}
                  </span>
                </div>
              </div>
              
              <p className="text-gray-600 mb-6">
                Don't worry! You can still enjoy our premium cleaning services at great prices.
                Check out our other amazing services below!
              </p>
            </div>
            
            <div className="flex flex-col gap-3">
              <button
                onClick={closeAlreadyClaimedModal}
                className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-white font-semibold py-3 rounded-lg transition-all duration-200"
              >
                Browse Other Services
              </button>
              
              <button
                onClick={() => {
                  closeAlreadyClaimedModal();
                  navigate('/cart');
                }}
                className="w-full bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-800 font-medium py-3 rounded-lg transition-all duration-200 border border-gray-300"
              >
                View My Cart
              </button>
            </div>
          </div>
          
        </motion.div>
      </div>
    );
  };

  // Render free service banner
  const renderFreeServiceBanner = () => {
    const freeServiceStatus = getUserFreeServiceStatus();
    
    if (isAuthenticated) {
      if (freeServiceStatus.hasUsed) {
        return (
          <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg shadow-sm">
            <div className="flex items-center gap-3">
              <div className="bg-green-500 text-white p-2 rounded-full">
                <FaCheckCircle className="text-xl" />
              </div>
              <div>
                <p className="text-green-800 font-medium">
                  You've already claimed your free service: <span className="font-bold">{freeServiceStatus.serviceName}</span>
                </p>
                <p className="text-green-600 text-sm mt-1">
                  Thank you for being a valued customer! Check out our other services below.
                </p>
              </div>
            </div>
          </div>
        );
      } else {
        const freeService = services.find(s => s.is_free_signup_service);
        if (freeService) {
          return (
            <div className="mb-6 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white p-2 rounded-full">
                    <FaGift className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-yellow-800 font-bold text-lg">Welcome Gift! 🎁</h3>
                    <p className="text-yellow-700">
                      You're eligible for a <span className="font-bold">FREE {freeService.name}</span> as a new user!
                    </p>
                  </div>
                </div>
                <button
                  onClick={scrollToServices}
                  className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold py-2 px-6 rounded-lg transition-all duration-200 whitespace-nowrap shadow-md"
                >
                  Claim Your Free Service
                </button>
              </div>
            </div>
          );
        }
      }
    }
    
    // For non-authenticated users
    const freeService = services.find(s => s.is_free_signup_service);
    if (freeService) {
      return (
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white p-2 rounded-full">
              <FaGift className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-blue-800 font-bold text-lg">New User Bonus! 🎉</h3>
              <p className="text-blue-700">
                Sign up today and get a <span className="font-bold">FREE {freeService.name}</span> as a welcome gift!
              </p>
            </div>
          </div>
        </div>
      );
    }
    
    return null;
  };

  // Render service card
  const renderServiceCard = (service) => {
    const status = getServiceStatus(service.name);
    const isExpanded = expandedDescriptions[service.id];
    const isBundle = isBundleService(service);
    const isFreeService = service.is_free_signup_service;
    const isHighlighted = highlightedService === service.id;
    
    // Check if user can claim free service
    const canClaimFreeService = isFreeService && isAuthenticated && user && !user.free_signup_service_used;
    
    // Check if user has already claimed free service
    const showAlreadyClaimed = isFreeService && isAuthenticated && user && user.free_signup_service_used;
    
    return (
      <motion.div
        ref={el => serviceCardRefs.current[service.id] = el}
        key={service.id}
        className={`bg-white rounded-xl shadow-sm overflow-hidden border hover:shadow-md transition-all duration-300 relative group flex flex-col ${
          isHighlighted ? 'ring-4 ring-yellow-400 ring-offset-2 transform scale-105 transition-all duration-500 z-10' : ''
        } ${
          isFreeService
            ? canClaimFreeService
              ? 'border-yellow-300 hover:border-yellow-400 border-2'
              : showAlreadyClaimed
              ? 'border-gray-200 hover:border-gray-300'
              : 'border-blue-200 hover:border-gray-300'
            : isBundle
            ? 'border-green-200 hover:border-green-300'
            : 'border-gray-100 hover:border-gray-200'
        }`}
        variants={fadeInUp}
        animate={isHighlighted ? {
          scale: [1, 1.05, 1],
          rotate: [0, 1, -1, 0],
          transition: {
            duration: 1,
            times: [0, 0.25, 0.5, 1],
            repeat: 3,
            ease: "easeInOut"
          }
        } : {}}
      >
        {/* Free Service Badge */}
        {isFreeService && (
          <div className="absolute top-3 left-3 z-20">
            <div className={`text-xs font-semibold px-3 py-1.5 rounded-full shadow-sm ${
              canClaimFreeService
                ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white'
                : showAlreadyClaimed
                ? 'bg-gradient-to-r from-gray-400 to-gray-500 text-gray-700'
                : 'bg-gradient-to-r bg-gray-800 text-white'
            }`}>
              {canClaimFreeService ? 'FREE FOR YOU!' : 
               showAlreadyClaimed ? 'ALREADY CLAIMED' : 
               'SIGNUP BONUS'}
            </div>
          </div>
        )}

        {/* Bundle Savings Badge */}
        {isBundle && !isFreeService && service.savingsAmount && (
          <div className="absolute top-3 left-3 z-20">
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-semibold px-2 py-1 rounded shadow-sm">
              Save ₵{service.savingsAmount}
            </div>
          </div>
        )}

        {/* Delivery Ribbon */}
        <div className="absolute top-0 right-0 w-24 h-24 overflow-hidden z-10 pointer-events-none">
          <div className={`absolute top-0 right-0 w-[140%] h-6 flex items-center justify-center text-[10px] font-semibold text-white transform translate-x-[30%] translate-y-[90%] rotate-45 
            ${status.isPriority ? 'bg-gradient-to-r from-orange-500 to-red-500' : 'bg-gradient-to-r from-green-500 to-emerald-500'}`}>
            {status.bannerText}
          </div>
        </div>

        <div className="relative h-56 overflow-hidden bg-gray-100">
          <img
            src={service.image}
            alt={service.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://via.placeholder.com/400x300?text=Sneaker+Service';
            }}
          />
        </div>

        <div className="p-5 flex flex-col flex-grow">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-800">
              {service.name}
            </h3>
            {/* Show "Already claimed" badge */}
            {showAlreadyClaimed && (
              <span className="text-xs text-gray-500 font-medium bg-gray-100 px-2 py-1 rounded">
                Already claimed
              </span>
            )}
          </div>

          {/* Delivery Time Badge */}
          <div className={`inline-flex items-center gap-1 w-fit px-3 py-1.5 rounded-full text-xs font-medium mb-3 
            ${status.isPriority ? 'bg-orange-50 text-orange-700 border border-orange-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {status.badgeText}
          </div>

          {/* Description */}
          <div className="relative mb-4">
            <div className="hidden md:block">
              <p className="text-gray-600 text-sm line-clamp-2">
                {service.description}
              </p>
            </div>
            <div className="md:hidden">
              <p className={`text-gray-600 text-sm ${isExpanded ? '' : 'line-clamp-2'}`}>
                {service.description}
              </p>
              {service.description.length > 100 && (
                <button
                  onClick={() => toggleDescription(service.id)}
                  className="mt-1 text-primary text-xs font-medium hover:text-primary/80 flex items-center gap-1"
                >
                  {isExpanded ? (
                    <>
                      Read Less
                      <FaChevronUp className="w-3 h-3" />
                    </>
                  ) : (
                    <>
                      Read More
                      <FaChevronDown className="w-3 h-3" />
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Price and Add to Cart */}
          <div className="mt-auto border-t border-gray-100 pt-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                {isFreeService ? (
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-2xl font-bold text-green-600">FREE</p>
                      {service.original_price && (
                        <p className="text-sm text-gray-500 line-through">₵{service.original_price}</p>
                      )}
                    </div>
                    {showAlreadyClaimed && (
                      <p className="text-xs text-gray-500 mt-1">You've already claimed your free service</p>
                    )}
                    {!isAuthenticated && (
                      <p className="text-xs text-gray-500 mt-1">Sign up to claim this free service</p>
                    )}
                  </div>
                ) : (
                  <p className="text-2xl font-bold text-primary">₵{service.price}</p>
                )}
              </div>
              {isBundle && service.perSneakerPrice && (
                <div className="text-right">
                  <p className="text-xs text-gray-500">Per sneaker:</p>
                  <p className="text-sm font-semibold text-green-600">
                    ₵{service.perSneakerPrice}
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={() => isFreeService ? handleFreeServiceClick(service) : handleAddToCart(service)}
              disabled={redeemingFreeService || (isFreeService && !canClaimFreeService && isAuthenticated)}
              className={`w-full py-3 rounded-lg font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                isFreeService
                  ? canClaimFreeService
                    ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white shadow-md hover:shadow-lg'
                    : !isAuthenticated
                    ? 'bg-gray-800 text-white shadow-md hover:shadow-lg hover:bg-gray-700'
                    : 'bg-gray-200 cursor-not-allowed text-gray-500'
                  : isBundle
                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-md hover:shadow-lg'
                  : 'bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-white shadow-md hover:shadow-lg'
              }`}
            >
              {redeemingFreeService && isFreeService ? (
                <>
                  <FaSpinner className="animate-spin h-4 w-4" />
                  Adding...
                </>
              ) : isFreeService ? (
                canClaimFreeService ? (
                  <>
                    <FaGift className="w-4 h-4" />
                    Add to Cart to Claim Your Free Clean
                  </>
                ) : showAlreadyClaimed ? (
                  <>
                    <FaCheckCircle className="w-4 h-4" />
                    Already Claimed
                  </>
                ) : !isAuthenticated ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    Sign In to Claim Free Service
                  </>
                ) : (
                  'Not Eligible'
                )
              ) : isBundle ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  Add {service.included_quantity || 1}-Pair Bundle
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Add to Cart
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <>
      {/* Already Claimed Modal */}
      {renderAlreadyClaimedModal()}
      
      <section className="bg-cover bg-center h-[18rem] relative" style={{ backgroundImage: `url(${bgImage})` }}>
        <div className="absolute inset-0 bg-black/50" />
        <motion.div 
          className="relative h-full px-4 md:px-8 lg:px-24 flex flex-col text-left justify-center"
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
        >
          <h1 className="text-white text-3xl md:text-5xl font-bold header">
            <span className="text-primary">Schedule </span> a Klean
          </h1>
          <p className="text-white lg:text-lg mt-[2rem] max-w-2xl">
            At Kleankickx, we're passionate about bringing your favorite footwear back to life.
          </p>
          
          <motion.button
            onClick={scrollToServices}
            className="mt-8 w-fit bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-white font-semibold py-3 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 active:scale-95 flex items-center gap-2 group"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span>Browse Services</span>
            <motion.svg 
              className="w-5 h-5 group-hover:translate-y-0.5 transition-transform"
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              initial={{ y: 0 }}
              animate={{ y: [0, 3, 0] }}
              transition={{ 
                repeat: Infinity, 
                duration: 1.5,
                ease: "easeInOut"
              }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </motion.svg>
          </motion.button>
        </motion.div>
      </section>
      
      <div 
        ref={servicesSectionRef}
        className="bg-[#edf1f4] py-12 px-4" 
        id="services"
      >
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-primary mb-1">Our Services</h2>
            <p className="text-gray-600 mb-4">Premium sneakers cleaning and restoration services.</p>
            
            {/* Free Service Banner */}
            {renderFreeServiceBanner()}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              <p className="font-medium">Error loading services</p>
              <p className="text-sm">{error}</p>
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center h-[50vh]">
              <FaSpinner className="animate-spin h-12 w-12 text-primary mb-4" />
              <p className="text-gray-600">Loading services...</p>
            </div>
          ) : sortedServices.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[50vh] text-center bg-white rounded-xl border border-gray-200 p-8">
              <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No services available</h3>
              <p className="text-gray-600 max-w-md">
                We're currently updating our services. Please check back soon or contact us for more information.
              </p>
            </div>
          ) : (
            <div>
              <motion.div 
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
                variants={stagger}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
              >
                {sortedServices.map(renderServiceCard)}
              </motion.div>
            </div>
          )}
        </div>
      </div>
      
      <Footer />
    </>
  );
};

export default Services;