"use client"

import { MultiRubyDisplay, RubyDisplay } from "@/components/ruby-display/ruby-display";
import { Flashcard } from '@/types/flashcard';
import styles from "./flashcard-list.module.css";

export function FlashcardView({ card } : { card : Flashcard }) {
  console.log(card);
    return <div className={`${styles["flashcard"]} bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100`}>
        <div className={styles["flashcard-term"]} style={{
            width: "200px"
        }}>
            <MultiRubyDisplay text={card.term} reading={card.reading}/>
        </div>
        <div className={`${styles["vertical"]} bg-gray-200 dark:bg-gray-600`}></div>
        <div className={`${styles["flashcard-definition"]} text-gray-800 dark:text-gray-200`}>
            {card.definition.split('\n').map((line, i) => (
                <div key={i}>{line}</div>
            ))}
        </div>
    </div>
}

interface FlashcardListProps {
  flashcards: Flashcard[];
  activeIndex?: number;
  onSelectCard?: (index: number) => void;
  emptyMessage?: string;
}

export default function FlashcardList({ 
  flashcards,
  activeIndex = -1,
  onSelectCard,
  emptyMessage = "You don't have any flashcards yet." 
}: FlashcardListProps) {
  if (!flashcards || flashcards.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400">{emptyMessage}</p>
      </div>
    );
  }
  console.log(flashcards);

  return (
    <div className={styles["flashcard-list"]}>
      <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-gray-100">All Flashcards</h3>
      <div className="grid grid-cols-1 gap-4">
        {flashcards.map((card, index) => (
          <FlashcardListItem 
            key={index} 
            flashcard={card}
            isActive={index === activeIndex}
            onClick={() => onSelectCard && onSelectCard(index)}
          />
        ))}
      </div>
    </div>
  );
}

interface FlashcardListItemProps {
  flashcard: Flashcard;
  isActive?: boolean;
  onClick?: () => void;
}

function FlashcardListItem({ 
  flashcard, 
  isActive = false,
  onClick
}: FlashcardListItemProps) {

  return (
    <div 
      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
        isActive 
          ? 'border-blue-500 bg-blue-50 text-blue-900' 
          : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-900 dark:text-gray-100'
      }`}
      onClick={onClick}
    >
      <div className="text-lg font-medium mb-2">
        <MultiRubyDisplay text={flashcard.term} reading={flashcard.reading}/>
      </div>
      <div className={`${isActive ? 'text-blue-800' : 'text-gray-700 dark:text-gray-300'}`}>
        {flashcard.definition.split('\n').map((line, i) => (
          <div key={i}>{line}</div>
        ))}
      </div>
    </div>
  );
} 