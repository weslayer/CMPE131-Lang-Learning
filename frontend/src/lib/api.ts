import { Flashcard } from "@/types/flashcard";
import { getAuthHeaders } from "./auth";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

/**
 * Make an authenticated API call to the backend
 */
export async function fetchAPI(
  endpoint: string, 
  options: RequestInit = {}
) {
  // Get secure authentication headers with JWT token
  const authHeaders = await getAuthHeaders();
  
  // Merge headers
  const headers = {
    ...authHeaders,
    ...options.headers,
  };
  
  // Make the API call
  const response = await fetch(`${BACKEND_URL}${endpoint}`, {
    ...options,
    headers,
  })
  
  // Handle non-2xx responses
  if (!response.ok) {
    const errorData = await response.json().catch(() => null)
    throw new Error(
      errorData?.detail || 
      `API call failed with status ${response.status}`
    )
  }
  
  // Return the JSON response
  return response.json()
}

/**
 * Get user's flashcards
 */
export async function getFlashcards(): Promise<Flashcard[]> {
  return fetchAPI('/api/my-flashcards')
}

/**
 * Create a new flashcard
 */
export async function createFlashcard(flashcardData: Partial<Flashcard>): Promise<Flashcard> {
  return fetchAPI('/api/my-flashcards', {
    method: 'POST',
    body: JSON.stringify(flashcardData),
  })
}

/**
 * Delete a flashcard
 */
export async function deleteFlashcard(flashcardId: string): Promise<void> {
  return fetchAPI(`/flashcards/${flashcardId}`, {
    method: 'DELETE',
  })
} 