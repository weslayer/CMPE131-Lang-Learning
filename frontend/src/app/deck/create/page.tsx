"use client"

import { createDeck } from "@/actions/deck-actions";
import { useRouter } from "next/navigation";
import { useState } from "react";
import styles from "./page.module.css";

export default function CreateDeckPage() {
    const [ name, setName ] = useState("");
    const [ desc, setDesc ] = useState("");
    const router = useRouter();

    return <>
            <div className="mb-8" style={{margin: "48px 0 32px 0"}}>
                <h1 className="text-3xl font-bold">Create a Deck</h1>
            </div>
        <div className={styles["form"]}>
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
    </>


}