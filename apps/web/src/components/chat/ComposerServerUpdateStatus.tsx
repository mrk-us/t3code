import type { ServerUpdateState } from "@t3tools/client-runtime/state/server";
import { AlertCircleIcon, DownloadIcon } from "~/lib/icons";

// Static on purpose: the title says when an update is running, and spinners repaint every frame.
export function ComposerServerUpdateIcon({
  status,
}: {
  readonly status: ServerUpdateState["status"];
}) {
  if (status === "failed") {
    return <AlertCircleIcon aria-hidden className="text-error" />;
  }
  return <DownloadIcon aria-hidden />;
}
