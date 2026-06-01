// components/GoogleMapsProvider.jsx
import { APIProvider } from '@vis.gl/react-google-maps';
import { useEffect, useRef } from 'react';

const Maps_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

// Track if API is already loaded
let googleMapsLoaded = false;

export const GoogleMapsProvider = ({ children, onLoad }) => {
  const initialized = useRef(false);

  useEffect(() => {
    // Prevent multiple initializations
    if (initialized.current) return;
    initialized.current = true;
    
    // Check if Google Maps is already loaded
    if (window.google && window.google.maps) {
      googleMapsLoaded = true;
      if (onLoad) onLoad();
      return;
    }
    
    // Listen for the API load event
    const checkGoogleMaps = setInterval(() => {
      if (window.google && window.google.maps) {
        googleMapsLoaded = true;
        clearInterval(checkGoogleMaps);
        if (onLoad) onLoad();
      }
    }, 100);
    
    // Cleanup after 10 seconds
    setTimeout(() => clearInterval(checkGoogleMaps), 10000);
    
    return () => clearInterval(checkGoogleMaps);
  }, [onLoad]);

  // Only render APIProvider if it's the first instance
  if (!googleMapsLoaded && !window.google?.maps) {
    return (
      <APIProvider 
        apiKey={Maps_API_KEY}
        libraries={['places', 'geocoding']}
        onLoad={onLoad}
      >
        {children}
      </APIProvider>
    );
  }

  // If API is already loaded, just render children without APIProvider
  return <>{children}</>;
};