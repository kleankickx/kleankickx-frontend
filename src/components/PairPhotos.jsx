// src/components/PairPhotos.jsx
// After paying: one photo per pair, as the customer's record of its condition
// before we collect it (we photograph every pair again when it arrives).
// Optional, never blocks anything. Uploads go to /api/orders/<ref>/pairs/<n>/photo/.
import { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import api from '../api';

const OPEN = ['PROCESSING', 'PICKUP'];
const MAX_MB = 10;

const Slot = ({ reference, itemName, pair, total, canEdit, onChange }) => {
  const input = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const label = total > 1 ? `${itemName} · pair ${pair.index} of ${total}` : itemName;

  const upload = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('Choose a photo.'); return; }
    if (file.size > MAX_MB * 1024 * 1024) { setError(`That photo is over ${MAX_MB} MB.`); return; }
    setBusy(true); setError('');
    try {
      const body = new FormData();
      body.append('photo', file);
      // The api client defaults to JSON; a photo must go as multipart
      const { data } = await api.post(`/api/orders/${reference}/pairs/${pair.sequence}/photo/`, body,
        { headers: { 'Content-Type': 'multipart/form-data' } });
      onChange(pair.sequence, { thumbnail_url: data.preview_url, url: data.full_url, taken_by_staff: false });
    } catch (e) {
      setError(e.response?.data?.error || "That didn't upload. Try again.");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = '';
    }
  };

  const remove = async () => {
    setBusy(true); setError('');
    try {
      await api.delete(`/api/orders/${reference}/pairs/${pair.sequence}/photo/`);
      onChange(pair.sequence, { thumbnail_url: null, url: null, taken_by_staff: false });
    } catch (e) {
      setError(e.response?.data?.error || "Couldn't remove it. Try again.");
    } finally { setBusy(false); }
  };

  const has = !!pair.url;
  return (
    <li className="kk-pp-slot">
      <button
        type="button"
        className={`kk-pp-thumb ${has ? 'has' : ''}`}
        onClick={() => (has ? window.open(pair.url, '_blank', 'noopener') : canEdit && input.current?.click())}
        disabled={busy || (!has && !canEdit)}
        aria-label={has ? `View photo of ${label}` : `Add a photo of ${label}`}
      >
        <AnimatePresence mode="wait">
          {busy ? (
            <motion.span key="busy" className="kk-pp-spin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
          ) : has ? (
            <motion.img key={pair.url} src={pair.thumbnail_url || pair.url} alt="" initial={{ opacity: 0, scale: 1.05 }} animate={{ opacity: 1, scale: 1 }} />
          ) : (
            <motion.svg key="cam" viewBox="0 0 24 24" width="22" height="22" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <path d="M4 8h3l1.5-2h7L17 8h3v11H4z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
              <circle cx="12" cy="13.5" r="3.3" fill="none" stroke="currentColor" strokeWidth="1.7" />
            </motion.svg>
          )}
        </AnimatePresence>
      </button>
      <div className="kk-pp-info">
        <p className="kk-pp-label">{label}</p>
        {error ? <p className="kk-pp-error">{error}</p>
          : has ? <p className="kk-pp-sub">{pair.taken_by_staff ? 'Photographed by our team' : 'Photo added'}</p>
          : <p className="kk-pp-sub">{canEdit ? 'No photo yet' : 'No photo'}</p>}
        {canEdit && !pair.taken_by_staff && (
          <div className="kk-pp-actions">
            <button type="button" onClick={() => input.current?.click()} disabled={busy}>{has ? 'Retake' : 'Add photo'}</button>
            {has && <button type="button" onClick={remove} disabled={busy}>Remove</button>}
          </div>
        )}
      </div>
      <input ref={input} type="file" accept="image/*" capture="environment" hidden onChange={(e) => upload(e.target.files?.[0])} />
    </li>
  );
};

