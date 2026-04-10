import Link from "next/link";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "./cn";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  href?: string;
};

export function Button({
  className,
  variant = "primary",
  disabled,
  type = "button",
  href,
  children,
  ...rest
}: Props) {
  const base =
    "inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 disabled:pointer-events-none";
  const styles = {
    primary:
      "bg-rose-900 text-amber-50 hover:bg-rose-800 focus-visible:outline-rose-900",
    secondary:
      "bg-amber-100 text-rose-950 hover:bg-amber-200 focus-visible:outline-amber-600",
    ghost:
      "bg-transparent text-rose-950 hover:bg-amber-100/80 focus-visible:outline-amber-600",
    danger:
      "bg-red-700 text-white hover:bg-red-600 focus-visible:outline-red-700",
  };
  const cls = cn(base, styles[variant], className);

  if (href) {
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      className={cls}
      disabled={disabled}
      {...rest}
    >
      {children}
    </button>
  );
}
