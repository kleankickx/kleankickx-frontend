// Single source of truth for SEO: page titles, descriptions, structured data and the
// static HTML that crawlers see before JavaScript runs. Used in two places:
//   1. vite.config.js (build time) writes a real HTML file for each public route
//   2. src/components/Seo.jsx (runtime) keeps <head> correct as people navigate
// Prices here must match the services in the admin. Change them in both places.

export const SITE_URL = 'https://kleankickx.com';
export const SITE_NAME = 'KleanKickx';
export const OG_IMAGE = `${SITE_URL}/images/before-after.jpg`;

export const BUSINESS = {
  name: 'KleanKickx',
  legalName: 'KleanKickx Sneaker Care Limited',
  street: '29 Golf Hills St',
  city: 'Accra',
  region: 'Greater Accra',
  country: 'GH',
  phone: '+233536278834',
  phoneDisplay: '+233 53 627 8834',
  email: 'info@kleankickx.com',
  instagram: 'https://instagram.com/kleankickxgh',
  x: 'https://x.com/KleanKickxgh',
};

export const AREAS = ['East Legon', 'Osu', 'Cantonments', 'Airport Residential', 'Labone', 'Spintex', 'Tema'];

export const SERVICES = [
  { name: 'Standard Klean', price: 50, unit: 'pair', desc: 'Thorough clean of the whole shoe. Back in about 72 hours.' },
  { name: 'Priority Klean', price: 70, unit: 'pair', desc: 'The Standard Klean, back the next day.' },
  { name: 'Deep Klean', price: 80, unit: 'pair', desc: 'For stubborn stains and embedded dirt. Back in about 72 hours.' },
];
export const BUNDLES = [
  { name: 'Triple Threat', price: 130, pairs: 3 },
  { name: 'Clean Krew', price: 210, pairs: 5 },
  { name: 'Sneakers Squad', price: 410, pairs: 10 },
];

export const FAQ = [
  ['How much does sneaker cleaning cost in Accra?', 'A Standard Klean is ₵50 a pair, Priority Klean (next day) is ₵70 and Deep Klean is ₵80. Bundles: 3 pairs for ₵130, 5 pairs for ₵210, 10 pairs for ₵410. Your first Standard Klean is free when you sign up.'],
  ['Do you pick up and deliver?', `Yes. We pick up and deliver across Accra, including ${AREAS.join(', ')}. Delivery fees apply. You can also drop off at the studio on 29 Golf Hills St.`],
  ['How long does a Klean take?', 'Standard and Deep Klean take about 72 hours. Priority Klean comes back the next day.'],
  ['How do I pay?', 'Add your services to the cart and pay by Mobile Money or card through Paystack.'],
];

const offer = (name, price, description) => ({
  '@type': 'Offer', name, price: String(price), priceCurrency: 'GHS', description,
  itemOffered: { '@type': 'Service', name, serviceType: 'Sneaker cleaning' },
});

export const businessSchema = {
  '@context': 'https://schema.org',
  '@type': ['LocalBusiness', 'DryCleaningOrLaundry'],
  '@id': `${SITE_URL}/#business`,
  name: BUSINESS.name,
  legalName: BUSINESS.legalName,
  url: `${SITE_URL}/`,
  image: OG_IMAGE,
  telephone: BUSINESS.phone,
  email: BUSINESS.email,
  foundingDate: '2020',
  priceRange: '₵50–₵410',
  currenciesAccepted: 'GHS',
  paymentAccepted: 'Mobile Money, Card',
  address: { '@type': 'PostalAddress', streetAddress: BUSINESS.street, addressLocality: BUSINESS.city, addressRegion: BUSINESS.region, addressCountry: BUSINESS.country },
  areaServed: [...AREAS.map((a) => ({ '@type': 'Place', name: `${a}, Accra` })), { '@type': 'City', name: 'Accra' }],
  sameAs: [BUSINESS.instagram, BUSINESS.x],
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'Sneaker cleaning and restoration',
    itemListElement: [
      ...SERVICES.map((s) => offer(s.name, s.price, s.desc)),
      ...BUNDLES.map((b) => offer(b.name, b.price, `Standard Klean for ${b.pairs} pairs.`)),
      offer('Free first Standard Klean', 0, 'One free Standard Klean when you sign up.'),
    ],
  },
};

const faqSchema = {
  '@context': 'https://schema.org', '@type': 'FAQPage',
  mainEntity: FAQ.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
};

