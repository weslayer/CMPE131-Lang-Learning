"use server"

import { DeckID, DeckOptions, Flashcard, UserID } from "@/types/deck";
import { DICTIONARY_SERVER } from "../../config";
import { getAuthHeaders, createAuthFetch } from "@/lib/auth";

/**
 * Get all decks for the current user
 */
export async function getMyDecks(): Promise<any[]> {
    try {
        // Get authentication headers
        const headers = await getAuthHeaders();
        
        // Call the API
        const response = await fetch(`${DICTIONARY_SERVER}/user/decks`, {
            method: 'GET',
            headers: headers as HeadersInit,
            cache: 'no-store',
        });
        
        if (!response.ok) {
            // Log error details
            const errorText = await response.text();
            console.error(`Error fetching decks (${response.status}): ${errorText}`);
            return [];
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error fetching decks:", error);
        return [];
    }
}

/**
 * Create a new deck
 */
export async function createDeck(options: DeckOptions): Promise<DeckID | null> {
    try {
        // Get authentication headers
        const headers = await getAuthHeaders();
        
        // Call the backend directly
        const apiUrl = `${DICTIONARY_SERVER}/decks`;
        
        console.log(`Creating deck "${options.name}" via backend API`);
        
        // Properly format the request to match backend expectations
        const deckData = {
            name: options.name,
            description: options.description || "",
        };
        
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: headers as HeadersInit,
            body: JSON.stringify(deckData),
        });
        
        if (!response.ok) {
            let errorText = '';
            try {
                const errorData = await response.json();
                errorText = JSON.stringify(errorData);
            } catch (e) {
                errorText = await response.text();
            }
            console.error(`Backend responded with status ${response.status}: ${errorText}`);
            return null;
        }
        
        const result = await response.json();
        console.log("Deck created successfully:", result);
        // The backend returns the ID as '_id'
        return result._id;
    } catch (error) {
        console.error("Error in createDeck:", error);
        return null;
    }
}

/**
 * Get a specific deck by ID
 */
export async function getDeck(deckId: DeckID): Promise<any | null> {
    try {
        // Get authentication headers
        const headers = await getAuthHeaders();
        
        // Call the API
        const response = await fetch(`${DICTIONARY_SERVER}/decks/${deckId}`, {
            method: 'GET',
            headers: headers as HeadersInit,
            cache: 'no-store',
        });
        
        if (!response.ok) {
            // Log error details
            const errorText = await response.text();
            console.error(`Error fetching deck ${deckId} (${response.status}): ${errorText}`);
            return null;
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error(`Error fetching deck ${deckId}:`, error);
        return null;
    }
}

/**
 * Get the user's default deck
 */
export async function getDefaultDeck(): Promise<any | null> {
    try {
        // Get authentication headers
        const headers = await getAuthHeaders();
        
        // Call the API
        const response = await fetch(`${DICTIONARY_SERVER}/user/default-deck`, {
            method: 'GET',
            headers: headers as HeadersInit,
            cache: 'no-store',
        });
        
        if (!response.ok) {
            // Log error details
            const errorText = await response.text();
            console.error(`Error fetching default deck (${response.status}): ${errorText}`);
            return null;
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error fetching default deck:", error);
        return null;
    }
}

/**
 * Get flashcards for a specific deck
 */
export async function getDeckFlashcards(deckId: DeckID): Promise<Flashcard[]> {
    try {
        // Get authentication headers
        const headers = await getAuthHeaders();
        
        // Call the API
        const response = await fetch(`${DICTIONARY_SERVER}/decks/${deckId}/flashcards`, {
            method: 'GET',
            headers: headers as HeadersInit,
            cache: 'no-store',
        });
        
        if (!response.ok) {
            // Log error details
            const errorText = await response.text();
            console.error(`Error fetching flashcards for deck ${deckId} (${response.status}): ${errorText}`);
            return [];
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error(`Error fetching flashcards for deck ${deckId}:`, error);
        return [];
    }
}

/**
 * Add a flashcard to a specific deck
 */
export async function addFlashcardToDeck(deckId: DeckID, flashcard: Flashcard) {
    try {
        console.log(`Adding flashcard to deck ${deckId}:`, flashcard);
        
        // Validate flashcard data
        if (!flashcard.term || !flashcard.definition) {
            console.error("Invalid flashcard data: missing required fields");
            return null;
        }

        // Get authentication headers
        const headers = await getAuthHeaders();
        
        // Call the backend directly with the user information
        const apiUrl = `${DICTIONARY_SERVER}/decks/${deckId}/flashcards`;
        
        console.log(`Calling backend at ${apiUrl}`);
        
        // Ensure readings array exists
        const flashcardData = {
            term: flashcard.term,
            reading: Array.isArray(flashcard.reading) ? flashcard.reading : [],
            definition: flashcard.definition
        };
        
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: headers as HeadersInit,
            body: JSON.stringify(flashcardData),
        });
        
        if (!response.ok) {
            let errorText = '';
            try {
                const errorData = await response.json();
                errorText = JSON.stringify(errorData);
            } catch (e) {
                errorText = await response.text();
            }
            console.error(`Backend responded with status ${response.status}: ${errorText}`);
            return null;
        }
        
        const result = await response.json();
        console.log("Flashcard added to deck successfully:", result);
        return result;
    } catch (error) {
        console.error(`Error adding flashcard to deck ${deckId}:`, error);
        return null;
    }
}

/**
 * Get all flashcards for the user's default deck
 * This is a convenience function that gets the default deck's flashcards
 */
export async function getMyFlashcards(): Promise<Flashcard[]> {
    try {
        // Get authentication headers
        const headers = await getAuthHeaders();
        
        // First get the default deck
        const defaultDeck = await getDefaultDeck();
        if (!defaultDeck) {
            console.error("Could not retrieve default deck");
            return [];
        }
        
        // Now get the flashcards for this deck
        return await getDeckFlashcards(defaultDeck._id);
    } catch (error) {
        console.error("Error fetching default deck flashcards:", error);
        return [];
    }
}

/**
 * Create a new flashcard in the user's default deck
 * This is a convenience function that adds a flashcard to the default deck
 */
export async function createFlashcard(flashcard: Flashcard): Promise<Flashcard | null> {
    try {
        // First get the default deck
        const defaultDeck = await getDefaultDeck();
        if (!defaultDeck) {
            console.error("Could not retrieve default deck");
            return null;
        }
        
        // Add the flashcard to the default deck
        return await addFlashcardToDeck(defaultDeck._id, flashcard);
    } catch (error) {
        console.error("Error creating flashcard in default deck:", error);
        return null;
    }
}   