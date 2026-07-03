// src/pages/PartnerInvoiceDetail.jsx
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { 
  ChevronLeft, 
  FileText, 
  Download, 
  CreditCard, 
  Printer,
  CheckCircle,
  Clock,
  AlertCircle,
  Building,
  Calendar,
  User,
  Mail,
  Phone,
  MapPin,
  Package,
  Lock
} from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../api';

const PartnerInvoiceDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { isPartner } = useContext(AuthContext);
  
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isPartner) {
      navigate('/');
      return;
    }
    fetchInvoiceDetail();
  }, [isPartner, navigate, id]);

  const fetchInvoiceDetail = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/partner/invoices/${id}/`);
      setInvoice(response.data);
    } catch (error) {
      console.error('Failed to fetch invoice:', error);
      toast.error('Failed to load invoice details');
      navigate('/partner/invoices');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'DRAFT': { color: 'bg-gray-100 text-gray-800', label: 'Draft', icon: Clock },
      'SENT': { color: 'bg-blue-100 text-blue-800', label: 'Sent', icon: FileText },
      'PAID': { color: 'bg-green-100 text-green-800', label: 'Paid', icon: CheckCircle },
      'OVERDUE': { color: 'bg-red-100 text-red-800', label: 'Overdue', icon: AlertCircle },
      'CANCELLED': { color: 'bg-gray-100 text-gray-800', label: 'Cancelled', icon: AlertCircle },
      'PARTIALLY_PAID': { color: 'bg-yellow-100 text-yellow-800', label: 'Partially Paid', icon: Clock },
    };
    const config = statusConfig[status] || statusConfig['DRAFT'];
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        <Icon className="h-4 w-4" />
        {config.label}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return `GHS ${parseFloat(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getPaymentProgress = () => {
    if (!invoice) return 0;
    const total = parseFloat(invoice.total) || 0;
    const paid = parseFloat(invoice.amount_paid) || 0;
    if (total === 0) return 0;
    return Math.min((paid / total) * 100, 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading invoice...</p>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Invoice not found</h3>
          <button
            onClick={() => navigate('/partner/invoices')}
            className="mt-4 text-primary hover:underline"
          >
            Back to Invoices
          </button>
        </div>
      </div>
    );
  }

  const progress = getPaymentProgress();
  const isPaid = invoice.status === 'PAID';
  const isOverdue = invoice.status === 'OVERDUE';
  const canPay = !isPaid && invoice.status !== 'CANCELLED';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/90 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/partner/invoices')}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              <div>
                <h1 className="text-2xl font-bold">Invoice Details</h1>
                <p className="mt-1 text-white/80 text-sm">
                  {invoice.invoice_number}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
                <Download className="h-4 w-4" />
                PDF
              </button>
              <button className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
                <Printer className="h-4 w-4" />
                Print
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status Banner */}
        <div className={`rounded-xl p-4 mb-6 ${
          isPaid ? 'bg-green-50 border border-green-200' :
          isOverdue ? 'bg-red-50 border border-red-200' :
          invoice.status === 'PARTIALLY_PAID' ? 'bg-yellow-50 border border-yellow-200' :
          'bg-blue-50 border border-blue-200'
        }`}>
          <div className="flex items-center gap-3">
            {isPaid && <CheckCircle className="h-5 w-5 text-green-600" />}
            {isOverdue && <AlertCircle className="h-5 w-5 text-red-600" />}
            {invoice.status === 'PARTIALLY_PAID' && <Clock className="h-5 w-5 text-yellow-600" />}
            {!isPaid && !isOverdue && invoice.status !== 'PARTIALLY_PAID' && <FileText className="h-5 w-5 text-blue-600" />}
            <div>
              <p className={`font-medium ${
                isPaid ? 'text-green-800' :
                isOverdue ? 'text-red-800' :
                invoice.status === 'PARTIALLY_PAID' ? 'text-yellow-800' :
                'text-blue-800'
              }`}>
                {isPaid ? 'This invoice has been fully paid.' :
                 isOverdue ? 'This invoice is overdue. Please contact support.' :
                 invoice.status === 'PARTIALLY_PAID' ? 'This invoice is partially paid.' :
                 'This invoice is pending payment.'}
              </p>
              {canPay && (
                <div className="mt-2 flex items-center gap-2 text-sm text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200">
                  <Lock className="h-4 w-4" />
                  <span>Payments are processed by the admin team</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Payment Disabled Banner */}
        {canPay && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <Lock className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-800">Payment Processing</p>
                <p className="text-xs text-blue-700 mt-1">
                  Invoice payments are currently processed by the admin team. 
                  If you need to make a payment, please contact our support team or wait for the invoice due date.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Invoice Details */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
          <div className="p-6 border-b border-gray-100">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Invoice Information</h2>
                <p className="text-sm text-gray-500">#{invoice.invoice_number}</p>
              </div>
              {getStatusBadge(invoice.status)}
            </div>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Invoice Date</p>
                <p className="font-medium">{formatDate(invoice.invoice_date)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Due Date</p>
                <p className={`font-medium ${isOverdue ? 'text-red-600' : ''}`}>
                  {formatDate(invoice.due_date)}
                  {isOverdue && ' (Overdue)'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Payment Term</p>
                <p className="font-medium">    {invoice.payment_term_name || invoice.payment_term_display || invoice.payment_term || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Period</p>
                <p className="font-medium">{invoice.period_display || invoice.period || 'N/A'}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Partner</p>
                <p className="font-medium">{invoice.partner_name || invoice.partner?.company_name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Billing Email</p>
                <p className="font-medium">{invoice.billing_contact_email || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Billing Address</p>
                <p className="font-medium">{invoice.billing_address || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Amount Summary */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">Payment Summary</h3>
          </div>
          <div className="p-6 space-y-3">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Total Amount</span>
              <span className="font-bold text-gray-900">{formatCurrency(invoice.total)}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Amount Paid</span>
              <span className="font-bold text-green-600">{formatCurrency(invoice.amount_paid || 0)}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-600">Balance Due</span>
              <span className={`font-bold text-lg ${invoice.balance_due > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                {formatCurrency(invoice.balance_due || 0)}
              </span>
            </div>
            {invoice.status !== 'PAID' && (
              <div className="mt-2">
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">{progress.toFixed(0)}% paid</p>
              </div>
            )}
          </div>
        </div>

        {/* Invoice Items */}
        {invoice.items && invoice.items.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Order Items</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Item
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Unit Price
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {invoice.items.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.description || item.service_name || 'Item'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                        {item.quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                        {formatCurrency(item.unit_price)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                        {formatCurrency(item.total_price)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => navigate('/partner/invoices')}
            className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            Back to Invoices
          </button>
          {canPay && (
            <div className="px-6 py-2.5 bg-gray-100 text-gray-500 rounded-lg font-medium flex items-center gap-2 cursor-not-allowed">
              <Lock className="h-4 w-4" />
              Payment Disabled
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PartnerInvoiceDetail;