import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaCopy, 
  FaClock, 
  FaCheck, 
  FaArrowRight ,
    FaSpinner,
} from 'react-icons/fa';

const Promotion = () => {
    const [promotions, setPromotions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [copiedCode, setCopiedCode] = useState(null);
    const { api } = useContext(AuthContext);

    const handleCopy = (code) => {
        navigator.clipboard.writeText(code).then(() => {
            setCopiedCode(code);
            setTimeout(() => setCopiedCode(null), 2000);
        }).catch(err => {
            console.error('Failed to copy text: ', err);
        });
    };

    useEffect(() => {
        const getPromotions = async () => {
            try {
                const response = await api.get('/api/promotions/');
                if (response.data && Array.isArray(response.data)) {
                    console.log(response.data)
                    setPromotions(response.data);
                } else {
                    setPromotions([]);
                }
                setError(null);
            } catch (err) {
                console.error("Failed to fetch promotions:", err);
                setError("Failed to fetch promotions. Please try again later.");
            } finally {
                setLoading(false);
            }
        };

        getPromotions();
    }, [api]);

    if (loading) {
        return (
            <div className="flex items-center flex-col justify-center h-screen">
                <FaSpinner className="animate-spin text-4xl text-primary" />
                <p className="text-gray-700">Loading promotions...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-red-500">{error}</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 px-4 py-8">
            <div className="lg:px-24">
                <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Current Promotions</h1>
                <p className="text-gray-600 mb-12 max-w-2xl">
                    Take advantage of our latest promotions and discounts! Use the promo codes below to save on your next order.
                </p>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={promotions.length}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className={`grid gap-6 ${promotions.length === 1 ? 'grid-cols-1' : 'md:grid-cols-2 lg:grid-cols-3'}`}
                    >
                        {promotions.length > 0 ? (
                            promotions.map((promo, index) => {
                                const discount = parseFloat(promo.discount_percentage);
                                const isExpired = new Date(promo.end_date) <= new Date();
                                const daysLeft = Math.ceil((new Date(promo.end_date) - new Date()) / (1000 * 60 * 60 * 24));

                                return (
                                    <motion.div
                                        key={promo.id}
                                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        whileHover={{ scale: 1.03 }}
                                        className="relative rounded-3xl overflow-hidden shadow-lg group cursor-pointer"
                                    >
                                        {/* Flyer Image */}
                                        <motion.img
                                            src={promo.image}
                                            alt={promo.name}
                                            className="w-full h-80 object-contain transform transition-transform duration-700 group-hover:scale-110"
                                        />

                                        {/* Overlay */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/70" />

                                        {/* Content */}
                                        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                                            <div className="flex items-center justify-between mb-3">
                                                <h3 className="text-2xl font-bold">{promo.name}</h3>
                                                <div className="text-right">
                                                    <div className="text-3xl font-extrabold">{discount}%</div>
                                                    <div className="text-sm">OFF</div>
                                                </div>
                                            </div>

                                            {/* Promo Code */}
                                            {!isExpired && (
                                                <div className="flex items-center justify-between bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2 mb-4">
                                                    <div className="font-mono font-bold">{promo.code}</div>
                                                    <motion.button
                                                        whileHover={{ scale: 1.1 }}
                                                        whileTap={{ scale: 0.9 }}
                                                        onClick={() => handleCopy(promo.code)}
                                                        className="bg-white text-gray-900 w-9 h-9 rounded-full flex items-center justify-center"
                                                    >
                                                        {copiedCode === promo.code ? (
                                                            <FaCheck className="text-green-500" />
                                                        ) : (
                                                            <FaCopy />
                                                        )}
                                                    </motion.button>
                                                </div>
                                            )}

                                            {/* Validity */}
                                            <div className="flex items-center justify-between text-sm">
                                                <div className="flex items-center gap-2">
                                                    <FaClock className="text-xs" />
                                                    {isExpired ? (
                                                        <span className="text-red-400">Expired</span>
                                                    ) : daysLeft <= 7 ? (
                                                        <span>Ends in {daysLeft} day{daysLeft !== 1 ? 's' : ''}</span>
                                                    ) : (
                                                        <span>Valid until {new Date(promo.end_date).toLocaleDateString()}</span>
                                                    )}
                                                </div>

                                                {!isExpired && (
                                                    <motion.button
                                                        whileHover={{ x: 5 }}
                                                        className="flex items-center gap-1 text-sm font-medium hover:underline"
                                                    >
                                                        Use Code
                                                        <FaArrowRight className="text-xs" />
                                                    </motion.button>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })
                        ) : (
                            <div className="col-span-full text-center py-20">
                                <p className="text-gray-600">No promotions available</p>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};

export default Promotion;
