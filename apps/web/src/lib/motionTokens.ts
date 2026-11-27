// Shared motion values. Springs move things; the strong ease-out fades them.
const EASE_OUT_STRONG = [0.23, 1, 0.32, 1] as const;

// visualDuration is when the motion looks finished; the tail settles quietly after it.
export const SPRING_SNAPPY = { type: "spring", visualDuration: 0.3, bounce: 0.15 } as const;

export function fadeTransition(durationSeconds: number) {
  return { duration: durationSeconds, ease: EASE_OUT_STRONG } as const;
}

export function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
