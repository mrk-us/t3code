import { RouterProvider } from "@tanstack/react-router";
import { MotionConfig } from "motion/react";

import { ElectronBrowserHost } from "./browser/ElectronBrowserHost";
import { QuitHoldOverlay } from "./components/QuitHoldOverlay";
import { I18nProvider } from "./i18n/I18nProvider";
import { AppAtomRegistryProvider } from "./rpc/atomRegistry";
import type { AppRouter } from "./router";

// Keep webviews outside the router but inside its atom registry so route changes preserve them.
export function AppRoot({ router }: { readonly router: AppRouter }) {
  return (
    // Declarative motion follows the OS reduced-motion preference.
    <MotionConfig reducedMotion="user">
      <I18nProvider>
        <AppAtomRegistryProvider>
          <RouterProvider router={router} />
          <ElectronBrowserHost />
          <QuitHoldOverlay />
        </AppAtomRegistryProvider>
      </I18nProvider>
    </MotionConfig>
  );
}
