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


// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: 'easeOut',
    },
  },
};


// staggered animation
const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } },
};


const Services = () => {
  const [services, setServices] = useState([]);
  const [error, setError] = useState('');
  const { cart, addToCart } = useContext(CartContext);
  const [loading, setLoading] = useState(true);
  const { api } = useContext(AuthContext)

  // backend URL from environment variable
  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000';

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

  // Function to handle adding a service to the cart
  const handleAddToCart = (serviceId, serviceName, servicePrice) => {
    const isInCart = cart.some(item => item.service_id === serviceId);
    if (isInCart) {
      toast.info(`${serviceName} is already in your cart!`, {
        position: 'top-right',
      });
    } else {
      // Add service to cart
      addToCart(serviceId, serviceName, servicePrice);
      toast.success(`${serviceName} has been added to your cart!`, {
        position: 'top-right',
      });
    }
    navigate('/cart');
  };

  return ( 
    <>
      <section className="bg-cover bg-center h-[15rem] lg:h-[20rem] relative" style={{ backgroundImage: `url(${bgImage})` }}>
        <div className="absolute inset-0 bg-black/30" />
        <motion.div
          className="relative h-full px-4 pt-[8rem] md:px-8 lg:px-24 flex flex-col lg:items-start text-center lg:text-left items-center"
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
        >
          <h1 className="text-white text-3xl md:text-5xl font-bold header">
            <span className="text-primary">Schedule </span> a Klean
          </h1>
          
          
          {/* button to scroll to services */}
          {/* <motion.button
            onClick={() => window.scrollTo({ top: document.getElementById('services').offsetTop, behavior: 'smooth' })}
            className="bg-[#007F03] cursor-pointer hover:bg-green-700 text-white px-6 py-3 rounded mt-8 inline-block active:scale-95 transition duration-200 focus:outline-none"
            variants={zoomIn}
          >
            Explore Our Services
          </motion.button> */}
        </motion.div>
      </section>
      <div className="bg-[#edf1f4] py-8 px-4" id="services">

          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-primary mb-1 w-fit">
              Shop From Categories
            </h2>
            <p className="text-gray-600 mb-6">
              We offer a range of services to help you maintain a clean sneakers.
            </p>

            {loading && (
              <div className="flex flex-col items-center justify-center h-[50vh]">
                <FaSpinner className="animate-spin h-8 w-8 text-primary" />
                <p className="text-gray-600 mt-4">Loading services...</p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md shadow-sm mb-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-red-800">
                      {error}
                    </p>
                  </div>
                  <button
                    onClick={() => window.location.reload()}
                    className="ml-4 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors cursor-pointer"
                  >
                    Retry
                    <svg className="ml-1 -mr-0.5 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            <motion.div 
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            >
              {services.map((service, index) => (
                <motion.div
                key={service.id}
                className="bg-white rounded shadow-md overflow-hidden border border-gray-200 hover:shadow-2xl transition duration-300 relative group"
                variants={fadeInUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
              >
                <div className="w-full flex items-center justify-center overflow-hidden">
                  <img
                    src={service.image}
                    alt={service.name}
                    className="h-full w-full object-cover transition-transform duration-300 transform group-hover:scale-105"
                  />
                </div>

                <div className="p-4">
                  <h3 className="text-xl font-handwritten text-primary mb-2">{service.name}</h3>
                  <p className="text-gray-700 text-sm h-16 overflow-hidden">
                    {service.description}
                  </p>

                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-gray-500 line-through">₵{
                        service.price === '50.00' ? '70' :
                        service.price === '100.00' ? '120' :
                        '150'
                    }</div>
                    <div className="text-lg font-bold text-primary">₵{service.price}</div>
                  </div>

                  <button
                    onClick={() => handleAddToCart(service.id, service.name, service.price)}
                    className="mt-4 w-full bg-primary hover:bg-primary/80 text-white py-2 rounded font-medium cursor-pointer transition duration-200 focus:outline-none"
                    aria-label={`Add ${service.name} to cart`}
                  >
                    ADD TO CART
                  </button>
                </div>

                <div className="absolute top-0 right-0 bg-primary text-white text-xs px-2 py-1 rounded-bl">
                  10% OFF
                </div>
                </motion.div>

              ))}

            </motion.div>


          </div>
      </div>
      <Footer />
    </>
  );
};



export default Services;
