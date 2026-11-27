import { useGT } from "gt-react";
import { SearchIcon, XIcon } from "~/lib/icons";
import {
  type ComponentProps,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
  type RefObject,
} from "react";

import { Button } from "../ui/button";
import { SidebarInput } from "../ui/sidebar";
import { SharedTooltipTrigger } from "../ui/shared-tooltip";

export interface SidebarThreadSearchFieldProps {
  searchInputRef: RefObject<HTMLInputElement | null>;
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  onSearchKeyDown: (event: ReactKeyboardEvent<HTMLInputElement>) => void;
  onBlur: () => void;
  isSearching: boolean;
  searchResultCount: number;
  activeSearchResultIndex: number;
  onClearSearch: () => void;
}

export function SidebarThreadSearchField({
  searchInputRef,
  searchQuery,
  onSearchQueryChange,
  onSearchKeyDown,
  onBlur,
  isSearching,
  searchResultCount,
  activeSearchResultIndex,
  onClearSearch,
}: SidebarThreadSearchFieldProps) {
  const gt = useGT();
  const resultsVisible = isSearching && searchResultCount > 0;
  // Shrinking results can remove the active option; never leave aria-activedescendant pointing at it.
  const activeResultExists = resultsVisible && activeSearchResultIndex < searchResultCount;

  return (
    <div className="glass-fill glass-edge flex h-9 min-w-0 items-center gap-2 rounded-2xl px-2.5 text-sm font-medium text-sidebar-muted-foreground focus-within:text-sidebar-foreground">
      <SearchIcon className="size-4 shrink-0" />
      <SidebarInput
        ref={searchInputRef}
        nativeInput
        // Opened from the floating search button, so it takes focus when it appears.
        autoFocus
        type="search"
        value={searchQuery}
        onChange={(event) => onSearchQueryChange(event.currentTarget.value)}
        onKeyDown={onSearchKeyDown}
        onBlur={onBlur}
        placeholder={gt("Search", { $context: "search field placeholder" })}
        aria-label={gt("Search threads")}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={resultsVisible}
        aria-controls={resultsVisible ? "sidebar-thread-search-results" : undefined}
        aria-activedescendant={
          activeResultExists ? `sidebar-thread-search-result-${activeSearchResultIndex}` : undefined
        }
        className="min-w-0 flex-1"
      />
      {isSearching ? (
        <Button
          type="button"
          size="icon-micro"
          variant="ghost-muted"
          className="shrink-0"
          aria-label={gt("Clear thread search")}
          // Keeps focus in the field, which would otherwise close as it blurs.
          onPointerDown={(event) => event.preventDefault()}
          onClick={() => {
            onClearSearch();
            searchInputRef.current?.focus();
          }}
        >
          <XIcon className="size-3" />
        </Button>
      ) : null}
    </div>
  );
}

/** An icon button in the floating group beside the sidebar toggle. */
export function SidebarFloatingIconButton({
  label,
  tooltip = label,
  children,
  ...rest
}: {
  label: string;
  tooltip?: ReactNode;
  children?: ReactNode;
} & Omit<ComponentProps<typeof Button>, "children" | "className" | "aria-label">) {
  return (
    <SharedTooltipTrigger
      render={
        <Button
          size="icon"
          type="button"
          variant="ghost"
          aria-label={label}
          {...rest}
          className="size-[var(--workspace-titlebar-control-size)]! [-webkit-app-region:no-drag]"
        />
      }
      label={tooltip}
      side="bottom"
    >
      {children}
    </SharedTooltipTrigger>
  );
}
