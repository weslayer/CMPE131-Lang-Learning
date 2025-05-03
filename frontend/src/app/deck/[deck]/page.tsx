// "use client"
// import { TimelineControl } from "@/components/flashcard-control-bar/flashcard-control-bar";
// import FlashcardList from "@/components/flashcard-list/flashcard-list";
// import { Flashcard, FlashcardBack, FlashcardFront } from "@/components/flashcard-view/flashcard-view";
// import { RubyDisplay } from "@/components/ruby-display/ruby-display";
// import { Flashcard as FlashcardType } from "@/types/deck";
import { useSession } from "next-auth/react";
// import { useEffect, useState } from "react";
import styles from "./style.module.css";
import { database } from "@/actions/database";
import { ObjectId } from "mongodb";
import { Flashcard } from "@/types/flashcard";
import DeckView from "./deck-view";




export default async function DeckPage({ params }: { params: { deck: string } }) {

  const deck = await database.collection("decks").findOne({
    _id: ObjectId.createFromBase64(params.deck)
  });

  const cards = (deck?.cards ?? []) as Flashcard[];

  if (!cards || cards.length === 0) {
    return (
      <div className="p-6">
        <h2 className="text-xl">No flashcards found</h2>
        <p>This deck doesn&apos;t have any flashcards yet.</p>
      </div>
    );
  }

  return (
    <div className={styles.main}>
      <DeckView cards={cards}/>
    </div>
  );
}