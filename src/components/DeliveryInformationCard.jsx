import { FiTruck } from 'react-icons/fi';
import PlaceAutoCompleteElementWrapper from './PlaceAutoCompleteElementWrapper';
import { FaInfo, FaInfoCircle } from 'react-icons/fa';



const DeliveryInformationCard = (props) => {
  return (
    // Delivery Information Card
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
        <h2 className="text-xl font-semibold flex items-center">
          <FiTruck className="mr-3 text-primary" />
          Delivery Information
        </h2>
      </div>
      
      <div className="p-6 space-y-5">
        {/* Delivery Address Input */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Delivery Address
            </label>
            {/* The "Use Current Location" button is commented out, so we'll leave it out here for cleanliness. */}
          </div>
          <PlaceAutoCompleteElementWrapper
            key={`delivery-${props.paymentView}`}
            onPlaceSelect={(loc) => props.handlePlaceSelect(loc, 'delivery')}
            currentInputValue={props.deliveryInputValue}
            initialLocation={props.delivery}
            placeholder="Enter delivery address"
            type="delivery"
            region={props.deliveryRegion}
            onFocus={() => props.setActiveInput('delivery')}
          />
        </div>

        {props.useSame && (
          // alert
          <div className="p-3 bg-green-50 border border-blue-200 text-blue-800 rounded">
            <p className="text-sm">
              <FaInfoCircle className="inline mr-2" />
              Pickup address will be the same as delivery address.
            </p>
          </div>
        )}

        {/* Use Same Checkbox */}
        <label className="flex items-center cursor-pointer group">
          <div className="relative">
            <input
              type="checkbox"
              id="same"
              checked={props.useSame}
              onChange={(e) => props.setUseSame(e.target.checked)}
              className="sr-only"
            />
            <div
              className={`w-5 h-5 rounded border-2 transition-all duration-200 ease-in-out
                ${props.useSame 
                  ? 'bg-primary border-primary' 
                  : 'bg-white border-gray-300 group-hover:border-primary'
                }`}
            >
              {props.useSame && (
                <svg className="w-3 h-3 text-white mx-auto mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
          </div>
          <span className="ml-3 text-sm text-gray-700 group-hover:text-gray-900 transition-colors">
            Use delivery address for pickup
          </span>
        </label>
        
        {/* Pickup Address Input (Conditional) */}
        {!props.useSame && (
          <div className="pt-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pickup Address
            </label>
            <PlaceAutoCompleteElementWrapper
              key={`pickup-${props.paymentView}`}
              onPlaceSelect={(loc) => props.handlePlaceSelect(loc, 'pickup')}
              currentInputValue={props.pickupInputValue}
              initialLocation={props.pickup}
              placeholder="Enter pickup address"
              type="pickup"
              region={props.pickupRegion}
              onFocus={() => props.setActiveInput('pickup')}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default DeliveryInformationCard;