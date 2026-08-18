import { useEffect, useRef, useSyncExternalStore } from "react";

export type GsapModule = (typeof import("gsap"))["gsap"];

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

export function usePrefersReducedMotion() {
  return useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot,
  );
}

// Touch-primary devices (phones, most tablets) never fire the mousemove
// that drives the hero's letter-weight effect, so `activated` stays false
// forever there. `(hover: none) and (pointer: coarse)` is the standard way
// to detect "no persistent pointer" without guessing from viewport width,
// which would also misfire on a narrow desktop window.
const COARSE_POINTER_QUERY = "(hover: none) and (pointer: coarse)";

function subscribeCoarsePointer(callback: () => void) {
  const mql = window.matchMedia(COARSE_POINTER_QUERY);
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
}

function getCoarsePointerSnapshot() {
  return window.matchMedia(COARSE_POINTER_QUERY).matches;
}

function getCoarsePointerServerSnapshot() {
  return false;
}

export function useCoarsePointer() {
  return useSyncExternalStore(
    subscribeCoarsePointer,
    getCoarsePointerSnapshot,
    getCoarsePointerServerSnapshot,
  );
}

// Loads GSAP off the critical path — it's only needed once the visitor
// interacts, so it shouldn't block first paint / TBT. Returns a ref (not
// state) so becoming available doesn't trigger a re-render; callers read
// `.current` inside event handlers and effects, which already guard for it
// being null before first load. Safe to call from multiple components: the
// dynamic import() resolves from the same cached chunk every time.
export function useGsapRef() {
  const ref = useRef<GsapModule | null>(null);
  useEffect(() => {
    let cancelled = false;
    import("gsap").then((mod) => {
      if (!cancelled) ref.current = mod.gsap;
    });
    return () => {
      cancelled = true;
    };
  }, []);
  return ref;
}
