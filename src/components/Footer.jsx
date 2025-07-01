import footerBg from '../assets/footer_bg.png';
import { FaXTwitter } from "react-icons/fa6";
import { FaInstagram } from "react-icons/fa";
import { motion } from "framer-motion";

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

const Footer = () => {
  return (
    <footer
      className="text-white py-16 h-full relative"
      style={{ backgroundImage: `url(${footerBg})`, backgroundSize: 'cover' }}
    >
      {/* overlay */}
      <div className="absolute inset-0 bg-black/70"></div>

      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 gap-[4rem] px-4 md:px-16 lg:px-24 relative z-10"
        variants={fadeInUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <div>
          <h3 className="text-4xl font-bold header text-primary mb-4">Our Location</h3>
          {/* map */}
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3970.5545659560976!2d-0.22692922603032634!3d5.632567832877106!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xfdf99b47241bab3%3A0xd1639f177d0d42f6!2sKleankickx%20Sneaker%20Care!5e0!3m2!1sen!2sgh!4v1751371309949!5m2!1sen!2sgh"
            height="300"
            style={{ border: 0, width: "100%" }}  // Changed from string to object
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>

        <div>
          <h3 className="text-4xl font-bold header text-primary">Address</h3>
          <p className="mt-4 text-lg">+233 53 627 8834</p>
          <p className="mt-2 text-lg">info@kleankickx.com</p>
          <p className="mt-2 text-lg">Golf Hills St. Accra, Ghana</p>

          {/* Social Media Links */}
          <div className="mt-6 flex space-x-4">
            <a
              href="https://twitter.com/KleanKickx"
              target="_blank"
              rel="noopener noreferrer"
              className="text-2xl text-white hover:text-primary transition-colors"
            >
              <FaXTwitter />
            </a>
            <a
              href="https://instagram.com/kleankickx"
              target="_blank"
              rel="noopener noreferrer"
              className="text-2xl text-white hover:text-primary transition-colors"
            >
              <FaInstagram />
            </a>
          </div>

          {/* copyright */}
          <div className="mt-8 text-lg">
            <p>&copy; {new Date().getFullYear()} KleanKickx. All rights reserved.</p>
          </div>
        </div>
      </motion.div>
    </footer>
  );
};

export default Footer;
