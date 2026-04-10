import type { HTMLAttributes } from "react";
import { cn } from "./cn";

const map = {
  pending: "bg-stone-100 text-stone-700 border-stone-200",
  locked: "bg-amber-200/80 text-amber-950 border-amber-300",
  correct: "bg-emerald-100 text-emerald-900 border-emerald-200",
  incorrect: "bg-red-100 text-red-900 border-red-200",
} as const;

export type BadgeVariant = keyof typeof map;

export function Badge({
  variant,
  className,
  ...rest
}: HTMLAttributes<HTMLSpanElement> & { variant: BadgeVariant }) {
  return (
    <span
      role="status"
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        map[variant],
        className
      )}
      {...rest}
    />
  );
}
