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

const Lock = () => (
  <svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true">
    <path d="M6 11h12v9H6z M8.5 11V8a3.5 3.5 0 017 0v3" fill="none" stroke="currentColor" strokeWidth="2.2" />
  </svg>
);

// How the customer can pay. The Pay button lives in the checkout's step buttons.
const PaymentCard = () => (
  <section className={card} aria-labelledby="payment-title">
    <div className={cardBody}>
      <div className="kkco-head">
        <h2 id="payment-title" className="kkco-h">Payment</h2>
        <p className="kkco-sub">Choose how to pay in the secure Paystack window after you tap Pay.</p>
      </div>
      <ul className="kkco-pay">
        {providers.map((provider) => (
          <li key={provider.name}>
            <img src={provider.icon} alt="" onError={(e) => { e.target.onerror = null; e.target.style.visibility = 'hidden'; }} />
            {provider.name}
          </li>
        ))}
      </ul>
      <p className="kkco-secure"><Lock /> Payments are processed securely by Paystack.</p>
    </div>
  </section>
);

export default PaymentCard;
