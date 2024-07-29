"use client"
import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Slider from 'react-slick';
import TopCategories from '../comp/top'; // Adjust path to your file
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import updateAllProductsWithIds from '../../stores'
import dynamic from 'next/dynamic';
import Link from 'next/link';
import Slshow from '../comp/slshow'
import seel from '../../style/seel.css'
import '../../style/slide.css'; // Adjust path to your CSS file
import { auth } from '../../firebase';
import slidecss from '../../style/slide.css';
import { fetchProducts } from '../../stores';
import '../../style/home.css'; // Ensure the correct CSS import
import { gsap } from 'gsap';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchProductsStart,
  fetchProductsSuccess,
  fetchProductsFailure,
  updateQuantity,
  removeFromCart,
} from '../../redux/slices';
import withReduxProvider from '../hoc';

const images = [
  '/straight.webp',
  '/cargo.webp',
  '/bootcut.webp',
]; // Define your specific images here

const Home = () => {
  const [user, setUser] = useState(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const [hoverStates, setHoverStates] = useState({});
  const [displayedProducts, setDisplayedProducts] = useState(4);
  const [isCartOpen, setIsCartOpen] = useState(false); // Add cart state
  const [isAccDropdownOpen, setIsAccDropdownOpen] = useState(false); // Add state for acc dropdown
  const [scrollPosition, setScrollPosition] = useState(0);
  const [timerProgress, setTimerProgress] = useState(0); // State for timer animation progress
  const [hoverIndex, setHoverIndex] = useState(-1);
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState('jeans');
  const dispatch = useDispatch();
  const womensProducts = useSelector(state => state.products.women);
console.log("womensProducts from Redux:", womensProducts);
  const cartItems = useSelector(state => state.cart.items); // Get cart items

  const slideshowDuration = 5000; // milliseconds
  const imageNames = ['one', 'two', 'three', 'four', 'five'];
  const numberToWord = number =>
    number >= 1 && number <= imageNames.length ? imageNames[number - 1] : '';



  const HOVER_FLASH_DURATION = 0.3; // Smooth transition duration
  const HOVER_FADE_DURATION = 0.3; // Smooth transition duration
  const TRANSITION_TIMEOUT = 200;

  let isTransitioning = false;

  const handleProductHovers = (productIndex) => {
    if (isTransitioning) return;

    if (hoverIndex !== -1 && hoverIndex !== productIndex) {
      // Quickly revert the previous hover effect
      gsap.to(`.product:nth-child(${hoverIndex + 1}) .productHighlight`, {
        opacity: 0,
        duration: 0.1,
      });
    }

    setHoverIndex(productIndex);
    showProductHighlight(productIndex);
  };

  const handleProductLeaves = (productIndex) => {
    if (hoverIndex !== productIndex) return;

    setHoverIndex(-1);
    hideProductHighlight(productIndex);
  };

  const showProductHighlight = (productIndex) => {
    gsap.to(`.product:nth-child(${productIndex + 1}) .productHighlight`, {
      opacity: 1,
      duration: HOVER_FLASH_DURATION,
      ease: "power2.inOut", // Easing effect for smoother transition
    });
  };

  const hideProductHighlight = (productIndex) => {
    gsap.to(`.product:nth-child(${productIndex + 1}) .productHighlight`, {
      opacity: 0,
      duration: HOVER_FADE_DURATION,
      ease: "power2.inOut", // Easing effect for smoother transition
      onComplete: () => {
        setTimeout(() => {
          isTransitioning = false;
        }, TRANSITION_TIMEOUT);
      },
    });
  };
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(currentUser => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        if (
          router.pathname !== '/product-details' &&
          router.pathname !== '/home'
        ) {
          router.replace('/login');
        }
      }
    });
    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    let intervalId;

    const startTimer = () => {
      clearInterval(intervalId);
      intervalId = setInterval(() => {
        setActiveSlide(prevSlide => (prevSlide + 1) % imageNames.length);
      }, slideshowDuration);
    };

    startTimer();

    return () => clearInterval(intervalId);
  }, [slideshowDuration, imageNames.length]);


  useEffect(() => {
    const fetchData = async () => {
      try {
        dispatch(fetchProductsStart());
        const productsData = await fetchProducts();
        console.log('Fetched Products Data:', productsData); // Add this line to inspect the fetched data

        const filteredProductsData = {
          category: 'women',
          data: productsData.women.map(product => ({
            ...product,
            createdAt: product.createdAt.toDate().toISOString(),
          })),
        };
        dispatch(fetchProductsSuccess(filteredProductsData));
      } catch (error) {
        dispatch(fetchProductsFailure(error.message));
      }
    };
    fetchData();
  }, [dispatch]);

  useEffect(() => {
    console.log('Fetching products...');
    const fetchData = async () => {
      try {
        dispatch(fetchProductsStart());
        const productsData = await fetchProducts(); // Assuming fetchProducts function
        console.log('Fetched products:', productsData);
        const filteredProductsData = {
          category: 'women',
          data: productsData.women.map((product) => ({
            ...product,
            createdAt: product.createdAt.toDate().toISOString(),
          })),
        };
        dispatch(fetchProductsSuccess(filteredProductsData));
      } catch (error) {
        dispatch(fetchProductsFailure(error.message));
        console.error('Error fetching products:', error);
      }
    };
    fetchData();
  }, [dispatch]); // Fetch products on dispatch change

  let womenJeans = [];
  if (womensProducts && typeof womensProducts === 'object') {
    // If womensProducts is an object (which it seems to be based on your Redux structure)
    womenJeans = womensProducts.Jeans || [];
  } else if (Array.isArray(womensProducts)) {
    // If womensProducts is an array (which it should be if the structure changes)
    womenJeans = womensProducts.filter(product => product.subcategory === 'Jeans');
  }
  console.log("Filtered womenJeans:", womenJeans);

  const handleShowMore = () => {
    router.push(`/subcategory/${selectedCategory}`);

  };

  const handleIncreaseQuantity = id => {
    const item = cartItems.find(item => item.id === id);
    if (item) {
      const newQuantity = Math.min(item.quantity + 1, 10);
      dispatch(updateQuantity({ id, quantity: newQuantity }));
    }
  };

  const handleDecreaseQuantity = id => {
    const item = cartItems.find(item => item.id === id);
    if (item) {
      const newQuantity = Math.max(item.quantity - 1, 1);
      dispatch(updateQuantity({ id, quantity: newQuantity }));
    }
  };

  const handleRemoveFromCart = id => {
    dispatch(removeFromCart(id));
  };

  const handleAccClick = () => {
    if (user) {
      // User is logged in, toggle acc dropdown
      setIsAccDropdownOpen(!isAccDropdownOpen);
    } else {
      // User is not logged in, redirect to login page
      router.push('/login');
    }
  };

  const handleCartClick = () => {
    if (!isCartOpen) {
      // Store the current scroll position
      setScrollPosition(window.scrollY);

      // Prevent scrolling behind the cart
      document.body.style.overflow = 'hidden';
    } else {
      // Restore scrolling when closing the cart
      document.body.style.overflow = 'auto';

      // Scroll back to the previously saved position
      window.scrollTo(0, scrollPosition);
    }

    setIsCartOpen(!isCartOpen);
  };

  const images = ['/s1.webp', '/s2.webp', '/s3.webp', '/s4.webp', '/s5.webp'];

  const settings = {
    dots: false,
    infinite: true,
    speed: 500,
    slidesToShow: 5,
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

  const sliderRef = useRef(null);

  const nextSlide = () => {
    sliderRef.current.slickNext();
  };

  const prevSlide = () => {
    sliderRef.current.slickPrev();
  };

  const handleSlideChange = index => {
    setActiveSlide(index);
  };


  const imageFames = ['straight', 'bootcut', 'cargo'];
  const [activeSlider, setActiveSlider] = useState(0);
  const slideshowDurations = 5000; // Duration in milliseconds

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSlider((prev) => (prev + 1) % imageFames.length);
    }, slideshowDurations)

    return () => clearInterval(interval);
  }, [imageFames.length, slideshowDurations]);



  console.log(`Rendering slide: ${imageFames[activeSlider]}`);
  const handleCategoryClick = (category) => {
    setSelectedCategory(category);
    console.log('Updated Selected Category:', category);
    setDisplayedProducts(4);
  };
  
  const getFilteredProducts = () => {
    console.log('Women\'s Products from Redux:', womensProducts);
    if (!womensProducts) return [];
    
    const subcategoryLower = selectedCategory.toLowerCase();
    const subcategoryCapitalized = selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1);
    
    const filteredProducts = womensProducts[subcategoryLower] || womensProducts[subcategoryCapitalized] || [];
    
    console.log('Filtered Products for', selectedCategory, filteredProducts);
    return filteredProducts;
  };
  const handleBuyNow = (product) => {
    console.log('Product to buy:', product); // Check product data
    if (product && product.id) {
      <Link href={`/product/${product.id}`}>
      <a>Buy Now</a>
    </Link>
    } else {
      console.error('Invalid product data:', product);
    }
  };
  
  
  
  
  const filteredProducts = getFilteredProducts();
  return (
    <>
      <div className="nav">
        <div className="rightpart">
          <ul className="right">
            <li>
              <Link href="/" className="mensec" style={{ color: 'black' }}>
                Womens
              </Link>
            </li>
            <li>
              <Link href="/men" className="womensec" style={{ color: 'black' }}>
                Mens
              </Link>
            </li>
          </ul>
          <img className="logo" src="/logo.png" alt="logo" />
        </div>
        <div className="leftpart">
          <input
            type="text"
            placeholder="What are you looking for?"
            className="search"
          />
          <img className="icon" src="/search-line.png" alt="" />
          <img className="acc" src="/acc.png" alt="" onClick={handleAccClick} />
          {/* Dropdown for account */}
          {isAccDropdownOpen && user && (
            <div className="dropdown">
              <Link className="orderhistory" href="/order-history">
                Order History
              </Link>
              <button className="sign" onClick={() => auth.signOut()}>
                Logout
              </button>
            </div>
          )}
          <img className="cart" src="/cart.png" alt="" onClick={handleCartClick} />
          {cartItems.length > 0 && (
            <span className="cart-badge">{cartItems.length}</span>
          )}
        </div>
      </div>
      <div className="main">
      <div className="slideshow-container">
          <AnimatePresence initial={false}>
            {imageNames.map((imageName, index) => (
              index === activeSlide && (
                <motion.div
                  key={index}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1, ease: 'easeInOut' }}
                  className="slide"
                >
                  <img className="display" src={`/${imageName}.webp`} alt="" />
                  <div className="timer-container">
                    {[...Array(imageNames.length)].map((_, timerIndex) => (
                      <div
                        key={timerIndex}
                        className={`timer timer${timerIndex + 1} ${timerIndex === activeSlide ? 'active' : ''}`}
                        style={{
                          animationDelay: `${timerIndex === activeSlide ? 0 : slideshowDuration + 500}ms`, // Timer starts immediately when the slide is active
                          transitionDelay: `${timerIndex === activeSlide ? slideshowDuration + 500 : 0}ms`, // Ensure no transition delay for the first timer
                          animationPlayState: `${timerIndex === activeSlide ? 'running' : 'paused'}`, // Pause the animation when the timer is not active
                        }}
                      />
                    ))}
                  </div>
                </motion.div>
              )
            ))}
          </AnimatePresence>
  

          <div className="pro">
          <p className="category">Jeans</p>
          <div className="jeans">
        
          <div className="products">
  {console.log("womenJeans:", womenJeans)}
  {console.log("displayedProducts:", displayedProducts)}
  {Array.isArray(womenJeans) && womenJeans.length > 0 ? (
    womenJeans.slice(0, displayedProducts).map((product, index) => {
      console.log("Rendering product:", product);
      return (
        <div
          key={product.id || index}
          className="product"
          onMouseEnter={() => handleProductHovers(index)}
          onMouseLeave={() => handleProductLeaves(index)}
        >
          <div className="product-image-container">
            {product.imageUrls && product.imageUrls.length > 0 ? (
              <>
                <img
                  className="product-image rounded-xl"
                  src={product.imageUrls[0]}
                  alt={product.name}
                  style={{ opacity: hoverIndex === index ? 0 : 1 }}
                />
                <img
                  className="product-image rounded-xl"
                  src={product.imageUrls[1] || product.imageUrls[0]}
                  alt={product.name}
                  style={{ opacity: hoverIndex === index ? 1 : 0 }}
                />
              </>
            ) : (
              <div>No image available</div>
            )}
            <div 
              className="image-overlay"
              style={{ opacity: isTransitioning && isTransitioning[index] ? 0.2 : 0 }}
            ></div>
            <div 
              className="white-flash"
              style={{ opacity: isTransitioning && isTransitioning[index] ? 1 : 0 }}
            ></div>
          </div>
          <button
                className="buyNowButton"
                onClick={() => handleBuyNow(product)}
              >
                Buy Now
              </button>
          <div>
            <span>
              <p className="prodname">{product.name || 'Unnamed Product'}</p>
            </span>
            <span>
              <p className="prprice">₹ {product.price || 'Price not available'}</p>
            </span>
          </div>
        </div>
      );
    })
  ) : (
    <div>No products available</div>
  )}
  
  {Array.isArray(womenJeans) && displayedProducts < womenJeans.length && (
    <button className="show" onClick={handleShowMore}>
      Show More
    </button>
  )}
