// src/pages/PartnerInvoices.jsx
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { 
  FileText, 
  ChevronLeft, 
  Eye, 
  Download, 
  CreditCard, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Search,
  Filter,
  Calendar,
  ChevronDown,
  ChevronUp,
  Printer,
  Plus,
  Lock
} from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../api';

const PartnerInvoices = () => {
  const navigate = useNavigate();
  const { user, isPartner, partnerData } = useContext(AuthContext);
  
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total_invoices: 0,
    paid_invoices: 0,
    overdue_invoices: 0,
    total_amount_due: 0,
    total_paid: 0,
  });
  const [filters, setFilters] = useState({
    status: '',
    start_date: '',
    end_date: '',
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (!isPartner) {
      navigate('/');
      return;
    }
    fetchInvoices();
  }, [isPartner, navigate, filters]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.start_date) params.append('start_date', filters.start_date);
      if (filters.end_date) params.append('end_date', filters.end_date);
      
      const response = await api.get(`/api/partner/invoices/?${params.toString()}`);
      
      setInvoices(response.data.invoices || []);
      setStats(response.data.summary || {
        total_invoices: 0,
        paid_invoices: 0,
        overdue_invoices: 0,
        total_amount_due: 0,
        total_paid: 0,
      });
    } catch (error) {
      console.error('Failed to fetch invoices:', error);
      toast.error('Failed to load invoices');
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
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return `GHS ${parseFloat(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getPaymentProgress = (invoice) => {
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
          <p className="mt-4 text-gray-600">Loading invoices...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/90 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/partner/dashboard')}
              className="p-2 hover:bg-white/10 rounded-xl transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold">Invoices</h1>
              <p className="mt-1 text-white/80 text-sm">
                View your wholesale invoices and payment history
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
            <p className="text-sm text-gray-500">Total Invoices</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total_invoices}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
            <p className="text-sm text-gray-500">Paid</p>
            <p className="text-2xl font-bold text-green-600">{stats.paid_invoices}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
            <p className="text-sm text-gray-500">Overdue</p>
            <p className="text-2xl font-bold text-red-600">{stats.overdue_invoices}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
            <p className="text-sm text-gray-500">Total Amount Due</p>
            <p className="text-2xl font-bold text-primary">{formatCurrency(stats.total_amount_due)}</p>
          </div>
        </div>

        {/* Info Banner - Payment Disabled */}
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

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
          <div className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Search className="h-5 w-5 text-gray-400" />
                <span className="text-sm font-medium text-gray-700">Filters</span>
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-primary transition-colors"
              >
                <Filter className="h-4 w-4" />
                {showFilters ? 'Hide Filters' : 'Show Filters'}
                {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
            </div>

            {showFilters && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={filters.status}
                      onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                      <option value="">All Statuses</option>
                      <option value="DRAFT">Draft</option>
                      <option value="SENT">Sent</option>
                      <option value="PAID">Paid</option>
                      <option value="PARTIALLY_PAID">Partially Paid</option>
                      <option value="OVERDUE">Overdue</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                    <input
                      type="date"
                      value={filters.start_date}
                      onChange={(e) => setFilters(prev => ({ ...prev, start_date: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                    <input
                      type="date"
                      value={filters.end_date}
                      onChange={(e) => setFilters(prev => ({ ...prev, end_date: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Invoices Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {invoices.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No invoices found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {filters.status || filters.start_date || filters.end_date 
                  ? 'Try adjusting your filters' 
                  : 'You don\'t have any invoices yet'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Invoice #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Period
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Due Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Paid
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Balance
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {invoices.map((invoice) => {
                    const progress = getPaymentProgress(invoice);
                    const isPaid = invoice.status === 'PAID';
                    const isOverdue = invoice.status === 'OVERDUE';
                    
                    return (
                      <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-mono text-sm font-medium text-gray-900">
                            {invoice.invoice_number}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {invoice.period_display || invoice.period || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={isOverdue ? 'text-red-600 font-medium' : 'text-gray-500'}>
                            {formatDate(invoice.due_date)}
                            {isOverdue && (
                              <span className="ml-2 inline-flex items-center text-xs text-red-600">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Overdue
                              </span>
                            )}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatCurrency(invoice.total)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                          {formatCurrency(invoice.amount_paid || 0)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <span className={invoice.balance_due > 0 ? 'text-amber-600' : 'text-green-600'}>
                            {formatCurrency(invoice.balance_due || 0)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(invoice.status)}
                          {invoice.status === 'PARTIALLY_PAID' && (
                            <div className="mt-1 w-16 h-1 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-yellow-400 rounded-full transition-all"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          )}
                          {invoice.status === 'PAID' && (
                            <div className="mt-1 w-16 h-1 bg-gray-200 rounded-full overflow-hidden">
                              <div className="h-full bg-green-500 rounded-full w-full" />
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => navigate(`/partner/invoices/${invoice.id}`)}
                              className="p-1.5 text-gray-400 hover:text-primary rounded-lg hover:bg-primary/5 transition-colors"
                              title="View Invoice"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              className="p-1.5 text-gray-400 hover:text-primary rounded-lg hover:bg-primary/5 transition-colors"
                              title="Download PDF"
                            >
                              <Download className="h-4 w-4" />
                            </button>
                            {/* Payment button removed - partners cannot pay invoices */}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Summary Footer */}
        {invoices.length > 0 && (
          <div className="mt-4 bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex flex-wrap justify-between items-center gap-4">
              <div className="text-sm text-gray-500">
                Showing {invoices.length} invoice{invoices.length > 1 ? 's' : ''}
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <span className="text-gray-500">Total Amount Due:</span>
                <span className="font-bold text-primary">{formatCurrency(stats.total_amount_due)}</span>
                <span className="text-gray-300">|</span>
                <span className="text-gray-500">Total Paid:</span>
                <span className="font-bold text-green-600">{formatCurrency(stats.total_paid)}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PartnerInvoices;