// src/pages/Register.jsx
import { useState, useContext, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { AuthContext } from '../context/AuthContext';
import { trackEvent } from '../utils/analytics';
import AuthLayout, { Field, SubmitButton, apiError, GoogleButton } from '../components/AuthLayout';
import { getReturnTo, continueSearch } from '../utils/returnTo';

const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:10000';
const validEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const MIN_PW = 8;

const Register = () => {
  const { googleLogin } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const message = location.state?.message;            // e.g. "Sign up to claim your free Standard Klean."
  const from = getReturnTo(location); // e.g. /checkout: back there after signing up

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [usingReferral, setUsingReferral] = useState(false);
  const [showReferral, setShowReferral] = useState(false);
  const [error, setError] = useState('');
  const [emailTaken, setEmailTaken] = useState(false);
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);

  // Referral code from a shared link (?ref=CODE)
  useEffect(() => {
    const ref = new URLSearchParams(location.search).get('ref');
    if (ref) { setReferralCode(ref); setUsingReferral(true); }
  }, [location.search]);

  const trackSignUp = (method) => {
    try { trackEvent('sign_up', { method }); } catch { /* analytics must never block sign-up */ }
  };

  const pwOk = password.length >= MIN_PW;

  const handleEmailRegister = async (e) => {
    e.preventDefault();
    setTouched(true);
    setError(''); setEmailTaken(false);
    if (!firstName.trim()) return setError('Please enter your first name.');
    if (!lastName.trim()) return setError('Please enter your last name.');
    if (!validEmail(email)) return setError('Please enter a valid email address.');
    if (!pwOk) return setError(`Your password needs at least ${MIN_PW} characters.`);

    setLoading(true);
    try {
      await axios.post(`${backendUrl}/api/users/register/`, {
        email: email.trim(),
        password,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        referral_code: referralCode || null,
      }, { withCredentials: true });
      trackSignUp('email');
      toast.success('Account created. Check your email to verify it.');
      navigate('/auth/confirm-email/?email=' + encodeURIComponent(email.trim()) + (from ? '&next=' + encodeURIComponent(from) : ''));
    } catch (err) {
      const msg = apiError(err, "We couldn't create your account. Please try again.");
      setEmailTaken(/already (exists|in use)/i.test(msg));
      setError(msg);
      setLoading(false);
    }
  };

  const handleGoogle = async (credentialResponse) => {
    setLoading(true); setError('');
    try {
      const userData = await googleLogin(credentialResponse, referralCode);
      if (userData?.isNewUser) {
        trackSignUp('google');
        toast.success('Welcome to KleanKickx!');
      } else {
        // Signed up with Google but already had an account: just log them in and say so.
        toast.success("Welcome back! You already had an account, so we've logged you in.", { autoClose: 6000 });
      }
      if (userData?.passwordReset) toast.info("For your security, we've switched off this account's old password. You can set a new one any time in Account → Change password.", { autoClose: 10000 });
      navigate(from || '/', { replace: true });
    } catch (err) {
      setError(apiError(err, 'Google sign-up failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      headline="Fresh pairs start here"
      eyebrow="Create your account"
      title="Sign up"
      subtitle="Book Kleans, track every pair and claim your first Standard Klean free."
    >
      {message && <p className="kka-note warn" role="status">{message}</p>}
      {usingReferral && <p className="kka-note" role="status">Referral code applied. Your discount unlocks once you verify your email.</p>}
      {error && (
        <p className="kka-note err" role="alert">
          <span>
            {error}
            {emailTaken && <> <Link to={`/auth/login${continueSearch(location)}`} state={location.state}>Log in instead</Link> or reset your password from the login page.</>}
          </span>
        </p>
      )}

      <form onSubmit={handleEmailRegister} noValidate>
        <div className="kka-grid2">
          <Field id="firstName" label="First name" autoComplete="given-name" placeholder="Ama"
            value={firstName} onChange={(e) => setFirstName(e.target.value)} disabled={loading}
            invalid={touched && !firstName.trim()} />
          <Field id="lastName" label="Last name" autoComplete="family-name" placeholder="Mensah"
            value={lastName} onChange={(e) => setLastName(e.target.value)} disabled={loading}
            invalid={touched && !lastName.trim()} />
        </div>
        <Field id="email" label="Email" type="email" inputMode="email" autoComplete="email" placeholder="you@example.com"
          value={email} onChange={(e) => { setEmail(e.target.value); setEmailTaken(false); }} disabled={loading}
          invalid={touched && !validEmail(email)} />
        <Field id="password" label="Password" type="password" autoComplete="new-password" placeholder="At least 8 characters"
          value={password} onChange={(e) => setPassword(e.target.value)} disabled={loading}
          invalid={touched && !pwOk}
          hint={(
            <p className={`kka-hint ${pwOk ? 'ok' : ''}`}>
              <span className="dot" aria-hidden="true">{pwOk ? '✓' : ''}</span>
              At least {MIN_PW} characters{password && !pwOk ? ` (${MIN_PW - password.length} to go)` : ''}
            </p>
          )} />

        {(showReferral || usingReferral) ? (
          <Field id="referral" label="Referral code" optional placeholder="e.g. AMA2026"
            value={referralCode} onChange={(e) => setReferralCode(e.target.value)} disabled={loading || usingReferral} />
        ) : (
          <p style={{ margin: '-4px 0 18px' }}>
            <button type="button" className="kka-link" onClick={() => setShowReferral(true)}>Have a referral code?</button>
          </p>
        )}

        <SubmitButton busy={loading} busyLabel="Creating your account…">Create account</SubmitButton>
        <p className="kka-legal">
          By creating an account you agree to our <Link to="/legal" state={{ tab: 'terms' }}>Terms</Link> and{' '}
          <Link to="/legal" state={{ tab: 'privacy' }}>Privacy Policy</Link>.
        </p>
      </form>

      <div className="kka-or">or</div>
      <GoogleButton label="Sign up with Google" onToken={handleGoogle} onError={setError} />

      <p className="kka-switch">
        <span>Already have an account?</span>
        <Link to={`/auth/login${continueSearch(location)}`} state={location.state}>Log in <span aria-hidden="true">→</span></Link>
      </p>
    </AuthLayout>
  );
};

export default Register;
