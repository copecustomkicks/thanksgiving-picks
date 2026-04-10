import type { SelectHTMLAttributes } from "react";
import { cn } from "./cn";

export function Select({
  className,
  children,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "w-full rounded-xl border border-amber-900/15 bg-white px-3 py-2.5 text-rose-950 shadow-sm focus-visible:border-rose-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-rose-800",
        className
      )}
      {...rest}
    >
      {children}
    </select>
  );
}
