// src/pages/UserVerifyEmail.jsx
// "Check your email" after sign-up (or when an unverified user is stopped), with resend.
import { useState, useEffect, useContext } from 'react';
import { toast } from 'react-toastify';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import AuthLayout from '../components/AuthLayout';
import api from '../api';

export const VERIFY_CSS = `
  .kkve-mark{width:64px;height:64px;display:grid;place-items:center;margin-bottom:22px;background:var(--ink,#0A0B0A);color:#fff}
  .kkve-mark.ok{background:var(--green,#1A7A1A)}
  .kkve-mark.bad{background:var(--red,#B42318)}
  .kkve-mark svg{width:30px;height:30px}
  .kkve-mail{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:0 0 20px;padding:14px 16px;border:1.5px dashed var(--line,#D9DFD7);background:#fff}
  .kkve-mail small{display:block;font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--muted,#4D564C)}
  .kkve-mail b{display:block;margin-top:2px;font-size:16px;overflow-wrap:anywhere}
  .kkve-mail a{flex:none;font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--ink,#0A0B0A)}
  .kkve-steps{list-style:none;margin:0 0 22px;padding:0;border-top:2px solid var(--ink,#0A0B0A)}
  .kkve-steps li{display:grid;grid-template-columns:34px 1fr;gap:8px;padding:12px 0;border-bottom:1px solid var(--line,#D9DFD7);font-size:15px;line-height:1.45}
  .kkve-steps li p{margin:0}
  .kkve-steps li span{font-family:"Anton","Arial Narrow",Impact,sans-serif;font-size:20px;line-height:1.1;color:var(--green,#1A7A1A)}
  .kkve-stack{display:grid;gap:10px}
  .kkve-help{margin:18px 0 0;font-size:14px;line-height:1.55;color:var(--muted,#4D564C)}
  .kkve-help a{color:var(--ink,#0A0B0A);font-weight:700;text-decoration:underline;text-underline-offset:3px}
  .kkve-help a:hover{color:var(--green,#1A7A1A)}
  .kkve-bar{height:4px;margin:6px 0 20px;background:var(--line,#D9DFD7);overflow:hidden;position:relative}
  .kkve-bar::after{content:"";position:absolute;top:0;bottom:0;width:35%;background:var(--green,#1A7A1A);animation:kkveSlide 1.1s cubic-bezier(.77,0,.18,1) infinite}
  @keyframes kkveSlide{from{left:-35%}to{left:100%}}
  @media (prefers-reduced-motion:reduce){.kkve-bar::after{animation:none;width:100%;left:0}}
`;

export const Icon = {
  mail: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M3 6h18v12H3z M3 6l9 7 9-7" strokeLinejoin="round" /></svg>,
  check: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true"><path d="M5 12.5l4.2 4.2L19 7" /></svg>,
  cross: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>,
};

