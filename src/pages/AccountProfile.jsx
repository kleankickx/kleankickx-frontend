// src/pages/AccountProfile.jsx
// Account details: name and phone (editable), email and sign-in, referral code.
import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { AnimatePresence, motion } from 'framer-motion';
import api from '../api';
import { AuthContext } from '../context/AuthContext';
import Footer from '../components/Footer';
import { ACCOUNT_CSS, firstError } from '../components/AccountShell';

const GH_PHONE = /^(233|0)?(20|24|25|26|27|28|29|30|50|54|55|56|57|59)[0-9]{7}$/;
const validPhone = (v) => !v || GH_PHONE.test(String(v).replace(/\D/g, ''));
const formatDate = (d) => (d ? new Date(d).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '—');

export default function AccountProfile() {
  const { refreshUserData } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [failed, setFailed] = useState(false);
  const [form, setForm] = useState({ first_name: '', last_name: '', phone_number: '' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(0);
  const [copied, setCopied] = useState(false);

  const load = async () => {
    setFailed(false);
    try {
      const { data } = await api.get('/api/users/profile/');
      setProfile(data);
      setForm({ first_name: data.first_name || '', last_name: data.last_name || '', phone_number: data.phone_number || '' });
    } catch {
      setFailed(true);
    }
  };
  useEffect(() => { load(); }, []);

  const dirty = useMemo(() => profile && (
    form.first_name.trim() !== (profile.first_name || '')
    || form.last_name.trim() !== (profile.last_name || '')
    || form.phone_number.trim() !== (profile.phone_number || '')
  ), [form, profile]);

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrors((er) => ({ ...er, [key]: null }));
  };

  const save = async (e) => {
    e.preventDefault();
    const next = {};
    if (!form.first_name.trim()) next.first_name = 'Enter your first name.';
    if (!form.last_name.trim()) next.last_name = 'Enter your last name.';
    if (!validPhone(form.phone_number)) next.phone_number = 'Enter a valid Ghana number, e.g. 024 123 4567.';
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    try {
      const body = { first_name: form.first_name.trim(), last_name: form.last_name.trim(), phone_number: form.phone_number.trim() };
      const { data } = await api.put('/api/users/profile/', body);
      setProfile((p) => ({ ...p, ...(data.profile || body) }));
      setSavedAt(Date.now());
      await refreshUserData?.();
      toast.success('Your details are saved.');
    } catch (err) {
      const d = err.response?.data || {};
      setErrors({
        first_name: firstError(d, 'first_name'),
        last_name: firstError(d, 'last_name'),
        phone_number: firstError(d, 'phone_number'),
      });
      toast.error(d.error || "Couldn't save your details. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(profile.referral_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error('Could not copy the code');
    }
  };

  const initials = [form.first_name[0], form.last_name[0]].filter(Boolean).join('').toUpperCase()
    || (profile?.email || '?')[0].toUpperCase();
  const justSaved = savedAt && !dirty && Date.now() - savedAt < 60000;

  return (
    <div className="kkac">
      <style>{ACCOUNT_CSS}</style>
      <div className="kkac-wrap">
        <header className="kkac-hero" style={{ paddingTop: 44 }}>
          <div>
            <h1>Account details</h1>
            <p className="sub">Your name and phone number, how you sign in, and your referral code.</p>
          </div>
          {profile && <span className="kkac-ini" aria-hidden="true">{initials}</span>}
        </header>

        {failed ? (
          <div className="kkac-card" style={{ marginTop: 26, textAlign: 'center', padding: '48px 22px' }} role="alert">
            <p style={{ margin: '0 0 16px', color: 'var(--muted)' }}>We couldn't load your account details.</p>
            <button type="button" className="kkac-btn" onClick={load}>Try again</button>
          </div>
        ) : !profile ? (
          <div className="kkac-grid" aria-busy="true" aria-label="Loading your account">
            <div className="kkac-skel" style={{ height: 420 }} />
            <div className="kkac-col"><div className="kkac-skel" style={{ height: 200 }} /><div className="kkac-skel" style={{ height: 180 }} /></div>
          </div>
        ) : (
          <div className="kkac-grid">
            <div className="kkac-col">
              <form className="kkac-card" onSubmit={save} noValidate aria-labelledby="kkac-details-h">
                <div className="kkac-card-head">
                  <h2 id="kkac-details-h">Your details</h2>
                  <span>Used on your orders and receipts</span>
                </div>

                <div className="kkac-two">
                  <div className="kkac-field">
                    <label htmlFor="ac-first">First name</label>
                    <div className={`kkac-input ${errors.first_name ? 'err' : ''}`}>
                      <input id="ac-first" value={form.first_name} onChange={set('first_name')} autoComplete="given-name" aria-invalid={!!errors.first_name} />
                    </div>
                    {errors.first_name && <p className="kkac-help err" role="alert">{errors.first_name}</p>}
                  </div>
                  <div className="kkac-field">
                    <label htmlFor="ac-last">Last name</label>
                    <div className={`kkac-input ${errors.last_name ? 'err' : ''}`}>
                      <input id="ac-last" value={form.last_name} onChange={set('last_name')} autoComplete="family-name" aria-invalid={!!errors.last_name} />
                    </div>
                    {errors.last_name && <p className="kkac-help err" role="alert">{errors.last_name}</p>}
                  </div>
                </div>

                <div className="kkac-field">
                  <label htmlFor="ac-phone">Phone number<i>Our rider calls this number</i></label>
                  <div className={`kkac-input ${errors.phone_number ? 'err' : ''}`}>
                    <span className="pre" aria-hidden="true">+233</span>
                    <input id="ac-phone" type="tel" inputMode="tel" autoComplete="tel-national" placeholder="024 123 4567"
                      value={form.phone_number} onChange={set('phone_number')} maxLength={16} aria-invalid={!!errors.phone_number} />
                  </div>
                  {errors.phone_number && <p className="kkac-help err" role="alert">{errors.phone_number}</p>}
                </div>

                <div className="kkac-field">
                  <label htmlFor="ac-email">Email<i>Can't be changed here</i></label>
                  <div className="kkac-input ro">
                    <input id="ac-email" value={profile.email} disabled />
                    <span className="tail">
                      <span className={`kkac-tag ${profile.is_verified ? 'ok' : 'wait'}`}>{profile.is_verified ? 'Verified' : 'Not verified'}</span>
                    </span>
                  </div>
                </div>

                <div className="kkac-actions">
                  <button type="submit" className="kkac-btn go" disabled={!dirty || saving}>
                    {saving ? <><span className="kkac-spin" aria-hidden="true" /> Saving…</> : <>Save changes <span className="ar" aria-hidden="true">→</span></>}
                  </button>
                  {dirty && !saving && (
                    <button type="button" className="kkac-btn" onClick={() => { setForm({ first_name: profile.first_name || '', last_name: profile.last_name || '', phone_number: profile.phone_number || '' }); setErrors({}); }}>
                      Undo
                    </button>
                  )}
                  <AnimatePresence>
                    {justSaved && (
                      <motion.span className="kkac-saved" initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
                        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M5 12.5l4.2 4.2L19 7" fill="none" stroke="currentColor" strokeWidth="3" /></svg>
                        Saved
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
              </form>
            </div>

            <aside className="kkac-col">
              <section className="kkac-card" aria-labelledby="kkac-signin-h">
                <div className="kkac-card-head"><h2 id="kkac-signin-h">Sign-in</h2></div>
                <dl className="kkac-list">
                  <div><dt>Password</dt><dd>{profile.has_password === false ? 'Not set (Google sign-in)' : '••••••••'}</dd></div>
                  <div><dt>Member since</dt><dd>{formatDate(profile.date_joined)}</dd></div>
                </dl>
                <Link to="/change-password" state={{ hasPassword: profile.has_password !== false }} className="kkac-btn" style={{ width: '100%', marginTop: 18 }}>
                  {profile.has_password === false ? 'Set a password' : 'Change password'} <span className="ar" aria-hidden="true">→</span>
                </Link>
              </section>

              {profile.referral_code && (
                <section className="kkac-card" aria-labelledby="kkac-ref-h">
                  <div className="kkac-card-head"><h2 id="kkac-ref-h">Refer a friend</h2></div>
                  <button type="button" className="kkac-code" onClick={copyCode} aria-label={`Copy referral code ${profile.referral_code}`}>
                    <code>{profile.referral_code}</code>
                    <span aria-live="polite">{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                  <p className="kkac-points"><b>{profile.referral_points || 0}</b>points earned</p>
                  <Link to="/referral-dashboard" className="kkac-link" style={{ marginTop: 14 }}>
                    <span>Referrals<small>Invite friends, see your rewards</small></span>
                    <span className="ar" aria-hidden="true">→</span>
                  </Link>
                </section>
              )}
            </aside>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
