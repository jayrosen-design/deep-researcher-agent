import logoImg from "@/assets/deep-researcherl-logo.png";

export function BrandLockup({ className = "" }: { className?: string }) {
  return (
    <div className={`inline-flex items-center ${className}`}>
      <img src={logoImg} alt="Deep Researcher" className="h-10 w-auto object-contain" />
    </div>
  );
}
