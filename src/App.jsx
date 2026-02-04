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
      {!shouldHideNavbar && <Navbar />} {/* Conditionally render Navbar based on the current route */}
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
                <AccountVouchers   />
              </ProtectedRoute>
            }
          />
          <Route
            path="/vouchers/purchase/success"
            element={
              <ProtectedRoute requireVerification={true}>
                <VoucherPurchaseSuccess   />
              </ProtectedRoute>
            }
          />
          <Route
            path="/redeem"
            element={
              <ProtectedRoute requireVerification={true}>
                <RedeemVoucher    />
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

const LoadingSplash = () => (
  // Use Tailwind classes to center the spinner over the entire viewport
  <div className="fixed inset-0 flex items-center justify-center bg-white z-50">
    <div className="flex flex-col items-center">
      {/* Example Spinner - you can use FaSpinner from react-icons */}
      
      <div className="relative inline-block">
          <svg className="animate-spin -ml-1 mr-3 h-12 w-12 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <div className="absolute inset-0 bg-blue-200 rounded-full animate-ping opacity-20"></div>
      </div>
      <p className="mt-2 text-gray-600">Hang tight, loading...</p>
    </div>
  </div>
);

function App() {
  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const [appLoading, setAppLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);


  // Function to transition the splash screen out
  const finishLoading = useCallback(() => {
    if (hasLoaded) return;
    setHasLoaded(true);

    // 1. Start the fade-out (set appLoading to false)
    setAppLoading(false);

  }, [hasLoaded]);

  useEffect(() => {
    // --- Primary Mechanism: Browser's Full Load Event ---
    const handleLoad = () => {
      // Ensure a minimum display time of 500ms before finishing
      setTimeout(finishLoading, 500); 
    };

    window.addEventListener('load', handleLoad);

    // --- Fallback Mechanism: Max Timeout ---
    // If the 'load' event hasn't fired after 8 seconds, force the app to load.
    const fallbackTimeout = setTimeout(() => {
        console.warn('Fallback: Forcing app load after timeout.');
        finishLoading();
    }, 8000); // 8 seconds is usually enough for a slow mobile connection

    // --- Cleanup Function ---
    return () => {
      window.removeEventListener('load', handleLoad);
      clearTimeout(fallbackTimeout);
    };
  }, [finishLoading]);// Empty dependency array ensures this runs once after the initial render

   

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <Router basename="/">
        <AuthProvider>
          <CartProvider>
            <ScrollToTop />
             {appLoading ? (
              <LoadingSplash />
            ) : (
              <>
              <GoogleMapsLoader />
              <AppContent />
              </>
            )}
          </CartProvider>
        </AuthProvider>
      </Router>
    </GoogleOAuthProvider>
  );
}

export default App;