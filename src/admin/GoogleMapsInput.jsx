import React, { useEffect, useRef } from 'react';

const GoogleMapsInput = ({ id, label, value, onChange, isRequired, onError }) => {
    const inputRef = useRef(null);

    useEffect(() => {
        if (!window.google || !window.google.maps || !window.google.maps.places) {
            console.warn('Google Maps or Places library not ready.');
            return; 
        }
        
        const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
            componentRestrictions: { country: ["GH"] },
        });

        autocomplete.addListener('place_changed', () => {
            const place = autocomplete.getPlace();
            
            if (!place.geometry) {
                onError(id, `No geometry found for ${label}. Please select a street address.`);
                return;
            }
            
            const placeData = {
                raw_address: place.formatted_address,
                place_id: place.place_id,
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng(),
            };
            
            onChange(id, placeData);
        });
    }, [id, label, onChange, onError]);

    return (
        <div>
            <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-2">
                {label}{isRequired && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
                ref={inputRef}
                type="text"
                id={id}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={value}
                onChange={(e) => onChange(id, { raw_address: e.target.value })}
                required={isRequired}
            />
        </div>
    );
};

export default GoogleMapsInput;