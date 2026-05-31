import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
};

const variantClasses = {
  primary: "bg-stage-purple text-white hover:bg-stage-purple/90",
  secondary: "border border-stage-line bg-white/5 text-stage-text hover:bg-white/10",
  ghost: "text-stage-muted hover:bg-white/10 hover:text-stage-text"
};

export function Button({
  className = "",
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${variantClasses[variant]} ${className}`}
      {...props}
    />
  );
}
