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
  Package
} from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../api';

const PartnerInvoiceDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { isPartner } = useContext(AuthContext);
  
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [paymentReference, setPaymentReference] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
      setPaymentAmount(response.data.balance_due?.toString() || '0');
    } catch (error) {
      console.error('Failed to fetch invoice:', error);
      toast.error('Failed to load invoice details');
      navigate('/partner/invoices');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    
    const amount = parseFloat(paymentAmount);
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    
    if (amount > invoice.balance_due) {
      toast.error(`Amount exceeds balance due of GHS ${invoice.balance_due.toFixed(2)}`);
      return;
    }
    
    setSubmitting(true);
    
    try {
      const response = await api.post(`/api/partner/invoices/${invoice.id}/pay/`, {
        amount: amount,
        reference: paymentReference || undefined,
      });
      
      if (response.data.success) {
        toast.success(response.data.message || 'Payment recorded successfully!');
        setShowPaymentModal(false);
        fetchInvoiceDetail();
      }
    } catch (error) {
      console.error('Payment failed:', error);
      toast.error(error.response?.data?.error || 'Payment failed. Please try again.');
    } finally {
      setSubmitting(false);
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
                 isOverdue ? 'This invoice is overdue. Please make a payment.' :
                 invoice.status === 'PARTIALLY_PAID' ? 'This invoice is partially paid.' :
                 'This invoice is pending payment.'}
              </p>
              {canPay && (
                <button
                  onClick={() => setShowPaymentModal(true)}
                  className="mt-2 px-4 py-1.5 bg-primary text-white text-sm rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
                >
                  <CreditCard className="h-4 w-4" />
                  Make Payment
                </button>
              )}
            </div>
          </div>
        </div>

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
                <p className="font-medium">{invoice.payment_term || 'N/A'}</p>
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
            <button
              onClick={() => setShowPaymentModal(true)}
              className="px-6 py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
            >
              <CreditCard className="h-4 w-4" />
              Make Payment
            </button>
          )}
        </div>
      </div>

      {/* Payment Modal - Same as in PartnerInvoices */}
      {showPaymentModal && invoice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
            <div className="p-6 border-b border-gray-100">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">Make Payment</h2>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Pay for invoice {invoice.invoice_number}
              </p>
            </div>

            <form onSubmit={handlePayment} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Invoice Total
                </label>
                <p className="text-lg font-bold text-gray-900">
                  {formatCurrency(invoice.total)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Balance Due
                </label>
                <p className="text-lg font-bold text-amber-600">
                  {formatCurrency(invoice.balance_due)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Amount *
                </label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  step="0.01"
                  min="0.01"
                  max={invoice.balance_due}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Maximum: {formatCurrency(invoice.balance_due)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="CASH">Cash</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="MOBILE_MONEY">Mobile Money</option>
                  <option value="CARD">Card</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Reference (Optional)
                </label>
                <input
                  type="text"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  placeholder="Enter reference number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                <p className="font-medium">⚠️ Important</p>
                <p className="text-xs mt-1">
                  This payment will be recorded and the invoice status will be updated accordingly.
                  {parseFloat(paymentAmount) < invoice.balance_due && 
                    ` The invoice will be marked as "Partially Paid".`}
                  {parseFloat(paymentAmount) >= invoice.balance_due && 
                    ` The invoice will be marked as "Paid in Full".`}
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-primary text-white py-2.5 rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4" />
                      Confirm Payment
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PartnerInvoiceDetail;