</div>
            <div className="carousel-container">
              <button className="cbleft" onClick={prevSlide}>
                <img className="arr" src="/left.png" alt="" />
              </button>
              <Slider ref={sliderRef} {...settings}>
                {images.map((image, index) => (
                  <div key={index} className="carousel-image">
                    <img src={image} alt={`Slide ${index}`} className="carousel-img" />
                  </div>
                ))}
              </Slider>
              <button className="cbright" onClick={nextSlide}>
                <img src="/right.png" alt="" />
              </button>
              <p className="top">TOP CATEGORIES</p>
              <TopCategories />



              <div className="new-slideshow-container">
      {imageFames.map((imageName, index) => (
        <div key={index} className={`new-slide ${index === activeSlider ? 'visible' : 'hidden'}`}>
          <img className="new-display" src={`/${imageName}.webp`} alt={imageName} />
          <div className="new-timer-container">
      {imageFames.map((_, timerIndex) => (
        <div
          key={timerIndex}
          className={`new-timer new-timer${timerIndex + 1} ${timerIndex === activeSlider ? 'new-active' : ''}`}
          style={{
            '--slideshow-duration': `${slideshowDurations}ms`,
            '--animation-delay': `${timerIndex === activeSlider ? 0 : slideshowDurations + 500}ms`,
            '--transition-delay': `${timerIndex === activeSlider ? slideshowDurations + 500 : 0}ms`,
            '--animation-play-state': `${timerIndex === activeSlider ? 'running' : 'paused'}`,
          }}
        />
      ))}
      </div>

        </div>

      ))}
    </div>

 

             </div>
             <div className="pro1">
  <div className="categories">
    <p
      className={selectedCategory === 'tops' ? 'selected' : ''}
      onClick={() => handleCategoryClick('tops')}
    >
      Tops
    </p>
    <p
      className={selectedCategory === 'jeans' ? 'selected' : ''}
      onClick={() => handleCategoryClick('jeans')}
    >
      Jeans
    </p>
    <p
      className={selectedCategory === 'skirts' ? 'selected' : ''}
      onClick={() => handleCategoryClick('skirts')}
    >
      Skirts
    </p>
  </div>
  <p>Total Products: {filteredProducts.length}</p>
  <div className="products">
    {filteredProducts.slice(0, displayedProducts).map((product, index) => (
      <div
        key={index}
        className="product"
        onMouseEnter={() => handleProductHovers(index)}
        onMouseLeave={() => handleProductLeaves(index)}
      >
        <div className="product-image-container">
          <img
            className="product-image rounded-xl"
            src={product.imageUrls[0]}
            alt={product.name}
            style={{ opacity: hoverIndex === index ? 0 : 1 }}
          />
          <img
            className="product-image rounded-xl"
            src={product.imageUrls[1] || product.imageUrls[0]}
            alt={product.name}
            style={{ opacity: hoverIndex === index ? 1 : 0 }}
          />
          <div className="image-overlay" style={{ opacity: isTransitioning ? 0.2 : 0 }}></div>
          <div className="white-flash" style={{ opacity: isTransitioning ? 1 : 0 }}></div>
        </div>
        <button className="buy" onClick={() => handleBuyNow(product)}>
          Buy Now
        </button>
        <div>
          <span>
            <p className="prodname">{product.name}</p>
          </span>
          <span>
            <p className="prprice">₹ {product.price}</p>
          </span>
        </div>
      </div>
    ))}

    {displayedProducts < filteredProducts.length && (
      <button className="show" onClick={handleShowMore}>
        Show More
      </button>
    )}
  </div>
