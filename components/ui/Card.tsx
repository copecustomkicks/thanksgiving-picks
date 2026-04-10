import type { HTMLAttributes } from "react";
import { cn } from "./cn";

export function Card({
  className,
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-amber-900/10 bg-white/90 p-4 shadow-sm backdrop-blur-sm",
        className
      )}
      {...rest}
    />
  );
}
