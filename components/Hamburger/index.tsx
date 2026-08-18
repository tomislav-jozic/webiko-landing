"use client";

import { useState } from "react";
import { NAV_LABELS } from "@/lib/copy";
import styles from "./Hamburger.module.css";

type Props = {
  open: boolean;
  onToggle: () => void;
};

export default function Hamburger({ open, onToggle }: Props) {
  const [hover, setHover] = useState(false);

  return (
    <button
      type="button"
      className={`${styles.ham} ${hover || open ? styles.hamHover : ""}`}
      onClick={onToggle}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      aria-expanded={open}
      aria-controls="webiko-menu"
      aria-label={open ? NAV_LABELS.closeMenu : NAV_LABELS.openMenu}
    >
      <span className={styles.hamLines} aria-hidden="true">
        <span
          className={styles.hamLine}
          style={{
            transform: open ? "translateY(8px) rotate(45deg)" : "none",
          }}
        />
        <span className={styles.hamLine} style={{ opacity: open ? 0 : 1 }} />
        <span
          className={styles.hamLine}
          style={{
            transform: open ? "translateY(-8px) rotate(-45deg)" : "none",
          }}
        />
      </span>
    </button>
  );
}
