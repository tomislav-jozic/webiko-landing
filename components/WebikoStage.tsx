"use client";

import type {
  FormEvent,
  MouseEvent as ReactMouseEvent,
} from "react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import styles from "./WebikoStage.module.css";

const WORD = "webiko.dev";
const LETTER_COUNT = WORD.length;
const SPAN_RATIO = 0.72;
const MENU_ITEMS = ["Services", "Work", "Contact"] as const;
type MenuLabel = (typeof MENU_ITEMS)[number];
type ViewId = "services" | "work" | "contact";

type MorphState = {
  label: string;
  left: number;
  top: number;
  fontSize: number;
};

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

type GsapModule = (typeof import("gsap"))["gsap"];

function getLayout(width: number) {
  const startX = (width * (1 - SPAN_RATIO)) / 2;
  const letterStep =
    LETTER_COUNT > 1
      ? (width * SPAN_RATIO) / (LETTER_COUNT - 1)
      : width * SPAN_RATIO;
  return { startX, letterStep };
}

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(callback: () => void) {
  const mql = window.matchMedia(REDUCED_MOTION_QUERY);
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
}

function getReducedMotionSnapshot() {
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

function getReducedMotionServerSnapshot() {
  return false;
}

function usePrefersReducedMotion() {
  return useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot,
  );
}

