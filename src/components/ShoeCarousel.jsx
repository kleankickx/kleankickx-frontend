import React, { useState, useRef } from 'react';
import Slider from 'react-slick';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/solid';

import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';


import blueBefore from '../assets/blue_before.jpg';
import blueAfter from '../assets/blue_after.jpg';
import diorBefore from '../assets/dior_before.jpg';
import diorAfter from '../assets/dior_after.jpg';
import valBefore from '../assets/val_before.jpg';
import valAfter from '../assets/val_after.jpg';
import whiteBefore from '../assets/white_before.jpg';
import whiteAfter from '../assets/white_after.jpg';
import nikeBefore from '../assets/nike_before.jpg';
import nikeAfter from '../assets/nike_after.jpg';

const pairedImages = [
  [blueBefore, blueAfter],
  [diorBefore, diorAfter],
  [valBefore, valAfter],
  [whiteBefore, whiteAfter],
  [nikeBefore, nikeAfter],
];

const Arrow = ({ onClick, direction }) => (
  <button
    type="button"
    onClick={onClick}
    className="!flex !items-center !justify-center absolute top-1/2 -translate-y-1/2 z-20 cursor-pointer"
    aria-label={direction === 'left' ? 'Previous slide' : 'Next slide'}
    style={{
      left: direction === 'left' ? '0' : 'auto',
      right: direction === 'right' ? '0' : 'auto',
    }}
  >
    {direction === 'left' ? (
      <ChevronLeftIcon className="h-10 w-10 lg:text-white text-[#000]" />
    ) : (
      <ChevronRightIcon className="h-10 w-10 lg:text-white text-[#000]" />
    )}
  </button>
);

const ShoeCarousel = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const sliderRef = useRef(null);

  const settings = {
    infinite: true,
    centerMode: true,
    centerPadding: '0rem',
    initialSlide: 1,
    slidesToShow: 3,
    speed: 500,
    nextArrow: <Arrow direction="right" />,
    prevArrow: <Arrow direction="left" />,
    beforeChange: (oldIndex, newIndex) => setCurrentSlide(newIndex),
    responsive: [
      {
        breakpoint: 1024,
        settings: { slidesToShow: 3, centerMode: true },
      },
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 1,
          centerMode: true,
          centerPadding: '0',
        },
      },
    ],
  };

  return (
    <section className="w-full py-10 bg-[#011627] relative overflow-hidden">
      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#011627] via-transparent to-[#011627] pointer-events-none z-10 hidden md:block" />

      <div className="relative z-20">
        <Slider {...settings} ref={sliderRef}>
          {pairedImages.map(([leftImg, rightImg], index) => (
            <div key={index} className="slide-wrapper">
              <div className="slide-inner">
                <img
                  src={leftImg}
                  alt={`Slide ${index + 1} left`}
                  className="h-60 w-1/2 object-cover"
                />
                <img
                  src={rightImg}
                  alt={`Slide ${index + 1} right`}
                  className="h-60 w-1/2 object-cover"
                />
              </div>
            </div>
          ))}
        </Slider>
      </div>

      {/* Dynamic dotted tracker */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-30">
        {pairedImages.map((_, index) => (
          <div
            key={index}
            onClick={() => sliderRef.current?.slickGoTo(index)}
            className={`h-2.5 w-2.5 rounded-full cursor-pointer transition duration-300 ${
              index === currentSlide
                ? 'bg-white scale-125'
                : 'bg-white/40 hover:bg-white'
            }`}
          />
        ))}
      </div>

      <style>{`
        .slide-wrapper {
          transition: transform 0.35s ease, opacity 0.35s ease;
          opacity: 0.35;
          transform: scale(0.8);
        }
        .slick-center .slide-wrapper {
          opacity: 1;
          transform: scale(1.1);
        }
        .slide-inner {
          background: #3c3c3c;
          padding: 1rem;
          display: flex;
          justify-content: center;
          gap: 1rem;
        }
        .slick-prev:before,
        .slick-next:before {
          content: '';
        }
        .slick-list {
          position: relative;
          overflow: hidden;
        }
        .slick-list::before,
        .slick-list::after {
          content: '';
          position: absolute;
          top: 0;
          bottom: 0;
          width: 15%;
          z-index: 10;
          pointer-events: none;
        }
        .slick-list::before {
          left: 0;
          background: linear-gradient(to right, #011627, #011627, transparent);
        }
        .slick-list::after {
          right: 0;
          background: linear-gradient(to left, #011627, #011627, transparent);
        }
        @media (max-width: 768px) {
          .slick-list::before,
          .slick-list::after {
            background: none;
          }
        }
      `}</style>
    </section>
  );
};

export default ShoeCarousel;
