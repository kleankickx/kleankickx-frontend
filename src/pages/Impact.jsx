// src/pages/Impact.jsx
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import joinMovement from '../assets/join_movement.png';
import Footer from '../components/Footer';

const fadeInUp = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

// Our recovery partner; every mention links to them.
const KicksCtrl = ({ dark = false }) => (
  <a className={`${dark ? 'text-[#6FD46F] hover:text-white' : 'text-primary hover:text-gray-900'} font-semibold underline underline-offset-4 decoration-2 transition-colors`}
    href="https://kicksctrl.com" target="_blank" rel="noopener noreferrer">KicksCTRL</a>
);

const pillars = [
  ['Extend', 'Every Klean adds wear to a pair that already exists. That is a pair that does not need replacing.'],
  ['Train', 'We train young people in Accra in technical cleaning, restoration and triage: the skills to judge a shoe and bring it back.'],
  ['Recover', 'Pairs past saving go to our partner KicksCTRL, which is building footwear recovery in Ghana. They stay out of landfill.'],
];

const pilot = [
  ['682', 'records taken in over two days at one Accra collection point: 556 complete pairs and 126 single shoes.'],
  ['446', 'pairs back into use: 202 Kleaned by KleanKickx and 244 sorted and donated directly.'],
  ['100%', 'of records sent to reuse or held as recovery feedstock. None to landfill.'],
];

const steps = [
  'Collected from customers, trade-ins and partner traders.',
  'Sorted by hand: reuse, restore or recover.',
  'Kleaned and restored at the studio.',
  'Returned, resold or donated.',
  <>Unwearable pairs logged and handed to <KicksCtrl />.</>,
];

const Impact = () => (
  <div className="bg-white">
    {/* HERO */}
    <section className="relative bg-cover bg-center" style={{ backgroundImage: `url(${joinMovement})` }}>
      <div className="absolute inset-0 bg-black/60" />
      <motion.div
        className="relative px-4 md:px-8 lg:px-24 py-24 md:py-32"
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
      >
        <h1 className="text-white text-5xl md:text-7xl header">Keep shoes in use.</h1>
        <p className="text-white/90 lg:text-lg mt-6 max-w-2xl">
          KleanKickx is Accra's sneaker care and collection hub. We extend the life of shoes, train the people who
          restore them, and make sure the pairs we can't save don't end up in landfill.
        </p>
      </motion.div>
    </section>

    {/* 22 BILLION */}
    <section className="px-4 md:px-8 lg:px-24 py-16 grid gap-8 md:grid-cols-2 items-end border-b border-gray-200">
      <div>
        <p className="header text-[96px] md:text-[150px] leading-none">22<span className="text-primary">B</span></p>
        <h2 className="header text-3xl md:text-4xl mt-2">Pairs discarded globally.</h2>
      </div>
      <p className="text-gray-600 text-lg max-w-xl">
        Every year, about 22 billion pairs of shoes are sent to landfill or burned, out of roughly 24 billion made.
        A pair that is cleaned and worn again is one less pair on that pile.
      </p>
    </section>

    {/* WHAT WE DO */}
    <section className="px-4 md:px-8 lg:px-24 py-16">
      <h2 className="header text-4xl md:text-5xl mb-10">What we do.</h2>
      <div className="grid gap-8 md:grid-cols-3">
        {pillars.map(([title, text]) => (
          <motion.div
            key={title}
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="border-t-2 border-gray-900 pt-5"
          >
            <h3 className="header text-3xl mb-3">{title}<span className="text-primary">.</span></h3>
            <p className="text-gray-600">
              {title === 'Recover' ? (
                <>
                  Pairs past saving go to our partner{' '}
                  <KicksCtrl />,
                  which is building footwear recovery in Ghana. They stay out of landfill.
                </>
              ) : text}
            </p>
          </motion.div>
        ))}
      </div>
    </section>

    {/* PILOT */}
    <section className="bg-deep-gray py-16 px-4 md:px-8 lg:px-24">
      <h2 className="text-white header text-4xl md:text-5xl">Accra pilot with <KicksCtrl dark />.</h2>
      <p className="text-white/70 mt-3 mb-10">Two days. One collection point. Every pair tracked.</p>
      <div className="grid gap-8 md:grid-cols-3">
        {pilot.map(([n, text]) => (
          <div key={n} className="border-t-2 border-white/80 pt-5">
            <p className="text-white header text-6xl md:text-7xl">{n}</p>
            <p className="text-white/75 mt-3">{text}</p>
          </div>
        ))}
      </div>
      <p className="text-white/50 text-sm mt-10">
        From the <KicksCtrl dark /> "Footwear Under Control" pilot report, 2026. Recovery feedstock is stored until recycling end-markets are verified.
      </p>
    </section>

    {/* HOW A PAIR MOVES */}
    <section className="px-4 md:px-8 lg:px-24 py-16 grid gap-10 md:grid-cols-2">
      <h2 className="header text-4xl md:text-5xl">How a pair moves.</h2>
      <ol className="border-t-2 border-gray-900">
        {steps.map((s, i) => (
          <li key={i} className="flex gap-5 py-4 border-b border-gray-200">
            <span className="font-bold tabular-nums">{String(i + 1).padStart(2, '0')}</span>
            <span>{s}</span>
          </li>
        ))}
      </ol>
    </section>

    {/* CTA */}
    <section className="px-4 md:px-8 lg:px-24 pb-20">
      <p className="text-2xl md:text-4xl font-semibold max-w-4xl leading-tight">
        Every Klean is a small act for the planet. A pair you keep wearing is a pair that doesn't need replacing.
      </p>
      <div className="flex flex-wrap gap-3 mt-8">
        <Link to="/#services" className="bg-primary text-white font-semibold px-6 py-3 rounded-lg hover:opacity-90">
          Book a Klean
        </Link>
        <Link to="/#trade-in" className="border border-gray-900 font-semibold px-6 py-3 rounded-lg hover:bg-gray-100">
          Trade in a pair
        </Link>
      </div>
    </section>

    <Footer />
  </div>
);

export default Impact;
