import { animate } from "motion";

import { fadeTransition, prefersReducedMotion, SPRING_FAST } from "~/lib/motionTokens";

type Controls = ReturnType<typeof animate>;

const STAGGER_TARGETS = "[data-sidebar-stagger] > *";
const MAX_STAGGER_STEPS = 10;
const running = new WeakMap<HTMLElement, Controls[]>();

function visibleTargets(root: HTMLElement): HTMLElement[] {
  const viewport = root.querySelector('[data-slot="scroll-area-viewport"]') ?? root;
  const bounds = viewport.getBoundingClientRect();
  return Array.from(root.querySelectorAll<HTMLElement>(STAGGER_TARGETS)).filter((element) => {
    const rect = element.getBoundingClientRect();
    return rect.height > 0 && rect.bottom > bounds.top && rect.top < bounds.bottom;
  });
}

function stop(root: HTMLElement) {
  for (const controls of running.get(root) ?? []) controls.stop();
  running.delete(root);
}

const ENTER_STEP_SECONDS = 0.025;
const EXIT_STEP_SECONDS = 0.02;
const EXIT_SLIDE_SECONDS = 0.18;
// Keep in sync with the panel container's delay-380 in ui/sidebar.tsx: it leaves after this exit.
const EXIT_SECONDS = MAX_STAGGER_STEPS * EXIT_STEP_SECONDS + EXIT_SLIDE_SECONDS;

/**
 * Rows fade together and slide in or out top to bottom as the panel opens or
 * closes. Rows animate `translate`, never `transform`: dnd-kit and the list
 * motion engine own that.
 */
export function staggerSidebarPanel(root: HTMLElement, direction: "in" | "out") {
  stop(root);
  const targets = visibleTargets(root);
  if (targets.length === 0) return;
  const moving = !prefersReducedMotion();
  // Rows travel the whole way from off the window's left edge. Single-value translates match
  // what the browser reports back, so motion can interpolate from a row it never animated.
  const offscreen = `${-Math.ceil(root.getBoundingClientRect().right + 8)}px`;
  if (direction === "in") {
    // Rows that never faded out (the panel started closed) start from hidden.
    for (const element of targets) {
      if (element.style.opacity !== "") continue;
      element.style.opacity = "0";
      if (moving) element.style.translate = offscreen;
    }
  }
  const controls = [
    animate(
      targets,
      { opacity: direction === "in" ? 1 : 0 },
      direction === "in" ? fadeTransition(0.18) : { duration: EXIT_SECONDS, ease: "easeInOut" },
    ),
  ];
  if (moving) {
    const step = direction === "in" ? ENTER_STEP_SECONDS : EXIT_STEP_SECONDS;
    const delay = (index: number) => Math.min(index, MAX_STAGGER_STEPS) * step;
    controls.push(
      animate(
        targets,
        { translate: direction === "in" ? "0px" : offscreen },
        direction === "in"
          ? { ...SPRING_FAST, delay }
          : { ...fadeTransition(EXIT_SLIDE_SECONDS), delay },
      ),
    );
  }
  running.set(root, controls);
}

/** Stops any cascade and hands the rows back to their stylesheet. */
export function resetSidebarPanelStagger(root: HTMLElement) {
  stop(root);
  for (const element of root.querySelectorAll<HTMLElement>(STAGGER_TARGETS)) {
    element.style.removeProperty("opacity");
    element.style.removeProperty("translate");
  }
}
