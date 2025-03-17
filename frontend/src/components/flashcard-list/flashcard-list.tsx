"use client"

import { RubyDisplay } from "@/components/ruby-display/ruby-display";
import styles from "./flashcard-list.module.css";


interface Card {
    term: string,
    reading: string,
    definition: string,
};





export function FlashcardView({ card } : { card : Card }) {

    const terms = card.reading.split(" ").map((a, i) => ({text: card.term[i], reading: a}));

    return <div className={styles["flashcard"]}>
        <div className={styles["flashcard-term"]} style={{
            width: "200px"
        }}>
            <RubyDisplay
                terms={terms}
            />

        </div>
        <div className={styles["vertical"]}></div>
        <div className={styles["flashcard-definition"]}>{card.definition}</div>
    </div>
}




export default function FlashcardList({ cards }) {
    
    return <div className={styles["cards"]}>

        {cards.map((card, i) => {
            return <FlashcardView key={i} card={card}/>
        })}

    </div>
}