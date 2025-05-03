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


interface MultiRubyDisplayArgs {
    text: string,
    reading: string
}
export function MultiRubyDisplay({
    text, reading
} : MultiRubyDisplayArgs) {

    const terms = text.split(";");
    const readings = reading.split(";");

    return <>
        {terms.map((term, i) => {
            return <ruby key={i} className={styles["ruby"]}>
                {term}
                <rt>{i < readings.length ? readings[i] : ""}</rt>
            </ruby>
        })}
    </>
}