// ---------- static HTML shown to crawlers (React replaces it on load) ----------
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const priceList = () => `
<h2>Services</h2>
<ul>${SERVICES.map((s) => `<li><h3>${s.name}</h3><p>₵${s.price} per ${s.unit}. ${esc(s.desc)}</p></li>`).join('')}
<li><h3>Free first Standard Klean</h3><p>Free when you sign up. One per account.</p></li></ul>
<h2>Bundles</h2>
<ul>${BUNDLES.map((b) => `<li><h3>${b.name}</h3><p>₵${b.price} for ${b.pairs} pairs (Standard Klean).</p></li>`).join('')}</ul>`;
const areas = () => `<h2>Pickup and delivery across Accra</h2><ul>${AREAS.map((a) => `<li>${a}</li>`).join('')}</ul>`;
const contact = () => `<h2>Studio</h2><address>${BUSINESS.street}, ${BUSINESS.city}, Ghana<br>
<a href="tel:${BUSINESS.phone}">${BUSINESS.phoneDisplay}</a> · <a href="mailto:${BUSINESS.email}">${BUSINESS.email}</a></address>`;
const nav = () => `<nav><a href="/">Home</a> · <a href="/services">Book a Klean</a> · <a href="/rate-and-services">Prices</a> · <a href="/about-us">About</a> · <a href="/vouchers">Gift vouchers</a></nav>`;
const faq = () => `<h2>Questions</h2>${FAQ.map(([q, a]) => `<h3>${esc(q)}</h3><p>${esc(a)}</p>`).join('')}`;

// Public, indexable routes. Anything not listed here (cart, checkout, orders, account,
// partner, auth) gets noindex at runtime and is disallowed in robots.txt.
export const PAGES = {
  '/': {
    title: 'Sneaker Cleaning & Restoration in Accra | KleanKickx',
    description: 'Sneaker cleaning in Accra from ₵50 a pair. Standard, next-day Priority and Deep Klean, bundles from ₵130, pickup and delivery across Accra. First Standard Klean free.',
    schema: [faqSchema],
    body: () => `${nav()}<h1>Sneaker cleaning and restoration in Accra</h1>
<p>We pick up your sneakers, clean them by hand at our studio on Golf Hills St, and deliver them back. Pay by Mobile Money or card.</p>
${priceList()}${areas()}
<h2>How it works</h2><ol><li>Book a Klean online and choose pickup or drop-off.</li><li>Our technicians clean and restore your pair.</li><li>Your pair comes back clean, usually within 72 hours.</li></ol>
${faq()}${contact()}`,
  },
  '/services': {
    title: 'Book a Sneaker Klean in Accra: Prices from ₵50 | KleanKickx',
    description: 'Choose your Klean and pay by Mobile Money or card. Standard ₵50, Priority next-day ₵70, Deep ₵80, bundles from ₵130. Pickup across Accra.',
    body: () => `${nav()}<h1>Book a Klean</h1><p>Add services to your cart and check out with Mobile Money or card through Paystack.</p>${priceList()}${areas()}${contact()}`,
  },
  '/rate-and-services': {
    title: 'Sneaker Cleaning Prices in Accra | KleanKickx',
    description: 'KleanKickx prices: Standard Klean ₵50, Priority Klean ₵70 (next day), Deep Klean ₵80. Bundles: 3 pairs ₵130, 5 pairs ₵210, 10 pairs ₵410.',
    body: () => `${nav()}<h1>Prices and services</h1>${priceList()}${faq()}${contact()}`,
  },
  '/about-us': {
    title: 'About KleanKickx: Sneaker Care Studio in Accra',
    description: 'KleanKickx is a sneaker care studio at 29 Golf Hills St, Accra. Since 2020 we have cleaned and restored sneakers by hand so they stay in use for longer.',
    schema: [{ '@context': 'https://schema.org', '@type': 'AboutPage', url: `${SITE_URL}/about-us`, about: { '@id': `${SITE_URL}/#business` } }],
    body: () => `${nav()}<h1>About KleanKickx</h1><p>KleanKickx started in 2020 in Accra. We clean and restore sneakers by hand so they stay in use for longer, and we work with recyclers on the pairs that can't be saved.</p>${contact()}`,
  },
  '/vouchers': {
    title: 'Sneaker Cleaning Gift Vouchers | KleanKickx Accra',
    description: 'Give a KleanKickx gift voucher: Standard Klean ₵50, Deep Klean ₵80, bundles from ₵130. Delivered by email, valid for 6 months.',
    body: () => `${nav()}<h1>Gift vouchers</h1><p>Pick a voucher, pay securely and it arrives by email. Valid for 6 months.</p>${priceList()}${contact()}`,
  },
  '/legal': {
    title: 'Terms & Privacy | KleanKickx',
    description: 'KleanKickx Sneaker Care Limited terms of service, refund policy and privacy policy.',
    body: () => `${nav()}<h1>Terms and privacy</h1><p>Terms of service, refunds and privacy for KleanKickx Sneaker Care Limited.</p>${contact()}`,
  },
};

export const DEFAULT_META = {
  title: 'KleanKickx | Sneaker Cleaning in Accra',
  description: PAGES['/'].description,
};

export const canonicalFor = (path) => `${SITE_URL}${path === '/' ? '/' : path}`;
export const schemaFor = (path) => [businessSchema, ...((PAGES[path] && PAGES[path].schema) || [])];
