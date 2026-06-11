import logoImg from "@/assets/deep-researcherl-logo.png";

export function BrandLockup({ className = "" }: { className?: string }) {
  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <img src={logoImg} alt="Deep Researcher" className="size-6 object-contain" />
      <span className="text-sm font-semibold tracking-tight text-foreground">
        Deep Researcher
      </span>
    </div>
  );
}
