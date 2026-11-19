// src/pages/KleanKickxLegal.jsx
// Privacy Policy and Terms of Service. The legal wording is unchanged from the
// approved text; only the layout is new. Open a document with /legal#privacy or
// /legal#terms (or navigate with state { tab }).
import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';

const DOCS = {
  privacy: { label: 'Privacy policy', title: 'Privacy policy' },
  terms: { label: 'Terms of service', title: 'Terms of service' },
};

const css = `
  .kklg{--ink:#0A0B0A;--paper:#F7F9F6;--line:#D9DFD7;--muted:#4D564C;--green:#1A7A1A;--tint:#E9F4E7;
    --display:"Anton","Arial Narrow",Impact,sans-serif;--spring:cubic-bezier(.2,1.25,.3,1);
    background:var(--paper);color:var(--ink);font-family:"League Spartan",system-ui,sans-serif;min-height:100vh}
  .kklg-wrap{max-width:1160px;margin:0 auto;padding:0 20px 72px}
  .kklg-eyebrow{margin:0;font-size:12px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:var(--green)}
  .kklg-hero{padding:48px 0 0}
  .kklg-hero h1{margin:8px 0 0;font-family:var(--display);font-weight:400;text-transform:uppercase;font-size:clamp(52px,8vw,104px);line-height:.88}
  .kklg-meta{display:flex;flex-wrap:wrap;gap:6px 18px;margin:14px 0 0;font-size:15px;color:var(--muted)}
  .kklg-meta b{color:var(--ink);font-weight:700}
  .kklg-tabs{display:flex;gap:8px;margin-top:24px;padding-bottom:22px;border-bottom:2px solid var(--ink)}
  .kklg-tab{height:44px;padding:0 18px;border:2px solid var(--ink);border-radius:2px;background:transparent;color:var(--ink);font:inherit;font-size:15px;font-weight:700;cursor:pointer;
    transition:background .2s,color .2s}
  .kklg-tab:hover{background:var(--ink);color:#fff}
  .kklg-tab[aria-selected="true"]{background:var(--ink);color:#fff}
  .kklg :focus-visible{outline:2px solid var(--green);outline-offset:3px}

  .kklg-grid{display:grid;grid-template-columns:240px minmax(0,1fr);gap:48px;margin-top:32px;align-items:start}
  .kklg-toc{position:sticky;top:96px}
  .kklg-toc p{margin:0 0 10px}
  .kklg-toc ol{list-style:none;margin:0;padding:0;border-top:2px solid var(--ink)}
  .kklg-toc a{display:grid;grid-template-columns:28px 1fr;gap:6px;padding:9px 0;border-bottom:1px solid var(--line);color:var(--muted);text-decoration:none;font-size:14px;line-height:1.3;
    transition:color .2s}
  .kklg-toc a span{font-size:11px;font-weight:700;letter-spacing:.12em;padding-top:2px}
  .kklg-toc a:hover{color:var(--ink)}
  .kklg-toc a.on{color:var(--green);font-weight:700}
  .kklg-toc a.on span{color:var(--green)}

  .kklg-doc{min-width:0;max-width:760px}
  .kklg-sec{padding:28px 0;border-bottom:1px solid var(--line);scroll-margin-top:96px}
  .kklg-sec:first-child{padding-top:0}
  .kklg-sec:last-child{border-bottom:0}
  .kklg-sec-head{display:flex;align-items:baseline;gap:14px;margin-bottom:14px}
  .kklg-sec-head .n{font-family:var(--display);font-size:30px;line-height:1;color:var(--green);min-width:40px}
  .kklg-sec-head h2{margin:0;font-family:var(--display);font-weight:400;text-transform:uppercase;font-size:clamp(26px,3vw,34px);line-height:1}
  .kklg-body{padding-left:54px;font-size:16px;line-height:1.65;color:#2B312A}
  .kklg-body p{margin:0 0 10px}
  .kklg-body p:last-child{margin-bottom:0}
  .kklg-body strong{color:var(--ink)}
  .kklg-body a{color:var(--ink);font-weight:600;text-decoration:underline;text-decoration-color:var(--green);text-underline-offset:3px;text-decoration-thickness:2px}
  .kklg-body a:hover{color:var(--green)}
  .kklg-body ul{margin:0;padding:0;list-style:none;display:grid;gap:8px}
  .kklg-body ul li{position:relative;padding-left:18px}
  .kklg-body ul li::before{content:"";position:absolute;left:0;top:10px;width:7px;height:7px;background:var(--green)}
  .kklg-note{margin:12px 0 0;padding:12px 14px;border-left:3px solid var(--green);background:var(--tint);font-size:15px;color:var(--ink)}
  .kklg-small{margin-top:10px !important;font-size:14px;color:var(--muted)}
  .kklg-table{width:100%;border-collapse:collapse;font-size:15px;background:#fff;border:1px solid var(--line)}
  .kklg-table th{padding:10px 12px;text-align:left;font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);border-bottom:2px solid var(--ink);background:var(--paper)}
  .kklg-table td{padding:10px 12px;border-bottom:1px solid var(--line);vertical-align:top}
  .kklg-table tr:last-child td{border-bottom:0}
  .kklg-table td:first-child{font-weight:700;color:var(--ink)}
  .kklg-scroll{overflow-x:auto;-webkit-overflow-scrolling:touch}
  .kklg-rights{display:grid;grid-template-columns:1fr 1fr;gap:8px}
  .kklg-rights div{padding:12px 14px;border:1px solid var(--line);background:#fff;font-size:15px}
  .kklg-rights div.wide{grid-column:1 / -1}

  .kklg-contact{margin-top:36px;padding:22px;background:var(--ink);color:#fff;display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:16px}
  .kklg-contact b{display:block;font-family:var(--display);font-weight:400;text-transform:uppercase;font-size:26px;line-height:1}
  .kklg-contact small{display:block;margin-top:6px;color:#A9B3A7;font-size:14px}
  .kklg-contact div:last-child{display:flex;flex-wrap:wrap;gap:8px}
  .kklg-contact a{display:inline-flex;align-items:center;height:46px;padding:0 16px;border:2px solid #fff;color:#fff;text-decoration:none;font-weight:700;font-size:14px;transition:background .2s,color .2s}
  .kklg-contact a:hover{background:#fff;color:var(--ink)}

  @media (max-width:900px){
    .kklg-grid{grid-template-columns:1fr;gap:0;margin-top:20px}
    .kklg-toc{display:none}
  }
  @media (max-width:560px){
    .kklg-wrap{padding:0 16px 56px}
    .kklg-hero{padding-top:32px}
    .kklg-tabs{overflow-x:auto}
    .kklg-tab{flex:1 0 auto;padding:0 14px;font-size:14px}
    .kklg-body{padding-left:0}
    .kklg-sec-head .n{min-width:0;font-size:24px}
    .kklg-rights{grid-template-columns:1fr}
    .kklg-table{font-size:14px}
    .kklg-contact a{flex:1;justify-content:center}
  }
`;

