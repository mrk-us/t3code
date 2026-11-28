import { describe, expect, it } from "vite-plus/test";
import { render } from "../../test/render";
import { observeResize } from "~/lib/observeResize";
import { createSidebarListMotion } from "./Sidebar.motion";

describe("sidebar list motion", () => {
  it("slides rows above a removal at the bottom instead of jumping with the scroll clamp", async () => {
    await using screen = await render(null);
    const viewport = document.createElement("div");
    viewport.dataset.slot = "scroll-area-viewport";
    viewport.style.cssText = "height: 200px; overflow-y: auto; overflow-anchor: none";
    const list = document.createElement("ul");
    list.style.cssText = "position: relative; margin: 0; padding: 0; list-style: none";
    const rows = Array.from({ length: 10 }, () => {
      const row = document.createElement("li");
      row.style.height = "64px";
      list.append(row);
      return row;
    });
    viewport.append(list);
    screen.container.append(viewport);
    const motion = createSidebarListMotion(list);
    using _motion = { [Symbol.dispose]: () => motion.dispose() };
    motion.update(false);
    viewport.scrollTop = viewport.scrollHeight;
    viewport.dispatchEvent(new Event("scroll"));
    const above = rows[7]!;
    const before = above.getBoundingClientRect().top;

    rows[8]!.remove();
    motion.update(true);
    for (const animation of above.getAnimations()) animation.pause();

    expect(above.getBoundingClientRect().top).toBe(before);
  });

  it("keeps rows still when they resized after the last update", async () => {
    await using screen = await render(null);
    const list = document.createElement("ul");
    list.style.cssText = "position: relative; margin: 0; padding: 0; list-style: none";
    const rows = Array.from({ length: 6 }, () => {
      const row = document.createElement("li");
      row.style.height = "64px";
      list.append(row);
      return row;
    });
    screen.container.append(list);
    const motion = createSidebarListMotion(list);
    using _motion = { [Symbol.dispose]: () => motion.dispose() };
    motion.update(false);
    // A web font swap grows every row without a list change.
    for (const row of rows) row.style.height = "68px";
    // Shares the motion's observer, so this resolves once the motion has seen the resize.
    await new Promise<void>((resolve) => {
      const stop = observeResize(rows[0]!, () => {
        stop();
        resolve();
      });
    });
    const above = rows[3]!;
    const before = above.getBoundingClientRect().top;

    const inserted = document.createElement("li");
    inserted.style.height = "36px";
    rows[4]!.after(inserted);
    motion.update(true, { section: true });
    for (const animation of above.getAnimations()) animation.pause();

    expect(above.getBoundingClientRect().top).toBe(before);
  });
});
