import styles from "./ruby-display.module.css"

interface RubyTerm {
    text: string,
    reading: string
}

export function RubyDisplay({
    terms
} : { terms: RubyTerm[] }) {

    return <>
        {terms.map((term, i) => {
            return <ruby key={i} className={styles["ruby"]}>
                {term.text}
                <rt>{term.reading}</rt>
            </ruby>
        })}
    </>
}