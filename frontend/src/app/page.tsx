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
import ChineseInput, { TokenCard } from "@/components/interactive-text-input/chinese-input";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface JPToken {
    token: string,
    type: string,
    // base?: string
};


export default function Home() {
    const [ tokens, setTokens ] = useState<string[]>([]);

    return (
        <main className="container mx-auto px-4 py-8">
            <div className="mb-8 text-center">
                <h1 className="text-3xl font-bold mb-2">Chinese Language Learning</h1>
                <p className="text-gray-900">
                    Enter Chinese text, see translations, and add words to your flashcard deck
                </p>
            </div>
            
            <ChineseInput setTokens={setTokens} />
            <div className="grid-cols-4">
                {tokens.map((token, i) => <TokenCard token={token} key={i} deckId=""/>)}
            </div>
        </main>
    );
}
