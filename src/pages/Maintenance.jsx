// src/pages/Maintenance.jsx
import { useState } from 'react';
import Logo from '../assets/logo2.png';

const formatBackAt = (iso) => {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime()) || date < new Date()) return null;
  return date.toLocaleString(undefined, {
    weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit',
  });
};

const Maintenance = ({ message, expectedBackAt, onRetry }) => {
  const [checking, setChecking] = useState(false);
  const backAt = formatBackAt(expectedBackAt);

  const retry = async () => {
    setChecking(true);
    await onRetry();
    setChecking(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4 py-12 text-center">
      <img src={Logo} alt="KleanKickx" className="h-14 w-auto mb-10" />

      <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mb-6" aria-hidden="true">
        <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437 1.745-1.437" />
        </svg>
      </div>

      <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-3">We'll be right back</h1>
      <p className="max-w-md text-gray-600 mb-2">
        {message || "We're carrying out some maintenance and will be back shortly."}
      </p>
      {backAt && (
        <p className="text-gray-900 font-medium mb-2">Expected back by {backAt}</p>
      )}
      <p className="text-sm text-gray-500 mb-8">This page refreshes by itself when we're back.</p>

      <button
        type="button"
        onClick={retry}
        disabled={checking}
        className="px-6 py-2.5 rounded-lg bg-primary text-white font-medium hover:opacity-90 disabled:opacity-60 transition"
      >
        {checking ? 'Checking…' : 'Check again'}
      </button>

      <p className="text-sm text-gray-500 mt-10">
        Need help with an order? Email{' '}
        <a href="mailto:support@kleankickx.com" className="text-primary underline">support@kleankickx.com</a>
      </p>
    </div>
  );
};

export default Maintenance;
