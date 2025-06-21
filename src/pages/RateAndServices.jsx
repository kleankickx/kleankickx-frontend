import bgImage from '../assets/hero_sec_rate_service.png';
import shoe1 from '../assets/shoes1.png';
import standardClean from '../assets/standard_klean.png';
import deepClean from '../assets/deep_klean.png';
import deYellow from '../assets/unyellow.png';
import schedule from '../assets/schedule.svg';
import courierCall from '../assets/call.svg';
import diamond from '../assets/diamond.svg';
import delivery from '../assets/delivery.svg';
import priority from '../assets/priority.svg';
import shoe2 from '../assets/shoe2.png';
import Footer from '../components/Footer';
import ShoeCarousel from '../components/ShoeCarousel';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

/* -----------------------------
 | Motion variants (re‑usable) |
 ----------------------------- */
const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const zoomIn = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5 } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.2 } },
};

const RateAndServices = () => (
  <div className="bg-white">
    
    {/* <section className="bg-cover bg-center h-screen relative" style={{ backgroundImage: `url(${bgImage})` }}>
      <div className="absolute inset-0 bg-black/30" />
      <motion.div
        className="relative h-full px-4 md:px-8 lg:px-24 flex flex-col items-center lg:items-start text-center lg:text-left pt-[8rem]"
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
      >
        <h1 className="text-white text-3xl md:text-5xl font-bold header">
          <span className="text-primary">Our </span> Services
        </h1>
        <p className="text-white text-lg md:text-xl mt-8 max-w-2xl">
          We offer a range of services to help you maintain a clean and healthy environment.
          From regular cleaning to specialized deep cleaning, we've got you covered.
        </p>
        <p className="text-white text-lg md:text-xl mt-4 max-w-2xl">
          Our team is dedicated to providing top‑notch service with a focus on quality and customer satisfaction.
        </p>
        <motion.a
          href="/services"
          className="bg-[#007F03] hover:bg-green-700 text-white px-6 py-3 rounded mt-8 inline-block"
          variants={zoomIn}
        >
          Explore Our Services
        </motion.a>
      </motion.div>
    </section> */}

    {/* CLEAN ALL TYPES */}
    <section className="bg-[#1E1E1E]">
      <div className="grid grid-cols-1 md:grid-cols-2  items-center py-16">
        {/* Text comes first on mobile, second on desktop */}
        <motion.div
          className="order-1 lg:order-2 pb-[4rem] lg:pr-24 px-4 lg:px-0 mt-[2rem] lg:mt-0"
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <h2 className="text-[#007F03] text-3xl lg:text-6xl font-bold header mb-4 lg:leading-[4.5rem]">
            <span className="text-white">We </span>
            Clean All
            <br className='hidden lg:block' />
            <span className="text-white"> Types of </span>
            Sneakers
          </h2>
          <p className="text-white text-lg">
            No matter the style or material, we have the expertise and experience to clean your sneakers to perfection. Our services
            cover: High-tops and low-tops, Canvas, leather, suede, and more. Every type of sneaker, from everyday wear to limited editions.
          </p>
        </motion.div>

        {/* Image comes second on mobile, first on desktop */}
        <motion.img
          src={shoe1}
          alt="All Sneakers"
          className="order-2 lg:order-1 w-full h-full object-cover"
          variants={zoomIn}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        />
      </div>
    </section>


    {/*SERVICE PRICING */}
    <section className="bg-white py-16 px-4 md:px-8 lg:px-24" id="pricing">
      <h2 className="text-primary header text-4xl md:text-6xl font-bold text-center mb-16">Service Pricing</h2>
      <motion.div
        className="grid grid-cols-1 md:grid-cols-3 gap-8"
        variants={stagger}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        {[{
          img: standardClean,
          title: 'Standard Cleaning',
          bullet1: 'Thorough cleaning removing dirt and grime.',
          bullet2: 'Great for routine maintenance.',
          price: 'GH₵ 50.00',
        }, {
          img: deepClean,
          title: 'Deep Kleaning',
          bullet1: 'Intensive cleaning tackling stubborn stains.',
          bullet2: 'Perfect for full restoration.',
          price: 'GH₵ 100.00',
        }, {
          img: deYellow,
          title: 'Decolorization (Un‑yellowing)',
          bullet1: 'Removes yellowing and odors.',
          bullet2: 'Ideal for heavily worn pairs.',
          price: 'GH₵ 120.00',
        }].map((svc, i) => (
          <motion.div key={i} className="border shadow-lg border-gray-300 rounded-lg hover:border-primary hover:shadow-xl transition overflow-hidden" variants={fadeInUp}>
        <Link to="/services" className="block">
             <img src={svc.img} alt={svc.title} className="h-80 w-full object-contain rounded-t-lg group-hover:scale-105" />
            <div className="p-6 space-y-2">
              <h3 className="text-xl text-primary mb-2 font-semibold">{svc.title}</h3>
              <p className="text-gray-600 flex gap-2"><svg className="w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>{svc.bullet1}</p>
              <p className="text-gray-600 flex gap-2"><svg className="w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>{svc.bullet2}</p>
              <div className="mt-4 bg-primary text-white inline-block px-4 py-2  tracking-widest">
                <span>PRICE </span>
                | {svc.price}
              </div>
            </div>
        </Link>

          </motion.div>
        ))}
      </motion.div>
    </section>

    {/* CUSTOMER EXPERIENCE */}
    <section className="px-4 md:px-8 lg:px-24 py-16 bg-white">
      <h2 className="text-4xl md:text-6xl font-bold text-primary header text-center mb-4">Customer Experience</h2>
      <p className="text-gray-600 text-center mb-10">Seamless Sneaker Care</p>
      <motion.div
        className="grid grid-cols-1 md:grid-cols-5 gap-6"
        variants={stagger}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        {[{
          icon: schedule,
          title: 'Schedule a Pickup',
          desc: 'Pick a convenient time online, and our courier will collect your kicks.',
          link: '/services',
          linkText: 'Schedule Now',
        }, {
          icon: courierCall,
          title: 'Courier Contact',
          desc: 'Our courier confirms details on the scheduled day.',
        }, {
          icon: diamond,
          title: 'Premium Care',
          desc: 'We treat each pair with precision and premium products.',
        }, {
          icon: delivery,
          title: 'Swift Delivery',
          desc: 'Get your rejuvenated sneakers back in ~72 hrs.',
        }, {
          icon: priority,
          title: 'Priority Service',
          desc: 'Need them faster? Choose our priority add‑on.',
        }].map((card, idx) => (
          <motion.div key={idx} className="p-6 border border-gray-300 rounded-lg hover:shadow-xl hover:scale-[1.02] transition" variants={fadeInUp}>
            <img src={card.icon} alt={card.title} className="w-14 h-14 mb-4" />
            <h3 className="text-xl font-semibold text-primary mb-2">{card.title}</h3>
            <p className="text-gray-600 mb-4 text-sm leading-relaxed">{card.desc}</p>
            {card.link && (
              <a href={card.link} className="bg-primary text-white px-4 py-2 rounded hover:bg-green-700 transition text-sm">
                {card.linkText}
              </a>
            )}
          </motion.div>
        ))}
      </motion.div>
    </section>

    {/* TAILORED SERVICES */}
    <section className="bg-white relative overflow-hidden py-16">
      {/* desktop bg image */}
      <img src={shoe2} alt="bg" className="hidden lg:block absolute right-0 -top-20 h-[40rem] w-auto object-contain pointer-events-none" />

      <motion.div className="relative z-10 px-4 md:px-8 lg:px-24" variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
        <div className="max-w-xl space-y-6">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary header">Tailored Services For Your Needs</h2>
          <p className="text-gray-600 text-base md:text-lg">
            At KleanKickx, we understand that sneakers aren’t just shoes;
            they’re a statement, a passion, and a cherished part of your style.
            Our mission is to ensure that every step you take is a confident
            and klean one. Whether you’re an athlete, a collector, or
            someone who simply loves to strut in stylish kicks, we’re here for you.
          </p>
        </div>
      </motion.div>

      {/* mobile bg image */}
      <img src={shoe2} alt="bg mobile" className="block lg:hidden w-full object-contain mt-8" />
    </section>

    {/* OPTIONAL CAROUSEL / TESTIMONIALS*/}
    {/* <ShoeCarousel /> */}

    {/* FOOTER */}
    <Footer />
  </div>
);

export default RateAndServices;