export default function PairPhotos({ order }) {
  const [overrides, setOverrides] = useState({});
  if (!order?.items?.length) return null;

  const canEdit = OPEN.includes(order.status);
  const groups = order.items
    .map((item) => {
      const pairs = (item.pairs || []).map((p, i) => ({ ...p, ...(overrides[p.sequence] || {}), index: i + 1 }));
      return { id: item.id, name: item.service?.name || 'Your sneakers', pairs };
    })
    .filter((g) => g.pairs.length);
  const all = groups.flatMap((g) => g.pairs);
  if (!all.length) return null;                       // pairs appear once payment is confirmed
  const done = all.filter((p) => p.url).length;
  if (!canEdit && !done) return null;

  const onChange = (sequence, patch) => setOverrides((o) => ({ ...o, [sequence]: patch }));

  return (
    <section className="kk-pp" aria-labelledby="kk-pp-title">
      <style>{`
        .kk-pp{font-family:"League Spartan",system-ui,sans-serif;color:#0A0B0A;background:#fff;border-radius:24px;padding:20px;
          box-shadow:0 18px 50px -30px rgba(10,11,10,.35),inset 0 0 0 .5px rgba(10,11,10,.08);margin:16px 0}
        .kk-pp-head{display:flex;justify-content:space-between;align-items:baseline;gap:12px}
        .kk-pp h2{margin:0;font-size:19px;font-weight:700}
        .kk-pp-count{font-size:13px;font-weight:600;color:#1A7A1A;white-space:nowrap}
        .kk-pp-why{margin:6px 0 14px;font-size:14px;line-height:1.45;color:rgba(10,11,10,.6)}
        .kk-pp-bar{height:4px;border-radius:2px;background:rgba(10,11,10,.07);overflow:hidden;margin-bottom:6px}
        .kk-pp-bar span{display:block;height:100%;background:#1A7A1A;border-radius:2px;transition:width .5s cubic-bezier(.2,.8,.2,1)}
        .kk-pp ul{list-style:none;margin:0;padding:0}
        .kk-pp-slot{display:flex;gap:14px;align-items:center;padding:12px 0;border-bottom:1px solid rgba(10,11,10,.07)}
        .kk-pp-slot:last-child{border-bottom:0}
        .kk-pp-thumb{flex:none;width:64px;height:64px;border-radius:16px;border:1.5px dashed rgba(10,11,10,.22);background:rgba(10,11,10,.03);
          display:grid;place-items:center;overflow:hidden;cursor:pointer;color:rgba(10,11,10,.5);padding:0;transition:border-color .2s}
        .kk-pp-thumb:hover:not(:disabled){border-color:#1A7A1A;color:#1A7A1A}
        .kk-pp-thumb.has{border:0}
        .kk-pp-thumb img{width:100%;height:100%;object-fit:cover}
        .kk-pp-spin{width:20px;height:20px;border-radius:50%;border:2.5px solid rgba(10,11,10,.12);border-top-color:#1A7A1A;animation:kkppspin .8s linear infinite}
        @keyframes kkppspin{to{transform:rotate(360deg)}}
        .kk-pp-info{min-width:0;flex:1}
        .kk-pp-label{margin:0;font-size:15px;font-weight:600}
        .kk-pp-sub{margin:2px 0 0;font-size:13px;color:rgba(10,11,10,.55)}
        .kk-pp-error{margin:2px 0 0;font-size:13px;color:#B42318}
        .kk-pp-actions{display:flex;gap:14px;margin-top:6px}
        .kk-pp-actions button{border:0;background:none;padding:0;font:inherit;font-size:13px;font-weight:600;color:#0A0B0A;
          text-decoration:underline;text-underline-offset:3px;cursor:pointer}
        .kk-pp-actions button:hover{color:#1A7A1A}
        .kk-pp-actions button:disabled{opacity:.5}
      `}</style>
      <div className="kk-pp-head">
        <h2 id="kk-pp-title">Photo of each pair</h2>
        <span className="kk-pp-count">{done} of {all.length}</span>
      </div>
      {canEdit && (
        <p className="kk-pp-why">
          Optional, but it helps: a quick photo of each pair before we collect it is your record of its condition.
          We photograph every pair again when it reaches the studio.
        </p>
      )}
      <div className="kk-pp-bar" aria-hidden="true"><span style={{ width: `${(done / all.length) * 100}%` }} /></div>
      {groups.map((g) => (
        <ul key={g.id}>
          {g.pairs.map((p) => (
            <Slot key={p.sequence} reference={order.reference_code} itemName={g.name} pair={p}
              total={g.pairs.length} canEdit={canEdit} onChange={onChange} />
          ))}
        </ul>
      ))}
    </section>
  );
}
