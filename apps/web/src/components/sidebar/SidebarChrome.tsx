import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ChartNoAxesColumnIcon,
  MessagesSquareIcon,
  SettingsIcon,
} from "lucide-react";
import { createContext, use, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useGT } from "gt-react";
import { useLocation, useNavigate } from "@tanstack/react-router";

import { useAtomValue } from "@effect/atom-react";
import { shortcutLabelForCommand } from "../../keybindings";
import {
  navigateHistory,
  useCanNavigateHistory,
  type HistoryDirection,
} from "../../navigationHistory";
import { primaryServerKeybindingsAtom } from "../../state/server";
import { cn } from "../../lib/utils";
import { useIssuesSupported, usePullRequestsSupported } from "../../state/environments";
import { Button } from "../ui/button";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "../ui/sidebar";
import { readPullRequestListPreferences } from "../pullRequest/pullRequestListPreferences";
import { readIssueListPreferences } from "../issue/issueListPreferences";
import { IssueGlyph } from "../issue/issuePresentation";
import {
  isAppModalPage,
  isSidebarUtilityPage,
  useCloseAppModal,
  useNavigateToMainApp,
} from "./mainAppLocation";
import { SidebarThreadUndoNotice } from "./SidebarThreadUndoNotice";
import { SidebarProviderUpdatePill } from "./SidebarProviderUpdatePill";
import { SidebarUpdateArchitectureWarning, SidebarUpdatePill } from "./SidebarUpdatePill";
import { PullRequestGlyph } from "~/components/pullRequest/pullRequestIcons";
import { SharedTooltipTrigger } from "../ui/shared-tooltip";

/** The floating top-left group's slot for the thread sidebar's own actions. */
export const SidebarActionsSlotContext = createContext<HTMLElement | null>(null);

/** Renders the thread sidebar's search and new-thread actions beside the sidebar toggle. */
export function SidebarActionsPortal({ children }: { children: ReactNode }) {
  const slot = use(SidebarActionsSlotContext);
  return slot ? createPortal(children, slot) : null;
}

export function HistoryNavigationButton({ direction }: { direction: HistoryDirection }) {
  const keybindings = useAtomValue(primaryServerKeybindingsAtom);
  const enabled = useCanNavigateHistory(direction);
  const gt = useGT();
  const label = direction === "back" ? gt("Go back") : gt("Go forward");
  const shortcutLabel = shortcutLabelForCommand(
    keybindings,
    direction === "back" ? "navigation.back" : "navigation.forward",
  );
  const Icon = direction === "back" ? ArrowLeftIcon : ArrowRightIcon;
  return (
    <SharedTooltipTrigger
      render={
        <Button
          aria-label={label}
          className="pointer-events-auto [-webkit-app-region:no-drag]"
          disabled={!enabled}
          onClick={() => navigateHistory(direction)}
          size="icon-sm"
          variant="ghost"
        />
      }
      label={
        <>
          {label}
          {shortcutLabel ? ` (${shortcutLabel})` : ""}
        </>
      }
      side="bottom"
    >
      <Icon className="size-3.5" />
    </SharedTooltipTrigger>
  );
}

/** Settings, the undo notice and update pills, floating at the bottom left. */
export function SidebarFloatingFooter({ ref }: { ref?: (node: HTMLDivElement | null) => void }) {
  const gt = useGT();
  const navigate = useNavigate();
  const { isMobile, setOpenMobile } = useSidebar();
  const settingsLabel = gt("Settings");
  return (
    <div
      ref={ref}
      className="pointer-events-none fixed bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] left-[calc(env(safe-area-inset-left)+0.5rem)] z-40 flex w-[calc(var(--sidebar-width)-1rem)] max-w-[calc(100vw-1rem)] flex-col gap-2 *:pointer-events-auto"
      data-sidebar-floating-footer=""
      data-zen-chrome="bottom"
    >
      <SidebarProviderUpdatePill />
      <SidebarUpdateArchitectureWarning />
      <SidebarMenu className="flex-row items-center">
        <SidebarMenuItem className="shrink-0">
          <SharedTooltipTrigger
            render={
              <SidebarMenuButton
                aria-label={settingsLabel}
                onClick={() => {
                  if (isMobile) setOpenMobile(false);
                  void navigate({ to: "/settings" });
                }}
                size="icon"
              >
                <SettingsIcon />
              </SidebarMenuButton>
            }
            label={settingsLabel}
          />
        </SidebarMenuItem>
        <SidebarThreadUndoNotice />
        <SidebarUpdatePill />
      </SidebarMenu>
    </div>
  );
}

type AppNavigationDestination = "threads" | "pull-requests" | "issues" | "usage";

function resolveAppNavigationDestination(pathname: string): AppNavigationDestination | null {
  if (pathname === "/usage") return "usage";
  if (pathname === "/pull-requests") return "pull-requests";
  if (pathname === "/issues") return "issues";
  if (isAppModalPage(pathname) || isSidebarUtilityPage(pathname)) return null;
  return "threads";
}

function AppNavigationItem({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-current={active ? "page" : undefined}
      aria-label={label}
      onClick={onClick}
      className={cn(
        "inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full px-2.5 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset sm:px-3 [&>svg]:size-4 [&>svg]:shrink-0",
        active
          ? "bg-accent text-accent-foreground"
          : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
      )}
    >
      {icon}
      <span className="max-sm:sr-only">{label}</span>
    </button>
  );
}

/** Threads, Pull requests, Issues and Usage, floating centered at the bottom. */
export function AppNavigationToolbar() {
  const gt = useGT();
  const navigate = useNavigate();
  const navigateToMainApp = useNavigateToMainApp();
  const closeAppModal = useCloseAppModal();
  const pathname = useLocation({ select: (location) => location.pathname });
  const pullRequestsSupported = usePullRequestsSupported();
  const issuesSupported = useIssuesSupported();
  const destination = resolveAppNavigationDestination(pathname);

  return (
    <nav
      aria-label={gt("App navigation")}
      className="dropdown-glass fixed bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] left-1/2 z-40 flex -translate-x-1/2 items-center gap-0.5 rounded-full p-1"
      data-app-navigation-toolbar=""
      data-zen-chrome="bottom"
    >
      <AppNavigationItem
        active={destination === "threads"}
        icon={<MessagesSquareIcon />}
        label={gt("Threads")}
        onClick={() => {
          if (isAppModalPage(pathname)) void closeAppModal();
          else if (isSidebarUtilityPage(pathname)) void navigateToMainApp();
        }}
      />
      {pullRequestsSupported ? (
        <AppNavigationItem
          active={destination === "pull-requests"}
          icon={<PullRequestGlyph.pullRequest />}
          label={gt("Pull requests")}
          onClick={() =>
            void navigate({ to: "/pull-requests", search: readPullRequestListPreferences() })
          }
        />
      ) : null}
      {issuesSupported ? (
        <AppNavigationItem
          active={destination === "issues"}
          icon={<IssueGlyph.issue />}
          label={gt("Issues", { $context: "sidebar link to the list of issues" })}
          onClick={() => void navigate({ to: "/issues", search: readIssueListPreferences() })}
        />
      ) : null}
      <AppNavigationItem
        active={destination === "usage"}
        icon={<ChartNoAxesColumnIcon />}
        label={gt("Usage")}
        onClick={() => void navigate({ to: "/usage" })}
      />
    </nav>
  );
}
