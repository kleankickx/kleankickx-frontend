// import { useState, useEffect, useRef, useCallback } from 'react';
// import { useMapsLibrary } from '@vis.gl/react-google-maps';
// import LocationCard from './LocationCard'
// import { AnimatePresence } from 'framer-motion';
// import REGION_CONFIG from '../utils/regionConfig'


// // Available regions for dropdown
// const AVAILABLE_REGIONS = Object.keys(REGION_CONFIG);


// // PlaceAutocompleteElementWrapper
// const PlaceAutocompleteElementWrapper = ({ onPlaceSelect, placeholder, type, region, onFocus, currentInputValue, initialLocation }) => {
//     const inputContainerRef = useRef(null);
//     const autocompleteElementRef = useRef(null);
//     const placesLibrary = useMapsLibrary('places');
//     const [selectedLocation, setSelectedLocation] = useState(initialLocation || null);
//     const geocodingLibrary = useMapsLibrary('geocoding');

//     const handlePlaceSelect = useCallback(async (event) => {
//         const placePrediction = event.placePrediction || event.detail?.placePrediction;
//         if (!placePrediction) {
//             console.error("Error: placePrediction is missing");
//             toast.error('Location selection failed: Incomplete event data.');
//             setSelectedLocation(null);
//             onPlaceSelect(null, type);
//             return;
//         }

//         try {
//             const place = await placePrediction.toPlace();
//             await place.fetchFields({
//                 fields: ['displayName', 'formattedAddress', 'location']
//             });

//             if (!place?.formattedAddress || !place?.location) {
//                 toast.error('Selected location details are incomplete.');
//                 setSelectedLocation(null);
//                 onPlaceSelect(null, type);
//                 return;
//             }

//             let detectedRegion = region;
//             let detectedAreaKey = null;
//             let tempRegion = null;

//             if (geocodingLibrary) {
//                 const geocoder = new geocodingLibrary.Geocoder();
//                 const latLng = { lat: place.location.lat(), lng: place.location.lng() };
//                 try {
//                     const geocodeResponse = await geocoder.geocode({ location: latLng });
//                     const geocodeResults = geocodeResponse.results;
//                     for (const result of geocodeResults) {
//                         const adminAreaLevel1 = result.address_components.find(comp => 
//                             comp.types.includes('administrative_area_level_1')
//                         );
//                         if (adminAreaLevel1) {
//                             const matchedRegion = AVAILABLE_REGIONS.find(r => 
//                                 adminAreaLevel1.long_name.includes(r)
//                             );
//                             tempRegion = adminAreaLevel1.long_name;
//                             if (matchedRegion) {
//                                 detectedRegion = matchedRegion;
//                                 break;
//                             }
//                         }
//                     }
//                     const regionData = REGION_CONFIG[detectedRegion];
//                     if (!regionData) {
//                         toast.error(`${tempRegion} is not set up for delivery yet`)
//                         setSelectedLocation(null);
//                         onPlaceSelect(null, type);
//                         return;
//                     }
//                     for (const result of geocodeResults) {
//                         const locality = result.address_components.find(comp =>
//                             comp.types.includes('locality') || comp.types.includes('sublocality')
//                         )?.long_name.toLowerCase() || '';
//                         const sortedAreaKeys = Object.keys(regionData.availableAreas)
//                             .sort((a, b) => b.length - a.length);
//                         for (const areaKey of sortedAreaKeys) {
//                             if (locality.includes(areaKey.toLowerCase())) {
//                                 detectedAreaKey = areaKey;
//                                 break;
//                             }
//                         }
//                         if (detectedAreaKey) break;
//                     }
//                 } catch (geocodeError) {
//                     console.error("Geocoding error:", geocodeError);
//                     toast.warn("Could not precisely determine area. Using fallback.");
//                 }
//             }

//             if (!detectedAreaKey) {
//                 const searchString = (place.formattedAddress || place.displayName || '').toLowerCase();
//                 const regionData = REGION_CONFIG[detectedRegion];
//                 if (searchString && regionData) {
//                     const sortedAreaKeys = Object.keys(regionData.availableAreas)
//                         .sort((a, b) => b.length - a.length);
//                     for (const areaKey of sortedAreaKeys) {
//                         if (searchString.includes(areaKey.toLowerCase())) {
//                             detectedAreaKey = areaKey;
//                             break;
//                         }
//                     }
//                 }
//             }

