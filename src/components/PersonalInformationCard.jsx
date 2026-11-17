import { card, cardBody } from './checkoutUi';

const Tick = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-label="Valid number" role="img">
    <path d="M5 12.5l4.2 4.2L19 7" fill="none" stroke="#1A7A1A" strokeWidth="3" />
  </svg>
);

const PersonalInformationCard = ({ user, phoneNumber, handlePhoneChange, isPhoneValid }) => {
  const name = [user?.first_name, user?.last_name].filter(Boolean).join(' ');
  const initials = [user?.first_name?.[0], user?.last_name?.[0]].filter(Boolean).join('').toUpperCase() || '?';
  const showError = phoneNumber && !isPhoneValid;

  return (
    <section className={card} aria-labelledby="details-title">
      <div className={cardBody}>
        <div className="kkco-head">
          <h2 id="details-title" className="kkco-h">Your details</h2>
          <p className="kkco-sub">We'll use these to keep you updated about your order.</p>
        </div>

        {/* From the account */}
        <div className="kkco-who">
          <span className="ini" aria-hidden="true">{initials}</span>
          <div style={{ minWidth: 0 }}>
            <p className="n">{name || 'Your account'}</p>
            <p className="m">{user?.email}</p>
          </div>
        </div>

        {/* Phone */}
        <div style={{ marginTop: 22 }}>
          <label htmlFor="phone" className="kkco-label">
            Phone number <span className="req" aria-hidden="true">*</span>
          </label>
          <div className={`kkco-phone ${showError ? 'err' : ''}`}>
            <span className="pre" aria-hidden="true">+233</span>
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
              maxLength={14}
            />
            {phoneNumber && isPhoneValid && <span className="ok"><Tick /></span>}
          </div>
          <p id="phone-help" className={`kkco-help ${showError ? 'err' : ''}`}>
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
