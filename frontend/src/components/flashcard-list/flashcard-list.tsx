"use client"

import { RubyDisplay } from "@/components/ruby-display/ruby-display";
import styles from "./flashcard-list.module.css";
import { Flashcard } from '@/types/deck';
import FlashcardListItem from './flashcard-list-item';
import React from 'react';

interface Card {
    term: string,
    reading: string[],
    definition: string,
};

export function FlashcardView({ card } : { card : Card }) {
    const terms = Array.from(card.term).map((char, i) => {
        return {
            text: char,
            reading: card.reading && i < card.reading.length ? card.reading[i] : ""
        };
    });

    return <div className={`${styles["flashcard"]} bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100`}>
        <div className={styles["flashcard-term"]} style={{
            width: "200px"
        }}>
            <RubyDisplay
                terms={terms}
            />
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

  return (
    <div className={styles["flashcard-list"]}>
      <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-gray-100">All Flashcards</h3>
      <div className="grid grid-cols-1 gap-4">
        {flashcards.map((card, index) => (
          <FlashcardListItem 
            key={card.id || card._id || `flashcard-${index}`} 
            flashcard={card}
            isActive={index === activeIndex}
            onClick={() => onSelectCard && onSelectCard(index)}
          />
        ))}
      </div>
    </div>
  );
}