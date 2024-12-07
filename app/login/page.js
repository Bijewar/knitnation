"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { setUser, setError } from '../../redux/slices';
import { auth } from '../../firebase';
import withReduxProvider from '../hoc';
import { toast, Toaster } from 'react-hot-toast';
import css from '../../style/login.css'
import Layout from '../layout';
import { CgSpinner } from "react-icons/cg";

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
      console.log('Login successful!', userCredential);
      dispatch(setUser(userCredential.user));
      toast.success('Logged in successfully!');
      console.log('Redirecting to /home...');
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
    <Layout>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Login</title>
      </Head>

      <div className="custom-wrapper">
        <Toaster toastOptions={{ duration: 4000 }} />
        <div className="custom-image-wrapper">
          <img src="/logo.png" alt="Logo" />
        </div>
        <div className="custom-form-wrapper">
          <div className="custom-form-inner">
            <h1 className="custom-title">Login to Your Account</h1>
            <form onSubmit={handleLogin} className="custom-form">
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

              <button className="custom-button" type="submit" disabled={loading}>
                {loading && <CgSpinner size={20} className="custom-spinner" />}
                <span>{loading ? 'Logging in...' : 'Login'}</span>
              </button>

              <Link href="/forgot-password" className="alrt">
                Forgot password?
              </Link>

              <Link href="/register" className="newacc">
              Create a new Account
            </Link>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default withReduxProvider(LoginForm);