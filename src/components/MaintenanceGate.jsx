// src/components/MaintenanceGate.jsx
import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchSiteStatus, MAINTENANCE_EVENT } from '../api';
import MaintenancePage from '../pages/Maintenance';

const POLL_MS = 60000;            // while operational
const POLL_MAINTENANCE_MS = 20000; // while under maintenance, to come back quickly

// Shows the maintenance page instead of the app while the backend is under
// maintenance, and reloads the app when it is operational again. Staff see the
// app with a banner so they can check things before switching back.
const MaintenanceGate = ({ children }) => {
  const [site, setSite] = useState(null);
  const wasDown = useRef(false);

  const check = useCallback(async () => {
    try {
      setSite(await fetchSiteStatus());
    } catch {
      // Status unknown (offline, server unreachable): leave the app as it is.
    }
  }, []);

  const down = site?.status === 'maintenance';

  // Back from maintenance: reload so every page refetches its data.
  useEffect(() => {
    if (down) wasDown.current = true;
    else if (site && wasDown.current) window.location.reload();
  }, [down, site]);

  useEffect(() => {
    check();
    // Any API call that gets the maintenance 503 flips the gate at once.
    const onMaintenance = () => check();
    const onVisible = () => document.visibilityState === 'visible' && check();
    window.addEventListener(MAINTENANCE_EVENT, onMaintenance);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.removeEventListener(MAINTENANCE_EVENT, onMaintenance);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [check]);

  useEffect(() => {
    const timer = setInterval(check, down ? POLL_MAINTENANCE_MS : POLL_MS);
    return () => clearInterval(timer);
  }, [check, down]);

  if (down && !site.staff_access) {
    return <MaintenancePage message={site.message} expectedBackAt={site.expected_back_at} onRetry={check} />;
  }

  return (
    <>
      {down && (
        <div className="bg-amber-100 text-amber-900 text-sm text-center px-4 py-2 border-b border-amber-200">
          Maintenance mode is on. Customers see the maintenance page; you can still use the site as staff.
        </div>
      )}
      {children}
    </>
  );
};

export default MaintenanceGate;
