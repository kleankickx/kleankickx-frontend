import { Link } from 'react-router-dom';
import homeBg from '../assets/home_bg.png';
import arrow1 from '../assets/arrow1.png';
import arrow2 from '../assets/arrow2.png';
import standardClean from '../assets/standardClean.png';
import deepClean from '../assets/deep_clean.png';
import unyellowing from '../assets/unyellowing.png';


const Home = () => {
  return (
    <>
      {/* hero section */}
        <div className="bg-cover bg-center h-screen" style={{ backgroundImage: `url(${homeBg})` }}>
            <div className="h-full px-4 md:px-8 lg:px-24 pt-[14rem]">
                <h1 className="text-primary text-3xl md:text-6xl font-medium header leading-20">
                    <span className='text-[#011627]'>Leave Your</span>
                
                    <span> Sneakers</span> <br /> <span className='text-[#011627]'> In our</span>
                    <span> Care</span>
                </h1>
                <p className="text-[#011627] text-lg mt-4 max-w-xl">
                    Getting your footwear cleaned has never been so easy. We pick up your dirty kicks, Klean them by hand, and then deliver your Kleankickx to you.
                </p>


                {/* cta button */}
                <div className="">
                    <Link to="/services" className="bg-[#011627] text-white px-6 py-3  mt-8 inline-block hover:bg-[#011627]/90 transition duration-200 font-medium">
                    Schedule a Klean 
                    </Link>
                </div>
            </div>


        </div>

        {/* how it works */}
        <div className='bg-[#11B59C] relative overflow-hidden'>
            <div className="absolute h-[10rem] w-[10rem] left-[30rem] bg-[#40EAD2]/40 rounded-full blur-lg"></div>
            <div className="absolute h-[10rem] w-[10rem] top-[10rem] right-[30rem] bg-[#40EAD2]/40 rounded-full blur-lg"></div>
            <div className="absolute h-[10rem] w-[10rem] top-0 right-[10rem] bg-[#40EAD2]/40 rounded-full blur-lg"></div>
          

            <div className="px-4 md:px-8 lg:px-24 py-16">
                <h2 className="text-2xl md:text-5xl text-center font-bold text-black header mb-8">How It Works:
                    <span className="text-white"> In 3 Easy Steps</span>
                </h2>

               
                <div className="relative">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <div className="">
                            <h1 className='text-3xl header text-white'>1</h1>
                            <h3 className="text-2xl font-medium text-white header mt-2">Schedule a Klean</h3>
                            <p className="text-black mt-2">Schedule your klean via our online channels. Our courier will reach out at the appointed time.
                            </p>
                        </div>
                        <div>
                            <img src={arrow1} alt="Arrow" className="w-[8rem] mx-auto rotate-90 md:rotate-0" />
                        </div>
                        <div className="">
                            <h1 className='text-3xl header text-white'>2</h1>
                            <h3 className="text-2xl font-medium text-white header mt-2">Hand in Your Sneakers</h3>
                            <p className="text-black mt-2">Our team of expert sneaker
                                technicians will meticulously clean
                                and restore your shoes to your
                                exact specifications.
                            </p>
                        </div>
                        <div>
                            <img src={arrow2} alt="Arrow" className="w-[8rem] mx-auto rotate-90 lg:rotate-0" />
                        </div>
                        <div className="">
                            <h1 className='text-3xl header text-white'>3</h1>
                            <h3 className="text-2xl font-medium text-white header mt-2">Receive Your KleanKickx</h3>
                            <p className="text-black mt-2">Schedule your klean via our Get your sneakers sparkling klean
                            in just 72 hours!. We will reach out
                            to you to confirm your availability
                            for the delivery of your refreshed
                            sneakers.
                            </p>
                        </div>
                    </div>


                </div>

            </div>
        </div>

        <div className="">
            <div className="px-4 md:px-8 lg:px-24 py-16">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* shoe cards */}
                    <Link to="/services">
                    <div className="bg-white border border-gray-200 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300">
                        <div className="">
                            <img src={standardClean} alt="Standard Clean" className="w-full h-72 object-contain rounded-t-lg" />
                        </div>
                        <div className="p-6">
                            <h3 className="text-xl text-gray-800">Standard Clean</h3>
                            
                        </div>
                        {/* previous price and current price */}
                        <div className="px-6 py-2 flex gap-4 items-center border-t border-gray-200">
                            <p className="text-gray-600 line-through header"> GH₵135.00</p>
                            <p className="text-primary font-bold text-lg header"> GH₵120.00</p>
                        </div>
                    </div>
                    </Link>
                </div>
            </div>
        </div>

    </>

  );
};

export default Home;
