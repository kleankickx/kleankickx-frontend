import { useEffect } from 'react';
import { toast } from 'react-toastify';
import { FaTruck, FaHandHolding, FaCheck, FaMapMarkerAlt, FaInfoCircle } from 'react-icons/fa';
import PlaceAutoCompleteElementWrapper from './PlaceAutoCompleteElementWrapper';
import { card, cardBody } from './checkoutUi';

// One of the two ways to get sneakers to us
const MethodOption = ({ selected, onSelect, icon: Icon, title, description, badge }) => (
  <button
    type="button"
    role="radio"
    aria-checked={selected}
    onClick={onSelect}
    className={`relative flex items-start gap-3 w-full text-left rounded-xl border-2 p-4 transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 ${
      selected ? 'border-primary bg-primary/5' : 'border-gray-200 bg-white hover:border-gray-300'
    }`}
  >
    <span
      className={`flex items-center justify-center w-10 h-10 rounded-full flex-shrink-0 transition-colors ${
        selected ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500'
      }`}
    >
      <Icon className="w-4 h-4" aria-hidden="true" />
    </span>
    <span className="flex-1 min-w-0 pr-6">
      <span className="block font-semibold text-gray-900">{title}</span>
      <span className="block text-sm text-gray-500 mt-0.5">{description}</span>
      {badge && (
        <span className="inline-block mt-2 text-xs font-medium text-primary bg-primary/10 rounded-full px-2 py-0.5">{badge}</span>
      )}
    </span>
    <span
      aria-hidden="true"
      className={`absolute top-4 right-4 flex items-center justify-center w-5 h-5 rounded-full border-2 transition-colors ${
        selected ? 'border-primary bg-primary text-white' : 'border-gray-300'
      }`}
    >
      {selected && <FaCheck className="w-2.5 h-2.5" />}
    </span>
  </button>
);

const DeliveryInformationCard = (props) => {
  // Choosing drop-off clears any addresses already picked
  useEffect(() => {
    if (props.isSelfHandled) {
      props.handlePlaceSelect(null, 'pickup', true);
      props.handlePlaceSelect(null, 'delivery', true);
      props.setUseSame(false);
      toast.info('Drop-off selected. No pickup or delivery fees will be charged.');
    }
  }, [props.isSelfHandled]);

  return (
    <section className={card} aria-labelledby="pickup-title">
      <div className={cardBody}>
        <h2 id="pickup-title" className="text-lg font-semibold text-gray-900">Pickup & delivery</h2>
        <p className="text-sm text-gray-500 mt-1">How should your sneakers get to us and back?</p>

        <div role="radiogroup" aria-label="Pickup method" className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <MethodOption
            selected={!props.isSelfHandled}
            onSelect={() => props.setIsSelfHandled(false)}
            icon={FaTruck}
            title="We pick up & deliver"
            description="We collect your sneakers and bring them back clean."
          />
          <MethodOption
            selected={props.isSelfHandled}
            onSelect={() => props.setIsSelfHandled(true)}
            icon={FaHandHolding}
            title="I'll drop off & collect"
            description="Bring them to our workshop and pick them up when ready."
            badge="No pickup or delivery fees"
          />
        </div>

        {!props.isSelfHandled ? (
          <div className="mt-6 space-y-5">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <FaMapMarkerAlt className="text-primary" aria-hidden="true" />
                Pickup address <span className="text-red-500">*</span>
              </label>
              <PlaceAutoCompleteElementWrapper
                key={`pickup-${props.paymentView}`}
                onPlaceSelect={(loc) => props.handlePlaceSelect(loc, 'pickup')}
                currentInputValue={props.pickupInputValue}
                initialLocation={props.pickup}
                placeholder="Search for your pickup address"
                type="pickup"
                region={props.pickupRegion}
                onFocus={() => props.setActiveInput('pickup')}
                pickupTime={props.pickupTime}
                setPickupTime={props.setPickupTime}
                useSame={props.useSame}
              />
            </div>

            {/* Same address switch */}
            <label className="flex items-center justify-between gap-4 rounded-xl border border-gray-200 p-4 cursor-pointer hover:bg-gray-50 transition-colors">
              <span>
                <span className="block text-sm font-medium text-gray-900">Deliver to the same address</span>
                <span className="block text-sm text-gray-500">Bring my sneakers back to the pickup address.</span>
              </span>
              <input
                type="checkbox"
                role="switch"
                checked={props.useSame}
                onChange={(e) => props.setUseSame(e.target.checked)}
                className="sr-only peer"
              />
              <span
                aria-hidden="true"
                className="relative w-11 h-6 rounded-full bg-gray-300 flex-shrink-0 transition-colors peer-checked:bg-primary peer-focus-visible:ring-4 peer-focus-visible:ring-primary/20 after:absolute after:top-0.5 after:left-0.5 after:w-5 after:h-5 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:after:translate-x-5"
              />
            </label>

            {!props.useSame && (
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <FaMapMarkerAlt className="text-gray-400" aria-hidden="true" />
                  Delivery address <span className="text-red-500">*</span>
                </label>
                <PlaceAutoCompleteElementWrapper
                  key={`delivery-${props.paymentView}`}
                  onPlaceSelect={(loc) => props.handlePlaceSelect(loc, 'delivery')}
                  currentInputValue={props.deliveryInputValue}
                  initialLocation={props.delivery}
                  placeholder="Search for your delivery address"
                  type="delivery"
                  region={props.deliveryRegion}
                  onFocus={() => props.setActiveInput('delivery')}
                  pickupTime={props.pickupTime}
                  setPickupTime={props.setPickupTime}
                  useSame={props.useSame}
                />
              </div>
            )}
          </div>
        ) : (
          <div className="mt-6 rounded-xl bg-amber-50 border border-amber-200 p-4 sm:p-5">
            <p className="flex items-start gap-2 text-sm text-amber-900">
              <FaInfoCircle className="mt-0.5 flex-shrink-0" aria-hidden="true" />
              <span>
                Drop off your sneakers at our <strong>Achimota Golf Hills workshop</strong> (searchable on Google Maps).
                Check our opening hours before you head out.
              </span>
            </p>
            <ul className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-amber-900">
              {['No pickup or delivery fees', 'Bring your sneakers to our workshop', 'Collect them when cleaning is done', 'Questions? Call +233 53 627 8834'].map((text) => (
                <li key={text} className="flex items-center gap-2">
                  <FaCheck className="w-3 h-3 text-primary flex-shrink-0" aria-hidden="true" />
                  {text}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
};

export default DeliveryInformationCard;