//             const regionData = REGION_CONFIG[detectedRegion];
//             if (!regionData) {
//                 toast.error('Region configuration not found.');
//                 setSelectedLocation(null);
//                 onPlaceSelect(null, type);
//                 return;
//             }

//             const area = detectedAreaKey
//                 ? regionData.availableAreas[detectedAreaKey]
//                 : regionData.availableAreas[regionData.defaultArea];

//             if (!area) {
//                 toast.error('Could not determine delivery area.');
//                 setSelectedLocation(null);
//                 onPlaceSelect(null, type);
//                 return;
//             }

//             const location = {
//                 address: place.formattedAddress,
//                 name: place.displayName || place.formattedAddress,
//                 region: detectedRegion,
//                 areaName: area.name,
//                 cost: area.fee,
//                 lat: place.location.lat(),
//                 lng: place.location.lng(),
//                 place_id: place.place_id
//             };

//             setSelectedLocation(location);
//             onPlaceSelect(location, type);
//         } catch (error) {
//             console.error('Error processing location:', error);
//             toast.error('Failed to process location. Please try again.');
//             setSelectedLocation(null);
//             onPlaceSelect(null, type);
//         }
//     }, [onPlaceSelect, type, region, geocodingLibrary]);

//     useEffect(() => {
//         if (!placesLibrary || !inputContainerRef.current) return;
//         if (!window.google?.maps?.places?.PlaceAutocompleteElement) {
//             console.error('PlaceAutocompleteElement not available.');
//             toast.error('Location services unavailable. Please check API key.');
//             return;
//         }

//         const autocomplete = new window.google.maps.places.PlaceAutocompleteElement({
//             types: ['address'],
//             includedRegionCodes: ['gh']
//         });
//         autocompleteElementRef.current = autocomplete;
//         inputContainerRef.current.innerHTML = '';
//         autocompleteElementRef.current.placeholder = placeholder || 'Search for a place';
//         autocompleteElementRef.current.style.width = '100%';
//         autocompleteElementRef.current.style.height = '45px';
//         // autocompleteElementRef.current.style.backgroundColor = "#F2F0EF"
//         autocompleteElementRef.current.style.border = "1px solid #D1D5DB"
//         inputContainerRef.current.appendChild(autocomplete);
//         autocomplete.addEventListener('gmp-select', handlePlaceSelect);

//         // Initialize with currentInputValue
//         if (currentInputValue && initialLocation) {
//             autocompleteElementRef.current.value = currentInputValue;
//             setSelectedLocation(initialLocation);
//         }

//         return () => {
//             autocomplete.removeEventListener('gmp-select', handlePlaceSelect);
//             if (inputContainerRef.current && inputContainerRef.current.contains(autocomplete)) {
//                 inputContainerRef.current.removeChild(autocomplete);
//             }
//         };
//     }, [placesLibrary, handlePlaceSelect, currentInputValue, initialLocation]);

//     const clearSelection = () => {
//         setSelectedLocation(null);
//         onPlaceSelect(null, type);
//         if (autocompleteElementRef.current) {
//             autocompleteElementRef.current.value = '';
//         }
//     };

//     return (
//         <div className="relative mt-2">
//             <div
//                 ref={inputContainerRef}
//                 className="w-full place-autocomplete-input-container"
//                 onFocus={onFocus}
//             />
//             <AnimatePresence>
//                 {selectedLocation && (
//                     <LocationCard
//                         location={selectedLocation}
//                         type={type}
//                         onClear={clearSelection}
//                     />
//                 )}
//             </AnimatePresence>
//         </div>
//     );
// };

// export default PlaceAutocompleteElementWrapper;


import { useState, useEffect, useRef, useCallback } from 'react';
import { useMapsLibrary } from '@vis.gl/react-google-maps';
import LocationCard from './LocationCard';
import { AnimatePresence, motion } from 'framer-motion';
import REGION_CONFIG from '../utils/regionConfig';
import { toast } from 'react-toastify';
import { FaSpinner } from 'react-icons/fa';

const AVAILABLE_REGIONS = Object.keys(REGION_CONFIG);

