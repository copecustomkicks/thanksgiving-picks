import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getEventIdFromCookie } from "@/lib/event/server";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default async function HomePage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const eventId = await getEventIdFromCookie();

  if (user && eventId) {
    redirect("/dog-show");
  }

  return (
    <main className="mx-auto flex min-h-full max-w-lg flex-1 flex-col justify-center px-4 py-12">
      <Card className="space-y-6 text-center">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-wide text-rose-800/80">
            Family game
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight text-rose-950 md:text-4xl">
            Thanksgiving Picks
          </h1>
          <p className="text-stone-600">
            Dog show and football predictions with a live leaderboard.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <Button
            href="/join"
            variant="primary"
            className="w-full py-3 text-base"
          >
            Join with family code
          </Button>
          <Button href="/admin/login" variant="ghost" className="w-full">
            Admin
          </Button>
        </div>
      </Card>
    </main>
  );
}
