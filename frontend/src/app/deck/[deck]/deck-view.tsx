"use client"

import { setDeckFlashcards } from "@/actions/deck-actions";
import { TimelineControl } from "@/components/flashcard-control-bar/flashcard-control-bar";
import FlashcardList from "@/components/flashcard-list/flashcard-list";
import { Flashcard, FlashcardBack, FlashcardFront } from "@/components/flashcard-view/flashcard-view";
import { MultiRubyDisplay, RubyDisplay } from "@/components/ruby-display/ruby-display";
import { DeckID } from "@/types/deck";
import { Flashcard as FlashcardT } from "@/types/flashcard";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DeckView({ cards, deckID, deckIDB64 } : { cards: FlashcardT[], deckID: DeckID, deckIDB64: string }) {

  const [cardIndex, setCardIndex] = useState(0);
  const [side, setSide] = useState(false);

  const router = useRouter();



  const currentCard = cards[cardIndex];
  
  const handleNext = () => {
    setSide(false);
    setCardIndex(i => Math.min(i + 1, cards.length - 1));
  };

  const handlePrevious = () => {
    setSide(false);
    setCardIndex(i => Math.max(0, i - 1));
  };

  const handleSelectCard = (index: number) => {
    setCardIndex(index);
    setSide(false);
  };


    return <>
        <Flashcard side={side} onClick={() => setSide(prev => !prev)}>
        <FlashcardFront>
            <div className="text-gray-900 font-bold" style={{
              fontSize: "48px"
            }}>
              {currentCard ? <MultiRubyDisplay text={currentCard.term} reading={currentCard.reading}/> : <></>}
            </div>
        </FlashcardFront>
        <FlashcardBack>
            {currentCard ? <div className="text-center">
            <h3 className="text-xl font-semibold mb-2 text-gray-800">Translation:</h3>
            <p className="text-gray-900 text-lg">
                {currentCard.definition}
            </p>
            </div> : <></>}
        </FlashcardBack>
        </Flashcard>

        <TimelineControl 
          position={cardIndex + 1} 
          total={cards.length}
          onNext={handleNext}
          onPrevious={handlePrevious}
        />

        <div className="mt-8">
        <FlashcardList 
          deckID={deckID}
          deckIDB64={deckIDB64}
            flashcards={cards} 
            activeIndex={cardIndex}
            onSelectCard={handleSelectCard}
            setFlashcard={async (i, card) => {
              const copy = cards.map((a) => a);
              copy[i] = card;
              await setDeckFlashcards(deckID, copy);
              router.refresh();
            }}
        />
        </div>
    </>
}