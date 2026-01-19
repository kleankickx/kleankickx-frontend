import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useInView } from "react-intersection-observer";
import {useState, useEffect, useContext} from 'react';
import axios from 'axios';
import { FaSpinner, FaChevronDown, FaChevronUp } from 'react-icons/fa6';
import { AuthContext } from '../context/AuthContext';

// assets & components
import arrow1 from '../assets/arrow1.png';
import arrow2 from '../assets/arrow2.png';
import ShoeCarousel from '../components/ShoeCarousel';
import kleankickxCare from '../assets/kleankickx_care.png';
import whoWeAre from '../assets/who_we_are.png';
import KleanTips from '../components/KleanTips';
import Footer from '../components/Footer';
import heroImage from '../assets/home_hero.png';

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
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hoveredDescriptionId, setHoveredDescriptionId] = useState(null);
  const [expandedDescriptions, setExpandedDescriptions] = useState({});
  const { discounts } = useContext(AuthContext);
  
  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:10000';
  const signupDiscount = discounts?.find(d => d.type === 'Signup Discount');

  useEffect(() => {
    const fetchServices = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${backendUrl}/api/services/`);
        setServices(response.data);
      } catch (err) {
        setError('Failed to load services.');
        console.error('Error fetching services:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, []);

  // Function to calculate previous price based on current price
  const getPreviousPrice = (currentPrice) => {
    const price = parseFloat(currentPrice);
    if (price === 50.00) return 'GH₵70.00';
    if (price === 100.00) return 'GH₵120.00';
    if (price === 120.00) return 'GH₵150.00';
    // Default calculation: add 40% for demo purposes
    return `GH₵${(price * 1.4).toFixed(2)}`;
  };

  // Function to get service status for banner
  const getServiceStatus = (serviceName) => {
    const name = serviceName.toLowerCase();
    const isPriority = name.includes('priority') || name.includes('express') || name.includes('rush');
    
    return {
      isPriority,
      bannerText: isPriority ? 'NEXT DAY' : '72 HOURS',
      badgeText: isPriority ? 'delivered next day' : 'delivered in 72h'
    };
  };

  const toggleDescription = (serviceId) => {
    setExpandedDescriptions(prev => ({
      ...prev,
      [serviceId]: !prev[serviceId]
    }));
  };

  return (
    <>
      {/* HERO */}
      <section className="bg-[#E5FDFF] h-full lg:h-screen">
        <section className="py-[4rem] px-4 md:px-8 lg:px-24">
          <div className="flex flex-col lg:flex-row items-center justify-between h-full text-center lg:text-left">
            <motion.div
              className=""
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
                <Link to="/services" className="bg-[#011627] rounded text-white px-6 py-3 inline-block hover:bg-[#011627]/90 transition font-medium">
                  Schedule a Klean
                </Link>
              </motion.div>
            </motion.div>

            <motion.div
              className="mt-12 lg:mt-0"
              variants={fadeInUp}
            >
              <img src={heroImage} alt="Hero Sneakers" className="lg:w-[35rem]" />
            </motion.div>
          </div>
        </section>
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
        <h2 className="text-3xl md:text-4xl font-bold text-center text-[#011627] header mb-12">
          Our Premium Services
        </h2>
        
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64">
            <FaSpinner className="animate-spin h-10 w-10 text-primary mb-4" />
            <p className="text-gray-600">Loading services...</p>
          </div>
        ) : error ? (
          <div className="text-center text-red-600 bg-red-50 p-6 rounded-lg max-w-md mx-auto">
            <p className="mb-2">Failed to load services</p>
            <button 
              onClick={() => window.location.reload()}
              className="text-sm text-primary underline"
            >
              Try again
            </button>
          </div>
        ) : (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
          >
            {services.slice(0, 3).map((service, i) => {
              const status = getServiceStatus(service.name);
              const previousPrice = getPreviousPrice(service.price);
              const isExpanded = expandedDescriptions[service.id];
              
              return (
               <Link to="/services"> 
                  <motion.div key={service.id} variants={fadeIn} custom={i} className="group">
                    <div className="bg-white border border-gray-200 rounded-lg shadow-lg hover:shadow-2xl transition duration-300 hover:border-primary overflow-hidden h-full flex flex-col relative">
                      {/* Slanted Delivery Ribbon */}
                      <div className="absolute top-0 right-0 w-28 h-28 overflow-hidden z-20 pointer-events-none">
                        <div className={`absolute top-0 right-0 w-[140%] h-7 flex items-center justify-center text-[10px] font-black uppercase tracking-widest text-white shadow-sm transform translate-x-[30%] translate-y-[80%] rotate-45 
                          ${status.isPriority ? 'bg-gradient-to-r from-orange-500 to-yellow-500' : 'bg-gradient-to-r from-emerald-600 to-green-500'}`}>
                          {status.bannerText}
                        </div>
                      </div>

                      {/* Discount Badge */}
                      {signupDiscount && (
                        <div className="absolute top-4 left-0 bg-primary text-white text-[10px] font-bold px-3 py-1 rounded-r-full shadow-lg z-10">
                          {parseInt(signupDiscount.percentage)}% OFF
                        </div>
                      )}

                      <Link to="/services" className="flex-grow">
                        <div className="relative h-72 overflow-hidden bg-gray-100">
                          <img 
                            src={service.image} 
                            alt={service.name} 
                            className="w-full h-full object-contain p-4 group-hover:scale-105 transition duration-500" 
                          />
                        </div>
                      </Link>
                      
                      <div className="p-6 flex flex-col flex-grow">
                        <h3 className="text-lg font-bold text-gray-800 mb-2">{service.name}</h3>
                        
                        {/* Delivery Badge */}
                        <div className={`inline-flex items-center gap-1.5 w-fit px-2.5 py-1 rounded-full text-[10px] font-semibold border mb-4 
                          ${status.isPriority ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {status.badgeText}
                        </div>

                        {/* Description with Tooltip (Desktop) and Read More (Mobile) */}
                        <div className="relative mb-6 flex-grow">
                          {/* Desktop: Tooltip on hover */}
                          <div 
                            className="hidden md:block"
                            onMouseEnter={() => setHoveredDescriptionId(service.id)}
                            onMouseLeave={() => setHoveredDescriptionId(null)}
                          >
                            <p className="text-gray-500 text-sm line-clamp-2 cursor-help">
                              {service.description}
                            </p>
                            
                            <AnimatePresence>
                              {hoveredDescriptionId === service.id && (
                                <motion.div 
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: 10 }}
                                  className="absolute bottom-full left-0 mb-2 w-full z-50 bg-gray-900 text-white text-xs p-3 rounded-lg shadow-xl"
                                >
                                  {service.description}
                                  {/* Tooltip Arrow */}
                                  <div className="absolute top-full left-5 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-gray-900"></div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>

                          {/* Mobile: Read More Button */}
                          <div className="md:hidden">
                            <div className="relative">
                              <p className={`text-gray-500 text-sm transition-all duration-300 ${isExpanded ? '' : 'line-clamp-2'}`}>
                                {service.description}
                              </p>
                              
                              {/* Fade effect for non-expanded text */}
                              {!isExpanded && service.description.length > 100 && (
                                <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-white to-transparent pointer-events-none"></div>
                              )}
                            </div>
                            
                            {service.description.length > 100 && (
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  toggleDescription(service.id);
                                }}
                                className="mt-2 flex items-center gap-1 text-primary text-xs font-medium hover:text-primary/80 transition-colors"
                              >
                                {isExpanded ? (
                                  <>
                                    <FaChevronUp className="w-3 h-3" />
                                    Read Less
                                  </>
                                ) : (
                                  <>
                                    <FaChevronDown className="w-3 h-3" />
                                    Read More
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="border-t border-gray-200 pt-4 mt-auto">
                          <div className="flex gap-4 items-center">
                            <p className="text-primary/50 text-lg line-through">{previousPrice}</p>
                            <p className="text-primary font-bold text-lg">GH₵{service.price}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
              </Link>
              );
            })}
          </motion.div>
        )}

        {services.length > 3 && (
          <div className="text-center mt-10">
            <Link 
              to="/services" 
              className="inline-flex items-center gap-2 bg-primary text-white px-8 py-3 rounded-lg hover:bg-primary/90 transition font-medium"
            >
              View All Services
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        )}
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
             We're your one-stop shop for reviving your beloved sneakers. Whether athlete, collector, or casual wearer, we bring them back to life.
          </p>
        </motion.div>
      </section>

      {/* WHO WE ARE */}
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
            At Kleankickx Sneaker Care, we combine a love for sneakers with the power of technology to create a platform that drives sustainability and community impact. As a tech-driven company, we're building innovative solutions to extend the life of footwear, reduce waste, and empower communities. Through initiatives, like KleanFam,KleanKids, and Kickx CTRL, we promote proper sneaker care, support underprivileged children with school essentials, and recycle worn-out sneakers into valuable products, making a lasting impact, one sneaker at a time.
          </p>
          <Link to="/about-us" className="bg-[#1C7C76] text-white px-6 py-3 inline-block hover:bg-[#1C7C76]/90 rounded transition font-medium">
            Learn More
          </Link>
        </motion.div>
      </section>

      {/* TIPS & FOOTER */}
      <KleanTips />
      <Footer />
    </>
  );
};

export default Home;