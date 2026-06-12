import { KeyRound } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export type MissingKeys = {
  navigator: boolean;
  search: boolean;
};

export function ApiKeyMissingDialog({
  open,
  onOpenChange,
  missing,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  missing: MissingKeys;
}) {
  const needed: string[] = [];
  if (missing.navigator) needed.push("NaviGator");
  if (missing.search) needed.push("Firecrawl or Tavily");

  const handleOpenSettings = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("app:open-settings", { detail: { tab: "apikeys" } }),
      );
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="size-4" /> API key required
          </DialogTitle>
          <DialogDescription>
            {needed.length > 0
              ? `Add your ${needed.join(" and ")} API key${needed.length > 1 ? "s" : ""} to continue. Keys are stored only on this device.`
              : "An API key is required to continue. Keys are stored only on this device."}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="clay-neutral inline-flex items-center justify-center rounded-full px-4 py-2 text-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleOpenSettings}
            className="clay inline-flex items-center justify-center rounded-full px-4 py-2 text-sm"
          >
            Enter API Key
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function getMissingKeys(
  settings: { navigatorApiKey: string; firecrawlApiKey: string; tavilyApiKey: string },
  opts: { needsSearch: boolean },
): MissingKeys {
  return {
    navigator: !settings.navigatorApiKey.trim(),
    search:
      opts.needsSearch &&
      !settings.firecrawlApiKey.trim() &&
      !settings.tavilyApiKey.trim(),
  };
}

export function hasMissing(m: MissingKeys): boolean {
  return m.navigator || m.search;
}
