import { Link } from "@tanstack/react-router";
import { HelpCircle, LogOut } from "lucide-react";
import { BrandLockup } from "./BrandLockup";
import { ThemeToggle } from "./ThemeToggle";
import { SettingsMenu } from "./SettingsMenu";
import type { UserSettings } from "@/lib/user-settings";

type Props = {
  onSignOut?: () => void;
  settings?: UserSettings;
  onSettingsChange?: (s: UserSettings) => void;
};

export function Navbar({ onSignOut, settings, onSettingsChange }: Props) {
  return (
    <div className="flex h-28 items-center justify-between px-4">
      <BrandLockup />
      <div className="hidden md:inline-flex items-center gap-2">
        {settings && onSettingsChange && (
          <SettingsMenu settings={settings} onSettingsChange={onSettingsChange} />
        )}
        <Link
          to="/how-it-works"
          className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-foreground hover:text-background"
          title="How it Works"
        >
          <HelpCircle className="size-3.5" />
          How it Works
        </Link>
        <ThemeToggle />
        {onSignOut && (
          <button
            onClick={onSignOut}
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-foreground hover:text-background"
            title="Sign out"
          >
            <LogOut className="size-3.5" />
            Sign out
          </button>
        )}
      </div>
    </div>
  );
}
