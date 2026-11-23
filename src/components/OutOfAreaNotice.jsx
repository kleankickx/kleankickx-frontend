// src/components/OutOfAreaNotice.jsx
// Shown when a pickup / delivery address is outside the service area: say where we
// do serve, suggest dropping off at the studio, and offer "notify me when you launch here".
import { useContext, useState } from 'react';
import { motion } from 'framer-motion';
import api from '../api';
import { AuthContext } from '../context/AuthContext';

export default function OutOfAreaNotice({ place, onDismiss }) {
  const { user } = useContext(AuthContext);
  const [email, setEmail] = useState(user?.email || '');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState('');
  const [error, setError] = useState('');
  const city = place?.city || '';

  const notify = async (e) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError('Enter a valid email address.'); return; }
    setBusy(true); setError('');
    try {
      const { data } = await api.post('/api/delivery/interest/', {
        email: email.trim(), city, address: place?.address || '',
        lat: place?.lat != null ? Number(place.lat).toFixed(6) : null,
        lng: place?.lng != null ? Number(place.lng).toFixed(6) : null,
      });
      setDone(data?.message || "Thanks! We'll let you know.");
    } catch (err) {
      setError(err.response?.status === 429 ? 'Too many tries. Please try again later.'
        : err.response?.data?.error || "Couldn't save that. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <motion.div className="kkco-note warn" role="alert" style={{ marginTop: 10 }}
      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
      <p style={{ margin: 0 }}>
        <strong>We don&apos;t pick up{city ? ` in ${city}` : ' there'} yet.</strong>{' '}
        {place?.message || 'We currently pick up and deliver in Accra & Kasoa only.'}{' '}
        You can still drop your pairs off at our studio in Accra.
      </p>
      {done ? (
        <p style={{ margin: '10px 0 0', fontWeight: 700 }} role="status">{done}</p>
      ) : (
        <form onSubmit={notify} noValidate style={{ marginTop: 10 }}>
          <label htmlFor="kk-notify-email" className="kkco-label" style={{ display: 'block', marginBottom: 6 }}>
            Want us to tell you when we launch{city ? ` in ${city}` : ' near you'}?
          </label>
          <div className={`kkco-promo-row ${error ? 'err' : ''}`} style={{ background: '#fff' }}>
            <input id="kk-notify-email" type="email" inputMode="email" autoComplete="email" placeholder="you@example.com"
              value={email} onChange={(e) => { setEmail(e.target.value); if (error) setError(''); }}
              aria-invalid={!!error} aria-describedby={error ? 'kk-notify-err' : undefined}
              style={{ textTransform: 'none', letterSpacing: 0, fontFamily: 'inherit', fontWeight: 500 }} />
            <button type="submit" disabled={busy}>{busy ? <span className="kkco-spin" aria-hidden="true" /> : 'Notify me'}</button>
          </div>
          {error && <p id="kk-notify-err" className="kkco-help err">{error}</p>}
        </form>
      )}
      {onDismiss && (
        <button type="button" onClick={onDismiss}
          style={{ marginTop: 10, border: 0, background: 'none', padding: 0, font: 'inherit', fontSize: 13, fontWeight: 700, textDecoration: 'underline', cursor: 'pointer' }}>
          Try another address
        </button>
      )}
    </motion.div>
  );
}
