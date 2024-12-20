"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Toaster, toast } from "react-hot-toast";
import css from "../../style/register.css";
import dynamic from "next/dynamic";
import { useDispatch } from "react-redux";
import Layout from "../layout";
import { setUser } from "../../redux/slices";
import { BsFillShieldLockFill } from "react-icons/bs";
import Link from "next/link";
import { CgSpinner } from "react-icons/cg";
import withReduxProvider from "../hoc";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
const OtpInput = dynamic(() => import("otp-input-react"), { ssr: false });

const RegistrationForm = () => {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const dispatch = useDispatch();

  useEffect(() => {
    const initFirebase = async () => {
      const { initializeApp } = await import("firebase/app");
      const { getAuth } = await import("firebase/auth");
      const { addUserToFirestore } = await import("../../stores");
      const auth = getAuth();
      auth.languageCode = "en";

      window.firebaseAuth = auth;
      window.addUserToFirestore = addUserToFirestore;
    };

    if (typeof window !== "undefined") {
      initFirebase();
    }
  }, []);

 
  const sendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
  
    try {
      const response = await fetch("/api/sendOtp", {
        method: "POST", // Ensure the method is POST
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }), // Include the required data in the body
      });
  
      if (!response.ok) {
        throw new Error(`Failed to send OTP: ${response.statusText}`);
      }
  
      const data = await response.json();
      toast.success(data.message);
      setShowOtpInput(true);
    } catch (err) {
      console.error("Error sending OTP:", err);
      toast.error(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };
  
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (typeof window === "undefined") return;
    setLoading(true);
    try {
      const { signInWithEmailLink, createUserWithEmailAndPassword, updateProfile } = await import("firebase/auth");

     

      const userCredential = await createUserWithEmailAndPassword(window.firebaseAuth, email, password);
      const user = userCredential.user;
      await updateProfile(user, { displayName: fullName });
      await window.addUserToFirestore(user.uid, email, fullName, phoneNumber);

      dispatch(setUser(user));
      router.push("/home");
    } catch (error) {
      console.error("Error in registration process:", error);
      toast.error(`Error in registration: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="custom-wrapper">
        <Toaster toastOptions={{ duration: 4000 }} />
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
                  <button
                    type="submit"
                    disabled={loading}
                    className=" bg-emerald-600 w-full flex gap-1 items-center justify-center py-2.5 text-white rounded top-12 relative "

                  >
                    {loading && <CgSpinner size={20} className="mt-1 animate-spin" />}
                  
                    <span>Send OTP via Email</span>
                  </button>

                  <p className="alr">
                    Already have an account? <Link href="/login">Login</Link>
                  </p>
                </>
              ) : (
                <>
                  <div className="bg-white text-emerald-500 w-fit mx-auto p-4 rounded-full">
                    <BsFillShieldLockFill size={30} />
                  </div>
                  <label htmlFor="otp" className="font-bold text-xl text-center">
                    Email Verification
                  </label>
                  <OtpInput
                    value={otp}
                    onChange={setOtp}
                    numInputs={6}
                    separator={<span>-</span>}
                    inputStyle={{
                      width: "3rem",
                      height: "3rem",
                      margin: "0 0.5rem",
                      fontSize: "1.5rem",
                      border: "1px solid #ccc",
                      borderRadius: "4px",
                    }}
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-emerald-600 w-full flex gap-1 items-center justify-center py-2.5 text-white rounded"
                  >
                    {loading && <CgSpinner size={20} className="mt-1 animate-spin" />}
                    <span className="mt-5">Verify Email</span>
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
