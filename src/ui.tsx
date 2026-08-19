import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";
import { cx } from "./cx";

/* ------------------------------------------------------------------ Button */

type ButtonVariant = "primary" | "secondary" | "ghost" | "brand";
type ButtonSize = "sm" | "md";

const BUTTON_VARIANT: Record<ButtonVariant, string> = {
  primary: "bg-contrast text-on-contrast hover:bg-contrast-hover disabled:bg-surface-3 disabled:text-ink-2",
  brand: "bg-brand text-white hover:bg-brand-hover disabled:bg-surface-3 disabled:text-ink-2",
  secondary: "bg-surface text-ink border border-border hover:bg-surface-2",
  ghost: "text-ink-2 hover:bg-surface-2 hover:text-ink",
};

const BUTTON_SIZE: Record<ButtonSize, string> = {
  sm: "h-9 px-3.5 text-caption",
  md: "h-11 px-5 text-label",
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return (
    <button
      className={cx(
        "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full font-semibold",
        "transition-[background-color,transform] duration-150 active:scale-[0.97]",
        "disabled:pointer-events-none",
        BUTTON_VARIANT[variant],
        BUTTON_SIZE[size],
        className,
      )}
      {...props}
    />
  );
}

/** Icon-only action. Visual is compact, hit area stays 40px. */
export function IconButton({
  label,
  danger,
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string; danger?: boolean }) {
  return (
    <button
      aria-label={label}
      title={label}
      className={cx(
        "grid h-10 w-10 shrink-0 place-items-center rounded-full text-ink-3",
        "transition-[background-color,color,transform] duration-150 active:scale-90",
        danger ? "hover:bg-danger-soft hover:text-danger" : "hover:bg-surface-2 hover:text-ink",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

/* -------------------------------------------------------------------- Card */

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cx("rounded-card border border-border bg-surface shadow-e1", className)}>{children}</div>
  );
}

/* -------------------------------------------------------------------- Chip */

type ChipTone = "neutral" | "brand" | "danger" | "warn" | "info" | "plum";

const CHIP_TONE: Record<ChipTone, string> = {
  neutral: "bg-surface-2 text-ink-2",
  brand: "bg-brand-soft text-brand",
  danger: "bg-danger-soft text-danger",
  warn: "bg-warn-soft text-warn",
  info: "bg-info-soft text-info",
  plum: "bg-plum-soft text-plum",
};

export function Chip({
  tone = "neutral",
  className,
  children,
}: {
  tone?: ChipTone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-caption font-semibold",
        CHIP_TONE[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/* --------------------------------------------------------------- Checkbox */

export function Checkbox({
  checked,
  onChange,
  label,
  size = "md",
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
  size?: "sm" | "md";
}) {
  const box = size === "md" ? "h-6 w-6" : "h-5 w-5";
  const pad = size === "md" ? "h-11 w-11" : "h-9 w-9";
  return (
    <button
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={cx("grid shrink-0 place-items-center rounded-full transition-transform active:scale-90", pad)}
    >
      <span
        className={cx(
          "grid place-items-center rounded-full border-2 transition-colors duration-200",
          box,
          checked ? "border-brand bg-brand text-white" : "border-control bg-surface text-transparent",
        )}
      >
        <svg viewBox="0 0 16 16" className={size === "md" ? "h-3.5 w-3.5" : "h-3 w-3"} aria-hidden="true">
          <path
            d="M3.5 8.5l3 3 6-6.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </button>
  );
}

/* ----------------------------------------------------------- Progress ring */

export function ProgressRing({
  value,
  total,
  size = 44,
  children,
}: {
  value: number;
  total: number;
  size?: number;
  children?: ReactNode;
}) {
  const r = (size - 5) / 2;
  const c = 2 * Math.PI * r;
  const pct = total > 0 ? Math.min(value / total, 1) : 0;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth="4" className="text-surface-3" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          className="text-brand-vivid transition-[stroke-dashoffset] duration-500 ease-out"
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  );
}

/* --------------------------------------------------------- Section header */

export function SectionHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="mb-2.5 flex items-baseline justify-between gap-3">
      <h2 className="text-overline uppercase text-ink-3">{title}</h2>
      {action}
    </div>
  );
}

/* ------------------------------------------------------------ Empty state */

export function EmptyState({
  icon,
  title,
  hint,
  action,
}: {
  icon: string;
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-card border border-dashed border-border px-6 py-8 text-center">
      <span className="mb-1 text-2xl" aria-hidden="true">
        {icon}
      </span>
      <p className="text-label font-semibold text-ink">{title}</p>
      {hint && <p className="max-w-xs text-caption text-ink-3">{hint}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ Fields */

const FIELD_BASE =
  "w-full rounded-field border border-border bg-surface px-3.5 text-body text-ink placeholder:text-ink-3 " +
  "transition-[border-color,box-shadow] duration-150 focus:border-brand focus:outline-none " +
  "focus:ring-4 focus:ring-brand/12";

export function TextField({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cx(FIELD_BASE, "h-11", className)} {...props} />;
}

export function SelectField({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cx(FIELD_BASE, "h-11 pr-8 text-label", className)} {...props}>
      {children}
    </select>
  );
}
