import { useEffect } from 'react';

const GoogleMapsLoader = () => {
  useEffect(() => {
    const loadGoogleMaps = () => {
      // Check if already loaded
      if (window.google) {
        return;
      }

      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      
      if (!apiKey) {
        console.error('Google Maps API key not found');
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.id = 'google-maps-script';
      
      document.head.appendChild(script);

      script.onload = () => {
        console.log('Google Maps loaded successfully');
      };

      script.onerror = () => {
        console.error('Failed to load Google Maps');
      };
    };

    loadGoogleMaps();
  }, []);

  return null; // This component doesn't render anything
};

export default GoogleMapsLoader;