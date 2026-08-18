"use client";

import type { MouseEvent as ReactMouseEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { NAV_ITEMS, NAV_LABELS, type ViewId } from "@/lib/copy";
import { useGsapRef, usePrefersReducedMotion } from "@/lib/hooks";
import styles from "./NavMenu.module.css";

// The overlay's leading (left) edge is animated as several independent
// points rather than one straight line, so it ripples in like a dropped
// sheet instead of sliding on rails.
const SHEET_EDGE_POINTS = 7;
const SHEET_CLOSED_X = 130;
const SHEET_OPEN_X = 0;

type SheetPoint = { x: number; y: number };

function makeSheetPoints(x: number): SheetPoint[] {
  return Array.from({ length: SHEET_EDGE_POINTS }, (_, i) => ({
    x,
    y: (i / (SHEET_EDGE_POINTS - 1)) * 100,
  }));
}

function sheetClipPath(points: SheetPoint[]) {
  const edge = [...points]
    .reverse()
    .map((p) => `${p.x}% ${p.y}%`)
    .join(", ");
  return `polygon(100% 0%, 100% 100%, ${edge})`;
}

type Props = {
  open: boolean;
  onSelect: (
    item: { id: ViewId; label: string },
    e: ReactMouseEvent<HTMLButtonElement>,
  ) => void;
};

export default function NavMenu({ open, onSelect }: Props) {
  const overlayRef = useRef<HTMLElement | null>(null);
  const sheetPointsRef = useRef<SheetPoint[]>(makeSheetPoints(SHEET_CLOSED_X));
  const gsapRef = useGsapRef();
  const reducedMotion = usePrefersReducedMotion();

  const [menuWeights, setMenuWeights] = useState<number[]>(
    NAV_ITEMS.map(() => 300),
  );

  // Ripple the overlay's leading edge open/closed like a dropped sheet:
  // each point along the edge settles independently instead of the whole
  // edge moving as one rigid line.
  useEffect(() => {
    const gsapMod = gsapRef.current;
    const el = overlayRef.current;
    if (!gsapMod || !el) return;

    const points = sheetPointsRef.current;
    const targetX = open ? SHEET_OPEN_X : SHEET_CLOSED_X;

    const tween = gsapMod.to(points, {
      x: targetX,
      duration: reducedMotion ? 0 : 0.75,
      ease: reducedMotion ? "none" : "elastic.out(1, 0.5)",
      stagger: reducedMotion ? 0 : { each: 0.05, from: "start" },
      onUpdate: () => {
        el.style.clipPath = sheetClipPath(points);
      },
    });
    return () => {
      tween.kill();
    };
  }, [open, reducedMotion, gsapRef]);

  const itemEnter = useCallback((i: number) => {
    const options = [500, 600, 700, 800, 900];
    const target = options[Math.floor(Math.random() * options.length)] ?? 500;
    setMenuWeights((prev) => {
      const next = prev.slice();
      next[i] = target;
      return next;
    });
  }, []);

  const itemLeave = useCallback((i: number) => {
    setMenuWeights((prev) => {
      const next = prev.slice();
      next[i] = 300;
      return next;
    });
  }, []);

  return (
    <nav
      ref={overlayRef}
      id="webiko-menu"
      className={`${styles.overlay} ${open ? styles.overlayOpen : ""}`}
      aria-label={NAV_LABELS.nav}
      inert={!open}
    >
      {NAV_ITEMS.map((item, i) => {
        const weight = menuWeights[i] ?? 300;
        return (
          <button
            type="button"
            key={item.id}
            className={`${styles.menuItem} ${open ? styles.menuItemOpen : ""}`}
            style={{
              fontVariationSettings: `'wght' ${weight}`,
              fontWeight: weight,
              transitionDelay: `${i * 70}ms, ${i * 70}ms, 0ms`,
            }}
            onClick={(e) => onSelect(item, e)}
            onMouseEnter={() => itemEnter(i)}
            onMouseLeave={() => itemLeave(i)}
          >
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}
