"use client"
import React, { useState, useEffect } from 'react';
import { getDoc, doc,setDoc ,arrayUnion,updateDoc, } from 'firebase/firestore';
import { toast } from 'react-toastify';

import { setAuthenticated } from '../../redux/slices'; // Import the new action

import { useRouter } from 'next/navigation';
import { cashfree } from '../api/cashfree/route';
import { useSelector, useDispatch } from 'react-redux';
const AddressPage = dynamic(() => import('@/app/comp/address/page'), { ssr: false });

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { load } from '@cashfreepayments/cashfree-js';
import { db,auth } from '../../firebase'; // Adjust path as needed
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
  const isAuthenticated = useSelector((state) => state.cart.isAuthenticated); // Get authentication status

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
  const [isLoading, setIsLoading] = useState(false);
  
  const selectedImage = useSelector((state) => state.products.selectedImage);
  const isSizeChartModalOpen = useSelector((state) => state.products.isSizeChartModalOpen);
  const cartItems = useSelector((state) => state.cart.items);
  const [sessionId, setSessionId] = useState({});
  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const cartTotal = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  const [cashfree, setCashfree] = useState(null);
  const [showAddressForm, setShowAddressForm] = useState(false);

  useEffect(() => {
    const initializeSDK = async () => {
      const cashfreeInstance = await load({
        mode: "sandbox" // Change to "production" for live environment
      });
      setCashfree(cashfreeInstance);
    };
    initializeSDK();
  }, []);

