import Link from "next/link";
import { logoutAdminAction } from "@/app/admin/logout-action";
import { Button } from "@/components/ui/Button";

const links = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/dog-show", label: "Dog show" },
  { href: "/admin/football", label: "Football" },
  { href: "/admin/locks", label: "Locks" },
  { href: "/admin/results", label: "Live results" },
  { href: "/admin/reset", label: "Reset" },
] as const;

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto min-h-full max-w-5xl px-4 py-8">
      <header className="mb-8 flex flex-col gap-4 border-b border-stone-200 pb-6 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
            Thanksgiving Picks
          </p>
          <h1 className="text-2xl font-bold text-rose-950">Admin</h1>
        </div>
        <form action={logoutAdminAction}>
          <Button type="submit" variant="secondary">
            Log out
          </Button>
        </form>
      </header>

      <nav className="mb-8 flex flex-wrap gap-2">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="rounded-xl bg-white px-3 py-2 text-sm font-semibold text-rose-950 shadow-sm ring-1 ring-stone-200 hover:bg-amber-50"
          >
            {l.label}
          </Link>
        ))}
        <Link
          href="/dog-show"
          className="rounded-xl px-3 py-2 text-sm font-semibold text-stone-600 hover:text-rose-950"
        >
          Open player app
        </Link>
      </nav>

      {children}
    </div>
  );
}
