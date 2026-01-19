// src/components/Services.jsx
import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { CartContext } from '../context/CartContext';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import bgImage from '../assets/kleankickx_care.png';
import { motion } from 'framer-motion';
import Footer from '../components/Footer';
import { FaSpinner } from 'react-icons/fa6';
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
  const { cart, addToCart } = useContext(CartContext);
  const [loading, setLoading] = useState(true);
  const { api, discounts } = useContext(AuthContext);

  const signupDiscount = discounts?.find(d => d.type === 'Signup Discount');
  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:10000';
  const navigate = useNavigate();

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

  // Centralized logic for naming and colors
  const getServiceStatus = (serviceName) => {
    const name = serviceName.toLowerCase();
    const isPriority = name.includes('priority') || name.includes('express') || name.includes('rush');
    
    return {
      isPriority,
      bannerText: isPriority ? 'NEXT DAY' : '48 HOURS',
      badgeText: isPriority ? 'delivered next day' : 'delivered in 48h'
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

  return (
    <>
      <section className="bg-cover bg-center h-[15rem] relative" style={{ backgroundImage: `url(${bgImage})` }}>
        <div className="absolute inset-0 bg-black/50" />
        <motion.div className="relative h-full px-4 md:px-8 lg:px-24 flex flex-col text-left justify-center" variants={fadeInUp} initial="hidden" animate="visible">
          <h1 className="text-white text-3xl md:text-5xl font-bold header">
            <span className="text-primary">Schedule </span> a Klean
          </h1>
          <p className="text-white lg:text-lg mt-[2rem] max-w-2xl">
            At Kleankickx, we're passionate about bringing your favorite footwear back to life.
          </p>
        </motion.div>
      </section>
      
      <div className="bg-[#edf1f4] py-12 px-4" id="services">
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
                
                return (
                  <motion.div
                    key={service.id}
                    className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-300 relative group flex flex-col"
                    variants={fadeInUp}
                  >
                    {/* --- SLANTED RIBBON BANNER --- */}
                    <div className="absolute top-0 right-0 w-32 h-32 overflow-hidden z-20 pointer-events-none">
                      <div className={`absolute top-0 right-0 w-[140%] h-8 flex items-center justify-center text-[10px] font-black uppercase tracking-widest text-white shadow-sm transform translate-x-[30%] translate-y-[100%] rotate-45 
                        ${status.isPriority ? 'bg-gradient-to-r from-orange-500 to-yellow-500' : 'bg-gradient-to-r from-emerald-600 to-green-500'}`}>
                        {status.bannerText}
                      </div>
                    </div>

                    {/* Image Container */}
                    <div className="relative h-56 overflow-hidden bg-gray-100">
                      <img
                        src={service.image}
                        alt={service.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      {signupDiscount && (
                        <div className="absolute top-4 left-0 bg-primary text-white text-[10px] font-bold px-3 py-1 rounded-r-full shadow-lg">
                          {parseInt(signupDiscount.percentage)}% OFF SIGNUP
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-6 flex flex-col flex-grow">
                      <div className="flex items-start justify-between mb-2 gap-2">
                        <h3 className="text-lg font-bold text-gray-800 leading-tight">{service.name}</h3>
                      </div>

                      {/* Pill Badge */}
                      <div className={`inline-flex items-center gap-1.5 w-fit px-2.5 py-1 rounded-full text-[10px] font-semibold border mb-4 
                        ${status.isPriority ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {status.badgeText}
                      </div>

                      <p className="text-gray-500 text-sm line-clamp-2 mb-6 flex-grow">
                        {service.description}
                      </p>

                      <div className="mt-auto border-t border-gray-200 pt-4">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                             <p className="text-xs text-gray-400 line-through">₵{service.price * 1.3}</p>
                             <p className="text-xl font-black text-primary">₵{service.price}</p>
                          </div>
                        </div>

                        <button
                          onClick={() => handleAddToCart(service.id, service.name, service.price)}
                          className="w-full bg-primary hover:bg-primary/80 cursor-pointer text-white py-3 rounded-xl font-bold text-sm transition-all duration-300 transform active:scale-95 shadow-md hover:shadow-primary/20"
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