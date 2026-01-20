// src/components/Services.jsx
import React, { useState, useEffect, useContext, useRef } from 'react';
import axios from 'axios';
import { CartContext } from '../context/CartContext';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import bgImage from '../assets/kleankickx_care.png';
import { motion, AnimatePresence } from 'framer-motion';
import Footer from '../components/Footer';
import { FaSpinner, FaChevronDown, FaChevronUp } from 'react-icons/fa6';
import { AuthContext } from '../context/AuthContext';
import { 
  CheckIcon,
  ShoppingBagIcon
} from '@heroicons/react/24/outline';

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
  const [error, setError] = useState('');
  const [hoveredDescriptionId, setHoveredDescriptionId] = useState(null);
  const [expandedDescriptions, setExpandedDescriptions] = useState({});
  const { cart, addToCart } = useContext(CartContext);
  const [loading, setLoading] = useState(true);
  const { api, discounts } = useContext(AuthContext);

  const signupDiscount = discounts?.find(d => d.type === 'Signup Discount');
  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:10000';
  const navigate = useNavigate();
  
  // Ref for services section
  const servicesSectionRef = useRef(null);

  useEffect(() => {
    const fetchServices = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${backendUrl}/api/services/`);
        console.log(response.data)
        setServices(response.data);
      } catch (err) {
        setError('Failed to load services.');
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, []);

  const getServiceStatus = (serviceName) => {
    const name = serviceName.toLowerCase();
    const isPriority = name.includes('priority') || name.includes('express') || name.includes('rush');
    
    return {
      isPriority,
      bannerText: isPriority ? 'NEXT DAY' : '72 HOURS',
      badgeText: isPriority ? 'delivered next day' : 'delivered in 72h'
    };
  };

  // Check if service is a bundle package - Now handles ANY package type
  const isBundleService = (service) => {
    return service?.service_type?.startsWith('PACKAGE_');
  };

  // Get Standard Clean price for comparison
  const getStandardCleanPrice = () => {
    const standardService = services.find(service => 
      service.name.toLowerCase().includes('standard') && 
      !isBundleService(service)
    );
    return standardService?.price || 100; // Default to 100 if not found
  };

  // Calculate savings for bundle services
  const calculateBundleSavings = (service) => {
    if (!isBundleService(service)) return null;
    
    const standardPrice = getStandardCleanPrice();
    const bundlePrice = service.price;
    
    // Use included_quantity from the service data
    const sneakerCount = service.included_quantity || 1;
    
    if (sneakerCount <= 1) return null;
    
    const individualTotal = standardPrice * sneakerCount;
    const savingsAmount = individualTotal - bundlePrice;
    
    if (savingsAmount <= 0) return null;
    
    return {
      sneakerCount,
      individualTotal: individualTotal.toFixed(2),
      savingsAmount: savingsAmount.toFixed(2)
    };
  };

  const handleAddToCart = (serviceId, serviceName, servicePrice) => {
    const isInCart = cart.some(item => item.service_id === serviceId);
    
    if (isInCart) {
      toast.info(`${serviceName} is already in your cart!`);
    } else {
      // Always add with quantity 1 for all services
      // Users can increase quantity as needed from the cart
      addToCart(serviceId, serviceName, servicePrice, 1);
      toast.success(`${serviceName} added to cart!`);
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

  return (
    <>
      <section className="bg-cover bg-center h-[15rem] relative" style={{ backgroundImage: `url(${bgImage})` }}>
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
          
          {/* Browse Services Button */}
          <motion.button
            onClick={scrollToServices}
            className="mt-8 w-fit bg-primary cursor-pointer hover:bg-primary/90 text-white font-semibold py-3 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 active:scale-95 flex items-center gap-2 group"
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
      
      {/* Services section with ref */}
      <div 
        ref={servicesSectionRef}
        className="bg-[#edf1f4] py-12 px-4" 
        id="services"
      >
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-primary mb-1">Shop From Categories</h2>
          <p className="text-gray-600 mb-10">Premium sneakers cleaning and restoration services.</p>

          {loading ? (
            <div className="flex flex-col items-center justify-center h-[40vh]">
              <FaSpinner className="animate-spin h-8 w-8 text-primary" />
            </div>
          ) : (
            <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8" variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}>
              {services.map((service) => {
                const status = getServiceStatus(service.name);
                const isExpanded = expandedDescriptions[service.id];
                const isBundle = isBundleService(service);
                const bundleSavings = isBundle ? calculateBundleSavings(service) : null;
                
                return (
                  <motion.div
                    key={service.id}
                    className={`bg-white rounded-xl shadow-sm overflow-hidden border hover:shadow-md transition-all duration-300 relative group flex flex-col ${
                      isBundle ? 'border-green-200 hover:border-green-300' : 'border-gray-100 hover:border-gray-200'
                    }`}
                    variants={fadeInUp}
                  >
                    {/* Minimal Bundle Badge - Shows only savings amount */}
                    {isBundle && bundleSavings && (
                      <div className="absolute top-3 left-3 z-20">
                        <div className="bg-green-500 text-white text-xs font-semibold px-2 py-1 rounded shadow-sm">
                          Save ₵{bundleSavings.savingsAmount}
                        </div>
                      </div>
                    )}

                    {/* Delivery Ribbon */}
                    <div className="absolute top-0 right-0 w-24 h-24 overflow-hidden z-10 pointer-events-none">
                      <div className={`absolute top-0 right-0 w-[140%] h-6 flex items-center justify-center text-[10px] font-semibold text-white transform translate-x-[30%] translate-y-[90%] rotate-45 
                        ${status.isPriority ? 'bg-orange-500' : 'bg-green-500'}`}>
                        {status.bannerText}
                      </div>
                    </div>

                    <div className="relative h-56 overflow-hidden bg-gray-100">
                      <img
                        src={service.image}
                        alt={service.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>

                    <div className="p-5 flex flex-col flex-grow">
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">
                        {service.name}
                      </h3>

                      {/* Minimal Savings Display for Bundles - Shows only savings */}
                      {isBundle && bundleSavings && (
                        <div className="mb-3 p-2 bg-green-50 rounded-lg border border-green-100">
                          <div className="text-center">
                            <span className="text-sm text-gray-600">You save </span>
                            <span className="text-base font-bold text-green-700">₵{bundleSavings.savingsAmount}</span>
                            <p className="text-xs text-gray-500 mt-1">
                              Bundle of {service.included_quantity || 1} sneakers
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Delivery Time Badge */}
                      <div className={`inline-flex items-center gap-1 w-fit px-2 py-1 rounded-full text-[10px] font-medium mb-3 
                        ${status.isPriority ? 'bg-orange-50 text-orange-700' : 'bg-green-50 text-green-700'}`}>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                              className="mt-1 text-primary text-xs font-medium hover:text-primary/80"
                            >
                              {isExpanded ? 'Read Less' : 'Read More'}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Price and Add to Cart */}
                      <div className="mt-auto border-t border-gray-100 pt-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            {isBundle && bundleSavings ? (
                              <div>
                                <p className="text-xl font-bold text-green-700">₵{service.price}</p>
                                <p className="text-xs text-gray-500">
                                  <span className="line-through">₵{bundleSavings.individualTotal}</span> value
                                </p>
                                <p className="text-xs text-gray-600 mt-1">
                                  ₵{(service.price / (service.included_quantity || 1)).toFixed(2)} per sneaker
                                </p>
                              </div>
                            ) : (
                              <p className="text-xl font-bold text-primary">₵{service.price}</p>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => handleAddToCart(
                            service.id, 
                            service.name, 
                            service.price
                          )}
                          className={`w-full py-2.5 rounded-lg font-medium text-sm transition-colors duration-200 ${
                            isBundle 
                              ? 'bg-green-600 hover:bg-green-700 text-white'
                              : 'bg-primary hover:bg-primary/90 text-white'
                          }`}
                        >
                          {isBundle ? `Add ${service.included_quantity || 1}-Pair Bundle` : 'Add to Cart'}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Services;