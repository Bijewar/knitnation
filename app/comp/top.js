import React from 'react';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import '../../style/top.css';

const images = [
  '/c1.webp',
  '/c2.webp',
  '/c3.webp',
  '/c4.webp',
  '/c5.webp',
  '/c6.webp',
];

const settings = {
  dots: false,
  infinite: true,
  speed: 500,
  slidesToShow: 4, // Show 4 slides at a time
  slidesToScroll: 1,
  responsive: [
    {
      breakpoint: 1024,
      settings: {
        slidesToShow: 3,
      },
    },
    {
      breakpoint: 768,
      settings: {
        slidesToShow: 2,
      },
    },
    {
      breakpoint: 480,
      settings: {
        slidesToShow: 1,
      },
    },
  ],
};

const TopCategories = () => {
  const sliderRef = React.useRef(null);

  const nextSlide = () => {
    sliderRef.current.slickNext();
  };

  const prevSlide = () => {
    sliderRef.current.slickPrev();
  };

  return (
    <div className="carousel-container">
      <button className="carousel-button left" onClick={prevSlide}>
        ◀
      </button>
      <Slider ref={sliderRef} {...settings}>
        {images.map((image, index) => (
          <div key={index} className="carousel-image">
            <img src={image} alt={`Slide ${index}`} className="carousel-photo" />
          </div>
        ))}
      </Slider>
      <button className="carousel-button right" onClick={nextSlide}>
        ▶
      </button>
    </div>
  );
};

export default TopCategories;
