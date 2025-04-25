import { DICTIONARY_SERVER } from "@/config";

/**
 * Get the CSRF token from cookies
 * 
 * This token must be included in headers for any request that uses
 * cookie-based authentication to prevent CSRF attacks
 */
function getCsrfToken(): string | null {
  // This function only works in the browser
  if (typeof document === 'undefined') return null;
  
  // Parse cookies to get the CSRF token
  const cookies = document.cookie.split(';').map(cookie => cookie.trim());
  for (const cookie of cookies) {
    if (cookie.startsWith('csrf_token=')) {
      return cookie.substring('csrf_token='.length);
    }
  }
  return null;
}

/**
 * Get authentication headers for API requests
 * 
 * This function adds JWT token authentication for API requests 
 * instead of using custom headers
 */
export async function getAuthHeaders(): Promise<HeadersInit> {
  try {
    // Import dynamically to avoid SSR issues
    const { auth } = await import("@/app/api/auth/[...nextauth]/route");
    
    // Get the session
    const session = await auth();
    
    // Get JWT token for secure authentication
    const token = await getApiToken();
    
    // Get CSRF token for protection against CSRF attacks
    const csrfToken = getCsrfToken();
    
    // Return headers with Authorization and CSRF tokens
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken;
    }
    
    return headers;
  } catch (error) {
    console.error('Error in getAuthHeaders:', error);
    // Return basic headers if authentication fails
    return {
      'Content-Type': 'application/json',
    };
  }
}

/**
 * Get a JWT token for API authentication
 * 
 * This is now essential for secure authentication
 */
export async function getApiToken(): Promise<string | null> {
  try {
    // Import dynamically to avoid SSR issues
    const { auth } = await import("@/app/api/auth/[...nextauth]/route");
    
    // Get the session
    const session = await auth();
    
    // If no valid session, cannot get a token
    if (!session?.user?.id) {
      console.log("No valid session for token request");
      return null;
    }
    
    // Request a token from the backend using session data
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
    });
    
    if (!response.ok) {
      // Instead of throwing, log the error and return null
      console.warn(`Failed to get token: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
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