// One numbered section; registers itself for the contents list.
const Section = ({ n, id, title, children }) => (
  <section className="kklg-sec" id={id} aria-labelledby={`${id}-h`}>
    <div className="kklg-sec-head">
      <span className="n" aria-hidden="true">{String(n).padStart(2, '0')}</span>
      <h2 id={`${id}-h`}>{title}</h2>
    </div>
    <div className="kklg-body">{children}</div>
  </section>
);

const Mail = () => <a href="mailto:info@kleankickx.com">info@kleankickx.com</a>;

// ------------------------------------------------------------------
// Privacy Policy
// ------------------------------------------------------------------
const PRIVACY_TOC = [
  ['p-who', 'Who we are'], ['p-collect', 'Personal data we collect'], ['p-use', 'How we use your data'],
  ['p-share', 'Sharing your data'], ['p-transfers', 'International transfers'], ['p-retention', 'How long we keep your data'],
  ['p-rights', 'Your rights'], ['p-cookies', 'Cookies'], ['p-security', 'Security & contact'],
];

const PrivacyPolicy = () => (
  <>
    <Section n={1} id="p-who" title="Who We Are">
      <p><strong>KleanKickx Sneaker Care Limited</strong> (RGD Number: CS188801124) is incorporated in Ghana with registered office at 29 Golf Hills St, Accra.</p>
      <p>Data Protection Contact: <Mail /></p>
    </Section>

    <Section n={2} id="p-collect" title="Personal Data We Collect">
      <div className="kklg-scroll">
        <table className="kklg-table">
          <thead><tr><th>Category</th><th>Examples</th><th>Source</th></tr></thead>
          <tbody>
            <tr><td>Identity</td><td>Name, date of birth</td><td>Booking form</td></tr>
            <tr><td>Contact</td><td>Phone, email, address</td><td>Account creation</td></tr>
            <tr><td>Identification</td><td>Ghana Card / Passport (high-value)</td><td>Intake Form</td></tr>
            <tr><td>Financial</td><td>Payment card, Mobile Money refs</td><td>Payment process</td></tr>
            <tr><td>Transactional</td><td>Service history, order details, photos</td><td>Service delivery</td></tr>
            <tr><td>Technical</td><td>IP, browser, device, cookies</td><td>Automatically</td></tr>
            <tr><td>Communications</td><td>WhatsApp / email / phone</td><td>When you contact us</td></tr>
          </tbody>
        </table>
      </div>
      <p className="kklg-small">We do not collect special-category data unless you provide it directly.</p>
    </Section>

    <Section n={3} id="p-use" title="How We Use Your Data">
      <ul>
        <li><strong>Service delivery</strong> — bookings, payments, communication (legal basis: contract)</li>
        <li><strong>Customer care</strong> — support, complaints, disputes (contract, legitimate interests)</li>
        <li><strong>Marketing</strong> — newsletters, promotions (consent, withdraw anytime)</li>
        <li><strong>Service improvement</strong> — analytics, surveys (legitimate interests)</li>
        <li><strong>Legal compliance</strong> — tax, AML, regulatory (legal obligation)</li>
        <li><strong>Security & fraud</strong> — system protection, fraud prevention (legitimate interests)</li>
        <li><strong>Photographs</strong> — record-keeping and marketing (with consent)</li>
      </ul>
    </Section>

    <Section n={4} id="p-share" title="Sharing Your Data">
      <p>We share with: <strong>Paystack</strong> (payments), <strong>Google Workspace</strong>, <strong>WhatsApp Business</strong>, hosting/courier partners, professional advisors, regulators, and in business transfers.</p>
      <p className="kklg-note">We do not sell your personal data.</p>
    </Section>

    <Section n={5} id="p-transfers" title="International Transfers">
      <p>Data may be processed outside Ghana (e.g., Google Workspace, Paystack). For EU/EEA customers, transfers rely on Standard Contractual Clauses or your explicit consent.</p>
      <p className="kklg-note">We take reasonable steps to ensure equivalent protection internationally.</p>
    </Section>

    <Section n={6} id="p-retention" title="How Long We Keep Your Data">
      <div className="kklg-scroll">
        <table className="kklg-table">
          <thead><tr><th>Data category</th><th>Retention</th></tr></thead>
          <tbody>
            <tr><td>Customer account</td><td>Active + 5 years after closure</td></tr>
            <tr><td>Transaction records</td><td>6 years (tax law)</td></tr>
            <tr><td>Marketing data</td><td>Until consent withdrawn</td></tr>
            <tr><td>Photographs of Items</td><td>2 years after service, unless used in marketing</td></tr>
            <tr><td>Website analytics</td><td>24 months</td></tr>
            <tr><td>Job applications</td><td>12 months</td></tr>
          </tbody>
        </table>
      </div>
    </Section>

    <Section n={7} id="p-rights" title="Your Rights">
      <div className="kklg-rights">
        <div><strong>Access</strong> — request a copy</div>
        <div><strong>Rectification</strong> — correct inaccuracies</div>
        <div><strong>Erasure</strong> — right to be forgotten</div>
        <div><strong>Restriction</strong> — limit processing</div>
        <div><strong>Portability</strong> — machine-readable format</div>
        <div><strong>Objection</strong> — to legitimate interests / marketing</div>
        <div className="wide"><strong>Withdraw consent</strong> — anytime</div>
        <div className="wide"><strong>Complaint</strong> — to Ghana Data Protection Commission or your local authority</div>
      </div>
      <p className="kklg-small">To exercise any right: <Mail /> (response within 30 days).</p>
    </Section>

    <Section n={8} id="p-cookies" title="Cookies">
      <p>We use cookies for: <strong>Strictly necessary</strong> (session, security), <strong>Analytics</strong> (Google Analytics – with consent), <strong>Marketing</strong> (Meta Pixel – with consent).</p>
      <p className="kklg-small">You can opt out via <a href="http://optout.aboutads.info/" target="_blank" rel="noopener noreferrer">Digital Advertising Alliance</a>.</p>
    </Section>

    <Section n={9} id="p-security" title="Security &amp; Contact">
      <p><strong>Security:</strong> We maintain administrative, technical, and physical safeguards including encryption, access controls, staff training, and incident response. In case of breach, we will notify you and the Data Protection Commission.</p>
      <p><strong>Children's Data:</strong> Our Services are not directed at children under 18. If you believe we have inadvertently collected such data, please contact us.</p>
      <p><strong>Changes:</strong> We may update this policy. Material changes will be notified by email.</p>
      <p><strong>Contact:</strong> <Mail /> or write to 29 Golf Hills St, Accra, Ghana.</p>
    </Section>
  </>
);

