


export interface Flashcard {
    term: string;
    reading: string[];
    definition: string;
};

export interface Deck {
    id: DeckID;
    cards: Flashcard[];
}

export type FlashcardID = string;
export type DeckID = string;

export interface DeckOptions {
    name: string;
    // 
};

export type UserID = string;