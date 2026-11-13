import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaSpinner, FaChevronDown, FaChevronUp } from 'react-icons/fa6';
import { AuthContext } from '../context/AuthContext';
import useQuickAdd from '../hooks/useQuickAdd';


// assets
import bgImage from '../assets/hero_sec_rate_service.png';
import shoe1 from '../assets/shoes1.png';
import schedule from '../assets/schedule.svg';
import courierCall from '../assets/call.svg';
import diamond from '../assets/diamond.svg';
import delivery from '../assets/delivery.svg';
import priority from '../assets/priority.svg';
import shoe2 from '../assets/shoe2.png';
import Footer from '../components/Footer';

/* -----------------------------
 | Motion variants (re‑usable) |
 ----------------------------- */
const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const zoomIn = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5 } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.2 } },
};

const RateAndServices = () => {
  const [services, setServices] = useState([]);
  const [featuredServices, setFeaturedServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hoveredDescriptionId, setHoveredDescriptionId] = useState(null);
  const [expandedDescriptions, setExpandedDescriptions] = useState({});
  const { user, isAuthenticated } = useContext(AuthContext);
  const { quickAdd, addingId } = useQuickAdd();
  
  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:10000';

  // Define the services we want to display
  const featuredServiceNames = ['Standard Klean', 'Deep Klean', 'Triple Threat'];

  useEffect(() => {
    const fetchServices = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${backendUrl}/api/services/public/`);
        const allServices = response.data;
        setServices(allServices);
        
        // Check if user has claimed free service
        const hasClaimedFreeService = isAuthenticated && user?.free_signup_service_used;
        
        // Filter and sort to get only the featured services in the correct order
        const featured = featuredServiceNames
          .map(name => allServices.find(service => 
            service.name.toLowerCase().includes(name.toLowerCase())
          ))
          .filter(service => service !== undefined); // Remove any not found
        
        setFeaturedServices(featured);
        
      } catch (err) {
        setError('Failed to load services.');
        console.error('Error fetching services:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, [isAuthenticated, user]); // Add dependencies to re-run when auth state changes

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

  return (
    <div className="bg-white">

      {/* CLEAN ALL TYPES */}
      <section className="bg-[#1E1E1E]">
        <div className="grid grid-cols-1 md:grid-cols-2 items-center py-6">
          {/* Text comes first on mobile, second on desktop */}
          <motion.div
            className="order-1 lg:order-2 pb-[2rem] lg:pr-24 px-4 lg:px-0 mt-[2rem] lg:mt-0"
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <h2 className="text-[#007F03] text-3xl lg:text-6xl font-bold header mb-4 lg:leading-[4.5rem]">
              <span className="text-white">We </span>
              Clean All
              <br className='hidden lg:block' />
              <span className="text-white"> Types of </span>
              Sneakers
            </h2>
            <p className="text-white text-lg">
              High-tops and low-tops, canvas, leather, suede, mesh and knit. Everyday pairs and limited editions.
            </p>
          </motion.div>

          {/* Image comes second on mobile, first on desktop */}
          <motion.img
            src={shoe1}
            alt="All Sneakers"
            className="order-2 lg:order-1 w-full h-full object-cover"
            variants={zoomIn}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          />
        </div>
      </section>

      {/* SERVICE PRICING */}
      <section className="bg-white py-16 px-4 md:px-8 lg:px-24" id="pricing">
        <h2 className="text-primary header text-4xl md:text-6xl font-bold text-center">Service Pricing</h2>
        <p className="text-gray-600 text-center mb-16 mt-1">Priced per pair, in GHS.</p>
        
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
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
          >
            {featuredServices.map((service, i) => {
              const status = getServiceStatus(service.name);
              const isExpanded = expandedDescriptions[service.id];
              const hasClaimedFreeService = isAuthenticated && user?.free_signup_service_used;
              
              return (
                <motion.div key={service.id} className="border shadow-lg border-gray-300 rounded-lg hover:border-primary hover:shadow-xl transition overflow-hidden relative group" variants={fadeInUp}>
                  {/* Slanted Delivery Ribbon */}
                  <div className="absolute top-0 right-0 w-28 h-28 overflow-hidden z-20 pointer-events-none">
                    <div className={`absolute top-0 right-0 w-[140%] h-7 flex items-center justify-center text-[10px] font-black uppercase tracking-widest text-white shadow-sm transform translate-x-[30%] translate-y-[80%] rotate-45 
                      ${status.isPriority ? 'bg-gradient-to-r from-orange-500 to-yellow-500' : 'bg-gradient-to-r from-emerald-600 to-green-500'}`}>
                      {status.bannerText}
                    </div>
                  </div>

                  {/* Free Service Badge - only show if this service is the free one AND user hasn't claimed it */}
                  {service.is_free_signup_service && !hasClaimedFreeService && (
                    <div className="absolute top-4 left-0 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-r-full shadow-lg z-10 flex items-center gap-1">
                      FREE
                    </div>
                  )}

                  <div className="flex flex-col h-full">
                    <div className="flex-grow flex flex-col">
                      <div className="relative h-80 w-full overflow-hidden bg-gray-100">
                        <img 
                          src={service.image} 
                          alt={service.name} 
                          className="h-full w-full object-cover group-hover:scale-105 transition duration-500" 
                        />
                      </div>
                   
                    
                      <div className="p-6 space-y-4 flex flex-col flex-grow">
                        <h3 className="text-xl text-primary mb-2 font-semibold">{service.name}</h3>
                        
                        {/* Delivery Badge */}
                        <div className={`inline-flex items-center gap-1.5 w-fit px-2.5 py-1 rounded-full text-[10px] font-semibold border 
                          ${status.isPriority ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {status.badgeText}
                        </div>

                        {/* Description with Tooltip (Desktop) and Read More (Mobile) */}
                        <div className="relative flex-grow">
                          {/* Desktop: Tooltip on hover */}
                          <div 
                            className="hidden md:block"
                            onMouseEnter={() => setHoveredDescriptionId(service.id)}
                            onMouseLeave={() => setHoveredDescriptionId(null)}
                          >
                            <p className="text-gray-600 text-sm line-clamp-2 cursor-help leading-relaxed">
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
                              <p className={`text-gray-600 text-sm leading-relaxed transition-all duration-300 ${isExpanded ? '' : 'line-clamp-2'}`}>
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

                        <div className="mt-4 bg-primary text-white inline-flex items-center px-4 py-2 tracking-widest w-fit">
                          <span className="font-medium">PRICE </span>
                          <span className="mx-2">|</span>
                          <span className={service.is_free_signup_service && !hasClaimedFreeService ? 'text-yellow-300' : ''}>
                            {service.is_free_signup_service && !hasClaimedFreeService ? 'FREE' : `₵${service.price}`}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => quickAdd(service)}
                          disabled={addingId === service.id}
                          className="w-full mt-2 bg-gray-900 text-white font-semibold py-3 rounded-lg hover:bg-primary transition disabled:opacity-60"
                        >
                          {addingId === service.id ? 'Adding…' : 'Add to cart'}
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
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

      {/* CUSTOMER EXPERIENCE */}
      <section className="px-4 md:px-8 lg:px-24 py-16 bg-white">
        <h2 className="text-4xl md:text-6xl font-bold text-primary header text-center mb-4">Customer Experience</h2>
        <p className="text-gray-600 text-center mb-10">How a booking works.</p>
        <motion.div
          className="grid grid-cols-1 md:grid-cols-5 gap-6"
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          {[{
            icon: schedule,
            title: 'Book a pickup',
            desc: 'Add your Klean to the cart, choose a pickup time at checkout, and our courier collects your pair.',
            link: '/#services',
            linkText: 'Book a Klean',
          }, {
            icon: courierCall,
            title: 'Courier call',
            desc: 'Our courier calls to confirm on the pickup day.',
          }, {
            icon: diamond,
            title: 'Cleaned by hand',
            desc: 'The right brush, product and drying for each material.',
          }, {
            icon: delivery,
            title: 'Back in 72 hours',
            desc: 'Your pair comes back clean, usually within 72 hours.',
          }, {
            icon: priority,
            title: 'Next-day Priority',
            desc: 'Need them sooner? Priority Klean (₵70 a pair) comes back the next day.',
          }].map((card, idx) => (
            <motion.div key={idx} className="p-6 border border-gray-300 rounded-lg hover:shadow-xl hover:scale-[1.02] transition" variants={fadeInUp}>
              <img src={card.icon} alt={card.title} className="w-14 h-14 mb-4" />
              <h3 className="text-xl font-semibold text-primary mb-2">{card.title}</h3>
              <p className="text-gray-600 mb-4 text-sm leading-relaxed">{card.desc}</p>
              {card.link && (
                <Link to={card.link} className="bg-primary text-white px-4 py-2 rounded hover:bg-green-700 transition text-sm inline-block">
                  {card.linkText}
                </Link>
              )}
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* TAILORED SERVICES */}
      <section className="bg-white relative overflow-hidden py-16">
        {/* desktop bg image */}
        <img src={shoe2} alt="bg" className="hidden lg:block absolute right-0 -top-20 h-[40rem] w-auto object-contain pointer-events-none" />

        <motion.div className="relative z-10 px-4 md:px-8 lg:px-24" variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
          <div className="max-w-xl space-y-6">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary header">Tailored Services For Your Needs</h2>
            <p className="text-gray-600 text-base md:text-lg">
              Athlete, collector or everyday wearer: every pair that comes
              through the studio is cleaned by hand and checked before it
              goes back to you.
            </p>
          </div>
        </motion.div>

        {/* mobile bg image */}
        <img src={shoe2} alt="bg mobile" className="block lg:hidden w-full object-contain mt-8" />
      </section>

      {/* FOOTER */}
      <Footer />
    </div>
  );
};

export default RateAndServices;