// ------------------------------------------------------------------
// Terms & Conditions
// ------------------------------------------------------------------
const TERMS_TOC = [
  ['t-definitions', 'Definitions'], ['t-eligibility', 'Eligibility & services'], ['t-bookings', 'Bookings & orders'],
  ['t-prices', 'Prices, payment & taxes'], ['t-pickup', 'Collection, pickup & delivery'], ['t-standards', 'Service standards & risks'],
  ['t-refunds', 'Cancellation & refunds'], ['t-storage', 'Storage & abandoned items'], ['t-liability', 'Liability & indemnification'],
  ['t-general', 'General provisions'],
];

const TermsAndConditions = () => (
  <>
    <Section n={1} id="t-definitions" title="Definitions">
      <p><strong>KleanKickx</strong> – KleanKickx Sneaker Care Limited.</p>
      <p><strong>Services</strong> – sneaker cleaning, restoration, deodorizing, sole whitening, and related care.</p>
      <p><strong>Customer</strong> – individual booking or using the Services.</p>
      <p><strong>Items</strong> – sneakers or related products handed over for servicing.</p>
    </Section>

    <Section n={2} id="t-eligibility" title="Eligibility &amp; Services">
      <p>You must be at least 18 years old or using under parental consent. Services include standard cleaning, deep cleaning, sole whitening, deodorizing, and minor restoration.</p>
      <p className="kklg-note">We reserve the right to refuse service for excessively damaged, hazardous, counterfeit items, or if you breach these Terms.</p>
    </Section>

    <Section n={3} id="t-bookings" title="Bookings &amp; Orders">
      <p>Bookings can be made via website, mobile app, phone, WhatsApp, social media, or in person. An Order is confirmed only after payment and written confirmation.</p>
      <p>The contract is formed when you sign the Intake Form during handover. You are responsible for accurate information.</p>
    </Section>

    <Section n={4} id="t-prices" title="Prices, Payment &amp; Taxes">
      <p>Prices are in GHS and include applicable taxes. Payment must be made in full at booking. Accepted methods: Mobile Money, cards, bank transfer, Paystack, or cash.</p>
      <p className="kklg-note">Declined payments may result in cancellation.</p>
    </Section>

    <Section n={5} id="t-pickup" title="Collection, Pickup &amp; Delivery">
      <p>Drop-off at designated locations or request pickup/delivery (fees apply). Turnaround times are estimates and may vary due to volume, weather, or logistics.</p>
    </Section>

    <Section n={6} id="t-standards" title="Service Standards &amp; Risks">
      <p>We perform services with reasonable skill and care. You acknowledge that cleaning may expose pre-existing damage (glue weakness, sole separation, fabric deterioration).</p>
      <p>We do not guarantee complete stain removal, restoration to original color, or “like new” condition.</p>
    </Section>

    <Section n={7} id="t-refunds" title="Cancellation &amp; Refunds">
      <p><strong>Customer cancellation:</strong> Before service commences – refund less fees. After service commences – up to 50% charge.</p>
      <p><strong>KleanKickx cancellation:</strong> Full refund.</p>
      <p>Refunds processed within 7 business days. Dissatisfaction must be reported within 48 hours; re-cleaning may be offered at our discretion.</p>
    </Section>

    <Section n={8} id="t-storage" title="Collection, Storage &amp; Abandoned Items">
      <p>Items must be collected within 30 days of notification. Storage fees apply after 30 days (GHS 20/pair/week). Uncollected after 90 days are deemed abandoned and may be donated, recycled, or sold.</p>
    </Section>

    <Section n={9} id="t-liability" title="Liability &amp; Indemnification">
      <p>Liability for loss/damage is limited to the lower of: Replacement Value stated at intake, or actual market value. If no value stated, cap is GHS 2,000 per pair.</p>
      <p>We are not liable for sentimental/collectible value, consequential losses, pre-existing defects, or unrecorded accessories.</p>
    </Section>

    <Section n={10} id="t-general" title="General Provisions">
      <p><strong>Customer obligations:</strong> You agree not to provide false info, submit stolen/counterfeit goods, or misuse the Site.</p>
      <p><strong>Intellectual property:</strong> All content is owned by KleanKickx. By using our Services, you grant a non-exclusive license for us to use photographs for marketing (opt-out available).</p>
      <p><strong>Privacy:</strong> Your personal data is processed as described in our Privacy Policy.</p>
      <p><strong>Force Majeure:</strong> We are not liable for delays beyond our control (natural disasters, strikes, pandemics, etc.).</p>
      <p><strong>Dispute resolution:</strong> Submit disputes in writing to <Mail />. We respond within 14 days. Mediation/arbitration in Accra under Act 798.</p>
      <p><strong>Governing law:</strong> Republic of Ghana.</p>
      <p><strong>Amendments:</strong> We may update these Terms; continued use constitutes acceptance.</p>
      <p><strong>Entire agreement:</strong> These Terms, Intake Form, Privacy Policy, and confirmations constitute the entire agreement.</p>
      <p><strong>Severability:</strong> If any provision is invalid, the remainder remains in effect.</p>
      <p><strong>Contact:</strong> <Mail /> | +233 53 627 8834 | 29 Golf Hills St, Accra.</p>
    </Section>
  </>
);

