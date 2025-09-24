import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { validateGhanaPhone } from '../utils/checkoutUtils';

const ContactSection = ({ user, phoneNumber, onPhoneChange, isPhoneValid }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
        <h2 className="text-xl font-semibold flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-primary" viewBox="0 0 20 20" fill="currentColor">
            <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
          </svg>
          Contact Details
        </h2>
      </div>
      <div className="p-6 space-y-5">
        <EmailInput email={user?.email} />
        <PhoneInput
          phoneNumber={phoneNumber}
          onPhoneChange={onPhoneChange}
          isPhoneValid={isPhoneValid}
        />
      </div>
    </div>
  );
};

const EmailInput = ({ email }) => (
  <div>
    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
      Email Address
    </label>
    <input
      type="email"
      id="email"
      value={email || ''}
      disabled
      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary disabled:bg-gray-50 disabled:text-gray-500"
    />
  </div>
);

const PhoneInput = ({ phoneNumber, onPhoneChange, isPhoneValid }) => (
  <div>
    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
      Phone Number
    </label>
    <div className="relative rounded-lg overflow-hidden">
      <div className="absolute inset-y-0 left-0 flex items-center px-4 bg-gray-100 border-r border-gray-200">
        <span className="text-gray-700 flex items-center">
          <span className="mr-2">🇬🇭</span> +233
        </span>
      </div>
      <input
        type="tel"
        id="phone"
        value={phoneNumber}
        onChange={onPhoneChange}
        placeholder="24 123 4567"
        className="pl-24 w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-0"
        maxLength={13}
      />
      {phoneNumber && (
        <div className="absolute inset-y-0 right-0 flex items-center pr-4">
          {isPhoneValid ? (
            <FaCheckCircle className="text-green-500" />
          ) : (
            <FaTimesCircle className="text-red-500" />
          )}
        </div>
      )}
    </div>
    {phoneNumber && !isPhoneValid && (
      <p className="mt-2 text-sm text-red-600">
        Please enter a valid Ghana phone number (e.g., 024 123 4567)
      </p>
    )}
  </div>
);

export default ContactSection;