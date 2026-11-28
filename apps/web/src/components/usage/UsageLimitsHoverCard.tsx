import { useAtomValue } from "@effect/atom-react";
import { refreshUsageLimits } from "@t3tools/client-runtime/state/usage";
import { collectLimitAccounts, collectLimitPools } from "@t3tools/shared/usageLimits";
import { T, useGT } from "gt-react";
import { type ReactElement, useState } from "react";

import { appAtomRegistry } from "~/rpc/atomRegistry";
import { environmentPresentations } from "../../state/presentation";
import { serverEnvironment } from "../../state/server";
import { useAtomCommand } from "../../state/use-atom-command";
import { ProviderInstanceIcon } from "../chat/ProviderInstanceIcon";
import { providerClients } from "../settings/providerDriverMeta";
import { PreviewCard, PreviewCardPopup, PreviewCardTrigger } from "../ui/preview-card";
import { LimitWindows, visibleLimitPresentations } from "./UsageLimits";
import { AccountName } from "./UsageLimitsPooled";
import { readUsagePagePreferences } from "./usagePagePreferences";

export function UsageLimitsHoverCard({ trigger }: { readonly trigger: ReactElement }) {
  const refreshProviders = useAtomCommand(serverEnvironment.refreshProviders, {
    reportFailure: false,
  });
  const refreshLimits = (open: boolean) => {
    if (!open) return;
    for (const [environmentId, presentation] of appAtomRegistry.get(
      environmentPresentations.presentationsAtom,
    )) {
      if (presentation.connection.phase !== "connected" || presentation.serverConfig === null) {
        continue;
      }
      // Automatic refreshes are throttled per environment, so hovering stays cheap.
      void refreshUsageLimits(
        environmentId,
        () => refreshProviders({ environmentId, input: {} }),
        true,
      );
    }
  };

  return (
    <PreviewCard onOpenChange={refreshLimits}>
      <PreviewCardTrigger render={trigger} delay={350} closeDelay={120} />
      <PreviewCardPopup align="center" sideOffset={10} className="w-96 max-w-[calc(100vw-2rem)]">
        <UsageLimitsPreview />
      </PreviewCardPopup>
    </PreviewCard>
  );
}

function UsageLimitsPreview() {
  const gt = useGT();
  const presentations = useAtomValue(environmentPresentations.presentationsWithProvidersAtom);
  const [hiddenProviders] = useState(
    () => new Set(readUsagePagePreferences().hiddenProviders ?? []),
  );
  const [now] = useState(() => Date.now());
  const pools = collectLimitPools(
    collectLimitAccounts(visibleLimitPresentations(presentations, null, hiddenProviders)),
    now,
  ).flatMap((pool) => {
    const accounts = pool.accounts.filter((account) => account.limits.windows.length > 0);
    return accounts.length > 0 ? [{ driver: pool.driver, accounts }] : [];
  });

  return (
    <div className="flex flex-col gap-3 p-3">
      <h2 className="text-xs font-medium text-muted-foreground">{gt("Usage limits")}</h2>
      {pools.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          <T>No provider reports subscription limits.</T>
        </p>
      ) : (
        pools.map((pool) => {
          const label = providerClients.get(pool.driver)?.label ?? String(pool.driver);
          return (
            <section key={pool.driver} className="flex flex-col gap-1.5">
              <h3 className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                <ProviderInstanceIcon
                  driverKind={pool.driver}
                  displayName={label}
                  indicatorBackground="var(--popover)"
                  className="size-4"
                  iconClassName="size-3.5 text-foreground/80"
                />
                {label}
              </h3>
              {pool.accounts.map((account) => (
                <div key={account.key} className="flex min-w-0 flex-col gap-0.5">
                  {pool.accounts.length > 1 ? (
                    <AccountName
                      account={account}
                      className="min-w-0 truncate text-xs text-muted-foreground"
                    />
                  ) : null}
                  <LimitWindows
                    compact
                    driver={account.driver}
                    accentColor={account.accentColor}
                    windows={account.limits.windows}
                    now={now}
                  />
                </div>
              ))}
            </section>
          );
        })
      )}
    </div>
  );
}
