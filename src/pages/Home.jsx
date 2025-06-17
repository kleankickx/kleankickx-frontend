import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useInView } from "react-intersection-observer";
import {useState, useEffect} from 'react';

// assets & components
import homeBg from '../assets/home_bg.png';
import arrow1 from '../assets/arrow1.png';
import arrow2 from '../assets/arrow2.png';
import standardClean from '../assets/standardClean.png';
import deepClean from '../assets/deep_clean.png';
import unyellowing from '../assets/unyellowing.png';
import ShoeCarousel from '../components/ShoeCarousel';
import kleankickxCare from '../assets/kleankickx_care.png';
import whoWeAre from '../assets/who_we_are.png';
import KleanTips from '../components/KleanTips';
import Footer from '../components/Footer';


const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: (i = 1) => ({
    opacity: 1,
    transition: { delay: i * 0.15, duration: 0.5 },
  }),
};

const zoomIn = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5 } },
};

const staggerContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.2 },
  },
};

// Helper to animate numbers
const AnimatedNumber = ({ value }) => {
  const [ref, inView] = useInView({ triggerOnce: true });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (inView) {
      let start = 0;
      const end = parseInt(value.replace(/[^\d]/g, ""));
      const duration = 2000;
      const increment = end / (duration / 16);

      const animate = () => {
        start += increment;
        if (start < end) {
          setCount(Math.round(start));
          requestAnimationFrame(animate);
        } else {
          setCount(end);
        }
      };
      animate();
    }
  }, [inView, value]);
  
  return (
    <h3 ref={ref} className="text-5xl text-[#47E84B] header mb-2">
      {count.toLocaleString()}{value.replace(/\d+/g, "")}
    </h3>
  );
}

