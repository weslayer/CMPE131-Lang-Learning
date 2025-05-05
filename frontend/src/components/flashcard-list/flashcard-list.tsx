"use client"

import { MultiRubyDisplay, RubyDisplay } from "@/components/ruby-display/ruby-display";
import { Flashcard } from '@/types/flashcard';
import styles from "./flashcard-list.module.css";
import { GoCheck, GoPencil, GoPlug, GoPlus, GoTrash, GoX } from "react-icons/go";
import { SetStateAction, useState } from "react";
import { DeckID } from "@/types/deck";
import FlashcardAddModal from "./flashcard-add-modal/flashcard-add-modal";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { addFlashcardToDeck, setDeckFlashcards } from "@/actions/deck-actions";


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
  deckID: DeckID
  activeIndex?: number;
  onSelectCard?: (index: number) => void;
  setFlashcard?: (index:number, newCard: Flashcard) => void;
  emptyMessage?: string;
  deckIDB64: string;
}

export default function FlashcardList({ 
  deckID,
  flashcards,
  activeIndex = -1,
  onSelectCard,
  setFlashcard,
  emptyMessage = "You don't have any flashcards yet." ,
  deckIDB64
}: FlashcardListProps) {
  const [ isCreatingCard, setIsCreatingCard ] = useState(false);
  const router = useRouter();

  setFlashcard = setFlashcard ?? (() => {});



  return (
    <div className={styles["flashcard-list"]}>
      <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-gray-100">All Flashcards</h3>
      <div className={styles["flashcard-list-list"]}>
        {flashcards.length !== 0 ? flashcards.map((card, index) => (
          <FlashcardListItem 
            key={index} 
            flashcard={card}
            isActive={index === activeIndex}
            onClick={() => onSelectCard && onSelectCard(index)}
            setFlashcard={(card) => setFlashcard(index, card)}
            deleteFlashcard={() => {
              const filtered = flashcards.filter((_, i) => i !== index);
              setDeckFlashcards(deckID, filtered);
              router.refresh();
            }}
          />
        )) : <div className="text-center py-8" style={{fontSize: "14px"}}>
        <p className="text-gray-500 dark:text-gray-400">{emptyMessage}</p>
      </div>}
        {isCreatingCard ? 
          <div 
            className={`p-4 rounded-lg cursor-pointer ${styles["cards"]} ${styles["active"]}`}
          >
          <FlashcardListItemEditing flashcard={{
            reading:"",
            term: "",
            definition:""
          }} cancel={() => {
            setIsCreatingCard(false);
          }} setFlashcard={(card) => {
            addFlashcardToDeck(deckID, card);
            setIsCreatingCard(false);
            router.refresh();
          }}/> 
        </div> : <></>}
        <div className={styles["button-list"]}>
          <button className={`${styles["button"]}`} onClick={() => setIsCreatingCard(true)}>
            Add Flashcard Manually
          </button>

          <button 
            className={`${styles["button"]}`} onClick={() => {
              router.push(deckIDB64+"/edit");
            }}>
            Add Flashcard From Text
          </button>
        </div>
      </div>
    </div>
  );
}

interface FlashcardListItemProps {
  flashcard: Flashcard;
  isActive?: boolean;
  setFlashcard: (newCard: Flashcard) => void;
  deleteFlashcard: () => void;
  onClick?: () => void;
}

export function FlashcardListItem({ 
  flashcard, 
  isActive = false,
  setFlashcard,
  onClick,
  deleteFlashcard
}: FlashcardListItemProps) {

  const [isEditing, setIsEditing ] = useState(false);

  return (
    <div 
      className={`p-4 rounded-lg cursor-pointer ${styles["cards"]} ${
        isActive 
          ? styles["active"] 
          : ""
      }`}
      onClick={onClick}
    >
      {isEditing ? <FlashcardListItemEditing flashcard={flashcard} cancel={() => {
        setIsEditing(false);
      }} setFlashcard={(i) => {
        
        setIsEditing(false);
        if(i.reading !== flashcard.reading || i.definition !== flashcard.definition || i.term !== flashcard.term) {
          setFlashcard(i);
        }
        }}/> : <><div className="">
        <MultiRubyDisplay text={flashcard.term} reading={flashcard.reading}/>
      </div>
      <div className={`${isActive ? 'text-blue-800' : ''}`} style={{
        fontSize: "0.4em"
      }}>
        {flashcard.definition.split('\n').map((line, i) => (
          <div key={i}>{line}</div>
        ))}
      </div>

      <div className={styles["toolbar"]}>

      <button className={`${styles["edit-button"]}`} onClick={() => {
        setIsEditing(true);
        }}>
            <GoPencil/>
        </button>

        <button className={`${styles["edit-button"]}`} onClick={() => {
          deleteFlashcard();
        }}>
            <GoTrash/>
        </button>
      </div>
      </>}
    </div>
  );
} 

function FlashcardListItemEditing({
  flashcard,
  setFlashcard,
  cancel
}: {flashcard: Flashcard, setFlashcard: (card: Flashcard) => void, cancel: () => void}) {

  const [ term, setTerm ] = useState(flashcard.term);
  const [ reading, setReading ] = useState(flashcard.reading);
  const [ definition, setDefinition ] = useState(flashcard.definition);

  const shouldCancel = term === "" || reading === "" || definition === "";

  return <div
    className={styles["editing"]}
    >
    <input 
      className={styles["reading-input"]}
      placeholder="Reading (běi;jīng)"
      value={reading} onChange={(e) => setReading(e.target.value)}/>
    <input 
      autoFocus
      className={styles["term-input"]}
      placeholder="Term (北;京)"
      value={term} onChange={(e) => setTerm(e.target.value)}/>
    <textarea 
      className={styles["definition-input"]}
      placeholder="Definition (Beijing city)"
      style={{
        fontSize: "0.4em"
      }}
      value={definition} onChange={(e) => setDefinition(e.target.value)}/>


    <div className={styles["toolbar"]}>

    <button className={`${styles["edit-button"]}`} onClick={() => {
        if(shouldCancel) cancel()
        else setFlashcard({
          definition: definition,
          reading: reading,
          term: term
        });
      }}>
        {(shouldCancel ? 
          <GoX/>
        : <GoCheck/>
        )}
      </button>
      </div>
  </div>
}