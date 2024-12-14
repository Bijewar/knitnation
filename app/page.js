"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation'; // Correct import for Next.js 13

const UsersPage = () => {
  const router = useRouter();

  useEffect(() => {
    // Immediately redirect to /register when the component mounts
    router.push('/register');
  }, [router]);

  return null; // Return nothing or a loading state while redirecting
};

export default UsersPage;
