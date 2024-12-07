"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import Link from "next/link";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";

// Firebase imports
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../firebase";

// Dynamic imports
const SizeSelection = dynamic(() => import("../../comp/size"), { ssr: false });
const SizeChartModal = dynamic(() => import("../../comp/chart"), { ssr: false });

// Redux actions import
import {
  setSelectedImage,
  toggleSizeChartModal,
  increaseQuantity,
  removeFromCart,
  decreaseQuantity,
  addToCart,
} from "../../../redux/slices";

// Style imports
import "../../../style/product.css";
import "../../../style/home.css";

const ProductPage = ({ params }) => {
  const router = useRouter();
  const dispatch = useDispatch();

  // State management
  const [user, setUser] = useState(null);
  const [scrollPosition, setScrollPosition] = useState(0);

  const [parsedProduct, setParsedProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pincode, setPincodeLocal] = useState("");
  const [isAccDropdownOpen, setIsAccDropdownOpen] = useState(false); // Add state for acc dropdown
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [city, setCity] = useState(null);
  const [estimatedDeliveryDate, setEstimatedDeliveryDate] = useState(null);

  // Redux selectors
  const selectedImage = useSelector((state) => state.products.selectedImage);
  const isSizeChartModalOpen = useSelector(
    (state) => state.products.isSizeChartModalOpen
  );
  const cartItems = useSelector((state) => state.cart.items);

  // Extract product ID from dynamic route parameters
  const productId = params?.id;

  // Fetch product on component mount
  useEffect(() => {
    if (productId) {
      fetchProduct(productId);
    } else {
      setError("Product ID is missing");
      setLoading(false);
    }
  }, [productId]);
  const handleIncreaseQuantity = id => {
    dispatch(increaseQuantity(id));
  };

  const handleDecreaseQuantity = id => {
    dispatch(decreaseQuantity(id));
  };

  const handleRemoveFromCart = id => {
    dispatch(removeFromCart(id));
  };
  const fetchProduct = async (id) => {
    try {
      setLoading(true);
      const productRef = doc(db, "womens", id);
      const docSnap = await getDoc(productRef);

      if (docSnap.exists()) {
        const productData = { id: docSnap.id, ...docSnap.data() };
        setParsedProduct(productData);
      } else {
        setError("Product not found");
      }
    } catch (err) {
      setError("Failed to load product data");
    } finally {
      setLoading(false);
    }
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

  const handleAddToCart = () => {
    if (parsedProduct) {
      dispatch(
        addToCart({
          ...parsedProduct,
          imageUrl: parsedProduct.imageUrls[0], // Assign the first image URL
        })
      );
    }
  };
  const proceedToPay = () => {
    router.push("/comp/address");
  };
  


  const handleImageClick = (imageUrl) => {
    dispatch(setSelectedImage(imageUrl));
  };

  const handlePincodeChange = (e) => {
    setPincodeLocal(e.target.value);
  };

  const checkAvailability = () => {
    if (pincode) {
      console.log(`Checking availability for pincode: ${pincode}`);
    }
  };

  // Handle loading and error states
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!parsedProduct) return <div>Product not found</div>;

  // Destructure product details
  const { imageUrls, name, price, description } = parsedProduct;

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
          <img className="logo" src="/logo.png" alt="logokjnkjnkj" />
        </div>
        <div className="leftpart">
          <input
            type="text"
            placeholder="What are you looking for baby?"
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
    <div className="fixedcart">
      <div className="cart-container">
        <img className="cart" src="/cart.png" alt="" />
        {cartItems.length > 0 && (
          <span className="cart-badge">{cartItems.length}</span>
        )}
      </div>
    </div>
  
    <div className='main'>
      <div className='temp'>
        {imageUrls && imageUrls.map((imageUrl, index) => (
          <div
            key={index}
            className='one'
            style={{ backgroundImage: `url(${imageUrl})` }} // Corrected string interpolation
            onClick={() => handleImageClick(imageUrl)}
          ></div>
        ))}
      </div>
  
      <div className='big'>
        <img src={selectedImage || (imageUrls && imageUrls[0])} alt={name} />
      </div>
      <div className="prname">
        <h1>{name}</h1>
        <div className='stars'></div>
        {price && <p className='price'> ₹ {price}</p>}
        <div className='sizechart' onClick={() => dispatch(toggleSizeChartModal())}>
          <img className='size' src="download.png" alt="" />
          <p className='m-2'>Size Chart</p>
        </div>
        <SizeSelection />
        <div>
          <p className='location'>Check availability <img className='h-7' src="map.png" alt="" /></p>
          <input
            className='pin'
            type="text"
            placeholder="Enter PIN code"
            value={pincode}
            onChange={handlePincodeChange}
          />
          <button className='check' onClick={checkAvailability}>Check</button>
          <div className='both'>
            <span className="inline-container">
              {city && <p className='city'><span className='inline-flex'>🚚</span>{city},</p>}
              {estimatedDeliveryDate && <p className='estd'>Estimated Delivery Date: {estimatedDeliveryDate}</p>}
            </span>
          </div>
        </div>
        <div></div>
        <button className='car' onClick={handleAddToCart}>Add to cart</button>
      </div>
  
      {isCartOpen && (
        <motion.div
          className='cartpage'
          initial={{ x: '100%' }}
          animate={{ x: '-30vw' }}
          transition={{ type: 'tween', duration: 0.5, ease: 'easeInOut' }}
        >
          <img className='cart1' src="/cart.png" alt="" />
          <div className='ct'>
            {cartItems.length > 0 && (
              <span className="carttotal">{cartItems.length}</span>
            )}
          </div>
          <img className='cartclose' src="close.png" alt="" onClick={() => setIsCartOpen(false)} />
          <div className='line'></div>
  
          {cartItems.length > 0 ? (
            <div className='cartItemsContainer'>
              {cartItems.map((item, index) => (
                <div className='maincart' key={index}>
                  <div className='cartimg'>
                    <img className='' src={item.imageUrl} alt={item.name} />
                  </div>
                  <div className='details'>
                    <div className='namecart'>
                      <p>{item.name}</p>
                      <p className='price'>₹ {item.price}</p>
                    </div>
                    <div className='btquan'>
                      <div className='quantity'>
                        <button className='pr-4 gap-1' onClick={() => handleDecreaseQuantity(item.id)}>-</button>
                        <span>{item.quantity}</span>
                        <button className='pl-4 gap-1' onClick={() => handleIncreaseQuantity(item.id)}>+</button>
                      </div>
                      <button className="removeBtn" onClick={() => handleRemoveFromCart(item.id)}>Remove</button>

                    </div>
                    <button className="proceed-to-pay" onClick={proceedToPay}>
          Proceed to Pay
        </button>

                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p>Your cart is empty!</p>
          )}
        </motion.div>
      )}
    </div>
  
    {isSizeChartModalOpen && <SizeChartModal onClose={() => dispatch(toggleSizeChartModal())} />}
  </>
  
  );
};

export default ProductPage;
