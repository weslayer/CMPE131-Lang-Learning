export interface Flashcard {
    _id?: string;
    id?: string;
    term: string;
    reading: string[];
    definition: string;
    created_at?: string;
};

export interface Deck {
    id: DeckID;
    name: string;
    description?: string;
    cards: Flashcard[];
    created_at?: string;
    owner_id?: UserID;
}

export type FlashcardID = string;
export type DeckID = string;
export type UserID = string;

export interface DeckOptions {
    name: string;
    description?: string;
};