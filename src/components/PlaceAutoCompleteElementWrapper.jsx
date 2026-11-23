import { useState, useEffect, useRef, useCallback } from 'react';
import LocationCard from './LocationCard';
import { AnimatePresence, motion } from 'framer-motion';
import REGION_CONFIG from '../utils/regionConfig';
import { toast } from 'react-toastify';
import api from '../api';
import OutOfAreaNotice from './OutOfAreaNotice';

const AVAILABLE_REGIONS = Object.keys(REGION_CONFIG);

// Address suggestions favour the area we serve (the studio at Golf Hills, Accra).
const STUDIO = { lat: 5.632553, lng: -0.224377 };

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
  const [outOfArea, setOutOfArea] = useState(null); // { city, address, lat, lng, message }
  
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
  
  // Is this spot one we pick up from / deliver to? The server decides (and enforces it
  // again at checkout). If the check itself fails we don't block: checkout will say.
  const checkServiceArea = async (lat, lng) => {
    try {
      const { data } = await api.get('/api/delivery/service-area/', { params: { lat, lng }, timeout: 10000 });
      return data;
    } catch (error) {
      console.error('Service area check failed:', error);
      return { served: true };
    }
  };

  // Fetch Zippy pickup times (proxied by the backend, which holds the Zippy credentials)
  const fetchZippyPickupTimes = async () => {
    try {
      const response = await api.get('/api/orders/zippy/pickup-time/', { timeout: 15000 });

      const firstPickupTime = response.data?.pickup_time;
      if (!firstPickupTime) {
        throw new Error('No time slots available');
      }

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
      // The backend quotes exactly what checkout will charge (incl. the fallback fee).
      const response = await api.get('/api/orders/zippy/quote/', {
        params: {
          lat: pickupLat,
          lng: pickupLng,
          pickup_time: pickupTimeValue || undefined
        },
        timeout: 15000
      });

      const price = Number(response.data?.price);
      if (price > 0) {
        return price;
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
        setOutOfArea(null);

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
        let detectedCity = '';
        const lat = place.location.lat();
        const lng = place.location.lng();
        
        try {
          const geocodeResults = await geocodeLocation(lat, lng);
          
          for (const result of geocodeResults) {
            const cityComp = result.address_components.find((comp) => comp.types.includes('locality'));
            if (!detectedCity && cityComp) detectedCity = cityComp.long_name;
          }
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

        // Outside the area we serve: stop here, explain, and offer "notify me".
        const area = await checkServiceArea(lat, lng);
        if (area && area.served === false) {
          setSelectedLocation(null);
          setPickupTime(null);
          onPlaceSelect(null, type);
          setOutOfArea({ city: detectedCity || detectedRegion || '', address: place.formattedAddress, lat, lng,
                         message: area.message });
          setLoading(false);
          return;
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
          
        } else {
          setUsingFallbackMode(false);
        }
        
        // Fetch pricing from Zippy (with fallback)
        const cost = await fetchZippyPricing(lat, lng, pickupTimeResult?.value);

        // Only show rate info once per session when using fallback
        if (cost === 50 && isFallback && !regionInfoShown) {
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
      includedRegionCodes: ['gh'],
      locationBias: { center: STUDIO, radius: 40000 }, // suggest Accra addresses first
    });
    
    autocompleteElementRef.current = autocomplete;
    inputContainerRef.current.innerHTML = '';
    autocomplete.placeholder = placeholder || 'Search for a place';
    autocomplete.style.width = '100%';
    autocomplete.style.minHeight = '54px';
    autocomplete.style.border = '1.5px solid #D9DFD7';
    autocomplete.style.borderRadius = '2px';
    autocomplete.style.background = '#fff';
    autocomplete.style.colorScheme = 'light';
    autocomplete.style.fontFamily = '"League Spartan", system-ui, sans-serif';
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
    setOutOfArea(null);
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
              className="kkco-when"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
          >
              Earliest pickup: <b>{dateDisplay}{dayOfWeek ? ` (${dayOfWeek})` : ''}, {timeAmPmDisplay}</b>
              <small>The first hour-long window our rider can come.</small>
          </motion.div>
      );
  };

  // Show loading while Google Maps is loading
  if (!googleMapsLoaded) {
    return (
      <div className="kkco-vars">
        <div className="kkco-skel" aria-hidden="true" />
        <p className="kkco-placeholder">Loading address search…</p>
      </div>
    );
  }

  return (
    <div className="relative kkco-vars">
      <div
        ref={inputContainerRef}
        className="w-full place-autocomplete-input-container"
        onFocus={onFocus}
      />

      <AnimatePresence>
        {loading ? (
          <motion.p
            key="loading"
            className="kkco-placeholder"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="status"
          >
            <span className="kkco-spin" aria-hidden="true" /> Checking availability and price…
          </motion.p>
        ) : selectedLocation ? (
          <>
            <LocationCard
              key="location"
              location={selectedLocation}
              type={type}
              onClear={clearSelection}
            />
            {shouldShowPickupTimeInfo() && renderPickupTimeInfo()}
          </>
        ) : outOfArea ? (
          <OutOfAreaNotice key="out-of-area" place={outOfArea} onDismiss={clearSelection} />
        ) : (
          <motion.p
            key="placeholder"
            className="kkco-placeholder"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            Start typing, then pick your address from the list.
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PlaceAutocompleteElementWrapper;