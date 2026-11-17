import { useEffect } from 'react';
import { toast } from 'react-toastify';
import PlaceAutoCompleteElementWrapper from './PlaceAutoCompleteElementWrapper';
import { card, cardBody } from './checkoutUi';

// One of the two ways to get sneakers to us
const MethodOption = ({ selected, onSelect, title, description, badge }) => (
  <button type="button" role="radio" aria-checked={selected} onClick={onSelect} className={`kkco-opt ${selected ? 'on' : ''}`}>
    <span className="dot" aria-hidden="true" />
    <b>{title}</b>
    <small>{description}</small>
    {badge && <span className="tag">{badge}</span>}
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
        <div className="kkco-head">
          <h2 id="pickup-title" className="kkco-h">Pickup & delivery</h2>
          <p className="kkco-sub">How should your sneakers get to us and back?</p>
        </div>

        <div role="radiogroup" aria-label="Pickup method" className="kkco-opts">
          <MethodOption
            selected={!props.isSelfHandled}
            onSelect={() => props.setIsSelfHandled(false)}
            title="We pick up & deliver"
            description="We collect your sneakers and bring them back clean."
          />
          <MethodOption
            selected={props.isSelfHandled}
            onSelect={() => props.setIsSelfHandled(true)}
            title="I'll drop off & collect"
            description="Bring them to our studio and pick them up when ready."
            badge="No pickup or delivery fees"
          />
        </div>

        {!props.isSelfHandled ? (
          <div style={{ marginTop: 24, display: 'grid', gap: 20 }}>
            <div>
              <p className="kkco-label">Pickup address <span className="req" aria-hidden="true">*</span></p>
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
            <label className="kkco-switch">
              <span>
                <b>Deliver to the same address</b>
                <small>Bring my sneakers back to the pickup address.</small>
              </span>
              <input
                type="checkbox"
                role="switch"
                checked={props.useSame}
                onChange={(e) => props.setUseSame(e.target.checked)}
                className="sr-only"
              />
              <span className="kkco-toggle" aria-hidden="true" />
            </label>

            {!props.useSame && (
              <div>
                <p className="kkco-label">Delivery address <span className="req" aria-hidden="true">*</span></p>
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
          <div className="kkco-note" style={{ marginTop: 24 }}>
            Drop off your sneakers at our <strong>Achimota Golf Hills studio</strong> (search "KleanKickx" on Google Maps).
            Check our opening hours before you head out.
            <ul>
              {['No pickup or delivery fees', 'Bring your sneakers to the studio', 'Collect them when cleaning is done', 'Questions? Call +233 53 627 8834'].map((text) => (
                <li key={text}>{text}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
};

export default DeliveryInformationCard;
