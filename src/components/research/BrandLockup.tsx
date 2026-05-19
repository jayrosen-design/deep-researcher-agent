import { Logo } from "@/components/ui/logo";

export function BrandLockup({ className = "" }: { className?: string }) {
  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <Logo className="size-6 text-foreground" />
      <span className="text-sm font-semibold tracking-tight text-foreground">
        Deep Researcher
      </span>
    </div>
  );
}
