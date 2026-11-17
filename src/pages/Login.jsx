// src/pages/Login.jsx
import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { GoogleLogin } from '@react-oauth/google';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import 'react-toastify/dist/ReactToastify.css';
import { motion, AnimatePresence } from 'framer-motion';
import logo from "../assets/logo2.png";
import api from '../api';
import AuthLayout, { Field, SubmitButton, useGoogleWidth } from '../components/AuthLayout';

// Forgot Password Modal Component
const ForgotPasswordModal = ({ isOpen, onClose, onSuccess }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const close = () => {
    if (loading) return;
    onClose();
    setTimeout(() => { setSubmitted(false); setError(''); }, 250);
  };

  // Esc closes; the page behind doesn't scroll while it's open.
  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => e.key === 'Escape' && close();
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, loading]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      setError('Enter your email address.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("That doesn't look like an email address.");
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.post('/api/users/password/reset/', { email });
      if (response.data.success || response.status === 200) {
        setSubmitted(true);
        onSuccess?.(email);
      }
    } catch (err) {
      // Same message either way, so the form never reveals whether an account exists.
      console.error('Password reset error:', err);
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div className="kka-modal" onClick={close}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
          <style>{`
            .kka-modal{--ink:#0A0B0A;--paper:#F7F9F6;--card:#fff;--line:#D9DFD7;--muted:#4D564C;--green:#1A7A1A;--green-hi:#4CB84C;--red:#B42318;
              --display:"Anton","Arial Narrow",Impact,sans-serif;--body:"League Spartan",system-ui,sans-serif;--spring:cubic-bezier(.2,1.25,.3,1);
              position:fixed;inset:0;z-index:60;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(10,11,10,.55);backdrop-filter:blur(3px);
              font-family:var(--body);color:var(--ink)}
            .kka-modal-card{width:100%;max-width:460px;background:var(--paper);border:2px solid var(--ink);box-shadow:0 40px 80px -40px rgba(10,11,10,.6)}
            .kka-modal-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;padding:22px 22px 16px;border-bottom:2px solid var(--ink)}
            .kka-modal-head h3{margin:6px 0 0;font-family:var(--display);font-weight:400;text-transform:uppercase;font-size:40px;line-height:.92}
            .kka-modal-x{flex:none;width:42px;height:42px;display:grid;place-items:center;border:2px solid var(--ink);background:none;color:var(--ink);cursor:pointer;
              transition:background .2s,color .2s,transform .3s var(--spring)}
            .kka-modal-x:hover{background:var(--ink);color:#fff;transform:rotate(90deg)}
            .kka-modal-body{padding:20px 22px 22px}
            .kka-modal-body .kka-sub{margin:0 0 18px}
            .kka-modal-body .kka-field{margin-bottom:14px}
            .kka-modal-done{text-align:left}
            .kka-modal-mark{width:56px;height:56px;display:grid;place-items:center;background:var(--green);color:#fff;margin-bottom:16px}
            .kka-modal-done h4{margin:0;font-family:var(--display);font-weight:400;text-transform:uppercase;font-size:30px;line-height:.95}
            .kka-modal-done p{margin:10px 0 0;color:var(--muted);line-height:1.55}
            .kka-modal-done p b{color:var(--ink);overflow-wrap:anywhere}
            .kka-modal-row{display:flex;gap:10px;margin-top:20px}
            .kka-modal-btn{flex:1;display:inline-flex;align-items:center;justify-content:center;gap:10px;height:52px;padding:0 16px;border:2px solid var(--ink);border-radius:2px;
              background:transparent;color:var(--ink);font:inherit;font-size:15px;font-weight:700;cursor:pointer;transition:background .2s,color .2s,border-color .2s}
            .kka-modal-btn:hover{background:var(--ink);color:#fff}
            .kka-modal-btn.go{background:var(--green);border-color:var(--green);color:#fff}
            .kka-modal-btn.go:hover{background:var(--ink);border-color:var(--ink)}
            .kka-modal :focus-visible{outline:2px solid var(--green);outline-offset:3px}
            @media (max-width:520px){
              .kka-modal{align-items:flex-end;padding:0}
              .kka-modal-card{max-width:none;border-width:2px 0 0}
              .kka-modal-head h3{font-size:34px}
              .kka-modal-body{padding-bottom:calc(22px + env(safe-area-inset-bottom,0px))}
              .kka-modal-row{flex-direction:column-reverse}
            }
          `}</style>
          <motion.div className="kka-modal-card" role="dialog" aria-modal="true" aria-labelledby="kka-reset-title"
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.4, ease: [0.77, 0, 0.18, 1] }}>
            <div className="kka-modal-head">
              <div>
                <p className="kka-eyebrow">Forgot your password?</p>
                <h3 id="kka-reset-title">{submitted ? 'Check your inbox' : 'Reset it'}</h3>
              </div>
              <button type="button" className="kka-modal-x" onClick={close} aria-label="Close">
                <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true"><path d="M2 2l12 12M14 2L2 14" stroke="currentColor" strokeWidth="2.2" /></svg>
              </button>
            </div>

            <div className="kka-modal-body">
              {!submitted ? (
                <>
                  <p className="kka-sub">Enter the email you signed up with and we'll send you a link to choose a new password.</p>
                  {error && <p className="kka-note err" role="alert">{error}</p>}
                  <form onSubmit={handleSubmit} noValidate>
                    <Field id="reset-email" label="Email" type="email" inputMode="email" autoComplete="email" placeholder="you@example.com"
                      value={email} onChange={(e) => { setEmail(e.target.value); if (error) setError(''); }} disabled={loading} autoFocus />
                    <SubmitButton busy={loading} busyLabel="Sending…">Send reset link</SubmitButton>
                  </form>
                </>
              ) : (
                <motion.div className="kka-modal-done" role="status"
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
                  <span className="kka-modal-mark" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="26" height="26"><path d="M3 6h18v12H3z M3 6l9 7 9-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" /></svg>
                  </span>
                  <h4>Link on its way</h4>
                  <p>If there's an account for <b>{email}</b>, we've sent a link to reset the password. It can take a minute, so check spam or promotions too.</p>
                  <div className="kka-modal-row">
                    <button type="button" className="kka-modal-btn" onClick={() => setSubmitted(false)}>Use a different email</button>
                    <button type="button" className="kka-modal-btn go" onClick={close}>Back to log in</button>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Reset Password Component
export const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const token = searchParams.get('token');
  const uid = searchParams.get('uid');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!token || !uid) {
      setError('Invalid reset link. Please request a new one.');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/api/auth/password-reset-confirm/', {
        uid,
        token,
        new_password: password
      });

      if (response.data.success || response.status === 200) {
        setSuccess(true);
        toast.success('Password reset successful! Please login with your new password.');
        
        setTimeout(() => {
          navigate('/auth/login');
        }, 3000);
      }
    } catch (err) {
      console.error('Password reset error:', err);
      setError(
        err.response?.data?.error || 
        'Failed to reset password. The link may be expired or invalid.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (!token || !uid) {
    return (
      <div className="bg-[#edf1f4] min-h-screen flex justify-center items-center px-4">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Invalid Reset Link</h2>
          <p className="text-gray-600 mb-4">
            This password reset link is invalid or has expired.
          </p>
          <Link
            to="/auth/login"
            className="inline-block bg-primary hover:bg-primary/90 text-white py-2 px-6 rounded-lg transition"
          >
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#edf1f4] min-h-screen flex justify-center items-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-white rounded-lg shadow-md p-6 w-full max-w-md"
      >
        <div className="text-center mb-6">
          <Link to="/">
            <img src={logo} className="w-[8rem] mx-auto" alt="KleanKickx Logo" />
          </Link>
          <h2 className="text-2xl font-bold text-gray-800 mt-4">Create New Password</h2>
          <p className="text-gray-600 text-sm mt-1">Enter your new password below</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {success ? (
          <div className="text-center py-4">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Password Reset Successfully!</h3>
            <p className="text-gray-600">Redirecting you to login...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full pr-10 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-primary"
                >
                  {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your new password"
                  className="w-full pr-10 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                  disabled={loading}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 text-white py-2 rounded-lg font-medium transition duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Resetting Password...
                </>
              ) : (
                'Reset Password'
              )}
            </button>

            <div className="text-center">
              <Link to="/auth/login" className="text-primary hover:underline text-sm">
                Back to Login
              </Link>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
};

// Spinner Component
const LoadingSpinner = ({ size = "h-5 w-5" }) => (
  <svg className={`animate-spin ${size} text-white`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);

// Main Login Component
const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isMerging, setIsMerging] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const { mergeGuestCart, refreshCart } = useContext(CartContext);
  const { login, googleLogin, user, refreshUserData, isPartner } = useContext(AuthContext);

  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const continueUrl = searchParams.get('continue');
  const from = location.state?.from || '/';
  const message = location.state?.message;
  const highlightServiceId = location.state?.highlightServiceId;
  const pendingRecovery = location.state?.pendingRecovery;

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // Check for pending cart recovery after login (only for customers)
  useEffect(() => {
    if (user && !isPartner) {
      const pendingRecoveryId = sessionStorage.getItem('pending_recovery_cart_id');
      
      if (pendingRecoveryId) {
        sessionStorage.removeItem('pending_recovery_cart_id');
        toast.success('Welcome back! Restoring your cart...');
        navigate(`/cart?recover=${pendingRecoveryId}`, { replace: true });
      } else if (pendingRecovery) {
        navigate(`/cart?recover=${pendingRecovery}`, { replace: true });
      }
    }
  }, [user, isPartner, navigate, pendingRecovery]);


useEffect(() => {
  // Check if user came from email verification
  const searchParams = new URLSearchParams(location.search);
  const verified = searchParams.get('verified');
  const email = searchParams.get('email');
  
  if (verified === 'true') {
    toast.success(
      email 
        ? `Email verified! You can now login with ${email}`
        : 'Email verified successfully! Please login to continue.',
      { 
        position: 'top-right',
        autoClose: 5000
      }
    );
    
    // Clean up URL without refreshing
    const newSearchParams = new URLSearchParams(location.search);
    newSearchParams.delete('verified');
    newSearchParams.delete('email');
    const newSearch = newSearchParams.toString();
    const newPath = location.pathname + (newSearch ? `?${newSearch}` : '');
    navigate(newPath, { replace: true });
  }
}, [location, navigate]);

  const handlePostLogin = async (userData) => {
    console.log('[Login] Starting post-login actions...');
    console.log('[Login] User data from login:', userData);
    
    // Use the userData from the login response to determine partner status
    const isPartnerUser = userData?.is_partner === true;
    console.log('[Login] Is partner from userData:', isPartnerUser);
    
    setIsMerging(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log('[Login] Refreshing user data...');
      await refreshUserData();
      
      // Skip cart operations for partners - use the value from userData
      if (!isPartnerUser) {
        console.log('[Login] Customer login - syncing cart...');
        try {
          await refreshCart();
          const mergedCart = await mergeGuestCart();
          console.log('[Login] Merge result:', mergedCart);
          
          if (mergedCart) {
            toast.success('Cart synced with your account!', { autoClose: 3000 });
          }
        } catch (cartErr) {
          console.error('[Login] Cart sync error:', cartErr);
        }
      } else {
        console.log('[Login] PARTNER LOGIN - Skipping all cart operations');
        // Clear any cart data from localStorage for partners
        localStorage.removeItem('cart_session_id');
      }
    } catch (err) {
      console.error('[Login] Post-login error:', err);
      if (!isPartnerUser) {
        toast.warning('Login successful, but cart sync encountered an issue.', {
          autoClose: 4000,
        });
      }
    } finally {
      setIsMerging(false);
    }

    toast.success('Logged in successfully!', { autoClose: 2000 });
    
    // Role-based redirect - use the value from userData
    console.log('[Login] Redirecting based on partner status:', isPartnerUser);
    
    if (isPartnerUser) {
      console.log('[Login] 🚀 Redirecting to partner dashboard');
      navigate('/partner/dashboard', { replace: true });
      return;
    }
    
    // Customer redirect logic
    console.log('[Login] Redirecting to customer destination');
    const pendingRecoveryId = sessionStorage.getItem('pending_recovery_cart_id');
    if (pendingRecoveryId) {
      sessionStorage.removeItem('pending_recovery_cart_id');
      navigate(`/cart?recover=${pendingRecoveryId}`, { replace: true });
      return;
    }
    
    if (pendingRecovery) {
      navigate(`/cart?recover=${pendingRecovery}`, { replace: true });
      return;
    }
    
    if (continueUrl) {
      navigate(continueUrl, { replace: true });
    } else if (highlightServiceId) {
      navigate('/services', {
        state: { highlightServiceId, showSuccessMessage: 'Welcome back!' },
        replace: true,
      });
    } else {
      navigate(from, { replace: true });
    }
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    
    setError('');
    
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }
    if (!validateEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    
    try {
      console.log('[Login] Email login...');
      const userData = await login(email, password);
      console.log('[Login] Email login successful, userData:', userData);
      
      // Pass the userData directly to handlePostLogin
      await handlePostLogin(userData);
    } catch (err) {
      console.error('[Login] Email login error:', err);
      
      if (err.response) {
        const status = err.response.status;
        const data = err.response.data;
        
        if (status === 401) {
          setError('Invalid email or password. Please try again.');
          toast.error('Invalid email or password.');
        } else if (status === 400) {
          setError(data.detail || data.error || 'Please check your credentials.');
          toast.error(data.detail || 'Login failed. Please check your input.');
        } else if (status === 429) {
          setError('Too many login attempts. Please try again later.');
          toast.error('Too many attempts. Please wait a moment.');
        } else {
          setError('Login failed. Please try again.');
          toast.error('Login failed. Please try again later.');
        }
      } else if (err.request) {
        setError('Network error. Please check your connection.');
        toast.error('Network error. Please try again.');
      } else {
        setError('An unexpected error occurred. Please try again.');
        toast.error('Login failed. Please try again.');
      }
      setLoading(false);
    }
  };

  const handleGoogleLoginSuccess = async (credentialResponse) => {
    setLoading(true);
    setError('');
    
    try {
      console.log('[Login] Google login initiated...');
      const userData = await googleLogin(credentialResponse);
      console.log('[Login] Google login successful, userData:', userData);
      
      await handlePostLogin(userData);
    } catch (err) {
      console.error('[Login] Google login error:', err);
      
      if (err.response?.status === 401) {
        setError('Google login failed. Please try again.');
        toast.error('Google authentication failed.');
      } else {
        setError('Google login failed. Please try again.');
        toast.error('Google login failed. Please try again.');
      }
      setLoading(false);
    }
  };

  const busy = loading || isMerging;
  const googleWidth = useGoogleWidth();
  return (
    <>
      <ForgotPasswordModal
        isOpen={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
        onSuccess={() => {}}
      />

      <AuthLayout
        headline="Welcome back"
        eyebrow="Your account"
        title="Log in"
        subtitle="Pick up where you left off: your cart, your orders and every pair we've kleaned."
      >
        {message && <p className="kka-note warn" role="status">{message}</p>}
        {continueUrl?.includes('/vouchers') && (
          <p className="kka-note" role="status">After you log in, we'll take you back to finish your voucher purchase.</p>
        )}
        {isMerging && <p className="kka-note" role="status"><span className="kka-spin" style={{ borderColor: 'rgba(22,77,22,.25)', borderTopColor: '#164D16' }} /> Syncing your cart…</p>}
        {error && <p className="kka-note err" role="alert">{error}</p>}

        <form onSubmit={handleEmailLogin} noValidate>
          <Field id="email" label="Email" type="email" inputMode="email" autoComplete="email" placeholder="you@example.com"
            value={email} onChange={(e) => setEmail(e.target.value)} disabled={busy} />
          <Field id="password" label="Password" type="password" autoComplete="current-password" placeholder="Your password"
            value={password} onChange={(e) => setPassword(e.target.value)} disabled={busy}>
            <button type="button" className="kka-link" style={{ fontSize: 13, letterSpacing: 0, textTransform: 'none' }}
              onClick={() => setShowForgotPassword(true)} disabled={busy}>
              Forgot password?
            </button>
          </Field>
          <SubmitButton busy={busy} busyLabel={isMerging ? 'Syncing your cart…' : 'Logging in…'}>Log in</SubmitButton>
        </form>

        <div className="kka-or">or</div>
        <div className="kka-google">
          <GoogleLogin
            onSuccess={handleGoogleLoginSuccess}
            onError={() => setError('Google login failed. Please try again.')}
            text="signin_with" shape="rectangular" theme="outline" size="large" width={googleWidth}
          />
        </div>

        <p className="kka-switch">
          <span>New to KleanKickx?</span>
          <Link to="/auth/register" state={location.state}>Create an account <span aria-hidden="true">→</span></Link>
        </p>
        <p className="kka-legal">
          <Link to="/legal" state={{ tab: 'privacy' }}>Privacy Policy</Link> · <Link to="/legal" state={{ tab: 'terms' }}>Terms of Service</Link> · <Link to="/studio">Studio</Link>
        </p>
      </AuthLayout>
    </>
  );
};

export default Login;