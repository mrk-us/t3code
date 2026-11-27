import type { ScopedThreadRef } from "@t3tools/contracts";
import { animate } from "motion";

import { fadeTransition, prefersReducedMotion, SPRING_FAST } from "./lib/motionTokens";
import {
  selectThreadPanelOpen,
  selectThreadRightPanelState,
  useRightPanelStore,
} from "./rightPanelStore";
import { selectThreadTerminalUiState, useTerminalUiStateStore } from "./terminalUiStateStore";

interface OpenPanels {
  readonly sidebar: boolean;
  readonly threadRef: ScopedThreadRef | null;
  readonly rightPanel: boolean;
  readonly threadDetails: boolean;
  readonly terminal: boolean;
}

// What entering zen mode closed, so leaving it reopens exactly that.
let zenPanels: OpenPanels | null = null;
// Chrome that zen mode hides marks itself with data-zen-chrome="top" | "bottom" | "left".
const ZEN_CHROME = "[data-zen-chrome]";
const ZEN_OFFSET_PX = 12;

function readOpenPanels(sidebarOpen: boolean, threadRef: ScopedThreadRef | null): OpenPanels {
  const rightPanels = useRightPanelStore.getState();
  return {
    sidebar: sidebarOpen,
    threadRef,
    rightPanel:
      threadRef !== null && selectThreadRightPanelState(rightPanels.byThreadKey, threadRef).isOpen,
    threadDetails:
      threadRef !== null &&
      selectThreadPanelOpen(rightPanels.threadPanelVisibilityByThreadKey, threadRef, "inline"),
    terminal:
      threadRef !== null &&
      selectThreadTerminalUiState(
        useTerminalUiStateStore.getState().terminalUiStateByThreadKey,
        threadRef,
      ).terminalOpen,
  };
}

function setPanels(panels: OpenPanels, open: boolean, setSidebarOpen: (open: boolean) => void) {
  if (panels.sidebar) setSidebarOpen(open);
  const ref = panels.threadRef;
  if (ref === null) return;
  const rightPanels = useRightPanelStore.getState();
  if (panels.rightPanel) (open ? rightPanels.show : rightPanels.close)(ref);
  if (panels.threadDetails) rightPanels.setThreadPanelOpen(ref, "inline", open);
  if (panels.terminal) useTerminalUiStateStore.getState().setTerminalOpen(ref, open);
}

function chromeOffset(element: HTMLElement): { x: number; y: number } {
  const edge = element.dataset.zenChrome;
  if (edge === "left") return { x: -ZEN_OFFSET_PX, y: 0 };
  return { x: 0, y: edge === "bottom" ? ZEN_OFFSET_PX : -ZEN_OFFSET_PX };
}

function animateChrome(hidden: boolean, animated: boolean) {
  const root = document.documentElement;
  // The attribute also hides chrome that mounts while zen mode is on.
  if (hidden) root.dataset.zenMode = "";
  else delete root.dataset.zenMode;
  const moving = animated && !prefersReducedMotion();
  for (const element of document.querySelectorAll<HTMLElement>(ZEN_CHROME)) {
    element.inert = hidden;
    const offset = chromeOffset(element);
    if (!animated) {
      element.style.opacity = hidden ? "0" : "";
      continue;
    }
    animate(element, { opacity: hidden ? 0 : 1 }, fadeTransition(hidden ? 0.2 : 0.18));
    if (moving) {
      animate(
        element,
        hidden ? offset : { x: 0, y: 0 },
        hidden ? fadeTransition(0.2) : SPRING_FAST,
      );
    }
  }
}

/**
 * Zen mode leaves only the thread breadcrumb and the composer: it closes every
 * open panel and slides the rest of the chrome away. Toggling it again reopens
 * the panels it closed and brings the chrome back.
 */
export function toggleZenMode(input: {
  readonly sidebarOpen: boolean;
  readonly setSidebarOpen: (open: boolean) => void;
  readonly threadRef: ScopedThreadRef | null;
  readonly animated: boolean;
}) {
  if (zenPanels === null) {
    zenPanels = readOpenPanels(input.sidebarOpen, input.threadRef);
    setPanels(zenPanels, false, input.setSidebarOpen);
    animateChrome(true, input.animated);
    return;
  }
  setPanels(zenPanels, true, input.setSidebarOpen);
  zenPanels = null;
  animateChrome(false, input.animated);
}
