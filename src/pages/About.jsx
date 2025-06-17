import { motion } from 'framer-motion';
import bgImage from '../assets/about_bg.png';
import gumShoe from '../assets/gumshoes.png';
import shoeIcon from '../assets/shoe_icon.png';
import joinMovement from '../assets/join_movement.png';
import Footer from '../components/Footer';


const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6 },
  },
};

const slideLeft = {
  hidden: { opacity: 0, x: -100 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.8 } },
};

const slideRight = {
  hidden: { opacity: 0, x: 100 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.8 } },
};

const stagger = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.25 },
  },
};


const About = () => (
  <div className="bg-white">
    {/* HERO */}
    <section
      className="relative bg-cover bg-center h-[30rem] md:h-[40rem] lg:h-[40rem]"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <div className="absolute inset-0 bg-black/40" />
      <motion.div
        className="relative h-full flex flex-col justify-center items-center md:items-start px-4 md:px-8 lg:px-24"
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
      >
        <h1 className="text-white text-4xl md:text-6xl font-bold header">
          <span className="text-secondary">About </span>Us
        </h1>
        <p className="text-white text-lg md:text-xl mt-[2rem] max-w-2xl">
            At Kleankickx Sneaker Care, we believe that every step matters—not just for style and comfort, but for the planet. We harness the power of technology to drive sustainability in the footwear industry, tackling the environmental impact of footwear waste in Ghana and across Africa.
        </p>
      </motion.div>
    </section>


    {/* WHY WE EXIST */}
    <section className="px-4 md:px-8 lg:px-24 py-16">
      <motion.div
        className="flex flex-col md:flex-row gap-10 items-center"
        variants={stagger}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
      >
        <motion.img
          src={gumShoe}
          alt="Gumshoe"
          className="w-full md:w-1/2 object-cover"
          variants={slideLeft}
        />
        <motion.div variants={slideRight} className="max-w-xl space-y-6">
          <h3 className="text-primary header text-3xl md:text-5xl font-bold">Why We Exist</h3>
          <p className="text-gray-700 text-lg">
            Africa discards over 300 million pairs of shoes annually. In Ghana, many end up in landfills, polluting soil and water. Kleankickx is changing this narrative by promoting care, reuse, and responsible disposal through technology‑driven solutions.
          </p>
        </motion.div>
      </motion.div>
    </section>

    {/* APPROACH & VALUES */}
    <section className="bg-deep-gray py-16 px-4 md:px-8 lg:px-24">
      <motion.div
        className="flex flex-col lg:flex-row gap-16"
        variants={stagger}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
      >
        {/* Approach */}
        <motion.div variants={fadeInUp} className="flex-1 space-y-6">
          <h3 className="text-primary header text-3xl md:text-5xl font-bold">Our Approach</h3>
          <p className="text-white text-lg">We are reimagining the footwear industry through innovative, tech-driven solutions to reduce waste and create a circular economy.</p>
          <motion.ul variants={stagger} className="space-y-6">
            {["Care and Restoration", "Sustainable Solutions", "Circular Economy Initiatives"].map((title, i) => (
              <motion.li key={i} variants={fadeInUp} className="flex gap-3">
                <img src={shoeIcon} alt="icon" className="w-8 h-8 mt-1" />
                <div>
                  <p className="text-xl font-bold text-white">{title}</p>
                  <p className="text-white text-sm">
                    {i === 0 && 'Using our platform, we offer premium sneaker cleaning and restoration services to extend the life of footwear, reducing the need for new purchases and minimizing waste.'}
                    {i === 1 && 'By leveraging technology, we educate customers and collaborate with local partners to promote sustainable practices in footwear consumption and disposal.'}
                    {i === 2 && 'We utilize our tech platform to partner with recycling programs and local artisans, repurposing unusable shoes into innovative products and reducing waste sent to landfills.'}
                  </p>
                </div>
              </motion.li>
            ))}
          </motion.ul>
        </motion.div>

        {/* Values */}
        <motion.div variants={fadeInUp} className="flex-1 space-y-6">
          <h3 className="text-primary header text-3xl md:text-5xl font-bold">Our Values</h3>
          <p className="text-white text-lg max-w-xl">At Kleankickx Sneaker Care, our mission is driven by a steadfast commitment to making a difference.</p>
          <motion.ul variants={stagger} className="space-y-6">
            {["Sustainability First", "Community Impact", "Excellence in Care"].map((title, i) => (
              <motion.li key={i} variants={fadeInUp} className="flex gap-3">
                <img src={shoeIcon} alt="icon" className="w-8 h-8 mt-1" />
                <div>
                  <p className="text-xl font-bold text-white">{title}</p>
                  <p className="text-white text-sm">
                    {i === 0 && 'We are committed to reducing shoe waste and its environmental impact in Ghana and across Africa through technological innovation.'}
                    {i === 1 && 'Through our platform, we empower individuals and communities to adopt sustainable habits and make informed choices.'}
                    {i === 2 && 'We pride ourselves on providing top-tier sneaker cleaning, restoration, and sustainable solutions, ensuring that footwear lasts longer and has less environmental impact.'}
                  </p>
                </div>
              </motion.li>
            ))}
          </motion.ul>
        </motion.div>
      </motion.div>
    </section>

    {/* JOIN OUR MOVEMENT */}
    <section
      className="relative bg-cover bg-center"
      style={{ backgroundImage: `url(${joinMovement})` }}
    >
      <div className="absolute inset-0 bg-black/40" />
      <motion.div
        className="relative px-4 md:px-8 lg:px-24 py-20 text-center max-w-3xl mx-auto"
        variants={fadeInUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
      >
        <h3 className="text-primary header text-3xl md:text-5xl font-bold mb-6">Join Our Movement</h3>
        <p className="text-white text-lg">
          Every sneaker is a story—and a responsibility. By combining technology with climate‑conscious strategy, we pave the way for a sustainable future. Join us and make an impact, one restored sneaker at a time.
        </p>
      </motion.div>
    </section>

    {/* FOOTER */}
    <Footer />
  </div>
);

export default About;