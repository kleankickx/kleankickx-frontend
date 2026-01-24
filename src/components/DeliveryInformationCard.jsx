import { FaTruck, FaHandHolding, FaInfoCircle } from 'react-icons/fa';
import PlaceAutoCompleteElementWrapper from './PlaceAutoCompleteElementWrapper';
import { toast } from 'react-toastify'; // Don't forget to import toast
import { useEffect } from 'react'; // Don't forget to import useEffect

const DeliveryInformationCard = (props) => {
  // Effect to clear locations when self-handled is enabled
  useEffect(() => {
    if (props.isSelfHandled) {
      // Clear all location data
      props.handlePlaceSelect(null, 'pickup', true); // Add true for silent
      props.handlePlaceSelect(null, 'delivery', true); // Add true for silent
      props.setUseSame(false);
      
      // Show info message
      toast.info("Self-handled option selected. No pickup/delivery fees will be charged.");
    }
  }, [props.isSelfHandled]);

  return (
    // Pickup and Delivery Information Card
    <div className="bg-white shadow-xl rounded-xl border border-gray-200">
      <div className="bg-gray-50 px-6 py-4 rounded-tl-xl rounded-tr-xl border-b border-gray-200">
        <h2 className="text-xl font-semibold flex items-center">
          <FaTruck className="mr-3 text-primary" />
          Pickup and Delivery Information 
        </h2>
      </div>
      
      <div className="p-6 space-y-5 h-full max-h-[290px] overflow-y-auto">
        {/* Self-Handled Option */}
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <label className="flex items-center cursor-pointer group">
            <div className="relative">
              <input
                type="checkbox"
                id="selfHandled"
                checked={props.isSelfHandled}
                onChange={(e) => props.setIsSelfHandled(e.target.checked)}
                className="sr-only"
              />
              <div
                className={`w-5 h-5 rounded border-2 transition-all duration-200 ease-in-out
                  ${props.isSelfHandled 
                    ? 'bg-yellow-500 border-yellow-600' 
                    : 'bg-white border-gray-300 group-hover:border-yellow-500'
                  }`}
              >
                {props.isSelfHandled && (
                  <svg className="w-3 h-3 text-white mx-auto mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </div>
            <span className="ml-3 text-sm font-medium text-yellow-800 group-hover:text-yellow-900 transition-colors">
              I'll handle pickup and delivery myself
            </span>
          </label>
          
          {props.isSelfHandled && (
            <div className="mt-3 p-3 bg-white border border-yellow-300 rounded-md">
              <p className="text-sm text-yellow-700 flex items-start">
                <FaInfoCircle className="inline mr-2 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>Note:</strong> Please drop off your sneakers at our Achimota Golf Hills workshop (searchable on Google Maps). There will be no pickup or delivery fees. Check our website for opening hours before you head out!
                </span>
              </p>
            </div>
          )}
        </div>

        {/* Regular Pickup/Delivery Section (Hidden when self-handled) */}
        {!props.isSelfHandled ? (
          <>
            {/* Pickup Address Input */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Pickup Address <span className="text-red-500">*</span>
                </label>
              </div>
              <PlaceAutoCompleteElementWrapper
                key={`pickup-${props.paymentView}`}
                onPlaceSelect={(loc) => props.handlePlaceSelect(loc, 'pickup')}
                currentInputValue={props.pickupInputValue}
                initialLocation={props.pickup}
                placeholder="Enter pickup address"
                type="pickup"
                region={props.pickupRegion}
                onFocus={() => props.setActiveInput('pickup')}
                pickupTime={props.pickupTime}
                setPickupTime={props.setPickupTime}
                useSame={props.useSame}
              />
            </div>

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
                Use pickup address for delivery
              </span>
            </label>
            
            {props.useSame && (
              <div className="p-3 bg-green-50 border border-blue-200 text-blue-800 rounded">
                <p className="text-xs flex items-center">
                  <FaInfoCircle className="inline mr-2" />
                  Delivery address will be the same as pickup address.
                </p>
              </div>
            )}

            {/* Delivery Address Input (Conditional) */}
            {!props.useSame && (
              <div className="pt-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Delivery Address <span className="text-red-500">*</span>
                </label>
                <PlaceAutoCompleteElementWrapper
                  key={`delivery-${props.paymentView}`}
                  onPlaceSelect={(loc) => props.handlePlaceSelect(loc, 'delivery')}
                  currentInputValue={props.deliveryInputValue}
                  initialLocation={props.delivery}
                  placeholder="Enter delivery address"
                  type="delivery"
                  region={props.deliveryRegion}
                  onFocus={() => props.setActiveInput('delivery')}
                  pickupTime={props.pickupTime}
                  setPickupTime={props.setPickupTime}
                  useSame={props.useSame}
                />
              </div>
            )}
          </>
        ) : (
          // Show when self-handled is selected
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex items-center items-start mb-3">
              <FaHandHolding className="text-gray-600 mr-3" />
              <h3 className="font-medium text-gray-800">Self-Handled Service</h3>
            </div>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>No pickup or delivery fees</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Bring items to our facility</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Pick up when cleaning is complete</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">ℹ</span>
                <span>Contact us for facility location and hours</span>
              </li>
            </ul>
          </div>
        )}
      </div>
      <div className="h-5 bg-white z-50 rounded-bl-xl rounded-br-xl"></div>
    </div>
  );
};

export default DeliveryInformationCard;