export default function WebikoStage() {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const wordRef = useRef<HTMLHeadingElement | null>(null);
  const morphRef = useRef<HTMLDivElement | null>(null);
  const overlayRef = useRef<HTMLElement | null>(null);
  const letterRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const gsapRef = useRef<GsapModule | null>(null);
  const sheetPointsRef = useRef<SheetPoint[]>(makeSheetPoints(SHEET_CLOSED_X));

  const reducedMotion = usePrefersReducedMotion();

  const [viewport, setViewport] = useState({ width: 1200, height: 800 });
  const [pointer, setPointer] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [activated, setActivated] = useState(false);
  const [order, setOrder] = useState<number[] | null>(null);

  const [menuOpen, setMenuOpen] = useState(false);
  const [hamHover, setHamHover] = useState(false);
  const [menuWeights, setMenuWeights] = useState<number[]>([300, 300, 300]);

  const [activeView, setActiveView] = useState<ViewId | null>(null);
  const [heroHidden, setHeroHidden] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [morph, setMorph] = useState<MorphState | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const rafRef = useRef<number | null>(null);
  const lastPointer = useRef<{ x: number; y: number } | null>(null);
  const nextPointer = useRef<{ x: number; y: number } | null>(null);
  const totalMove = useRef(0);

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

  // Load GSAP off the critical path — it's only needed once the visitor
  // interacts, so it shouldn't block first paint / TBT.
  useEffect(() => {
    let cancelled = false;
    import("gsap").then((mod) => {
      if (!cancelled) gsapRef.current = mod.gsap;
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const update = () =>
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

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

  const handlePointerMove = useCallback((e: ReactMouseEvent<HTMLDivElement>) => {
    const x = e.clientX;
    const y = e.clientY;
    if (lastPointer.current) {
      const dx = x - lastPointer.current.x;
      const dy = y - lastPointer.current.y;
      totalMove.current += Math.sqrt(dx * dx + dy * dy);
    }
    lastPointer.current = { x, y };
    nextPointer.current = { x, y };
    if (rafRef.current == null) {
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        if (totalMove.current > 50) setActivated(true);
        if (nextPointer.current) setPointer(nextPointer.current);
      });
    }
  }, []);

  // Window-level drag physics + wheel zoom pulse. These mutate the DOM
  // directly through GSAP rather than React state, so a drag doesn't
  // trigger a re-render on every pointer move.
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
          setOrder((prev) => {
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
    const stageEl = stageRef.current;
    stageEl?.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      stageEl?.removeEventListener("wheel", onWheel);
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      if (wheelTimerRef.current) clearTimeout(wheelTimerRef.current);
    };
  }, [reducedMotion, slotFromX]);

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
    [],
  );

  const resetOrder = useCallback(() => setOrder(null), []);
  const toggleMenu = useCallback(() => setMenuOpen((v) => !v), []);

  const itemEnter = useCallback((i: number) => {
    const options = [500, 600, 700, 800, 900];
    const target =
      options[Math.floor(Math.random() * options.length)] ?? 500;
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

  const selectView = useCallback(
    (label: MenuLabel, e: ReactMouseEvent<HTMLButtonElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const cs = window.getComputedStyle(e.currentTarget);
      setMenuOpen(false);
      setHeroHidden(true);
      setActiveView(label.toLowerCase() as ViewId);
      setRevealed(false);
      setSubmitted(false);
      setSubmitError(null);
      setMorph({
        label,
        left: rect.left,
        top: rect.top,
        fontSize: parseFloat(cs.fontSize),
      });
    },
    [],
  );

  // Animate the floating clone from the clicked menu item to the panel
  // heading position, then reveal the panel underneath it.
  useEffect(() => {
    if (!morph) return;
    if (reducedMotion || !morphRef.current || !gsapRef.current) {
      setRevealed(true);
      setMorph(null);
      return;
    }
    const morphEl = morphRef.current;
    const gsapMod = gsapRef.current;
    const w = window.innerWidth;
    const h = window.innerHeight;
    const targetLeft = w * 0.08;
    const targetTop = h * 0.26;
    const targetFontSize = Math.min(56, Math.max(32, w * 0.05));
    const dx = targetLeft - morph.left;
    const dy = targetTop - morph.top;
    const scale = targetFontSize / (morph.fontSize || targetFontSize);

    gsapMod.set(morphEl, { x: 0, y: 0, scale: 1, transformOrigin: "left top" });
    const tween = gsapMod.to(morphEl, {
      x: dx,
      y: dy,
      scale,
      duration: 0.85,
      ease: "power3.inOut",
      onComplete: () => {
        setRevealed(true);
        setMorph(null);
      },
    });
    return () => {
      tween.kill();
    };
  }, [morph, reducedMotion]);

  // Ripple the menu overlay's leading edge open/closed like a dropped
  // sheet: each point along the edge settles independently instead of the
  // whole edge moving as one rigid line.
  useEffect(() => {
    const gsapMod = gsapRef.current;
    const el = overlayRef.current;
    if (!gsapMod || !el) return;

    const points = sheetPointsRef.current;
    const targetX = menuOpen ? SHEET_OPEN_X : SHEET_CLOSED_X;

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
  }, [menuOpen, reducedMotion]);

  const closeContact = useCallback(() => {
    setActiveView(null);
    setHeroHidden(false);
    setSubmitted(false);
    setSubmitError(null);
    setRevealed(false);
  }, []);

  const handleSubmit = useCallback(async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          email: data.get("email"),
          message: data.get("message"),
        }),
      });
      if (!res.ok) throw new Error("request_failed");
      setSubmitted(true);
    } catch {
      setSubmitError(
        "Something went wrong — please try again, or email us directly.",
      );
    } finally {
      setSubmitting(false);
    }
  }, []);

  const { width, height } = viewport;
  const { startX, letterStep } = useMemo(() => getLayout(width), [width]);
  const baseOrder = useMemo(
    () => Array.from({ length: LETTER_COUNT }, (_, i) => i),
    [],
  );
  const activeOrder = order ?? baseOrder;

  const mx = pointer?.x ?? width / 2;
  const my = pointer?.y ?? height / 2;

  const rawIndex = LETTER_COUNT > 1 ? (mx - startX) / letterStep : 0;
  const centerIndex = activated
    ? Math.round(Math.max(0, Math.min(LETTER_COUNT - 1, rawIndex)))
    : 8;

  const nx = Math.min(1, Math.max(0, mx / width));
  const ny = Math.min(1, Math.max(0, my / height));
  const hue = 95 + nx * 25;
  const light = 8 + ny * 10;
  const chroma = 0.012 + (1 - Math.abs(nx - 0.5) * 2) * 0.02;
  const bgColor = `oklch(${light.toFixed(1)}% ${chroma.toFixed(3)} ${hue.toFixed(1)})`;

  const headingText =
    activeView === "services"
      ? "Services"
      : activeView === "work"
        ? "Work"
        : activeView === "contact"
          ? "Contact"
          : "";

  return (
    <div
      ref={stageRef}
      className={styles.stage}
      onMouseMove={handlePointerMove}
      onDoubleClick={resetOrder}
    >
      <div
        className={styles.bg}
        style={{ backgroundColor: bgColor }}
        aria-hidden="true"
      />

      <div
        className={styles.hero}
        style={{ opacity: heroHidden ? 0 : 1 }}
        inert={heroHidden}
      >
        <h1 ref={wordRef} className={styles.word} aria-label={WORD}>
          {activeOrder.map((charIndex, i) => {
            const ch = WORD.charAt(charIndex);
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

      <div
        className={styles.contactPanel}
        style={{
          opacity: revealed ? 1 : 0,
          pointerEvents: revealed ? "auto" : "none",
        }}
        inert={!revealed}
      >
        <button type="button" className={styles.backBtn} onClick={closeContact}>
          &#8592; Back
        </button>

        {activeView && (
          <>
            <h2 className={styles.heading} style={{ opacity: revealed ? 1 : 0 }}>
              {headingText}
            </h2>

            {activeView !== "contact" && <p className={styles.tbd}>TBD</p>}

            {activeView === "contact" &&
              (submitted ? (
                <p className={styles.tbd}>Thanks — we&apos;ll be in touch.</p>
              ) : (
                <div className={styles.formWrap}>
                  <form className={styles.form} onSubmit={handleSubmit}>
                    <label className="visually-hidden" htmlFor="contact-name">
                      Name
                    </label>
                    <input
                      id="contact-name"
                      name="name"
                      placeholder="Name"
                      autoComplete="name"
                      required
                      className={styles.input}
                    />

                    <label className="visually-hidden" htmlFor="contact-email">
                      Email
                    </label>
                    <input
                      id="contact-email"
                      name="email"
                      type="email"
                      placeholder="Email"
                      autoComplete="email"
                      required
                      className={styles.input}
                    />

                    <label className="visually-hidden" htmlFor="contact-message">
                      Message
                    </label>
                    <textarea
                      id="contact-message"
                      name="message"
                      placeholder="Message"
                      rows={4}
                      required
                      className={styles.textarea}
                    />

                    {submitError && (
                      <p className={styles.formError} role="alert">
                        {submitError}
                      </p>
                    )}

                    <button
                      type="submit"
                      className={styles.submitBtn}
                      disabled={submitting}
                    >
                      {submitting ? "Sending…" : "Send"}
                    </button>
                  </form>
                </div>
              ))}
          </>
        )}
      </div>

      {morph && (
        <div
          ref={morphRef}
          aria-hidden="true"
          className={styles.morph}
          style={{ left: morph.left, top: morph.top, fontSize: morph.fontSize }}
        >
          {morph.label}
        </div>
      )}

      <button
        type="button"
        className={`${styles.ham} ${hamHover || menuOpen ? styles.hamHover : ""}`}
        onClick={toggleMenu}
        onMouseEnter={() => setHamHover(true)}
        onMouseLeave={() => setHamHover(false)}
        aria-expanded={menuOpen}
        aria-controls="webiko-menu"
        aria-label={menuOpen ? "Close menu" : "Open menu"}
      >
        <span className={styles.hamLines} aria-hidden="true">
          <span
            className={styles.hamLine}
            style={{
              transform: menuOpen ? "translateY(8px) rotate(45deg)" : "none",
            }}
          />
          <span
            className={styles.hamLine}
            style={{ opacity: menuOpen ? 0 : 1 }}
          />
          <span
            className={styles.hamLine}
            style={{
              transform: menuOpen ? "translateY(-8px) rotate(-45deg)" : "none",
            }}
          />
        </span>
      </button>

      <nav
        ref={overlayRef}
        id="webiko-menu"
        className={`${styles.overlay} ${menuOpen ? styles.overlayOpen : ""}`}
        aria-label="Main"
        inert={!menuOpen}
      >
        {MENU_ITEMS.map((label, i) => {
          const weight = menuWeights[i] ?? 300;
          return (
            <button
              type="button"
              key={label}
              className={`${styles.menuItem} ${menuOpen ? styles.menuItemOpen : ""}`}
              style={{
                fontVariationSettings: `'wght' ${weight}`,
                fontWeight: weight,
                transitionDelay: `${i * 70}ms, ${i * 70}ms, 0ms`,
              }}
              onClick={(e) => selectView(label, e)}
              onMouseEnter={() => itemEnter(i)}
              onMouseLeave={() => itemLeave(i)}
            >
              {label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
