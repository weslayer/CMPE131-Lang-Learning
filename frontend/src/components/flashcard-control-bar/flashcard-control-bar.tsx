import styles from "./flashcard-control-bar.module.css";
import { GoArrowLeft, GoArrowRight } from "react-icons/go";








export function TimelineControl({ position, total, onNext, onPrevious } : {
    position: number,
    total: number,
    onNext?: () => void,
    onPrevious?: () => void,
}) {



    return <div className={styles["timeline-control"]}>
        <button className={styles["timeline-button"]}
            disabled={position == 1}
            onClick={onPrevious}
        >
            <GoArrowLeft />
        </button>
        <span>{position}<span className={styles["timeline-bold"]}> / {total}</span></span>
        <button className={styles["timeline-button"]}
            onClick={onNext}
            disabled={position == total}
        >
            <GoArrowRight />
        </button>
    </div>

}

export function FlashcardControlBar({ timeline } : {
    timeline: { position: number,
    total: number,
    onNext?: () => void,
    onPrevious?: () => void }
}) {
    

    return <TimelineControl {...timeline}/>


}