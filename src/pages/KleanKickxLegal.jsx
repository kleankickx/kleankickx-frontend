import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const KleanKickxLegal = () => {
  const [activeTab, setActiveTab] = useState('privacy');
  const location = useLocation();

  useEffect(() => {
    const state = location.state;
    if (state?.tab && (state.tab === 'privacy' || state.tab === 'terms')) {
      setActiveTab(state.tab);
    }
  }, [location]);


  return (
    <div className="min-h-screen bg-gray-50 font-sans antialiased">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-center">
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setActiveTab('privacy')}
                className={`px-6 py-2.5 text-sm font-medium rounded-md transition-all duration-200 ${
                  activeTab === 'privacy'
                    ? 'bg-white text-primary shadow-sm ring-1 ring-gray-200'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                Privacy Policy
              </button>
              <button
                onClick={() => setActiveTab('terms')}
                className={`px-6 py-2.5 text-sm font-medium rounded-md transition-all duration-200 ${
                  activeTab === 'terms'
                    ? 'bg-white text-primary shadow-sm ring-1 ring-gray-200'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                Terms & Conditions
              </button>
            </div>
          </div>
        </div>
      </header>
      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100">
          {/* Decorative top bar - using brand colors */}
          <div className="h-1.5 bg-gradient-to-r from-primary via-secondary to-primary"></div>

          <div className="p-6 sm:p-8 lg:p-10">
            {activeTab === 'privacy' ? <PrivacyPolicy /> : <TermsAndConditions />}
          </div>
        </div>

        {/* Footer note */}
        <div className="mt-8 text-center text-xs text-gray-400 border-t border-gray-200 pt-6">
          <p>KleanKickx Sneaker Care Limited &bull; 29 Golf Hills Street, Accra, Ghana</p>
          <p className="mt-1">
            <a href="mailto:info@kleankickx.com" className="text-primary hover:text-secondary transition-colors">info@kleankickx.com</a>
            &nbsp;&bull;&nbsp; <a href="tel:+233536278834" className="text-primary hover:text-secondary transition-colors">+233 53 627 8834</a>
          </p>
        </div>
      </main>
    </div>
  );
};

// ------------------------------------------------------------------
// Privacy Policy Component
// ------------------------------------------------------------------
const PrivacyPolicy = () => {
  return (
    <div className="prose prose-sm sm:prose-base lg:prose-lg max-w-none">
      <h1 className="text-3xl font-extrabold text-deep-gray tracking-tight border-b border-gray-200 pb-4 mb-6">
        Privacy Policy
      </h1>
      <p className="text-sm text-gray-500 -mt-4 mb-6">Effective Date: 1st February, 2026</p>

      <div className="space-y-8">
        {/* Section 1 */}
        <section>
          <h2 className="text-xl font-bold text-deep-gray flex items-center">
            <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold mr-3">1</span>
            Who We Are
          </h2>
          <div className="pl-11 space-y-2 text-gray-700">
            <p><strong>KleanKickx Sneaker Care Limited</strong> (RGD Number: CS188801124) is incorporated in Ghana with registered office at 29 Golf Hills Street, Accra.</p>
            <p>Data Protection Contact: <a href="mailto:info@kleankickx.com" className="text-primary hover:underline">info@kleankickx.com</a></p>
          </div>
        </section>

        {/* Section 2 */}
        <section>
          <h2 className="text-xl font-bold text-deep-gray flex items-center">
            <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold mr-3">2</span>
            Personal Data We Collect
          </h2>
          <div className="pl-11 overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold text-gray-600">Category</th>
                  <th className="px-4 py-2 text-left font-semibold text-gray-600">Examples</th>
                  <th className="px-4 py-2 text-left font-semibold text-gray-600">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr><td className="px-4 py-2 font-medium">Identity</td><td className="px-4 py-2">Name, date of birth</td><td className="px-4 py-2">Booking form</td></tr>
                <tr><td className="px-4 py-2 font-medium">Contact</td><td className="px-4 py-2">Phone, email, address</td><td className="px-4 py-2">Account creation</td></tr>
                <tr><td className="px-4 py-2 font-medium">Identification</td><td className="px-4 py-2">Ghana Card / Passport (high-value)</td><td className="px-4 py-2">Intake Form</td></tr>
                <tr><td className="px-4 py-2 font-medium">Financial</td><td className="px-4 py-2">Payment card, Mobile Money refs</td><td className="px-4 py-2">Payment process</td></tr>
                <tr><td className="px-4 py-2 font-medium">Transactional</td><td className="px-4 py-2">Service history, order details, photos</td><td className="px-4 py-2">Service delivery</td></tr>
                <tr><td className="px-4 py-2 font-medium">Technical</td><td className="px-4 py-2">IP, browser, device, cookies</td><td className="px-4 py-2">Automatically</td></tr>
                <tr><td className="px-4 py-2 font-medium">Communications</td><td className="px-4 py-2">WhatsApp / email / phone</td><td className="px-4 py-2">When you contact us</td></tr>
              </tbody>
            </table>
            <p className="text-xs text-gray-500 mt-2">We do not collect special-category data unless you provide it directly.</p>
          </div>
        </section>

        {/* Section 3 */}
        <section>
          <h2 className="text-xl font-bold text-deep-gray flex items-center">
            <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold mr-3">3</span>
            How We Use Your Data
          </h2>
          <ul className="pl-11 list-disc list-inside space-y-1 text-gray-700">
            <li><strong>Service delivery</strong> — bookings, payments, communication (legal basis: contract)</li>
            <li><strong>Customer care</strong> — support, complaints, disputes (contract, legitimate interests)</li>
            <li><strong>Marketing</strong> — newsletters, promotions (consent, withdraw anytime)</li>
            <li><strong>Service improvement</strong> — analytics, surveys (legitimate interests)</li>
            <li><strong>Legal compliance</strong> — tax, AML, regulatory (legal obligation)</li>
            <li><strong>Security & fraud</strong> — system protection, fraud prevention (legitimate interests)</li>
            <li><strong>Photographs</strong> — record-keeping and marketing (with consent)</li>
          </ul>
        </section>

        {/* Section 4 */}
        <section>
          <h2 className="text-xl font-bold text-deep-gray flex items-center">
            <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold mr-3">4</span>
            Sharing Your Data
          </h2>
          <div className="pl-11 text-gray-700 space-y-1">
            <p>We share with: <strong>Paystack</strong> (payments), <strong>Google Workspace</strong>, <strong>WhatsApp Business</strong>, hosting/courier partners, professional advisors, regulators, and in business transfers.</p>
            <p className="text-sm bg-green-50 p-3 rounded-lg border border-green-100">We do not sell your personal data.</p>
          </div>
        </section>

        {/* Section 5 */}
        <section>
          <h2 className="text-xl font-bold text-deep-gray flex items-center">
            <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold mr-3">5</span>
            International Transfers
          </h2>
          <div className="pl-11 text-gray-700 space-y-2">
            <p>Data may be processed outside Ghana (e.g., Google Workspace, Paystack). For EU/EEA customers, transfers rely on Standard Contractual Clauses or your explicit consent.</p>
            <p className="text-sm bg-green-50 p-3 rounded-lg border border-green-100">We take reasonable steps to ensure equivalent protection internationally.</p>
          </div>
        </section>

        {/* Section 6 */}
        <section>
          <h2 className="text-xl font-bold text-deep-gray flex items-center">
            <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold mr-3">6</span>
            How Long We Keep Your Data
          </h2>
          <div className="pl-11 overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg text-sm">
              <thead className="bg-gray-50"><tr><th className="px-4 py-2 text-left font-semibold text-gray-600">Data category</th><th className="px-4 py-2 text-left font-semibold text-gray-600">Retention</th></tr></thead>
              <tbody className="divide-y divide-gray-100">
                <tr><td className="px-4 py-2">Customer account</td><td className="px-4 py-2">Active + 5 years after closure</td></tr>
                <tr><td className="px-4 py-2">Transaction records</td><td className="px-4 py-2">6 years (tax law)</td></tr>
                <tr><td className="px-4 py-2">Marketing data</td><td className="px-4 py-2">Until consent withdrawn</td></tr>
                <tr><td className="px-4 py-2">Photographs of Items</td><td className="px-4 py-2">2 years after service, unless used in marketing</td></tr>
                <tr><td className="px-4 py-2">Website analytics</td><td className="px-4 py-2">24 months</td></tr>
                <tr><td className="px-4 py-2">Job applications</td><td className="px-4 py-2">12 months</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Section 7 */}
        <section>
          <h2 className="text-xl font-bold text-deep-gray flex items-center">
            <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold mr-3">7</span>
            Your Rights
          </h2>
          <div className="pl-11 grid grid-cols-1 sm:grid-cols-2 gap-2 text-gray-700">
            <div className="bg-green-50 p-3 rounded-lg border border-green-100"><strong>Access</strong> — request a copy</div>
            <div className="bg-green-50 p-3 rounded-lg border border-green-100"><strong>Rectification</strong> — correct inaccuracies</div>
            <div className="bg-green-50 p-3 rounded-lg border border-green-100"><strong>Erasure</strong> — right to be forgotten</div>
            <div className="bg-green-50 p-3 rounded-lg border border-green-100"><strong>Restriction</strong> — limit processing</div>
            <div className="bg-green-50 p-3 rounded-lg border border-green-100"><strong>Portability</strong> — machine-readable format</div>
            <div className="bg-green-50 p-3 rounded-lg border border-green-100"><strong>Objection</strong> — to legitimate interests / marketing</div>
            <div className="bg-green-50 p-3 rounded-lg border border-green-100 col-span-2"><strong>Withdraw consent</strong> — anytime</div>
            <div className="bg-green-50 p-3 rounded-lg border border-green-100 col-span-2"><strong>Complaint</strong> — to Ghana Data Protection Commission or your local authority</div>
          </div>
          <p className="pl-11 text-sm mt-3">To exercise any right: <a href="mailto:info@kleankickx.com" className="text-primary hover:underline">info@kleankickx.com</a> (response within 30 days).</p>
        </section>

        {/* Section 8 */}
        <section>
          <h2 className="text-xl font-bold text-deep-gray flex items-center">
            <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold mr-3">8</span>
            Cookies
          </h2>
          <div className="pl-11 text-gray-700 space-y-2">
            <p>We use cookies for: <strong>Strictly necessary</strong> (session, security), <strong>Analytics</strong> (Google Analytics – with consent), <strong>Marketing</strong> (Meta Pixel – with consent).</p>
            <p className="text-sm">You can opt out via <a href="http://optout.aboutads.info/" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Digital Advertising Alliance</a>.</p>
          </div>
        </section>

        {/* Section 9-12 */}
        <section>
          <h2 className="text-xl font-bold text-deep-gray flex items-center">
            <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold mr-3">9</span>
            Security &amp; Contact
          </h2>
          <div className="pl-11 text-gray-700 space-y-3">
            <p><strong>Security:</strong> We maintain administrative, technical, and physical safeguards including encryption, access controls, staff training, and incident response. In case of breach, we will notify you and the Data Protection Commission.</p>
            <p><strong>Children's Data:</strong> Our Services are not directed at children under 18. If you believe we have inadvertently collected such data, please contact us.</p>
            <p><strong>Changes:</strong> We may update this policy. Material changes will be notified by email.</p>
            <p><strong>Contact:</strong> <a href="mailto:info@kleankickx.com" className="text-primary hover:underline">info@kleankickx.com</a> or write to 29 Golf Hills Street, Accra, Ghana.</p>
          </div>
        </section>
      </div>
    </div>
  );
};

