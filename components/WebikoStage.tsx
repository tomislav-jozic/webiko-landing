"use client";

import type { FormEvent, MouseEvent as ReactMouseEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { CONTACT_COPY, type ViewId } from "@/lib/copy";
import { useGsapRef, usePrefersReducedMotion } from "@/lib/hooks";
import ContactPanel from "./ContactPanel";
import Hamburger from "./Hamburger";
import Hero from "./Hero";
import MorphClone, { type MorphState } from "./MorphClone";
import NavMenu from "./NavMenu";
import styles from "./WebikoStage.module.css";

// This is the page's orchestrator: it owns every piece of state that spans
// more than one visual part (pointer tracking, view/reveal transitions,
// the contact form's network request) and composes the presentational
// components below. Each of those owns its own self-contained animation
// (letter drag/zoom, menu ripple) internally — see their own files.
export default function WebikoStage() {
  const morphRef = useRef<HTMLDivElement | null>(null);
  const gsapRef = useGsapRef();
  const reducedMotion = usePrefersReducedMotion();

  const [viewport, setViewport] = useState({ width: 1200, height: 800 });
  const [pointer, setPointer] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [activated, setActivated] = useState(false);
  const [order, setOrder] = useState<number[] | null>(null);

  const [menuOpen, setMenuOpen] = useState(false);

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

  useEffect(() => {
    const update = () =>
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Cancel any in-flight rAF from handlePointerMove on unmount.
  useEffect(() => {
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Pointer tracking has to live here rather than inside Hero: this handler
  // is attached to the full-viewport stage element below, and Hero's own
  // root has pointer-events:none over everything except the letters
  // themselves (see Hero.module.css), so it can't see pointer movement
  // over the rest of the page.
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

  const resetOrder = useCallback(() => setOrder(null), []);
  const toggleMenu = useCallback(() => setMenuOpen((v) => !v), []);

  const selectView = useCallback(
    (
      item: { id: ViewId; label: string },
      e: ReactMouseEvent<HTMLButtonElement>,
    ) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const cs = window.getComputedStyle(e.currentTarget);
      setMenuOpen(false);
      setHeroHidden(true);
      setActiveView(item.id);
      setRevealed(false);
      setSubmitted(false);
      setSubmitError(null);
      setMorph({
        label: item.label,
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
  }, [morph, reducedMotion, gsapRef]);

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
      setSubmitError(CONTACT_COPY.error);
    } finally {
      setSubmitting(false);
    }
  }, []);

  const { width, height } = viewport;
  const mx = pointer?.x ?? width / 2;
  const my = pointer?.y ?? height / 2;
  const nx = Math.min(1, Math.max(0, mx / width));
  const ny = Math.min(1, Math.max(0, my / height));
  const hue = 95 + nx * 25;
  const light = 8 + ny * 10;
  const chroma = 0.012 + (1 - Math.abs(nx - 0.5) * 2) * 0.02;
  const bgColor = `oklch(${light.toFixed(1)}% ${chroma.toFixed(3)} ${hue.toFixed(1)})`;

  return (
    <div
      className={styles.stage}
      onMouseMove={handlePointerMove}
      onDoubleClick={resetOrder}
    >
      <div
        className={styles.bg}
        style={{ backgroundColor: bgColor }}
        aria-hidden="true"
      />

      <Hero
        pointer={pointer}
        activated={activated}
        viewport={viewport}
        hidden={heroHidden}
        order={order}
        onReorder={setOrder}
      />

      <ContactPanel
        activeView={activeView}
        revealed={revealed}
        onBack={closeContact}
        submitting={submitting}
        submitted={submitted}
        submitError={submitError}
        onSubmit={handleSubmit}
      />

      <MorphClone morph={morph} morphRef={morphRef} />

      <Hamburger open={menuOpen} onToggle={toggleMenu} />

      <NavMenu open={menuOpen} onSelect={selectView} />
    </div>
  );
}
