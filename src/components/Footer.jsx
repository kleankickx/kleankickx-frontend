// src/components/Footer.jsx
// Dark footer with dashed guide lines: link columns, a WhatsApp call to action,
// contact details, social links, and a huge KLEANKICKX wordmark in brand green
// that fades into the background and is cropped by the bottom edge.
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { FaXTwitter } from 'react-icons/fa6';
import { FaInstagram, FaWhatsapp } from 'react-icons/fa';

const WHATSAPP = 'https://wa.me/233536278834?text=' + encodeURIComponent('Hi KleanKickx, I would like to book a Klean.');
const MAPS = 'https://maps.google.com/?q=KleanKickx+Sneaker+Care,+29+Golf+Hills+St,+Accra';
const SWIFT = [0.77, 0, 0.18, 1];

const COLUMNS = [
  {
    title: 'KleanKickx',
    links: [
      { label: 'Services', to: '/#services' },
      { label: 'Prices', to: '/rate-and-services' },
      { label: 'Trade-In', to: '/#trade-in' },
      { label: 'Gift vouchers', to: '/vouchers' },
      { label: 'Impact', to: '/impact' },
      { label: 'Studio', to: '/studio' },
    ],
  },
  {
    title: 'Help',
    links: [
      { label: 'Track my orders', to: '/orders' },
      { label: 'Redeem a voucher', to: '/redeem' },
      { label: 'Partner with us', to: '/partner/register' },
      { label: 'Terms of Service', to: '/legal', state: { tab: 'terms' } },
      { label: 'Privacy Policy', to: '/legal', state: { tab: 'privacy' } },
      { label: 'Email us', href: 'mailto:info@kleankickx.com' },
    ],
  },
];

const SOCIAL = [
  { label: 'Instagram', href: 'https://instagram.com/kleankickxgh', Icon: FaInstagram },
  { label: 'X', href: 'https://x.com/KleanKickxgh', Icon: FaXTwitter },
  { label: 'WhatsApp', href: 'https://wa.me/233536278834', Icon: FaWhatsapp },
];

const FootLink = ({ link }) => (link.href
  ? <a href={link.href} className="kkf-link">{link.label}</a>
  : <Link to={link.to} state={link.state} className="kkf-link">{link.label}</Link>);

