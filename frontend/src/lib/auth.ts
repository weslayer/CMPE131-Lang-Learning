import { DICTIONARY_SERVER } from "@/config";

/**
 * Get authentication headers for API requests
 */
export async function getAuthHeaders(): Promise<HeadersInit> {
  try {
    // Import auth dynamically to avoid SSR issues
    const { auth } = await import("@/app/api/auth/[...nextauth]/route");
    const session = await auth();
    
    // Debug the session
    console.log("Session in getAuthHeaders:", 
      session ? { id: session.user?.id, email: session.user?.email } : "No session");
    
    if (!session?.user?.id) {
      console.warn("No valid session found when getting auth headers");
      return { 'Content-Type': 'application/json' };
    }
    
    // Make sure the user ID is properly formatted for Google accounts
    const userId = session.user.id.startsWith('google-') 
      ? session.user.id 
      : `google-${session.user.id}`;
    
    console.log(`Requesting token for user ID: ${userId}`);
    
    // Request a token from the backend
    const response = await fetch(`${DICTIONARY_SERVER}/auth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        email: session.user.email || '',
        name: session.user.name || ''
      }),
      cache: 'no-store'
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Token request failed (${response.status}): ${errorText}`);
      
      // If the user doesn't exist, try to register them
      if (response.status === 401) {
        const registerResponse = await fetch(`${DICTIONARY_SERVER}/auth/google/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: userId,
            email: session.user.email || '',
            name: session.user.name || 'User',
            picture: session.user.image || '',
          }),
          cache: 'no-store'
        });
        
        if (registerResponse.ok) {
          console.log("User registered successfully, trying to get token again");
          
          // Try to get a token again
          const retryResponse = await fetch(`${DICTIONARY_SERVER}/auth/token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id: userId,
              email: session.user.email || '',
              name: session.user.name || ''
            }),
            cache: 'no-store'
          });
          
          if (retryResponse.ok) {
            const data = await retryResponse.json();
            console.log("Successfully obtained auth token after registration");
            return {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${data.access_token}`
            };
          }
        }
      }
      
      return { 'Content-Type': 'application/json' };
    }
    
    const data = await response.json();
    console.log("Successfully obtained auth token");
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${data.access_token}`
    };
  } catch (error) {
    console.error('Auth error:', error);
    return { 'Content-Type': 'application/json' };
  }
}

// Token cache with expiration time
let tokenCache: { token: string; expiry: number } | null = null;

/**
 * Get a JWT token for API authentication
 */
export async function getApiToken(): Promise<string | null> {
  try {
    const now = Date.now();
    
    // Return cached token if still valid
    if (tokenCache && tokenCache.expiry > now) {
      return tokenCache.token;
    }
    
    // Import dynamically to avoid SSR issues
    const { auth } = await import("@/app/api/auth/[...nextauth]/route");
    
    // Get the session
    const session = await auth();
    
    // If no valid session, cannot get a token
    if (!session?.user?.id) {
      console.warn("No valid session found when requesting API token");
      return null;
    }
    
    // Request a token from the backend
    const response = await fetch(`${DICTIONARY_SERVER}/auth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: session.user.id,
        email: session.user.email || '',
        name: session.user.name || '',
      }),
      cache: 'no-store',
    });
    
    if (!response.ok) {
      console.error(`Token fetch failed with status ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    
    // Cache the token (expires in 50 minutes)
    tokenCache = {
      token: data.access_token,
      expiry: now + 50 * 60 * 1000 // 50 minutes in ms
    };
    
    return data.access_token;
  } catch (error) {
    console.error('Error getting API token:', error);
    return null;
  }
}

/**
 * Create authenticated fetch function
 * 
 * This provides a wrapper around fetch that automatically adds auth headers
 */
export async function createAuthFetch() {
  const headers = await getAuthHeaders();
  
  return async function authFetch(url: string, options: RequestInit = {}) {
    // Merge the auth headers with any provided headers
    const mergedHeaders = {
      ...headers,
      ...(options.headers || {}),
    };
    
    // Return fetch with auth headers
    return fetch(url, {
      ...options,
      headers: mergedHeaders,
    });
  };
} 