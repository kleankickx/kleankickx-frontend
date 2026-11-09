import { FaCheckCircle, FaExclamationCircle, FaEnvelope } from 'react-icons/fa';
import { card, cardBody } from './checkoutUi';

const PersonalInformationCard = ({ user, phoneNumber, handlePhoneChange, isPhoneValid }) => {
  const name = [user?.first_name, user?.last_name].filter(Boolean).join(' ');
  const initials = [user?.first_name?.[0], user?.last_name?.[0]].filter(Boolean).join('').toUpperCase() || '?';
  const showError = phoneNumber && !isPhoneValid;

  return (
    <section className={card} aria-labelledby="details-title">
      <div className={cardBody}>
        <h2 id="details-title" className="text-lg font-semibold text-gray-900">Your details</h2>
        <p className="text-sm text-gray-500 mt-1">We'll use these to keep you updated about your order.</p>

        {/* From the account */}
        <div className="mt-5 flex items-center gap-4 rounded-xl bg-gray-50 border border-gray-100 p-4">
          <span className="flex items-center justify-center w-12 h-12 rounded-full bg-primary text-white font-semibold flex-shrink-0">
            {initials}
          </span>
          <div className="min-w-0">
            <p className="font-medium text-gray-900 truncate">{name || 'Your account'}</p>
            <p className="text-sm text-gray-500 truncate flex items-center gap-1.5">
              <FaEnvelope className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
              {user?.email}
            </p>
          </div>
        </div>

        {/* Phone */}
        <div className="mt-5">
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
            Phone number <span className="text-red-500">*</span>
          </label>
          <div
            className={`flex items-stretch h-12 rounded-xl border bg-white overflow-hidden transition focus-within:ring-4 ${
              showError
                ? 'border-red-300 focus-within:ring-red-100'
                : 'border-gray-300 focus-within:border-primary focus-within:ring-primary/15'
            }`}
          >
            <span className="flex items-center gap-2 px-3 sm:px-4 bg-gray-50 border-r border-gray-200 text-sm text-gray-700 flex-shrink-0">
              <span aria-hidden="true">🇬🇭</span> +233
            </span>
            <input
              type="tel"
              id="phone"
              inputMode="tel"
              autoComplete="tel-national"
              value={phoneNumber}
              onChange={handlePhoneChange}
              placeholder="024 123 4567"
              aria-invalid={showError ? 'true' : 'false'}
              aria-describedby="phone-help"
              className="flex-1 min-w-0 px-3 sm:px-4 text-base text-gray-900 placeholder:text-gray-400 outline-none bg-transparent"
              maxLength={14}
            />
            {phoneNumber && (
              <span className="flex items-center pr-4">
                {isPhoneValid ? (
                  <FaCheckCircle className="text-primary" aria-label="Valid number" />
                ) : (
                  <FaExclamationCircle className="text-red-500" aria-label="Invalid number" />
                )}
              </span>
            )}
          </div>
          <p id="phone-help" className={`mt-2 text-sm ${showError ? 'text-red-600' : 'text-gray-500'}`}>
            {showError
              ? 'Enter a valid Ghana number, e.g. 024 123 4567.'
              : 'Our rider and the team will call or text this number.'}
          </p>
        </div>
      </div>
    </section>
  );
};

export default PersonalInformationCard;
