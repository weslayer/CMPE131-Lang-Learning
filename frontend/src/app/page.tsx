"use client"
import Image from "next/image";
import styles from "./page.module.css";
// import InteractiveTextInput from "@/components/interactive-text-input/interactive-text-input";
import { EditorState, Plugin, Transaction, PluginKey } from "prosemirror-state";
import { useEffect, useState } from "react";
import { ProseMirror } from "@nytimes/react-prosemirror";
import { schema } from "prosemirror-schema-basic";
import { CDictEntry } from "@/types/cdict";
import { RubyDisplay } from "@/components/ruby-display/ruby-display";


import { GoPlus } from "react-icons/go";
import { addFlashcard, createDeck } from "@/actions/deck-actions";


interface JPToken {
    token: string,
    type: string,
    // base?: string
};




function TokenCard({ token } : { token : string }) {

    const [ entries, setEntries ] = useState([] as CDictEntry[]);

    useEffect(() => {
        fetch(`/api/term/cn/${token}`).then(res=>res.json()).then((res:CDictEntry[]) => {
            console.log(res);
            setEntries(res);
        });
    }, [token]);



    if(entries.length == 0) return <></>

    return <div className={styles["card"]}>
        <div className={styles["card-header"]}>
            {entries && entries[0] ? <RubyDisplay
                terms={token.split("").map((character, i) => {
                    return {
                        text: character,
                        reading: entries[0].reading[i]
                    };
                })}
            /> : token}
        </div>
        <button className={styles["flashcard-add"]} onClick={() => {
            // addFlashcard("afds", {
            //     definition: "hihii",
            //     term: "ohayo",
            //     reading: ["ohio"]
            // });

            createDeck("", {
                name: "test1"
            });
        }}>
            <GoPlus/>
        </button>
        <hr/>
        <ol>
            {entries[0].senses.map(((senses, i) => {
                return <li key={i}>{senses}</li>
            }))}
        </ol>
    </div>
}







export default function Home() {
    const [mount, setMount] = useState<HTMLElement | null>(null);
    const [state, setState] = useState(() => EditorState.create({ schema }));
    
    
    
    const [ tokenization, setTokenization ] = useState([] as string[]);
    
    // const entries = useEntryStore();
    
    
    
    
    
    useEffect(() => {
        const timeout = setTimeout(() => {
            // console.log(state.doc.textContent);
            const trimmed = state.doc.textContent.trim();
            if(trimmed.length == 0) {
                return;
            }
            fetch(`/api/tokenize/cn?q=${encodeURIComponent(trimmed)}`).then(res => res.json()).then((res : {tokens: string[]}) => {
                // console.log(res);
                setTokenization(res.tokens);
            });
        }, 1000);
        return () => {
            clearTimeout(timeout);
        }
    }, [state.doc.textContent]);
    
    
    
    return (<div className={styles["container"]}>
        
        <ProseMirror mount={mount} 
        
        
        state={state}
        dispatchTransaction={(tr) => {
            setState((s) => s.apply(tr));
        }}
        >
        <div ref={setMount} className="min-h-[6em] w-[60vw] bg-white/10 p-6 rounded-lg outline-none relative"/>
        </ProseMirror>
        
        <ul>
        {tokenization.map((token, i) =>  <li key={i}>

            <TokenCard token={token}/>
        </li>)}
        </ul>
        </div>
        
    );
}
