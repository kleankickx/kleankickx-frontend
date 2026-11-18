// src/components/PromoTicket.jsx
// The coupon-ticket look shared by the automatic promotion and an applied promo code.
const Tick = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="square" aria-hidden="true">
    <path d="M4 12.5l5 5L20 6.5" />
  </svg>
);

export default function PromoTicket({ label, pct, title, description, meta, note, onRemove, ...rest }) {
  const n = Number(pct);
  return (
    <section className={`kkco-tix${onRemove ? ' has-x' : ''}`} {...rest}>
      <div className="kkco-tix-stub" aria-hidden="true">
        {n > 0 ? <span className="amt">{Math.round(n)}<i>%</i></span> : <span className="amt">%</span>}
        <span className="off">OFF</span>
      </div>
      <div className="kkco-tix-body">
        <small>{label}</small>
        <b>{title}</b>
        {description && <p>{description}</p>}
        {note && <em>{note}</em>}
        {meta && <span className="kkco-tix-meta"><Tick />{meta}</span>}
        {onRemove && <button type="button" className="kkco-tix-x" onClick={onRemove}>Remove</button>}
      </div>
    </section>
  );
}
