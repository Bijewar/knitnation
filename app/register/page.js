"use client"

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Toaster, toast } from 'react-hot-toast';
import css from "../../style/register.css"
import dynamic from 'next/dynamic';
import { useDispatch } from 'react-redux';
import Layout from '../layout';
import { setUser } from '../../redux/slices';
import { BsFillShieldLockFill } from "react-icons/bs";
import Link from 'next/link'
import { CgSpinner } from "react-icons/cg";
import withReduxProvider from '../hoc';

// Dynamically import components that use browser-only APIs
const OtpInput = dynamic(() => import("otp-input-react"), { ssr: false });

const RegistrationForm = () => {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState("");
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const dispatch = useDispatch();

  useEffect(() => {
    // Initialize Firebase only on the client side
    const initFirebase = async () => {
      const { initializeApp } = await import('firebase/app');
      const { getAuth, RecaptchaVerifier } = await import('firebase/auth');
      const { addUserToFirestore } = await import('../../stores');
      const auth = getAuth();
      auth.languageCode = 'en';

      
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'sign-in-button', {
        'size': 'invisible',
        'callback': (response) => {
          console.log('reCAPTCHA solved:', response);
        }
      });

      // Attach these functions to window for use in event handlers
      window.firebaseAuth = auth;
      window.addUserToFirestore = addUserToFirestore;
    };

    if (typeof window !== 'undefined') {
      initFirebase();
    }
  }, []);
  const sendOtp = async (e) => {
    e.preventDefault();
    if (typeof window === 'undefined') return;
    setLoading(true);
    try {
      const { signInWithPhoneNumber } = await import('firebase/auth');
      const formattedPhoneNumber = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
      const appVerifier = window.recaptchaVerifier;
      const confirmationResult = await signInWithPhoneNumber(window.firebaseAuth, formattedPhoneNumber, appVerifier);
      window.confirmationResult = confirmationResult;
      setShowOtpInput(true);
      toast.success('OTP sent successfully!');
    } catch (err) {
      console.error('Error sending OTP:', err);
      toast.error(`Error sending OTP: ${err.message}`);
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.render().then(widgetId => {
          grecaptcha.reset(widgetId);
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (typeof window === 'undefined') return;
    setLoading(true);
    try {
      const { createUserWithEmailAndPassword, updateProfile } = await import('firebase/auth');
      const result = await window.confirmationResult.confirm(otp);
      console.log('OTP verified successfully', result.user);
      toast.success('OTP verified successfully!');

      const userCredential = await createUserWithEmailAndPassword(window.firebaseAuth, email, password);
      const user = userCredential.user;
      await updateProfile(user, { displayName: fullName });
      await window.addUserToFirestore(user.uid, email, fullName, phoneNumber);

      dispatch(setUser(user));
      router.push('/home');
    } catch (error) {
      console.error('Error in registration process:', error);
      toast.error(`Error in registration: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  
  return (
    <Layout>
      <div className="custom-wrapper">
      <Toaster toastOptions={{ duration: 4000 }} />

        <div id="recaptcha-container"></div>
        <div className="custom-image-wrapper">
          <img src="/logo.png" alt="Logo" />
        </div>
        <div className="custom-form-wrapper">
          <div className="custom-form-inner">
            <h1 className="custom-title">Register Your Account</h1>
            <form className="custom-form" onSubmit={showOtpInput ? handleVerifyOtp : sendOtp}>
              {!showOtpInput ? (
                <>
                  <div className="custom-form-group">
                    <input
                      id="name"
                      placeholder="Full Name"
                      required
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>
                  <div className="custom-form-group">
                    <input
                      id="email"
                      placeholder="Enter your email"
                      required
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="custom-form-group">
                    <input
                      id="password"
                      placeholder="Password"
                      required
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  <div className="custom-form-group">
                    <input
                      id="phoneNumber"
                      placeholder="Phone Number"
                      required
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                    />
                  </div>
                  <button id="sign-in-button" type="submit" disabled={loading} className="bg-emerald-600 w-full flex gap-1 items-center justify-center py-2.5 text-white rounded top-10 relative">
                    {loading && <CgSpinner size={20} className="mt-1 animate-spin" />}
                    <span>Send code via SMS</span>
                  </button>
                </>
              ) : (
                <>
                  <div className="bg-white text-emerald-500 w-fit mx-auto p-4 rounded-full">
                    <BsFillShieldLockFill size={30} />
                  </div>
                  <label htmlFor="otp" className="font-bold text-xl text-center">
                    Enter your OTP
                  </label>
                  <OtpInput
                    value={otp}
                    onChange={setOtp}
                    OTPLength={6}
                    otpType="number"
                    disabled={false}
                    autoFocus
                    className="opt-container"
                  />
                  <button type="submit" disabled={loading} className="bg-emerald-600 w-full flex gap-1 items-center justify-center py-2.5 text-white rounded">
                    {loading && <CgSpinner size={20} className="mt-1 animate-spin" />}
                    <span>Verify OTP</span>
                  </button>
                </>
              )}
            </form>
            <p className='alr'>
              Already have an account?{' '}
              <Link href="/login">Login</Link>
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default withReduxProvider(RegistrationForm);