// ------------------------------------------------------------------
// Terms & Conditions Component
// ------------------------------------------------------------------
const TermsAndConditions = () => {
  return (
    <div className="prose prose-sm sm:prose-base lg:prose-lg max-w-none">
      <h1 className="text-3xl font-extrabold text-deep-gray tracking-tight border-b border-gray-200 pb-4 mb-6">
        Terms of Service &amp; Terms and Conditions
      </h1>
      <p className="text-sm text-gray-500 -mt-4 mb-6">Effective Date: 1st February, 2026</p>

      <div className="space-y-8">
        {/* Section 1 */}
        <section>
          <h2 className="text-xl font-bold text-deep-gray flex items-center">
            <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold mr-3">1</span>
            Definitions
          </h2>
          <div className="pl-11 text-gray-700 space-y-1">
            <p><strong>KleanKickx</strong> – KleanKickx Sneaker Care Limited.</p>
            <p><strong>Services</strong> – sneaker cleaning, restoration, deodorizing, sole whitening, and related care.</p>
            <p><strong>Customer</strong> – individual booking or using the Services.</p>
            <p><strong>Items</strong> – sneakers or related products handed over for servicing.</p>
          </div>
        </section>

        {/* Section 2-3 */}
        <section>
          <h2 className="text-xl font-bold text-deep-gray flex items-center">
            <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold mr-3">2</span>
            Eligibility &amp; Services
          </h2>
          <div className="pl-11 text-gray-700 space-y-2">
            <p>You must be at least 18 years old or using under parental consent. Services include standard cleaning, deep cleaning, sole whitening, deodorizing, and minor restoration.</p>
            <p className="text-sm bg-green-50 p-3 rounded-lg border border-green-100">We reserve the right to refuse service for excessively damaged, hazardous, counterfeit items, or if you breach these Terms.</p>
          </div>
        </section>

        {/* Section 4 */}
        <section>
          <h2 className="text-xl font-bold text-deep-gray flex items-center">
            <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold mr-3">3</span>
            Bookings &amp; Orders
          </h2>
          <div className="pl-11 text-gray-700 space-y-2">
            <p>Bookings can be made via website, mobile app, phone, WhatsApp, social media, or in person. An Order is confirmed only after payment and written confirmation.</p>
            <p>The contract is formed when you sign the Intake Form during handover. You are responsible for accurate information.</p>
          </div>
        </section>

        {/* Section 5 */}
        <section>
          <h2 className="text-xl font-bold text-deep-gray flex items-center">
            <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold mr-3">4</span>
            Prices, Payment &amp; Taxes
          </h2>
          <div className="pl-11 text-gray-700 space-y-2">
            <p>Prices are in GHS and include applicable taxes. Payment must be made in full at booking. Accepted methods: Mobile Money, cards, bank transfer, Paystack, or cash.</p>
            <p className="text-sm bg-green-50 p-3 rounded-lg border border-green-100">Declined payments may result in cancellation.</p>
          </div>
        </section>

        {/* Section 6 */}
        <section>
          <h2 className="text-xl font-bold text-deep-gray flex items-center">
            <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold mr-3">5</span>
            Collection, Pickup &amp; Delivery
          </h2>
          <div className="pl-11 text-gray-700 space-y-2">
            <p>Drop-off at designated locations or request pickup/delivery (fees apply). Turnaround times are estimates and may vary due to volume, weather, or logistics.</p>
          </div>
        </section>

        {/* Section 7 */}
        <section>
          <h2 className="text-xl font-bold text-deep-gray flex items-center">
            <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold mr-3">6</span>
            Service Standards &amp; Risks
          </h2>
          <div className="pl-11 text-gray-700 space-y-2">
            <p>We perform services with reasonable skill and care. You acknowledge that cleaning may expose pre-existing damage (glue weakness, sole separation, fabric deterioration).</p>
            <p>We do not guarantee complete stain removal, restoration to original color, or “like new” condition.</p>
          </div>
        </section>

        {/* Section 8 */}
        <section>
          <h2 className="text-xl font-bold text-deep-gray flex items-center">
            <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold mr-3">7</span>
            Cancellation &amp; Refunds
          </h2>
          <div className="pl-11 text-gray-700 space-y-2">
            <p><strong>Customer cancellation:</strong> Before service commences – refund less fees. After service commences – up to 50% charge.</p>
            <p><strong>KleanKickx cancellation:</strong> Full refund.</p>
            <p>Refunds processed within 7 business days. Dissatisfaction must be reported within 48 hours; re-cleaning may be offered at our discretion.</p>
          </div>
        </section>

        {/* Section 9 */}
        <section>
          <h2 className="text-xl font-bold text-deep-gray flex items-center">
            <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold mr-3">8</span>
            Collection, Storage &amp; Abandoned Items
          </h2>
          <div className="pl-11 text-gray-700 space-y-2">
            <p>Items must be collected within 30 days of notification. Storage fees apply after 30 days (GHS 20/pair/week). Uncollected after 90 days are deemed abandoned and may be donated, recycled, or sold.</p>
          </div>
        </section>

        {/* Section 10 */}
        <section>
          <h2 className="text-xl font-bold text-deep-gray flex items-center">
            <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold mr-3">9</span>
            Liability &amp; Indemnification
          </h2>
          <div className="pl-11 text-gray-700 space-y-2">
            <p>Liability for loss/damage is limited to the lower of: Replacement Value stated at intake, or actual market value. If no value stated, cap is GHS 2,000 per pair.</p>
            <p>We are not liable for sentimental/collectible value, consequential losses, pre-existing defects, or unrecorded accessories.</p>
          </div>
        </section>

        {/* Section 11-20 */}
        <section>
          <h2 className="text-xl font-bold text-deep-gray flex items-center">
            <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold mr-3">10</span>
            General Provisions
          </h2>
          <div className="pl-11 text-gray-700 space-y-3">
            <p><strong>Customer obligations:</strong> You agree not to provide false info, submit stolen/counterfeit goods, or misuse the Site.</p>
            <p><strong>Intellectual property:</strong> All content is owned by KleanKickx. By using our Services, you grant a non-exclusive license for us to use photographs for marketing (opt-out available).</p>
            <p><strong>Privacy:</strong> Your personal data is processed as described in our Privacy Policy.</p>
            <p><strong>Force Majeure:</strong> We are not liable for delays beyond our control (natural disasters, strikes, pandemics, etc.).</p>
            <p><strong>Dispute resolution:</strong> Submit disputes in writing to <a href="mailto:info@kleankickx.com" className="text-primary hover:underline">info@kleankickx.com</a>. We respond within 14 days. Mediation/arbitration in Accra under Act 798.</p>
            <p><strong>Governing law:</strong> Republic of Ghana.</p>
            <p><strong>Amendments:</strong> We may update these Terms; continued use constitutes acceptance.</p>
            <p><strong>Entire agreement:</strong> These Terms, Intake Form, Privacy Policy, and confirmations constitute the entire agreement.</p>
            <p><strong>Severability:</strong> If any provision is invalid, the remainder remains in effect.</p>
            <p><strong>Contact:</strong> <a href="mailto:info@kleankickx.com" className="text-primary hover:underline">info@kleankickx.com</a> | +233 53 627 8834 | 29 Golf Hills Street, Accra.</p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default KleanKickxLegal;