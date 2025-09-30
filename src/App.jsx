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
import TempVerifyEmail from './pages/TempVerifyEmail';
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
import FailedOrders from './pages/FailedOrders';
import { useContext, useEffect, useState } from 'react';
import { AuthContext } from './context/AuthContext';
import ScrollToTop from './components/ScrollToTop';

const AppContent = () => {
  const location = useLocation();
  const hideNavbarOn = ['/login', '/register', '/temp-verify-email'];
  const shouldHideNavbar = hideNavbarOn.includes(location.pathname);


  return (
    <div className="flex flex-col min-h-screen">
      {!shouldHideNavbar && <Navbar />} {/* Conditionally render Navbar based on the current route */}
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/services" element={<Services />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/temp-verify-email" element={<TempVerifyEmail />} />
          <Route path="/rate-and-services" element={<RateAndServices />} />
          <Route path="/about-us" element={<About />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route
            path="/checkout"
            element={
              <ProtectedRoute>
                <Checkout />
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
            path="/orders/:orderSlug"
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
      <svg className="animate-spin -ml-1 mr-3 h-10 w-10 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <p className="mt-4 text-gray-700 font-medium">Hang tight, loading...</p>
    </div>
  </div>
);

function App() {
  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const [appLoading, setAppLoading] = useState(true);

  useEffect(() => {
    
    const handleLoad = () => {
      setTimeout(() => {
        setAppLoading(false);
      }, 500);
    };

    // Attach the event listener to the window
    window.addEventListener('load', handleLoad);

    // Clean up the event listener when the component unmounts
    return () => {
      window.removeEventListener('load', handleLoad);
    };
  }, []); // Empty dependency array ensures this runs once after the initial render

   

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <Router basename="/">
        <AuthProvider>
          <CartProvider>
            <ScrollToTop />
             {appLoading ? (
              <LoadingSplash />
            ) : (
              <AppContent />
            )}
          </CartProvider>
        </AuthProvider>
      </Router>
    </GoogleOAuthProvider>
  );
}

export default App;