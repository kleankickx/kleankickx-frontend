import React from 'react';
import { Link } from 'react-router-dom';
import { FaUser, FaTruck, FaCreditCard } from 'react-icons/fa';

/*
 * Checkout progress. "Cart" is the page before checkout, so it is always done
 * and links back. The other steps are the checkout's own; completed ones can be
 * clicked to go back, later ones only open through Continue.
 */
export const CHECKOUT_STEPS = [
  { key: 'details', label: 'Your details', hint: 'Check your contact details', icon: FaUser },
  { key: 'pickup', label: 'Pickup & delivery', hint: 'Tell us where to collect and return your sneakers', icon: FaTruck },
  { key: 'pay', label: 'Review & pay', hint: 'Check everything, then pay securely', icon: FaCreditCard },
];

const css = `
  .kkcs{margin-top:22px}
  .kkcs ol{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px}
  .kkcs li{min-width:0}
  .kkcs a,.kkcs button,.kkcs .st{display:block;width:100%;padding:0;border:0;background:none;font:inherit;color:inherit;text-align:left;text-decoration:none}
  .kkcs a,.kkcs button{cursor:pointer}
  .kkcs .bar{display:block;height:6px;background:var(--line,#D9DFD7);position:relative;overflow:hidden}
  .kkcs li.done .bar{background:var(--ink,#0A0B0A)}
  .kkcs li.now .bar{background:var(--green,#1A7A1A)}
  .kkcs .n{display:block;margin-top:9px;font-size:11px;font-weight:700;letter-spacing:.14em;color:var(--muted,#4D564C)}
  .kkcs .l{display:block;margin-top:2px;font-size:14px;font-weight:700;color:var(--muted,#4D564C);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .kkcs li.done .l{color:var(--ink,#0A0B0A)}
  .kkcs li.now .l,.kkcs li.now .n{color:var(--green,#1A7A1A)}
  .kkcs a:hover .l,.kkcs button:hover .l{text-decoration:underline;text-underline-offset:3px}
  .kkcs a:hover .bar,.kkcs button:hover .bar{background:var(--green,#1A7A1A)}
  .kkcs .mob{display:none}
  @media (max-width:640px){
    .kkcs .l{display:none}
    .kkcs .mob{display:flex;justify-content:space-between;margin:10px 0 0;font-size:13px;color:var(--muted,#4D564C)}
    .kkcs .mob b{color:var(--ink,#0A0B0A)}
  }
`;

export default function CheckoutStepper({ step, onStepClick }) {
  // Index 0 is the cart; checkout steps follow.
  const all = [{ key: 'cart', label: 'Cart' }, ...CHECKOUT_STEPS];
  const active = step + 1;

  return (
    <nav aria-label="Checkout progress" className="kkcs">
      <style>{css}</style>
      <ol>
        {all.map((item, index) => {
          const state = index < active ? 'done' : index === active ? 'now' : 'next';
          const inner = (
            <>
              <span className="bar" aria-hidden="true" />
              <span className="n">{String(index).padStart(2, '0')}</span>
              <span className="l">{item.label}</span>
            </>
          );
          return (
            <li key={item.key} className={state} aria-current={state === 'now' ? 'step' : undefined}>
              {index === 0 ? (
                <Link to="/cart" aria-label="Back to cart">{inner}</Link>
              ) : state === 'done' ? (
                <button type="button" onClick={() => onStepClick(index - 1)} aria-label={`Back to ${item.label}`}>{inner}</button>
              ) : (
                <div className="st">{inner}</div>
              )}
            </li>
          );
        })}
      </ol>
      <p className="mob" aria-hidden="true">
        <b>{CHECKOUT_STEPS[step].label}</b>
        <span>Step {step + 1} of {CHECKOUT_STEPS.length}</span>
      </p>
    </nav>
  );
}
