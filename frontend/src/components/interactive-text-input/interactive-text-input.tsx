"use client"

import styles from "./interactive-text-input.module.css";

import { EditorState, Plugin } from "prosemirror-state";
import { schema } from "prosemirror-schema-basic";
import { ProseMirror, useEditorState } from "@nytimes/react-prosemirror";
import { useState } from "react";
import { Decoration, DecorationSet } from "prosemirror-view";

let specklePlugin = new Plugin({
    state: {
      init(_, {doc}) {
        let speckles = []
        for (let pos = 1; pos < doc.content.size; pos += 4)
          speckles.push(Decoration.inline(pos - 1, pos, {style: "background: yellow"}))
        return DecorationSet.create(doc, speckles)
      },
      apply(tr, set) { return set.map(tr.mapping, tr.doc) }
    },
    props: {
      decorations(state) { return specklePlugin.getState(state) }
    }
  });
  

  

let purplePlugin = new Plugin({
    props: {
        decorations(state) {
            // console.log(state.doc.textContent)
            const a = [
                "background-color: red",
                "background-color: green",
                "background-color: blue",
                "background-color: purple"
            ]
            let x= 0;
            // state.doc.textContent.split(" ").map((s,i) => {
            //     let y = x;
            //     x+=s.length+1;
            //     return Decoration.inline(y, s.length, {style: a[i]})
            // });

            return DecorationSet.create(state.doc, 
                state.doc.textContent.split(" ").map((s,i) => {
                    let y = x;
                    x+=s.length+1;
                    return Decoration.inline(y+1, y+s.length+1, {style: a[i % a.length]}, {
                        inclusiveEnd: true
                    })
                })
            )
        }
    }
})
  

const defaultState = EditorState.create({ schema, plugins: [ purplePlugin ] });
export default function InteractiveTextInput() {
    const [mount, setMount] = useState<HTMLElement | null>(null);


    // const editorState = useEditorState();

    return (
        <ProseMirror mount={mount} defaultState={defaultState}>
          <div ref={setMount} className={styles["input-area"]}/>
        </ProseMirror>
      );
}