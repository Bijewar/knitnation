"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import Head from 'next/head'; // Import Head from next/head
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { setUser, setError } from '../../redux/slices';
import css from '../../style/login.css'; // Make sure this file is being included properly
import { auth } from '../../firebase';
import withReduxProvider from '../hoc';
import { toast, Toaster } from 'react-hot-toast';  // Added Toaster import here

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const dispatch = useDispatch();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('Login successful!');
      dispatch(setUser(userCredential.user));
      toast.success('Logged in successfully!');
      router.push('/home');
    } catch (error) {
      console.error('Login error:', error);
      dispatch(setError(error.message));
      toast.error(`Login failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Login</title> {/* Adding a title for the page */}
      </Head>
      <div>
        <Toaster toastOptions={{ duration: 4000 }} />
        <form onSubmit={handleLogin}>
          <div className="custom-wrapper">
            <div className="custom-image-wrapper">
              <img src="/logo.png" alt="Logo" />
            </div>
            <div className="custom-form-wrapper">
              <div className="custom-form-inner">
                <div className="custom-form-group">
                  <input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="custom-form-group">
                  <input
                    id="password"
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <p className='alr'>
                  <Link href="/register" legacyBehavior>
                    <a>Forgot password?</a>
                  </Link>
                </p>
                <button className='registerbtn' type="submit" disabled={loading}>
                  {loading ? 'Logging in...' : 'Login'}
                </button>
                <br />
                <Link href="/register" passHref legacyBehavior>
                  <a className='newacc'>Create a new Account</a>
                </Link>
              </div>
            </div>
          </div>
        </form>
      </div>
    </>
  );
};

export default withReduxProvider(LoginForm);