const PlaceAutocompleteElementWrapper = ({
  onPlaceSelect,
  placeholder,
  type,
  region,
  onFocus,
  currentInputValue,
  initialLocation
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
        onPlaceSelect(null, type);
        return;
      }

      try {
        setLoading(true); // start loading
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
        let detectedAreaKey = null;
        let tempRegion = null;

        if (geocodingLibrary) {
          const geocoder = new geocodingLibrary.Geocoder();
          const latLng = { lat: place.location.lat(), lng: place.location.lng() };
          try {
            const geocodeResponse = await geocoder.geocode({ location: latLng });
            const geocodeResults = geocodeResponse.results;
            for (const result of geocodeResults) {
              const adminAreaLevel1 = result.address_components.find((comp) =>
                comp.types.includes('administrative_area_level_1')
              );
              if (adminAreaLevel1) {
                const matchedRegion = AVAILABLE_REGIONS.find((r) =>
                  adminAreaLevel1.long_name.includes(r)
                );
                tempRegion = adminAreaLevel1.long_name;
                if (matchedRegion) {
                  detectedRegion = matchedRegion;
                  break;
                }
              }
            }
            const regionData = REGION_CONFIG[detectedRegion];
            if (!regionData) {
              toast.error(`${tempRegion} is not set up for delivery yet`);
              setSelectedLocation(null);
              onPlaceSelect(null, type);
              setLoading(false);
              return;
            }
            for (const result of geocodeResults) {
              const locality =
                result.address_components.find(
                  (comp) =>
                    comp.types.includes('locality') ||
                    comp.types.includes('sublocality')
                )?.long_name.toLowerCase() || '';
              const sortedAreaKeys = Object.keys(regionData.availableAreas).sort(
                (a, b) => b.length - a.length
              );
              for (const areaKey of sortedAreaKeys) {
                if (locality.includes(areaKey.toLowerCase())) {
                  detectedAreaKey = areaKey;
                  break;
                }
              }
              if (detectedAreaKey) break;
            }
          } catch (geocodeError) {
            console.error('Geocoding error:', geocodeError);
            toast.warn('Could not precisely determine area. Using fallback.');
          }
        }

        if (!detectedAreaKey) {
          const searchString =
            (place.formattedAddress || place.displayName || '').toLowerCase();
          const regionData = REGION_CONFIG[detectedRegion];
          if (searchString && regionData) {
            const sortedAreaKeys = Object.keys(regionData.availableAreas).sort(
              (a, b) => b.length - a.length
            );
            for (const areaKey of sortedAreaKeys) {
              if (searchString.includes(areaKey.toLowerCase())) {
                detectedAreaKey = areaKey;
                break;
              }
            }
          }
        }

        const regionData = REGION_CONFIG[detectedRegion];
        if (!regionData) {
          toast.error('Region configuration not found.');
          setSelectedLocation(null);
          onPlaceSelect(null, type);
          setLoading(false);
          return;
        }

        const area = detectedAreaKey
          ? regionData.availableAreas[detectedAreaKey]
          : regionData.availableAreas[regionData.defaultArea];

        if (!area) {
          toast.error('Could not determine delivery area.');
          setSelectedLocation(null);
          onPlaceSelect(null, type);
          setLoading(false);
          return;
        }

        const location = {
          address: place.formattedAddress,
          name: place.displayName || place.formattedAddress,
          region: detectedRegion,
          areaName: area.name,
          cost: area.fee,
          lat: place.location.lat(),
          lng: place.location.lng(),
          place_id: place.place_id
        };

        setSelectedLocation(location);
        onPlaceSelect(location, type);
      } catch (error) {
        console.error('Error processing location:', error);
        toast.error('Failed to process location. Please try again.');
        setSelectedLocation(null);
        onPlaceSelect(null, type);
      } finally {
        setLoading(false); // stop loading
      }
    },
    [onPlaceSelect, type, region, geocodingLibrary]
  );

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
    onPlaceSelect(null, type);
    if (autocompleteElementRef.current) {
      autocompleteElementRef.current.value = '';
    }
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
            <p className="mt-2 text-center">Processing location...</p>
          </motion.div>
        ) : selectedLocation ? (
          <LocationCard
            key="location"
            location={selectedLocation}
            type={type}
            onClear={clearSelection}
          />
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

