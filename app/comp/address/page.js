"use client";
import { initializeSDK } from '/app/api/cashfree/route';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { Label } from "@/app/comp/address/ui/label";
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs,setDoc,getDoc,doc } from 'firebase/firestore';
import { db } from '../../../firebase'; // Adjust the import path as needed

import { Input } from "@/app/comp/address/ui/input";
import css from "../../../style/address.css";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/app/comp/address/ui/select";
import { Button } from "@/app/comp/address/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/app/comp/address/ui/card";
import { Separator } from "@/app/comp/address/ui/separator";
import hoc from '../../hoc';

function Component() {
  const router = useRouter();
  const cartItems = useSelector((state) => state.cart.items);
  const [discount, setDiscount] = useState(0); // State to store the discount amount

  const cartTotal = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);

  const [address, setAddress] = useState({
    name: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    zip: '',
    country: '',
  });
  const [promoCode, setPromoCode] = useState('');
  const [isCashfreeLoaded, setIsCashfreeLoaded] = useState(false);

  const handleInputChange = (e) => {
    setAddress({ ...address, [e.target.id]: e.target.value });
  };
  const applyPromoCode = () => {
    if (promoCode === 'DISCOUNT10') {
      const discountAmount = cartTotal * 0.1; // Calculate 10% discount
      setDiscount(discountAmount);
    } else {
      // Handle invalid promo code, maybe show an error message
      alert('Invalid promo code'); 
    }
  };

 
  const handleCountryChange = (value) => {
    setAddress({ ...address, country: value });
  };

  const handlePromoCodeChange = (e) => {
    setPromoCode(e.target.value);
  };

// Import Razorpay script dynamically
function loadRazorpayScript(src) {
  return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
  });
}

const handlePlaceOrder = async () => {
  console.log("Checking if Razorpay SDK is loaded...");
  const razorpayLoaded = await loadRazorpayScript('https://checkout.razorpay.com/v1/checkout.js');

  if (!razorpayLoaded) {
    console.error("Razorpay SDK failed to load.");
    alert("Failed to load Razorpay SDK. Please try again later.");
    return;
  }

  try {
    const auth = getAuth();
    const currentUser = auth.currentUser;

    if (!currentUser) {
      console.error("User is not logged in.");
      alert("User not logged in.");
      return;
    }

    const userDetails = await getUserDetails(currentUser.uid);

    console.log("Sending request to create Razorpay order...");
    const response = await fetch('/api/startpay', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: Math.round((cartTotal - discount) * 100), // Convert to paise, round to nearest integer
        currency: 'INR',
        receipt: `order_rcptid_${Date.now()}`,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Failed to create Razorpay order:", errorData);
      alert("Failed to create Razorpay order.");
      return;
    }

    const { id: orderId } = await response.json();
    console.log("Razorpay order created:", { orderId });

    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount: Math.round((cartTotal - discount) * 100),
      currency: 'INR',
      name: "Your Shop Name",
      description: "Test Transaction",
      order_id: orderId,
      handler: async function (response) {
        console.log("Payment successful:", response);

        // Redirect to the success page with order details
        const orderDetails = {
          orderNumber: orderId,
          estimatedDelivery: "June 15, 2023", // Replace with actual logic
          items: cartItems, // Replace with actual cart items
          total: cartTotal - discount,
        };

        const query = encodeURIComponent(JSON.stringify(orderDetails));
        window.location.href = `/success?details=${query}`;
      },
      prefill: {
        name: userDetails.fullName,
        email: userDetails.email,
        contact: userDetails.phone || '',
      },
      theme: {
        color: "#3399cc",
      },
    };

    const rzp = new Razorpay(options);
    rzp.on('payment.failed', function (response) {
      console.error("Payment failed:", response.error);
      alert("Payment failed. Please try again.");
    });

    rzp.open();
  } catch (error) {
    console.error("Error placing order:", error);
    alert("An unexpected error occurred. Please try again later.");
  }
};



// Function to get user details from Firestore
async function getUserDetails(uid) {
  try {
      console.log(`Attempting to fetch user details for UID: ${uid}`);

      const auth = getAuth();
      const currentUser = auth.currentUser;

      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
          console.warn(`No user document found for UID: ${uid}. Creating default user document.`);

          // Create a default user document if it doesn't exist
          const defaultUserData = {
              uid: uid,
              email: currentUser?.email || '',
              fullName: 'New User',
              phone: '',
              createdAt: new Date()
          };

          // Set the default user document
          await setDoc(userRef, defaultUserData);

          console.log('Default user document created');
          return defaultUserData;
      }

      const userData = userSnap.data();
      console.log('User details found:', userData);
      return userData;
  } catch (error) {
      console.error('Error fetching user details:', error);

      // Fallback user details if everything fails
      const auth = getAuth();
      const currentUser = auth.currentUser;

      const fallbackUserData = {
          uid: uid,
          email: currentUser?.email || 'test@example.com',
          fullName: 'Unknown User',
          phone: '9999999999'
      };

      return fallbackUserData;
  }
}



  

