import * as React from "react";
import { cn } from "@/lib/utils";

export function Logo({ className, ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("text-foreground", className)}
      {...props}
    >
      {/* Magnifying glass lens */}
      <circle cx="11" cy="11" r="8" />
      {/* Handle */}
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
      {/* AI sparkle at the core */}
      <path
        d="M11 6C11 8.5 13.5 11 16 11C13.5 11 11 13.5 11 16C11 13.5 8.5 11 6 11C8.5 11 11 8.5 11 6Z"
        fill="currentColor"
        stroke="none"
      />
    </svg>
  );
}
