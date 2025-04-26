import { DICTIONARY_SERVER } from '@/config';
import { getAuthHeaders } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

// Updated helper to get secure JWT authentication headers
async function getSecureAuthHeaders() {
  // Use the updated auth library function that gets JWT tokens
  return await getAuthHeaders();
}

export async function GET(request: NextRequest) {
  try {
    // Get secure authentication headers with JWT token
    const headers = await getSecureAuthHeaders();
    
    // Make the authenticated request to the backend
    const response = await fetch(`${DICTIONARY_SERVER}/user/default-deck`, {
      method: 'GET',
      headers,
      cache: 'no-store'
    });
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${await response.text()}`);
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching default deck:', error);
    return NextResponse.json(
      { error: 'Failed to fetch default deck' }, 
      { status: 500 }
    );
  }
} 