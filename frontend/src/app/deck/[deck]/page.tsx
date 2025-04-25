"use client"
import { Flashcard, FlashcardBack, FlashcardFront } from "@/components/flashcard-view/flashcard-view";
import { RubyDisplay } from "@/components/ruby-display/ruby-display";
import { TimelineControl } from "@/components/flashcard-control-bar/flashcard-control-bar";
import FlashcardList from "@/components/flashcard-list/flashcard-list";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import styles from "./style.module.css";
import { Flashcard as FlashcardType } from "@/types/deck";

interface FlashcardData extends FlashcardType {
  id?: string;
  _id?: string;
  created_at?: string;
}

export default function DeckPage({ params }: { params: { deck: string } }) {
  const { status } = useSession();
  const [cards, setCards] = useState<FlashcardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cardIndex, setCardIndex] = useState(0);
  const [side, setSide] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    
    const fetchFlashcards = async () => {
      try {
        const response = await fetch(`/api/decks/${params.deck}/flashcards`, {
          credentials: 'include',
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch flashcards: ${response.status}`);
        }
        
        const data = await response.json();
        setCards(data);
      } catch (err) {
        console.error('Error fetching flashcards:', err);
        setError(`Failed to load flashcards: ${(err as Error).message}`);
      } finally {
        setLoading(false);
      }
    };
    
    fetchFlashcards();
  }, [params.deck, status]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h2 className="text-xl text-red-700">Error loading flashcards</h2>
        <p>{error}</p>
      </div>
    );
  }

  if (!cards || cards.length === 0) {
    return (
      <div className="p-6">
        <h2 className="text-xl">No flashcards found</h2>
        <p>This deck doesn't have any flashcards yet.</p>
      </div>
    );
  }

  const currentCard = cards[cardIndex];
  const terms = Array.from(currentCard.term).map((char, i) => ({
    text: char,
    reading: i < currentCard.reading.length ? currentCard.reading[i] : ""
  }));

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

  return (
    <main className={styles.main}>
      <Flashcard side={side} onClick={() => setSide(prev => !prev)}>
        <FlashcardFront>
          <RubyDisplay terms={terms} />
        </FlashcardFront>
        <FlashcardBack>
          {currentCard.definition}
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
    </main>
  );
}