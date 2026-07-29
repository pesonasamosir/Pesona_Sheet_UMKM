"use client";

import { clsx } from "@/lib/format";
import { useState, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition active:translate-y-px disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]";
  const variants = {
    primary:
      "bg-primary text-primary-fg shadow-[var(--shadow)] hover:brightness-110",
    secondary:
      "border border-border bg-elevated text-fg hover:bg-primary-soft",
    danger:
      "border border-[color-mix(in_srgb,var(--danger)_35%,var(--border))] bg-danger-soft text-danger hover:brightness-95",
    ghost: "text-muted hover:bg-primary-soft hover:text-fg",
  };
  const sizes = {
    sm: "min-h-9 px-3 text-sm",
    md: "min-h-11 px-4 text-sm",
    lg: "min-h-12 px-5 text-base",
  };
  return (
    <button
      className={clsx(base, variants[variant], sizes[size], className)}
      {...props}
    />
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={clsx(
        "w-full min-h-11 rounded-xl border border-border bg-elevated px-3 text-base text-fg outline-none transition placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-[var(--ring)]",
        props.className,
      )}
    />
  );
}

/**
 * Number field that shows empty + placeholder "0" when value is 0,
 * so users type 123 instead of editing over 0123.
 */
export function NumberInput({
  value,
  onValueChange,
  placeholder = "0",
  allowDecimal = true,
  min,
  max,
  className,
  onFocus,
  onBlur,
  ...rest
}: Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type"> & {
  value: number;
  onValueChange: (n: number) => void;
  allowDecimal?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  const [draft, setDraft] = useState("");

  const display = focused ? draft : value === 0 ? "" : String(value);

  return (
    <Input
      {...rest}
      type="text"
      inputMode={allowDecimal ? "decimal" : "numeric"}
      placeholder={placeholder}
      value={display}
      className={className}
      onFocus={(e) => {
        setFocused(true);
        setDraft(value === 0 ? "" : String(value));
        onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocused(false);
        onBlur?.(e);
      }}
      onChange={(e) => {
        const raw = e.target.value.trim();
        const pattern = allowDecimal ? /^-?\d*\.?\d*$/ : /^-?\d*$/;
        if (raw !== "" && !pattern.test(raw)) return;
        setDraft(raw);
        if (raw === "" || raw === "-" || raw === ".") {
          onValueChange(0);
          return;
        }
        const n = Number(raw);
        if (!Number.isFinite(n)) return;
        if (min !== undefined && n < Number(min)) return;
        if (max !== undefined && n > Number(max)) return;
        onValueChange(n);
      }}
    />
  );
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={clsx(
        "w-full min-h-11 rounded-xl border border-border bg-elevated px-3 text-base text-fg outline-none focus:border-primary focus:ring-2 focus:ring-[var(--ring)]",
        props.className,
      )}
    />
  );
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={clsx(
        "w-full rounded-xl border border-border bg-elevated px-3 py-2 text-base text-fg outline-none focus:border-primary focus:ring-2 focus:ring-[var(--ring)]",
        props.className,
      )}
    />
  );
}

export function Label({ children }: { children: ReactNode }) {
  return (
    <label className="mb-1.5 block text-sm font-semibold text-fg">
      {children}
    </label>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-1">
      <Label>{label}</Label>
      {children}
      {hint ? <p className="text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

export function Card({
  title,
  action,
  children,
  className,
}: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={clsx(
        "overflow-hidden rounded-2xl border border-border bg-elevated shadow-[var(--shadow)]",
        className,
      )}
    >
      {(title || action) && (
        <header className="flex items-center justify-between gap-3 border-b border-border bg-[color-mix(in_srgb,var(--bg)_65%,var(--bg-elevated))] px-4 py-3">
          {title ? <h2 className="text-sm font-semibold">{title}</h2> : <span />}
          {action}
        </header>
      )}
      <div className="p-4">{children}</div>
    </section>
  );
}

export function PageHeader({
  title,
  lead,
  actions,
}: {
  title: string;
  lead?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-fg lg:text-4xl">
          {title}
        </h1>
        {lead ? <p className="mt-1 text-sm leading-relaxed text-muted lg:text-base">{lead}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function Badge({
  tone = "ok",
  children,
}: {
  tone?: "ok" | "danger" | "warn" | "neutral";
  children: ReactNode;
}) {
  const tones = {
    ok: "bg-ok-soft text-ok",
    danger: "bg-danger-soft text-danger",
    warn: "bg-warn-soft text-warn",
    neutral: "bg-primary-soft text-fg",
  };
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-bold",
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}

export function StatTile({
  label,
  value,
  hint,
  tone = "forest",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "forest" | "primary" | "warn" | "ok";
}) {
  const tones = {
    forest: "from-[#14301a] to-[#1e3a24] text-white",
    primary: "from-[#245530] to-[#2f6b3a] text-white",
    warn: "from-[#8a5612] to-[#b54708] text-white",
    ok: "from-[#0f5132] to-[#067647] text-white",
  };
  return (
    <div
      className={clsx(
        "relative overflow-hidden rounded-2xl bg-gradient-to-br p-4 shadow-[var(--shadow)]",
        tones[tone],
      )}
    >
      <p className="text-[0.68rem] font-bold uppercase tracking-[0.06em] opacity-85">
        {label}
      </p>
      <p className="font-display mt-2 text-2xl font-semibold tracking-tight lg:text-3xl">
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs opacity-80">{hint}</p> : null}
    </div>
  );
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Hapus",
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-4 sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-md rounded-2xl border border-border bg-elevated p-5 shadow-[var(--shadow)]"
      >
        <h3 className="font-display text-xl font-semibold">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted">{message}</p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={onCancel}>
            Batal
          </Button>
          <Button variant="danger" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted">
      {children}
    </div>
  );
}

export function PreviewBox({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-primary-soft/60 p-3 text-sm">
      {children}
    </div>
  );
}
