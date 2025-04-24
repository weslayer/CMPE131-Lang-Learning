"use client"


import { create } from 'zustand'
import { DICTIONARY_ENDPOINT } from './endpoints';

interface Entry {
    phrase: string,
    reading: string,
    color?: string,
};


export const useEntryStore = create<{
    entries: {[key: string] : Entry}
}>((set) => ({
    entries: {},
    addEntry: (entry:Entry) => {
        set((state) => {
            const entries = { ...state.entries };
            entries[entry.phrase] = entry;
            return {
                entries
            };
        });
    },
    fetchEntry: (phrase: string) => {

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

        set((state) => {
            const entries = { ...state.entries };
            entries[phrase] = {
                phrase,
                reading: "",
                color: colors[Math.floor(Math.random() * colors.length)]
            };
            return {
                entries
            };
        });


        // fetch(`${DICTIONARY_ENDPOINT}/entry/${encodeURIComponent(phrase)}`).then(res => res.json()).then((entry : Entry) => {
        //     set((state) => {
        //         const entries = { ...state.entries };
        //         entries[entry.phrase] = entry;
        //         return {
        //             entries
        //         };
        //     });
        // }).catch(() => {

        // });
    }
}))