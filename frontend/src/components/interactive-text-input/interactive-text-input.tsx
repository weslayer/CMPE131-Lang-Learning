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

interface JPToken {
    token: string,
    type: string,
    base?: string
};

// Add type for the plugin state
type SpecklePluginState = DecorationSet;

const specklePluginKey = new PluginKey<SpecklePluginState>('speckle');

const specklePlugin = new Plugin<SpecklePluginState>({
    key: specklePluginKey,
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
      decorations(state) { return this.getState(state) }
    }
});
  






function decorateTokens(tr:Transaction, doc : Node) {

    
    console.log(tr);

    const tokens: Array<{from: number, to: number}> = [];
    // For each node in the document
    doc.descendants((node, pos) => {
        if (!node.isText) return;
        const text = node.text ?? "";
        let i = 0;
        let j = text.indexOf(" ", i);
        while(j != -1) {
            if(i != j) {
                tokens.push({
                    from: i + pos,
                    to: j + pos,
                });
            }
            i = j + 1;
            j = text.indexOf(" ", i+1);
        }
        if(i != text.length) {
            tokens.push({
                from: i + pos,
                to: text.length + pos,
            });
        }
    });

    console.log(tokens);
    const decos : Decoration[] = [];


    const colors = [
        "#b0913c",
        "#c7472a",
        "#d17321",
        "#66c92c",
        "#2ad48d",
        "#22c9c9",
        "#1f4eb5",
        "#992bd9",
        "#c41d76"   
    ];


    tokens.forEach((token, i) => {
        decos.push(Decoration.inline(token.from, token.to, { style: `background-color: ${colors[i % colors.length]}`  }))
    });

    return DecorationSet.create(doc, decos);
}





const TokenizationPlugin = new Plugin({
    state: {
        init(_, {doc}) { return decorateTokens(new Transaction(doc), doc) },
        apply(tr, old) { return tr.docChanged ? decorateTokens(tr, tr.doc) : old }
    },
    props: {
        decorations(state) { return this.getState(state) }
    }
})

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
  
const schema = new Schema({
    nodes: {
        doc: {content: "paragraph+"},
        paragraph: {content: "text*",
            toDOM() { return ["p", 0] },
        },
        text: {inline: true},
    },

    marks: {
        token: {
            attrs: {
                pos: {
                    default: "EOS"
                },
                i: {
                    default: -1
                }
            },
            toDOM(mark) {
                console.log("?fdsafds", mark)
                return [
                    "span",
                    {
                        class: styles["jp-token"]+" "+styles[`token-${mark.attrs.pos}`]
                    }
                ];
            }
        }
    }
});

export default function InteractiveTextInput() {
    const [mount, setMount] = useState<HTMLElement | null>(null);
    
    const [state, setState] = useState(() => EditorState.create({ schema, plugins: [ ]  }));

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