const Footer = () => {
  const reduce = useReducedMotion();
  // Text is always visible (no scroll-triggered hiding); only the wordmark rises in
  const rise = () => ({});

  return (
    <footer className="kkf" aria-labelledby="kkf-title">
      <style>{`
        .kkf{--bg:#0B0D0B;--fg:#F2F5F0;--muted:#8E988C;--soft:#B8C1B6;--rule:rgba(242,245,240,.14);--green:#1A7A1A;--green-hi:#4CB84C;
          --display:"Anton","Arial Narrow",Impact,sans-serif;--body:"League Spartan",system-ui,sans-serif;--spring:cubic-bezier(.2,1.25,.3,1);
          background:var(--bg);color:var(--fg);font-family:var(--body);overflow:hidden;position:relative}
        .kkf-frame{position:relative;max-width:1200px;margin:0 auto;padding:0 20px}
        .kkf-guides{position:relative;border-left:1px dashed var(--rule);border-right:1px dashed var(--rule);padding:64px 28px 0}
        .kkf-grid{display:grid;grid-template-columns:1.1fr 1.1fr 1.6fr;gap:48px}
        .kkf h2,.kkf h3{margin:0}
        .kkf-col h3{font-size:12px;font-weight:600;letter-spacing:.18em;text-transform:uppercase;color:var(--muted);margin-bottom:18px}
        .kkf-col ul{list-style:none;margin:0;padding:0;display:grid;gap:12px}
        .kkf-link{color:var(--soft);font-size:18px;line-height:1.3;text-decoration:none;position:relative;transition:color .2s}
        .kkf-link::after{content:"";position:absolute;left:0;bottom:-2px;height:1px;width:100%;background:currentColor;transform:scaleX(0);transform-origin:left;transition:transform .35s cubic-bezier(.77,0,.18,1)}
        .kkf-link:hover{color:var(--fg)}
        .kkf-link:hover::after{transform:scaleX(1)}
        .kkf-cta h2{font-size:26px;font-weight:600;line-height:1.2;letter-spacing:-.01em}
        .kkf-cta p{margin:12px 0 22px;color:var(--soft);font-size:17px;line-height:1.55;max-width:38ch}
        .kkf-field{display:flex;align-items:center;justify-content:space-between;gap:10px;background:rgba(242,245,240,.05);padding:6px 6px 6px 18px;
          border:1px solid var(--rule)}
        .kkf-field span{color:var(--muted);font-size:17px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .kkf-go{display:inline-flex;align-items:center;gap:8px;flex:none;background:var(--green);color:#fff;text-decoration:none;font-weight:700;font-size:16px;
          padding:13px 18px;border-radius:8px;transition:background .2s,transform .25s var(--spring)}
        .kkf-go:hover{background:var(--green-hi);color:#0B0D0B}
        .kkf-go:active{transform:scale(.97)}
        .kkf-go .ar{transition:transform .3s var(--spring)}
        .kkf-go:hover .ar{transform:translateX(4px)}
        .kkf-contact{margin-top:28px;display:grid;gap:6px;color:var(--soft);font-size:15px;font-style:normal}
        .kkf-contact a{color:var(--soft);text-decoration:none}
        .kkf-contact a:hover{color:var(--fg)}
        .kkf-follow{margin-top:56px;padding-top:28px;border-top:1px dashed var(--rule);display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:20px}
        .kkf-follow h3{font-size:12px;font-weight:600;letter-spacing:.18em;text-transform:uppercase;color:var(--muted);margin-bottom:14px}
        .kkf-social{display:flex;flex-wrap:wrap;gap:28px}
        .kkf-social a{display:inline-flex;align-items:center;gap:10px;color:var(--soft);font-size:18px;text-decoration:none;transition:color .2s}
        .kkf-social a:hover{color:var(--fg)}
        .kkf-social svg{transition:transform .3s var(--spring)}
        .kkf-social a:hover svg{transform:translateY(-2px)}
        .kkf-small{color:var(--muted);font-size:14px;line-height:1.6}
        .kkf-mark{position:relative;margin-top:44px;height:clamp(84px,17vw,210px);overflow:hidden;user-select:none;pointer-events:none}
        .kkf-mark span{position:absolute;left:50%;top:0;transform:translateX(-50%);font-family:var(--display);font-weight:400;text-transform:uppercase;
          font-size:clamp(104px,20.4vw,252px);line-height:.86;letter-spacing:-.005em;white-space:nowrap;
          background:linear-gradient(180deg,rgba(76,184,76,.34) 0%,rgba(26,122,26,.18) 38%,rgba(26,122,26,0) 86%);
          -webkit-background-clip:text;background-clip:text;color:transparent}
        @media (max-width:900px){.kkf-grid{grid-template-columns:1fr 1fr}.kkf-cta{grid-column:1 / -1}}
        @media (max-width:560px){
          .kkf-frame{padding:0 12px}.kkf-guides{padding:44px 18px 0}.kkf-grid{gap:36px 20px}
          .kkf-link,.kkf-social a{font-size:17px}.kkf-cta h2{font-size:23px}.kkf-cta p{font-size:16px}
          .kkf-field span{font-size:15px}.kkf-go{font-size:15px;padding:12px 14px}
        }
      `}</style>

      <div className="kkf-frame">
        <div className="kkf-guides">
          <h2 id="kkf-title" className="sr-only">KleanKickx</h2>
          <div className="kkf-grid">
            {COLUMNS.map((col, i) => (
              <motion.nav key={col.title} className="kkf-col" aria-label={col.title} {...rise(i * 0.06)}>
                <h3>{col.title}</h3>
                <ul>{col.links.map((l) => <li key={l.label}><FootLink link={l} /></li>)}</ul>
              </motion.nav>
            ))}

            <motion.div className="kkf-cta" {...rise(0.14)}>
              <h2>Fresh pairs start here.</h2>
              <p>Book a Klean online, or message us and we'll sort pickup and delivery anywhere in Accra.</p>
              <div className="kkf-field">
                <span>+233 53 627 8834</span>
                <a className="kkf-go" href={WHATSAPP} target="_blank" rel="noopener noreferrer">
                  Chat on WhatsApp <span className="ar" aria-hidden="true">›</span>
                </a>
              </div>
              <address className="kkf-contact">
                <a href={MAPS} target="_blank" rel="noopener noreferrer">29 Golf Hills St, Accra</a>
                <a href="mailto:info@kleankickx.com">info@kleankickx.com</a>
              </address>
            </motion.div>
          </div>

          <motion.div className="kkf-follow" {...rise(0.1)}>
            <div>
              <h3>Follow</h3>
              <div className="kkf-social">
                {SOCIAL.map(({ label, href, Icon }) => (
                  <a key={label} href={href} target="_blank" rel="noopener noreferrer">
                    <Icon aria-hidden="true" /> {label}
                  </a>
                ))}
              </div>
            </div>
            <p className="kkf-small">
              © {new Date().getFullYear()} KleanKickx Sneaker Care Limited.<br />
              Every Klean keeps a pair in use. Supporting UN SDGs 11, 12 and 13.
            </p>
          </motion.div>

          <motion.div
            className="kkf-mark"
            aria-hidden="true"
            initial={reduce ? false : { opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1.1, ease: SWIFT }}
          >
            <span>KleanKickx</span>
          </motion.div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
