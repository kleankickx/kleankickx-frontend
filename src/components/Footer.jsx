import footerBg from '../assets/footer_bg.png';
import { FaXTwitter } from "react-icons/fa6";
import { FaInstagram, FaPhone, FaMapMarkerAlt } from "react-icons/fa";
import { motion } from "framer-motion";
import { IoMdMail } from "react-icons/io";

// Import your SDG images
import SDG11 from '../assets/sus-image-1.jpeg';
import SDG12 from '../assets/sus-image-2.jpeg';
import SDG13 from '../assets/sus-image-3.jpeg';

const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.6, 0.05, 0.01, 0.9],
    },
  },
};

const staggerChildren = {
  visible: {
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2,
    },
  },
};

const Footer = () => {
  const sdgs = [
    { src: SDG11, alt: "Sustainable Cities", title: "SDG 11" },
    { src: SDG12, alt: "Responsible Consumption", title: "SDG 12" },
    { src: SDG13, alt: "Climate Action", title: "SDG 13" },
  ];

  return (
    <footer className="relative overflow-hidden">
      {/* Background with gradient overlay */}
      <div className="absolute inset-0 z-0">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${footerBg})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black via-black/95 to-primary/20"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 pt-20 pb-12 px-4 px-4 lg:px-24">
        <div className="">
          {/* Logo & Branding Area - Can add logo here */}
          {/* <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">
              <span className="text-primary">Klean</span>Kickx
            </h2>
            <p className="text-gray-300 max-w-2xl mx-auto">
              Professional sneaker care and restoration services in Accra, Ghana
            </p>
          </div> */}

          {/* Grid Layout */}
          <motion.div 
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16"
            variants={staggerChildren}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
          >
            {/* Contact Info - Span 4 */}
            <motion.div 
              className="lg:col-span-4"
              variants={fadeInUp}
            >
              <h3 className="text-xl header font-semibold text-white mb-6 pb-2 border-b border-primary/30 inline-block">
                Get In Touch
              </h3>
              
              <div className="space-y-6">
                <div className="flex items-start group hover:translate-x-2 transition-transform duration-300">
                  <div className="bg-primary/10 p-3 rounded-lg mr-4 group-hover:bg-primary/20 transition-colors">
                    <FaPhone className="text-primary text-lg" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Phone Number</p>
                    <a 
                      href="tel:+233536278834" 
                      className="text-white hover:text-primary transition-colors text-lg font-medium"
                    >
                      +233 53 627 8834
                    </a>
                  </div>
                </div>

                <div className="flex items-start group hover:translate-x-2 transition-transform duration-300">
                  <div className="bg-primary/10 p-3 rounded-lg mr-4 group-hover:bg-primary/20 transition-colors">
                    <IoMdMail className="text-primary text-lg" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Email Address</p>
                    <a 
                      href="mailto:info@kleankickx.com" 
                      className="text-white hover:text-primary transition-colors text-lg font-medium break-all"
                    >
                      info@kleankickx.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start group hover:translate-x-2 transition-transform duration-300">
                  <div className="bg-primary/10 p-3 rounded-lg mr-4 group-hover:bg-primary/20 transition-colors">
                    <FaMapMarkerAlt className="text-primary text-lg" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-1 ">Our Location</p>
                    <p className="text-white text-lg font-medium">
                      Golf Hills St. Accra, Ghana
                    </p>
                  </div>
                </div>
              </div>

              {/* Social Links */}
              <div className="mt-8 pt-6 border-t border-white/10">
                <p className="text-gray-400 mb-4">Follow Us</p>
                <div className="flex space-x-4">
                  <a 
                    href="https://x.com/KleanKickxgh" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="bg-white/5 hover:bg-primary/20 p-3 rounded-lg transition-all duration-300 hover:scale-110"
                  >
                    <FaXTwitter className="text-xl text-white" />
                  </a>
                  <a 
                    href="https://instagram.com/kleankickxgh" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="bg-white/5 hover:bg-primary/20 p-3 rounded-lg transition-all duration-300 hover:scale-110"
                  >
                    <FaInstagram className="text-xl text-white" />
                  </a>
                </div>
              </div>
            </motion.div>

            {/* Map - Span 4 */}
            <motion.div 
              className="lg:col-span-4"
              variants={fadeInUp}
            >
              <h3 className="text-xl header font-semibold text-white mb-6 pb-2 border-b border-primary/30 inline-block">
                Visit Our Place
              </h3>
              
              <div className="rounded-xl overflow-hidden border-2 border-primary/20 shadow-2xl shadow-primary/10">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3970.5545659560976!2d-0.22692922603032634!3d5.632567832877106!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xfdf99b47241bab3%3A0xd1639f177d0d42f6!2sKleankickx%20Sneaker%20Care!5e0!3m2!1sen!2sgh!4v1751371309949!5m2!1sen!2sgh"
                  height="300"
                  style={{ border: 0, width: "100%" }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="w-full"
                />
              </div>
            </motion.div>

            {/* SDGs Commitment - Span 4 */}
            <motion.div 
              className="lg:col-span-4"
              variants={fadeInUp}
            >
              <h3 className="text-xl header font-semibold text-white mb-6 pb-2 border-b border-primary/30 inline-block">
                Our Sustainable Commitment
              </h3>
              
              <p className="text-gray-300 mb-8 leading-relaxed">
                We're dedicated to supporting the United Nations Sustainable Development Goals 
                through eco-friendly practices and responsible consumption in sneaker care.
              </p>
              
              <div className="grid grid-cols-3 gap-4 mb-8">
                {sdgs.map((sdg, index) => (
                  <motion.div 
                    key={index}
                    whileHover={{ scale: 1.05, y: -5 }}
                    className="group cursor-pointer"
                  >
                    <div className="relative overflow-hidden rounded-lg bg-white/5 p-2 border border-white/10 group-hover:border-primary/50 transition-all duration-300">
                      <img 
                        src={sdg.src} 
                        alt={sdg.alt} 
                        className="w-full h-24 object-cover rounded-md"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center p-2">
                        <span className="text-white text-xs font-medium">{sdg.title}</span>
                      </div>
                    </div>
                    <p className="text-gray-400 text-xs mt-2 text-center group-hover:text-white transition-colors">
                      {sdg.alt}
                    </p>
                  </motion.div>
                ))}
              </div>
              
            </motion.div>
          </motion.div>

          {/* Bottom Bar */}
          <motion.div 
            className="pt-8 border-t border-white/10"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-gray-400 text-sm">
                © {new Date().getFullYear()} KleanKickx Sneaker Care. All rights reserved.
              </p>
              
              <div className="flex items-center space-x-6">
                <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">
                  Privacy Policy
                </a>
                <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">
                  Terms of Service
                </a>
                <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">
                  FAQ
                </a>
              </div>
            </div>
            
          </motion.div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent"></div>
      <div className="absolute top-10 left-10 w-32 h-32 bg-primary/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-10 right-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl"></div>
    </footer>
  );
};

export default Footer;