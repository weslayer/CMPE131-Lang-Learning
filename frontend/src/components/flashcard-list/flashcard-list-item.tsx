"use client"

import { Flashcard } from '@/types/deck';
import { RubyDisplay } from "../ruby-display/ruby-display";
import styles from "./flashcard-list.module.css";

interface FlashcardListItemProps {
  flashcard: Flashcard;
  isActive?: boolean;
  onClick?: () => void;
}

export default function FlashcardListItem({ 
  flashcard, 
  isActive = false,
  onClick
}: FlashcardListItemProps) {
  const terms = Array.from(flashcard.term).map((char, i) => ({
    text: char,
    reading: i < flashcard.reading.length ? flashcard.reading[i] : ""
  }));

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
        <RubyDisplay terms={terms} />
      </div>
      <div className={`${isActive ? 'text-blue-800' : 'text-gray-700 dark:text-gray-300'}`}>
        {flashcard.definition.split('\n').map((line, i) => (
          <div key={i}>{line}</div>
        ))}
      </div>
    </div>
  );
} 