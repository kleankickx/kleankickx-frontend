import { FaSpinner,FaMoneyBillWave, FaLock, FaCreditCard } from 'react-icons/fa';
import  MTNMomoLogo  from '../assets/mtn.png'
import TelecelLogo from '../assets/telecel.png'
import AirtelTigoLogo from '../assets/airtel.png'
import VisaMastercardLogo from '../assets/visa.jpeg';
// --- Payment Options Component (No Selection) ---

const PaymentOptions = ({handlePayment, total, placing}) => {
  
};


const PaymentCard = ({
  placing,
  handlePayment,
  total,
  cartLength,
  delivery,
  useSame,
  pickup,
  isPhoneValid,
  pickupTime

}) => {


  const providers = [
    { name: 'MTN Mobile Money', icon: MTNMomoLogo, key: 'momo_mtn' },
    { name: 'Telecel Cash', icon: TelecelLogo, key: 'telecel_cash' },
    { name: 'AirtelTigo Money', icon: AirtelTigoLogo, key: 'atigo_cash' },
    { name: 'Visa/Mastercard', icon: VisaMastercardLogo, key: 'card' },
  ];

  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      <div className="bg-gray-50 rounded-tl-xl rounded-tr-xl px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold flex items-center">
                {/* Icon for Personal Details */}
                <FaCreditCard className="mr-3 text-primary" />
                Payment Options (via Paystack)
              </h2>
      </div>

      <div className="p-6">
        <div className="grid lg:grid-cols-4 grid-cols-3 gap-4">
          {providers.map(provider => (
            <div
              key={provider.key}
              // Styled for display only, no selection interaction
              className="flex flex-col items-center justify-center w-24 h-24 p-2 rounded-xl border border-gray-200 shadow-sm transition-shadow duration-200 hover:shadow-md bg-white/50"
            >
              <img 
                src={provider.icon} 
                alt={`${provider.name} logo`} 
                className="w-10 h-10 rounded-lg object-cover"
                onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/40x40/D1D5DB/1F2937?text=PM'; }}
              />
              <span className="text-xs font-medium text-gray-700 mt-2 text-center leading-tight">
                {provider.name}
              </span>
            </div>
          ))}
        </div>
        
        {/* Pay Now Button */}
        <button
          onClick={handlePayment} // Now calls onPayment without a selected provider argument
          disabled={placing || cartLength === 0 || !delivery || (!useSame && !pickup) || !isPhoneValid || !pickupTime}
          className={`w-full py-3 px-6 mt-8 rounded-xl font-semibold text-white transition-all duration-300 flex cursor-pointer items-center justify-center relative overflow-hidden group ${
            placing || cartLength === 0 || !delivery || (!useSame && !pickup) || !isPhoneValid || !pickupTime
              ? 'bg-gray-300 cursor-not-allowed shadow-inner' 
              : 'bg-gradient-to-r from-emerald-600 to-primary hover:from-emerald-700 hover:to-primary-dark shadow-xl hover:shadow-2xl'
          }`}
        >
          {placing ? (
            <>
              <FaSpinner className="animate-spin mr-3 h-5 w-5 text-white" />
              Processing Transaction...
            </>
          ) : (
            <span className="relative z-10 flex items-center text-lg">
              Pay &#8373; {total}
            </span>
          )}
        </button>

        {/* Security Footer */}
        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
          <div className="flex flex-col items-center text-center">
            <div className="flex items-center text-emerald-600 mb-2">
              <FaLock />
              <span className="ml-2 text-sm font-medium">100% Secure Transaction</span>
            </div>
            <p className="text-xs text-gray-500 max-w-xs">
              Your payment details are protected and securely handled by our integrated processor.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentCard;