import { DICTIONARY_SERVER } from '@/config';
import { getAuthHeaders } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

// Updated helper to get secure JWT authentication headers
async function getSecureAuthHeaders() {
  // Use the updated auth library function that gets JWT tokens
  // This already handles all header formatting correctly
  return await getAuthHeaders();
}

// GET method for retrieving flashcards
export async function GET(
  request: NextRequest,
  { params }: { params: { deck: string } }
) {
  try {
    // Get the deck ID from the route params
    const deckId = params.deck;
    if (!deckId) {
      return NextResponse.json(
        { error: 'Missing deck ID in URL' },
        { status: 400 }
      );
    }

    // Get secure authentication headers with JWT token
    const headers = await getSecureAuthHeaders();
    
    // Make the authenticated request to the backend
    const response = await fetch(`${DICTIONARY_SERVER}/decks/${deckId}/flashcards`, {
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
    console.error('Error fetching flashcards:', error);
    return NextResponse.json(
      { error: 'Failed to fetch flashcards' }, 
      { status: 500 }
    );
  }
}

// POST method for creating a flashcard in a deck
export async function POST(
  request: NextRequest,
  { params }: { params: { deck: string } }
) {
  try {
    // Get the deck ID from the route params
    const deckId = params.deck;
    if (!deckId) {
      return NextResponse.json(
        { error: 'Missing deck ID in URL' },
        { status: 400 }
      );
    }
    
    // Get request body
    const body = await request.json();
    
    // Get secure authentication headers with JWT token
    const headers = await getSecureAuthHeaders();
    
    // Make the authenticated request to the backend
    const response = await fetch(`${DICTIONARY_SERVER}/decks/${deckId}/flashcards`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      cache: 'no-store'
    });
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${await response.text()}`);
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