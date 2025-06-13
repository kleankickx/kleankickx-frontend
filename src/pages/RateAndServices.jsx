import bgImage  from '../assets/hero_sec_rate_service.png';
import shoe1 from '../assets/shoes1.png';
import standardClean from '../assets/standard_clean.png';
import deepClean from '../assets/Deep-Klean.png';
import deYellow from '../assets/de_yellow.png';
import schedule from '../assets/schedule.svg';
import courierCall from '../assets/call.svg';
import diamond from '../assets/diamond.svg';
import delivery from '../assets/delivery.svg';
import priority from '../assets/priority.svg';
import shoe2 from '../assets/shoe2.png';
import Footer from '../components/Footer';

const RateAndServices = () => {
  return (
    <div className="bg-white">
        {/* bg image */}
        <div className="bg-cover bg-center h-[100vh]" style={{ backgroundImage: `url(${bgImage})` }}>
          <div className="h-full px-4 md:px-8 lg:px-24 pt-[8rem]">
            <h1 className="text-white text-3xl md:text-5xl font-bold header">
                <span className='text-primary'>Our </span>
                <span>Services</span>
            </h1>
            <p className="text-white text-lg md:text-xl mt-8">
                We offer a range of services to help you maintain a clean and healthy environment. <br />
                From regular cleaning to specialized deep cleaning, we've got you covered.
            </p>

            <p className="text-white text-lg md:text-xl mt-4">
                Our team is dedicated to providing top-notch service with a focus on
                <br />
                 quality and customer satisfaction.
            </p>
            
            {/* cta button */}
            <div className="mt-8">
              <a href="/services" className="bg-[#007F03] hover:bg-green-700 text-white px-6 py-3 rounded transition duration-200">
                Explore Our Services
              </a>
            </div>
            </div>
        </div>

        <div className="bg-[#1E1E1E]">
            <div className='grid grid-cols-1 md:grid-cols-2 gap-8 pt-[4rem]'>
            <div>
                <img src={shoe1} alt="Shoe" className='w-[100%] h-[100%] object-cover' />
            </div>
            <div className='flex flex-col justify-center items-start px-4 md:px-8 lg:px-22'>
                <h2 className="text-[#007F03] lg:text-6xl text-3xl font-bold mb-4 header">
                    We Clean All Types of Sneakers
                </h2>
                <p className="text-white text-lg mb-6">
                    No matter the style or material, we have the expertise and
                    experience to clean your sneakers to perfection. Our services
                    cover; High-tops and low-tops, Canvas, leather, suede, and
                    more. Every type of sneaker, from everyday wear to limited
                    editions
                </p>
            </div>
        </div>
        </div>

        {/* service pricing section */}
        <div className="bg-white py-16 px-4 md:px-8 lg:px-24">
            <h2 className="text-primary header text-6xl font-bold mb-[4rem] text-center">
                Service Pricing
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="border border-gray-300 rounded-lg">
                    <div className='h-[20rem] w-full'>
                        <img src={standardClean} alt="Standard Cleaning" className="w-full h-full object-contain rounded-t-lg" /> 
                    </div>
                    <div className="p-6">
                        <h3 className="text-xl  text-primary mb-4">Standard Cleaning</h3>
                        <div className="flex">
                            {/* checkmark icon */}
                            <svg className="w-6 h-6 text-black mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                            </svg>
                            <p className='text-gray-600'>Through the cleaning of the entire shoe, removing dirt, dust and everyday grime.</p>
                        </div>
                        <div className="flex mt-2">
                            {/* checkmark icon */}
                            <svg className="w-6 h-6 text-black mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                            </svg>
                            <p className='text-gray-600'>Through the cleaning of the entire shoe, removing dirt, dust and everyday grime.</p>
                        </div>

                        {/* price */}
                        <div className="mt-4 ">
                            <div className="bg-primary py-2 px-4 text-white w-fit">
                                <span className="tracking-widest">PRICE</span>
                                <span className="ml-2"> | </span>
                                <span className="ml-2 tracking-widest">
                                    GH₵ 50.00
                                </span>
                            </div>
                        </div>

                    </div>

                </div>
                <div className="border border-gray-300 rounded-lg">
                    <div className='h-[20rem] w-full'>
                        <img src={deepClean} alt="Deep Cleaning" className="w-full h-full object-contain rounded-t-lg" /> 
                    </div>
                    <div className="p-6">
                        <h3 className="text-xl  text-primary mb-4">Deep Kleaning</h3>
                        <div className="flex">
                            {/* checkmark icon */}
                            <svg className="w-6 h-6 text-black mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                            </svg>
                            <p className='text-gray-600'>A more intensive cleaning process that tackles stubborn
                            stains and deeply embedded dirt.
                            </p>
                        </div>
                        <div className="flex mt-2">
                            {/* checkmark icon */}
                            <svg className="w-6 h-6 text-black mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                            </svg>
                            <p className='text-gray-600'>Perfect for sneakers that require a more thorough
                            restoration.
                            </p>
                        </div>
                        {/* price */}
                        <div className="mt-4 ">
                            <div className="bg-primary py-2 px-4 text-white w-fit">
                                <span className="tracking-widest">PRICE</span>
                                <span className="ml-2"> | </span>
                                <span className="ml-2 tracking-widest">
                                    GH₵ 100.00
                                </span>
                            </div>
                        </div>
                    </div>

                </div>
                <div className="border border-gray-300 rounded-lg">
                    <div className='h-[20rem] w-full'>
                        <img src={deYellow} alt="Standard Cleaning" className="w-full h-full object-cover rounded-t-lg" /> 
                    </div>
                    <div className="p-6">
                        <h3 className="text-xl  text-primary mb-4">Decolorization (Un-yellowing)</h3>
                        <div className="flex">
                            {/* checkmark icon */}
                            <svg className="w-6 h-6 text-black mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                            </svg>
                            <p className='text-gray-600'>Eliminates unpleasant odors and leaves your sneakers
                            smelling fresh and clean.
                            </p>
                        </div>
                        <div className="flex mt-2">
                            {/* checkmark icon */}
                            <svg className="w-6 h-6 text-black mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                            </svg>
                            <p className='text-gray-600'>Ideal for sneakers that have been heavily worn or stored
                            for a long time.</p>
                        </div>

                        {/* price */}
                        <div className="mt-4 ">
                            <div className="bg-primary py-2 px-4 text-white w-fit">
                                <span className="tracking-widest">PRICE</span>
                                <span className="ml-2"> | </span>
                                <span className="ml-2 tracking-widest">
                                    GH₵ 120.00
                                </span>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

        </div>

        {/* customer experience section */}
        <div className="px-4 md:px-8 lg:px-24 py-16 bg-white">
        <h2 className="text-6xl font-bold mb-4 text-primary header text-center">
            Customer Experience
        </h2>
        <p className="text-gray-600 text-center text-lg">Seamless Sneaker Care</p>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-8">
            {[{
            icon: schedule,
            title: "Schedule a Pickup",
            desc: "Use the link below to schedule a pickup for your sneakers at your convenience.",
            link: "/services",
            linkText: "Schedule Now"
            }, {
            icon: courierCall,
            title: "Courier Contact",
            desc: "Expect a call from our courier on the scheduled day to confirm the details."
            }, {
            icon: diamond,
            title: "Premium Care",
            desc: "Your sneakers receive top-notch care, addressing specific cleaning needs with precision."
            }, {
            icon: delivery,
            title: "Swift Delivery",
            desc: "Within approximately 72 hours, your rejuvenated sneakers are delivered right to your doorstep."
            }, {
            icon: priority,
            title: "Priority Service",
            desc: "Need it faster? Opt for our priority service at an extra cost."
            }].map((card, idx) => (
            <div
                key={idx}
                className="p-6 border border-gray-300 rounded-lg hover:shadow-lg hover:scale-[1.02] z-10 transition duration-300 ease-in-out bg-white"
            >
                <img src={card.icon} alt={card.title} className="w-16 h-16 mb-4" />
                <h3 className="text-xl font-semibold text-primary mb-2">{card.title}</h3>
                <p className="text-gray-600">{card.desc}</p>
                {card.link && (
                <div className="mt-4">
                    <a
                    href={card.link}
                    className="bg-primary text-white px-4 py-2 rounded hover:bg-green-700 transition duration-200"
                    >
                    {card.linkText}
                    </a>
                </div>
                )}
            </div>
            ))}
        </div>
        </div>


        {/* tailored services section */}
        <div className="bg-white relative overflow-hidden lg:py-16 ">
            {/* Background image for large screens */}
            <div className="hidden lg:block absolute right-0 -top-20  h-[40rem] z-0">
                <img
                src={shoe2}
                alt="Background"
                className="w-[30rem] h-full object-contain"
                />
            </div>

            <div className="px-4 md:px-8 lg:px-24 flex flex-col lg:flex-row items-center lg:items-start gap-10 relative z-10">
                {/* Text content */}
                <div className="max-w-xl">
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 text-primary header">
                    Tailored Services For Your Needs
                </h2>
                <p className="text-gray-600 text-base md:text-lg mb-6">
                    At KleanKickx, we understand that sneakers aren’t just shoes;
                    they’re a statement, a passion, and a cherished part of your style.
                    Our mission is to ensure that every step you take is a confident
                    and klean one. Whether you’re an athlete, a collector, or
                    someone who simply loves to strut in stylish kicks, we’re here for you.
                </p>
                <a
                    href="/services"
                    className="bg-primary text-white px-6 py-3 rounded hover:bg-green-700 transition duration-200"
                >
                    Explore Tailored Services
                </a>
                </div>

                
            </div>
            {/* Background image for mobile/tablet */}
            <div className="block lg:hidden w-full">
                <img src={shoe2} alt="Background Mobile" className="w-full object-contain" />
            </div>
        </div>


        {/* statistics section */}
        <div className="px-4 md:px-8 lg:px-24 py-16 bg-[#011627]">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                <div className="">
                    <h3 className='text-[#47E84B] header text-5xl'>450+</h3>
                    <p className="text-white text-lg">Happy Client</p>
                </div>
                <div className="">
                    <h3 className='text-[#47E84B] header text-5xl'>1,200+</h3>
                    <p className="text-white text-lg">Sneakers Cleaned</p>
                </div>
                <div className="">
                    <h3 className='text-[#47E84B] header text-5xl'>+21,000Kg</h3>
                    <p className="text-white text-lg">CO2 Emissions Reduced</p>
                </div>

            </div>

            {/* before and after carousel */}
            <div className="relative">
                <h2 className="text-6xl font-bold text-primary header text-center mt-16 mb-8">
                    <span className='text-white'>Before &</span>  After
                </h2>
                
            </div>

        </div>

        { /* footer section */}
        <Footer />
    </div>
    );
}

export default RateAndServices;