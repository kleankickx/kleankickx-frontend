import { motion } from "framer-motion";

const tips = [
  {
    icon: '',
    tag: 'TIPS',
    content: (
      <>
        <span className="font-semibold text-green-700">Store</span> your sneakers in a{' '}
        <span className="font-semibold text-gray-800">cool, dry</span> place to prevent mold and mildew growth.{' '}
        <span className="text-gray-800">Avoid</span> <span className="font-semibold">direct sunlight</span>, as it can cause colors to <span className="text-green-500 font-medium">fade</span>.
      </>
    ),
  },
  {
    icon: '💯',
    tag: '',
    content: (
      <>
        The only thing better than a new pair of sneakers is a <span className="text-green-700 font-semibold">clean</span> pair of sneakers.
      </>
    ),
  },
  {
    icon: '',
    tag: 'TIPS',
    content: (
      <>
        To <span className="text-green-700 font-semibold">maintain</span> the shape of your sneakers, especially if you're not wearing them <span className="text-green-700 font-semibold">regularly</span>, consider using <span className="text-green-600 font-semibold">sneaker shields</span> or <span className="text-green-600 font-semibold">shoe trees</span>. These help <span className="text-green-600 font-semibold">prevent</span> creasing and <span className="text-green-600 font-semibold">maintain</span> the original form of the shoe.
      </>
    ),
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 1) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.2,
      duration: 0.6,
      ease: [0.6, 0.05, 0.01, 0.99],
    },
  }),
};

const KleanTips = () => {
  return (
    <section className="py-12 bg-[#fdfcf8] px-4">
      <h2 className="text-2xl md:text-3xl font-semibold text-center mb-10">
        Klean Tips: A few tips to keep the soles sparkling
      </h2>
      <div className="flex flex-col md:flex-row justify-center gap-6 max-w-6xl mx-auto">
        {tips.map((tip, idx) => (
          <motion.div
            key={idx}
            className="bg-white shadow-md rounded-lg p-6 text-sm md:text-base w-full md:w-1/3 border border-gray-200 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 ease-in-out"
            custom={idx}
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl text-primary">{tip.icon}</span>
              {tip.tag && (
                <span className="text-green-600 text-xs font-bold border border-green-600 px-2 py-0.5 rounded-full">
                  {tip.tag}
                </span>
              )}
            </div>
            <p className="text-gray-800 leading-relaxed">{tip.content}</p>
            <p className="text-right text-[10px] font-semibold mt-6">KLEANKICK</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default KleanTips;
