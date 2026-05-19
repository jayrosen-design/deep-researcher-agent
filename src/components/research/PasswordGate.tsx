import { useState, type FormEvent } from "react";
import { Lock } from "lucide-react";
import { setAuthed, verifyPassword } from "@/lib/auth";
import { ThemeToggle } from "./ThemeToggle";


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
    <div className="mx-auto flex min-h-[80vh] w-full max-w-md flex-col items-center justify-center px-6">
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
          className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy ? "Checking…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
