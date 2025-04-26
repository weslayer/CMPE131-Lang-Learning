'use client';

import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

export default function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  useEffect(() => {
    async function handleCallback() {
      if (!token) {
        // We don't receive tokens directly in our simplified flow
        // Just redirect to home page, cookies should have been set
        router.push('/');
        return;
      }

      try {
        // If we do have a token, use it with credentials provider
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