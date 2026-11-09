import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaCheck, FaShoppingCart, FaUser, FaTruck, FaCreditCard } from 'react-icons/fa';

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

const spring = { type: 'spring', stiffness: 380, damping: 28 };

function Circle({ state, Icon }) {
  return (
    <motion.span
      initial={false}
      animate={{ scale: state === 'current' ? 1.08 : 1 }}
      transition={spring}
      className={`relative z-10 flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors duration-300 ${
        state === 'done'
          ? 'bg-primary border-primary text-white'
          : state === 'current'
            ? 'bg-white border-primary text-primary shadow-[0_0_0_6px_rgba(0,127,3,0.12)]'
            : 'bg-white border-gray-200 text-gray-400'
      }`}
    >
      {state === 'done' ? (
        <motion.span
          key="check"
          initial={{ scale: 0, rotate: -45 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={spring}
          className="flex"
        >
          <FaCheck className="w-4 h-4" aria-hidden="true" />
        </motion.span>
      ) : (
        <Icon className="w-4 h-4" aria-hidden="true" />
      )}
      {state === 'current' && (
        <motion.span
          aria-hidden="true"
          className="absolute inset-0 rounded-full border-2 border-primary"
          initial={{ opacity: 0.6, scale: 1 }}
          animate={{ opacity: 0, scale: 1.6 }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }}
        />
      )}
    </motion.span>
  );
}

export default function CheckoutStepper({ step, onStepClick }) {
  // Index 0 is the cart; checkout steps follow.
  const all = [{ key: 'cart', label: 'Cart', icon: FaShoppingCart }, ...CHECKOUT_STEPS];
  const active = step + 1;
  const progress = (active / (all.length - 1)) * 100;

  return (
    <nav aria-label="Checkout progress" className="bg-white rounded-2xl border border-gray-200 shadow-sm px-2 py-4 sm:px-6 sm:py-5">
      <ol className="relative flex">
        {/* Track and animated fill, from the first circle centre (12.5%) to the last (87.5%) */}
        <span aria-hidden="true" className="absolute top-5 left-[12.5%] right-[12.5%] h-0.5 -translate-y-1/2 bg-gray-200 rounded-full" />
        <span aria-hidden="true" className="absolute top-5 left-[12.5%] right-[12.5%] h-0.5 -translate-y-1/2">
          <motion.span
            className="block h-full bg-primary rounded-full origin-left"
            initial={false}
            animate={{ scaleX: progress / 100 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          />
        </span>

        {all.map((item, index) => {
          const state = index < active ? 'done' : index === active ? 'current' : 'upcoming';
          const label = (
            <span
              className={`mt-2 text-xs sm:text-sm font-medium text-center transition-colors ${
                state === 'upcoming' ? 'text-gray-400' : state === 'current' ? 'text-primary' : 'text-gray-900'
              } ${state === 'current' ? '' : 'hidden sm:block'}`}
            >
              {item.label}
            </span>
          );
          const inner = (
            <>
              <Circle state={state} Icon={item.icon} />
              {label}
            </>
          );
          const base = "flex flex-col items-center min-w-0 px-1";

          return (
            <li key={item.key} className="relative flex-1 flex justify-center" aria-current={state === 'current' ? 'step' : undefined}>
              {index === 0 ? (
                <Link to="/cart" className={`${base} group`} aria-label="Back to cart">
                  {inner}
                </Link>
              ) : state === 'done' ? (
                <button type="button" onClick={() => onStepClick(index - 1)} className={`${base} cursor-pointer group`}>
                  {inner}
                </button>
              ) : (
                <div className={base}>{inner}</div>
              )}
            </li>
          );
        })}
      </ol>
      <p className="sm:hidden mt-3 text-center text-xs text-gray-500">
        Step {step + 1} of {CHECKOUT_STEPS.length}
      </p>
    </nav>
  );
}
