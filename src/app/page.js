import Image from "next/image";
import styles from "./page.module.css";
import InteractiveMap from "../components/InteractiveMap";

export default function Home() {
  return (
    <main className={styles.main}>
      <InteractiveMap />
    </main>
  );
}
