import styles from "./page.module.css";
import { database } from "@/actions/database";
import { ObjectId } from "mongodb";

import { TokenEditor } from "./token-editor";
import Link from "next/link";




export default async function DeckEditorPage({ params }: { params: { deck: string } }) {
  const deckID = await params.deck;
  const deck = await database.collection("decks").findOne({
    _id: ObjectId.createFromBase64(deckID)
  });

  // const cards = (deck?.cards ?? []) as Flashcard[];

  return (
    <>
      <TokenEditor deckIDB64={deckID} cards={deck?.cards} deckId={ObjectId.createFromBase64(deckID).toHexString()}/>
    </>
  );
}