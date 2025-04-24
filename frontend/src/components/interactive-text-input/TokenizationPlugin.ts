import styles from "./interactive-text-input.module.css";

import { EditorState, Plugin, Transaction, PluginKey } from "prosemirror-state";
import { Decoration, DecorationSet } from "prosemirror-view";
import { Node, ResolvedPos, Schema, Slice } from "prosemirror-model";



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




export const TokenizationPlugin = new Plugin({
    state: {
        init(_, {doc}) { return decorateTokens(new Transaction(doc), doc) },
        apply(tr, old) { return tr.docChanged ? decorateTokens(tr, tr.doc) : old }
    },
    props: {
        decorations(state) { return this.getState(state) }
    }
})
  
export const TokenizationSchema = new Schema({
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