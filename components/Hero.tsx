"use client";

import type {
  Dispatch,
  MouseEvent as ReactMouseEvent,
  SetStateAction,
} from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { HERO_WORD } from "@/lib/copy";
import {
  useCoarsePointer,
  useGsapRef,
  usePrefersReducedMotion,
} from "@/lib/hooks";
import styles from "./Hero.module.css";

const LETTER_COUNT = HERO_WORD.length;
const SPAN_RATIO = 0.72;

// On touch devices, cycle the bold highlight through this range instead of
// following a cursor — keeps it a full 3-letter band (center ± 1) rather
// than clipping to 2 letters at the word's edges.
const AUTO_HIGHLIGHT_MIN = 1;
const AUTO_HIGHLIGHT_MAX = LETTER_COUNT - 2;
const AUTO_HIGHLIGHT_INTERVAL_MS = 2000;

function getLayout(width: number) {
  const startX = (width * (1 - SPAN_RATIO)) / 2;
  const letterStep =
    LETTER_COUNT > 1
      ? (width * SPAN_RATIO) / (LETTER_COUNT - 1)
      : width * SPAN_RATIO;
  return { startX, letterStep };
}

type Props = {
  pointer: { x: number; y: number } | null;
  activated: boolean;
  viewport: { width: number; height: number };
  hidden: boolean;
  order: number[] | null;
  onReorder: Dispatch<SetStateAction<number[] | null>>;
};

