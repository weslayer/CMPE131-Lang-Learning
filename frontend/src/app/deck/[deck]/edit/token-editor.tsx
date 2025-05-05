"use client"
import { FlashcardListItem } from "@/components/flashcard-list/flashcard-list";
import styles from "./page.module.css"
import ChineseInput, { TokenCard } from "@/components/interactive-text-input/chinese-input";
import { DeckID } from "@/types/deck";
import { Flashcard } from "@/types/flashcard";
import { useState } from "react";
import { setDeckFlashcards } from "@/actions/deck-actions";
import Link from "next/link";
import { GoArrowLeft } from "react-icons/go";



export function TokenEditor({ cards, deckId, deckIDB64 } : { cards: Flashcard[], deckId: DeckID, deckIDB64: string }) {

    const [tokens, setTokens] = useState<string[]>([]);

    

    return <>


            <div className="mb-8" style={{margin: "48px 0"}}>
                <Link href={`/deck/${deckIDB64}/`} className={styles["link"]}><span><GoArrowLeft/></span> Back to flashcards</Link>
                <h1 className="text-3xl font-bold mb-2">Add cards from text</h1>
                <p className="">
                    Enter Chinese text, see translations, and add words to your flashcard deck
                </p>
            </div>
            <div className="mb-8" style={{marginBottom: "48px"}}>
            <ChineseInput setTokens={(tokens) => {
                setTokens(Array.from(new Set(tokens)));
            }} />
            </div>

            {tokens.length > 0 && (<>
                <h3 className="text-lg font-semibold mb-3 text-gray-100">Words Found:</h3>
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2" 
                style={{fontSize: "48px"}}>
                    {tokens.map((token, i) => (
                        <TokenCard 
                            cards={cards}
                            key={i} 
                            token={token} 
                            deckId={deckId}
                        />
                    ))}
                </div>
                </>
            )}
    </>
}