"use client"

import styles from "./flashcard-view.module.css";
import { createContext, ReactNode, useContext } from "react";

interface SideContext {
    side: boolean,
}

const SideContext = createContext<SideContext>({
    side: false,
});

function useSide() {
    return useContext(SideContext).side
}

export function Flashcard({ side, onClick, children }:  { side: boolean, onClick?: () => void, children: ReactNode}) {
    return (
        <div 
            className="relative w-full max-w-xl mx-auto cursor-pointer"
            style={{
                width: "500px"
            }}
            onClick={onClick}
        >
            <SideContext.Provider value={{side}}>
                {children}
            </SideContext.Provider>
        </div>
    );
}

export function FlashcardFront({ children }:  { children: ReactNode}) {
    const side = useSide();
    return <div className={`${styles.flashcard} ${!side ? styles.shown : ''}`}>
        { children }
    </div>
}

export function FlashcardBack({ children }:  { children: ReactNode}) {
    const side = useSide();
    return <div className={`${styles.flashcard} ${side ? styles.shown : ''}`}>
        { children }
    </div>
}