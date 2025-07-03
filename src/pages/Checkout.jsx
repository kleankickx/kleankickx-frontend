import React, { useState, useEffect, useRef, useContext, useCallback } from 'react';
import { APIProvider, Map, MapControl, ControlPosition, useMap, useMapsLibrary, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';
import { toast } from 'react-toastify';
import { FiX, FiCheck, FiMapPin, FiTruck, FiPackage, FiNavigation, FiInfo,  } from 'react-icons/fi';
import { FaCheckCircle, FaTimesCircle, FaSpinner } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Paystack from '@paystack/inline-js'
import PaystackIcon from "../assets/paystack.png"
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';

// --- Constants ---
const Maps_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;
const DEFAULT_CENTER = { lat: 5.6037, lng: -0.1870 }; // Accra coordinates
const MAP_CONTAINER_STYLE = { width: '100%', height: '300px', borderRadius: '12px' };
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000';

// Region pricing configuration
const REGION_CONFIG = {
    'Greater Accra Region': {
        defaultFee: 40,
        availableAreas: {
            'tema': { fee: 60, name: 'Tema' },
            'accra': { fee: 40, name: 'Accra' }
        },
        defaultArea: 'accra'
    },
    'Central Region': {
        defaultFee: 70,
        availableAreas: {
            'kasoa': { fee: 60, name: 'Kasoa' }
        },
        defaultArea: 'kasoa'
    },
};

// Available regions for dropdown
const AVAILABLE_REGIONS = Object.keys(REGION_CONFIG);

// --- Helper Components ---

// LocationCard (unchanged)
const LocationCard = ({ location, type, onClear }) => {
    const icon = type === 'delivery' ? <FiTruck className="text-blue-500" /> : <FiPackage className="text-green-500" />;
    const bgColor = type === 'delivery' ? 'bg-blue-50' : 'bg-green-50';
    const textColor = type === 'delivery' ? 'text-blue-800' : 'text-green-800';

    return (
        <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ duration: 0.3 }}
            className={`mt-3 p-4 ${bgColor} ${textColor} rounded-lg shadow-sm border border-gray-100`}
        >
            <div className="flex justify-between items-start">
                <div className="flex items-start">
                    <div className="mr-3 mt-1">{icon}</div>
                    <div>
                        <h3 className="font-semibold">{location.name}</h3>
                        <p className="text-sm mt-1">{location.address}</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                            <span className="px-2 py-1 bg-white rounded-md text-xs font-medium shadow-xs">
                                {location.region}
                            </span>
                            <span className="px-2 py-1 bg-white rounded-md text-xs font-medium shadow-xs">
                                {location.areaName}
                            </span>
                        </div>
                    </div>
                </div>
                <button
                    onClick={onClear}
                    className="text-gray-400 hover:text-gray-600 cursor-pointer"
                    aria-label={`Clear ${type} location`}
                >
                    <FiX />
                </button>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between items-center">
                <span className="font-medium">{type === 'delivery' ? 'Delivery Fee:' : 'Pickup Fee:'}</span>
                <span className="font-bold">GHS {location.cost.toFixed(2)}</span>
            </div>
        </motion.div>
    );
};

