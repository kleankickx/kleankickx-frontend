import { motion } from 'framer-motion';
import { money } from './checkoutUi';

// The address the customer picked, with its fee. Used inside the address search.
const LocationCard = ({ location, type, onClear }) => (
  <motion.div
    className="kkco-loc"
    initial={{ opacity: 0, y: 6 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3, ease: [0.77, 0, 0.18, 1] }}
  >
    <div className="kkco-loc-top">
      <div style={{ minWidth: 0 }}>
        <b>{location.name}</b>
        {location.address && location.address !== location.name && <p>{location.address}</p>}
        {location.region && <span className="reg">{location.region}</span>}
      </div>
      <button type="button" className="kkco-loc-x" onClick={onClear} aria-label={`Clear ${type} address`}>
        <svg viewBox="0 0 16 16" width="11" height="11" aria-hidden="true"><path d="M2 2l12 12M14 2L2 14" stroke="currentColor" strokeWidth="2.2" /></svg>
      </button>
    </div>
    <div className="kkco-loc-fee">
      <span>{type === 'delivery' ? 'Delivery fee' : 'Pickup fee'}</span>
      <b>{money(location.cost)}</b>
    </div>
  </motion.div>
);

export default LocationCard;
