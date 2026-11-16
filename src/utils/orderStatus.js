// Customer-facing name and colour tone for each order status.
// tone: wait (amber), live (green, in progress), done (ink), bad (red).
const STATUS = {
  pending: { label: 'Pending', tone: 'wait' },
  processing: { label: 'Processing', tone: 'live' },
  pickup: { label: 'Pickup', selfLabel: 'Ready for drop-off', tone: 'live' },
  cleaning_ongoing: { label: 'Cleaning', tone: 'live' },
  cleaning_completed: { label: 'Clean', selfLabel: 'Ready to collect', tone: 'live' },
  scheduled_for_delivery: { label: 'Delivery booked', tone: 'live' },
  delivered: { label: 'Delivered', selfLabel: 'Collected', tone: 'done' },
  cancelled: { label: 'Cancelled', tone: 'bad' },
};

export const orderStatus = (status, selfHandled = false) => {
  const s = STATUS[String(status || '').toLowerCase().replace(/ /g, '_')];
  if (!s) return { label: 'Unknown', tone: 'done' };
  return { label: (selfHandled && s.selfLabel) || s.label, tone: s.tone };
};

// Shared look for the status tag (square, coloured dot). Include once per page.
export const STATUS_TAG_CSS = `
  .kk-st{display:inline-flex;align-items:center;gap:7px;height:26px;padding:0 9px;border:1px solid currentColor;border-radius:2px;
    font-family:"League Spartan",system-ui,sans-serif;font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;white-space:nowrap}
  .kk-st::before{content:"";width:7px;height:7px;background:currentColor}
  .kk-st.wait{color:#9A5B00;background:#FFF6E5}
  .kk-st.live{color:#1A7A1A;background:#E9F4E7}
  .kk-st.live::before{animation:kkStBlink 1.6s ease-in-out infinite}
  .kk-st.done{color:#0A0B0A;background:#fff}
  .kk-st.bad{color:#B42318;background:#FDECEA}
  @keyframes kkStBlink{50%{opacity:.25}}
  @media (prefers-reduced-motion:reduce){.kk-st.live::before{animation:none}}
`;
