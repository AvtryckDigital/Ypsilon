"use client";

import { useTransition, type ReactNode } from "react";
import { Loader2 } from "lucide-react";

// Knapp som frågar innan den kör en åtgärd, t.ex. borttagning.
export default function ConfirmButton({
  action,
  message,
  children,
  className = "admin-btn-danger",
  label,
}: {
  action: () => Promise<void>;
  message: string;
  children: ReactNode;
  className?: string;
  label?: string;
}) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      aria-label={label}
      title={label}
      className={className}
      onClick={() => {
        if (confirm(message)) start(() => action());
      }}
    >
      {pending ? <Loader2 size={16} className="animate-spin" aria-hidden /> : null}
      {children}
    </button>
  );
}
