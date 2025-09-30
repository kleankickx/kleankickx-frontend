import React from 'react';
import { FaSpinner, FaCheckCircle, FaUserFriends, FaStar, FaTags, FaLock } from 'react-icons/fa';
import  MTNMomoLogo  from '../assets/mtn.png'
import TelecelLogo from '../assets/telecel.png'
import AirtelTigoLogo from '../assets/airtel.png'
import VisaMastercardLogo from '../assets/visa.jpeg';
// --- Icon Renderer Helper Component ---
const IconRenderer = ({ icon, className = "h-4 w-4 mr-2 text-gray-400" }) => {
  const icons = {

    truck: (
      <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
        <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
        <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1v-1a1 1 0 011-1h2a1 1 0 011 1v1a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H19a1 1 0 001-1V5a1 1 0 00-1-1H3z" />
      </svg>
    ),
    location: (
      <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
      </svg>
    )
  };

  return icons[icon] || null;
};

// --- Row Components ---

const PriceRow = ({ label, amount, icon }) => (
  <div className="flex justify-between py-2.5">
    <span className="text-gray-600 flex items-center">
      <IconRenderer icon={icon} />
      {label}
    </span>
    <span className="font-medium text-gray-800">&#8373; {parseFloat(amount).toFixed(2)}</span>
  </div>
);

const DiscountRow = ({ label, amount, icon: Icon, colorClass }) => (
  <div className={`flex justify-between py-2.5 ${colorClass}`}>
    <span className="flex items-center">
      <Icon className="h-4 w-4 mr-2" />
      {label}
    </span>
    <span className="font-medium">- &#8373; {Math.abs(parseFloat(amount)).toFixed(2)}</span>
  </div>
);

// --- Payment Options Component (No Selection) ---

const PaymentOptions = ({handlePayment, total, placing}) => {
  const providers = [
    { name: 'MTN Mobile Money', icon: MTNMomoLogo, key: 'momo_mtn' },
    { name: 'Telecel Cash', icon: TelecelLogo, key: 'telecel_cash' },
    { name: 'AirtelTigo Money', icon: AirtelTigoLogo, key: 'atigo_cash' },
    { name: 'Visa/Mastercard', icon: VisaMastercardLogo, key: 'card' },
  ];

  return (
    <div className="p-6 bg-white rounded-xl shadow-md border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-800 mb-5">
        Payment Options (via Paystack)
      </h3>
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
        disabled={placing}
        className={`w-full py-3 px-6 mt-8 rounded-xl font-semibold text-white transition-all duration-300 flex cursor-pointer items-center justify-center relative overflow-hidden group ${
          placing 
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
  );
};


const PaymentCard = ({
  // Expects output from calculateOrderSummary.js
  appliedPromotion,
  placing,
  handlePayment,
  subtotal,
  deliveryFee,
  pickupFee,
  signupDiscount,
  signupDiscountAmount,
  referralDiscount,
  referralDiscountAmount,
  redeemedPointsDiscount,
  redeemedPointsDiscountAmount,
  promoDiscountAmount,
  total,
  canUseSignup,
  canUseReferral,
  canUseRedeemedPoints,
  setPaymentView
}) => {
  // REMOVED: const [selectedProvider, setSelectedProvider] = React.useState('momo_mtn');

  return (
    <div className="">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Finalize Order & Pay</h1>
        {/* Back Button */}
        <button
          onClick={() => setPaymentView(false)}
          className="font-medium text-gray-700 cursor-pointer flex items-center text-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-500 group-hover:text-gray-700 transition-colors" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back
        </button>
      </div>
      
      <div className="lg:grid lg:grid-cols-2 gap-8">
        
        {/* --- Left Column: Invoice / Summary --- */}
        <div className="lg:order-1 order-2 bg-white p-6 rounded-2xl shadow-xl border border-gray-100 mb-8 lg:mb-0 h-fit">
          <div className="relative mb-6">
            <h2 className="text-xl font-bold text-gray-800 tracking-tight">Invoice Details</h2>
            <p className="text-sm text-gray-500">A full breakdown of your order charges.</p>
          </div>

          <div className="space-y-2">
            {/* Item Breakdown */}
            <div className="py-2">
              <h3 className="font-semibold text-gray-700 mb-2">Service Charges</h3>
              {/* Subtotal */}
              <PriceRow 
                label="Subtotal (Items)" 
                amount={subtotal} 
                icon="currency"
              />
            </div>
            
            <div className="py-2 border-t border-gray-200">
              <h3 className="font-semibold text-gray-700 mb-2">Discounts Applied</h3>
              {/* Discounts */}
              {canUseSignup && signupDiscount && (
                <DiscountRow
                  label={`Sign-up Bonus (${signupDiscount.percentage}%)`}
                  amount={signupDiscountAmount}
                  icon={FaCheckCircle}
                  colorClass="text-emerald-600"
                />
              )}

              {canUseReferral && referralDiscount && (
                <DiscountRow
                  label={`Referral Gift (${referralDiscount.percentage}%)`}
                  amount={referralDiscountAmount}
                  icon={FaUserFriends}
                  colorClass="text-blue-600"
                />
              )}

              {canUseRedeemedPoints && redeemedPointsDiscount && (
                <DiscountRow
                  label={`Points Redemption (${redeemedPointsDiscount.percentage}%)`}
                  amount={redeemedPointsDiscountAmount}
                  icon={FaStar}
                  colorClass="text-amber-600"
                />
              )}

              {appliedPromotion && (
                <DiscountRow
                  label={`Special Promotion (${appliedPromotion.discount_percentage}%)`}
                  amount={promoDiscountAmount}
                  icon={FaTags}
                  colorClass="text-purple-600"
                />
              )}
              
              {!canUseSignup && !canUseReferral && !canUseRedeemedPoints && !appliedPromotion && (
                <p className="text-sm text-gray-500 py-2">No discounts currently applied.</p>
              )}
            </div>
            
            <div className="py-2 border-t border-gray-200">
              <h3 className="font-semibold text-gray-700 mb-2">Fees</h3>
              {/* Fees */}
              <PriceRow 
                label="Delivery Fee" 
                amount={deliveryFee} 
                icon="truck"
              />
              
              <PriceRow 
                label="Pickup Fee" 
                amount={pickupFee} 
                icon="location"
              />
            </div>

            {/* Total */}
            <div className="border-t-1 border-gray-200 mt-4 pt-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-gray-800">
                  Total Payable
                </span>
                <span className="text-2xl font-extrabold text-gray-900">
                  {/* cedis symbol */}
                  &#8373;
                  {total}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* --- Right Column: Payment Selection and Actions --- */}
        <div className="lg:order-2 order-1 space-y-8">
          
          {/* Payment Options Card (Display Only) */}
          <PaymentOptions 
            handlePayment={handlePayment}
            total={total}
            placing={placing}
          />


         
        </div>
      </div>
    </div>
  );
};

export default PaymentCard;
