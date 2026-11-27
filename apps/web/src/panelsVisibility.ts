import type { ScopedThreadRef } from "@t3tools/contracts";

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

// What the last hide closed, so the next press reopens exactly that.
let hiddenPanels: OpenPanels | null = null;

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

/** Hides every open panel; pressed again with nothing open, reopens what it hid. */
export function toggleAllPanels(input: {
  readonly sidebarOpen: boolean;
  readonly setSidebarOpen: (open: boolean) => void;
  readonly threadRef: ScopedThreadRef | null;
}) {
  const open = readOpenPanels(input.sidebarOpen, input.threadRef);
  if (open.sidebar || open.rightPanel || open.threadDetails || open.terminal) {
    hiddenPanels = open;
    setPanels(open, false, input.setSidebarOpen);
    return;
  }
  if (hiddenPanels !== null) setPanels(hiddenPanels, true, input.setSidebarOpen);
  hiddenPanels = null;
}
