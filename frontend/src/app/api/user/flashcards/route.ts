import { DICTIONARY_SERVER } from '@/config';
import { getAuthHeaders } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../../auth/[...nextauth]/route';

// Updated helper to get secure JWT authentication headers
async function getSecureAuthHeaders() {
  try {
    // Use the updated auth library function that gets JWT tokens
    return await getAuthHeaders();
  } catch (error) {
    console.error("Error getting secure auth headers:", error);
    return {
      'Content-Type': 'application/json',
    };
  }
}

// GET method for retrieving a user's flashcards directly
export async function GET(request: NextRequest) {
  try {
    // Get the session to check authentication
    const session = await auth();
    
    // If no session, return unauthorized
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' }, 
        { status: 401 }
      );
    }
    
    // Get secure authentication headers with JWT token
    const headers = await getSecureAuthHeaders();
    
    // Make the authenticated request to the backend
    const response = await fetch(`${DICTIONARY_SERVER}/api/my-flashcards`, {
      method: 'GET',
      headers,
      cache: 'no-store'
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.warn(`Backend error: ${response.status} - ${errorText}`);
      
      // If unauthorized, return clear error message
      if (response.status === 401) {
        return NextResponse.json(
          { error: 'Not authorized to access flashcards' }, 
          { status: 401 }
        );
      }
      
      return NextResponse.json(
        { error: `Backend error: ${response.status}` }, 
        { status: response.status }
      );
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching flashcards:', error);
    return NextResponse.json(
      { error: 'Failed to fetch flashcards' }, 
      { status: 500 }
    );
  }
}

// POST method for creating a new flashcard
export async function POST(request: NextRequest) {
  try {
    // Get the session to check authentication
    const session = await auth();
    
    // If no session, return unauthorized
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' }, 
        { status: 401 }
      );
    }
    
    // Get request body
    const body = await request.json();
    
    // Get secure authentication headers with JWT token
    const headers = await getSecureAuthHeaders();
    
    // Make the authenticated request to the backend
    const response = await fetch(`${DICTIONARY_SERVER}/api/my-flashcards`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      cache: 'no-store'
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.warn(`Backend error: ${response.status} - ${errorText}`);
      
      return NextResponse.json(
        { error: `Backend error: ${response.status}` }, 
        { status: response.status }
      );
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating flashcard:', error);
    return NextResponse.json(
      { error: 'Failed to create flashcard' }, 
      { status: 500 }
    );
  }
} 