import { useState, type FormEvent } from "react";
import { Lock, HelpCircle } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { setAuthed, verifyPassword } from "@/lib/auth";
import { ThemeToggle } from "./ThemeToggle";
import logoImg from "@/assets/deep-researcherl-logo.png";
import signInBtnLight from "@/assets/sign-in-button-light.png";
import signInBtnDark from "@/assets/sign-in-button-dark.png";




export function PasswordGate({ onSuccess }: { onSuccess: () => void }) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!value) return;
    setBusy(true);
    setError(null);
    const ok = await verifyPassword(value);
    setBusy(false);
    if (!ok) {
      setError("Incorrect password.");
      return;
    }
    setAuthed(true);
    onSuccess();
  };

  return (
    <div className="relative mx-auto flex min-h-[80vh] w-full max-w-md flex-col items-center justify-center px-6">
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
      </div>

      <img src={logoImg} alt="Deep Researcher" className="mb-6 h-28 w-auto object-contain" />
      <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-muted/40 px-3 py-1 text-xs text-muted-foreground">

        <Lock className="size-3.5" />
        Restricted access
      </div>
      <h1 className="text-center text-3xl font-semibold tracking-tight text-foreground">
        Sign in to continue
      </h1>
      <p className="mt-2 text-center text-sm text-muted-foreground">
        Enter the access password to use Deep Researcher Agent.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 w-full space-y-3">
        <input
          type="password"
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Password"
          className="w-full rounded-lg border border-border bg-card px-4 py-3 text-base text-foreground placeholder:text-muted-foreground/70 focus:border-foreground/30 focus:outline-none"
        />
        {error && <div className="text-sm text-destructive">{error}</div>}
        <button
          type="submit"
          disabled={!value || busy}
          className="flex w-full items-center justify-center transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <img
            src={signInBtnLight}
            alt="Sign in"
            className="block h-auto w-full object-contain dark:hidden"
          />
          <img
            src={signInBtnDark}
            alt="Sign in"
            className="hidden h-auto w-full object-contain dark:block"
          />
        </button>
      </form>
    </div>
  );
}
