import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useInView } from "react-intersection-observer";
import { useState, useEffect, useContext, useRef } from 'react';
import axios from 'axios';
import { FaSpinner, FaChevronDown, FaChevronUp, FaGift, FaArrowRight } from 'react-icons/fa6';
import { FaTimes } from 'react-icons/fa';
import { AuthContext } from '../context/AuthContext';

// assets & components
import arrow1 from '../assets/arrow1.png';
import arrow2 from '../assets/arrow2.png';
import ShoeCarousel from '../components/ShoeCarousel';
import kleankickxCare from '../assets/kleankickx_care.png';
import whoWeAre from '../assets/who_we_are.png';
import KleanTips from '../components/KleanTips';
import Footer from '../components/Footer';
import heroImage from '../assets/home_hero.png';

const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: (i = 1) => ({
    opacity: 1,
    transition: { delay: i * 0.15, duration: 0.5 },
  }),
};

const zoomIn = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5 } },
};

const staggerContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.2 },
  },
};

// Modal animations
const modalBackdrop = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: 0.3 }
  }
};

const modalContent = {
  hidden: { opacity: 0, scale: 0.8, y: 20 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    y: 0,
    transition: { 
      type: "spring", 
      damping: 25, 
      stiffness: 300,
      delay: 0.1 
    }
  },
  exit: { 
    opacity: 0, 
    scale: 0.8, 
    y: 20,
    transition: { duration: 0.2 }
  }
};

// Helper to animate numbers
const AnimatedNumber = ({ value }) => {
  const [ref, inView] = useInView({ triggerOnce: true });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (inView) {
      let start = 0;
      const end = parseInt(value.replace(/[^\d]/g, ""));
      const duration = 2000;
      const increment = end / (duration / 16);

      const animate = () => {
        start += increment;
        if (start < end) {
          setCount(Math.round(start));
          requestAnimationFrame(animate);
        } else {
          setCount(end);
        }
      };
      animate();
    }
  }, [inView, value]);
  
  return (
    <h3 ref={ref} className="text-5xl text-[#47E84B] header mb-2">
      {count.toLocaleString()}{value.replace(/\d+/g, "")}
    </h3>
  );
}

