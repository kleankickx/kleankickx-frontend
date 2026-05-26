// src/pages/PartnerOrderDetail.jsx
import React, { useState, useEffect, useContext, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { 
  Package, ArrowLeft, Truck, Calendar, CreditCard, CheckCircle, 
  Clock, XCircle, MapPin, Phone, Mail, Printer, ShoppingBag,
  Image as ImageIcon, DollarSign, Calendar as CalendarIcon, Download
} from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../api';
import html2pdf from 'html2pdf.js';

const PartnerOrderDetail = () => {
  const { referenceCode } = useParams();
  const navigate = useNavigate();
  const { isPartner, partnerData } = useContext(AuthContext);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imagesLoaded, setImagesLoaded] = useState({});
  const receiptRef = useRef();

  useEffect(() => {
    if (!isPartner) {
      navigate('/auth/login');
      return;
    }
    
    if (!referenceCode || referenceCode === 'undefined') {
      console.error('Invalid reference code:', referenceCode);
      toast.error('Invalid order reference');
      navigate('/partner/dashboard');
      return;
    }
    
    fetchOrder();
  }, [referenceCode, isPartner, navigate]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching order with reference:', referenceCode);
      const response = await api.get(`/api/orders/${referenceCode}/`);
      setOrder(response.data);
      console.log('Order details:', response.data);
    } catch (error) {
      console.error('Failed to fetch order:', error);
      setError(error.response?.data?.error || 'Order not found');
      toast.error('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status) => {
    const statusMap = {
      'PENDING': { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: Clock, bgLight: 'bg-yellow-50' },
      'PROCESSING': { label: 'Processing', color: 'bg-blue-100 text-blue-800', icon: Package, bgLight: 'bg-blue-50' },
      'SCHEDULED_FOR_DELIVERY': { label: 'Scheduled for Delivery', color: 'bg-purple-100 text-purple-800', icon: Calendar, bgLight: 'bg-purple-50' },
      'DELIVERED': { label: 'Delivered', color: 'bg-green-100 text-green-800', icon: CheckCircle, bgLight: 'bg-green-50' },
      'CANCELLED': { label: 'Cancelled', color: 'bg-red-100 text-red-800', icon: XCircle, bgLight: 'bg-red-50' },
      'COMPLETED': { label: 'Completed', color: 'bg-green-100 text-green-800', icon: CheckCircle, bgLight: 'bg-green-50' },
    };
    return statusMap[status] || { label: status, color: 'bg-gray-100 text-gray-800', icon: Package, bgLight: 'bg-gray-50' };
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDateShort = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleImageLoad = (itemId) => {
    setImagesLoaded(prev => ({ ...prev, [itemId]: true }));
  };

  const downloadReceipt = async () => {
    if (!receiptRef.current) return;
    
    toast.info('Generating receipt...');
    
    const element = receiptRef.current;
    const opt = {
      margin: [0.5, 0.5, 0.5, 0.5],
      filename: `receipt_${order.reference_code}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, letterRendering: true, useCORS: true, logging: false },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };
    
    try {
      await html2pdf().set(opt).from(element).save();
      toast.success('Receipt downloaded successfully!');
    } catch (error) {
      console.error('PDF generation failed:', error);
      toast.error('Failed to generate receipt. Please try again.');
    }
  };

  const printReceipt = () => {
    const printContent = receiptRef.current;
    const originalTitle = document.title;
    document.title = `Receipt_${order.reference_code}`;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt - ${order.reference_code}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
            .receipt-container { max-width: 800px; margin: 0 auto; }
            @media print {
              body { margin: 0; padding: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="receipt-container">
            ${printContent.innerHTML}
          </div>
          <script>
            window.onload = () => {
              window.print();
              window.onafterprint = () => window.close();
            };
          <\/script>
        </body>
      </html>
    `);
    printWindow.document.close();
    document.title = originalTitle;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-3 border-primary mx-auto"></div>
          <p className="mt-6 text-gray-600 font-medium">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Package className="h-12 w-12 text-red-500" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Order not found</h3>
          <p className="text-gray-500">
            The order you're looking for doesn't exist or you don't have permission to view it.
          </p>
          <div className="mt-8 flex gap-3 justify-center">
            <button
              onClick={() => navigate('/partner/dashboard')}
              className="px-6 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-all font-medium"
            >
              Go to Dashboard
            </button>
            <button
              onClick={() => navigate('/partner/services')}
              className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-medium"
            >
              Browse Services
            </button>
          </div>
        </div>
      </div>
    );
  }

  const statusConfig = getStatusConfig(order.status);
  const StatusIcon = statusConfig.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/90 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <button
            onClick={() => navigate('/partner/dashboard')}
            className="flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors group"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            <span>Back to Dashboard</span>
          </button>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">Order Details</h1>
              <p className="mt-2 text-white/80">Order #{order.reference_code}</p>
            </div>
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${statusConfig.color} shadow-sm`}>
              <StatusIcon size={18} />
              <span className="font-semibold">{statusConfig.label}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden Receipt Template for PDF */}
      <div className="hidden">
        <div ref={receiptRef} className="receipt-container" style={{ padding: '40px', fontFamily: 'Arial, sans-serif', maxWidth: '800px', margin: '0 auto' }}>
          {/* Receipt Header */}
          <div style={{ textAlign: 'center', marginBottom: '30px', borderBottom: '2px solid #007F03', paddingBottom: '20px' }}>
            <h1 style={{ color: '#007F03', margin: 0, fontSize: '28px' }}>KleanKickx</h1>
            <p style={{ margin: '5px 0', color: '#666' }}>Professional Sneaker Cleaning</p>
            <p style={{ margin: '5px 0', color: '#666', fontSize: '12px' }}>support@kleankickx.com | www.kleankickx.com</p>
            <h2 style={{ marginTop: '15px', color: '#333' }}>ORDER RECEIPT</h2>
            <p style={{ margin: '5px 0', color: '#666' }}>Order #{order.reference_code}</p>
          </div>

          {/* Order Info */}
          <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #ddd', paddingBottom: '10px' }}>
            <div>
              <p style={{ margin: '5px 0', fontWeight: 'bold' }}>Order Date:</p>
              <p style={{ margin: '5px 0' }}>{formatDateShort(order.created_at)}</p>
            </div>
            <div>
              <p style={{ margin: '5px 0', fontWeight: 'bold' }}>Status:</p>
              <p style={{ margin: '5px 0', color: '#007F03' }}>{statusConfig.label}</p>
            </div>
            <div>
              <p style={{ margin: '5px 0', fontWeight: 'bold' }}>Partner:</p>
              <p style={{ margin: '5px 0' }}>{partnerData?.company_name || 'N/A'}</p>
            </div>
          </div>

          {/* Order Items Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f5f5f5' }}>
                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Item</th>
                <th style={{ padding: '10px', textAlign: 'center', borderBottom: '1px solid #ddd' }}>Qty</th>
                <th style={{ padding: '10px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>Unit Price</th>
                <th style={{ padding: '10px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items?.map((item) => (
                <tr key={item.id}>
                  <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}>{item.service?.name || item.service_name}</td>
                  <td style={{ padding: '10px', textAlign: 'center', borderBottom: '1px solid #eee' }}>{item.quantity}</td>
                  <td style={{ padding: '10px', textAlign: 'right', borderBottom: '1px solid #eee' }}>GHS {parseFloat(item.unit_price).toFixed(2)}</td>
                  <td style={{ padding: '10px', textAlign: 'right', borderBottom: '1px solid #eee' }}>GHS {parseFloat(item.total_price).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div style={{ marginBottom: '20px', textAlign: 'right' }}>
            <div style={{ marginBottom: '5px' }}>
              <span style={{ fontWeight: 'bold' }}>Subtotal:</span>
              <span style={{ marginLeft: '20px' }}>GHS {parseFloat(order.subtotal).toFixed(2)}</span>
            </div>
            {order.delivery_cost > 0 && (
              <div style={{ marginBottom: '5px' }}>
                <span style={{ fontWeight: 'bold' }}>Delivery Cost:</span>
                <span style={{ marginLeft: '20px' }}>GHS {parseFloat(order.delivery_cost).toFixed(2)}</span>
              </div>
            )}
            {order.pickup_cost > 0 && (
              <div style={{ marginBottom: '5px' }}>
                <span style={{ fontWeight: 'bold' }}>Pickup Cost:</span>
                <span style={{ marginLeft: '20px' }}>GHS {parseFloat(order.pickup_cost).toFixed(2)}</span>
              </div>
            )}
            <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '2px solid #007F03' }}>
              <span style={{ fontSize: '18px', fontWeight: 'bold' }}>TOTAL:</span>
              <span style={{ fontSize: '18px', fontWeight: 'bold', marginLeft: '20px', color: '#007F03' }}>
                GHS {parseFloat(order.total).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Addresses */}
          {(order.pickup_address || order.delivery_address) && (
            <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '5px' }}>
              <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>Address Information</h3>
              {order.pickup_address && (
                <div style={{ marginBottom: '10px' }}>
                  <p style={{ margin: '5px 0', fontWeight: 'bold' }}>Pickup Address:</p>
                  <p style={{ margin: '5px 0' }}>{order.pickup_address.street_address}</p>
                </div>
              )}
              {order.delivery_address && (
                <div>
                  <p style={{ margin: '5px 0', fontWeight: 'bold' }}>Delivery Address:</p>
                  <p style={{ margin: '5px 0' }}>{order.delivery_address.street_address}</p>
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div style={{ textAlign: 'center', marginTop: '30px', paddingTop: '20px', borderTop: '1px solid #ddd', fontSize: '12px', color: '#999' }}>
            <p>Thank you for choosing KleanKickx!</p>
            <p>For any inquiries, please contact support@kleankickx.com</p>
            <p>This is a system generated receipt. No signature required.</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Timeline Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                  <CalendarIcon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Order Timeline</h2>
                  <p className="text-sm text-gray-500">Placed on {formatDate(order.created_at)}</p>
                </div>
              </div>
              
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                <div className="space-y-6">
                  <div className="relative pl-10">
                    <div className="absolute left-0 top-1 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center ring-4 ring-green-100">
                      <CheckCircle className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Order Placed</p>
                      <p className="text-sm text-gray-500">{formatDate(order.created_at)}</p>
                    </div>
                  </div>
                  
                  {order.status !== 'PENDING' && (
                    <div className="relative pl-10">
                      <div className="absolute left-0 top-1 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center ring-4 ring-blue-100">
                        <Package className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Order Confirmed</p>
                        <p className="text-sm text-gray-500">Order is being processed</p>
                      </div>
                    </div>
                  )}
                  
                  {order.status === 'DELIVERED' && (
                    <div className="relative pl-10">
                      <div className="absolute left-0 top-1 w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center ring-4 ring-purple-100">
                        <Truck className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Delivered</p>
                        <p className="text-sm text-gray-500">Order has been delivered</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Order Items Card with Images */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                    <ShoppingBag className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Order Items</h2>
                    <p className="text-sm text-gray-500">{order.items?.length || 0} item(s) in this order</p>
                  </div>
                </div>
              </div>
              
              <div className="divide-y divide-gray-100">
                {order.items?.map((item) => (
                  <div key={item.id} className="p-6 hover:bg-gray-50/50 transition-colors">
                    <div className="flex flex-col md:flex-row gap-6">
                      {/* Service Image */}
                      <div className="flex-shrink-0">
                        <div className="w-32 h-32 bg-gray-100 rounded-xl overflow-hidden shadow-sm">
                          {item.service?.image ? (
                            <img
                              src={item.service.image}
                              alt={item.service.name}
                              className="w-full h-full object-cover"
                              onLoad={() => handleImageLoad(item.id)}
                              onError={(e) => {
                                e.target.src = 'https://via.placeholder.com/128x128?text=No+Image';
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                              <ImageIcon className="h-8 w-8 text-gray-400" />
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Item Details */}
                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                          <div>
                            <h3 className="font-semibold text-gray-900 text-lg">
                              {item.service?.name || item.service_name}
                            </h3>
                            {item.service?.description && (
                              <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                                {item.service.description}
                              </p>
                            )}
                            <div className="flex items-center gap-3 mt-3">
                              <span className="text-sm text-gray-500">Quantity: {item.quantity}</span>
                              {item.quantity > 5 && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                                  <Package size={12} />
                                  Bulk Order
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-left sm:text-right">
                            <p className="text-xl font-bold text-primary">
                              GHS {parseFloat(item.total_price).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </p>
                            <p className="text-sm text-gray-500">
                              GHS {parseFloat(item.unit_price).toLocaleString(undefined, { minimumFractionDigits: 2 })} each
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Addresses Section */}
            {(order.pickup_address || order.delivery_address) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {order.pickup_address && (
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                        <Truck className="h-5 w-5 text-orange-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">Pickup Address</h3>
                        <p className="text-xs text-gray-500">Items will be picked up from here</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-gray-700 font-medium">{order.pickup_address.location_name || 'Pickup Location'}</p>
                      <p className="text-gray-600 text-sm flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
                        {order.pickup_address.street_address}
                      </p>
                      {order.pickup_address.landmark && (
                        <p className="text-gray-500 text-sm">Landmark: {order.pickup_address.landmark}</p>
                      )}
                      <div className="pt-3 mt-2 border-t border-gray-100">
                        <p className="text-sm font-medium text-gray-700">
                          Pickup Cost: <span className="text-primary">GHS {parseFloat(order.pickup_cost || 0).toFixed(2)}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {order.delivery_address && (
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                        <MapPin className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">Delivery Address</h3>
                        <p className="text-xs text-gray-500">Items will be delivered here</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-gray-700 font-medium">{order.delivery_address.location_name || 'Delivery Location'}</p>
                      <p className="text-gray-600 text-sm flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
                        {order.delivery_address.street_address}
                      </p>
                      {order.delivery_address.landmark && (
                        <p className="text-gray-500 text-sm">Landmark: {order.delivery_address.landmark}</p>
                      )}
                      <div className="pt-3 mt-2 border-t border-gray-100">
                        <p className="text-sm font-medium text-gray-700">
                          Delivery Cost: <span className="text-primary">GHS {parseFloat(order.delivery_cost || 0).toFixed(2)}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column - Order Summary */}
          <div className="space-y-6">
            {/* Order Summary Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-24">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Order Summary</h2>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium text-gray-900">
                    GHS {parseFloat(order.subtotal).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                
                {order.delivery_cost > 0 && (
                  <div className="flex justify-between items-center py-2 border-t border-gray-100">
                    <span className="text-gray-600">Delivery Cost</span>
                    <span className="font-medium text-gray-900">
                      GHS {parseFloat(order.delivery_cost).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
                
                {order.pickup_cost > 0 && (
                  <div className="flex justify-between items-center py-2 border-t border-gray-100">
                    <span className="text-gray-600">Pickup Cost</span>
                    <span className="font-medium text-gray-900">
                      GHS {parseFloat(order.pickup_cost).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
                
                <div className="border-t border-gray-200 pt-4 mt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-900">Total</span>
                    <span className="text-2xl font-bold text-primary">
                      GHS {parseFloat(order.total).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Info Card */}
            {order.payments && order.payments.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                    <CreditCard className="h-5 w-5 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Payment Information</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Status</span>
                    <span className={`font-medium ${
                      order.payments[0]?.status === 'SUCCESS' ? 'text-green-600' : 'text-yellow-600'
                    }`}>
                      {order.payments[0]?.status || 'PENDING'}
                    </span>
                  </div>
                  {order.payments[0]?.completed_at && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Paid On</span>
                      <span className="text-gray-700">{formatDate(order.payments[0].completed_at)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Payment Method</span>
                    <span className="text-gray-700">{order.payments[0]?.method || 'Not specified'}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              <button
                onClick={() => navigate('/partner/services')}
                className="w-full bg-primary text-white py-3 rounded-xl font-semibold hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
              >
                <ShoppingBag size={18} />
                Place Another Order
              </button>
              <button
                onClick={downloadReceipt}
                className="w-full border-2 border-primary text-primary py-3 rounded-xl font-semibold hover:bg-primary/5 transition-all flex items-center justify-center gap-2"
              >
                <Download size={18} />
                Download Receipt (PDF)
              </button>
              <button
                onClick={printReceipt}
                className="w-full border-2 border-gray-300 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
              >
                <Printer size={18} />
                Print Receipt
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PartnerOrderDetail;