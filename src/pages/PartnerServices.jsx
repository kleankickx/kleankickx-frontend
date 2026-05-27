// src/pages/PartnerServices.jsx
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { 
  ShoppingCart, Plus, Minus, Package, Truck, 
  ChevronLeft, ShoppingBag, CheckCircle, X, 
  Search, Filter, Grid, List, Sparkles
} from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../api';

const PartnerServices = () => {
  const navigate = useNavigate();
  const { user, isPartner } = useContext(AuthContext);
  const [services, setServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantities, setQuantities] = useState({});
  const [checkoutItems, setCheckoutItems] = useState([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid');

  useEffect(() => {
    if (!isPartner) {
      navigate('/auth/login');
      return;
    }
    fetchServices();
  }, [isPartner, navigate]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = services.filter(service =>
        service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredServices(filtered);
    } else {
      setFilteredServices(services);
    }
  }, [searchTerm, services]);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/services/partner/');
      const servicesData = response.data.services || response.data;
      setServices(servicesData);
      setFilteredServices(servicesData);
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
  };

  const addToCheckout = (service) => {
    const quantity = quantities[service.id] || 0;
    if (quantity === 0) {
      toast.info('Please select a quantity first');
      return;
    }
    
    setCheckoutItems(prev => {
      const existing = prev.find(item => item.id === service.id);
      const unitPrice = parseFloat(service.price) || 0;
      
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
        unit_price: unitPrice
      }];
    });
    
    setQuantities(prev => {
      const { [service.id]: _, ...rest } = prev;
      return rest;
    });
    
    toast.success(`Added ${quantity} x ${service.name}`);
    
    if (checkoutItems.length === 0) {
      setTimeout(() => setShowCheckout(true), 500);
    }
  };

  const removeFromCheckout = (serviceId) => {
    setCheckoutItems(prev => prev.filter(item => item.id !== serviceId));
    toast.info('Item removed');
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

  const calculateTotal = () => {
    return checkoutItems.reduce((sum, item) => {
      const price = parseFloat(item.unit_price) || 0;
      const qty = parseInt(item.quantity) || 0;
      return sum + (price * qty);
    }, 0);
  };

  const getTotalItemsCount = () => {
    return checkoutItems.reduce((sum, item) => sum + (parseInt(item.quantity) || 0), 0);
  };

  const handleProceedToCheckout = () => {
    if (checkoutItems.length === 0) {
      toast.error('Your order is empty');
      return;
    }
    localStorage.setItem('partner_checkout_items', JSON.stringify(checkoutItems));
    navigate('/partner/checkout');
  };

  const formatPrice = (price) => {
    const num = parseFloat(price);
    return isNaN(num) ? '0.00' : num.toFixed(2);
  };

  const ServiceCard = ({ service }) => {
    const quantity = quantities[service.id] || 0;
    const price = parseFloat(service.price) || 0;
    
    return (
      <div className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-primary/20">
        {/* Image Section */}
        <div className="relative h-48 overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
          {service.image ? (
            <img
              src={service.image}
              alt={service.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              onError={(e) => {
                e.target.src = `https://placehold.co/400x300/e2e8f0/64748b?text=${encodeURIComponent(service.name)}`;
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package size={48} className="text-gray-300" />
            </div>
          )}
          
          {/* Badges */}
          <div className="absolute top-3 right-3 flex gap-2">
            {service.is_wholesale && (
              <span className="bg-primary/90 backdrop-blur-sm text-white text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-lg">
                <Truck size={12} />
                Wholesale
              </span>
            )}
          </div>
          
          {service.included_quantity > 0 && (
            <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm text-white text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
              <Package size={12} />
              Min: {service.included_quantity}
            </div>
          )}
        </div>
        
        {/* Content */}
        <div className="p-5">
          <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-1">{service.name}</h3>
          <p className="text-gray-500 text-sm mb-3 line-clamp-2">{service.description}</p>
          
          <div className="mb-4">
            <span className="text-2xl font-bold text-primary">
              GH₵ {price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
            <span className="text-xs text-gray-400 ml-1">/service</span>
          </div>
          
          {/* Quantity Selector */}
          <div className="flex items-center justify-between gap-3 pt-3 border-t border-gray-100">
            <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-1">
              <button
                onClick={() => updateQuantity(service.id, -1)}
                disabled={quantity === 0}
                className="w-8 h-8 rounded-lg flex items-center justify-center bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                <Minus size={14} />
              </button>
              <span className="w-10 text-center font-semibold text-gray-800">
                {quantity}
              </span>
              <button
                onClick={() => updateQuantity(service.id, 1)}
                className="w-8 h-8 rounded-lg flex items-center justify-center bg-white text-gray-600 hover:bg-gray-100 transition-all shadow-sm"
              >
                <Plus size={14} />
              </button>
            </div>
            
            <button
              onClick={() => addToCheckout(service)}
              disabled={quantity === 0}
              className="flex-1 bg-primary text-white py-2.5 rounded-xl font-medium hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <ShoppingCart size={16} />
              Add
            </button>
          </div>
          
          {service.included_quantity > 0 && quantity > 0 && quantity < service.included_quantity && (
            <p className="mt-2 text-xs text-amber-600 flex items-center gap-1">
              Minimum order is {service.included_quantity} units
            </p>
          )}
        </div>
      </div>
    );
  };

  const ServiceListItem = ({ service }) => {
    const quantity = quantities[service.id] || 0;
    const price = parseFloat(service.price) || 0;
    
    return (
      <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          {/* Image */}
          <div className="w-full sm:w-24 h-24 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
            {service.image ? (
              <img
                src={service.image}
                alt={service.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = `https://placehold.co/100x100/e2e8f0/64748b?text=${encodeURIComponent(service.name.substring(0, 3))}`;
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package size={32} className="text-gray-300" />
              </div>
            )}
          </div>
          
          {/* Info */}
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900 mb-1">{service.name}</h3>
            <p className="text-gray-500 text-sm mb-2 line-clamp-1">{service.description}</p>
            <div className="flex items-center gap-3">
              <span className="text-xl font-bold text-primary">
                GH₵ {price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
              {service.is_wholesale && (
                <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">Wholesale</span>
              )}
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-1">
              <button
                onClick={() => updateQuantity(service.id, -1)}
                disabled={quantity === 0}
                className="w-8 h-8 rounded-lg flex items-center justify-center bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-40 transition-all"
              >
                <Minus size={14} />
              </button>
              <span className="w-10 text-center font-semibold">{quantity}</span>
              <button
                onClick={() => updateQuantity(service.id, 1)}
                className="w-8 h-8 rounded-lg flex items-center justify-center bg-white text-gray-600 hover:bg-gray-100 transition-all"
              >
                <Plus size={14} />
              </button>
            </div>
            <button
              onClick={() => addToCheckout(service)}
              disabled={quantity === 0}
              className="bg-primary text-white px-4 py-2 rounded-xl font-medium hover:bg-primary/90 disabled:opacity-40 transition-all flex items-center gap-2"
            >
              <ShoppingCart size={16} />
              Add
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-500 font-medium">Loading services...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-gradient-to-r from-primary to-primary/90 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/partner/dashboard')}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold">Wholesale Services</h1>
                <p className="text-sm text-white/80 hidden sm:block">Browse and add items to your order</p>
              </div>
            </div>
            
            {checkoutItems.length > 0 && (
              <button
                onClick={() => setShowCheckout(true)}
                className="bg-white/10 backdrop-blur-sm hover:bg-white/20 px-4 py-2.5 rounded-xl font-semibold flex items-center gap-3 transition-all"
              >
                <ShoppingBag size={18} />
                <span className="hidden sm:inline">{getTotalItemsCount()} items</span>
                <span className="bg-white/20 px-2 py-0.5 rounded-lg text-sm">
                  GH₵ {calculateTotal().toLocaleString(undefined, { minimumFractionDigits: 0 })}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Search and View Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search services..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
            />
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-primary text-white shadow-md' : 'bg-white text-gray-500 hover:bg-gray-100'}`}
            >
              <Grid size={18} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-primary text-white shadow-md' : 'bg-white text-gray-500 hover:bg-gray-100'}`}
            >
              <List size={18} />
            </button>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="bg-white rounded-xl p-4 mb-6 shadow-sm border border-gray-100">
          <div className="flex flex-wrap justify-between items-center gap-3">
            <div className="flex items-center gap-2 text-gray-600">
              <Sparkles size={18} className="text-primary" />
              <span className="text-sm">
                <span className="font-semibold text-gray-900">{filteredServices.length}</span> services available
              </span>
            </div>
            {checkoutItems.length > 0 && (
              <div className="flex items-center gap-2 text-primary">
                <ShoppingBag size={18} />
                <span className="text-sm font-medium">
                  {getTotalItemsCount()} items · GH₵ {calculateTotal().toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Services Grid/List */}
        {filteredServices.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
            <Package className="mx-auto h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No services found</h3>
            <p className="text-gray-500">
              {searchTerm ? 'Try adjusting your search' : 'No wholesale services available yet'}
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredServices.map((service) => (
              <ServiceListItem key={service.id} service={service} />
            ))}
          </div>
        )}
      </div>

      {/* Checkout Modal */}
      {showCheckout && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowCheckout(false)}>
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[85vh] overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b px-5 py-4 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold">Review Order</h2>
                <p className="text-xs text-gray-500">{getTotalItemsCount()} item(s) selected</p>
              </div>
              <button onClick={() => setShowCheckout(false)} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto max-h-[50vh] space-y-3">
              {checkoutItems.map((item, index) => {
                const price = parseFloat(item.unit_price) || 0;
                const qty = parseInt(item.quantity) || 0;
                const isLast = index === checkoutItems.length - 1;
                
                return (
                  <div 
                    key={item.id} 
                    className={`flex justify-between items-center py-2 ${!isLast ? 'border-b border-gray-100' : ''}`}
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-800 text-sm">{item.name}</p>
                      <p className="text-xs text-gray-400">GH₵ {price.toFixed(2)} each</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateCheckoutQuantity(item.id, qty - 1)}
                        className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="w-8 text-center font-medium text-sm">{qty}</span>
                      <button
                        onClick={() => updateCheckoutQuantity(item.id, qty + 1)}
                        className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                      >
                        <Plus size={12} />
                      </button>
                      <button
                        onClick={() => removeFromCheckout(item.id)}
                        className="text-red-400 hover:text-red-600 ml-1"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="sticky bottom-0 bg-white border-t px-5 py-4">
              <div className="flex justify-between items-center mb-3">
                <span className="font-semibold">Total</span>
                <span className="text-xl font-bold text-primary">
                  GH₵ {calculateTotal().toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCheckout(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                >
                  Continue
                </button>
                <button
                  onClick={handleProceedToCheckout}
                  className="flex-1 bg-primary text-white py-2.5 rounded-xl font-semibold hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-md"
                >
                  <CheckCircle size={18} />
                  Checkout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Cart Button */}
      {checkoutItems.length > 0 && !showCheckout && (
        <button
          onClick={() => setShowCheckout(true)}
          className="fixed bottom-6 right-6 z-30 bg-primary text-white px-5 py-3 rounded-full font-semibold flex items-center gap-3 shadow-lg hover:shadow-xl transition-all animate-bounce"
        >
          <ShoppingBag size={20} />
          <span className="font-bold">{getTotalItemsCount()}</span>
          <span className="bg-white/20 px-2 py-0.5 rounded-full text-sm">
            GH₵ {calculateTotal().toLocaleString(undefined, { minimumFractionDigits: 0 })}
          </span>
        </button>
      )}
    </div>
  );
};

export default PartnerServices;