// Free Service Modal Component
const FreeServiceModal = ({ isOpen, onClose, onClaim, userStatus, freeService }) => {
  const navigate = useNavigate();
  
  const handleClaim = () => {
    onClose();
    onClaim();
  };
  
  const handleClose = () => {
    // Save to localStorage that user dismissed the modal
    localStorage.setItem('free_service_modal_dismissed', 'true');
    onClose();
  };
  
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9998]"
            variants={modalBackdrop}
            initial="hidden"
            animate="visible"
            exit="hidden"
            onClick={handleClose}
          />
          
          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center p-4 z-[9999] pointer-events-none">
            <motion.div
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-auto overflow-hidden pointer-events-auto"
              variants={modalContent}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {/* Close button */}
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10"
              >
                <FaTimes className="w-5 h-5" />
              </button>
              
              {/* Header with gradient */}
              <div className="relative h-32 bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 overflow-hidden">
                {/* Animated confetti background */}
                <div className="absolute inset-0 opacity-10">
                  {[...Array(20)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute w-2 h-2 bg-white rounded-full"
                      style={{
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                        animation: `float ${3 + Math.random() * 3}s infinite ease-in-out ${Math.random() * 2}s`
                      }}
                    />
                  ))}
                </div>
                
                {/* Gift icon */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <motion.div
                    animate={{ 
                      scale: [1, 1.1, 1],
                      rotate: [0, 5, -5, 0] 
                    }}
                    transition={{ 
                      repeat: Infinity, 
                      duration: 3,
                      ease: "easeInOut" 
                    }}
                    className="relative"
                  >
                    <FaGift className="w-16 h-16 text-white drop-shadow-lg" />
                  </motion.div>
                </div>
              </div>
              
              {/* Content */}
              <div className="p-6">
                <h3 className="text-2xl font-bold text-gray-800 mb-2 text-center">
                  🎁 Special Offer Just For You!
                </h3>
                
                <div className="text-center mb-6">
                  <p className="text-gray-600 mb-4">
                    {userStatus.isAuthenticated ? (
                      userStatus.hasUsedFreeService ? (
                        <>
                          Thank you for being a valued customer! You've already claimed your free service.
                        </>
                      ) : (
                        <>
                          As a new user, you're eligible for a <span className="font-bold text-green-600">FREE {freeService?.name || 'Standard Clean'}</span>!
                        </>
                      )
                    ) : (
                      <>
                        Sign up today and get a <span className="font-bold text-green-600">FREE {freeService?.name || 'Standard Clean'}</span> as a welcome gift!
                      </>
                    )}
                  </p>
                  
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 mb-6">
                    <div className="flex items-center justify-center gap-3">
                      <div className="text-3xl font-bold text-green-600">FREE</div>
                      {freeService?.original_price && (
                        <div className="text-gray-500 line-through">₵{freeService.original_price}</div>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      Limited to one per account • Cannot be combined with other offers
                    </p>
                  </div>
                </div>
                
                {/* Action buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  {userStatus.isAuthenticated ? (
                    userStatus.hasUsedFreeService ? (
                      <button
                        onClick={() => {
                          handleClose();
                          navigate('/services');
                        }}
                        className="flex-1 bg-primary hover:bg-primary/90 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 hover:shadow-lg flex items-center justify-center gap-2"
                      >
                        Browse All Services
                        <FaArrowRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={handleClaim}
                          className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 hover:shadow-lg transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                        >
                          <FaGift className="w-4 h-4" />
                          Claim Free Service
                        </button>
                        <button
                          onClick={handleClose}
                          className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-6 rounded-lg transition-colors duration-200"
                        >
                          Maybe Later
                        </button>
                      </>
                    )
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          handleClose();
                          navigate('/auth/register');
                        }}
                        className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 hover:shadow-lg flex items-center justify-center gap-2"
                      >
                        Sign Up to Claim
                        <FaArrowRight className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          handleClose();
                          navigate('/services');
                        }}
                        className="flex-1 bg-primary hover:bg-primary/90 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 hover:shadow-lg"
                      >
                        Browse Services
                      </button>
                    </>
                  )}
                </div>
                
                {/* Footer note */}
                <p className="text-xs text-gray-400 text-center mt-6">
                  This offer expires soon. Don't miss out!
                </p>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

const Home = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hoveredDescriptionId, setHoveredDescriptionId] = useState(null);
  const [expandedDescriptions, setExpandedDescriptions] = useState({});
  const [showFreeServiceModal, setShowFreeServiceModal] = useState(false);
  const { user, isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:10000';
  
  // Track if modal has been shown in this session
  const modalShownRef = useRef(false);
  const modalTimerRef = useRef(null);

  useEffect(() => {
    const fetchServices = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${backendUrl}/api/services/public/`);
        setServices(response.data);
        
        // Check for free service in the response
        const freeService = response.data.find(service => service.is_free_signup_service);
        
        // Show modal after 3 seconds if conditions are met
        if (!modalShownRef.current) {
          modalTimerRef.current = setTimeout(() => {
            const userStatus = getUserFreeServiceStatus();
            const shouldShowModal = 
              !localStorage.getItem('free_service_modal_dismissed') && // Not dismissed before
              freeService && // Free service exists
              (userStatus.isAuthenticated ? !userStatus.hasUsedFreeService : true); // Eligible
            
            if (shouldShowModal) {
              setShowFreeServiceModal(true);
              modalShownRef.current = true;
            }
          }, 3000);
        }
        
      } catch (err) {
        setError('Failed to load services.');
        console.error('Error fetching services:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchServices();
    
    // Cleanup timer on unmount
    return () => {
      if (modalTimerRef.current) {
        clearTimeout(modalTimerRef.current);
      }
    };
  }, []);

  // Get user's free service status
  const getUserFreeServiceStatus = () => {
    if (!isAuthenticated || !user) {
      return { isAuthenticated: false, hasUsedFreeService: false };
    }
    return {
      isAuthenticated: true,
      hasUsedFreeService: !!user.free_signup_service_used
    };
  };

  // Find free service
  const freeService = services.find(service => service.is_free_signup_service);

  // Function to get service status for banner
  const getServiceStatus = (serviceName) => {
    const name = serviceName.toLowerCase();
    const isPriority = name.includes('priority') || name.includes('express') || name.includes('rush');
    
    return {
      isPriority,
      bannerText: isPriority ? 'NEXT DAY' : '72 HOURS',
      badgeText: isPriority ? 'delivered next day' : 'delivered in 72h'
    };
  };

  const toggleDescription = (serviceId) => {
    setExpandedDescriptions(prev => ({
      ...prev,
      [serviceId]: !prev[serviceId]
    }));
  };

  const handleClaimFreeService = () => {
    if (isAuthenticated) {
      // Navigate to services page and scroll to free service
      navigate('/services');
      // The free service should already be at the top if user is eligible
    } else {
      // Navigate to signup page
      navigate('/signup');
    }
  };

  // Add CSS animation for confetti
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes float {
        0%, 100% { transform: translateY(0) rotate(0deg); }
        50% { transform: translateY(-10px) rotate(180deg); }
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <>
      {/* Free Service Modal */}
      <FreeServiceModal
        isOpen={showFreeServiceModal}
        onClose={() => setShowFreeServiceModal(false)}
        onClaim={handleClaimFreeService}
        userStatus={getUserFreeServiceStatus()}
        freeService={freeService}
      />
      
      {/* HERO */}
      <section className="bg-[#E5FDFF] h-full lg:h-screen">
        <section className="py-[4rem] px-4 md:px-8 lg:px-24">
          <div className="flex flex-col lg:flex-row items-center justify-between h-full text-center lg:text-left">
            <motion.div
              className=""
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
            >
              <h1 className="text-primary text-4xl md:text-6xl font-medium header lg:leading-[5rem]">
                <span className="text-[#011627]">Leave Your </span> Sneakers<br />
                <span className="text-[#011627]">In our </span> Care
              </h1>
              <p className="text-[#011627] text-lg mt-4 max-w-xl">
                Getting your footwear cleaned has never been so easy. We pick up your dirty kicks, Klean them by hand, and then deliver your Kleankickx to you.
              </p>
              <motion.div variants={zoomIn} initial="hidden" animate="visible" className="mt-8">
                <button 
                  onClick={() => navigate('/services')}
                  className="bg-[#011627] rounded text-white px-6 py-3 inline-block hover:bg-[#011627]/90 transition font-medium"
                >
                  Schedule a Klean
                </button>
              </motion.div>
            </motion.div>

            <motion.div
              className="mt-12 lg:mt-0"
              variants={fadeInUp}
            >
              <img src={heroImage} alt="Hero Sneakers" className="lg:w-[35rem]" />
            </motion.div>
          </div>
        </section>
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-[#11B59C] relative overflow-hidden">
        {/* decorative blobs */}
        <div className="absolute h-40 w-40 left-[30rem] bg-[#40EAD2]/40 rounded-full blur-2xl" />
        <div className="absolute h-40 w-40 top-40 right-[30rem] bg-[#40EAD2]/40 rounded-full blur-2xl" />
        <div className="absolute h-40 w-40 -top-10 right-[10rem] bg-[#40EAD2]/40 rounded-full blur-2xl" />

        <motion.div
          className="px-4 md:px-8 lg:px-24 py-20"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          <motion.h2 variants={fadeInUp} className="text-2xl md:text-5xl text-center font-bold text-black header mb-12">
            How It Works: <span className="text-white">In 3 Easy Steps</span>
          </motion.h2>

          <div className="flex flex-col md:flex-row items-center justify-center gap-8">
            {[
              {
                step: '1',
                title: 'Schedule a Klean',
                text: 'Schedule your klean via our online channels. Our courier will reach out at the appointed time.',
              },
              {
                isArrow: true,
                img: arrow1,
              },
              {
                step: '2',
                title: 'Hand in Your Sneakers',
                text: 'Our team of expert sneaker technicians will meticulously clean and restore your shoes to your exact specifications.',
              },
              {
                isArrow: true,
                img: arrow2,
              },
              {
                step: '3',
                title: 'Receive Your KleanKickx',
                text: "Get your sneakers sparkling klean in just 72 hours!. We will reach out to you to confirm your availability for the delivery of your refreshed sneakers."
              },
            ].map((item, idx) => (
              item.isArrow ? (
                <motion.img key={idx} src={item.img} alt="arrow" className="w-20 mx-auto rotate-90 md:rotate-0" variants={fadeIn} custom={idx} />
              ) : (
                <motion.div key={idx} variants={fadeIn} custom={idx}>
                  <h1 className="text-2xl text-white header">{item.step}</h1>
                  <h3 className="text-xl font-medium text-white header mt-2">{item.title}</h3>
                  <p className="text-black mt-2 max-w-xs mx-auto md:mx-0">{item.text}</p>
                </motion.div>
              )
            ))}
          </div>
        </motion.div>
      </section>

      {/* SERVICES */}
      <section className="px-4 md:px-8 lg:px-24 py-20">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-[#011627] header mb-12">
          Our Premium Services
        </h2>
        
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64">
            <FaSpinner className="animate-spin h-10 w-10 text-primary mb-4" />
            <p className="text-gray-600">Loading services...</p>
          </div>
        ) : error ? (
          <div className="text-center text-red-600 bg-red-50 p-6 rounded-lg max-w-md mx-auto">
            <p className="mb-2">Failed to load services</p>
            <button 
              onClick={() => window.location.reload()}
              className="text-sm text-primary underline"
            >
              Try again
            </button>
          </div>
        ) : (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
          >
            {services.slice(0, 3).map((service, i) => {
              const status = getServiceStatus(service.name);
              const isExpanded = expandedDescriptions[service.id];
              
              return (
               <div key={service.id}>
                  <motion.div variants={fadeIn} custom={i} className="group">
                    <div className="bg-white border border-gray-200 rounded-lg shadow-lg hover:shadow-2xl transition duration-300 hover:border-primary overflow-hidden h-full flex flex-col relative">
                      {/* Free Service Badge */}
                      {service.is_free_signup_service && (
                        <div className="absolute top-4 left-0 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-r-full shadow-lg z-10 flex items-center gap-1">
                          <FaGift className="w-3 h-3" />
                          FREE
                        </div>
                      )}

                      {/* Slanted Delivery Ribbon */}
                      <div className="absolute top-0 right-0 w-28 h-28 overflow-hidden z-20 pointer-events-none">
                        <div className={`absolute top-0 right-0 w-[140%] h-7 flex items-center justify-center text-[10px] font-black uppercase tracking-widest text-white shadow-sm transform translate-x-[30%] translate-y-[80%] rotate-45 
                          ${status.isPriority ? 'bg-gradient-to-r from-orange-500 to-yellow-500' : 'bg-gradient-to-r from-emerald-600 to-green-500'}`}>
                          {status.bannerText}
                        </div>
                      </div>

                      <Link to="/services" className="flex-grow">
                        <div className="relative h-72 overflow-hidden bg-gray-100">
                          <img 
                            src={service.image} 
                            alt={service.name} 
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-500" 
                          />
                        </div>
                      </Link>
                      
                      <div className="p-6 flex flex-col flex-grow">
                        <h3 className="text-lg font-bold text-gray-800 mb-2">{service.name}</h3>
                        
                        {/* Delivery Badge */}
                        <div className={`inline-flex items-center gap-1.5 w-fit px-2.5 py-1 rounded-full text-[10px] font-semibold border mb-4 
                          ${status.isPriority ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {status.badgeText}
                        </div>

                        {/* Description with Tooltip (Desktop) and Read More (Mobile) */}
                        <div className="relative mb-6 flex-grow">
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
                                onClick={(e) => {
                                  e.preventDefault();
                                  toggleDescription(service.id);
                                }}
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

                        <div className="border-t border-gray-200 pt-4 mt-auto">
                          <div className="flex gap-4 items-center">
                            <p className={`font-bold text-lg ${service.is_free_signup_service ? 'text-green-600' : 'text-primary'}`}>
                              {service.is_free_signup_service ? 'FREE' : `GH₵${service.price}`}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              );
            })}
          </motion.div>
        )}

        {services.length > 3 && (
          <div className="text-center mt-10">
            <Link 
              to="/services" 
              className="inline-flex items-center gap-2 bg-primary text-white px-8 py-3 rounded-lg hover:bg-primary/90 transition font-medium"
            >
              View All Services
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        )}
      </section>

      {/* STATISTICS & CAROUSEL */}
      <section className="px-4 md:px-8 lg:px-24 py-20 bg-[#011627] text-center">
        <motion.h2 variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-3xl md:text-5xl font-bold text-white header mb-16">
          Let's Talk Numbers
        </motion.h2>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-10"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {[
                { label: 'Happy Clients', value: '450+' },
                { label: 'Sneakers Cleaned', value: '1,200+' },
                { label: 'CO2 Emissions Reduced', value: '+21,000Kg' },
                ].map((stat, i) => (
                <motion.div key={i} variants={zoomIn}>
                    <AnimatedNumber value={stat.value} />
                    <p className="text-lg text-white">{stat.label}</p>
                </motion.div>
            ))}
        </motion.div>

        {/* Carousel */}
        <motion.h2 variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-6xl font-bold text-primary header mt-20 mb-10">
          <span className="text-white">Before &</span> After
        </motion.h2>
        <ShoeCarousel />
      </section>

      {/* CARE */}
      <section className="relative h-[30rem] bg-cover bg-center" style={{ backgroundImage: `url(${kleankickxCare})` }}>
        <motion.div
          className="relative z-10 h-full pt-[4rem] px-4 md:px-8 lg:px-24 text-center flex flex-col items-center text-white"
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          <h2 className="text-3xl md:text-5xl font-bold text-[#9CDD9D] header mb-6">KleanKickx Sneaker Care</h2>
          <p className="text-white max-w-2xl text-center text-lg">
             We're your one-stop shop for reviving your beloved sneakers. Whether athlete, collector, or casual wearer, we bring them back to life.
          </p>
        </motion.div>
      </section>

      {/* WHO WE ARE */}
      <section className="bg-cover bg-no-repeat" style={{ backgroundImage: `url(${whoWeAre})` }}>
        <motion.div
          className="px-4 md:px-8 lg:px-24 py-16 lg:py-[8rem] max-w-4xl"
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          <h2 className="text-3xl md:text-5xl font-bold text-[#1C7C76] header mb-6">Who We Are</h2>
          <p className="text-[#011627] mb-6 text-lg">
            At Kleankickx Sneaker Care, we combine a love for sneakers with the power of technology to create a platform that drives sustainability and community impact. As a tech-driven company, we're building innovative solutions to extend the life of footwear, reduce waste, and empower communities. Through initiatives, like KleanFam,KleanKids, and Kickx CTRL, we promote proper sneaker care, support underprivileged children with school essentials, and recycle worn-out sneakers into valuable products, making a lasting impact, one sneaker at a time.
          </p>
          <Link to="/about-us" className="bg-[#1C7C76] text-white px-6 py-3 inline-block hover:bg-[#1C7C76]/90 rounded transition font-medium">
            Learn More
          </Link>
        </motion.div>
      </section>

      {/* TIPS & FOOTER */}
      <KleanTips />
      <Footer />
    </>
  );
};

export default Home;