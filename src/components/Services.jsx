// src/components/Services.jsx
import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { CartContext } from '../context/CartContext';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';


const Services = () => {
  const [services, setServices] = useState([]);
  const [error, setError] = useState('');
  const { cart, addToCart } = useContext(CartContext);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchServices = async () => {
      setLoading(true);
      try {
        const response = await axios.get('http://127.0.0.1:8000/api/services/');
        setServices(response.data);
      } catch (err) {
        setError('Failed to load services.');
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, []);

  const handleAddToCart = (serviceId, serviceName) => {
    const isInCart = cart.some(item => item.service_id === serviceId);
    if (isInCart) {
      toast.info(`${serviceName} is already in your cart!`, {
        position: 'top-right',
      });
    } else {
      addToCart(serviceId);
      toast.success(`${serviceName} has been added to your cart!`, {
        position: 'top-right',
      });
    }
    navigate('/cart');
  };

  return ( 
    <div className="bg-[#edf1f4] py-16 px-4">
      
      <div className="max-w-6xl mx-auto">
       
        <h2 className="text-2xl md:text-3xl font-bold text-green-700 mb-8 border-b-4 border-green-600 w-fit">
          Shop From Categories
        </h2>
         {loading && (
        <div className="flex items-center justify-center h-[50vh]">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600"></div>
        </div>
        )}

        {error && (
          <div className="bg-red-100 text-red-700 p-4 rounded mb-4">{error}</div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <div
              key={service.id}
              className="bg-white rounded shadow-md overflow-hidden border border-gray-200 hover:shadow-xl transition duration-300 relative"
            >
              <div className="h-60 flex items-center justify-center">
                <img
                  src={service.image}
                  alt={service.name}
                  className="h-full object-contain w-full"
                />
              </div>

              <div className="p-4">
                <h3 className="text-xl font-handwritten text-green-700 mb-2">{service.name}</h3>
                <p className="text-gray-700 text-sm h-16 overflow-hidden">
                  {service.description}
                </p>

                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-gray-500 line-through">₵135.00</div>
                  <div className="text-lg font-bold text-green-600">₵{service.price}</div>
                </div>

                <button
                  onClick={() => handleAddToCart(service.id, service.name)}
                  className="mt-4 w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded font-medium cursor-pointer transition duration-200 focus:outline-none"
                  aria-label={`Add ${service.name} to cart`}
                >
                  ADD TO CART
                </button>
              </div>

              <div className="absolute top-0 right-0 bg-green-700 text-white text-xs px-2 py-1 rounded-bl">
                10% OFF
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};



export default Services;
