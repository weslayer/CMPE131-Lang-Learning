"use client"
import { Flashcard, FlashcardBack, FlashcardFront, FlashcardView } from "@/components/flashcard-view/flashcard-view";
import styles from "./style.module.css";
import { RubyDisplay } from "@/components/ruby-display/ruby-display";
import { useState } from "react";
import { TimelineControl } from "@/components/flashcard-control-bar/flashcard-control-bar";
import FlashcardList from "@/components/flashcard-list/flashcard-list";




const cards = [
    {
        term: "出現",
        reading: "chū xiàn",
        definition: "To appear",
    }, 
    {
        term: "回來",
        reading: "hui lái",
        definition: "To return",
    }, 
    {
        term: "看到",
        reading: "kàn dào",
        definition: "See; Seen",
    }, 
    {
        term: "試試看",
        reading: "shì shì kàn",
        definition: "Try and see",
    }, 
    {
        term: "然後",
        reading: "rán hòu",
        definition: "And then, next",
    }
]

export default function SlideDeck() {



    // const card = cards[0];

    const [ cardIndex, setCardIndex ] = useState(0);
    const card = cards[cardIndex];
    const terms = card.reading.split(" ").map((a, i) => ({text: card.term[i], reading: a}));


    const [ side, setSide ] = useState(false);

    return <main className={styles["main"]}>
        <Flashcard side={side} onClick={() => setSide((side) => !side)}>
            <FlashcardFront>
                    
                    <RubyDisplay
                        terms={terms}
                    />
            </FlashcardFront>
            <FlashcardBack>
                    {card.definition}
            </FlashcardBack>
        </Flashcard>

        <TimelineControl position={cardIndex+1} total={cards.length}
            onNext={() => {
                setSide(false);
                setCardIndex((i) => Math.min(i + 1, cards.length - 1))
            }}
            onPrevious={() => {
                setSide(false);
                setCardIndex((i) => Math.max(0, i - 1))
            }}
        />

        <FlashcardList
            cards={cards}
        ></FlashcardList>
    </main>
}