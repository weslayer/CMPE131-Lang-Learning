"use server"

import { DATABASE_URI, DICTIONARY_SERVER } from "@/config";
import { getAuthHeaders } from "@/lib/auth";
import { DeckID, DeckOptions, User, UserID } from "@/types/deck";
import { Flashcard } from "@/types/flashcard";

import { MongoClient, ObjectId } from "mongodb";
import { database } from "./database";

// Simple API call function with authentication
async function apiCall(endpoint: string, method: string = 'GET', data?: any): Promise<any> {
  try {
    // Get authentication headers with latest session info
    const headers = await getAuthHeaders();
    console.log(`Making ${method} request to ${endpoint}`);
    
    const response = await fetch(`${DICTIONARY_SERVER}${endpoint}`, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
      cache: 'no-store'
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`API call to ${endpoint} successful`);
      return data;
    }
    
    // Better error handling
    const errorText = await response.text();
    console.error(`API error (${response.status}) on ${endpoint}: ${errorText}`);
    
    if (response.status === 401) {
      console.log("Authentication error - session may have expired");
    }
    
    return null;
  } catch (error) {
    console.error(`API call error to ${endpoint}:`, error);
    return null;
  }
}

/**
 * Get all decks for the current user
 */
export async function getMyDecks(): Promise<any[]> {
  const decks = await apiCall('/user/decks');
  return decks || [];
}

/**
 * Create a new deck
 */
export async function createDeck(options: DeckOptions): Promise<DeckID | null> {
  const deckData = {
    name: options.name,
    description: options.description || "",
  };
  
  const result = await apiCall('/decks', 'POST', deckData);
  return result?._id || null;
}

/**
 * Get a specific deck by ID
 */
export async function getDeck(deckId: DeckID): Promise<any | null> {
  return await apiCall(`/decks/${deckId}`);
}

/**
 * Get the user's default deck
 */
export async function getDefaultDeck(): Promise<any | null> {
  return await apiCall('/user/default-deck');
}

/**
 * Get flashcards for a specific deck
 */
export async function getDeckFlashcards(deckId: DeckID): Promise<Flashcard[]> {
  const cards = await apiCall(`/decks/${deckId}/flashcards`);
  return cards || [];
}

/**
 * Add a flashcard to a specific deck
 */
export async function addFlashcardToDeck(deckId: DeckID, flashcard: Flashcard) {
  if (!flashcard.term || !flashcard.definition) {
    console.error("Invalid flashcard data: missing required fields");
    return null;
  }

  const flashcardData = {
    term: flashcard.term,
    reading: Array.isArray(flashcard.reading) ? flashcard.reading : [],
    definition: flashcard.definition,
    deck_id: deckId
  };
  
  return await apiCall(`/decks/${deckId}/flashcards`, 'POST', flashcardData);
}

/**
 * Get all flashcards for the user's default deck
 */
export async function getMyFlashcards(): Promise<Flashcard[]> {
  const deck = await getDefaultDeck();
  if (!deck) {
    console.error("Could not retrieve default deck");
    return [];
  }
  
  return await getDeckFlashcards(deck._id);
}

/**
 * Create a new flashcard in the user's default deck
 */
export async function createFlashcard(flashcard: Flashcard): Promise<Flashcard | null> {
  const defaultDeck = await getDefaultDeck();
  if (!defaultDeck) {
    console.error("Could not retrieve default deck");
    return null;
  }
  
  return await addFlashcardToDeck(defaultDeck._id, flashcard);
}



// import { DATABASE_URI } from "../../config";


const users = database.collection("users");

export async function getUser(user: UserID) : Promise<User|null> {

  const result = await users.findOne({
    _id: ObjectId.createFromHexString(user)
  });

  if(!result) {
    return null;
  }

  return {
    id: result._id.toString() ?? "",
    decks: result.decks ?? []
  };
}






// export async function getUserFlashcards(user: UserID) : Promise<DeckID> {

// }