const Home = () => {
  return (
    <>
      {/* HERO */}
      <section className="relative bg-cover bg-center h-screen" style={{ backgroundImage: `url(${homeBg})` }}>
        
        <motion.div
          className="relative h-full px-4 md:px-8 lg:px-24 lg:pt-[10rem] flex flex-col justify-center items-center text-center lg:text-left lg:block"
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
        >
          <h1 className="text-primary text-4xl md:text-6xl font-medium header lg:leading-[5rem]">
            <span className="text-[#011627]">Leave Your </span> Sneakers<br />
            <span className="text-[#011627]">In our </span> Care
          </h1>
          <p className="text-[#011627] text-lg mt-4 max-w-xl">
            Getting your footwear cleaned has never been so easy. We pick up your dirty kicks, Klean them by hand, and then deliver your Kleankickx to you.
          </p>
          <motion.div variants={zoomIn} initial="hidden" animate="visible" className="mt-8">
            <Link to="/services" className="bg-[#011627] text-white px-6 py-3 inline-block hover:bg-[#011627]/90 transition font-medium">
              Schedule a Klean
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-[#11B59C] relative overflow-hidden">
        {/* decorative blobs */}
        <div className="absolute h-40 w-40 left-[30rem] bg-[#40EAD2]/40 rounded-full blur-2xl" />
        <div className="absolute h-40 w-40 top-40 right-[30rem] bg-[#40EAD2]/40 rounded-full blur-2xl" />
        <div className="absolute h-40 w-40 -top-10 right-[10rem] bg-[#40EAD2]/40 rounded-full blur-2xl" />

        <motion.div
          className="px-4 md:px-8 lg:px-24 py-20"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          <motion.h2 variants={fadeInUp} className="text-2xl md:text-5xl text-center font-bold text-black header mb-12">
            How It Works: <span className="text-white">In 3 Easy Steps</span>
          </motion.h2>

          <div className="flex flex-col md:flex-row items-center justify-center gap-8">
            {[
              {
                step: '1',
                title: 'Schedule a Klean',
                text: 'Schedule your klean via our online channels. Our courier will reach out at the appointed time.',
              },
              {
                isArrow: true,
                img: arrow1,
              },
              {
                step: '2',
                title: 'Hand in Your Sneakers',
                text: 'Our team of expert sneaker technicians will meticulously clean and restore your shoes to your exact specifications.',
              },
              {
                isArrow: true,
                img: arrow2,
              },
              {
                step: '3',
                title: 'Receive Your KleanKickx',
                text: "Get your sneakers sparkling klean in just 72 hours!. We will reach out to you to confirm your availability for the delivery of your refreshed sneakers."
              },
            ].map((item, idx) => (
              item.isArrow ? (
                <motion.img key={idx} src={item.img} alt="arrow" className="w-20 mx-auto rotate-90 md:rotate-0" variants={fadeIn} custom={idx} />
              ) : (
                <motion.div key={idx} variants={fadeIn} custom={idx}>
                  <h1 className="text-2xl text-white header">{item.step}</h1>
                  <h3 className="text-xl font-medium text-white header mt-2">{item.title}</h3>
                  <p className="text-black mt-2 max-w-xs mx-auto md:mx-0">{item.text}</p>
                </motion.div>
              )
            ))}
          </div>
        </motion.div>
      </section>

      {/* SERVICES */}
      <section className="px-4 md:px-8 lg:px-24 py-20">
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          {[{
            img: standardClean,
            title: 'Standard Clean (Sneaker Cleaning)',
          }, {
            img: unyellowing,
            title: 'Decolorization (Unyellowing)',
          }, {
            img: deepClean,
            title: 'Deep Klean (Intensive Sneaker Cleaning)',
          }].map((service, i) => (
            <motion.div key={i} variants={fadeIn} custom={i} className="group">
              <Link to="/services">
                <div className="bg-white border border-gray-200 rounded-lg shadow-lg hover:shadow-2xl transition duration-300 hover:border-primary overflow-hidden">
                  <img src={service.img} alt={service.title} className="w-full h-72 object-contain rounded-t-lg group-hover:scale-105 transition" />
                  <div className="p-6"><h3 className="text-lg text-gray-800">{service.title}</h3></div>
                  <div className="px-6 py-2 flex gap-4 items-center border-t border-gray-200">
                    <p className="text-primary/50 text-lg line-through">GH₵135.00</p>
                    <p className="text-primary font-bold text-lg">GH₵120.00</p>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* STATISTICS & CAROUSEL */}
      <section className="px-4 md:px-8 lg:px-24 py-20 bg-[#011627] text-center">
        <motion.h2 variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-3xl md:text-5xl font-bold text-white header mb-16">
          Let's Talk Numbers
        </motion.h2>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-10"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {[
                { label: 'Happy Clients', value: '450+' },
                { label: 'Sneakers Cleaned', value: '1,200+' },
                { label: 'CO2 Emissions Reduced', value: '+21,000Kg' },
                ].map((stat, i) => (
                <motion.div key={i} variants={zoomIn}>
                    <AnimatedNumber value={stat.value} />
                    <p className="text-lg text-white">{stat.label}</p>
                </motion.div>
            ))}
        </motion.div>

        {/* Carousel */}
        <motion.h2 variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-6xl font-bold text-primary header mt-20 mb-10">
          <span className="text-white">Before &</span> After
        </motion.h2>
        <ShoeCarousel />
      </section>

      {/* CARE */}
      <section className="relative h-[30rem] bg-cover bg-center" style={{ backgroundImage: `url(${kleankickxCare})` }}>
        <motion.div
          className="relative z-10 h-full pt-[4rem] px-4 md:px-8 lg:px-24 text-center flex flex-col items-center text-white"
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          <h2 className="text-3xl md:text-5xl font-bold text-[#9CDD9D] header mb-6">KleanKickx Sneaker Care</h2>
          <p className="text-white max-w-2xl text-center text-lg">
             We’re your one-stop shop for reviving your beloved sneakers. Whether athlete, collector, or casual wearer—we bring them back to life.
          </p>
        </motion.div>
      </section>

      {/* ▓▓▓ WHO WE ARE ▓▓▓ */}
      <section className="bg-cover bg-no-repeat" style={{ backgroundImage: `url(${whoWeAre})` }}>
        <motion.div
          className="px-4 md:px-8 lg:px-24 py-16 lg:py-[8rem] max-w-4xl"
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          <h2 className="text-3xl md:text-5xl font-bold text-[#1C7C76] header mb-6">Who We Are</h2>
          <p className="text-[#011627] mb-6 text-lg">
            At Kleankickx Sneaker Care, we combine a love for sneakers with the power of technology to create a platform that drives sustainability and community impact. As a tech-driven company, we’re building innovative solutions to extend the life of footwear, reduce waste, and empower communities. Through initiatives, like KleanFam, KleanKids, and Kickx CTRL, we promote proper sneaker care, support underprivileged children with school essentials, and recycle worn-out sneakers into valuable products—making a lasting impact, one sneaker at a time.
          </p>
          <Link to="/about-us" className="bg-[#1C7C76] text-white px-6 py-3 inline-block hover:bg-[#1C7C76]/90 transition font-medium">
            Learn More
          </Link>
        </motion.div>
      </section>

      {/* ▓▓▓ TIPS & FOOTER ▓▓▓ */}
      <KleanTips />
      <Footer />
    </>
  );
};

export default Home;
