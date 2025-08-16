import { motion } from 'framer-motion';
import { FiX, FiTruck, FiPackage,  } from 'react-icons/fi';

const LocationCard = ({ location, type, onClear }) => {
    const icon = type === 'delivery' ? <FiTruck className="text-blue-500" /> : <FiPackage className="text-green-500" />;
    const bgColor = type === 'delivery' ? 'bg-blue-50' : 'bg-green-50';
    const textColor = type === 'delivery' ? 'text-blue-800' : 'text-green-800';

    return (
        <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ duration: 0.3 }}
            className={`mt-3 p-4 ${bgColor} ${textColor} rounded-lg border border-gray-200`}
        >
            <div className="flex justify-between items-start">
                <div className="flex items-start">
                    <div className="mr-3 mt-1">{icon}</div>
                    <div>
                        <h3 className="font-semibold">{location.name}</h3>
                        <p className="text-sm mt-1">{location.address}</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                            <span className="px-2 py-1 bg-white rounded-md text-xs font-medium shadow-xs">
                                {location.region}
                            </span>
                            <span className="px-2 py-1 bg-white rounded-md text-xs font-medium shadow-xs">
                                {location.areaName}
                            </span>
                        </div>
                    </div>
                </div>
                <button
                    onClick={onClear}
                    className="text-gray-400 hover:text-gray-600 cursor-pointer"
                    aria-label={`Clear ${type} location`}
                >
                    <FiX />
                </button>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between items-center">
                <span className="font-medium">{type === 'delivery' ? 'Delivery Fee:' : 'Pickup Fee:'}</span>
                <span className="font-bold">GHS {location.cost.toFixed(2)}</span>
            </div>
        </motion.div>
    );
};

export default LocationCard