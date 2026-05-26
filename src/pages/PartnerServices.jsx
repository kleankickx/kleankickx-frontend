// src/pages/PartnerServices.jsx
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { 
  ShoppingCart, Plus, Minus, Package, Truck, AlertCircle, 
  ChevronLeft, ChevronRight, ShoppingBag, CheckCircle,
  Edit2
} from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../api';

const PartnerServices = () => {
  const navigate = useNavigate();
  const { user, isPartner } = useContext(AuthContext);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantities, setQuantities] = useState({});
  const [customQuantities, setCustomQuantities] = useState({});
  const [checkoutItems, setCheckoutItems] = useState([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingQuantity, setEditingQuantity] = useState(null);

  useEffect(() => {
    if (!isPartner) {
      navigate('/auth/login');
      return;
    }
    fetchServices();
  }, [isPartner, navigate]);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/services/partner/');
      const servicesData = response.data.services || response.data;
      setServices(servicesData);
      console.log('Partner services loaded:', servicesData);
    } catch (error) {
      console.error('Failed to fetch services:', error);
      toast.error('Failed to load wholesale services');
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = (serviceId, delta) => {
    setQuantities(prev => {
      const current = prev[serviceId] || 0;
      const newQty = Math.max(0, current + delta);
      if (newQty === 0) {
        const { [serviceId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [serviceId]: newQty };
    });
    setCustomQuantities(prev => ({ ...prev, [serviceId]: '' }));
  };

  const handleCustomQuantityChange = (serviceId, value) => {
    const numValue = parseInt(value, 10);
    setCustomQuantities(prev => ({ ...prev, [serviceId]: value }));
    
    if (!isNaN(numValue) && numValue >= 0) {
      setQuantities(prev => ({ ...prev, [serviceId]: numValue }));
    } else if (value === '') {
      setQuantities(prev => {
        const { [serviceId]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  const handleCustomQuantityBlur = (serviceId) => {
    const value = customQuantities[serviceId];
    const numValue = parseInt(value, 10);
    
    if (!isNaN(numValue) && numValue >= 0) {
      if (numValue === 0) {
        setQuantities(prev => {
          const { [serviceId]: _, ...rest } = prev;
          return rest;
        });
        setCustomQuantities(prev => ({ ...prev, [serviceId]: '' }));
      }
    } else {
      const currentQty = quantities[serviceId] || 0;
      setCustomQuantities(prev => ({ ...prev, [serviceId]: currentQty || '' }));
    }
    setEditingQuantity(null);
  };

  const addToCheckout = (service) => {
    const quantity = quantities[service.id] || 0;
    if (quantity === 0) {
      toast.info('Please select a quantity first');
      return;
    }
    
    setCheckoutItems(prev => {
      const existing = prev.find(item => item.id === service.id);
      if (existing) {
        return prev.map(item =>
          item.id === service.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { 
        ...service, 
        quantity,
        service_id: service.id,
        unit_price: parseFloat(service.price)
      }];
    });
    
    setQuantities(prev => {
      const { [service.id]: _, ...rest } = prev;
      return rest;
    });
    setCustomQuantities(prev => ({ ...prev, [service.id]: '' }));
    
    toast.success(`Added ${quantity} x ${service.name} to order`);
    
    if (checkoutItems.length === 0) {
      setTimeout(() => setShowCheckout(true), 500);
    }
  };

  const removeFromCheckout = (serviceId) => {
    setCheckoutItems(prev => prev.filter(item => item.id !== serviceId));
    toast.info('Item removed from order');
  };

  const updateCheckoutQuantity = (serviceId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCheckout(serviceId);
    } else {
      setCheckoutItems(prev =>
        prev.map(item =>
          item.id === serviceId ? { ...item, quantity: newQuantity } : item
        )
      );
    }
  };

  const calculateSubtotal = () => {
    return checkoutItems.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
  };

  const calculateTotal = () => {
    return calculateSubtotal();
  };

  const handleProceedToCheckout = () => {
    if (checkoutItems.length === 0) {
      toast.error('Your order is empty');
      return;
    }
    
    localStorage.setItem('partner_checkout_items', JSON.stringify(checkoutItems));
    navigate('/partner/checkout');
  };

  const getTotalItemsCount = () => {
    return checkoutItems.reduce((sum, item) => sum + item.quantity, 0);
  };

  const ServiceCard = ({ service }) => {
    const quantity = quantities[service.id] || 0;
    const customValue = customQuantities[service.id] || '';
    const price = parseFloat(service.price);
    const isEditing = editingQuantity === service.id;
    
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-300">
        {service.image && (
          <div className="relative h-48 overflow-hidden bg-gray-100">
            <img
              src={service.image}
              alt={service.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                e.target.src = 'https://via.placeholder.com/400x300?text=No+Image';
              }}
            />
            {service.is_wholesale && (
              <div className="absolute top-3 right-3 bg-primary text-white text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1">
                <Truck size={12} />
                <span>Wholesale</span>
              </div>
            )}
            {service.included_quantity > 0 && (
              <div className="absolute bottom-3 left-3 bg-black/60 text-white text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1">
                <Package size={12} />
                <span>Min Order: {service.included_quantity}</span>
              </div>
            )}
          </div>
        )}
        
        <div className="p-5">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{service.name}</h3>
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">{service.description}</p>
          
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-2xl font-bold text-primary">
                GHS {price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-gray-500">per service</p>
            </div>
          </div>

          {/* Quantity Selector with Always Visible Edit Icon */}
          <div className="flex flex-col gap-3 mt-4 pt-4 border-t border-gray-100">
            <label className="text-sm font-medium text-gray-700">Quantity (pairs)</label>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => updateQuantity(service.id, -1)}
                  disabled={quantity === 0}
                  className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Minus size={16} />
                </button>
                
                {isEditing ? (
                  <input
                    type="number"
                    value={customValue}
                    onChange={(e) => handleCustomQuantityChange(service.id, e.target.value)}
                    onBlur={() => handleCustomQuantityBlur(service.id)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleCustomQuantityBlur(service.id);
                      }
                    }}
                    autoFocus
                    min="0"
                    step="1"
                    className="w-20 text-center py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                ) : (
                  <div 
                    className="flex items-center gap-2 cursor-pointer bg-gray-50 px-3 py-1 rounded-lg hover:bg-gray-100 transition-colors"
                    onClick={() => setEditingQuantity(service.id)}
                  >
                    <span className="font-bold text-xl w-12 text-center text-gray-900">
                      {quantity}
                    </span>
                    <Edit2 size={14} className="text-gray-500" />
                  </div>
                )}
                
                <button
                  onClick={() => updateQuantity(service.id, 1)}
                  className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  <Plus size={16} />
                </button>
              </div>
              
              <button
                onClick={() => addToCheckout(service)}
                disabled={quantity === 0}
                className="px-5 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all"
              >
                <ShoppingCart size={16} />
                <span>Add to Order</span>
              </button>
            </div>
            {service.included_quantity > 0 && quantity > 0 && quantity < service.included_quantity && (
              <p className="text-xs text-amber-600 flex items-center gap-1">
                <AlertCircle size={12} />
                Minimum quantity is {service.included_quantity} pairs
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading wholesale services...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/90 text-white sticky top-0 z-10 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <button
                onClick={() => navigate('/partner/dashboard')}
                className="flex items-center gap-2 text-white/80 hover:text-white mb-2 transition-colors group"
              >
                <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                <span>Back to Dashboard</span>
              </button>
              <div className="flex items-center gap-3">
                <Package className="h-8 w-8" />
                <div>
                  <h1 className="text-2xl font-bold">Wholesale Services</h1>
                  <p className="mt-1 text-white/80 text-sm">
                    Browse our wholesale catalog and place bulk orders
                  </p>
                </div>
              </div>
            </div>
            
            {/* Order Summary Button */}
            {checkoutItems.length > 0 && (
              <button
                onClick={() => setShowCheckout(true)}
                className="bg-white text-primary px-5 py-3 rounded-lg font-semibold flex items-center gap-3 shadow-lg hover:shadow-xl transition-all"
              >
                <ShoppingBag size={20} />
                <div className="text-left">
                  <p className="text-xs text-gray-500">Ready to order</p>
                  <p className="font-bold">{getTotalItemsCount()} items · GHS {calculateTotal().toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                </div>
                <ChevronRight size={18} />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {services.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm">
            <Package className="mx-auto h-16 w-16 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No services available</h3>
            <p className="mt-2 text-gray-500">
              Please check back later for wholesale services.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        )}
      </div>

      {/* Checkout Modal */}
      {showCheckout && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Review Your Order</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {getTotalItemsCount()} item(s) · {checkoutItems.length} service(s)
                </p>
              </div>
              <button
                onClick={() => setShowCheckout(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[55vh]">
              {checkoutItems.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-gray-500">Your order is empty</p>
                  <button
                    onClick={() => setShowCheckout(false)}
                    className="mt-4 text-primary hover:underline"
                  >
                    Continue Shopping
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {checkoutItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between py-3 border-b border-gray-100">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{item.name}</h3>
                        <p className="text-sm text-gray-500">
                          GHS {item.unit_price.toLocaleString(undefined, { minimumFractionDigits: 2 })} each
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => updateCheckoutQuantity(item.id, item.quantity - 1)}
                          className="p-1 rounded bg-gray-100 hover:bg-gray-200 transition-colors"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-8 text-center font-medium text-gray-900">{item.quantity}</span>
                        <button
                          onClick={() => updateCheckoutQuantity(item.id, item.quantity + 1)}
                          className="p-1 rounded bg-gray-100 hover:bg-gray-200 transition-colors"
                        >
                          <Plus size={14} />
                        </button>
                        <span className="w-24 text-right font-medium text-gray-900">
                          GHS {(item.unit_price * item.quantity).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                        <button
                          onClick={() => removeFromCheckout(item.id)}
                          className="text-red-500 hover:text-red-700 transition-colors"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="sticky bottom-0 bg-white border-t px-6 py-4">
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal ({getTotalItemsCount()} items)</span>
                  <span>GHS {calculateSubtotal().toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                  <span>Total</span>
                  <span className="text-primary text-xl">GHS {calculateTotal().toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCheckout(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Continue Shopping
                </button>
                <button
                  onClick={handleProceedToCheckout}
                  disabled={checkoutItems.length === 0}
                  className="flex-1 bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors shadow-md"
                >
                  <CheckCircle size={18} />
                  <span>Proceed to Checkout</span>
                </button>
              </div>
              
              <p className="text-xs text-center text-gray-400 mt-3">
                By placing this order, you agree to our wholesale terms and conditions
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Floating Cart Indicator */}
      {checkoutItems.length > 0 && !showCheckout && (
        <div className="fixed bottom-6 right-6 z-40">
          <button
            onClick={() => setShowCheckout(true)}
            className="bg-primary text-white px-5 py-3 rounded-full font-semibold flex items-center gap-3 shadow-lg hover:shadow-xl transition-all animate-bounce"
          >
            <ShoppingBag size={20} />
            <span className="font-bold">{getTotalItemsCount()} items</span>
            <span className="bg-white/20 px-2 py-1 rounded-full text-sm">
              GHS {calculateTotal().toLocaleString(undefined, { minimumFractionDigits: 0 })}
            </span>
          </button>
        </div>
      )}
    </div>
  );
};

export default PartnerServices;