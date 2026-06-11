import { Link } from "@tanstack/react-router";
import logoImg from "@/assets/deep-researcherl-logo2.png";

export function BrandLockup({ className = "" }: { className?: string }) {
  return (
    <Link to="/" className={`inline-flex items-center ${className}`}>
      <img src={logoImg} alt="Deep Researcher" className="h-20 w-auto object-contain" />
    </Link>
  );
}
