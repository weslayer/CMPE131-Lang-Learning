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

    return (<>
            <div className="mb-8" style={{margin: "48px 0"}}>
                <h1 className="text-3xl font-bold mb-2">Chinese Language Learning</h1>
                <p className="">
                    Enter Chinese text, see translations, and add words to your flashcard deck
                </p>
            </div>
            
            <ChineseInput setTokens={setTokens} />
            <div className={styles["grid"]} >
                {tokens.map((token, i) => <TokenCard token={token} key={i}/>)}
            </div>
    </>
    );
}
