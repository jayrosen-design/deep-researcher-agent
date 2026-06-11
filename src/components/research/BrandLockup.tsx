import { Link, useRouterState } from "@tanstack/react-router";
import logoImg from "@/assets/deep-researcherl-logo2.png";

export function BrandLockup({ className = "" }: { className?: string }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <Link
      to="/"
      className={`inline-flex items-center ${className}`}
      onClick={(e) => {
        if (pathname === "/") {
          e.preventDefault();
          window.dispatchEvent(new CustomEvent("app:reset-home"));
        }
      }}
    >
      <img src={logoImg} alt="Deep Researcher" className="h-20 w-auto object-contain" />
    </Link>
  );
}
