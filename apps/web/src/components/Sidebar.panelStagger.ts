import { animate } from "motion";

import { fadeTransition, prefersReducedMotion, SPRING_SNAPPY } from "~/lib/motionTokens";

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

/**
 * Cascades the panel's rows top to bottom as it opens or closes. Rows animate
 * `translate`, never `transform`: dnd-kit and the list motion engine own that.
 */
export function staggerSidebarPanel(root: HTMLElement, direction: "in" | "out") {
  stop(root);
  const targets = visibleTargets(root);
  if (targets.length === 0) return;
  const step = direction === "in" ? 0.03 : 0.01;
  const delay = (index: number) => Math.min(index, MAX_STAGGER_STEPS) * step;
  const moving = !prefersReducedMotion();
  if (direction === "in") {
    // Rows that never faded out (the panel started closed) start from hidden.
    for (const element of targets) {
      if (element.style.opacity !== "") continue;
      element.style.opacity = "0";
      if (moving) element.style.translate = "-12px 0px";
    }
  }
  const controls = [
    animate(
      targets,
      { opacity: direction === "in" ? 1 : 0 },
      { ...fadeTransition(direction === "in" ? 0.2 : 0.1), delay },
    ),
  ];
  if (moving) {
    controls.push(
      animate(
        targets,
        { translate: direction === "in" ? "0px 0px" : "-8px 0px" },
        direction === "in" ? { ...SPRING_SNAPPY, delay } : { ...fadeTransition(0.1), delay },
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
