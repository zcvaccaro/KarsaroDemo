import type { ReactNode } from "react";

export function SaveButton({
  pending,
  dirty,
  saveLabel,
  savedLabel = "Saved",
  className,
  disabled,
  type = "submit",
  onClick,
}: {
  pending?: boolean;
  dirty: boolean;
  saveLabel: string;
  savedLabel?: string;
  className: string;
  disabled?: boolean;
  type?: "submit" | "button";
  onClick?: () => void;
}) {
  return (
    <button
      type={type}
      disabled={pending || disabled || (!dirty && !pending)}
      className={className}
      onClick={onClick}
    >
      {pending ? "Saving…" : dirty ? saveLabel : savedLabel}
    </button>
  );
}

export function saveButtonLabel(
  pending: boolean,
  dirty: boolean,
  saveLabel: string,
  savedLabel = "Saved",
): ReactNode {
  if (pending) return "Saving…";
  return dirty ? saveLabel : savedLabel;
}
