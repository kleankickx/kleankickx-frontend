import React from 'react';

/*
 * Order progress: one step per order status, in the order the backend moves
 * through them (Order.STATUS_CHOICES; Cancelled is shown as a banner instead).
 * Statuses have no timestamps of their own, so the first step shows when the
 * order was placed and the current step when it was last updated.
 */
const STEPS = [
  { status: 'PENDING', label: 'Received', hint: 'Order received, awaiting confirmation' },
  { status: 'PROCESSING', label: 'Processing', hint: 'We are preparing your order' },
  { status: 'PICKUP', label: 'Pickup', hint: 'Your sneakers are being picked up', selfLabel: 'Drop-off', selfHint: 'Bring your sneakers to the studio' },
  { status: 'CLEANING_ONGOING', label: 'Cleaning', hint: 'Your sneakers are being cleaned' },
  { status: 'CLEANING_COMPLETED', label: 'Clean', hint: 'Cleaning is done', selfHint: 'Ready for you to collect' },
  { status: 'SCHEDULED_FOR_DELIVERY', label: 'Delivery booked', hint: 'Delivery is booked' },
  { status: 'DELIVERED', label: 'Delivered', hint: 'Your sneakers are back with you', selfLabel: 'Collected', selfHint: 'You collected your sneakers' },
];

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : null;

export default function OrderStatusStepper({ status, createdAt, updatedAt, selfHandled = false }) {
  const key = status?.toUpperCase();
  const current = Math.max(0, STEPS.findIndex((s) => s.status === key));
  const finished = key === 'DELIVERED';
  const labelOf = (s) => (selfHandled && s.selfLabel) || s.label;
  const hintOf = (s) => (selfHandled && s.selfHint) || s.hint;

  const stateOf = (i) => (i < current || (finished && i === current) ? 'done' : i === current ? 'now' : 'next');
  const dateOf = (i) => (i === 0 ? formatDate(createdAt) : i === current && i > 0 ? formatDate(updatedAt) : null);
  const step = STEPS[current];

  return (
    <section aria-label="Order progress" className="kks">
      <style>{`
        .kks{--ink:#0A0B0A;--line:#D9DFD7;--muted:#4D564C;--green:#1A7A1A;font-family:"League Spartan",system-ui,sans-serif;color:var(--ink);
          background:#fff;border:1px solid var(--line);padding:22px 22px 20px}
        .kks-head{display:flex;justify-content:space-between;align-items:baseline;gap:12px}
        .kks-eyebrow{margin:0;font-size:12px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:var(--green)}
        .kks-count{font-size:13px;color:var(--muted);font-variant-numeric:tabular-nums}
        .kks-now{margin:8px 0 0;font-family:"Anton","Arial Narrow",Impact,sans-serif;font-weight:400;text-transform:uppercase;font-size:clamp(34px,4vw,48px);line-height:.95}
        .kks-hint{margin:6px 0 0;color:var(--muted);font-size:15px}
        .kks ol{list-style:none;margin:22px 0 0;padding:0;display:grid;grid-template-columns:repeat(7,1fr);gap:6px}
        .kks li{min-width:0}
        .kks-bar{display:block;height:6px;background:var(--line);position:relative;overflow:hidden}
        .kks li.done .kks-bar{background:var(--ink)}
        .kks li.now .kks-bar{background:var(--line)}
        .kks li.now .kks-bar::after{content:"";position:absolute;inset:0;width:55%;background:var(--green);animation:kksPulse 1.8s cubic-bezier(.77,0,.18,1) infinite alternate}
        @keyframes kksPulse{from{width:25%}to{width:100%}}
        .kks-n{display:block;margin-top:9px;font-size:11px;font-weight:600;letter-spacing:.12em;color:var(--muted)}
        .kks-l{display:block;margin-top:2px;font-size:13px;font-weight:600;line-height:1.2;color:var(--muted)}
        .kks li.done .kks-l{color:var(--ink)}
        .kks li.now .kks-l,.kks li.now .kks-n{color:var(--green)}
        .kks-d{display:block;margin-top:3px;font-size:11.5px;color:var(--muted)}
        @media (max-width:760px){
          .kks{padding:18px 16px}
          .kks ol{grid-template-columns:1fr;gap:0}
          .kks li{display:grid;grid-template-columns:6px 34px 1fr;column-gap:12px;align-items:baseline;padding:0}
          .kks-bar{grid-row:1 / span 2;height:auto;min-height:38px;align-self:stretch}
          .kks-n{margin:10px 0 0}
          .kks-l{margin:10px 0 0;font-size:15px}
          .kks-d{grid-column:3;margin:0 0 8px}
          .kks li.now .kks-bar::after{width:100%;height:55%;animation:none}
        }
        @media (prefers-reduced-motion:reduce){.kks li.now .kks-bar::after{animation:none;width:100%}}
      `}</style>
      <div className="kks-head">
        <p className="kks-eyebrow">{finished ? 'Complete' : 'Where it is now'}</p>
        <span className="kks-count">Step {String(current + 1).padStart(2, '0')} / {String(STEPS.length).padStart(2, '0')}</span>
      </div>
      <p className="kks-now">{labelOf(step)}</p>
      <p className="kks-hint">{hintOf(step)}</p>
      <ol>
        {STEPS.map((s, i) => {
          const state = stateOf(i);
          const date = dateOf(i);
          return (
            <li key={s.status} className={state} aria-current={state === 'now' ? 'step' : undefined}>
              <span className="kks-bar" aria-hidden="true" />
              <span className="kks-n">{String(i + 1).padStart(2, '0')}</span>
              <span className="kks-l">{labelOf(s)}<span className="sr-only">{state === 'done' ? ' (done)' : state === 'now' ? ' (current)' : ''}</span></span>
              {date ? <span className="kks-d">{date}</span> : <span className="kks-d" aria-hidden="true" />}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
