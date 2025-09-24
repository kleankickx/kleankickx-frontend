// src/components/checkout/LocationSection.jsx
import React from 'react';
import { FiTruck, FiNavigation, FiCheck } from 'react-icons/fi';
import PlaceAutocompleteElementWrapper from './PlaceAutoCompleteElementWrapper';

const LocationSection = ({
  delivery,
  pickup,
  useSame,
  deliveryInputValue,
  pickupInputValue,
  deliveryRegion,
  pickupRegion,
  locationLoading,
  onPlaceSelect,
  onUseCurrentLocation,
  onUseSameChange,
  onInputFocus
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
        <h2 className="text-xl font-semibold flex items-center">
          <FiTruck className="mr-3 text-primary" />
          Delivery Information
        </h2>
      </div>
      <div className="p-6 space-y-5">
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Delivery Address
            </label>
            <button
              onClick={onUseCurrentLocation}
              disabled={locationLoading}
              className="flex items-center text-sm text-blue-600 hover:text-blue-800 disabled:text-gray-400 transition-colors"
            >
              <FiNavigation className="mr-1.5" />
              {locationLoading ? 'Detecting...' : 'Use Current Location'}
            </button>
          </div>
          <PlaceAutocompleteElementWrapper
            onPlaceSelect={(loc) => onPlaceSelect(loc, 'delivery')}
            currentInputValue={deliveryInputValue}
            initialLocation={delivery}
            placeholder="Enter delivery address"
            type="delivery"
            region={deliveryRegion}
            onFocus={() => onInputFocus('delivery')}
          />
        </div>

        <CheckboxInput
          id="same"
          checked={useSame}
          onChange={onUseSameChange}
          label="Use delivery address for pickup"
        />

        {!useSame && (
          <PickupLocationSection
            pickup={pickup}
            pickupInputValue={pickupInputValue}
            pickupRegion={pickupRegion}
            onPlaceSelect={onPlaceSelect}
            onInputFocus={onInputFocus}
          />
        )}
      </div>
    </div>
  );
};

const CheckboxInput = ({ id, checked, onChange, label }) => (
  <label className="flex items-center cursor-pointer group">
    <div className="relative">
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={onChange}
        className="sr-only"
      />
      <div className={`w-5 h-5 rounded border-2 transition-all duration-200 ease-in-out
        ${checked 
          ? 'bg-primary border-primary' 
          : 'bg-white border-gray-300 group-hover:border-primary'
        }`}
      >
        {checked && (
          <svg className="w-3 h-3 text-white mx-auto mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
    </div>
    <span className="ml-3 text-sm text-gray-700 group-hover:text-gray-900 transition-colors">
      {label}
    </span>
  </label>
);

const PickupLocationSection = ({
  pickup,
  pickupInputValue,
  pickupRegion,
  onPlaceSelect,
  onInputFocus
}) => (
  <div className="pt-2">
    <label className="block text-sm font-medium text-gray-700 mb-2">
      Pickup Address
    </label>
    <PlaceAutocompleteElementWrapper
      onPlaceSelect={(loc) => onPlaceSelect(loc, 'pickup')}
      currentInputValue={pickupInputValue}
      initialLocation={pickup}
      placeholder="Enter pickup address"
      type="pickup"
      region={pickupRegion}
      onFocus={() => onInputFocus('pickup')}
    />
  </div>
);

export default LocationSection;