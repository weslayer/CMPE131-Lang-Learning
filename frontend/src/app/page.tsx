import Image from "next/image";
import styles from "./page.module.css";
import InteractiveTextInput from "@/components/interactive-text-input/interactive-text-input";

export default function Home() {
  return (
    <div className="min-h-screen grid grid-rows-[20px_1fr_20px] items-center justify-items-center p-20 gap-16">
      <main className="flex flex-col gap-8">
        <InteractiveTextInput/>
      </main>
    </div>
  );
}
