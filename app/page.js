// app/page.js
"use client";

import React from 'react';
import { useRouter } from 'next/navigation'; // Correct import for Next.js 13

function MyPage() {
  const router = useRouter(); // Correct usage of useRouter

  const handleClick = () => {
    console.log("Navigating to /register");
    router.push('/register');
  };
  

  return (
    <div>
      <button onClick={handleClick}>Go to Register</button>
    </div>
  );
}

export default MyPage;
