import type { SelectHTMLAttributes } from "react";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  error?: string;
};

export function Select({ label, error, children, ...props }: SelectProps) {
  return (
    <label className="grid gap-2 text-sm font-medium text-stage-text">
      {label}
      <select
        className="h-11 rounded-lg border border-stage-line bg-stage-panelSoft px-3 text-stage-text outline-none transition focus:border-stage-cyan"
        {...props}
      >
        {children}
      </select>
      {error ? <span className="text-xs text-stage-red">{error}</span> : null}
    </label>
  );
}
