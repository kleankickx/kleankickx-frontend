// src/pages/Studio.jsx  (replaces About.jsx; /about-us redirects here)
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import bgImage from '../assets/about_bg.png';
import gumShoe from '../assets/gumshoes.png';
import Footer from '../components/Footer';
import { AREAS } from '../seo/site';

const fadeInUp = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const principles = [
  ['By hand', 'Every pair is checked, cleaned and finished by a trained technician. No shortcuts.'],
  ['Fair prices', 'From ₵50 a pair, so sneaker care is something everyone in Accra can afford.'],
  ['Nothing wasted', "If a pair can't be saved, it goes to material recovery, not the bin."],
];

const Studio = () => (
  <div className="bg-white">
    {/* HERO */}
    <section className="relative bg-cover bg-center h-[22rem]" style={{ backgroundImage: `url(${bgImage})` }}>
      <div className="absolute inset-0 bg-black/55" />
      <motion.div
        className="relative h-full flex flex-col justify-center px-4 md:px-8 lg:px-24"
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
      >
        <h1 className="text-white text-5xl md:text-7xl header">29 Golf Hills St.</h1>
        <p className="text-white/90 lg:text-lg mt-6 max-w-2xl">
          Our studio in Accra. Every pair is cleaned here by hand, by a team we trained.
        </p>
      </motion.div>
    </section>

    {/* STORY */}
    <section className="px-4 md:px-8 lg:px-24 py-16">
      <motion.div
        className="flex flex-col md:flex-row gap-10 items-center"
        variants={fadeInUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
      >
        <img src={gumShoe} alt="A pair of sneakers being restored at the KleanKickx studio" className="w-full md:w-1/2 object-cover" />
        <div className="max-w-xl space-y-5">
          <h2 className="text-primary header text-4xl md:text-5xl">Started with one table.</h2>
          <p className="text-gray-700 text-lg">
            KleanKickx began in 2020 with homemade cleaning products and a worktable built from a broken door.
          </p>
          <p className="text-gray-700 text-lg">
            Our founder learned to care for his shoes as a child. Years later he saw how many secondhand pairs in
            Ghana's markets were thrown away when a proper clean would have saved them. That is still the job.
          </p>
          <p className="text-gray-700 text-lg">
            Today the studio is run by a local team in Accra.
          </p>
        </div>
      </motion.div>
    </section>

    {/* HOW WE WORK */}
    <section className="bg-deep-gray py-16 px-4 md:px-8 lg:px-24">
      <h2 className="text-primary header text-4xl md:text-5xl mb-10">How we work.</h2>
      <div className="grid gap-8 md:grid-cols-3">
        {principles.map(([title, text]) => (
          <motion.div
            key={title}
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="border-t-2 border-white/80 pt-5"
          >
            <h3 className="text-white header text-3xl mb-3">{title}</h3>
            <p className="text-white/80">{text}</p>
          </motion.div>
        ))}
      </div>
    </section>

    {/* VISIT */}
    <section className="px-4 md:px-8 lg:px-24 py-16 grid gap-10 md:grid-cols-2">
      <div>
        <h2 className="header text-4xl md:text-5xl mb-6">Visit.</h2>
        <address className="not-italic text-2xl font-semibold leading-snug">
          29 Golf Hills St<br />Accra, Ghana
        </address>
        <div className="mt-6 space-y-1 text-lg">
          <p><a className="underline" href="tel:+233536278834">+233 53 627 8834</a></p>
          <p><a className="underline" href="https://wa.me/233536278834" target="_blank" rel="noopener noreferrer">WhatsApp</a></p>
          <p><a className="underline" href="mailto:info@kleankickx.com">info@kleankickx.com</a></p>
        </div>
      </div>
      <div>
        <p className="text-gray-600 mb-4">Pickup and delivery across Accra, including:</p>
        <ul className="flex flex-wrap gap-2">
          {AREAS.map((a) => (
            <li key={a} className="border border-gray-900 px-3 py-1.5 text-sm">{a}</li>
          ))}
        </ul>
        <div className="flex flex-wrap gap-3 mt-8">
          <Link to="/#services" className="bg-primary text-white font-semibold px-6 py-3 rounded-lg hover:opacity-90">
            Book a Klean
          </Link>
          <a
            href="https://maps.google.com/?q=KleanKickx+Sneaker+Care,+29+Golf+Hills+St,+Accra"
            target="_blank"
            rel="noopener noreferrer"
            className="border border-gray-900 font-semibold px-6 py-3 rounded-lg hover:bg-gray-100"
          >
            Directions
          </a>
        </div>
      </div>
    </section>

    <Footer />
  </div>
);

export default Studio;
