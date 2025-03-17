

interface RubyTerm {
    text: string,
    reading: string
}

export function RubyDisplay({
    terms
} : { terms: RubyTerm[] }) {

    return <>
        {terms.map((term, i) => {
            return <ruby key={i}>
                {term.text}
                {( i == 0 ? <rp>(</rp> : <></>)}
                <rt>{term.reading}</rt>
                {( i == terms.length-1 ? <rp>)</rp> : <></>)}
            </ruby>
        })}
    </>
}