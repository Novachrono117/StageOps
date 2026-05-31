import type { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

export function Input({ label, error, className = "", ...props }: InputProps) {
  return (
    <label className="grid gap-2 text-sm font-medium text-stage-text">
      {label}
      <input
        className={`h-11 rounded-lg border border-stage-line bg-white/5 px-3 text-stage-text outline-none transition placeholder:text-stage-muted focus:border-stage-cyan ${className}`}
        {...props}
      />
      {error ? <span className="text-xs text-stage-red">{error}</span> : null}
    </label>
  );
}
