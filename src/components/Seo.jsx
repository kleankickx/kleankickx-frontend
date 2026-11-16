import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { PAGES, DEFAULT_META, canonicalFor } from '../seo/site';

// Keeps <head> in step with the current route after the app loads. The first
// paint already has the right tags: the build writes them into each page's HTML.
const setMeta = (attr, key, value) => {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', value);
};

const Seo = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    const path = pathname.length > 1 ? pathname.replace(/\/+$/, '') : '/';
    const page = PAGES[path];
    const meta = page || DEFAULT_META;

    document.title = meta.title;
    setMeta('name', 'description', meta.description);
    setMeta('property', 'og:title', meta.title);
    setMeta('property', 'og:description', meta.description);
    setMeta('name', 'robots', page ? 'index,follow' : 'noindex,follow');

    let link = document.head.querySelector('link[rel="canonical"]');
    if (page) {
      if (!link) {
        link = document.createElement('link');
        link.rel = 'canonical';
        document.head.appendChild(link);
      }
      link.href = canonicalFor(path);
      setMeta('property', 'og:url', canonicalFor(path));
    } else if (link) {
      link.remove();
    }
  }, [pathname]);

  return null;
};

export default Seo;