</div>
             </div>

        </div>

        {isCartOpen && <div className="overlay"></div>}

        <motion.div
          className="cartpage"
          initial={{ x: isCartOpen ? '0vw' : '30vw' }}
          animate={{ x: isCartOpen ? '-30vw' : '0vw' }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          style={{ top: scrollPosition }}
        >
          <img className="cart1" src="/cart.png" alt="" />
          <div className="ct">
            {cartItems.length > 0 && <span className="carttotal">{cartItems.length}</span>}
          </div>
          <img className="cartclose" src="/close.png" alt="" onClick={handleCartClick} />
          <div className="line"></div>
          {cartItems.length > 0 ? (
            <div className="cartItemsContainer">
              {cartItems.map((item, index) => (
                <div className="maincart" key={index}>
                  <div className="cartimg">
                    <img src={item.imageUrl} alt={item.name} />
                  </div>
                  <div className="details">
                    <div className="namecart">
                      <p>{item.name}</p>
                      <p className="pricecart">₹{item.price}</p>
                      <div className="quantity">
                        <button className="button2" onClick={() => handleDecreaseQuantity(item.id)}>
                          -
                        </button>
                        <span className="num">{item.quantity}</span>
                        <button className="button2" onClick={() => handleIncreaseQuantity(item.id)}>
                          +
                        </button>
                      </div>
                    </div>
                    <div className="remove">
                      <button className="removeBt" onClick={() => handleRemoveFromCart(item.id)}>
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="emptyCart">Your cart is empty.</p>
          )}


        </motion.div>
     
      </div>
    
   
      </div>
    </>
  );
};

export default withReduxProvider(Home);
