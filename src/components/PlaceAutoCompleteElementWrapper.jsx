import { useState, useEffect, useRef, useCallback } from 'react';
import LocationCard from './LocationCard';
import { AnimatePresence, motion } from 'framer-motion';
import REGION_CONFIG from '../utils/regionConfig';
import { toast } from 'react-toastify';
import { FaSpinner } from 'react-icons/fa';
import axios from 'axios';

const AVAILABLE_REGIONS = Object.keys(REGION_CONFIG);

// Allowed regions for fallback mode
const ALLOWED_FALLBACK_REGIONS = ['Accra', 'Greater Accra', 'Kasoa'];

// Track if fallback warning has been shown
let fallbackWarningShown = false;
let regionInfoShown = false;

const PlaceAutocompleteElementWrapper = ({
  onPlaceSelect,
  placeholder,
  type,
  region,
  onFocus,
  currentInputValue,
  initialLocation,
  pickupTime,
  setPickupTime, 
  useSame
}) => {
  const inputContainerRef = useRef(null);
  const autocompleteElementRef = useRef(null);
  const [selectedLocation, setSelectedLocation] = useState(initialLocation || null);
  const [loading, setLoading] = useState(false);
  const [usingFallbackMode, setUsingFallbackMode] = useState(false);
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);
  
  // Check if Google Maps is loaded
  useEffect(() => {
    const checkGoogleMaps = setInterval(() => {
      if (window.google?.maps?.places?.PlaceAutocompleteElement) {
        setGoogleMapsLoaded(true);
        clearInterval(checkGoogleMaps);
      }
    }, 100);
    
    return () => clearInterval(checkGoogleMaps);
  }, []);
  
  // Reset fallback warning flags when component unmounts
  useEffect(() => {
    return () => {
      fallbackWarningShown = false;
      regionInfoShown = false;
    };
  }, []);
  
  // Check if region is allowed for fallback
  const isRegionAllowedForFallback = (regionName) => {
    if (!regionName) return false;
    return ALLOWED_FALLBACK_REGIONS.some(allowed => 
      regionName.toLowerCase().includes(allowed.toLowerCase())
    );
  };

  // Fetch Zippy pickup times
  const fetchZippyPickupTimes = async () => {
    try {
      const response = await axios.get('https://merchant-api-test.zippy.com.gh/configs', {
        auth: {
          username: import.meta.env.VITE_ZIPPY_USERNAME,
          password: import.meta.env.VITE_ZIPPY_PASSWORD
        },
        timeout: 10000
      });
      
      const pickupTimes = response.data?.data?.pickupTimes;
      if (!pickupTimes) {
        throw new Error('No pickup times in response');
      }
      
      const dateKeys = Object.keys(pickupTimes);
      if (dateKeys.length === 0) {
        throw new Error('No dates available');
      }
      
      const firstDateKey = dateKeys[0];
      const firstDayTimeSlots = pickupTimes[firstDateKey];
      
      if (!firstDayTimeSlots || firstDayTimeSlots.length === 0) {
        throw new Error('No time slots available');
      }
      
      const firstPickupTime = firstDayTimeSlots[0];
      return {
        value: firstPickupTime.value,
        label: firstPickupTime.label || firstPickupTime.value,
        isFallback: false
      };
    } catch (error) {
      console.error('Zippy API Error - Using fallback:', error);
      return null; // Return null to indicate fallback mode with no pickup time
    }
  };

  // Fetch delivery pricing from Zippy
  const fetchZippyPricing = async (pickupLat, pickupLng, pickupTimeValue) => {
    try {
      const response = await axios.get('https://merchant-api-test.zippy.com.gh/delivery-times', {
        auth: {
          username: import.meta.env.VITE_ZIPPY_USERNAME,
          password: import.meta.env.VITE_ZIPPY_PASSWORD
        },
        params: {
          pickupTime: pickupTimeValue,
          weight: 1,
          senderLocation: `${pickupLat},${pickupLng}`,
          receiverLocation: "5.632553, -0.224377"
        },
        timeout: 10000
      });
      
      const pricingData = response.data?.data;
      if (pricingData && pricingData.length > 0 && pricingData[0]?.totalPrice) {
        return pricingData[0].totalPrice;
      }
      
      throw new Error('No pricing data available');
    } catch (error) {
      console.error('Zippy Pricing API Error - Using fallback price:', error);
      return 50; // Fallback price
    }
  };

  // Geocode function using window.google directly
  const geocodeLocation = useCallback(async (lat, lng) => {
    return new Promise((resolve, reject) => {
      if (!window.google?.maps?.Geocoder) {
        reject(new Error('Geocoder not available'));
        return;
      }
      
      const geocoder = new window.google.maps.Geocoder();
      const latLng = { lat, lng };
      
      geocoder.geocode({ location: latLng }, (results, status) => {
        if (status === 'OK' && results && results.length > 0) {
          resolve(results);
        } else {
          reject(new Error(`Geocoding failed: ${status}`));
        }
      });
    });
  }, []);

  const handlePlaceSelect = useCallback(
    async (event) => {
      const placePrediction = event.placePrediction || event.detail?.placePrediction;
      if (!placePrediction) {
        toast.error('Location selection failed: Incomplete event data.');
        setSelectedLocation(null);
        setPickupTime(null);
        onPlaceSelect(null, type);
        return;
      }

      try {
        setLoading(true);
        setPickupTime(null);

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
        const lat = place.location.lat();
        const lng = place.location.lng();
        
        try {
          const geocodeResults = await geocodeLocation(lat, lng);
          
          for (const result of geocodeResults) {
            const adminAreaLevel1 = result.address_components.find((comp) =>
              comp.types.includes('administrative_area_level_1')
            );
            const locality = result.address_components.find((comp) =>
              comp.types.includes('locality')
            );
            const adminAreaLevel2 = result.address_components.find((comp) =>
              comp.types.includes('administrative_area_level_2')
            );

            if (adminAreaLevel1) {
              detectedRegion = adminAreaLevel1.long_name;
              break;
            } else if (locality) {
              detectedRegion = locality.long_name;
              break;
            } else if (adminAreaLevel2) {
              detectedRegion = adminAreaLevel2.long_name;
              break;
            }
          }

          if (!detectedRegion && place.formattedAddress) {
            const addressParts = place.formattedAddress.split(',');
            if (addressParts.length > 1) {
              detectedRegion = addressParts[addressParts.length - 2]?.trim();
            }
          }
        } catch (geocodeError) {
          console.error('Geocoding error:', geocodeError);
        }

        // Fetch pickup times from Zippy (may return null for fallback)
        const pickupTimeResult = await fetchZippyPickupTimes();
        
        // Check if we're in fallback mode (Zippy failed)
        const isFallback = pickupTimeResult === null;
        
        if (isFallback) {
          setUsingFallbackMode(true);
          
          // Show fallback warning only once per session
          if (!fallbackWarningShown) {
            fallbackWarningShown = true;
          }
          
          // Validate region for fallback mode
          if (!isRegionAllowedForFallback(detectedRegion)) {
            toast.error(
              `Sorry, delivery is currently only available in Accra and Kasoa. Selected region: ${detectedRegion || 'Unknown'}`,
              { autoClose: 6000 }
            );
            setSelectedLocation(null);
            setPickupTime(null);
            onPlaceSelect(null, type);
            setLoading(false);
            return;
          }
        } else {
          setUsingFallbackMode(false);
        }
        
        // Fetch pricing from Zippy (with fallback)
        const cost = await fetchZippyPricing(lat, lng, pickupTimeResult?.value);

        // Only show rate info once per session when using fallback
        if (cost === 50 && isFallback && !regionInfoShown) {
          toast.info('Standard delivery rate: GHS 50.00 for Accra/Kasoa', {
            autoClose: 4000
          });
          regionInfoShown = true;
        }

        const location = {
          address: place.formattedAddress,
          name: place.displayName || place.formattedAddress,
          region: detectedRegion,
          cost: cost,
          pickupTime: pickupTimeResult?.value || null, // No pickup time in fallback mode
          lat: lat,
          lng: lng,
          place_id: place.place_id,
          usingFallback: isFallback
        };
        
        setSelectedLocation(location);
        onPlaceSelect(location, type);
        setPickupTime(pickupTimeResult); // Will be null in fallback mode

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
    [onPlaceSelect, type, region, setPickupTime, geocodeLocation]
  );

  // Setup Google Maps autocomplete
  useEffect(() => {
    if (!googleMapsLoaded || !inputContainerRef.current) return;
    if (!window.google?.maps?.places?.PlaceAutocompleteElement) {
      toast.error('Location services unavailable. Please check API key.');
      return;
    }

    // Clean up any existing autocomplete
    if (autocompleteElementRef.current && inputContainerRef.current?.contains(autocompleteElementRef.current)) {
      inputContainerRef.current.removeChild(autocompleteElementRef.current);
    }

    const autocomplete = new window.google.maps.places.PlaceAutocompleteElement({
      types: ['address'],
      includedRegionCodes: ['gh']
    });
    
    autocompleteElementRef.current = autocomplete;
    inputContainerRef.current.innerHTML = '';
    autocomplete.placeholder = placeholder || 'Search for a place';
    autocomplete.style.width = '100%';
    autocomplete.style.height = '45px';
    autocomplete.style.border = '1px solid #D1D5DB';
    autocomplete.style.borderRadius = '0.5rem';
    autocomplete.style.padding = '0 1rem';
    inputContainerRef.current.appendChild(autocomplete);
    autocomplete.addEventListener('gmp-select', handlePlaceSelect);

    if (currentInputValue && initialLocation) {
      autocomplete.value = currentInputValue;
      setSelectedLocation(initialLocation);
    }

    return () => {
      if (autocomplete) {
        autocomplete.removeEventListener('gmp-select', handlePlaceSelect);
      }
      if (inputContainerRef.current?.contains(autocomplete)) {
        inputContainerRef.current.removeChild(autocomplete);
      }
    };
  }, [googleMapsLoaded, handlePlaceSelect, currentInputValue, initialLocation, placeholder]);

  const clearSelection = () => {
    setSelectedLocation(null);
    setPickupTime(null);
    onPlaceSelect(null, type);
    if (autocompleteElementRef.current) {
      autocompleteElementRef.current.value = '';
    }
  };

  const formatTimeRangeToAmPm = (timeRange) => {
    if (!timeRange) return '';
    
    const [startTime, endTime] = timeRange.split('-');

    const formatTime = (time24) => {
        try {
            const [hour, minute] = time24.split(':');
            const date = new Date(2000, 0, 1, parseInt(hour), parseInt(minute));
            
            return date.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });
        } catch (e) {
            return time24;
        }
    };

    return `${formatTime(startTime)} - ${formatTime(endTime)}`;
  };

  const shouldShowPickupTimeInfo = () => {
    if (useSame) {
      return type === 'delivery';
    } else {
      return type === 'pickup';
    }
  };

  const renderPickupTimeInfo = () => {
      // Don't show pickup time info in fallback mode or if no pickup time
      if (!pickupTime || pickupTime === null) {
        return null;
      }

      const [datePart] = pickupTime?.value.split(', ');
      const time24Display = pickupTime?.value.split(', ')[1]?.replace(' - ', '-') || pickupTime?.value;
      const timeAmPmDisplay = formatTimeRangeToAmPm(time24Display);
      
      let dateDisplay = '';
      let dayOfWeek = '';

      try {
          const dateObj = new Date(datePart + 'T00:00:00'); 
          const today = new Date();
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);

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
              className={`mt-2 p-3 rounded-lg border ${useSame ? 'bg-blue-50 border-blue-200 text-blue-800' : 'bg-green-50 border-green-200 text-green-800'} text-sm`}
          >
              <p className="font-semibold mb-1 flex items-center">
                  🚛 Earliest Available Pickup:
              </p>
              <p className="pl-1">
                  <span className="font-bold">{dateDisplay} ({dayOfWeek})</span>, between {' '}
                  <span className={`font-bold text-base ${useSame ? 'text-blue-900' : 'text-green-900'}`}>{timeAmPmDisplay}</span>
              </p>
              <p className={`text-xs ${useSame ? 'text-blue-600' : 'text-green-600'} mt-1`}>
                  This is the earliest hour-long window we can schedule your pickup.
              </p>
          </motion.div>
      );
  };

  // Show loading while Google Maps is loading
  if (!googleMapsLoaded) {
    return (
      <div className="relative mt-2">
        <div className="w-full h-[45px] bg-gray-100 animate-pulse rounded-lg"></div>
        <div className="mt-2 p-3 rounded-lg border border-dashed border-gray-300 text-gray-400 text-sm text-center">
          Loading location services...
        </div>
      </div>
    );
  }

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
            <p className="mt-2 text-center">Checking availability and pricing...</p>
          </motion.div>
        ) : selectedLocation ? (
          <>
            <LocationCard
              key="location"
              location={selectedLocation}
              type={type}
              onClear={clearSelection}
            />
            {shouldShowPickupTimeInfo() && renderPickupTimeInfo()}
            {selectedLocation.usingFallback && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-700"
              >
                ℹ️ Currently serving <strong>Accra and Kasoa</strong> only. Other regions coming soon!
              </motion.div>
            )}
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