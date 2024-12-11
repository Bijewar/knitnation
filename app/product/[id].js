import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSelector, useDispatch } from 'react-redux';
import Link from 'next/link';
import { motion } from 'framer-motion';
import withReduxProvider from '../pages/hoc';
import SizeSelection from '../pages/comp/size';
import SizeChartModal from '../pages/comp/chart';
import {
  setSelectedImage,
  toggleSizeChartModal,
  setPincode,
  setCity,
  setEstimatedDeliveryDate,
  addToCart,
  clearSelectedImage,
  updateQuantity,
  removeFromCart
} from '../redux/slices';

import '../style/product.css';
import '../style/home.css';

const ProductDetails = () => {
  const router = useRouter();
  const { id } = router.query;
  const { product } = router.query;
  const dispatch = useDispatch();
  
  useEffect(() => {
    return () => {
      dispatch(clearSelectedImage());
    };
  }, [dispatch]);

  const parsedProduct = product ? JSON.parse(product) : null;

  const [pincode, setPincodeLocal] = useState('');
  const [city, setCityLocal] = useState('');
  const [estimatedDeliveryDate, setEstimatedDeliveryDateLocal] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);

  const selectedImage = useSelector(state => state.products.selectedImage);
  const isSizeChartModalOpen = useSelector(state => state.products.isSizeChartModalOpen);
  const cartItems = useSelector(state => state.cart.items);

  const handleImageClick = (imageUrl) => {
    dispatch(setSelectedImage(imageUrl));
  };

  const handlePincodeChange = (e) => {
    setPincodeLocal(e.target.value);
  };

  const checkAvailability = async () => {
    try {
      const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
      const data = await response.json();

      if (data && data[0].Status === 'Success' && data[0].PostOffice.length > 0) {
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

  const handleAddToCart = () => {
    if (!parsedProduct || !parsedProduct.price) {
      console.error('Invalid product data or price');
      console.log('Parsed Product:', parsedProduct);
      return;
    }

    const { price, name, imageUrls } = parsedProduct;
    const imageUrl = selectedImage || (imageUrls && imageUrls[0]) || '';

    const existingItem = cartItems.find(item => item.name === name);

    if (existingItem) {
      const updatedQuantity = existingItem.quantity + 1;
      dispatch(updateQuantity({ id: existingItem.id, quantity: updatedQuantity }));
    } else {
      const newItem = {
        id: `temp-${Date.now()}`,
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
    const item = cartItems.find(item => item.id === id);
    if (item) {
      const newQuantity = Math.min(item.quantity + 1, 10);
      dispatch(updateQuantity({ id, quantity: newQuantity }));
    }
  };

  const handleDecreaseQuantity = (id) => {
    const item = cartItems.find(item => item.id === id);
    if (item) {
      const newQuantity = Math.max(item.quantity - 1, 1);
      dispatch(updateQuantity({ id, quantity: newQuantity }));
    }
  };

  const handleRemoveFromCart = (id) => {
    dispatch(removeFromCart(id));
  };

  if (!parsedProduct) {
    return <div>Loading...</div>;
  }

  const { name, price, description, imageUrls } = parsedProduct;

  return (
    <>
      <div className='nav'>
        <ul className='right'>
          <li>
            <Link href="/" className='ml-3 font-bold' style={{ color: 'black' }}>
              Womens
            </Link>
          </li>
          <li>
            <Link href="/page/men" className='font-gilroy font-bold' style={{ color: 'black' }}>
              Mens
            </Link>
          </li>
        </ul>
        <img className='logo' src="logo.png" alt="logo" />
        <input
          type="text"
          placeholder="What are you looking for?"
          className="search"
        />
        <img className='icon' src="search-line.png" alt="" />
        <img className='acc' src="acc.png" alt="" />
        <div className="cart-container">
          <img className='cart' src="cart.png" alt="" />
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
              style={{ backgroundImage: `url(${imageUrl})` }}
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

export default withReduxProvider(ProductDetails);