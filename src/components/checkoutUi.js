// Shared classes for the checkout, so cards and buttons look the same on every step.

export const card = 'bg-white rounded-2xl border border-gray-200 shadow-sm';
export const cardBody = 'p-5 sm:p-6';

const buttonBase =
  'inline-flex items-center justify-center gap-2 h-12 px-5 sm:px-6 rounded-xl text-[15px] font-semibold ' +
  'transition-all duration-200 select-none cursor-pointer active:scale-[0.98] ' +
  'focus:outline-none focus-visible:ring-4 disabled:cursor-not-allowed disabled:active:scale-100';

export const btnPrimary =
  `${buttonBase} bg-primary text-white shadow-sm hover:bg-[#006c02] hover:shadow-md ` +
  'focus-visible:ring-primary/30 disabled:bg-gray-300 disabled:shadow-none';

export const btnSecondary =
  `${buttonBase} bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400 ` +
  'focus-visible:ring-gray-200';

export const btnIcon =
  'inline-flex items-center justify-center w-12 h-12 rounded-xl border border-gray-300 bg-white text-gray-700 ' +
  'hover:bg-gray-50 active:scale-95 transition cursor-pointer focus:outline-none focus-visible:ring-4 focus-visible:ring-gray-200';

export const money = (value) => `GHS ${(parseFloat(value) || 0).toFixed(2)}`;
