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
  { name: 'VIP Klean', price: 800, pairs: 20 },
];

export const FAQ = [
  ['How much does sneaker cleaning cost in Accra?', 'A Standard Klean is ₵50 a pair, Priority Klean (next day) is ₵70 and Deep Klean is ₵80. Bundles: 3 pairs for ₵130, 5 pairs for ₵210, 10 pairs for ₵410. Your first Standard Klean is free when you sign up.'],
  ['Do you pick up and deliver?', `Yes. We pick up and deliver across Accra, including ${AREAS.join(', ')}. Delivery fees apply. You can also drop off at the studio on 29 Golf Hills St.`],
  ['How long does a Klean take?', 'Standard and Deep Klean take about 72 hours. Priority Klean comes back the next day.'],
  ['How do I pay?', 'Add your services to the cart and pay by Mobile Money or card through Paystack.'],
  ['What happens to shoes I trade in?', 'We check every pair by hand. Wearable pairs are cleaned and go back into use. Pairs past saving go to our partner KicksCTRL for material recovery, not landfill.'],
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
  priceRange: '₵50–₵800',
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
const nav = () => `<nav><a href="/#services">Services</a> · <a href="/#trade-in">Trade-In</a> · <a href="/impact">Impact</a> · <a href="/studio">Studio</a> · <a href="/services">Book a Klean</a></nav>`;
const tradeIn = () => `<h2>Trade-In</h2><p>Bring the pairs you no longer wear. We check every one by hand: wearable pairs are cleaned and go back into use, and pairs past saving go to our partner <a href="https://kicksctrl.com">KicksCTRL</a> for material recovery, not landfill.</p>`;
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
${priceList()}${tradeIn()}${areas()}
<h2>How it works</h2><ol><li>Add a Klean to your cart and choose pickup or drop-off at checkout.</li><li>Our technicians clean and restore your pair.</li><li>Your pair comes back clean, usually within 72 hours.</li></ol>
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
  '/studio': {
    title: 'Studio: Sneaker Care on Golf Hills St, Accra | KleanKickx',
    description: 'The KleanKickx studio at 29 Golf Hills St, Accra. Sneaker cleaning and restoration by hand since 2020, run by a local team.',
    schema: [{ '@context': 'https://schema.org', '@type': 'AboutPage', url: `${SITE_URL}/studio`, about: { '@id': `${SITE_URL}/#business` } }],
    body: () => `${nav()}<h1>29 Golf Hills St, Accra</h1><p>Our studio in Accra. Every pair is cleaned here by hand, by a team we trained.</p>
<h2>Started with one table</h2><p>KleanKickx began in 2020 with homemade cleaning products and a worktable built from a broken door. Today the studio is run by a local team in Accra.</p>
<h2>How we work</h2><ul><li>By hand: every pair is checked, cleaned and finished by a trained technician.</li><li>Fair prices: from ₵50 a pair.</li><li>Nothing wasted: pairs that can't be saved go to material recovery.</li></ul>${areas()}${contact()}`,
  },
  '/impact': {
    title: 'Impact: Keeping Shoes in Use in Accra | KleanKickx',
    description: 'KleanKickx extends the life of shoes in Accra, trains young technicians, and sends unwearable pairs to KicksCTRL for material recovery instead of landfill.',
    schema: [{ '@context': 'https://schema.org', '@type': 'WebPage', url: `${SITE_URL}/impact`, about: { '@id': `${SITE_URL}/#business` } }],
    body: () => `${nav()}<h1>Keep shoes in use</h1><p>KleanKickx is Accra's sneaker care and collection hub. We extend the life of shoes, train the people who restore them, and make sure the pairs we can't save don't end up in landfill.</p>
<h2>22 billion pairs discarded globally</h2><p>Every year, about 22 billion pairs of shoes are sent to landfill or burned, out of roughly 24 billion made.</p>
<h2>What we do</h2><ul><li>Extend: every Klean adds wear to a pair that already exists.</li><li>Train: young people in Accra learn technical cleaning, restoration and triage.</li><li>Recover: pairs past saving go to our partner <a href="https://kicksctrl.com">KicksCTRL</a>.</li></ul>
<h2>Accra pilot with KicksCTRL</h2><p>Over two days at one collection point: 682 records taken in, 446 pairs back into use, and 100% of records sent to reuse or held as recovery feedstock.</p>${tradeIn()}${contact()}`,
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