// Function to get user details from Firestore
async function getUserDetails(uid) {
  try {
    console.log(`Attempting to fetch user details for UID: ${uid}`);
    
    const auth = getAuth();
    const currentUser = auth.currentUser;

    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      console.warn(`No user document found for UID: ${uid}. Creating default user document.`);
      
      // Create a default user document if it doesn't exist
      const defaultUserData = {
        uid: uid,
        email: currentUser?.email || '', 
        fullName: 'New User',
        phone: '', 
        createdAt: new Date()
      };

      // Set the default user document
      await setDoc(userRef, defaultUserData);

      console.log('Default user document created');
      return defaultUserData;
    }
    
    const userData = userSnap.data();
    console.log('User details found:', userData);
    return userData;
  } catch (error) {
    console.error('Error fetching user details:', error);
    
    // Fallback user details if everything fails
    const auth = getAuth();
    const currentUser = auth.currentUser;

    const fallbackUserData = {
      uid: uid,
      email: currentUser?.email || 'test@example.com',
      fullName: 'Unknown User',
      phone: '9999999999'
    };

    return fallbackUserData;
  }
}



  const verifyPayment = async (orderId) => {
    try {
      const response = await fetch(`/api/verify-payment?orderId=${orderId}`, {
        method: 'GET',
      });
      const data = await response.json();
      if (data.status === 'SUCCESS') {
        console.log('Payment successful');
      } else {
        console.log('Payment not successful:', data.status);
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
    }
  };

  return (
<div className="container mx-auto max-w-3xl px-4 py-12 md:px-6 md:py-16">
    <div className="space-y-4">
      <h1 className="text-3xl font-bold tracking-tight">Checkout</h1>
      <p className="text-muted-foreground">
        Enter your address and apply any promo codes to complete your order.
      </p>
    </div>
    <div className="mt-8 grid gap-8 md:grid-cols-2">
      <div className="space-y-6">
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={address.name}
              onChange={handleInputChange}
              placeholder="John Doe"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="address1">Address Line 1</Label>
            <Input
              id="address1"
              value={address.address1}
              onChange={handleInputChange}
              placeholder="123 Main St"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="address2">Address Line 2</Label>
            <Input
              id="address2"
              value={address.address2}
              onChange={handleInputChange}
              placeholder="Apt 456"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              value={address.city}
              onChange={handleInputChange}
              placeholder="San Francisco"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                value={address.state}
                onChange={handleInputChange}
                placeholder="CA"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="zip">Zip Code</Label>
              <Input
                id="zip"
                value={address.zip}
                onChange={handleInputChange}
                placeholder="94103"
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="country">Country</Label>
            <Select
              id="country"
              value={address.country}
              onValueChange={handleCountryChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a country" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="us">United States</SelectItem>
                <SelectItem   
 value="ca">Canada</SelectItem>
                <SelectItem value="mx">Mexico</SelectItem>
                <SelectItem value="gb">United Kingdom</SelectItem>
                <SelectItem value="au">Australia</SelectItem>
                <SelectItem value="de">Germany</SelectItem>
                <SelectItem value="fr">France</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      <div className="space-y-6">
        <div className="grid gap-2">
          <Label htmlFor="promo-code">Promo Code</Label>
          <div className="flex gap-2">
            <Input
              id="promo-code"
              value={promoCode}
              onChange={handlePromoCodeChange}
              placeholder="Enter promo code"
            />
            <Button onClick={applyPromoCode}>Apply</Button>
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            <div className="flex items-center justify-between">
              <span>Subtotal</span>
              <span>${cartTotal.toFixed(2)}</span>
            </div>
            {discount > 0 && ( 
              <div className="flex items-center justify-between">
                <span>Discount</span>
                <span className="text-green-500">-${discount.toFixed(2)}</span>
              </div>
            )}
            <Separator />
            <div className="flex items-center justify-between font-medium">
              <span>Total</span>
              <span>${(cartTotal - discount).toFixed(2)}</span> 
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    <div className="mt-8 flex justify-end">
    <Button onClick={handlePlaceOrder}>
 Place Order
</Button>

    </div>
  </div>
  );
}

export default hoc(Component);