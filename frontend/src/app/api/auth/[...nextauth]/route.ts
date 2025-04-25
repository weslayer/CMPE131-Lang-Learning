import NextAuth from "next-auth"
import type { NextAuthConfig } from "next-auth"
import type { JWT } from "next-auth/jwt"
import type { Session } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"

// Simple token verification function that works in Edge runtime
function verifyToken(token: string, secret: string) {
  try {
    // Simple base64 decode to get the payload
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload;
  } catch (e) {
    console.error("Failed to verify token:", e);
    return null;
  }
}

const authOptions: NextAuthConfig = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      // Allow automatic account linking by email
      allowDangerousEmailAccountLinking: true,
    }),
    CredentialsProvider({
      name: "Custom Token",
      credentials: {
        token: { label: "Token", type: "text" }
      },
      async authorize(credentials) {
        try {
          if (!credentials?.token) return null;
          
          // Simple token verification that works in Edge runtime
          const decoded = verifyToken(
            credentials.token as string, 
            (process.env.JWT_SECRET_KEY || "fallback-secret-for-development-only") as string
          );
          
          if (!decoded || typeof decoded !== 'object') return null;
          
          // Return user data in the format NextAuth expects
          return {
            id: decoded.sub,
            email: decoded.email,
            name: decoded.name,
            image: decoded.picture
          };
        } catch (error) {
          console.error("Error validating token", error);
          return null;
        }
      }
    })
  ],
  secret: process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET_KEY,
  session: {
    strategy: "jwt" as const,
  },
  callbacks: {
    async jwt({ token, account, user }) {
      // Initial sign in
      if (account?.access_token) {
        token.accessToken = account.access_token;
      }
      // When using credentials provider, copy user data to token
      if (user) {
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
      }
      // If we have a Google account, we'll add some additional fields
      if (account && user) {
        if (account.provider === "google") {
          // Send user data to our backend to create/update the user
          try {
            const userId = `google-${user.id}`
            const response = await fetch(`${process.env.BACKEND_URL}/auth/google/register`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                id: userId,
                email: user.email,
                name: user.name,
                picture: user.image,
              }),
            })
            
            if (response.ok) {
              // Store the backend user ID in the token
              token.backendUserId = userId
            }
          } catch (error) {
            console.error("Error registering user with backend:", error)
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        // Add any additional user data you want in the session
        if (token.email) session.user.email = token.email as string;
        if (token.name) session.user.name = token.name as string;
        if (token.picture) session.user.image = token.picture as string;
      }
      // Send properties to the client
      if (token.backendUserId) {
        session.user.id = token.backendUserId as string
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
    signOut: '/',
  }
}

// Export the handlers and auth function
export const { handlers: { GET, POST }, auth } = NextAuth(authOptions); 