import React from 'react';
import { FaSpinner, FaCheckCircle, FaUserFriends, FaStar, FaTags } from 'react-icons/fa';

// --- Icon Renderer Helper Component ---
const IconRenderer = ({ icon, className = "h-4 w-4 mr-2 text-gray-400" }) => {
  const icons = {
    currency: (
      <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
        <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
      </svg>
    ),
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
    <span className="font-medium text-gray-800">GHS {parseFloat(amount).toFixed(2)}</span>
  </div>
);

const DiscountRow = ({ label, amount, icon: Icon, colorClass }) => (
  <div className={`flex justify-between py-2.5 ${colorClass}`}>
    <span className="flex items-center">
      <Icon className="h-4 w-4 mr-2" />
      {label}
    </span>
    <span className="font-medium">-GHS {Math.abs(parseFloat(amount)).toFixed(2)}</span>
  </div>
);

// --- Payment Options Component ---

const PaymentOptions = ({ selectedProvider, setSelectedProvider }) => {
  const providers = [
    { name: 'MTN Mobile Money', iconUrl: 'https://placehold.co/40x40/FFCC00/000000?text=MoMo', key: 'momo_mtn' },
    { name: 'Telecel Cash', iconUrl: 'https://placehold.co/40x40/E40A1F/FFFFFF?text=TC', key: 'telecel_cash' },
    { name: 'AirtelTigo Money', iconUrl: 'https://placehold.co/40x40/01799F/FFFFFF?text=AT', key: 'atigo_cash' },
    { name: 'Visa/Mastercard', iconUrl: 'https://placehold.co/40x40/334155/FFFFFF?text=Cards', key: 'card' },
  ];

  const handleSelect = (key) => {
    setSelectedProvider(key);
  };

  return (
    <div className="p-6 bg-white rounded-xl">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Select Payment Method
      </h3>
      <div className="space-y-3">
        {providers.map(provider => (
          <div
            key={provider.key}
            onClick={() => handleSelect(provider.key)}
            className={`flex items-center justify-between p-4 rounded-lg cursor-pointer transition-all duration-200 border-2 ${
              selectedProvider === provider.key 
                ? 'border-primary shadow-md bg-emerald-50' 
                : 'border-gray-200 hover:border-gray-400'
            }`}
          >
            <div className="flex items-center">
              <img 
                src={provider.iconUrl} 
                alt={`${provider.name} logo`} 
                className="w-8 h-8 rounded-md mr-3"
                onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/40x40/D1D5DB/1F2937?text=PM'; }}
              />
              <span className={`font-medium ${selectedProvider === provider.key ? 'text-primary' : 'text-gray-700'}`}>
                {provider.name}
              </span>
            </div>
            {selectedProvider === provider.key && (
              <FaCheckCircle className="h-5 w-5 text-primary" />
            )}
          </div>
        ))}
      </div>
      
      <p className="text-xs text-gray-500 mt-6 text-center">
        Powered by Paystack. All transactions are secure and encrypted.
      </p>
    </div>
  );
};

// --- Main Payment View Component ---

const PaymentView = ({
  // Expects output from calculateOrderSummary.js
  appliedPromotion,
  placing,
  onPayment,
  onBack,
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
}) => {
    // State to manage the selected payment method
    const [selectedProvider, setSelectedProvider] = React.useState('momo_mtn');

    

  return (
    <div className="container mx-auto p-4 lg:p-8 max-w-4xl">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-6 lg:mb-8">Finalize Order</h1>
        <div className="lg:grid lg:grid-cols-2 gap-8">
            
            {/* --- Left Column: Invoice / Summary --- */}
            <div className="lg:order-1 order-2 bg-gray-50/50 p-6 rounded-2xl border border-gray-100 mb-8 lg:mb-0">
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
                    <div className="border-t-2 border-primary mt-4 pt-4">
                        <div className="flex justify-between items-center">
                            <span className="text-xl font-bold text-gray-800">
                                Total Payable
                            </span>
                            <span className="text-3xl font-extrabold text-primary">
                                GHS {total}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- Right Column: Payment Selection and Actions --- */}
            <div className="lg:order-2 order-1 space-y-8">
                
                {/* Payment Options Card */}
                <PaymentOptions 
                    selectedProvider={selectedProvider} 
                    setSelectedProvider={setSelectedProvider} 
                />

                {/* Payment Actions */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Final Action</h3>

                    {/* Pay Now Button */}
                    <button
                        onClick={() => onPayment(selectedProvider)} // Pass selected provider to handler
                        disabled={placing}
                        className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-300 flex items-center justify-center relative overflow-hidden group ${
                            placing 
                                ? 'bg-gray-300 cursor-not-allowed shadow-inner' 
                                : 'bg-gradient-to-r from-emerald-600 to-primary hover:from-emerald-700 hover:to-primary-dark shadow-xl hover:shadow-2xl'
                        }`}
                    >
                        {placing ? (
                            <>
                                <FaSpinner className="animate-spin mr-3 h-5 w-5 text-white" />
                                Processing Payment...
                            </>
                        ) : (
                            <>
                                <span className="relative z-10 flex items-center text-lg">
                                    Pay GHS {total}
                                </span>
                            </>
                        )}
                    </button>

                    {/* Back Button */}
                    <button
                        onClick={onBack}
                        className="w-full mt-3 py-3 px-6 rounded-xl font-medium text-gray-700 hover:text-gray-900 bg-white border border-gray-200 hover:border-gray-300 transition-all duration-300 flex items-center justify-center hover:shadow-sm group"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-500 group-hover:text-gray-700 transition-colors" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                        </svg>
                        Back to Review
                    </button>
                </div>

                {/* Security Footer */}
                <div className="mt-8 pt-6 border-t border-gray-100 text-center">
                    <div className="flex flex-col items-center text-center">
                        <div className="flex items-center text-emerald-600 mb-2">
                            <IconRenderer icon="currency" className="h-5 w-5 mr-2" />
                            <span className="ml-2 text-sm font-medium">100% Secure Transaction</span>
                        </div>
                        <p className="text-xs text-gray-500 max-w-xs">
                            Your payment details are protected and securely handled by our integrated processor.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default PaymentView;
