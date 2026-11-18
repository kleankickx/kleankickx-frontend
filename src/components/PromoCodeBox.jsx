// src/components/PromoCodeBox.jsx
// "Have a promo code?" at checkout. Checks the code with the API (the same rules are
// enforced again when the order is placed) and reports why a code can't be used.
import { useState } from 'react';
import api from '../api';
import PromoTicket from './PromoTicket';
import { savePromoCode, clearSavedPromoCode } from '../utils/promoCode';

export default function PromoCodeBox({ appliedCode, note, onApply, onRemove }) {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const apply = async (e) => {
    e.preventDefault();
    const c = code.trim();
    if (!c) { setError('Enter a promo code.'); return; }
    setBusy(true);
    setError('');
    try {
      const { data } = await api.post('/api/promotions/validate/', { code: c });
      savePromoCode(data.code);
      onApply(data);
      setCode('');
      setOpen(false);
    } catch (err) {
      setError(err.response?.status === 429
        ? 'Too many tries. Wait a little and try again.'
        : err.response?.data?.error || "Couldn't check that code. Try again.");
    } finally {
      setBusy(false);
    }
  };

  if (appliedCode) {
    const pct = Number(appliedCode.discount_percentage);
    return (
      <PromoTicket
        role="status"
        aria-label={`Promo code ${appliedCode.code}, ${pct}% off`}
        label="Promo code"
        pct={pct}
        title={appliedCode.code}
        note={note}
        meta={`${pct}% off your Kleans`}
        onRemove={() => { clearSavedPromoCode(); onRemove(); }}
      />
    );
  }

  return (
    <div className="kkco-promo-box">
      {!open ? (
        <button type="button" className="kkco-promo-toggle" onClick={() => setOpen(true)} aria-expanded="false">
          Have a promo code? <span aria-hidden="true">+</span>
        </button>
      ) : (
        <form onSubmit={apply} noValidate>
          <label htmlFor="kkco-promo-input" className="kkco-label">Promo code</label>
          <div className={`kkco-promo-row ${error ? 'err' : ''}`}>
            <input id="kkco-promo-input" value={code} autoFocus autoComplete="off" autoCapitalize="characters" spellCheck={false}
              placeholder="e.g. KOFI15" maxLength={50}
              onChange={(e) => { setCode(e.target.value.toUpperCase()); if (error) setError(''); }}
              aria-invalid={!!error} aria-describedby={error ? 'kkco-promo-err' : undefined} />
            <button type="submit" disabled={busy}>{busy ? <span className="kkco-spin" aria-hidden="true" /> : 'Apply'}</button>
          </div>
          {error && <p id="kkco-promo-err" className="kkco-help err" role="alert">{error}</p>}
        </form>
      )}
    </div>
  );
}
