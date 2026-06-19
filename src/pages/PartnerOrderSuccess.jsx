// src/pages/PartnerOrderSuccess.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { CheckCircle, Package, Calendar, FileText, ArrowRight, Home, Receipt, Clock } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../api';
import logo from "../assets/logo2.png";

const PartnerOrderSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { orderReference } = useParams();
  
  const [order, setOrder] = useState(null);
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState(5);

  // Get order data from location state or fetch it
  useEffect(() => {
    const fetchOrderData = async () => {
      try {
        // If we have state from navigation, use it
        if (location.state?.order) {
          setOrder(location.state.order);
          setInvoice(location.state.invoice);
          setLoading(false);
          return;
        }

        // Otherwise fetch the order details
        if (orderReference) {
          const response = await api.get(`/api/orders/partner/${orderReference}/`);
          if (response.data) {
            setOrder(response.data);
            setInvoice(response.data.invoice || null);
          }
        }
      } catch (error) {
        console.error('Failed to fetch order details:', error);
        toast.error('Could not load order details');
      } finally {
        setLoading(false);
      }
    };

    fetchOrderData();
  }, [orderReference, location.state]);


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <Package className="h-10 w-10 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Not Found</h2>
          <p className="text-gray-600 mb-6">We couldn't find the order you're looking for.</p>
          <button
            onClick={() => navigate('/partner/dashboard')}
            className="w-full bg-primary hover:bg-primary/90 text-white py-3 rounded-lg font-semibold transition"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <img src={logo} className="w-[8rem] mx-auto mb-4" alt="KleanKickx Logo" />
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Order Placed Successfully!</h1>
          <p className="text-gray-600 mt-2">
            Your order has been received and will be added to your next invoice.
          </p>
        </div>

        {/* Order Details */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Order Details</h2>
            <span className="text-sm text-gray-500">
              Reference: <span className="font-mono font-semibold">{order.order_reference_code}</span>
            </span>
          </div>
          
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Order Status</p>
                <p className="font-medium text-green-600 capitalize">{order.status?.toLowerCase()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Amount</p>
                <p className="font-bold text-primary">GHS {order.total?.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Items</p>
                <p className="font-medium">{order.items?.length || 0} items</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Delivery Type</p>
                <p className="font-medium">{order.is_self_handled ? 'Self-Handled' : 'Full Service'}</p>
              </div>
            </div>

            {/* Items List */}
            {order.items && order.items.length > 0 && (
              <div className="border-t pt-4 mt-4">
                <p className="text-sm font-semibold text-gray-700 mb-2">Items</p>
                <div className="space-y-2">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-gray-600">{item.service_name || item.name} × {item.quantity}</span>
                      <span className="font-medium">GHS {(item.unit_price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Invoice Information */}
        {invoice ? (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6 border-l-4 border-primary">
            <div className="px-6 py-4 border-b border-gray-100 bg-primary/5">
              <div className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold text-gray-900">Invoice Information</h2>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Invoice Number</p>
                  <p className="font-medium">{invoice.number}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Payment Term</p>
                  <p className="font-medium">{invoice.payment_term || 'Monthly'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Period</p>
                  <p className="font-medium">{invoice.period || 'Current Period'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Due Date</p>
                  <p className="font-medium text-amber-600">
                    {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : 'TBD'}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-500">Invoice Total</p>
                  <p className="font-bold text-lg text-primary">
                    GHS {invoice.invoice_total?.toFixed(2) || '0.00'}
                  </p>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <Clock className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium">Payment Due</p>
                    <p className="text-xs mt-1">
                      This order has been added to your invoice. Payment will be due on 
                      {invoice.due_date ? ` ${new Date(invoice.due_date).toLocaleDateString()}` : ' the invoice due date'}.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">Your order will be added to your next invoice.</p>
            <p className="text-sm text-gray-400 mt-1">You will receive an invoice at the end of the billing period.</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => navigate('/partner/orders/' + order.order_reference_code)}
            className="flex-1 bg-primary hover:bg-primary/90 text-white py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2"
          >
            
            View Order Details
          </button>
          <button
            onClick={() => navigate('/partner/invoices')}
            className="flex-1 border-2 border-gray-300 hover:border-primary text-gray-700 hover:text-primary py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2"
          >
            <Receipt size={18} />
            View Invoices
          </button>
        </div>

       
      </div>
    </div>
  );
};

export default PartnerOrderSuccess;