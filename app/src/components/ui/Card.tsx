import type { HTMLAttributes } from "react";

export function Card({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <section
      className={`rounded-2xl border border-stage-line bg-stage-panel/88 shadow-panel backdrop-blur ${className}`}
      {...props}
    />
  );
}
