// ScrollToTop.jsx
// New page: start at the top. Link with a hash (e.g. "/#services" from the navbar):
// scroll to that section once it has rendered, from any page.
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function ScrollToTop() {
  // `key` changes on every navigation, so clicking "/#services" again (after
  // scrolling away) scrolls back to it even though the address is the same.
  const { pathname, hash, key } = useLocation();

  useEffect(() => {
    if (!hash) {
      window.scrollTo(0, 0);
      return;
    }
    const id = decodeURIComponent(hash.slice(1));
    let tries = 0;
    const timer = setInterval(() => {
      const el = document.getElementById(id);
      if (el || ++tries > 20) {
        clearInterval(timer);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 50);
    return () => clearInterval(timer);
  }, [pathname, hash, key]);

  return null;
}
