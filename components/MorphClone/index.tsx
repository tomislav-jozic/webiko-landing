"use client";

import type { RefObject } from "react";
import styles from "./MorphClone.module.css";

export type MorphState = {
  label: string;
  left: number;
  top: number;
  fontSize: number;
};

type Props = {
  morph: MorphState | null;
  morphRef: RefObject<HTMLDivElement | null>;
};

// The floating clone that carries a clicked menu label from its position in
// the overlay to the panel heading position underneath, before the panel
// beneath it is revealed. Purely presentational — the transition animation
// lives in the orchestrator, since it needs to flip `revealed` when done.
export default function MorphClone({ morph, morphRef }: Props) {
  if (!morph) return null;
  return (
    <div
      ref={morphRef}
      aria-hidden="true"
      className={styles.morph}
      style={{ left: morph.left, top: morph.top, fontSize: morph.fontSize }}
    >
      {morph.label}
    </div>
  );
}
