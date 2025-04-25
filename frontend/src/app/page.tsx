"use client"
import Image from "next/image";
import styles from "./page.module.css";
import { EditorState, Plugin, Transaction, PluginKey } from "prosemirror-state";
import { useEffect, useState } from "react";
import { ProseMirror } from "@nytimes/react-prosemirror";
import { schema } from "prosemirror-schema-basic";
import { CDictEntry } from "@/types/cdict";
import { RubyDisplay } from "@/components/ruby-display/ruby-display";
import { GoPlus } from "react-icons/go";
import { createFlashcard } from "@/actions/deck-actions";
import { useSession } from "next-auth/react";
import ChineseInput from "@/components/interactive-text-input/chinese-input";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface JPToken {
    token: string,
    type: string,
    // base?: string
};

function TokenCard({ token } : { token : string }) {
    const { data: session, status } = useSession();
    const [ entries, setEntries ] = useState([] as CDictEntry[]);
    const [ loading, setLoading ] = useState(true);
    const [ error, setError ] = useState(false);
    const [ addedToFlashcards, setAddedToFlashcards ] = useState(false);
    const [ addingError, setAddingError ] = useState(false);

    useEffect(() => {
        setLoading(true);
        setError(false);
        setAddedToFlashcards(false);
        setAddingError(false);
        fetch(`/api/term/cn/${token}`)
            .then(res => {
                if (!res.ok) {
                    throw new Error(`Server responded with ${res.status}`);
                }
                return res.json();
            })
            .then((res: CDictEntry[]) => {
                console.log(res);
                setEntries(Array.isArray(res) ? res : []);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setError(true);
                setLoading(false);
            });
    }, [token]);

    // Show nothing while loading or if there are no entries
    if (loading || entries.length === 0) return <></>;

    // Check if we have valid entry with readings and senses
    const entry = entries[0] || null;
    const hasValidReadings = entry && 
                             Array.isArray(entry.reading) && 
                             entry.reading.length > 0;
    const hasValidSenses = entry && 
                           Array.isArray(entry.senses) && 
                           entry.senses.length > 0;

    const handleAddToFlashcards = async () => {
        if (!entry) return;
        
        // If not authenticated, show error briefly
        if (status !== "authenticated") {
            setAddingError(true);
            setTimeout(() => setAddingError(false), 2000);
            return;
        }
        
        try {
            setAddedToFlashcards(false);
            setAddingError(false);
            
            // Prepare readings - ensure it's an array with proper format
            let readings = entry.reading || [];
            
            // Ensure the definition is properly formatted
            let definition = "";
            if (entry.senses && entry.senses.length > 0) {
                // Format translations with numbering for multiple definitions
                definition = entry.senses.length === 1 
                    ? entry.senses[0] 
                    : entry.senses.map((sense, i) => `${i+1}. ${sense}`).join('\n');
            } else {
                definition = "No definition available";
            }
            
            // Create a flashcard from the dictionary entry
            const flashcard = {
                term: token,
                reading: readings,
                definition: definition
            };
            
            console.log("Creating flashcard:", flashcard);
            
            // Add to user's flashcard deck
            const result = await createFlashcard(flashcard);
            
            if (result) {
                setAddedToFlashcards(true);
                setTimeout(() => setAddedToFlashcards(false), 2000); // Reset after 2 seconds
            } else {
                setAddingError(true);
                setTimeout(() => setAddingError(false), 2000);
            }
        } catch (error) {
            console.error("Error adding flashcard:", error);
            setAddingError(true);
            setTimeout(() => setAddingError(false), 2000);
        }
    };

    return <div className={styles["card"]}>
        <div className={styles["card-header"]}>
            {hasValidReadings ? 
                <RubyDisplay
                    terms={token.split("").map((character, i) => {
                        return {
                            text: character,
                            reading: (entry && entry.reading && i < entry.reading.length) 
                                      ? entry.reading[i] 
                                      : ""
                        };
                    })}
                /> : token}
        </div>
        <button 
            className={styles["flashcard-add"]} 
            onClick={handleAddToFlashcards}
            title={status !== "authenticated" ? "Sign in to add flashcards" : "Add to flashcards"}
            style={{ 
                backgroundColor: addedToFlashcards ? '#4CAF50' : addingError ? '#FF5252' : '',
                cursor: status === "authenticated" ? 'pointer' : 'not-allowed'
            }}
        >
            {addedToFlashcards ? '✓' : addingError ? '✗' : <GoPlus/>}
        </button>
        <hr/>
        <div className="text-gray-900">
            {hasValidSenses ? (
                <ol>
                    {entry.senses.map((sense, i) => (
                        <li key={i}>{sense}</li>
                    ))}
                </ol>
            ) : (
                <p>No definitions available</p>
            )}
        </div>
    </div>
}

export default function Home() {
    const { data: session, status } = useSession();
    const [addedWords, setAddedWords] = useState<string[]>([]);
    
    const handleWordAdded = (word: string) => {
        setAddedWords(prev => [...prev, word]);
    };

    return (
        <main className="container mx-auto px-4 py-8">
            <div className="mb-8 text-center">
                <h1 className="text-3xl font-bold mb-2">Chinese Language Learning</h1>
                <p className="text-gray-900">
                    Enter Chinese text, see translations, and add words to your flashcard deck
                </p>
            </div>
            
            <ChineseInput onWordAdded={handleWordAdded} />
        </main>
    );
}
