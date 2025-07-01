import { BrowserRouter as Router, Route, Routes, useLocation, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { CartProvider } from './context/CartContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Navbar from './components/Navbar';
import Register from './components/Register';
import VerifyEmail from './pages/VerifyEmail';
import Services from './pages/Services';
import Cart from './pages/Cart';
import Login from './components/Login';
import TempVerifyEmail from './pages/TempVerifyEmail';
import Checkout from './pages/Checkout';
import RateAndServices from './pages/RateAndServices';
import Home from './pages/Home';
import About from './pages/About';
import ChangePassword from './pages/ChangePassword';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import AuthProvider from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import GetOrder from './pages/GetOrder';
import MyOrders from './pages/MyOrders';
import FailedOrders from './pages/FailedOrders';

const AppContent = () => {
  const location = useLocation();
  const hideNavbarOn = ['/login', '/register'];
  const shouldHideNavbar = hideNavbarOn.includes(location.pathname);

  return (
    <div className="flex flex-col min-h-screen">
      {!shouldHideNavbar && <Navbar />} {/* Conditionally render Navbar based on the current route */}
      <main className="flex-grow">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<Home />} />
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
      <Router>
        <AuthProvider>
          <CartProvider>
            <AppContent />
          </CartProvider>
        </AuthProvider>
      </Router>
    </GoogleOAuthProvider>
  );
}

export default App;