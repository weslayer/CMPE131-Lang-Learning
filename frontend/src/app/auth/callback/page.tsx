'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';

export default function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  useEffect(() => {
    async function handleCallback() {
      if (!token) {
        console.error('No token received from backend');
        router.push('/auth/error?error=no_token');
        return;
      }

      try {
        // Store the token securely
        localStorage.setItem('auth_token', token);
        
        // Use next-auth to set the session
        const result = await signIn('credentials', {
          token,
          redirect: false,
        });

        if (result?.error) {
          console.error('Authentication error:', result.error);
          router.push(`/auth/error?error=${result.error}`);
          return;
        }

        // Redirect to the home page or dashboard
        router.push('/');
      } catch (error) {
        console.error('Error during authentication callback:', error);
        router.push('/auth/error?error=unknown');
      }
    }

    handleCallback();
  }, [token, router]);

  return (
    <div className="flex h-screen w-full items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Completing Authentication</h1>
        <p>Please wait while we complete the sign-in process...</p>
      </div>
    </div>
  );
} 