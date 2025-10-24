import { useState, useEffect, useCallback } from 'react';

// Helper function to safely get JSON from storage
const getLocationFromStorage = (key) => {
    const item = localStorage.getItem(key);
    try {
        return item ? JSON.parse(item) : null;
    } catch (e) {
        console.error(`Error parsing ${key} from storage:`, e);
        return null;
    }
};

export const useCheckoutState = () => {
    // 1. STATE DEFINITIONS (Moved from CheckoutPage)
    const [delivery, setDelivery] = useState(() => getLocationFromStorage('deliveryLocation'));
    const [pickup, setPickup] = useState(() => getLocationFromStorage('pickupLocation'));
    const [useSame, setUseSame] = useState(true);
    const [deliveryInputValue, setDeliveryInputValue] = useState(() => localStorage.getItem('deliveryInputValue') || '');
    const [pickupInputValue, setPickupInputValue] = useState(() => localStorage.getItem('pickupInputValue') || '');
    const [deliveryRegion, setDeliveryRegion] = useState(() => localStorage.getItem('deliveryRegion') || 'Greater Accra');
    const [pickupRegion, setPickupRegion] = useState(() => localStorage.getItem('pickupRegion') || 'Greater Accra');

    // 2. Local Storage Sync (Keep this logic wherever it is, often in the same hook/context)
    useEffect(() => {
        // Example sync logic (you probably have more of this)
        if (delivery) {
            localStorage.setItem('deliveryLocation', JSON.stringify(delivery));
        } else {
            localStorage.removeItem('deliveryLocation');
        }
        localStorage.setItem('deliveryInputValue', deliveryInputValue);
        // ... and so on for all variables ...
    }, [delivery, deliveryInputValue, pickup, pickupInputValue, deliveryRegion, pickupRegion]);


    // 3. THE CRUCIAL CLEANUP FUNCTION
    const resetCheckoutState = useCallback(() => {
        // Reset React State
        setDelivery(null);
        setPickup(null);
        setUseSame(true);
        setDeliveryInputValue('');
        setPickupInputValue('');
        setDeliveryRegion(null);
        setPickupRegion(null);
     

        // Clear Local Storage (MUST be done explicitly)
        ['deliveryLocation', 'pickupLocation', 'deliveryInputValue', 'pickupInputValue', 'deliveryRegion', 'pickupRegion', 'failedOrder'].forEach(key => {
            localStorage.removeItem(key);
        });
    }, []);

    // 4. Return all state and actions
    return {
        delivery, setDelivery,
        pickup, setPickup,
        useSame, setUseSame,
        deliveryInputValue, setDeliveryInputValue,
        pickupInputValue, setPickupInputValue,
        deliveryRegion, setDeliveryRegion,
        pickupRegion, setPickupRegion,
        resetCheckoutState, // <-- Export the cleanup function
        // Add other state variables if applicable (like appliedPromotion)
    };
};
