import styles from "./page.module.css";
import { database } from "@/actions/database";
import { ObjectId } from "mongodb";

import { TokenEditor } from "./token-editor";




export default async function DeckEditorPage({ params }: { params: { deck: string } }) {

  const deck = await database.collection("decks").findOne({
    _id: ObjectId.createFromBase64(params.deck)
  });

  // const cards = (deck?.cards ?? []) as Flashcard[];

  return (
    <div className={styles.main}>
      <TokenEditor deckId={ObjectId.createFromBase64(params.deck).toHexString()}/>
    </div>
  );
}