import { FaCheckCircle, FaTimesCircle, FaUser } from 'react-icons/fa';

const PersonalInformationCard = ({
  user, // The user object (e.g., { email, first_name, last_name, phone_number })
  phoneNumber,
  handlePhoneChange,
  isPhoneValid,
}) => {
  
  
  
  return (
    // Contact Information Card
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold flex items-center">
          {/* Icon for Personal Details */}
          <FaUser className="mr-2 text-primary" />
          Personal Details
        </h2>
      </div>

      <div className="p-6 space-y-5">
        {/* Name Fields (New Flex Container) */}
        <div className="flex space-x-4">
          {/* First Name */}
          <div className="flex-1">
            <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-2">
              First Name
            </label>
            <input
              type="text"
              id="first_name"
              value={user?.first_name || ''}
              disabled
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>

          {/* Last Name */}
          <div className="flex-1">
            <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-2">
              Last Name
            </label>
            <input
              type="text"
              id="last_name"
              value={user?.last_name || ''}
              disabled
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>
        </div>

        {/* Email Address Field (Disabled) */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Email Address
          </label>
          <input
            type="email"
            id="email"
            value={user?.email || ''}
            disabled
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary disabled:bg-gray-50 disabled:text-gray-500"
          />
        </div>
        
        {/* Phone Number Field */}
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number <span className="text-red-500">*</span>
          </label>
          <div className="relative rounded-lg overflow-hidden">
            {/* Country Code Prefix */}
            <div className="absolute inset-y-0 left-0 flex items-center px-4 bg-gray-100 border-r border-gray-200">
              <span className="text-gray-700 flex items-center">
                <span className="mr-2">🇬🇭</span> +233
              </span>
            </div>

            {/* Phone Input: Pre-fills if user.phone_number exists, otherwise uses state */}
            <input
              type="tel"
              id="phone"
              // Use initialPhoneNumber (from user prop) if handlePhoneChange hasn't been used yet,
              // otherwise rely on the passed-in state (phoneNumber).
              value={phoneNumber} 
              onChange={handlePhoneChange}
              placeholder="24 123 4567"
              className="pl-24 w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-0"
              maxLength={14}
            />

            {/* Validation Icon */}
            {phoneNumber && ( // Use initialPhoneNumber for validation check too
              <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                {isPhoneValid ? (
                  <FaCheckCircle className="text-green-500" />
                ) : (
                  <FaTimesCircle className="text-red-500" />
                )}
              </div>
            )}
          </div>

          {/* Validation Error Message */}
          {phoneNumber && !isPhoneValid && (
            <p className="mt-2 text-sm text-red-600">
              Please enter a valid Ghana phone number (e.g., 024 123 4567)
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PersonalInformationCard;