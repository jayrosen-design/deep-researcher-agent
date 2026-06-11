import { Link } from "@tanstack/react-router";
import { HelpCircle } from "lucide-react";
import { BrandLockup } from "./BrandLockup";
import { ThemeToggle } from "./ThemeToggle";
import { SettingsMenu } from "./SettingsMenu";
import type { UserSettings } from "@/lib/user-settings";

type Props = {
  onSignOut?: () => void;
  settings?: UserSettings;
  onSettingsChange?: (s: UserSettings) => void;
};

export function Navbar({ settings, onSettingsChange }: Props) {
  return (
    <div className="flex h-28 items-center justify-center md:justify-between px-4">
      <BrandLockup />
      <div className="hidden md:inline-flex items-center gap-2">
        <Link
          to="/how-it-works"
          className="clay-neutral inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs"
          title="How it Works"
        >
          <HelpCircle className="size-3.5" />
          How it Works
        </Link>
        {settings && onSettingsChange && (
          <SettingsMenu settings={settings} onSettingsChange={onSettingsChange} />
        )}
        <ThemeToggle />
      </div>
    </div>
  );
}

