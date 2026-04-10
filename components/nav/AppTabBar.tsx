"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/components/ui/cn";

const tabs = [
  { href: "/dog-show", label: "Dog show" },
  { href: "/football", label: "Football" },
  { href: "/leaderboard", label: "Scores" },
] as const;

export function AppTabBar() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-amber-900/10 bg-[color:var(--tp-cream)]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:static md:border-t-0 md:bg-transparent md:pb-0 md:backdrop-blur-none"
      aria-label="Main"
    >
      <ul className="mx-auto flex max-w-3xl items-stretch justify-around gap-1 px-2 py-2 md:justify-start md:gap-2 md:px-0 md:py-0">
        {tabs.map((t) => {
          const active = pathname === t.href;
          return (
            <li key={t.href} className="flex-1 md:flex-none">
              <Link
                href={t.href}
                className={cn(
                  "flex min-h-12 items-center justify-center rounded-xl px-3 text-sm font-semibold transition md:min-h-0 md:px-4 md:py-2",
                  active
                    ? "bg-rose-900 text-amber-50 shadow-sm"
                    : "text-rose-900 hover:bg-amber-100/80"
                )}
              >
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