export default function Hero({
  pointer,
  activated,
  viewport,
  hidden,
  order,
  onReorder,
}: Props) {
  const wordRef = useRef<HTMLHeadingElement | null>(null);
  const letterRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const gsapRef = useGsapRef();
  const reducedMotion = usePrefersReducedMotion();
  const coarsePointer = useCoarsePointer();

  const [autoHighlight, setAutoHighlight] = useState(AUTO_HIGHLIGHT_MIN);

  const dragRef = useRef<{
    dragging: boolean;
    el: HTMLSpanElement | null;
    slot: number | null;
    startX: number;
    startY: number;
  }>({ dragging: false, el: null, slot: null, startX: 0, startY: 0 });
  const pointerXRef = useRef<number | null>(null);
  const scaleAccumRef = useRef(1);
  const wheelTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hiddenRef = useRef(hidden);

  useEffect(() => {
    hiddenRef.current = hidden;
  }, [hidden]);

  // No cursor to drive the letter-weight effect on touch devices, so jump
  // the bold band to a random spot on a timer instead. Real pointer input
  // (the rare mouse+touch hybrid) still wins once `activated` flips true,
  // via the centerIndex fallback order below.
  useEffect(() => {
    if (!coarsePointer || reducedMotion || hidden || activated) return;
    const id = setInterval(() => {
      setAutoHighlight((prev) => {
        const span = AUTO_HIGHLIGHT_MAX - AUTO_HIGHLIGHT_MIN;
        if (span <= 0) return prev;
        // Re-roll on a repeat so every tick is a visible change.
        let next = prev;
        while (next === prev) {
          next = AUTO_HIGHLIGHT_MIN + Math.floor(Math.random() * (span + 1));
        }
        return next;
      });
    }, AUTO_HIGHLIGHT_INTERVAL_MS);
    return () => clearInterval(id);
  }, [coarsePointer, reducedMotion, hidden, activated]);

  const slotFromX = useCallback((x: number) => {
    let best = 0;
    let bestDist = Infinity;
    letterRefs.current.forEach((el, i) => {
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const dist = Math.abs(x - (rect.left + rect.width / 2));
      if (dist < bestDist) {
        bestDist = dist;
        best = i;
      }
    });
    return best;
  }, []);

  // Letter drag physics + wheel zoom pulse, both window-level: dragging can
  // carry the pointer anywhere on screen, and the zoom pulse responds to a
  // wheel gesture anywhere on the page, not just directly over a letter
  // (the word's own hit area is narrow — see Hero.module.css .hero).
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      pointerXRef.current = e.clientX;
      const drag = dragRef.current;
      if (!drag.dragging || !drag.el || !gsapRef.current) return;
      const dx = e.clientX - drag.startX;
      const dy = e.clientY - drag.startY;
      gsapRef.current.set(drag.el, { x: dx, y: dy * 0.4, rotation: dx * 0.04 });
    };

    const onUp = () => {
      const drag = dragRef.current;
      if (!drag.dragging) return;
      drag.dragging = false;
      const el = drag.el;
      const fromSlot = drag.slot;
      if (el) {
        if (gsapRef.current) {
          gsapRef.current.to(el, {
            x: 0,
            y: 0,
            rotation: 0,
            duration: reducedMotion ? 0 : 0.7,
            ease: "elastic.out(1, 0.4)",
          });
        } else {
          el.style.transform = "";
        }
      }
      if (fromSlot != null && pointerXRef.current != null) {
        const toSlot = slotFromX(pointerXRef.current);
        if (toSlot !== fromSlot) {
          onReorder((prev) => {
            const base =
              prev ?? Array.from({ length: LETTER_COUNT }, (_, i) => i);
            const next = base.slice();
            const tmp = next[fromSlot]!;
            next[fromSlot] = next[toSlot]!;
            next[toSlot] = tmp;
            return next;
          });
        }
      }
      drag.el = null;
      drag.slot = null;
    };

    const onWheel = (e: WheelEvent) => {
      // A panel (Services/Work/Contact) is open over the hero — let the
      // browser scroll it natively instead of hijacking the wheel for the
      // wordmark's zoom pulse.
      if (hiddenRef.current) return;
      const gsapMod = gsapRef.current;
      if (!gsapMod) return;
      e.preventDefault();
      const wordEl = wordRef.current;
      if (!wordEl) return;
      scaleAccumRef.current = Math.max(
        0.6,
        Math.min(1.8, scaleAccumRef.current - e.deltaY * 0.0012),
      );
      gsapMod.set(wordEl, { scale: scaleAccumRef.current });
      if (wheelTimerRef.current) clearTimeout(wheelTimerRef.current);
      wheelTimerRef.current = setTimeout(() => {
        gsapMod.to(wordEl, {
          scale: 1,
          duration: reducedMotion ? 0 : 1.1,
          ease: "elastic.out(1, 0.25)",
        });
        scaleAccumRef.current = 1;
      }, 150);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("wheel", onWheel);
      if (wheelTimerRef.current) clearTimeout(wheelTimerRef.current);
    };
  }, [reducedMotion, slotFromX, gsapRef, onReorder]);

  const startDrag = useCallback(
    (e: ReactMouseEvent<HTMLSpanElement>, slot: number) => {
      const el = e.currentTarget;
      dragRef.current = {
        dragging: true,
        el,
        slot,
        startX: e.clientX,
        startY: e.clientY,
      };
      pointerXRef.current = e.clientX;
      gsapRef.current?.killTweensOf(el);
    },
    [gsapRef],
  );

  const baseOrder = useMemo(
    () => Array.from({ length: LETTER_COUNT }, (_, i) => i),
    [],
  );
  const activeOrder = order ?? baseOrder;

  const { width } = viewport;
  const { startX, letterStep } = useMemo(() => getLayout(width), [width]);
  const mx = pointer?.x ?? width / 2;
  const rawIndex = LETTER_COUNT > 1 ? (mx - startX) / letterStep : 0;
  const centerIndex = activated
    ? Math.round(Math.max(0, Math.min(LETTER_COUNT - 1, rawIndex)))
    : coarsePointer
      ? autoHighlight
      : 8;

  return (
    <div
      className={styles.hero}
      style={{ opacity: hidden ? 0 : 1 }}
      inert={hidden}
    >
      <h1 ref={wordRef} className={styles.word} aria-label={HERO_WORD}>
        {activeOrder.map((charIndex, i) => {
          const ch = HERO_WORD.charAt(charIndex);
          const indexDist = Math.abs(i - centerIndex);
          const weight = indexDist <= 1 ? 900 : 150;
          return (
            <span
              key={charIndex}
              ref={(el) => {
                letterRefs.current[i] = el;
              }}
              className={styles.letter}
              aria-hidden="true"
              onMouseDown={(e) => startDrag(e, i)}
              style={{
                fontVariationSettings: `'wght' ${weight}`,
                fontWeight: weight,
                textShadow:
                  weight >= 900
                    ? "0 0 10px rgba(255,255,255,0.5), 0 0 24px rgba(255,255,255,0.22)"
                    : "0 0 0 rgba(255,255,255,0)",
              }}
            >
              {ch}
            </span>
          );
        })}
      </h1>
    </div>
  );
}
