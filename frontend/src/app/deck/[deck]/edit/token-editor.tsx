"use client"
import ChineseInput, { TokenCard } from "@/components/interactive-text-input/chinese-input";
import { DeckID } from "@/types/deck";
import { useState } from "react";



export function TokenEditor({ deckId } : { deckId: DeckID }) {

    const [tokens, setTokens] = useState<string[]>([]);

    return <div>
        <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold mb-2">Add cards from text</h1>
            <p className="text-gray-900">
                Enter Chinese text, see translations, and add words to your flashcard deck
            </p>
        </div>
                    
            <ChineseInput setTokens={setTokens} />
            {tokens.length > 0 && (
                <div className="mt-6">
                <h3 className="text-lg font-semibold mb-3 text-gray-100">Words Found:</h3>
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                    {tokens.map((token, i) => (
                        <TokenCard 
                            key={i} 
                            token={token} 
                            deckId={deckId}
                        />
                    ))}
                </div>
                </div>
            )}
    </div>
}