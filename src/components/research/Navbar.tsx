import { Link } from "@tanstack/react-router";
import { HelpCircle, LogOut } from "lucide-react";
import { BrandLockup } from "./BrandLockup";
import { ThemeToggle } from "./ThemeToggle";

type Props = {
  onSignOut?: () => void;
};

export function Navbar({ onSignOut }: Props) {
  return (
    <div className="relative h-14">
      <BrandLockup className="absolute left-4 top-4" />
      <div className="absolute right-4 top-4 inline-flex items-center gap-2">
        <Link
          to="/how-it-works"
          className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
          title="How it Works"
        >
          <HelpCircle className="size-3.5" />
          How it Works
        </Link>
        <ThemeToggle />
        {onSignOut && (
          <button
            onClick={onSignOut}
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
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
