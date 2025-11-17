import { Link } from 'react-router-dom';
import { HomeIcon, ArrowLeftIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import Footer from '../components/Footer';

const NotFound = () => {
  return (
    <>
    <div className="bg-gradient-to-br  from-blue-50 via-white to-purple-50 flex flex-col items-center justify-center px-4 pt-8">
      <div className="max-w-4xl w-full">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-32 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative">
          {/* Main Content */}
          <div className="text-center mb-12">
            <div className="flex justify-center mb-8">
              <div className="relative">
                <div className="w-32 h-32 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center shadow-lg">
                  <ExclamationTriangleIcon className="w-16 h-16 text-red-500" />
                </div>
                <div className="absolute -top-2 -right-2 bg-white rounded-full p-3 shadow-lg">
                  <span className="text-2xl font-bold text-gray-900">404</span>
                </div>
              </div>
            </div>
            
            <h1 className="text-6xl md:text-8xl font-black text-gray-900 mb-4">
              4<span className="text-primary">0</span>4
            </h1>
            
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">
              Page Not Found
            </h2>
            
            <p className="text-sm  text-gray-600 max-w-md mx-auto leading-relaxed">
              Oops! The page you're looking for seems to have wandered off into the digital wilderness. 
              Let's get you back on track.
            </p>
          </div>


          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Link
              to="/"
              className="group flex items-center gap-3 bg-primary hover:bg-primary-dark text-white font-semibold py-4 px-8 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              <HomeIcon className="w-5 h-5" />
              Back to Homepage
            </Link>
            
            <button
              onClick={() => window.history.back()}
              className="group flex items-center gap-3 bg-white hover:bg-gray-50 text-gray-700 font-semibold py-4 px-8 rounded-xl border border-gray-200 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl cursor-pointer"
            >
              <ArrowLeftIcon className="w-5 h-5" />
              Go Back
            </button>
          </div>

        
        </div>
      </div>

    </div>
    <Footer />
    </>
  );
};

export default NotFound;