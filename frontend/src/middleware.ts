/**
 * This middleware is kept for documentation purposes only.
 * 
 * Authentication is now handled directly in the API routes using
 * NextAuth sessions, rather than through middleware.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Routes that require authentication
const protectedRoutes = [
  '/my-flashcards',
  '/deck',
  '/user',
  '/api/flashcards',
];

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Check if the path is a protected route
  const isProtectedRoute = protectedRoutes.some(route => 
    path.startsWith(route)
  );
  
  if (isProtectedRoute) {
    const token = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET_KEY || "63e13b4b54eef7586d18e6b335f1e2b4f5b081f873f289dd4db9d79d8abefffe"
    });
    
    // If not authenticated, redirect to sign-in
    if (!token) {
      const url = new URL('/auth/signin', request.url);
      url.searchParams.set('callbackUrl', encodeURI(request.url));
      return NextResponse.redirect(url);
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/my-flashcards/:path*',
    '/deck/:path*',
    '/user/:path*',
    '/api/flashcards/:path*',
  ],
}; 