"use server"

import { DeckID, DeckOptions, Flashcard, UserID } from "@/types/deck";
import { MongoClient, ObjectId } from "mongodb";
import { DATABASE_URI } from "../../config";


// Create a new client and connect to MongoDB
const client = new MongoClient(DATABASE_URI);
const database = client.db("langlearn");

export async function addFlashcard(deck: DeckID, flashcard: Flashcard) {


    console.log(deck, flashcard);
}

export async function createDeck(user: UserID, options: DeckOptions) : Promise<DeckID>{

    const decks = database.collection("decks");

    const result = await decks.insertOne({
        name: options.name,
        owner: user
    }, {});

    return result.insertedId.toString();
}   