// In your ProductDetails.js file
useEffect(() => {
  const auth = getAuth();
  const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
    setUser(currentUser);   

    dispatch(setAuthenticated(!!currentUser));

    if (currentUser) {
      // Fetch cart data from the database for authenticated users
      const fetchCartFromDatabase = async () => {
        try {
          const userCartRef = doc(db, 'userCarts', currentUser.uid);
          const cartDoc = await getDoc(userCartRef);

          if (cartDoc.exists()) {
            const cartData = cartDoc.data();
            console.log("Fetched cart data from database:", cartData);
            dispatch(addToCart(cartData.items));
          } else {
            console.log("User doesn't have a cart yet.");
          }
        } catch (error) {
          console.error("Error fetching cart from database:", error);
          // Handle the error appropriately
        }
      };

      fetchCartFromDatabase();
    } else {
      // Retrieve guest cart from local storage
      const guestCart = JSON.parse(localStorage.getItem('guestCart') || '[]');
      dispatch(addToCart(guestCart));
    }

    setLoading(false); 
  });

  return () => unsubscribe();
}, [dispatch]);

  

  useEffect(() => {
    const fetchProduct = async () => {
      if (id) {
        try {
          setLoading(true);
          let productDocRef = doc(db, 'mens', id);
          let productSnapshot = await getDoc(productDocRef);

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
      setIsAccDropdownOpen(!isAccDropdownOpen);
    } else {
      router.push('/login');
    }
  };
const mergeCarts = async (guestCart) => {
  try {
    const userCartRef = doc(db, 'userCarts', user.uid);
    const cartDoc = await getDoc(userCartRef);

    if (cartDoc.exists()) {
      const existingItems = cartDoc.data().items;

      // Merge logic (example: add quantities if the same product exists)
      const mergedItems = guestCart.reduce((acc, guestItem) => {
        const existingItem = existingItems.find(item => item.id === guestItem.id);
        if (existingItem) {
          return acc.map(item => 
            item.id === guestItem.id 
              ? { ...item, quantity: item.quantity + guestItem.quantity } 
              : item
          );
        } else {
          return [...acc, guestItem];
        }
      }, existingItems);

      await updateDoc(userCartRef, { items: mergedItems });
      dispatch(addToCart(mergedItems));
    } else {
      // If the user doesn't have a cart yet, create a new one with the guest cart items
      await setDoc(userCartRef, { items: guestCart });
      dispatch(addToCart(guestCart));
    }
  } catch (error) {
    console.error("Error merging carts:", error);
    toast.error('Error merging carts. Please try again later.');
  }
};
  const handleCartClick = () => {
    if (!isCartOpen) {
      setScrollPosition(window.scrollY);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
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
    const estimatedDate = new Date(currentDate.getTime() + 5 * 24 * 60 * 60 * 1000);
    return estimatedDate.toDateString();
  };

  const handleAddToCart = async () => {
    if (!productData || !productData.price) {
      console.error('Invalid product data or price');
      toast.error('Error adding to cart. Please try again later.');
      return;
    }
  
    const { id, price, name, imageUrls } = productData;
    const imageUrl = selectedImage || (imageUrls && imageUrls[0]) || '';
  
    if (isAuthenticated) {
      // Add to database cart for logged-in users
      try {
        if (!user) {
          await new Promise(resolve => {
            const unsubscribe = onAuthStateChanged(getAuth(), (currentUser) => {
              if (currentUser) {
                setUser(currentUser);
                resolve();
              }
            });
            return () => unsubscribe(); 
          });
        }
  
        const userCartRef = doc(db, 'userCarts', user.uid);
  
        const cartDoc = await getDoc(userCartRef);
  
        if (!cartDoc.exists()) {
          // If not, create a new cart document and update Redux store optimistically
          await setDoc(userCartRef, { items: [{ id, name, price, imageUrl, quantity: 1 }] });
          dispatch(addToCart([{ id, name, price, imageUrl, quantity: 1 }])); // Update Redux immediately
        } else {
          // If it exists, check if the product is already in the cart
          const existingItem = cartDoc.data().items.find(item => item.id === id);
  
          if (existingItem) {
            // If the product exists, update its quantity in the database and Redux store optimistically
            const updatedItems = cartDoc.data().items.map(item => 
              item.id === id ? { ...item, quantity: item.quantity + 1 } : item
            );
            await updateDoc(userCartRef, { items: updatedItems });
            dispatch(addToCart(updatedItems)); // Update Redux immediately
          } else {
            // If the product doesn't exist, add it to the cart and update Redux store optimistically
            await updateDoc(userCartRef, { items: arrayUnion({ id, name, price, imageUrl, quantity: 1 }) });
            dispatch(addToCart([...cartDoc.data().items, { id, name, price, imageUrl, quantity: 1 }])); // Update Redux immediately
          }
        }
  
        console.log("Added to database cart");
        toast.success('Product added to cart!');
      } catch (error) {
        console.error("Error adding to database cart:", error);
        toast.error('Error adding to cart. Please try again later.');
        // Consider reverting the optimistic update in Redux if the database operation fails
      }
    } else {
      // Add to local storage cart for guest users (your existing logic is fine)
      let guestCart = JSON.parse(localStorage.getItem('guestCart') || '[]');
  
      const existingItem = guestCart.find((item) => item.id === id);
  
      if (existingItem) {
        const updatedQuantity = existingItem.quantity + 1;
        dispatch(updateQuantity({ id: existingItem.id, quantity: updatedQuantity }));
  
        guestCart = guestCart.map(item => 
          item.id === id ? { ...item, quantity: updatedQuantity } : item
        );
        localStorage.setItem('guestCart', JSON.stringify(guestCart));
      } else {
        const newItem = {
          id,
          name,
          price: parseFloat(price),
          imageUrl,
          quantity: 1,
        };
        dispatch(addToCart(newItem));
  
        guestCart.push(newItem);
        localStorage.setItem('guestCart', JSON.stringify(guestCart));
      }
  
      console.log("Added to local storage cart");
      toast.success('Product added to cart!');
    }
  
    setIsCartOpen(true);
  };
  

  const handleIncreaseQuantity = async (id) => {
    const item = cartItems.find((item) => item.id === id);
    if (item) {
      const newQuantity = Math.min(item.quantity + 1, 10);
      dispatch(updateQuantity({ id, quantity: newQuantity }));
  
      if (isAuthenticated && user) {
        try {
          const userCartRef = doc(db, 'userCarts', user.uid);
          const cartDoc = await getDoc(userCartRef);
  
          if (cartDoc.exists()) {
            const updatedItems = cartDoc.data().items.map(item =>
              item.id === id ? { ...item, quantity: newQuantity } : item
            );
            await updateDoc(userCartRef, { items: updatedItems });
          }
        } catch (error) {
          console.error("Error updating quantity in database:", error);
          toast.error('Error updating cart. Please try again later.');
          // Consider reverting the optimistic update in Redux if the database operation fails
        }
      }
    }
  };
  
  const handleDecreaseQuantity = async (id) => {
    const item = cartItems.find((item) => item.id === id);
    if (item) {
      const newQuantity = Math.max(item.quantity - 1, 1);
      dispatch(updateQuantity({ id, quantity: newQuantity }));
  
      if (isAuthenticated && user) {
        try {
          const userCartRef = doc(db, 'userCarts', user.uid);
          const cartDoc = await getDoc(userCartRef);
  
          if (cartDoc.exists()) {
            const updatedItems = cartDoc.data().items.map(item =>
              item.id === id ? { ...item, quantity: newQuantity } : item
            );
            await updateDoc(userCartRef, { items: updatedItems });
          }
        } catch (error) {
          console.error("Error updating quantity in database:", error);
          toast.error('Error updating cart. Please try again later.');
          // Consider reverting the optimistic update in Redux if the database operation fails
        }
      }
    }
  };
  
  const handleRemoveFromCart = async (id) => {
    dispatch(removeFromCart(id));
  
    if (isAuthenticated && user) {
      try {
        const userCartRef = doc(db, 'userCarts', user.uid);
        const cartDoc = await getDoc(userCartRef);
  
        if (cartDoc.exists()) {
          const updatedItems = cartDoc.data().items.filter(item => item.id !== id);
          await updateDoc(userCartRef, { items: updatedItems });
        }
      } catch (error) {
        console.error("Error removing from database cart:", error);
        toast.error('Error updating cart. Please try again later.');
        // Consider reverting the optimistic update in Redux if the database operation fails
      }
    }
  };
const handleProceedToPay = async () => {
  if (!isAuthenticated) {
    // Guest user - show popup and redirect to login
    toast.info('Please log in to proceed to checkout.');
    router.push('/login'); 

    // Optionally, you can save the guest cart to local storage here 
    localStorage.setItem('guestCart', JSON.stringify(cartItems)); 
    return; 
  }

  // Authenticated user - proceed to address page if not loading
  if (loading) {
    toast.info('Please wait while we load your cart data.');
    return;
  }

  localStorage.setItem('cartItems', JSON.stringify(cartItems));
  localStorage.setItem('cartTotal', (cartTotal - discount).toFixed(2));
  router.push('/comp/address'); 
};

  const applyPromoCode = () => {
    // This is a simple example. In a real app, you'd validate the promo code against a database
    if (promoCode === 'DISCOUNT10') {
      const discountAmount = cartTotal * 0.1; // 10% discount
      setDiscount(discountAmount);
    } else {
      setError('Invalid promo code');
    }
  };
  const verifyPayment = async (orderId) => {
    try {
      const response = await fetch(`/api/verify-payment?orderId=${orderId}`, {
        method: 'GET',
      });
      const data = await response.json();
      if (data.status === 'SUCCESS') {
        // Payment successful, update your UI accordingly
        console.log('Payment successful');
      } else {
        // Payment failed or pending, handle accordingly
        console.log('Payment not successful:', data.status);
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
    }
  };
  const openSizeChartModal = () => {
    dispatch(toggleSizeChartModal(true));
  };

  const closeSizeChartModal = () => {
    dispatch(toggleSizeChartModal(false));
  };
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
      {showAddressForm ? (
          <AddressPage 
            onSubmit={handleAddressSubmit}
            cartTotal={cartTotal}
          />
        ) : (
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
                    Buy Now
                  </div>
                </div>
              ))}
                 <div className="cart-total">
            <p>Total: ₹{cartTotal.toFixed(2)}</p>
          </div>
          <button 
            onClick={handleProceedToPay} 
            className="proceed-to-pay"
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : `Proceed to Pay (₹${cartTotal.toFixed(2)})`}
          </button>

          {error && <p className="error-message">{error}</p>}
            </div>
          ) : (
            <p className="emptyCart">Your cart is empty.</p>
          )}

        </motion.div>
        )}
      {isSizeChartModalOpen && <SizeChartModal onClose={() => dispatch(toggleSizeChartModal())} />}
    </>
        
        );
      };

export default withReduxProvider(ProductDetails);