import { useMap, useMapsLibrary, AdvancedMarker } from '@vis.gl/react-google-maps';
import { useEffect, useCallback } from 'react';
import REGION_CONFIG from '../utils/regionConfig'



const MapHandler = ({ delivery, pickup, useSame, currentLocation, activeInput }) => {
    const map = useMap();
    const geocoder = useMapsLibrary('geocoding');
    // const deliveryMarkerRef = useRef(null);
    // const pickupMarkerRef = useRef(null);

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

export default MapHandler