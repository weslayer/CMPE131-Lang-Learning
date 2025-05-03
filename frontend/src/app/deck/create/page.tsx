"use client"

import { createDeck } from "@/actions/deck-actions";
import { useRouter } from "next/navigation";
import { useState } from "react";


export default function CreateDeckPage() {
    const [ name, setName ] = useState("");
    const [ desc, setDesc ] = useState("");
    const router = useRouter();

    return <div>
        <div>
            <label htmlFor="deck-name">Name</label> <br/>
            <input name="deck-name" value={name} onChange={(e) => setName(e.target.value)}/> <br/>
            <label htmlFor="deck-description">Description</label> <br/>
            <input name="deck-description" value={desc} onChange={(e) => setDesc(e.target.value)}/> <br/>
            <button onClick={async () => {
                const deckId = await createDeck({
                    name,
                    description: desc,
                });
                router.push(`/deck/${deckId}`);
            }}>Create deck</button> <br/>
        </div>
    </div>


}