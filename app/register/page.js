"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Toaster, toast } from 'react-hot-toast';
import css from "../../style/register.css";
import dynamic from 'next/dynamic';
import { useDispatch } from 'react-redux';
import Layout from '../layout';
import { setUser } from '../../redux/slices';
import { BsFillShieldLockFill } from "react-icons/bs";
import Link from 'next/link';
import { CgSpinner } from "react-icons/cg";
import withReduxProvider from '../hoc';

// Dynamically import components that use browser-only APIs
const OtpInput = dynamic(() => import("otp-input-react"), { ssr: false });
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

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
    const initFirebase = async () => {
      const { initializeApp } = await import('firebase/app');
      const { getAuth, RecaptchaVerifier } = await import('firebase/auth');
      const { addUserToFirestore } = await import('../../stores');
      const auth = getAuth();
      auth.languageCode = 'en';

      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'sign-in-button', {
        size: 'invisible',
        callback: (response) => {
          console.log('reCAPTCHA solved:', response);
        }
      });

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
                    <PhoneInput
                      placeholder="Enter phone number"
                      value={phoneNumber}
                      onChange={setPhoneNumber}
                      defaultCountry="IN"
                      international
                      required
                    />
                  </div>
                  <button id="sign-in-button" type="submit" disabled={loading} className="custom-button">
                    {loading && <CgSpinner size={20} className="custom-spinner" />}
                    <span>Send code via SMS</span>
                  </button>
                  <Link href="/login" className="logon">
                    Login to an existing account
                  </Link>
                </>
              ) : (
                <>
                  <div className="custom-otp-icon">
                    <BsFillShieldLockFill size={30} />
                  </div>
                  <label htmlFor="otp" className="custom-otp-label">Enter your OTP</label>
                  <OtpInput
                    value={otp}
                    onChange={setOtp}
                    OTPLength={6}
                    otpType="number"
                    disabled={false}
                    autoFocus
                    className="custom-otp-input"
                  />
                  <button type="submit" disabled={loading} className="custom-button">
                    {loading && <CgSpinner size={20} className="custom-spinner" />}
                    <span>Verify OTP</span>
                  </button>
                </>
              )}
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default withReduxProvider(RegistrationForm);