// PlaceAutocompleteElementWrapper
const PlaceAutocompleteElementWrapper = ({ onPlaceSelect, placeholder, type, region, onFocus, currentInputValue, initialLocation }) => {
    const inputContainerRef = useRef(null);
    const autocompleteElementRef = useRef(null);
    const placesLibrary = useMapsLibrary('places');
    const [selectedLocation, setSelectedLocation] = useState(initialLocation || null);
    const geocodingLibrary = useMapsLibrary('geocoding');

    const handlePlaceSelect = useCallback(async (event) => {
        const placePrediction = event.placePrediction || event.detail?.placePrediction;
        if (!placePrediction) {
            console.error("Error: placePrediction is missing");
            toast.error('Location selection failed: Incomplete event data.');
            setSelectedLocation(null);
            onPlaceSelect(null, type);
            return;
        }

        try {
            const place = await placePrediction.toPlace();
            await place.fetchFields({
                fields: ['displayName', 'formattedAddress', 'location']
            });

            if (!place?.formattedAddress || !place?.location) {
                toast.error('Selected location details are incomplete.');
                setSelectedLocation(null);
                onPlaceSelect(null, type);
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
                        const adminAreaLevel1 = result.address_components.find(comp => 
                            comp.types.includes('administrative_area_level_1')
                        );
                        if (adminAreaLevel1) {
                            const matchedRegion = AVAILABLE_REGIONS.find(r => 
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
                        toast.error(`${tempRegion} is not set up for delivery yet`)
                        setSelectedLocation(null);
                        onPlaceSelect(null, type);
                        return;
                    }
                    for (const result of geocodeResults) {
                        const locality = result.address_components.find(comp =>
                            comp.types.includes('locality') || comp.types.includes('sublocality')
                        )?.long_name.toLowerCase() || '';
                        const sortedAreaKeys = Object.keys(regionData.availableAreas)
                            .sort((a, b) => b.length - a.length);
                        for (const areaKey of sortedAreaKeys) {
                            if (locality.includes(areaKey.toLowerCase())) {
                                detectedAreaKey = areaKey;
                                break;
                            }
                        }
                        if (detectedAreaKey) break;
                    }
                } catch (geocodeError) {
                    console.error("Geocoding error:", geocodeError);
                    toast.warn("Could not precisely determine area. Using fallback.");
                }
            }

            if (!detectedAreaKey) {
                const searchString = (place.formattedAddress || place.displayName || '').toLowerCase();
                const regionData = REGION_CONFIG[detectedRegion];
                if (searchString && regionData) {
                    const sortedAreaKeys = Object.keys(regionData.availableAreas)
                        .sort((a, b) => b.length - a.length);
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
                return;
            }

            const area = detectedAreaKey
                ? regionData.availableAreas[detectedAreaKey]
                : regionData.availableAreas[regionData.defaultArea];

            if (!area) {
                toast.error('Could not determine delivery area.');
                setSelectedLocation(null);
                onPlaceSelect(null, type);
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
        }
    }, [onPlaceSelect, type, region, geocodingLibrary]);

    useEffect(() => {
        if (!placesLibrary || !inputContainerRef.current) return;
        if (!window.google?.maps?.places?.PlaceAutocompleteElement) {
            console.error('PlaceAutocompleteElement not available.');
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
        autocompleteElementRef.current.style.backgroundColor = "#F2F0EF"
        inputContainerRef.current.appendChild(autocomplete);
        autocomplete.addEventListener('gmp-select', handlePlaceSelect);

        // Initialize with currentInputValue
        if (currentInputValue && initialLocation) {
            autocompleteElementRef.current.value = currentInputValue;
            setSelectedLocation(initialLocation);
        }

        return () => {
            autocomplete.removeEventListener('gmp-select', handlePlaceSelect);
            if (inputContainerRef.current && inputContainerRef.current.contains(autocomplete)) {
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
                {selectedLocation && (
                    <LocationCard
                        location={selectedLocation}
                        type={type}
                        onClear={clearSelection}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

// MapHandler (unchanged)
const MapHandler = ({ delivery, pickup, useSame, currentLocation, activeInput }) => {
    const map = useMap();
    const geocoder = useMapsLibrary('geocoding');
    const deliveryMarkerRef = useRef(null);
    const pickupMarkerRef = useRef(null);

    // Handle map bounds and center
    useEffect(() => {
        if (!map) return;
        
        if (delivery || pickup) {
            const bounds = new window.google.maps.LatLngBounds();
            if (delivery) bounds.extend({ lat: delivery.lat, lng: delivery.lng });
            if (!useSame && pickup) bounds.extend({ lat: pickup.lat, lng: pickup.lng });
            
            if (!bounds.isEmpty()) {
                map.fitBounds(bounds);
            }
        } else {
            map.setCenter(currentLocation);
            map.setZoom(12);
        }
    }, [map, delivery, pickup, useSame, currentLocation]);

    // Handle map clicks
    const handleMapClick = useCallback(async (e) => {
        if (!map || !geocoder || !activeInput || !e.detail?.latLng) return;
        
        try {
            const { results } = await geocoder.geocode({ location: e.detail.latLng });
            
            if (results && results.length > 0) {
                const place = results[0];
                const selectedRegionName = activeInput === 'delivery' 
                    ? localStorage.getItem('deliveryRegion') || 'Greater Accra' 
                    : localStorage.getItem('pickupRegion') || 'Greater Accra';
                
                const regionData = REGION_CONFIG[selectedRegionName];
                let locality = place.address_components.find(comp =>
                    comp.types.includes('locality') || comp.types.includes('sublocality')
                )?.long_name.toLowerCase() || '';
                
                let area = regionData.availableAreas[regionData.defaultArea];
                for (const [areaKey, areaInfo] of Object.entries(regionData.availableAreas)) {
                    if (locality.includes(areaKey)) {
                        area = areaInfo;
                        break;
                    }
                }
                
                const locationInfo = {
                    address: place.formatted_address,
                    name: place.name || place.formatted_address || 'Selected Location',
                    region: selectedRegionName,
                    areaName: area.name,
                    cost: area.fee,
                    lat: e.detail.latLng.lat,
                    lng: e.detail.latLng.lng
                };
                
                if (activeInput === 'delivery') {
                    localStorage.setItem('deliveryLocation', JSON.stringify(locationInfo));
                    localStorage.setItem('deliveryInputValue', locationInfo.address);
                } else {
                    localStorage.setItem('pickupLocation', JSON.stringify(locationInfo));
                    localStorage.setItem('pickupInputValue', locationInfo.address);
                }
                
                window.dispatchEvent(new CustomEvent('mapLocationSelected', { 
                    detail: { location: locationInfo, type: activeInput } 
                }));
                
                map.panTo(e.detail.latLng);
                map.setZoom(16);
            }
        } catch (error) {
            console.error('Geocoding error:', error);
            toast.error('Could not determine address at this location. Please try searching instead.');
        }
    }, [map, geocoder, activeInput]);

    // Add click listener
    useEffect(() => {
        if (!map) return;
        
        const listener = map.addListener('click', handleMapClick);
        return () => {
            listener.remove();
        };
    }, [map, handleMapClick]);

    // Render markers as React components
    return (
        <>
            {delivery && (
                <AdvancedMarker
                    position={{ lat: delivery.lat, lng: delivery.lng }}
                    title="Delivery Location"
                >
                    <div style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        backgroundColor: '#3B82F6',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold',
                        fontSize: '12px',
                        border: '2px solid white',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }}>
                        D
                    </div>
                </AdvancedMarker>
            )}
            
            {!useSame && pickup && (
                <AdvancedMarker
                    position={{ lat: pickup.lat, lng: pickup.lng }}
                    title="Pickup Location"
                >
                    <div style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        backgroundColor: '#10B981',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold',
                        fontSize: '12px',
                        border: '2px solid white',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }}>
                        P
                    </div>
                </AdvancedMarker>
            )}
        </>
    );
};


// --- Main Checkout Component ---

const Checkout = () => {
    const { accessToken, refreshToken, setAccessToken, setRefreshToken, logout, api, user } = useContext(AuthContext);
    const { cart, clearCart } = useContext(CartContext);
    const navigate = useNavigate();
    
    // State for locations and inputs
    const [delivery, setDelivery] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('deliveryLocation'));
        } catch {
            return null;
        }
    });
    const [pickup, setPickup] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('pickupLocation'));
        } catch {
            return null;
        }
    });
    const [useSame, setUseSame] = useState(true);
    const [placing, setPlacing] = useState(false);
    const [activeInput, setActiveInput] = useState(null);
    const [deliveryInputValue, setDeliveryInputValue] = useState(() => localStorage.getItem('deliveryInputValue') || '');
    const [pickupInputValue, setPickupInputValue] = useState(() => localStorage.getItem('pickupInputValue') || '');
    const [currentLocation, setCurrentLocation] = useState(DEFAULT_CENTER);
    const [locationLoading, setLocationLoading] = useState(true);
    const [deliveryRegion, setDeliveryRegion] = useState(() => localStorage.getItem('deliveryRegion') || 'Greater Accra');
    const [pickupRegion, setPickupRegion] = useState(() => localStorage.getItem('pickupRegion') || 'Greater Accra');
    const [showAlert, setShowAlert] = useState(true);
    const [paymentView, setPaymentView] = useState(false);
    const [transactionReference, setTransactionReference] = useState(null);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [isPhoneValid, setIsPhoneValid] = useState(false);
    // Base URL for backend API
    const baseURL = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000';

    // Calculate order totals
    const subtotal = cart.reduce((sum, item) => sum + item.quantity * item.price, 0);
    const deliveryFee = delivery?.cost || 0;
    const pickupFee = useSame ? deliveryFee : pickup?.cost || 0;
    const total = subtotal + deliveryFee + pickupFee;

    // Ghana phone number validation
    const validateGhanaPhone = (number) => {
        const cleaned = number.replace(/\D/g, '');
        const ghanaRegex = /^(233|0)?(20|24|25|26|27|28|29|30|50|54|55|56|57|59)[0-9]{7}$/;
        return ghanaRegex.test(cleaned);
    };

    const handlePhoneChange = (e) => {
        let input = e.target.value;
        if (input.startsWith('0') && !input.startsWith('+233')) {
            input = '+233' + input.slice(1);
        }
        if (input.length <= 13) {
            setPhoneNumber(input);
            setIsPhoneValid(validateGhanaPhone(input));
        }
    };

    // Check user verification status
    useEffect(() => {
        if (!user || !user.email) return;

        if (!user.is_verified) {
            navigate(`/temp-verify-email/?email=${user.email}`);
            toast.warn('Please verify your email before proceeding to checkout.');
        }
    }, [user, navigate]);

    // Save delivery region to localStorage
    useEffect(() => {
        localStorage.setItem('deliveryRegion', deliveryRegion);
    }, [deliveryRegion]);

    // Save pickup region to localStorage
    useEffect(() => {
        localStorage.setItem('pickupRegion', pickupRegion);
    }, [pickupRegion]);

    // Sync pickup location when useSame is true
    useEffect(() => {
        if (useSame && delivery) {
            setPickup({ ...delivery, region: deliveryRegion });
            setPickupInputValue(delivery.address);
            localStorage.setItem('pickupLocation', JSON.stringify({ ...delivery, region: deliveryRegion }));
            localStorage.setItem('pickupInputValue', delivery.address);
        } else if (useSame && !delivery) {
            setPickup(null);
            setPickupInputValue('');
            localStorage.removeItem('pickupLocation');
            localStorage.removeItem('pickupInputValue');
        }
    }, [useSame, delivery, deliveryRegion]);

    // Show alert only once
    useEffect(() => {
        const hasSeenAlert = localStorage.getItem('hasSeenCheckoutAlert');
        if (!hasSeenAlert) {
            setShowAlert(true);
            localStorage.setItem('hasSeenCheckoutAlert', 'true');
        }
    }, []);

    // Detect user location
    useEffect(() => {
        const detectUserLocation = () => {
            if (!navigator.geolocation) {
                setLocationLoading(false);
                toast.info("Geolocation not supported, using default location (Accra).");
                return;
            }
            setLocationLoading(true);
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setCurrentLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });
                    setLocationLoading(false);
                },
                (error) => {
                    console.error("Geolocation error:", error);
                    setLocationLoading(false);
                    toast.info("Failed to detect location, using default (Accra).");
                },
                { timeout: 5000 }
            );
        };
        detectUserLocation();
    }, []);

    // Handle place selection from map
    const handlePlaceSelect = useCallback((location, type) => {
        if (type === 'delivery') {
            setDelivery(location);
            setDeliveryInputValue(location ? location.address : '');
            localStorage.setItem('deliveryLocation', JSON.stringify(location));
            localStorage.setItem('deliveryInputValue', location ? location.address : '');
            if (useSame && location) {
                setPickup({ ...location, region: deliveryRegion });
                setPickupInputValue(location.address);
                localStorage.setItem('pickupLocation', JSON.stringify({ ...location, region: deliveryRegion }));
                localStorage.setItem('pickupInputValue', location.address);
            } else if (useSame && !location) {
                setPickup(null);
                setPickupInputValue('');
                localStorage.removeItem('pickupLocation');
                localStorage.removeItem('pickupInputValue');
            }
        } else {
            setPickup(location);
            setPickupInputValue(location ? location.address : '');
            localStorage.setItem('pickupLocation', JSON.stringify(location));
            localStorage.setItem('pickupInputValue', location ? location.address : '');
        }
        setActiveInput(null);
        if (location) {
            toast.success(
                <div className="flex items-center">
                    <FiCheck className="mr-2" />
                    {type} location set to {location.areaName}, {location.region}
                </div>
            );
        } else {
            toast.info(`${type} location cleared.`);
        }
    }, [useSame, deliveryRegion]);

    // Event listener for map location selection
    useEffect(() => {
        const listener = (event) => {
            const { location, type } = event.detail;
            handlePlaceSelect(location, type);
        };
        window.addEventListener('mapLocationSelected', listener);
        return () => {
            window.removeEventListener('mapLocationSelected', listener);
        };
    }, [handlePlaceSelect]);

    // Handle use current location
    const handleUseCurrentLocation = async () => {
        if (!navigator.geolocation) {
            toast.error("Geolocation not supported by your browser");
            return;
        }
        setLocationLoading(true);
        try {
            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
            });
            const userLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
            const geocoder = new window.google.maps.Geocoder();
            const { results } = await new Promise((resolve, reject) => {
                geocoder.geocode({ location: userLocation }, (results, status) => {
                    if (status === 'OK' && results && results.length > 0) {
                        resolve({ results });
                    } else {
                        reject(new Error(status));
                    }
                });
            });
            const place = results[0];
            let detectedRegion = deliveryRegion;
            const administrativeAreaLevel1 = place.address_components.find(comp =>
                comp.types.includes('administrative_area_level_1')
            )?.long_name;
            if (administrativeAreaLevel1) {
                const matchedRegion = AVAILABLE_REGIONS.find(r => administrativeAreaLevel1.includes(r));
                if (matchedRegion) {
                    detectedRegion = matchedRegion;
                    setDeliveryRegion(detectedRegion);
                }
            }
            const regionData = REGION_CONFIG[detectedRegion];
            let locality = place.address_components.find(comp =>
                comp.types.includes('locality') || comp.types.includes('sublocality')
            )?.long_name.toLowerCase() || '';
            let area = regionData.availableAreas[regionData.defaultArea];
            for (const [areaKey, areaInfo] of Object.entries(regionData.availableAreas)) {
                if (locality.includes(areaKey)) {
                    area = areaInfo;
                    break;
                }
            }
            const locationInfo = {
                address: place.formatted_address,
                name: 'Your Current Location',
                region: detectedRegion,
                areaName: area.name,
                cost: area.fee,
                lat: userLocation.lat,
                lng: userLocation.lng
            };
            handlePlaceSelect(locationInfo, 'delivery');
        } catch (error) {
            console.error("Error getting current location:", error);
            toast.error("Could not get current location. Please try searching instead.");
        } finally {
            setLocationLoading(false);
        }
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!delivery) {
            toast.error('Please select a delivery location');
            return;
        }
        if (!pickup && !useSame) {
            toast.error('Please select a pickup location');
            return;
        }
        if (cart.length === 0) {
            toast.error('Your cart is empty');
            return;
        }
        if (!isPhoneValid) {
            toast.error('Please enter a valid Ghana phone number');
            return;
        }
        setPaymentView(true);
        setShowAlert(false);
    };

    // Handle payment with Paystack
    const handlePayment = async () => {
        if (placing) return;

        try {
            setPlacing(true);
            
            // First check token validity
            try {
                if (!refreshToken) throw new Error('No refresh token');
                
                // Decode the refresh token to check expiration
                const decoded = jwtDecode(refreshToken);
                const currentTime = Date.now() / 1000;
                const timeLeft = decoded.exp - currentTime;
                
                // If token expires in less than 30 seconds or already expired
                if (timeLeft < 60) {
                    // Attempt to refresh tokens
                    const response = await axios.post(`${baseURL}/api/token/refresh/`, {
                        refresh: refreshToken
                    }, {
                        headers: { 'Content-Type': 'application/json' }
                    });
                    
                    // Update both context and localStorage
                    const newAccessToken = response.data.access;
                    const newRefreshToken = response.data.refresh || refreshToken;
                    
                    setAccessToken(newAccessToken);
                    localStorage.setItem('access_token', newAccessToken);
                    
                    if (response.data.refresh) {
                        setRefreshToken(newRefreshToken);
                        localStorage.setItem('refresh_token', newRefreshToken);
                    }
                }
            } catch (tokenError) {
                console.error('Token refresh error:', tokenError);
                // Properly logout using AuthContext
                logout();
                toast.error('Session expired. Please login again to complete your order.');
                navigate('/login?continuePath=/checkout');
                setPlacing(false);
                return;
            }

            // Proceed with payment after token validation
            const transactionRef = `order_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
            setTransactionReference(transactionRef);

            const handler = new Paystack();
            handler.newTransaction({
                key: PAYSTACK_PUBLIC_KEY,
                email: user.email,
                amount: total * 100,
                currency: 'GHS',
                reference: transactionRef,

                onSuccess: async (transaction) => {
                    try {
                        const beforeUnloadHandler = (e) => {
                            e.preventDefault();
                            e.returnValue = 'Your order is being processed. Please wait...';
                            return e.returnValue;
                        };
                        window.addEventListener('beforeunload', beforeUnloadHandler);

                        let retries = 3;
                        let success = false;
                        let lastError = null;

                        while (retries > 0 && !success) {
                            try {
                                const response = await api.post('/api/orders/create/', {
                                    user_id: user.id,
                                    delivery_location: delivery,
                                    pickup_location: useSame ? delivery : pickup,
                                    total_amount: total,
                                    cart_items: cart,
                                    delivery_cost: deliveryFee,
                                    pickup_cost: useSame ? deliveryFee : pickupFee,
                                    sub_total: subtotal,
                                    transaction_id: transaction.reference,
                                    phone_number: phoneNumber
                                });

                                success = true;
                                // ... success handling
                                success = true;
                                clearCart();
                                ['deliveryLocation', 'pickupLocation', 'deliveryInputValue', 
                                'pickupInputValue', 'deliveryRegion', 'pickupRegion'].forEach(key => {
                                    localStorage.removeItem(key);
                                });

                                setDelivery(null);
                                setPickup(null);
                                setDeliveryInputValue('');
                                setPickupInputValue('');
                                setDeliveryRegion('');
                                setPickupRegion('');
                                setUseSame(true);

                                window.removeEventListener('beforeunload', beforeUnloadHandler);
                                navigate(`/orders/${response.data.order_slug}`);
                                toast.success('Order placed successfully! Thank you for your purchase.');
                            } catch (error) {
                                lastError = error;
                                retries--;
                                
                                // If unauthorized, try refreshing token once
                                if (error.response?.status === 401 && retries > 0) {
                                    try {
                                        const refreshResponse = await axios.post(`${api.defaults.baseURL}/api/token/refresh/`, {
                                            refresh: localStorage.getItem('refresh_token')
                                        }, {
                                            headers: { 'Content-Type': 'application/json' }
                                        });

                                        const newAccessToken = refreshResponse.data.access;
                                        const newRefreshToken = refreshResponse.data.refresh || refreshToken;
                                        
                                        // Update context and localStorage
                                        setAccessToken(newAccessToken);
                                        localStorage.setItem('access_token', newAccessToken);
                                        
                                        if (refreshResponse.data.refresh) {
                                            setRefreshToken(newRefreshToken);
                                            localStorage.setItem('refresh_token', newRefreshToken);
                                        }
                                    } catch (refreshError) {
                                        // If refresh fails, logout and break the retry loop
                                        logout();
                                        retries = 0;
                                        throw refreshError;
                                    }
                                } else if (retries > 0) {
                                    await new Promise(resolve => 
                                        setTimeout(resolve, 1000 * (4 - retries))
                                    );
                                }
                            }
                        }

                        if (!success) {
                            throw lastError || new Error('Failed to create order after retries');
                        }
                    } catch (error) {
                        console.error('Error placing order:', error);
                        // ... error handling
                        const failedOrder = {
                            user_id: user.id,
                            delivery_location: delivery,
                            pickup_location: useSame ? delivery : pickup,
                            total_amount: total,
                            cart_items: cart,
                            transaction_id: transaction.reference,
                            phone_number: phoneNumber,
                            error: error.message
                        };
                        localStorage.setItem('failedOrder', JSON.stringify(failedOrder));
                        
                        if (error.response?.status === 401) {
                            toast.error('Session expired. Please login again to complete your order.');
                            logout();
                            navigate('/login?returnUrl=/checkout');
                        } else {
                            // ... other error handling
                            toast.error('Failed to place order. Please check your orders page or contact support.');
                            navigate('/orders/failed');
                        }
                    } finally {
                        setPlacing(false);
                    }
                },
                // ... other Paystack handlers
                onCancel: () => {
                    setPlacing(false);
                    toast.info('Payment cancelled. Your order was not placed.');
                },
                onError: (error) => {
                    setPlacing(false);
                    console.error('Payment error:', error);
                    toast.error('Payment failed. Please try again.');
                }
            });
        } catch (error) {
            setPlacing(false);
            console.error('Error initializing payment:', error);
            toast.error('Error initializing payment. Please try again.');
        }
    };

    // Load Paystack script
    useEffect(() => {
        const script = document.createElement('script');
        script.src = "https://js.paystack.co/v2/inline.js";
        script.async = true;
        document.body.appendChild(script);
        return () => {
            document.body.removeChild(script);
        };
    }, []);

    return (
        <APIProvider
            apiKey={Maps_API_KEY}
            libraries={['places', 'geocoding']}
            onLoad={() => console.log('Google Maps API loaded successfully!')}
        >
            <div className="max-w-5xl mx-auto px-4 py-8 mt-[4rem]">
                {showAlert && (
                    <div className="mb-6 p-4 bg-yellow-100 border-l-4 border-yellow-500 rounded-lg flex items-center">
                        <FiInfo className="mr-2 text-yellow-700" />
                        <p className="text-sm text-yellow-700">
                            Current options for delivery and pickup are Accra, Tema, Kasoa.
                            <button
                                onClick={() => setShowAlert(false)}
                                className="ml-4 text-yellow-700 hover:text-yellow-900 underline"
                            >
                                Dismiss
                            </button>
                        </p>
                    </div>
                )}

                {!paymentView ? (
                    <>
                        <div className="mb-8">
                            <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
                            <p className="text-gray-600 mt-2">Review your order and provide delivery details</p>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                    <h2 className="text-xl font-semibold mb-4 flex items-center">
                                        <FiTruck className="mr-2 text-primary" />
                                        Delivery Information
                                    </h2>
                                    <div className="space-y-4">
                                        <div>
                                            <div className="flex justify-between items-center mb-1">
                                                <label className="block text-sm font-medium text-gray-700">
                                                    Delivery Location
                                                </label>
                                                <button
                                                    onClick={handleUseCurrentLocation}
                                                    disabled={locationLoading}
                                                    className="flex items-center text-sm text-blue-600 hover:text-blue-800 disabled:text-gray-400"
                                                >
                                                    <FiNavigation className="mr-1" />
                                                    {locationLoading ? 'Detecting...' : 'Use Current Location'}
                                                </button>
                                            </div>
                                            <PlaceAutocompleteElementWrapper
                                                key={`delivery-${paymentView}`}
                                                onPlaceSelect={(loc) => handlePlaceSelect(loc, 'delivery')}
                                                currentInputValue={deliveryInputValue}
                                                initialLocation={delivery}
                                                placeholder="Search delivery address"
                                                type="delivery"
                                                region={deliveryRegion}
                                                onFocus={() => setActiveInput('delivery')}
                                            />
                                        </div>
                                        <div className="flex items-center">
                                            <input
                                                type="checkbox"
                                                id="same"
                                                checked={useSame}
                                                onChange={(e) => setUseSame(e.target.checked)}
                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                            />
                                            <label htmlFor="same" className="ml-2 block text-sm text-gray-700">
                                                Use delivery address for pickup
                                            </label>
                                        </div>
                                        {!useSame && (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Pickup Location
                                                </label>
                                                <PlaceAutocompleteElementWrapper
                                                    key={`pickup-${paymentView}`}
                                                    onPlaceSelect={(loc) => handlePlaceSelect(loc, 'pickup')}
                                                    currentInputValue={pickupInputValue}
                                                    initialLocation={pickup}
                                                    placeholder="Search pickup address"
                                                    type="pickup"
                                                    region={pickupRegion}
                                                    onFocus={() => setActiveInput('pickup')}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                    <h2 className="text-xl font-semibold mb-4 flex items-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-primary" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                                        </svg>
                                        Contact Details
                                    </h2>
                                    <div className="space-y-4">
                                        <div>
                                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                                Email
                                            </label>
                                            <input
                                                type="email"
                                                id="email"
                                                value={user?.email || ''}
                                                disabled
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary disabled:bg-gray-100 disabled:text-gray-500 cursor-not-allowed"
                                            />
                                        </div>
                                        
                                        <div>
                                            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                                                Phone Number (Ghana)
                                            </label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                                    <span className="text-gray-500">🇬🇭 +233</span>
                                                </div>
                                                <input
                                                    type="tel"
                                                    id="phone"
                                                    value={phoneNumber}
                                                    onChange={handlePhoneChange}
                                                    placeholder="24 123 4567"
                                                    className="pl-20 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                                                    maxLength={13}
                                                />
                                                {phoneNumber && (
                                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                                                        {isPhoneValid ? (
                                                            <FaCheckCircle className="text-green-500" />
                                                        ) : (
                                                            <FaTimesCircle className="text-red-500" />
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                            {phoneNumber && !isPhoneValid && (
                                                <p className="mt-1 text-sm text-red-600">
                                                    Please enter a valid Ghana phone number (e.g., +233 24 123 4567 or 024 123 4567)
                                                </p>
                                            )}
                                            <p className="mt-1 text-xs text-gray-500">
                                                Format: +233 XX XXX XXXX or 0XX XXX XXXX
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="relative">
                                    <Map
                                        mapId={"YOUR_MAP_ID"}
                                        defaultZoom={delivery || pickup ? 16 : 12}
                                        defaultCenter={currentLocation}
                                        gestureHandling={'greedy'}
                                        disableDefaultUI={false}
                                        style={MAP_CONTAINER_STYLE}
                                    >
                                        <MapHandler
                                            delivery={delivery}
                                            pickup={pickup}
                                            useSame={useSame}
                                            currentLocation={currentLocation}
                                            activeInput={activeInput}
                                        />
                                    </Map>
                                </div>

                                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                    <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
                                    <div className="space-y-3">
                                        {cart.map((item) => (
                                            <div key={item.service_id} className={`flex justify-between py-2 border-gray-200 ${item === cart[cart.length - 1] ? '' : 'border-b'}`}>
                                                <div>
                                                    <p className="font-medium">{item.service_name}</p>
                                                    <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                                                </div>
                                                <p className="font-medium">GHS {(item.quantity * item.price).toFixed(2)}</p>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-6 space-y-2 pt-4 border-t border-gray-200">
                                        <div className="flex justify-between">
                                            <p className="text-gray-600">Subtotal</p>
                                            <p className="font-medium">GHS {subtotal.toFixed(2)}</p>
                                        </div>
                                        <div className="flex justify-between">
                                            <p className="text-gray-600">Delivery Fee</p>
                                            <p className="font-medium">
                                                {delivery ? `GHS ${delivery.cost.toFixed(2)}` : '--'}
                                            </p>
                                        </div>
                                        <div className="flex justify-between">
                                            <p className="text-gray-600">Pickup Fee</p>
                                            <p className="font-medium">
                                                {useSame ? (delivery ? `GHS ${delivery.cost.toFixed(2)}` : '--') : (pickup ? `GHS ${pickup.cost.toFixed(2)}` : '--')}
                                            </p>
                                        </div>
                                        <div className="flex justify-between pt-4 mt-2 border-t border-gray-200">
                                            <p className="text-lg font-semibold">Total</p>
                                            <p className="text-lg font-semibold text-blue-600">
                                                GHS {total.toFixed(2)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={handleSubmit}
                                    disabled={placing || cart.length === 0 || !delivery || (!useSame && !pickup) || !isPhoneValid}
                                    className={`w-full py-3 px-4 rounded-lg cursor-pointer font-medium text-white transition-colors ${
                                        placing || cart.length === 0 || !delivery || (!useSame && !pickup) || !isPhoneValid
                                            ? 'bg-gray-400 cursor-not-allowed'
                                            : 'bg-primary hover:bg-primary/80'
                                    }`}
                                >
                                    {placing ? (
                                        <span className="flex items-center justify-center">
                                            <FaSpinner className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
                                            Continuing...
                                        </span>
                                    ) : (
                                        'Continue to Payment'
                                    )}
                                </button>
                                {cart.length === 0 && (
                                    <div className="p-4 bg-yellow-50 rounded-lg text-yellow-800 text-sm">
                                        Your cart is empty. Add items to proceed with checkout.
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="bg-white lg:p-8 p-4 rounded-2xl shadow-2xl border border-gray-100 max-w-md mx-auto">
                        <div className="relative mb-8 overflow-hidden rounded-xl bg-gradient-to-r from-green-500 to-primary/80 p-6 text-white">
                            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10"></div>
                            <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-white/10"></div>
                            
                            <div className="relative z-10 flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl font-bold">Complete Payment</h2>
                                    <p className="text-white/80">Secure transaction powered by Paystack</p>
                                </div>
                                <div className="flex space-x-2">
                                    <div className="h-10 w-16 rounded-md bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                        <span className="text-xs font-bold">PAYSTACK</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 mb-8 backdrop-blur-sm bg-white/50 p-6 rounded-xl border border-gray-100 shadow-sm">
                            <div className="flex justify-between py-3 border-b border-gray-100/50">
                                <div className="flex items-center text-gray-600">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                                        <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                                    </svg>
                                    Subtotal
                                </div>
                                <span className="font-medium">GHS {subtotal.toFixed(2)}</span>
                            </div>
                            
                            <div className="flex justify-between py-3 border-b border-gray-100/50">
                                <div className="flex items-center text-gray-600">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                                        <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1v-1a1 1 0 011-1h2a1 1 0 011 1v1a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H19a1 1 0 001-1V5a1 1 0 00-1-1H3z" />
                                    </svg>
                                    Delivery Fee
                                </div>
                                <span className="font-medium">GHS {delivery ? delivery.cost.toFixed(2) : '0.00'}</span>
                            </div>
                            
                            <div className="flex justify-between py-3">
                                <div className="flex items-center text-gray-600">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                    </svg>
                                    Pickup Fee
                                </div>
                                <span className="font-medium">
                                    {useSame ? (delivery ? `GHS ${delivery.cost.toFixed(2)}` : '0.00') : (pickup ? `GHS ${pickup.cost.toFixed(2)}` : '0.00')}
                                </span>
                            </div>

                            <div className="flex justify-between py-3 pt-4">
                                <div className="flex items-center text-lg font-semibold text-gray-800">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-primary" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                    </svg>
                                    Total Amount
                                </div>
                                <span className="text-xl font-bold bg-gradient-to-r from-green-500 to-primary/80 bg-clip-text text-transparent">GHS {total.toFixed(2)}</span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <button
                                onClick={handlePayment}
                                disabled={placing}
                                className={`w-full py-4 px-6 rounded-xl font-semibold text-white cursor-pointer transition-all duration-300 flex items-center justify-center relative overflow-hidden group ${
                                    placing 
                                        ? 'bg-gray-300 cursor-not-allowed' 
                                        : 'bg-gradient-to-r from-green-500 to-primary/80 hover:from-green-700 hover:to-primary shadow-lg hover:shadow-xl'
                                }`}
                            >
                                {placing ? (
                                    <>
                                        <FaSpinner className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                                        Processing Payment...
                                    </>
                                ) : (
                                    <>
                                        <span className="relative z-10 flex items-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3 text-white/90" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                            </svg>
                                            Pay Now
                                        </span>
                                        <span className="absolute inset-0 bg-white/10 group-hover:bg-white/5 transition-all duration-500 transform group-hover:scale-110"></span>
                                    </>
                                )}
                            </button>

                            <button
                                onClick={() => {
                                    setPaymentView(false)
                                    setShowAlert(true)
                                }}
                                className="w-full py-3 px-6 rounded-xl font-medium text-gray-700 hover:text-gray-900 bg-white border border-gray-200 hover:border-gray-300 transition-all duration-300 flex items-center justify-center hover:shadow-sm group cursor-pointer"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-500 group-hover:text-gray-700 transition-colors" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                                </svg>
                                Back to Checkout
                            </button>
                        </div>

                        <div className="mt-8 border-t border-gray-100/50 flex flex-col items-center justify-center">
                            <div className="flex items-center">
                                <div className="relative">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500 animate-pulse" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                    </svg>
                                    <div className="absolute inset-0 rounded-full bg-green-500/20 animate-ping"></div>
                                </div>
                                <span className="ml-2 text-sm font-medium text-gray-700">Payment Secured</span>
                            </div>
                        </div>

                        <p className="text-xs text-gray-500 text-center mt-2">
                            Your payment is being processed. Please do not refresh the page.
                        </p>
                    </div>
                )}
            </div>
        </APIProvider>
    );
};

export default Checkout;