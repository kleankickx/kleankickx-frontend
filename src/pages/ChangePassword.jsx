// src/pages/ChangePassword.jsx
// Change the password, or set a first one for accounts made with Google sign-in.
import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import api from '../api';
import Footer from '../components/Footer';
import { ACCOUNT_CSS, PasswordField, firstError } from '../components/AccountShell';

// 0-4: length, mixed case, a number, a symbol
const strength = (pw) => {
  if (!pw) return 0;
  let s = pw.length >= 8 ? 1 : 0;
  if (pw.length >= 12) s += 1;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s += 1;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) s += 1;
  return Math.min(4, s);
};
const STRENGTH_LABEL = ['', 'Okay', 'Good', 'Strong', 'Very strong'];

const ChangePassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  // Known straight away when we come from Account details; otherwise null until the
  // profile loads, so Google accounts never see the "Change password" form first.
  const passed = location.state?.hasPassword;
  const [hasPassword, setHasPassword] = useState(typeof passed === 'boolean' ? passed : null);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Accounts made with Google sign-in have no password yet: they set one instead.
  useEffect(() => {
    api.get('/api/users/profile/')
      .then(({ data }) => setHasPassword(data.has_password !== false))
      .catch(() => setHasPassword((v) => (v === null ? true : v)));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const next = {};
    if (hasPassword && !oldPassword) next.old_password = 'Enter your current password.';
    if (newPassword.length < 8) next.new_password = 'Use at least 8 characters.';
    else if (hasPassword && newPassword === oldPassword) next.new_password = 'Choose a password different from your current one.';
    if (confirmPassword !== newPassword) next.confirm_password = "The passwords don't match.";
    setErrors(next);
    if (Object.keys(next).length) return;

    setLoading(true);
    try {
      await api.post('/api/users/password/change/', {
        old_password: hasPassword ? oldPassword : '',
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
      toast.success(hasPassword ? 'Password changed.' : 'Password set. You can now log in with your email too.');
      navigate('/account');
    } catch (err) {
      const d = err.response?.data;
      if (d) {
        setErrors({
          old_password: firstError(d, 'old_password'),
          new_password: firstError(d, 'new_password'),
          confirm_password: firstError(d, 'confirm_password'),
          form: firstError(d, 'non_field_errors') || firstError(d, 'error') || firstError(d, 'detail'),
        });
      } else {
        toast.error('Something went wrong. Try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const score = strength(newPassword);
  const clear = (key, setter) => (e) => { setter(e.target.value); setErrors((er) => ({ ...er, [key]: null, form: null })); };

  return (
    <div className="kkac">
      <style>{ACCOUNT_CSS}</style>
      <div className="kkac-wrap" style={{ maxWidth: 760 }}>
        <Link to="/account" className="kkac-back"><span aria-hidden="true">←</span> Account details</Link>
        {hasPassword === null ? (
          <div aria-busy="true" aria-label="Loading">
            <div className="kkac-skel" style={{ height: 120, marginTop: 18 }} />
            <div className="kkac-skel" style={{ height: 300, marginTop: 26 }} />
          </div>
        ) : (<>
        <header className="kkac-hero">
          <div>
            <h1>{hasPassword ? 'Change password' : 'Set a password'}</h1>
            <p className="sub">
              {hasPassword
                ? 'Enter your current password, then choose a new one.'
                : 'You signed up with Google. Set a password to also log in with your email.'}
            </p>
          </div>
        </header>

        <form className="kkac-card" style={{ marginTop: 26 }} onSubmit={handleSubmit} noValidate>
          {errors.form && <p className="kkac-help err" role="alert" style={{ marginBottom: 14 }}>{errors.form}</p>}

          {hasPassword && (
            <PasswordField id="pw-old" label="Current password" autoComplete="current-password" autoFocus
              value={oldPassword} onChange={clear('old_password', setOldPassword)} error={errors.old_password} />
          )}

          <PasswordField id="pw-new" label="New password" hint="At least 8 characters" autoComplete="new-password" autoFocus={!hasPassword}
            value={newPassword} onChange={clear('new_password', setNewPassword)} error={errors.new_password} />
          {newPassword && (
            <div style={{ margin: '-6px 0 16px' }} aria-live="polite">
              <div className={`kkac-meter ${score <= 1 ? 'weak' : ''}`} aria-hidden="true">
                {[1, 2, 3, 4].map((i) => <span key={i} className={i <= score ? 'on' : ''} />)}
              </div>
              <p className="kkac-help" style={{ marginTop: 6 }}>
                {newPassword.length < 8 ? `${8 - newPassword.length} more character${8 - newPassword.length === 1 ? '' : 's'}` : `Strength: ${STRENGTH_LABEL[score]}`}
              </p>
            </div>
          )}

          <PasswordField id="pw-confirm" label="Confirm new password" autoComplete="new-password"
            value={confirmPassword} onChange={clear('confirm_password', setConfirmPassword)} error={errors.confirm_password} />

          <div className="kkac-actions">
            <button type="submit" className="kkac-btn go" disabled={loading}>
              {loading ? <><span className="kkac-spin" aria-hidden="true" /> Saving…</> : <>{hasPassword ? 'Change password' : 'Set password'} <span className="ar" aria-hidden="true">→</span></>}
            </button>
            <Link to="/account" className="kkac-btn">Cancel</Link>
          </div>

          {hasPassword && (
            <p className="kkac-help" style={{ marginTop: 18 }}>
              Forgot your current password? Log out and use <b>Forgot password</b> on the login page.
            </p>
          )}
        </form>
        </>)}
      </div>
      <Footer />
    </div>
  );
};

export default ChangePassword;
