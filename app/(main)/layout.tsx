import { redirect } from "next/navigation";
import { AppTabBar } from "@/components/nav/AppTabBar";
import { RefreshOnRealtime } from "@/components/providers/RefreshOnRealtime";
import { Button } from "@/components/ui/Button";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getEventById, getEventIdFromCookie } from "@/lib/event/server";

export default async function MainAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/join");
  }

  const eventId = await getEventIdFromCookie();
  if (!eventId) {
    redirect("/join");
  }

  const event = await getEventById(eventId);
  if (!event) {
    redirect("/join");
  }

  return (
    <div className="flex min-h-full flex-1 flex-col pb-24 md:pb-10">
      <RefreshOnRealtime eventId={eventId} />
      <header className="sticky top-0 z-30 border-b border-amber-900/10 bg-[color:var(--tp-cream)]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-rose-800/80">
              Thanksgiving Picks
            </p>
            <h1 className="text-lg font-bold text-rose-950">{event.title}</h1>
          </div>
          <Button href="/" variant="ghost" className="shrink-0 text-xs">
            Home
          </Button>
        </div>
        <div className="mx-auto hidden max-w-3xl px-4 pb-3 md:block">
          <AppTabBar />
        </div>
      </header>

      <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">{children}</div>

      <div className="md:hidden">
        <AppTabBar />
      </div>
    </div>
  );
}
