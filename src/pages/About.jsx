import bgImage from '../assets/about_bg.png';
import gumShoe from '../assets/gumshoes.png';
import shoeIcon from '../assets/shoe_icon.png';
import joinMovement from '../assets/join_movement.png';
import Footer from '../components/Footer';

const About = () => {
  return (
    <div className="bg-white">
        {/* bg image */}
        <div className="bg-cover bg-center h-[100vh]" style={{ backgroundImage: `url(${bgImage})` }}>
            <div className="h-full px-4 md:px-8 lg:px-24 pt-[8rem]">
            <h1 className="text-white text-3xl md:text-6xl font-bold header">
                <span className='text-secondary'>About </span>
                <span>Us</span>
            </h1>
            
            </div>
        </div>

        {/* about us content */}
        <div className="px-4 md:px-8 lg:px-24 py-16">
            <div className="flex  gap-[4rem] items-center mb-8">
                <div className="">
                    <h3 className="lg:text-5xl md:text-3xl  font-bold text-primary header mb-6">
                    About Us
                    </h3>
                    <p className="text-gray-700 text-lg max-w-2xl">
                        At Kleankickx Sneaker Care, we believe that every step matters—not just for style and comfort, but for the planet. As a climate tech company, we harness the power of technology to drive sustainability in the footwear industry.
                        We are passionate about sneakers and committed to tackling the environmental impact of footwear, particularly in Ghana and across Africa, where waste management is a growing challenge.
                    </p>
                </div>
                {/* quote */}
                <div className="">
                    <p className="text-2xl  text-black  leading-9 italic ">
                        " Innovative Sneaker <br /> Solutions for a 
                        <br />
                        Sustainable Future"
                    </p>
                </div>
            </div>
        </div>

        <div className="px-4 md:px-8 lg:px-24 py-16">
            <div className="flex gap-8">
                <div className="">
                    <img src={gumShoe} alt="Gumshoe" className="w-full h-auto object-cover" />
                </div>
                <div className="">
                    <h3 className="text-2xl md:text-3xl lg:text-5xl font-bold text-primary header mt-6 mb-4">
                        Why We Exist
                    </h3>
                    <p className="text-gray-700 text-lg max-w-2xl">Africa faces a mounting issue with footwear waste. With over 300 million pairs of shoes discarded annually across the continent, a large portion ends up in landfills or informal waste streams, contributing to soil and water pollution. In Ghana, a key hub for second-hand footwear, discarded shoes often find their way into dumpsites, exacerbating environmental strain. This waste cycle not only harms ecosystems but also hinders local efforts to adopt sustainable practices.
At Kleankickx, we are determined to change this narrative by addressing the environmental toll of footwear and using technology to foster a culture of care, reuse, and responsible disposal.</p>
                </div>
            </div>
        </div>

        {/* approach section and value */}
        <div className="bg-deep-gray">
            <div className="px-4 md:px-8 lg:px-24 py-16 flex gap-[8rem]">
                <div className="">
                    <h3 className="text-2xl md:text-3xl lg:text-5xl font-bold text-primary header mb-6">
                        Our Approach
                    </h3>
                    <p className="text-white text-lg max-w-2xl">
                       We are reimagining the footwear industry through innovative, tech-driven solutions to reduce waste and create a circular economy.
                    </p>
                    <div className="mt-8 flex flex-col gap-6">
                        <div className="">
                            <div className="flex gap-2 items-center">
                                <img src={shoeIcon} alt="Shoe Icon" className="w-8 h-8 mb-2" />
                                <p className='text-white text-xl font-bold'> Care and Restoration </p>
                            </div>
                            <p className='text-white'>Using our platform, we offer premium sneaker cleaning and restoration services to extend the life of footwear, reducing the need for new purchases and minimizing waste.</p>
                        </div>
                        <div className="">
                            <div className="flex gap-2 items-center">
                                <img src={shoeIcon} alt="Shoe Icon" className="w-8 h-8 mb-2" />
                                <p className='text-white text-xl font-bold'> Sustainable Solutions </p>
                            </div>
                            <p className='text-white'>Using our platform, we offer By leveraging technology, we educate customers and collaborate with local partners to promote sustainable practices in footwear consumption and disposal.</p>
                        </div>
                        <div className="">
                            <div className="flex gap-2 items-center">
                                <img src={shoeIcon} alt="Shoe Icon" className="w-8 h-8 mb-2" />
                                <p className='text-white text-xl font-bold'> Circular Economy Initiatives </p>
                            </div>
                            <p className='text-white'>We utilize our tech platform to partner with recycling programs and local artisans, repurposing unusable shoes into innovative products and reducing waste sent to landfills.</p>
                        </div>
                    </div>
                </div>
                <div className="">
                    <h3 className="text-2xl md:text-3xl lg:text-5xl font-bold text-primary header mb-6">
                        Our Values
                    </h3>
                    <p className="text-white text-lg max-w-2xl">
                       At Kleankickx Sneaker Care, our mission is driven by a steadfast commitment to making a difference.
                    </p>
                    <div className="mt-8 flex flex-col gap-6">
                        <div className="">
                            <div className="flex gap-2 items-center">
                                <img src={shoeIcon} alt="Shoe Icon" className="w-8 h-8 mb-2" />
                                <p className='text-white text-xl font-bold'> Sustainability First </p>
                            </div>
                            <p className='text-white'>We are committed to reducing shoe waste and its environmental impact in Ghana and across Africa through technological innovation.</p>
                        </div>
                        <div className="">
                            <div className="flex gap-2 items-center">
                                <img src={shoeIcon} alt="Shoe Icon" className="w-8 h-8 mb-2" />
                                <p className='text-white text-xl font-bold'> Community Impact </p>
                            </div>
                            <p className='text-white'>Through our platform, we empower individuals and communities to adopt sustainable habits and make informed choices.</p>
                        </div>
                        <div className="">
                            <div className="flex gap-2 items-center">
                                <img src={shoeIcon} alt="Shoe Icon" className="w-8 h-8 mb-2" />
                                <p className='text-white text-xl font-bold'> Excellence in Care</p>
                            </div>
                            <p className='text-white'>We pride ourselves on providing top-tier sneaker cleaning, restoration, and sustainable solutions, ensuring that footwear lasts longer and has less environmental impact.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* join our movement section */}
        <div style={{backgroundImage: `url(${joinMovement})`, backgroundSize: 'cover', backgroundPosition: 'center'}} className="bg-cover bg-center relative">
        <div className="px-4 md:px-8 lg:px-24 py-16">
            <div className="text-center z-10 relative">
                <h3 className="text-2xl md:text-3xl lg:text-5xl font-bold text-primary header mb-6">
                    Join Our Movement
                </h3>
                <p className="text-white  max-w-2xl mx-auto mb-8">
                    At Kleankickx, we view every sneaker as more than just a product—it’s a story, an investment, and a responsibility. By harnessing the power of technology and climate-conscious strategies, we are paving the way for a cleaner, more sustainable future. Together, we can make a meaningful impact, one restored sneaker at a time.

                </p>
            </div>
        </div>
        <div className="absolute inset-0 bg-black/20"></div>
        </div>

        {/* footer section */}
        <Footer />
    </div>

    );
}
export default About;