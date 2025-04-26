"use client"

import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

export default function WelcomePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();
  
  // Get parameters from URL
  const name = searchParams.get('name');
  const email = searchParams.get('email');
  
  useEffect(() => {
    // Redirect to dashboard after 2 seconds
    const timer = setTimeout(() => {
      router.push('/my-flashcards');
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [router]);
  
  if (status !== 'authenticated') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <h1 className="text-2xl font-bold mb-4">Authentication in progress...</h1>
        <p>Please wait while we set up your session.</p>
      </div>
    );
  }
  
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <h1 className="text-3xl font-bold mb-4">Welcome, {name || 'User'}!</h1>
      <p className="mb-8">You have successfully signed in with {email || 'your account'}.</p>
      <p className="text-gray-600">Redirecting you to your flashcards...</p>
    </div>
  );
} 