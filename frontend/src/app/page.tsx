import Image from "next/image";
import styles from "./page.module.css";
import InteractiveTextInput from "@/components/interactive-text-input/interactive-text-input";

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
          <InteractiveTextInput/>
      </main>
    </div>
  );
}
