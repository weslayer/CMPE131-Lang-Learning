"use client"
import Image from "next/image";
import styles from "./page.module.css";
// import InteractiveTextInput from "@/components/interactive-text-input/interactive-text-input";
import { EditorState, Plugin, Transaction, PluginKey } from "prosemirror-state";
import { useEffect, useState } from "react";
import { ProseMirror } from "@nytimes/react-prosemirror";
import { schema } from "prosemirror-schema-basic";



interface JPToken {
    token: string,
    type: string,
    // base?: string
};




function TokenCard({ token } : { token : string }) {

    const [ entry, setEntry ] = useState({});

    return <div>
        <div className={styles["card-header"]}>{token}</div>
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
        {tokenization.map((token, i) =>  <li key={i}>{token}</li>)}
        </ul>
        </div>
        
    );
}