// ------------------------------------------------------------------
// Page
// ------------------------------------------------------------------
const tabFrom = (location) => {
  const hash = location.hash.replace('#', '');
  if (hash === 'terms' || hash.startsWith('t-')) return 'terms';
  if (hash === 'privacy' || hash.startsWith('p-')) return 'privacy';
  const st = location.state?.tab;
  return st === 'terms' || st === 'privacy' ? st : 'privacy';
};

const KleanKickxLegal = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(() => tabFrom(location));
  const [current, setCurrent] = useState('');
  const docRef = useRef(null);
  const toc = activeTab === 'privacy' ? PRIVACY_TOC : TERMS_TOC;

  // Follow links that arrive with a tab (footer, sign-up page) or a #hash.
  useEffect(() => {
    setActiveTab(tabFrom(location));
  }, [location]);

  // Jump to a section hash on arrival (e.g. /legal#t-refunds).
  useEffect(() => {
    const hash = location.hash.replace('#', '');
    if (hash.includes('-')) setTimeout(() => document.getElementById(hash)?.scrollIntoView({ block: 'start' }), 60);
  }, [location.hash, activeTab]);

  // Highlight the section being read.
  useEffect(() => {
    const els = toc.map(([id]) => document.getElementById(id)).filter(Boolean);
    if (!els.length || !('IntersectionObserver' in window)) return undefined;
    const io = new IntersectionObserver((entries) => {
      const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (visible[0]) setCurrent(visible[0].target.id);
    }, { rootMargin: '-100px 0px -60% 0px' });
    els.forEach((el) => io.observe(el));
    setCurrent(els[0].id);
    return () => io.disconnect();
  }, [activeTab]);

  const switchTo = (tab) => {
    if (tab === activeTab) return;
    navigate({ pathname: '/legal', hash: `#${tab}` }, { replace: true });
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const jump = (e, id) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setCurrent(id);
  };

  return (
    <div className="kklg">
      <style>{css}</style>
      <div className="kklg-wrap">
        <header className="kklg-hero">
          <p className="kklg-eyebrow">Legal</p>
          <h1>{DOCS[activeTab].title}</h1>
          <p className="kklg-meta">
            <span>Effective <b>1 February 2026</b></span>
            <span>KleanKickx Sneaker Care Limited</span>
          </p>
          <div className="kklg-tabs" role="tablist" aria-label="Legal documents">
            {Object.entries(DOCS).map(([key, d]) => (
              <button key={key} type="button" role="tab" id={`tab-${key}`} aria-selected={activeTab === key} aria-controls="kklg-doc"
                className="kklg-tab" onClick={() => switchTo(key)}>
                {d.label}
              </button>
            ))}
          </div>
        </header>

        <div className="kklg-grid">
          <nav className="kklg-toc" aria-label="On this page">
            <p className="kklg-eyebrow">On this page</p>
            <ol>
              {toc.map(([id, label], i) => (
                <li key={id}>
                  <a href={`#${id}`} onClick={(e) => jump(e, id)} className={current === id ? 'on' : ''} aria-current={current === id ? 'true' : undefined}>
                    <span>{String(i + 1).padStart(2, '0')}</span>{label}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <article className="kklg-doc" id="kklg-doc" role="tabpanel" aria-labelledby={`tab-${activeTab}`} ref={docRef}>
            {activeTab === 'privacy' ? <PrivacyPolicy /> : <TermsAndConditions />}

            <aside className="kklg-contact" aria-label="Questions">
              <div>
                <b>Questions?</b>
                <small>KleanKickx Sneaker Care Limited · 29 Golf Hills St, Accra, Ghana</small>
              </div>
              <div>
                <a href="mailto:info@kleankickx.com">info@kleankickx.com</a>
                <a href="tel:+233536278834">+233 53 627 8834</a>
              </div>
            </aside>
          </article>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default KleanKickxLegal;
