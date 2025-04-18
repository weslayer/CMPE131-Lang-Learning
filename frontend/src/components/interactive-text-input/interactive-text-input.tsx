"use client"

import styles from "./interactive-text-input.module.css";



import { EditorState, Plugin, Transaction, PluginKey } from "prosemirror-state";
// import { schema } from "prosemirror-schema-basic";
import { ProseMirror, useEditorState } from "@nytimes/react-prosemirror";
import { useCallback, useEffect, useRef, useState } from "react";
import { Decoration, DecorationSet } from "prosemirror-view";
import { useEntryStore } from "@/util/entry-store";
import { Node, ResolvedPos, Schema, Slice } from "prosemirror-model";
import { Transform } from "prosemirror-transform";

import { TokenizationSchema } from "./TokenizationPlugin";
interface JPToken {
    token: string,
    type: string,
    base?: string
};


export default function InteractiveTextInput() {
    const [mount, setMount] = useState<HTMLElement | null>(null);
    
    const [state, setState] = useState(() => EditorState.create({ schema: TokenizationSchema, plugins: [ ]  }));

    const [ tokenization, setTokenization ] = useState([] as JPToken[]);

    const entries = useEntryStore();

    

    
    
    useEffect(() => {
        const timeout = setTimeout(() => {
            // console.log(state.doc.textContent);
            fetch(`/api/tokenize/cn?q=${encodeURIComponent(state.doc.textContent)}`).then(res => res.json()).then((res : {result: JPToken[]}) => {
                console.log(res);
                setTokenization(res.result);
            });
        }, 1000);
        return () => {
            clearTimeout(timeout);
        }
    }, [state.doc.textContent]);

    useEffect(() => {
        setState((s) => {

            //   console.log(doc, s.doc);
            let tr = s.tr;

            const text = s.doc.textContent;

            let i = 0;
            tokenization.forEach((token, j) => {
                i = text.indexOf(token.token, i);
                tr = tr.addMark(1+i, 1+i +token.token.length, schema.mark("token", {
                    pos: token.type,
                    i: j
                }));
                i += token.token.length;
            });

            tr = tr.removeMark(s.doc.content.size, s.doc.content.size);

            console.log(s.apply(tr));

            return s.apply(tr);
        });
    }, [tokenization]);

    // useEffect(() => {
    //     setState((state) => {

    //         return EditorState.apply()
    //     });
        

    // }, [entries]);
    
    // const editorState = useEditorState();

    return (
        <ProseMirror mount={mount} 
        
        
        state={state}
        dispatchTransaction={(tr) => {
            setState((s) => s.apply(tr));
        }}
        >
          <div ref={setMount} className="min-h-[6em] w-[60vw] bg-white/10 p-6 rounded-lg outline-none relative"/>
        </ProseMirror>
      );
}