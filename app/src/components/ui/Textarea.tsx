import type { TextareaHTMLAttributes } from "react";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  error?: string;
};

export function Textarea({ label, error, ...props }: TextareaProps) {
  return (
    <label className="grid gap-2 text-sm font-medium text-stage-text">
      {label}
      <textarea
        className="min-h-28 resize-y rounded-lg border border-stage-line bg-white/5 px-3 py-3 text-stage-text outline-none transition placeholder:text-stage-muted focus:border-stage-cyan"
        {...props}
      />
      {error ? <span className="text-xs text-stage-red">{error}</span> : null}
    </label>
  );
}
