import React from 'react';
import {
  FaReceipt,
  FaClipboardCheck,
  FaTruck,
  FaUserCheck,
  FaBroom,
  FaCheckDouble,
  FaShippingFast,
  FaHandsHelping,
  FaCheck,
} from 'react-icons/fa';

/*
 * Order progress, from placing the order to getting the sneakers back.
 * Statuses have no timestamps of their own, so only "Placed" shows a date
 * and the current step shows when the order was last updated.
 */
const stepsFor = (isSelfHandled) =>
  [
    { status: 'PENDING', label: 'Order placed', hint: 'Waiting for payment', icon: FaReceipt },
    { status: 'PROCESSING', label: 'Confirmed', hint: 'We are preparing your order', icon: FaClipboardCheck },
    isSelfHandled
      ? { status: 'PICKUP', label: 'Drop-off', hint: 'Bring your sneakers to us', icon: FaUserCheck }
      : { status: 'PICKUP', label: 'Pickup', hint: 'A rider is collecting your sneakers', icon: FaTruck },
    { status: 'CLEANING_ONGOING', label: 'Cleaning', hint: 'Your sneakers are being cleaned', icon: FaBroom },
    {
      status: 'CLEANING_COMPLETED',
      label: isSelfHandled ? 'Ready' : 'Cleaned',
      hint: isSelfHandled ? 'Ready for you to collect' : 'Cleaning done',
      icon: FaCheckDouble,
    },
    !isSelfHandled && {
      status: 'SCHEDULED_FOR_DELIVERY',
      label: 'Out for delivery',
      hint: 'On its way back to you',
      icon: FaShippingFast,
    },
    isSelfHandled
      ? { status: 'DELIVERED', label: 'Collected', hint: 'You collected your sneakers', icon: FaHandsHelping }
      : { status: 'DELIVERED', label: 'Delivered', hint: 'Your sneakers are back with you', icon: FaCheck },
  ].filter(Boolean);

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : null;

export default function OrderStatusStepper({ status, isSelfHandled = false, createdAt, updatedAt }) {
  const steps = stepsFor(isSelfHandled);
  const key = status?.toUpperCase();
  // A self-handled order should never be "out for delivery"; treat it as the step before.
  let current = steps.findIndex((s) => s.status === key);
  if (current === -1 && key === 'SCHEDULED_FOR_DELIVERY') current = steps.findIndex((s) => s.status === 'CLEANING_COMPLETED');
  if (current === -1) current = 0;
  const finished = key === 'DELIVERED';

  const stateOf = (index) => (index < current || (finished && index === current) ? 'done' : index === current ? 'current' : 'upcoming');
  const dateOf = (index) => (index === 0 ? formatDate(createdAt) : index === current && index > 0 ? formatDate(updatedAt) : null);

  const circle = {
    done: 'bg-primary text-white border-primary',
    current: 'bg-white text-primary border-primary ring-4 ring-primary/15',
    upcoming: 'bg-white text-gray-300 border-gray-200',
  };
  const text = { done: 'text-gray-900', current: 'text-primary', upcoming: 'text-gray-400' };

  return (
    <section aria-label="Order progress" className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
      <div className="flex items-center justify-between gap-3 mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Order progress</h2>
        <span className="text-sm text-gray-500">
          Step {current + 1} of {steps.length}
        </span>
      </div>

      {/* Desktop: horizontal */}
      <ol className="hidden md:flex items-start">
        {steps.map((step, index) => {
          const state = stateOf(index);
          const Icon = state === 'done' ? FaCheck : step.icon;
          const date = dateOf(index);
          return (
            <li
              key={step.status}
              className="relative flex-1 flex flex-col items-center text-center px-1"
              aria-current={state === 'current' ? 'step' : undefined}
            >
              {index > 0 && (
                <span
                  aria-hidden="true"
                  className={`absolute top-5 right-1/2 w-full h-0.5 -translate-y-1/2 ${
                    index <= current ? 'bg-primary' : 'bg-gray-200'
                  }`}
                />
              )}
              <span
                className={`relative z-10 flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${circle[state]}`}
              >
                <Icon className="w-4 h-4" aria-hidden="true" />
              </span>
              <span className={`mt-3 text-sm font-medium ${text[state]}`}>{step.label}</span>
              {state === 'current' && !finished && <span className="mt-1 text-xs text-gray-500">{step.hint}</span>}
              {date && <span className="mt-1 text-xs text-gray-400">{date}</span>}
            </li>
          );
        })}
      </ol>

      {/* Mobile: vertical */}
      <ol className="md:hidden">
        {steps.map((step, index) => {
          const state = stateOf(index);
          const Icon = state === 'done' ? FaCheck : step.icon;
          const date = dateOf(index);
          const last = index === steps.length - 1;
          return (
            <li key={step.status} className="relative flex gap-4 pb-6 last:pb-0" aria-current={state === 'current' ? 'step' : undefined}>
              {!last && (
                <span
                  aria-hidden="true"
                  className={`absolute left-5 top-10 bottom-0 w-0.5 -translate-x-1/2 ${index < current ? 'bg-primary' : 'bg-gray-200'}`}
                />
              )}
              <span
                className={`relative z-10 flex flex-shrink-0 items-center justify-center w-10 h-10 rounded-full border-2 ${circle[state]}`}
              >
                <Icon className="w-4 h-4" aria-hidden="true" />
              </span>
              <div className="pt-2 min-w-0">
                <p className={`text-sm font-medium ${text[state]}`}>{step.label}</p>
                {state === 'current' && !finished && <p className="text-xs text-gray-500 mt-0.5">{step.hint}</p>}
                {date && <p className="text-xs text-gray-400 mt-0.5">{date}</p>}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
