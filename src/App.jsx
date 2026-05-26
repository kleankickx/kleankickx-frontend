import { BrowserRouter as Router, Route, Routes, useLocation, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { CartProvider } from './context/CartContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Navbar from './components/Navbar';
import PartnerNavbar from './components/PartnerNavbar';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import Services from './pages/Services';
import Cart from './pages/Cart';
import Login from './pages/Login';
import Checkout from './pages/Checkout';
import RateAndServices from './pages/RateAndServices';
import Home from './pages/Home';
import About from './pages/About';
import ChangePassword from './pages/ChangePassword';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Promotions from './pages/Promotions';
import ReferralDashboard from './pages/ReferralDashboard';
import AuthProvider, { AuthContext } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import GetOrder from './pages/GetOrder';
import MyOrders from './pages/MyOrders';
import VoucherStore from './pages/VoucherStore';
import PaymentStatus from './pages/PaymentStatus';
import PaymentRetry from './pages/PaymentRetry';
import FailedOrders from './pages/FailedOrders';
import AccountVouchers from './pages/AccountVouchers';
import RedeemVoucher from './pages/RedeemVoucher';
import VoucherPurchaseSuccess from './pages/VoucherPurchaseSuccess';
import { useContext, useEffect } from 'react';
import ScrollToTop from './components/ScrollToTop';
import UserVerifyEmail from './pages/UserVerifyEmail';
import NotFound from './pages/NotFound';
import GoogleMapsLoader from './components/GoogleMapsLoader';
import PartnerRegister from './pages/PartnerRegister';
import PartnerDashboard from './pages/PartnerDashboard';
import PartnerServices from './pages/PartnerServices';
import PartnerOrderDetail from './pages/PartnerOrderDetail';
import PartnerCheckout from './pages/PartnerCheckout';
import PartnerOrders from './pages/PartnerOrders';
import AdminPartnerManagement from './pages/AdminPartnerManagement';

// Loading component
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
      <p className="mt-4 text-gray-600">Loading...</p>
    </div>
  </div>
);

// Component to conditionally render the appropriate navbar
const ConditionalNavbar = () => {
  const location = useLocation();
  const { isPartner, authLoading, isAuthenticated } = useContext(AuthContext);
  
  // Don't render navbar while loading
  if (authLoading) return null;
  
  // Routes where no navbar should be shown (auth pages)
  const hideNavbarOn = [
    '/auth/login', 
    '/auth/register', 
    '/auth/confirm-email/', 
    '/auth/verify-email', 
    '/forgot-password', 
    '/auth/reset-password/:uid/:token',
    '/partner/register'
  ];
  
  // Check if current path matches any hide pattern
  const shouldHideNavbar = hideNavbarOn.some(route => {
    if (route.includes(':uid/:token')) {
      return location.pathname.startsWith('/auth/reset-password/');
    }
    return location.pathname === route;
  });
  
  if (shouldHideNavbar) {
    return null;
  }
  
  // If user is a partner, show PartnerNavbar everywhere (not just partner routes)
  if (isPartner && isAuthenticated) {
    return <PartnerNavbar />;
  }
  
  // For customers or non-authenticated users, show regular Navbar
  return <Navbar />;
};

const AppContent = () => {
  const { authLoading } = useContext(AuthContext);
  
  // Show loading spinner while auth is initializing
  if (authLoading) {
    return <LoadingSpinner />;
  }
  
  return (
    <div className="flex flex-col min-h-screen">
      <ConditionalNavbar />
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/register" element={<Register />} />
          <Route path="/partner/register" element={<PartnerRegister />} />
          <Route path="/services" element={<Services />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/auth/verify-email" element={<VerifyEmail />} />
          <Route path="/auth/confirm-email" element={<UserVerifyEmail />} />
          <Route path="/rate-and-services" element={<RateAndServices />} />
          <Route path="/about-us" element={<About />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/auth/reset-password/:uid/:token" element={<ResetPassword />} />
          
          <Route
            path="/checkout"
            element={
              <ProtectedRoute requireVerification={true}>
                <Checkout />
              </ProtectedRoute>
            }
          />
          
          {/* Partner Routes */}
          <Route
            path="/partner/dashboard"
            element={
              <ProtectedRoute requireVerification={true}>
                <PartnerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/partner/services"
            element={
              <ProtectedRoute requireVerification={true}>
                <PartnerServices />
              </ProtectedRoute>
            }
          />
          <Route
            path="/partner/checkout"
            element={
              <ProtectedRoute requireVerification={true}>
                <PartnerCheckout />
              </ProtectedRoute>
            }
          />
          <Route
            path="/partner/orders/:referenceCode"
            element={
              <ProtectedRoute>
                <PartnerOrderDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/partner/orders"
            element={
              <ProtectedRoute>
                <PartnerOrders />
              </ProtectedRoute>
            }
          />
          
          {/* Admin Routes */}
          <Route
            path="/admin/partners"
            element={
              <ProtectedRoute requireAdmin={true}>
                <AdminPartnerManagement />
              </ProtectedRoute>
            }
          />
          
          {/* Customer Routes */}
          <Route path="/vouchers" element={<VoucherStore />} />
          <Route
            path="/account/vouchers"
            element={
              <ProtectedRoute requireVerification={true}>
                <AccountVouchers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/vouchers/purchase/success"
            element={
              <ProtectedRoute requireVerification={true}>
                <VoucherPurchaseSuccess />
              </ProtectedRoute>
            }
          />
          <Route
            path="/redeem"
            element={
              <ProtectedRoute requireVerification={true}>
                <RedeemVoucher />
              </ProtectedRoute>
            }
          />
          <Route
            path="/referral-dashboard"
            element={<ReferralDashboard />}
          />
          <Route
            path="/change-password"
            element={
              <ProtectedRoute>
                <ChangePassword />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders/:orderReferenceCode"
            element={
              <ProtectedRoute>
                <GetOrder />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <ProtectedRoute>
                <MyOrders />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders/failed"
            element={
              <ProtectedRoute>
                <FailedOrders />
              </ProtectedRoute>
            }
          />
          <Route
            path="/promotions"
            element={
              <ProtectedRoute>
                <Promotions />
              </ProtectedRoute>
            }
          />
          <Route
            path="/payment/:status/:reference"
            element={
              <ProtectedRoute>
                <PaymentStatus />
              </ProtectedRoute>
            }
          />
          <Route
            path="/checkout/retry/:orderReferenceCode"
            element={
              <ProtectedRoute>
                <PaymentRetry />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

function App() {
  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <Router basename="/">
        <AuthProvider>
          <CartProvider>
            <ScrollToTop />
            <GoogleMapsLoader />
            <AppContent />
          </CartProvider>
        </AuthProvider>
      </Router>
    </GoogleOAuthProvider>
  );
}

export default App;