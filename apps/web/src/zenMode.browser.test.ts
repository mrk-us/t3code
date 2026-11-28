import { scopeProjectRef, scopeThreadRef } from "@t3tools/client-runtime/environment";
import { EnvironmentId, ProjectId, ThreadId } from "@t3tools/contracts";
import { describe, expect, it } from "vite-plus/test";

import { DraftId, useComposerDraftStore } from "./composerDraftStore";
import { selectThreadPanelOpen, useRightPanelStore } from "./rightPanelStore";
import { toggleZenMode } from "./zenMode";

describe("zen mode", () => {
  it("hides and restores a new thread's details panel", () => {
    const environmentId = EnvironmentId.make("environment-zen");
    const threadId = ThreadId.make("thread-zen");
    const draftId = DraftId.make("draft-zen");
    useComposerDraftStore
      .getState()
      .setProjectDraftThreadId(
        scopeProjectRef(environmentId, ProjectId.make("project-zen")),
        draftId,
        {
          threadId,
        },
      );
    const threadRef = scopeThreadRef(environmentId, threadId);
    useRightPanelStore.getState().setThreadPanelOpen(threadRef, "inline", true);
    const detailsOpen = () =>
      selectThreadPanelOpen(
        useRightPanelStore.getState().threadPanelVisibilityByThreadKey,
        threadRef,
        "inline",
      );
    const toggle = () =>
      toggleZenMode({
        sidebarOpen: false,
        setSidebarOpen: () => {},
        routeParams: { draftId },
        animated: false,
      });

    toggle();
    expect(detailsOpen()).toBe(false);
    toggle();
    expect(detailsOpen()).toBe(true);
  });
});
