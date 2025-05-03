"use server"

import { DICTIONARY_SERVER } from "@/config";
import { getAuthHeaders } from "@/lib/auth";
import { DeckID, DeckOptions, User, UserID } from "@/types/deck";
import { Flashcard } from "@/types/flashcard";

import { ObjectId } from "mongodb";
import { client, database } from "./database";

import { auth } from "@/app/api/auth/[...nextauth]/route";

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
  const session = await auth();

  if(!session?.user.id ) {
    throw "Missing session";
  } 

  const deckData = {
    name: options.name,
    description: options.description || "",
    created_at: new Date(),
    updated_at: new Date(),
    owner: ObjectId.createFromHexString(session?.user.id),
    cards: []
  };
  

  const dbSession = client.startSession();
  dbSession.startTransaction();
  try{
    const deckResult = await database.collection("decks").insertOne(deckData);
    // const createdId = deckResult.insertedId.toHexString();
    
    await database.collection("users").findOneAndUpdate({
      _id: deckData.owner
    }, {
      $push: {
        decks: deckResult.insertedId
      }
    });
    dbSession.commitTransaction();
    return deckResult.insertedId.toString("base64");
  }catch(e) {
    throw e;
  }
}

/**
 * Get a specific deck by ID
 * @deprecated
 */
export async function getDeck(deckId: DeckID): Promise<any | null> {
  return await apiCall(`/decks/${deckId}`);
}

/**
 * Get the user's default deck
 * @deprecated
 */
export async function getDefaultDeck(): Promise<any | null> {
  return await apiCall('/user/default-deck');
}

/**
 * Get flashcards for a specific deck
 * @deprecated
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

  // const flashcardData = {
  //   term: flashcard.term,
  //   reading: Array.isArray(flashcard.reading) ? flashcard.reading : [],
  //   definition: flashcard.definition,
  //   // deck_id: deckId
  // };
  

  await database.collection("decks").findOneAndUpdate({
    _id: ObjectId.createFromHexString(deckId)
  }, {
    $push: {
      cards: flashcard
    }
  });
  // return await apiCall(`/decks/${deckId}/flashcards`, 'POST', flashcardData);
}

/**
 * Get all flashcards for the user's default deck
 * @deprecated
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
 * @deprecated
 */
export async function createFlashcard(flashcard: Flashcard): Promise<Flashcard | null> {
  const defaultDeck = await getDefaultDeck();
  if (!defaultDeck) {
    console.error("Could not retrieve default deck");
    return null;
  }
  
  await database.collection("users").findOneAndUpdate({
    _id: deckData.owner
  }, {
    $push: {
      decks: deckResult.insertedId
    }
  });
  return await addFlashcardToDeck(defaultDeck._id, flashcard);
}



// import { DATABASE_URI } from "../../config";


const users = database.collection("users");
/**
 * Get User by ID.
 * @param user 
 * @deprecated
 * @returns 
 */
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