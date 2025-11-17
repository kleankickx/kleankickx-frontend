import { useState, useEffect, useRef, useCallback } from 'react';
import { useMapsLibrary } from '@vis.gl/react-google-maps';
import LocationCard from './LocationCard';
import { AnimatePresence, motion } from 'framer-motion';
import REGION_CONFIG from '../utils/regionConfig';
import { toast } from 'react-toastify';
import { FaSpinner } from 'react-icons/fa';
import axios from 'axios';

const AVAILABLE_REGIONS = Object.keys(REGION_CONFIG);

const PlaceAutocompleteElementWrapper = ({
  onPlaceSelect,
  placeholder,
  type,
  region,
  onFocus,
  currentInputValue,
  initialLocation,
  pickupTime,
  setPickupTime
}) => {
  const inputContainerRef = useRef(null);
  const autocompleteElementRef = useRef(null);
  const placesLibrary = useMapsLibrary('places');
  const geocodingLibrary = useMapsLibrary('geocoding');

  const [selectedLocation, setSelectedLocation] = useState(initialLocation || null);
  const [loading, setLoading] = useState(false);
  
  

  const handlePlaceSelect = useCallback(
    async (event) => {
      const placePrediction = event.placePrediction || event.detail?.placePrediction;
      if (!placePrediction) {
        toast.error('Location selection failed: Incomplete event data.');
        setSelectedLocation(null);
        setPickupTime(null); // Clear time on error
        onPlaceSelect(null, type);
        return;
      }

      try {
        setLoading(true);
        setPickupTime(null); // Clear previous time

        const place = await placePrediction.toPlace();
        await place.fetchFields({
          fields: ['displayName', 'formattedAddress', 'location']
        });

        if (!place?.formattedAddress || !place?.location) {
          toast.error('Selected location details are incomplete.');
          setSelectedLocation(null);
          onPlaceSelect(null, type);
          setLoading(false);
          return;
        }

        let detectedRegion = region;

        const geocoder = new geocodingLibrary.Geocoder();
        const latLng = { lat: place.location.lat(), lng: place.location.lng() };
        try {
          const geocodeResponse = await geocoder.geocode({ location: latLng });
          const geocodeResults = geocodeResponse.results;
          
          if (geocodeResults && geocodeResults.length > 0) {
            for (const result of geocodeResults) {
              // Look for administrative_area_level_1 (region/state)
              const adminAreaLevel1 = result.address_components.find((comp) =>
                comp.types.includes('administrative_area_level_1')
              );
              
              // Also look for locality or administrative_area_level_2 as fallback
              const locality = result.address_components.find((comp) =>
                comp.types.includes('locality')
              );
              
              const adminAreaLevel2 = result.address_components.find((comp) =>
                comp.types.includes('administrative_area_level_2')
              );

              if (adminAreaLevel1) {
                detectedRegion = adminAreaLevel1.long_name;
                break; // Found region, break out of loop
              } else if (locality) {
                detectedRegion = locality.long_name;
                break;
              } else if (adminAreaLevel2) {
                detectedRegion = adminAreaLevel2.long_name;
                break;
              }
            }
          }

              // If still no region found, try to extract from formatted address
          if (!detectedRegion && place.formattedAddress) {
            const addressParts = place.formattedAddress.split(',');
            if (addressParts.length > 1) {
              // Typically region is the second-to-last part in formatted addresses
              detectedRegion = addressParts[addressParts.length - 2]?.trim();
            }
          }
        } 
        catch (geocodeError) {
          console.error('Geocoding error:', geocodeError);
          toast.warn('Could not precisely determine region. Using fallback.');
        }
  
        const location = {
          address: place.formattedAddress,
          name: place.displayName || place.formattedAddress,
          region: detectedRegion,
          cost: area.fee,
          pickupTime: null,
          lat: place.location.lat(),
          lng: place.location.lng(),
          place_id: place.place_id
        };
       
        try {
          const responseConfig = await axios.get('https://merchant-api-test.zippy.com.gh/configs', {
            auth: {
              username: import.meta.env.VITE_ZIPPY_USERNAME,
              password: import.meta.env.VITE_ZIPPY_PASSWORD
            }
          });
          const pickupTimes = responseConfig.data.data.pickupTimes;
          const dateKeys = Object.keys(pickupTimes);
          const firstDateKey = dateKeys[0];
          const firstDayTimeSlots = pickupTimes[firstDateKey];
          const firstPickupTime = firstDayTimeSlots[0];
          location.pickupTime = firstPickupTime.value;

          const responsePricing = await axios.get('https://merchant-api-test.zippy.com.gh/delivery-times', {
            auth: {
              username: import.meta.env.VITE_ZIPPY_USERNAME,
              password: import.meta.env.VITE_ZIPPY_PASSWORD
            },
            params: {
              pickupTime: firstPickupTime.value,
              weight: 1,
              senderLocation: `${location.lat},${location.lng}`,
              receiverLocation: "5.632553, -0.224377"
            }
          });
          const pricingData = responsePricing.data.data;
          console.log('Zippy Pricing Data:', pricingData[0].totalPrice);

          location.cost = pricingData[0].totalPrice;
          setSelectedLocation(location);
          onPlaceSelect(location, type);
          setPickupTime(firstPickupTime);
          
        } catch (zippyError) {
          console.error('Error fetching Zippy config:', zippyError);
          toast.warn('Could not fetch available pickup times.');
          setPickupTime(null);
        }
        

      } catch (error) {
        console.error('Error processing location:', error);
        toast.error('Failed to process location. Please try again.');
        setSelectedLocation(null);
        setPickupTime(null);
        onPlaceSelect(null, type);
      } finally {
        setLoading(false);
      }
    },
    [onPlaceSelect, type, region, geocodingLibrary]
  );

  // ... (useEffect for Google Maps setup remains the same) ...
  useEffect(() => {
    if (!placesLibrary || !inputContainerRef.current) return;
    if (!window.google?.maps?.places?.PlaceAutocompleteElement) {
      toast.error('Location services unavailable. Please check API key.');
      return;
    }

    const autocomplete = new window.google.maps.places.PlaceAutocompleteElement({
      types: ['address'],
      includedRegionCodes: ['gh']
    });
    autocompleteElementRef.current = autocomplete;
    inputContainerRef.current.innerHTML = '';
    autocompleteElementRef.current.placeholder = placeholder || 'Search for a place';
    autocompleteElementRef.current.style.width = '100%';
    autocompleteElementRef.current.style.height = '45px';
    autocompleteElementRef.current.style.border = '1px solid #D1D5DB';
    inputContainerRef.current.appendChild(autocomplete);
    autocomplete.addEventListener('gmp-select', handlePlaceSelect);

    if (currentInputValue && initialLocation) {
      autocompleteElementRef.current.value = currentInputValue;
      setSelectedLocation(initialLocation);
    }

    return () => {
      autocomplete.removeEventListener('gmp-select', handlePlaceSelect);
      if (inputContainerRef.current?.contains(autocomplete)) {
        inputContainerRef.current.removeChild(autocomplete);
      }
    };
  }, [placesLibrary, handlePlaceSelect, currentInputValue, initialLocation]);

  const clearSelection = () => {
    setSelectedLocation(null);
    setPickupTime(null); // Clear time on clear selection
    onPlaceSelect(null, type);
    if (autocompleteElementRef.current) {
      autocompleteElementRef.current.value = '';
    }
  };

  const formatTimeRangeToAmPm = (timeRange) => {
    if (!timeRange) return '';
    
    // Splits "09:00-10:00" into ["09:00", "10:00"]
    const [startTime, endTime] = timeRange.split('-');

    const formatTime = (time24) => {
        try {
            const [hour, minute] = time24.split(':');
            // Creates a dummy Date object at a known time to use locale formatting
            const date = new Date(2000, 0, 1, parseInt(hour), parseInt(minute));
            
            // Format to 12-hour time with AM/PM
            return date.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });
        } catch (e) {
            return time24; // Fallback to 24hr format on error
        }
    };

    return `${formatTime(startTime)} - ${formatTime(endTime)}`;
  };
  const renderPickupTimeInfo = () => {
      if (!pickupTime){
        return (
          // warning to reselect a location to get pickup time
          <motion.div
              key="pickuptime-warning"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-2 p-3 rounded-lg bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm"
          >
              <p className="font-semibold mb-1 flex items-center">
                  ⚠️ Please reselect a location to get the pickup time.
              </p>
          </motion.div>
        )
      }

      // Use the 'value' to get the date part for contextual display: "2025-10-28, 09:00 - 10:00"
      const [datePart] = pickupTime?.value.split(', ');
      
      // The time range is the clean label: "09:00-10:00"
      const time24Display = pickupTime?.value.split(', ')[1].replace(' - ', '-');
      
      // 💡 NEW: Convert 24-hour time range to 12-hour AM/PM 💡
      const timeAmPmDisplay = formatTimeRangeToAmPm(time24Display);
      
      let dateDisplay = '';
      let dayOfWeek = '';

      try {
          // Ensure dateObj is a correct representation of the date (timezone might affect 'Today'/'Tomorrow')
          // Using an adjustment to ensure the date is interpreted locally, although toDateString() is often sufficient.
          const dateObj = new Date(datePart + 'T00:00:00'); 
          const today = new Date();
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);

          // Reset time component for comparison robustness
          today.setHours(0, 0, 0, 0);
          tomorrow.setHours(0, 0, 0, 0);
          dateObj.setHours(0, 0, 0, 0);
          
          const dateString = dateObj.toDateString();

          if (dateString === today.toDateString()) {
              dateDisplay = 'Today';
          } else if (dateString === tomorrow.toDateString()) {
              dateDisplay = 'Tomorrow';
          } else {
              const dateOptions = { month: 'short', day: 'numeric' };
              dateDisplay = new Intl.DateTimeFormat('en-US', dateOptions).format(dateObj);
          }
          
          dayOfWeek = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(dateObj);

      } catch (e) {
          console.error("Date parsing error in pickup time:", e);
          dateDisplay = 'The Soonest';
          dayOfWeek = '';
      }


      return (
          <motion.div
              key="pickuptime"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-2 p-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-sm"
          >
              <p className="font-semibold mb-1 flex items-center">
                  🚛 Earliest Available Pickup:
              </p>
              <p className="pl-1">
                  <span className="font-bold">{dateDisplay} ({dayOfWeek})</span>, between {' '}
                  {/* 💡 Use the new AM/PM formatted time 💡 */}
                  <span className="font-bold text-base text-blue-900">{timeAmPmDisplay}</span>
              </p>
              {/* Removed the raw pickupTime.value for a cleaner look */}
              <p className="text-xs text-blue-600 mt-1">
                  This is the earliest hour-long window we can schedule your pickup.
              </p>
          </motion.div>
      );
  };


  return (
    <div className="relative mt-2">
      <div
        ref={inputContainerRef}
        className="w-full place-autocomplete-input-container"
        onFocus={onFocus}
      />

      <AnimatePresence>
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-2 p-3 rounded border border-gray-200 bg-gray-50 text-gray-600 text-sm flex flex-col items-center justify-center"
          >
            <FaSpinner className="animate-spin text-primary" />
            <p className="mt-2 text-center">Processing location and checking availability...</p>
          </motion.div>
        ) : selectedLocation ? (
          <>
            <LocationCard
              key="location"
              location={selectedLocation}
              type={type}
              onClear={clearSelection}
            />
            {type === 'delivery' && renderPickupTimeInfo()}
          </>
        ) : (
          <motion.div
            key="placeholder"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-2 p-3 rounded-lg border border-dashed border-gray-300 text-gray-400 text-sm text-center"
          >
            No location selected yet
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PlaceAutocompleteElementWrapper;