// src/pages/AdminPartnerManagement.jsx
import React, { useState, useEffect, useContext } from 'react';
import { toast } from 'react-toastify';
import { 
  Plus, Edit2, ShoppingCart, CheckCircle, XCircle,
  Building, Mail, Phone, MapPin, Truck, Calendar,
  Search, Filter, Download, Eye, RefreshCw
} from 'lucide-react';
import { APIProvider, Map } from '@vis.gl/react-google-maps';
import api from '../api';
import { AuthContext } from '../context/AuthContext';
import PlaceAutocompleteElementWrapper from '../components/PlaceAutoCompleteElementWrapper';
import MapHandler from '../components/MapHandler';

const AdminPartnerManagement = () => {
  const { user } = useContext(AuthContext);
  const [partners, setPartners] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showOrderDetailModal, setShowOrderDetailModal] = useState(false);
  
  // Data states
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [createdOrder, setCreatedOrder] = useState(null);
  const [orderItems, setOrderItems] = useState({});
  const [submitting, setSubmitting] = useState(false);
  
  // Google Maps
  const Maps_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const DEFAULT_CENTER = { lat: 5.6037, lng: -0.1870 };
  
  // Address states for order
  const [pickup, setPickup] = useState(null);
  const [delivery, setDelivery] = useState(null);
  const [useSame, setUseSame] = useState(false);
  const [pickupInputValue, setPickupInputValue] = useState('');
  const [deliveryInputValue, setDeliveryInputValue] = useState('');
  const [pickupRegion, setPickupRegion] = useState('');
  const [deliveryRegion, setDeliveryRegion] = useState('');
  const [pickupTime, setPickupTime] = useState(null);
  const [isFullService, setIsFullService] = useState(false);
  
  // Form data for partner creation
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    phone_number: '',
    company_name: '',
    corporate_email: '',
    tax_id: '',
    billing_address: '',
    is_active: true
  });

  useEffect(() => {
    if (!user?.is_staff && !user?.is_superuser) {
      toast.error('Access denied. Admin privileges required.');
      window.location.href = '/';
      return;
    }
    fetchPartners();
    fetchServices();
  }, [user]);

  const fetchPartners = async () => {
    try {
      const response = await api.get('/api/partner/admin/partners/');
      setPartners(response.data);
    } catch (error) {
      console.error('Failed to fetch partners:', error);
      toast.error('Failed to load partners');
    } finally {
      setLoading(false);
    }
  };

  const fetchServices = async () => {
    try {
      const response = await api.get('/api/partner/admin/services/');
      setServices(response.data);
    } catch (error) {
      console.error('Failed to fetch services:', error);
    }
  };

  const handlePlaceSelect = (location, type) => {
    if (type === 'pickup') {
      setPickup(location);
      setPickupInputValue(location ? location.address : '');
      setPickupRegion(location ? location.region : '');
      if (useSame && location) {
        setDelivery(location);
        setDeliveryInputValue(location.address);
        setDeliveryRegion(location.region);
      }
    } else {
      setDelivery(location);
      setDeliveryInputValue(location ? location.address : '');
      setDeliveryRegion(location ? location.region : '');
    }
  };

  const handleCreatePartner = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      await api.post('/api/partner/admin/partners/create/', formData);
      toast.success('Partner created successfully');
      setShowCreateModal(false);
      setFormData({
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        phone_number: '',
        company_name: '',
        corporate_email: '',
        tax_id: '',
        billing_address: '',
        is_active: true
      });
      fetchPartners();
    } catch (error) {
      console.error('Failed to create partner:', error);
      toast.error(error.response?.data?.error || 'Failed to create partner');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateOrder = async () => {
    const items = Object.entries(orderItems)
      .filter(([_, qty]) => qty > 0)
      .map(([serviceId, quantity]) => ({
        service_id: serviceId,
        quantity: quantity
      }));
    
    if (items.length === 0) {
      toast.error('Please add at least one item');
      return;
    }
    
    // Validate addresses for full service
    if (isFullService) {
      if (!pickup) {
        toast.error('Please select a pickup address');
        return;
      }
      if (!delivery && !useSame) {
        toast.error('Please select a delivery address');
        return;
      }
      if (!pickupTime) {
        toast.error('Please wait for pickup time to load');
        return;
      }
    }
    
    setSubmitting(true);
    
    try {
      const orderData = {
        partner_id: selectedPartner.id,
        items: items,
        is_self_handled: !isFullService,
      };
      
      if (isFullService) {
        orderData.pickup_location = pickup;
        orderData.delivery_location = delivery || pickup;
        orderData.pickup_time = pickupTime?.value || pickupTime;
        orderData.pickup_cost = pickup?.cost || 0;
        orderData.delivery_cost = delivery?.cost || pickup?.cost || 0;
      }
      
      const response = await api.post('/api/partner/admin/partners/orders/create/', orderData);
      
      setCreatedOrder(response.data);
      setShowOrderDetailModal(true);
      setShowOrderModal(false);
      toast.success(`Order #${response.data.order_reference} created for ${selectedPartner.company_name}`);
      fetchPartners();
      
      // Reset order form
      setOrderItems({});
      setPickup(null);
      setDelivery(null);
      setUseSame(false);
      setPickupTime(null);
      setIsFullService(false);
    } catch (error) {
      console.error('Failed to create order:', error);
      toast.error(error.response?.data?.error || 'Failed to create order');
    } finally {
      setSubmitting(false);
    }
  };

  const openOrderModal = (partner) => {
    setSelectedPartner(partner);
    setOrderItems({});
    setPickup(null);
    setDelivery(null);
    setUseSame(false);
    setPickupTime(null);
    setIsFullService(false);
    setShowOrderModal(true);
  };

  const updateOrderItemQuantity = (serviceId, quantity) => {
    setOrderItems(prev => ({
      ...prev,
      [serviceId]: Math.max(0, parseInt(quantity) || 0)
    }));
  };

  const calculateOrderTotal = () => {
    let total = 0;
    Object.entries(orderItems).forEach(([serviceId, quantity]) => {
      const service = services.find(s => s.id === serviceId);
      if (service && quantity > 0) {
        total += parseFloat(service.price) * quantity;
      }
    });
    // Add delivery/pickup costs for full service
    if (isFullService) {
      total += (pickup?.cost || 0) + (delivery?.cost || pickup?.cost || 0);
    }
    return total;
  };

  const filteredPartners = partners.filter(partner => {
    const matchesSearch = partner.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         partner.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && partner.is_active) ||
                         (statusFilter === 'inactive' && !partner.is_active);
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading partners...</p>
        </div>
      </div>
    );
  }

  return (
    <APIProvider apiKey={Maps_API_KEY} libraries={['places', 'geocoding']}>
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Partner Management</h1>
              <p className="text-sm text-gray-500 mt-1">Manage wholesale partners and create orders on their behalf</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 flex items-center gap-2 shadow-sm"
            >
              <Plus size={18} />
              Add New Partner
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
              <p className="text-sm text-gray-500">Total Partners</p>
              <p className="text-2xl font-bold text-gray-900">{partners.length}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
              <p className="text-sm text-gray-500">Active Partners</p>
              <p className="text-2xl font-bold text-green-600">{partners.filter(p => p.is_active).length}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
              <p className="text-sm text-gray-500">Verified Partners</p>
              <p className="text-2xl font-bold text-blue-600">{partners.filter(p => p.verified).length}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
              <p className="text-sm text-gray-500">Total Orders</p>
              <p className="text-2xl font-bold text-purple-600">{partners.reduce((sum, p) => sum + p.total_orders, 0)}</p>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search by company name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active Only</option>
                  <option value="inactive">Inactive Only</option>
                </select>
              </div>
              <button
                onClick={fetchPartners}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
              >
                <RefreshCw size={16} />
                Refresh
              </button>
            </div>
          </div>

          {/* Partners Table */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Orders</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Spent</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPartners.map((partner) => (
                    <tr key={partner.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <Building size={18} className="text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{partner.company_name}</p>
                            <p className="text-xs text-gray-500">ID: {partner.id.slice(0, 8)}...</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <p className="text-sm text-gray-600 flex items-center gap-1">
                            <Mail size={12} className="text-gray-400" />
                            {partner.email}
                          </p>
                          <p className="text-sm text-gray-500 flex items-center gap-1">
                            <Phone size={12} className="text-gray-400" />
                            {partner.phone}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {partner.total_orders}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        GHS {parseFloat(partner.total_spent).toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <span className={`px-2 py-1 text-xs rounded-full ${partner.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {partner.is_active ? 'Active' : 'Inactive'}
                          </span>
                          {partner.verified && (
                            <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                              Verified
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openOrderModal(partner)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Create Order"
                          >
                            <ShoppingCart size={18} />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedPartner(partner);
                              setFormData({
                                company_name: partner.company_name,
                                phone_number: partner.phone,
                                tax_id: partner.tax_id || '',
                                billing_address: partner.billing_address || '',
                                is_active: partner.is_active,
                                verified_by_admin: partner.verified
                              });
                              setShowEditModal(true);
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit Partner"
                          >
                            <Edit2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Create Partner Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Create New Partner</h2>
                <p className="text-sm text-gray-500 mt-1">Fill in the partner details below</p>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            
            <form onSubmit={handleCreatePartner} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                  <input type="text" required value={formData.first_name} onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                  <input type="text" required value={formData.last_name} onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"/>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Login Email *</label>
                  <input type="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                  <input type="password" required value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"/>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
                <input type="text" required value={formData.company_name} onChange={(e) => setFormData({...formData, company_name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"/>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Corporate Email *</label>
                  <input type="email" required value={formData.corporate_email} onChange={(e) => setFormData({...formData, corporate_email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                  <input type="tel" required value={formData.phone_number} onChange={(e) => setFormData({...formData, phone_number: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"/>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tax ID (Optional)</label>
                <input type="text" value={formData.tax_id} onChange={(e) => setFormData({...formData, tax_id: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"/>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Billing Address (Optional)</label>
                <textarea value={formData.billing_address} onChange={(e) => setFormData({...formData, billing_address: e.target.value})} rows="2"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"/>
              </div>
              
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={formData.is_active} onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                  className="w-4 h-4 text-primary rounded focus:ring-primary"/>
                <label className="text-sm text-gray-700">Active (can login and place orders)</label>
              </div>
              
              <div className="flex gap-3 pt-4 border-t">
                <button type="submit" disabled={submitting} className="flex-1 bg-primary text-white py-2 rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-50">
                  {submitting ? 'Creating...' : 'Create Partner'}
                </button>
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Order Modal with Google Maps */}
      {showOrderModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Create Order for {selectedPartner?.company_name}</h2>
                <p className="text-sm text-gray-500 mt-1">Select services and provide delivery details</p>
              </div>
              <button onClick={() => setShowOrderModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Services Selection */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Services</h3>
                <div className="space-y-3">
                  {services.map((service) => (
                    <div key={service.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{service.name}</h4>
                        <p className="text-sm text-gray-500">{service.description}</p>
                        <p className="text-sm font-semibold text-primary mt-1">GHS {parseFloat(service.price).toFixed(2)}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => updateOrderItemQuantity(service.id, (orderItems[service.id] || 0) - 1)}
                          className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                        >
                          -
                        </button>
                        <span className="w-12 text-center font-medium">{orderItems[service.id] || 0}</span>
                        <button
                          onClick={() => updateOrderItemQuantity(service.id, (orderItems[service.id] || 0) + 1)}
                          className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Delivery Option */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Delivery Option</h3>
                <div className="flex gap-4">
                  <label className={`flex-1 flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-all ${!isFullService ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'}`}>
                    <input
                      type="radio"
                      checked={!isFullService}
                      onChange={() => setIsFullService(false)}
                      className="text-primary focus:ring-primary"
                    />
                    <div>
                      <p className="font-medium text-gray-900">Self-Handled</p>
                      <p className="text-sm text-gray-500">Partner handles pickup and delivery</p>
                    </div>
                  </label>
                  <label className={`flex-1 flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-all ${isFullService ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'}`}>
                    <input
                      type="radio"
                      checked={isFullService}
                      onChange={() => setIsFullService(true)}
                      className="text-primary focus:ring-primary"
                    />
                    <div>
                      <p className="font-medium text-gray-900">Full Service</p>
                      <p className="text-sm text-gray-500">We handle pickup and delivery</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Addresses for Full Service */}
              {isFullService && (
                <div className="space-y-4 border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900">Address Details</h3>
                  
                  {/* Pickup Address */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <Truck size={16} className="text-primary" />
                      Pickup Address *
                    </label>
                    <PlaceAutocompleteElementWrapper
                      placeholder="Search for pickup location..."
                      type="pickup"
                      currentInputValue={pickupInputValue}
                      initialLocation={pickup}
                      onPlaceSelect={handlePlaceSelect}
                      region={pickupRegion}
                      pickupTime={pickupTime}
                      setPickupTime={setPickupTime}
                      useSame={useSame}
                    />
                    {pickup && pickup.cost && (
                      <p className="mt-2 text-xs text-green-600">Estimated cost: GHS {pickup.cost.toFixed(2)}</p>
                    )}
                  </div>

                  {/* Same as Pickup Checkbox */}
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={useSame}
                      onChange={(e) => setUseSame(e.target.checked)}
                      className="w-4 h-4 text-primary rounded focus:ring-primary"
                    />
                    <label className="text-sm text-gray-700">Delivery address is the same as pickup address</label>
                  </div>

                  {/* Delivery Address */}
                  {!useSame && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                        <MapPin size={16} className="text-primary" />
                        Delivery Address *
                      </label>
                      <PlaceAutocompleteElementWrapper
                        placeholder="Search for delivery location..."
                        type="delivery"
                        currentInputValue={deliveryInputValue}
                        initialLocation={delivery}
                        onPlaceSelect={handlePlaceSelect}
                        region={deliveryRegion}
                        pickupTime={pickupTime}
                        setPickupTime={setPickupTime}
                        useSame={useSame}
                      />
                      {delivery && delivery.cost && (
                        <p className="mt-2 text-xs text-green-600">Estimated cost: GHS {delivery.cost.toFixed(2)}</p>
                      )}
                    </div>
                  )}
                </div>
              )}
              
              {/* Order Summary */}
              <div className="border-t pt-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Order Summary</h3>
                  <div className="space-y-2">
                    {Object.entries(orderItems).map(([serviceId, quantity]) => {
                      const service = services.find(s => s.id === serviceId);
                      if (service && quantity > 0) {
                        return (
                          <div key={serviceId} className="flex justify-between text-sm">
                            <span>{service.name} x {quantity}</span>
                            <span>GHS {(parseFloat(service.price) * quantity).toFixed(2)}</span>
                          </div>
                        );
                      }
                      return null;
                    })}
                    {isFullService && pickup && (
                      <div className="flex justify-between text-sm">
                        <span>Pickup Service</span>
                        <span>GHS {(pickup.cost || 0).toFixed(2)}</span>
                      </div>
                    )}
                    {isFullService && !useSame && delivery && (
                      <div className="flex justify-between text-sm">
                        <span>Delivery Service</span>
                        <span>GHS {(delivery.cost || 0).toFixed(2)}</span>
                      </div>
                    )}
                    <div className="border-t pt-2 mt-2">
                      <div className="flex justify-between font-bold">
                        <span>Total</span>
                        <span className="text-primary">GHS {calculateOrderTotal().toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <button
                onClick={handleCreateOrder}
                disabled={submitting || calculateOrderTotal() === 0}
                className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Creating Order...
                  </>
                ) : (
                  <>
                    <CheckCircle size={18} />
                    Create Order
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Success Modal */}
      {showOrderDetailModal && createdOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} className="text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Order Created Successfully!</h2>
              <p className="text-gray-500 mb-4">Order #{createdOrder.order_reference} has been created.</p>
              
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Total Amount:</span>
                  <span className="font-bold text-primary">GHS {createdOrder.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Items:</span>
                  <span className="text-gray-900">{createdOrder.items?.length || 0} item(s)</span>
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowOrderDetailModal(false);
                    setCreatedOrder(null);
                  }}
                  className="flex-1 bg-primary text-white py-2 rounded-lg font-semibold hover:bg-primary/90"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Map Handler */}
      <MapHandler
        center={DEFAULT_CENTER}
        zoom={12}
      />
    </APIProvider>
  );
};

export default AdminPartnerManagement;