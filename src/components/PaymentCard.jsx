import { FaLock } from 'react-icons/fa';
import MTNMomoLogo from '../assets/mtn.png';
import TelecelLogo from '../assets/telecel.png';
import AirtelTigoLogo from '../assets/airtel.png';
import VisaMastercardLogo from '../assets/visa.jpeg';
import { card, cardBody } from './checkoutUi';

const providers = [
  { name: 'MTN MoMo', icon: MTNMomoLogo },
  { name: 'Telecel Cash', icon: TelecelLogo },
  { name: 'AirtelTigo Money', icon: AirtelTigoLogo },
  { name: 'Visa / Mastercard', icon: VisaMastercardLogo },
];

// How the customer can pay. The Pay button lives in the checkout's step buttons.
const PaymentCard = () => (
  <section className={card} aria-labelledby="payment-title">
    <div className={cardBody}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id="payment-title" className="text-lg font-semibold text-gray-900">Payment</h2>
          <p className="text-sm text-gray-500 mt-1">Choose your method on the secure Paystack window after you tap Pay.</p>
        </div>
        <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-medium text-primary bg-primary/10 rounded-full px-2.5 py-1 flex-shrink-0">
          <FaLock className="w-3 h-3" aria-hidden="true" />
          Secure
        </span>
      </div>

      <ul className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {providers.map((provider) => (
          <li
            key={provider.name}
            className="flex flex-col items-center justify-center gap-2 rounded-xl border border-gray-200 bg-gray-50/60 px-2 py-4"
          >
            <img
              src={provider.icon}
              alt=""
              className="w-10 h-10 rounded-lg object-cover"
              onError={(e) => { e.target.onerror = null; e.target.style.visibility = 'hidden'; }}
            />
            <span className="text-xs font-medium text-gray-700 text-center leading-tight">{provider.name}</span>
          </li>
        ))}
      </ul>

      <p className="mt-5 flex items-center justify-center gap-2 text-xs text-gray-500">
        <FaLock className="w-3 h-3 text-primary" aria-hidden="true" />
        Your payment is processed securely by Paystack.
      </p>
    </div>
  </section>
);

export default PaymentCard;