const UserVerifyEmail = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { refreshToken, updateTokens, isAuthenticated } = useContext(AuthContext);

  const urlParams = new URLSearchParams(location.search);
  const userEmail = urlParams.get('email');
  const nextPath = urlParams.get('next');
  const isExpired = urlParams.get('expired') === 'true';
  const fromLogin = urlParams.get('from') === 'login';

  const [cooldown, setCooldown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [sentAgain, setSentAgain] = useState(false);

  const refreshSession = async () => {
    if (!(isAuthenticated && refreshToken && updateTokens)) return;
    try {
      const r = await api.post('/api/users/token/refresh/', { refresh: refreshToken });
      updateTokens(r.data.access, r.data.refresh);
    } catch (err) {
      console.error('Failed to refresh token:', err);
    }
  };

  const checkVerificationStatus = async () => {
    if (!userEmail) return;
    setCheckingStatus(true);
    try {
      const response = await api.post('/api/users/check-verification-status/', { email: userEmail });
      if (response.data?.is_verified) {
        setIsVerified(true);
        await refreshSession();
      }
    } catch (err) {
      console.error('Error checking verification status:', err);
    } finally {
      setCheckingStatus(false);
    }
  };

  useEffect(() => {
    if (fromLogin) checkVerificationStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromLogin]);

  // Resend countdown
  useEffect(() => {
    if (!cooldown) return undefined;
    const id = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  // No auto-send on mount: the backend already sent the email at sign-up.
  const handleResendVerification = async () => {
    if (cooldown > 0 || loading) return;
    setLoading(true);
    try {
      const response = await api.post('/api/users/resend-verification-email/', { email: userEmail, next: nextPath || '/' });
      const flag = response.data?.status_flag;
      if (flag === 'SENT') {
        setCooldown(30);
        setIsVerified(false);
        setSentAgain(true);
        toast.success(response.data?.message || 'New verification email sent.');
      } else if (flag === 'VERIFIED') {
        setIsVerified(true);
        await refreshSession();
      }
    } catch (err) {
      const message = err.response?.data?.message || err.response?.data?.error || "Couldn't send the email. Try again in a moment.";
      if (err.response?.status === 429) {
        toast.warn(message);
        setCooldown(30);
      } else {
        toast.error(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLoginRedirect = () => {
    navigate('/auth/login', { state: { email: userEmail, message: 'Your email is verified! Please log in.', redirectTo: nextPath } });
  };

  if (!userEmail) {
    return (
      <AuthLayout eyebrow="Email verification" title="Nothing to verify" subtitle="We couldn't tell which email to check. Sign up or log in, and we'll take it from there.">
        <style>{VERIFY_CSS}</style>
        <div className="kkve-stack">
          <Link to="/auth/register" className="kka-btn">Create an account <span className="ar" aria-hidden="true">→</span></Link>
          <Link to="/auth/login" className="kka-gbtn">Log in</Link>
        </div>
      </AuthLayout>
    );
  }

  if (isVerified) {
    return (
      <AuthLayout eyebrow="Email verification" title="You're verified" subtitle="Your email is confirmed. Log in to book your first Klean.">
        <style>{VERIFY_CSS}</style>
        <span className="kkve-mark ok" aria-hidden="true">{Icon.check}</span>
        <div className="kkve-mail"><span><small>Verified email</small><b>{userEmail}</b></span></div>
        <button type="button" className="kka-btn" onClick={handleLoginRedirect}>Log in <span className="ar" aria-hidden="true">→</span></button>
        <p className="kkve-help">Can't log in? <Link to="/auth/forgot-password">Reset your password</Link>.</p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      eyebrow={isExpired ? 'Link expired' : 'One more step'}
      title="Check your email"
      subtitle={isExpired
        ? 'That verification link has expired. Send yourself a new one below.'
        : 'We sent you a link to confirm your email. Open it to activate your account.'}
    >
      <style>{VERIFY_CSS}</style>
      <span className="kkve-mark" aria-hidden="true">{Icon.mail}</span>

      <div className="kkve-mail">
        <span><small>Sent to</small><b>{userEmail}</b></span>
        <Link to="/auth/register">Wrong email?</Link>
      </div>

      {sentAgain && <p className="kka-note" role="status">New link sent. It can take a minute to arrive.</p>}
      {checkingStatus && <div className="kkve-bar" role="status" aria-label="Checking verification status" />}

      <ol className="kkve-steps">
        <li><span>01</span><p>Open the email from KleanKickx. Check spam or promotions if it isn't in your inbox.</p></li>
        <li><span>02</span><p>Tap <b>Verify email</b>. It opens this site and confirms your account.</p></li>
        <li><span>03</span><p>Log in and book your first Klean.</p></li>
      </ol>

      <div className="kkve-stack">
        <button type="button" className="kka-btn" onClick={handleResendVerification} disabled={cooldown > 0 || loading}>
          {loading ? <><span className="kka-spin" aria-hidden="true" /> Sending…</>
            : cooldown > 0 ? `Resend in ${cooldown}s`
            : <>Resend the email <span className="ar" aria-hidden="true">→</span></>}
        </button>
        <button type="button" className="kka-gbtn" onClick={fromLogin ? checkVerificationStatus : handleLoginRedirect} disabled={checkingStatus}>
          {fromLogin ? "I've verified, check again" : "I've verified, log in"}
        </button>
      </div>

      <p className="kkve-help">Still nothing after a few minutes? Message us on <a href="https://wa.me/233536278834" target="_blank" rel="noreferrer">WhatsApp</a> and we'll sort it out.</p>
    </AuthLayout>
  );
};

export default UserVerifyEmail;
