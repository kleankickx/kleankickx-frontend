import { BrowserRouter as Router, Route, Routes, useLocation, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { CartProvider } from './context/CartContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Navbar from './components/Navbar';
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
import AuthProvider from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import GetOrder from './pages/GetOrder';
import MyOrders from './pages/MyOrders';
import VoucherStore from './pages/VoucherStore';
import PaymentStatus from './pages/PaymentStatus';
import PaymentRetry from './pages/PaymentRetry';
import FailedOrders from './pages/FailedOrders';
import AccountVouchers from './pages/AccountVouchers';
import RedeemVoucher  from './pages/RedeemVoucher';
import VoucherPurchaseSuccess from './pages/VoucherPurchaseSuccess';
import { useContext, useEffect, useState, useCallback } from 'react';
import { AuthContext } from './context/AuthContext';
import ScrollToTop from './components/ScrollToTop';
import UserVerifyEmail from './pages/UserVerifyEmail';
import NotFound from './pages/NotFound';
import GoogleMapsLoader from './components/GoogleMapsLoader';

const AppContent = () => {
  const location = useLocation();
  const hideNavbarOn = ['/auth/login', '/auth/register', '/auth/confirm-email', '/auth/verify-email'];
  const shouldHideNavbar = hideNavbarOn.includes(location.pathname);

  return (
    <div className="flex flex-col min-h-screen">
      {!shouldHideNavbar && <Navbar />}
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/register" element={<Register />} />
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
            element={
              <ReferralDashboard />
            }
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
            path="orders/failed"
            element={
              <ProtectedRoute>
                <FailedOrders />
              </ProtectedRoute>
            }
          />
          <Route
            path="promotions"
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