import { FaSpinner, FaLock, FaCreditCard, FaHandHolding, FaInfoCircle } from 'react-icons/fa';
import MTNMomoLogo from '../assets/mtn.png'
import TelecelLogo from '../assets/telecel.png'
import AirtelTigoLogo from '../assets/airtel.png'
import VisaMastercardLogo from '../assets/visa.jpeg';

const PaymentCard = ({
  placing,
  handlePayment,
  total,
  cartLength,
  delivery,
  useSame,
  pickup,
  isPhoneValid,
  pickupTime,
  isSelfHandled = false, // Add this prop
}) => {
  
  // Check if payment can proceed
  const canProceed = () => {
    if (cartLength === 0) return false;
    if (!isPhoneValid) return false;
    
    // If self-handled, skip location validation
    if (isSelfHandled) return true;
    
    // Otherwise, check locations
    if (!pickup) return false;
    if (!delivery && !useSame) return false;
    
    return true;
  };

  const providers = [
    { name: 'MTN Mobile Money', icon: MTNMomoLogo, key: 'momo_mtn' },
    { name: 'Telecel Cash', icon: TelecelLogo, key: 'telecel_cash' },
    { name: 'AirtelTigo Money', icon: AirtelTigoLogo, key: 'atigo_cash' },
    { name: 'Visa/Mastercard', icon: VisaMastercardLogo, key: 'card' },
  ];

  return (
    <div className="rounded-xl border shadow-xl border-gray-200 bg-white">
      <div className="bg-gray-50 rounded-tl-xl rounded-tr-xl px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold flex items-start lg:items-center">
          <FaCreditCard className="mr-3 text-primary" />
          Payment Options (via Paystack)
        </h2>
      </div>

      <div className="p-6">
        {/* Payment Providers */}
        <div className="grid lg:grid-cols-4 grid-cols-3 gap-4">
          {providers.map(provider => (
            <div
              key={provider.key}
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
        
        {/* Validation Messages */}
        {!canProceed() && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-sm text-red-700 font-medium mb-2">Complete these steps to proceed:</p>
            <ul className="text-sm text-red-600 space-y-1">
              {cartLength === 0 && <li>• Add items to your cart</li>}
              {!isPhoneValid && <li>• Enter a valid Ghana phone number</li>}
              {!isSelfHandled && !pickup && <li>• Select a pickup location</li>}
              {!isSelfHandled && !delivery && !useSame && <li>• Select a delivery location or use same as pickup</li>}
            </ul>
          </div>
        )}
        
        {/* Pay Now Button */}
        <button
          onClick={handlePayment}
          disabled={placing || !canProceed()}
          className={`w-full py-3 px-6 mt-6 rounded-xl font-semibold text-white transition-all duration-300 flex cursor-pointer items-center justify-center relative overflow-hidden group ${
            placing || !canProceed()
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