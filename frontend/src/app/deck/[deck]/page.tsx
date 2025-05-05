"use server"
import styles from "./style.module.css";
import { database } from "@/actions/database";
import { ObjectId } from "mongodb";
import { Flashcard } from "@/types/flashcard";
import DeckView from "./deck-view";


export default async function DeckPage({ params }: { params: { deck: string } }) {
  await params;
  const deckID = await params.deck;
  const deck = await database.collection("decks").findOne({
    _id: ObjectId.createFromBase64(deckID)
  });

  const cards = (deck?.cards ?? []) as Flashcard[];

  // if (!cards || cards.length === 0) {
  //   return (
  //     <div className="p-6">
  //       <h2 className="text-xl">No flashcards found</h2>
  //       <p>This deck doesn&apos;t have any flashcards yet.</p>
  //     </div>
  //   );
  // }

  return (
    <div className={styles.main}>
      <h1 className={styles["deck-title"]}>{deck?.name}</h1>
      <p className={styles["deck-description"]}>{deck?.description}</p>
      <DeckView cards={cards} deckIDB64={deckID} deckID={ObjectId.createFromBase64(deckID).toHexString()}/>
    </div>
  );
}