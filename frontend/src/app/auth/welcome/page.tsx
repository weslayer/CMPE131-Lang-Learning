"use client"

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function WelcomePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();
  
  // Get parameters from URL
  const name = searchParams.get('name');
  const email = searchParams.get('email');
  const csrfToken = searchParams.get('csrf_token');
  
  useEffect(() => {
    // Save CSRF token if provided
    if (csrfToken) {
      // Save CSRF token to a cookie that JavaScript can read
      document.cookie = `csrf_token=${csrfToken}; path=/; max-age=604800; SameSite=Lax; Secure`;
      
      // Remove the CSRF token from the URL to prevent leaking it in browser history
      // We do this by creating a new URL without the csrf_token parameter
      const url = new URL(window.location.href);
      url.searchParams.delete('csrf_token');
      window.history.replaceState({}, '', url.toString());
    }
    
    // Redirect to dashboard after 2 seconds
    const timer = setTimeout(() => {
      router.push('/my-flashcards');
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [csrfToken, router]);
  
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