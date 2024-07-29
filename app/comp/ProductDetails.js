"use client"
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { cashfree } from '../api/cashfree';
import { useSelector, useDispatch } from 'react-redux';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { motion } from 'framer-motion';

import { getDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase'; // Adjust path as needed
import {
  getAuth,
  onAuthStateChanged,
} from 'firebase/auth';
import '../../style/product.css';
import '../../style/home.css';
import withReduxProvider from '../hoc';
import SizeSelection from '../comp/size';
import SizeChartModal from '../comp/chart';
import {
  setSelectedImage,
  toggleSizeChartModal,
  setPincode,
  setCity,
  setEstimatedDeliveryDate,
  addToCart,
  clearSelectedImage,
  updateQuantity,
  removeFromCart,
} from '../../redux/slices';

const ProductDetails = ({ id }) => {

  const router = useRouter();
  
  const dispatch = useDispatch();
  const [user, setUser] = useState(null); 
  const [productData, setProductData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pincode, setPincodeLocal] = useState('');
  const [scrollPosition, setScrollPosition] = useState(0);
  const [isAccDropdownOpen, setIsAccDropdownOpen] = useState(false); 
  const [city, setCityLocal] = useState('');
  const [estimatedDeliveryDate, setEstimatedDeliveryDateLocal] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);

  const selectedImage = useSelector((state) => state.products.selectedImage);
  const [sessionId, setSessionId] = useState({});

  async function handleRedirect() {
    try {
      // First, call your backend to create a payment session
      const response = await fetch('/api/startpay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: `order_${Date.now()}`,
          orderAmount: 'amount_here', // Replace with actual amount
          orderCurrency: 'INR',
          customerDetails: {
            customerId: 'customer_id_here', // Replace with actual customer ID
            customerEmail: 'customer@example.com', // Replace with actual email
            customerPhone: '9999999999', // Replace with actual phone number
          },
          // Add any other necessary details
        }),
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const data = await response.json();
      console.log('Response from startpay:', data);
  
      // Check if paymentSessionId is received
      if (!data.paymentSessionId) {
        throw new Error('Payment session ID not received');
      } else {
        console.log('Payment session ID:', data.paymentSessionId);
      }
  
      // Initialize Cashfree
      const cashfree = await initCashfree();
  
      // Use Cashfree's Drop-in checkout
      const checkoutOptions = {
        paymentSessionId: data.paymentSessionId,
        returnUrl: `${window.location.origin}/payment-status`,
      };
  
      const result = await cashfree.checkout(checkoutOptions);
  
      if (result.error) {
        console.error("Checkout error:", result.error);
      }
  
      // The checkout method will handle the redirect automatically
  
    } catch (error) {
      console.error('Error in handleRedirect:', error);
    }
  }
  
  const isSizeChartModalOpen = useSelector(
    (state) => state.products.isSizeChartModalOpen
  );
  const cartItems = useSelector((state) => state.cart.items);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchProduct = async () => {
      if (id) {
        try {
          console.log(`Fetching product with ID: ${id}`);
          setLoading(true);

          // Check in mens collection
          let productDocRef = doc(db, 'mens', id);
          let productSnapshot = await getDoc(productDocRef);

          // If not found in mens, check in womens
          if (!productSnapshot.exists()) {
            productDocRef = doc(db, 'womens', id);
            productSnapshot = await getDoc(productDocRef);
          }

          if (productSnapshot.exists()) {
            setProductData({
              id: productSnapshot.id,
              ...productSnapshot.data(),
              collection: productSnapshot.ref.parent.id,
            });
          } else {
            setError(`Product with ID ${id} not found. Please check the product ID and try again.`);
          }
        } catch (err) {
          setError(`Error fetching product data: ${err.message}`);
          console.error('Error fetching product:', err);
        } finally {
          setLoading(false);
        }
      }
    };

    if (id) {
      fetchProduct();
    }
  }, [id]);
  useEffect(() => {
    return () => {
      dispatch(clearSelectedImage());
    };
  }, [dispatch]);

  const BackToHomeButton = () => (
    <button onClick={() => router.push('/')} className="back-home-button">
      Back to Home
    </button>
  );

  if (loading)
    return <div className="loading">Loading...</div>;
  if (error)
    return (
      <div className="error">
        <p>Error: {error}</p>
        <BackToHomeButton />
      </div>
    );
  if (!productData)
    return (
      <div className="no-data">
        <p>No product data available. Please try another product.</p>
        <BackToHomeButton />
      </div>
    );

  const { name, price, description, imageUrls } = productData;

  const handleImageClick = (imageUrl) => {
    dispatch(setSelectedImage(imageUrl));
  };

  const handlePincodeChange = (e) => {
    setPincodeLocal(e.target.value);
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

  const checkAvailability = async () => {
    try {
      const response = await fetch(
        `https://api.postalpincode.in/pincode/${pincode}`
      );
      const data = await response.json();

      if (
        data &&
        data[0].Status === 'Success' &&
        data[0].PostOffice.length > 0
      ) {
        const estimatedDate = calculateEstimatedDeliveryDate();
        setCityLocal(data[0].PostOffice[0].District);
        setEstimatedDeliveryDateLocal(estimatedDate);
        dispatch(setCity(data[0].PostOffice[0].District));
        dispatch(setEstimatedDeliveryDate(estimatedDate));
        dispatch(setPincode(pincode));
      } else {
        setCityLocal('');
        setEstimatedDeliveryDateLocal('');
        dispatch(setCity(''));
        dispatch(setEstimatedDeliveryDate(''));
      }
    } catch (error) {
      console.error('Error fetching availability:', error);
    }
  };

  const calculateEstimatedDeliveryDate = () => {
    const currentDate = new Date();
    const estimatedDate = new Date(
      currentDate.getTime() + 5 * 24 * 60 * 60 * 1000
    );
    return estimatedDate.toDateString();
  };

  const handleAddToCart = () => {
    if (!productData || !productData.price) {
      console.error('Invalid product data or price');
      return;
    }

    const { id, price, name, imageUrls } = productData;
    const imageUrl = selectedImage || (imageUrls && imageUrls[0]) || '';

    const existingItem = cartItems.find((item) => item.id === id);

    if (existingItem) {
      const updatedQuantity = existingItem.quantity + 1;
      dispatch(updateQuantity({ id: existingItem.id, quantity: updatedQuantity }));
    } else {
      const newItem = {
        id,
        name,
        price: parseFloat(price),
        imageUrl,
        quantity: 1,
      };

      dispatch(addToCart(newItem));
    }

    setIsCartOpen(true);
  };

  const handleIncreaseQuantity = (id) => {
    const item = cartItems.find((item) => item.id === id);
    if (item) {
      const newQuantity = Math.min(item.quantity + 1, 10);
      dispatch(updateQuantity({ id, quantity: newQuantity }));
    }
  };

  const handleDecreaseQuantity = (id) => {
    const item = cartItems.find((item) => item.id === id);
    if (item) {
      const newQuantity = Math.max(item.quantity - 1, 1);
      dispatch(updateQuantity({ id, quantity: newQuantity }));
    }
  };

  const handleRemoveFromCart = (id) => {
    dispatch(removeFromCart(id));
  };

  const openSizeChartModal = () => {
    dispatch(toggleSizeChartModal(true));
  };

  const closeSizeChartModal = () => {
    dispatch(toggleSizeChartModal(false));
  };


 // In pages/product/[id].js

// In pages/product/[id].js

  
  const subtotal = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);

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
              <Link href="/page/men" className="womensec" style={{ color: 'black' }}>
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
      <div className='main'>
        <div className='temp'>
          {imageUrls && imageUrls.map((imageUrl, index) => (
            <motion.div
              key={index}
              className='one'
              style={{ backgroundImage: `url(${imageUrl})` }}
              onClick={() => handleImageClick(imageUrl)}
            ></motion.div>
          ))}
        </div>
        <div className='big'>
          <motion.img
            key={selectedImage || (imageUrls && imageUrls[0])}
            className='rounded-2xl'
            src={selectedImage || (imageUrls && imageUrls[0])}
            alt={name}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <div className="prname">
          <h1>{name}</h1>
          <div className='stars'></div>
          {price && <p className='price'> ₹ {price}</p>}
          <div className='sizechart' onClick={() => dispatch(toggleSizeChartModal())}>
            <img className='size' src="/download.png" alt="" />
            <p className='m-2'>Size Chart</p>
          </div>
          <SizeSelection />
          <div>
            <p className='location'>Check availability <img className='h-7' src="/map.png" alt="" /></p>
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
                {city && <p className='city'><span className='inline-flex'>🚚</span> {city},</p>}
                {estimatedDeliveryDate && <p className='estd'>Estimated Delivery Date: {estimatedDeliveryDate}</p>}
              </span>
            </div>
          </div>
          <button className='car' onClick={handleAddToCart}>Add to cart</button>
        </div>
      </div>
      {/* Cart sidebar */}
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
                      <button className="removeBtn" onClick={() => handleRemoveFromCart(item.id)}>
                        Remove
                      </button>
                    </div>
                    <button onClick={handleRedirect} className="buy-now">
            Buy Now
          </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="emptyCart">Your cart is empty.</p>
          )}


        </motion.div>
      {isSizeChartModalOpen && <SizeChartModal onClose={() => dispatch(toggleSizeChartModal())} />}
    </>
  );
};

export default withReduxProvider(ProductDetails);