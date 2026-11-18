// src/pages/VerifyEmail.jsx
// Opened from the verification email: confirms the key, then moves the user on.
import React, { useState, useEffect, useRef, useContext } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import api from '../api';
import AuthLayout from '../components/AuthLayout';
import { VERIFY_CSS, Icon } from './UserVerifyEmail';

const VerifyEmail = () => {
  const navigate = useNavigate();
  const { cartExpired } = useContext(CartContext);
  const { login } = useContext(AuthContext);

  const hasVerified = useRef(false);

  const [status, setStatus] = useState('verifying'); // verifying | success | already_verified | error
  const [error, setError] = useState('');

  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const key = searchParams.get('key');
  const userEmail = searchParams.get('email');
  const nextRedirectPath = searchParams.get('next') || '/';
  const { refreshToken, updateTokens, isAuthenticated } = useContext(AuthContext);

  useEffect(() => {
    // If verification already ran or key is missing, stop.
    if (hasVerified.current || !key || !api) return;

    const verifyEmail = async () => {
      hasVerified.current = true;
      try {
        // 1. Call the verification endpoint
        const response = await api.post(`/api/users/verify-email/${key}/`, {
          withCredentials: true,
        });

        if (cartExpired) {
          toast.warn('Your cart was cleared due to expiration and synced with the server.');
        }

        const responseStatus = response.data.status;
        setStatus(responseStatus);

        if (responseStatus === 'success' || responseStatus === 'already_verified') {
          // Determine the final redirect path
          const finalRedirect = nextRedirectPath.startsWith('/') ? nextRedirectPath : '/';

          // Check if user is authenticated
          if (isAuthenticated && refreshToken) {
            // User is logged in - refresh token to get updated claims
            try {
              const refreshResponse = await api.post(
                '/api/users/token/refresh/', 
                { refresh: refreshToken }
              );
              
              if (updateTokens) {
                console.log("Updating tokens after verification");
                updateTokens(refreshResponse.data.access, refreshResponse.data.refresh);
              }
              
              const successMessage = responseStatus === 'success' 
                ? 'Email verified successfully!'
                : 'Your email was already verified. Session updated.';

              toast.success(successMessage);

              // Redirect to the intended page
              setTimeout(() => {
                navigate(finalRedirect);
              }, 1500);

            } catch (refreshErr) {
              console.error('Token refresh failed post-verification, redirecting to login.', refreshErr);
              // Fallback to login redirect
              const redirectPath = userEmail 
                ? `/auth/login?email=${encodeURIComponent(userEmail)}&verified=true` 
                : '/auth/login?verified=true';
              toast.success('Email verified! Please log in to complete the process.');
              setTimeout(() => navigate(redirectPath), 1500);
            }
          } else {
            // User is NOT logged in - redirect to login with success message
            const redirectPath = userEmail 
              ? `/auth/login?email=${encodeURIComponent(userEmail)}&verified=true` 
              : '/auth/login?verified=true';
            
            const successMessage = responseStatus === 'success' 
              ? 'Email verified successfully! Please log in to continue.'
              : 'This email is already verified. Please log in.';

            toast.success(successMessage);
            setTimeout(() => navigate(redirectPath), 1500);
          }
        }
        
      } catch (err) {
        console.error('Email verification error:', err);
        const errorMsg =
          err.response?.data?.error ||
          err.message ||
          'Verification failed. Please try again.';
        setError(errorMsg);
        setStatus('error');
        hasVerified.current = false;
      }
    };

    verifyEmail();
  }, [navigate, cartExpired, key, api, refreshToken, updateTokens, userEmail, isAuthenticated]);

  const retryLink = `/auth/confirm-email/?email=${encodeURIComponent(userEmail || '')}&expired=true`;
  const linkProblem = /expired|invalid/i.test(error);

  // Missing key: the link was cut off (e.g. copied from the email incompletely)
  if (!key) {
    return (
      <AuthLayout eyebrow="Email verification" title="Link incomplete" subtitle="This verification link is missing part of it. Open the link from the email again, or send yourself a new one.">
        <style>{VERIFY_CSS}</style>
        <span className="kkve-mark bad" aria-hidden="true">{Icon.cross}</span>
        <div className="kkve-stack">
          {userEmail && <Link to={retryLink} className="kka-btn">Send a new link <span className="ar" aria-hidden="true">→</span></Link>}
          <Link to="/auth/login" className={userEmail ? 'kka-gbtn' : 'kka-btn'}>Back to log in</Link>
        </div>
      </AuthLayout>
    );
  }

  if (status === 'success' || status === 'already_verified') {
    const fresh = status === 'success';
    return (
      <AuthLayout eyebrow="Email verification" title={fresh ? "You're verified" : 'Already verified'}
        subtitle={fresh ? 'Thanks for confirming your email. Taking you on now…' : 'This email was confirmed earlier. Taking you on now…'}>
        <style>{VERIFY_CSS}</style>
        <span className="kkve-mark ok" aria-hidden="true">{Icon.check}</span>
        {userEmail && <div className="kkve-mail"><span><small>Verified email</small><b>{userEmail}</b></span></div>}
        <div className="kkve-bar" role="status" aria-label="Redirecting" />
      </AuthLayout>
    );
  }

  if (status === 'error') {
    return (
      <AuthLayout eyebrow="Email verification" title={linkProblem ? 'Link expired' : "Couldn't verify"}
        subtitle={linkProblem ? 'Verification links only work for a while. Send yourself a fresh one and try again.' : 'Something went wrong while confirming your email.'}>
        <style>{VERIFY_CSS}</style>
        <span className="kkve-mark bad" aria-hidden="true">{Icon.cross}</span>
        {error && <p className="kka-note err" role="alert">{error}</p>}
        <div className="kkve-stack">
          {(linkProblem || userEmail) && (
            <button type="button" className="kka-btn" onClick={() => navigate(retryLink)}>Send a new link <span className="ar" aria-hidden="true">→</span></button>
          )}
          <button type="button" className={linkProblem || userEmail ? 'kka-gbtn' : 'kka-btn'} onClick={() => navigate('/auth/login')}>Back to log in</button>
        </div>
        <p className="kkve-help">Need a hand? Message us on <a href="https://wa.me/233536278834" target="_blank" rel="noreferrer">WhatsApp</a>.</p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout eyebrow="Email verification" title="Verifying…" subtitle="Confirming your email address. This only takes a moment.">
      <style>{VERIFY_CSS}</style>
      <span className="kkve-mark" aria-hidden="true">{Icon.mail}</span>
      <div className="kkve-bar" role="status" aria-label="Verifying your email" />
      {userEmail && <div className="kkve-mail"><span><small>Email</small><b>{userEmail}</b></span></div>}
    </AuthLayout>
  );
};

export default VerifyEmail;
