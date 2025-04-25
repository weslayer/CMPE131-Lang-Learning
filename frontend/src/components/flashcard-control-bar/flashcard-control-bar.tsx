import styles from "./flashcard-control-bar.module.css";
import { GoArrowLeft, GoArrowRight } from "react-icons/go";

interface TimelineControlProps {
  position: number;
  total: number;
  onNext?: () => void;
  onPrevious?: () => void;
}

export function TimelineControl({ 
  position, 
  total, 
  onNext, 
  onPrevious 
}: TimelineControlProps) {
  return (
    <div className={styles["timeline-control"]}>
      <button 
        className={styles["timeline-button"]}
        disabled={position <= 1}
        onClick={onPrevious}
        aria-label="Previous card"
      >
        <GoArrowLeft />
      </button>
      
      <span>
        {position}<span className={styles["timeline-bold"]}> / {total}</span>
      </span>
      
      <button 
        className={styles["timeline-button"]}
        onClick={onNext}
        disabled={position >= total}
        aria-label="Next card"
      >
        <GoArrowRight />
      </button>
    </div>
  );
}

export function FlashcardControlBar({ timeline }: {
  timeline: TimelineControlProps;
}) {
  return <TimelineControl {...timeline} />;
}