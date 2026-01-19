// src/components/Services.jsx
import React, { useState, useEffect, useContext, useRef } from 'react'; // Added useRef
import axios from 'axios';
import { CartContext } from '../context/CartContext';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import bgImage from '../assets/kleankickx_care.png';
import { motion, AnimatePresence } from 'framer-motion';
import Footer from '../components/Footer';
import { FaSpinner, FaChevronDown, FaChevronUp } from 'react-icons/fa6';
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

  const handleAddToCart = (serviceId, serviceName, servicePrice) => {
    const isInCart = cart.some(item => item.service_id === serviceId);
    if (isInCart) {
      toast.info(`${serviceName} is already in your cart!`);
    } else {
      addToCart(serviceId, serviceName, servicePrice);
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
                
                return (
                  <motion.div
                    key={service.id}
                    className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-300 relative group flex flex-col"
                    variants={fadeInUp}
                  >
                    {/* --- SLANTED RIBBON BANNER --- */}
                    <div className="absolute top-0 right-0 w-28 h-28 overflow-hidden z-20 pointer-events-none">
                      <div className={`absolute top-0 right-0 w-[140%] h-7 flex items-center justify-center text-[10px] font-black uppercase tracking-widest text-white shadow-sm transform translate-x-[30%] translate-y-[80%] rotate-45 
                        ${status.isPriority ? 'bg-gradient-to-r from-orange-500 to-yellow-500' : 'bg-gradient-to-r from-emerald-600 to-green-500'}`}>
                        {status.bannerText}
                      </div>
                    </div>

                    <div className="relative h-56 overflow-hidden bg-gray-100">
                      <img
                        src={service.image}
                        alt={service.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      {signupDiscount && (
                        <div className="absolute top-4 left-0 bg-primary text-white text-[10px] font-bold px-3 py-1 rounded-r-full shadow-lg">
                          {parseInt(signupDiscount.percentage)}% OFF
                        </div>
                      )}
                    </div>

                    <div className="p-6 flex flex-col flex-grow">
                      <h3 className="text-lg font-bold text-gray-800 leading-tight mb-2">{service.name}</h3>

                      <div className={`inline-flex items-center gap-1.5 w-fit px-2.5 py-1 rounded-full text-[10px] font-semibold border mb-4 
                        ${status.isPriority ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {status.badgeText}
                      </div>

                      {/* --- DESCRIPTION WITH TOOLTIP (Desktop) and READ MORE (Mobile) --- */}
                      <div className="relative mb-6">
                        {/* Desktop: Tooltip on hover */}
                        <div 
                          className="hidden md:block"
                          onMouseEnter={() => setHoveredDescriptionId(service.id)}
                          onMouseLeave={() => setHoveredDescriptionId(null)}
                        >
                          <p className="text-gray-500 text-sm line-clamp-2 cursor-help">
                            {service.description}
                          </p>
                          
                          <AnimatePresence>
                            {hoveredDescriptionId === service.id && (
                              <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="absolute bottom-full left-0 mb-2 w-full z-50 bg-gray-900 text-white text-xs p-3 rounded-lg shadow-xl"
                              >
                                {service.description}
                                {/* Tooltip Arrow */}
                                <div className="absolute top-full left-5 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-gray-900"></div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        {/* Mobile: Read More Button */}
                        <div className="md:hidden">
                          <div className="relative">
                            <p className={`text-gray-500 text-sm transition-all duration-300 ${isExpanded ? '' : 'line-clamp-2'}`}>
                              {service.description}
                            </p>
                            
                            {/* Fade effect for non-expanded text */}
                            {!isExpanded && service.description.length > 100 && (
                              <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-white to-transparent pointer-events-none"></div>
                            )}
                          </div>
                          
                          {service.description.length > 100 && (
                            <button
                              onClick={() => toggleDescription(service.id)}
                              className="mt-2 flex items-center gap-1 text-primary text-xs font-medium hover:text-primary/80 transition-colors"
                            >
                              {isExpanded ? (
                                <>
                                  <FaChevronUp className="w-3 h-3" />
                                  Read Less
                                </>
                              ) : (
                                <>
                                  <FaChevronDown className="w-3 h-3" />
                                  Read More
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="mt-auto border-t border-gray-100 pt-4">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <p className="text-xs text-gray-400 line-through">₵{service.price * 1.3}</p>
                            <p className="text-xl font-black text-primary">₵{service.price}</p>
                          </div>
                        </div>

                        <button
                          onClick={() => handleAddToCart(service.id, service.name, service.price)}
                          className="w-full bg-primary hover:bg-black text-white py-3 rounded-xl font-bold text-sm transition-all duration-300 transform active:scale-95 shadow-md"
                        >
                          ADD TO CART
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