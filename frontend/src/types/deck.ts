import { ObjectId } from 'mongodb';
import { Flashcard } from './flashcard';

export interface Deck {
    id: DeckID;
    name: string;
    description?: string;
    cards: Flashcard[];
    created_at?: string;
    owner_id?: UserID;
}

export type DeckID = string;
export type UserID = string;

export interface DeckOptions {
    name: string;
    description?: string;
};

export interface User {
    id: UserID;

    decks: DeckID[]
}