import { WORK_COPY, WORK_STACK } from "@/lib/copy";
import styles from "./WorkSection.module.css";

export default function WorkSection() {
  return (
    <>
      <p className={styles.workIntro}>{WORK_COPY.intro}</p>
      <ul className={styles.tagList}>
        {WORK_STACK.map((tag) => (
          <li key={tag} className={styles.tag}>
            {tag}
          </li>
        ))}
      </ul>
      <p className={styles.workNote}>{WORK_COPY.note}</p>
    </>
  );
}
