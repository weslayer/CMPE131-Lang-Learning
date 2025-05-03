"use client"

import { TimelineControl } from "@/components/flashcard-control-bar/flashcard-control-bar";
import FlashcardList from "@/components/flashcard-list/flashcard-list";
import { Flashcard, FlashcardBack, FlashcardFront } from "@/components/flashcard-view/flashcard-view";
import { MultiRubyDisplay, RubyDisplay } from "@/components/ruby-display/ruby-display";
import { Flashcard as FlashcardT } from "@/types/flashcard";
import { useState } from "react";

export default function DeckView({ cards } : { cards: FlashcardT[] }) {

  const [cardIndex, setCardIndex] = useState(0);
  const [side, setSide] = useState(false);




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
            <div className="text-gray-900 text-4xl font-bold">
              <MultiRubyDisplay text={currentCard.term} reading={currentCard.reading}/>
            </div>
        </FlashcardFront>
        <FlashcardBack>
            <div className="text-center">
            <h3 className="text-xl font-semibold mb-2 text-gray-800">Translation:</h3>
            <p className="text-gray-900 text-lg">
                {currentCard.definition}
            </p>
            </div>
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
            flashcards={cards} 
            activeIndex={cardIndex}
            onSelectCard={handleSelectCard}
        />
        </div>
    </>
}