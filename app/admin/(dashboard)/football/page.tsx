import {
  addFootballGameAction,
  deleteFootballGameAction,
  updateFootballGameAction,
} from "@/app/admin/actions";
import { resolveAdminEventId } from "@/lib/admin/event";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import Link from "next/link";

export default async function AdminFootballPage({
  searchParams,
}: {
  searchParams: Promise<{ event?: string }>;
}) {
  const sp = await searchParams;
  const { eventId, events } = await resolveAdminEventId(sp.event);

  if (!eventId) {
    return (
      <p className="text-stone-600">
        Create an event on the{" "}
        <Link href="/admin" className="font-semibold text-rose-800 underline">
          overview
        </Link>{" "}
        first.
      </p>
    );
  }

  const db = createAdminSupabaseClient();
  const { data: gamesData } = await db
    .from("football_games")
    .select("*")
    .eq("event_id", eventId)
    .order("sort_order", { ascending: true });

  const games = gamesData ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-rose-950">Football games</h2>
        <p className="text-sm text-stone-600">
          Home / away labels, optional kickoff time, custom points.
        </p>
      </div>

      <Card className="space-y-3">
        <h3 className="font-bold text-rose-950">Add game</h3>
        <form
          action={async (fd: FormData) => {
            "use server";
            await addFootballGameAction({
              eventId: String(fd.get("eventId")),
              homeTeam: String(fd.get("home")),
              awayTeam: String(fd.get("away")),
              gameTime: String(fd.get("kickoff") || "") || null,
              pointsValue: Number(fd.get("pts") ?? 1),
            });
          }}
          className="grid gap-2 md:grid-cols-2"
        >
          <input type="hidden" name="eventId" value={eventId} />
          <Input name="home" required placeholder="Home team" />
          <Input name="away" required placeholder="Away team" />
          <Input name="kickoff" type="datetime-local" />
          <Input name="pts" type="number" defaultValue={1} />
          <div className="md:col-span-2">
            <Button type="submit" variant="primary">
              Add game
            </Button>
          </div>
        </form>
      </Card>

      {games.map((g) => (
        <Card key={g.id} className="space-y-3">
          <form
            action={async (fd: FormData) => {
              "use server";
              await updateFootballGameAction({
                id: String(fd.get("id")),
                homeTeam: String(fd.get("home")),
                awayTeam: String(fd.get("away")),
                gameTime: String(fd.get("kickoff") || "") || null,
                pointsValue: Number(fd.get("pts")),
                sortOrder: Number(fd.get("sort")),
              });
            }}
            className="grid gap-2 md:grid-cols-2"
          >
            <input type="hidden" name="id" value={g.id} />
            <Input name="home" defaultValue={g.home_team} required />
            <Input name="away" defaultValue={g.away_team} required />
            <Input
              name="kickoff"
              type="datetime-local"
              defaultValue={
                g.game_time
                  ? new Date(g.game_time).toISOString().slice(0, 16)
                  : ""
              }
            />
            <Input
              name="pts"
              type="number"
              defaultValue={g.points_value}
            />
            <Input
              name="sort"
              type="number"
              defaultValue={g.sort_order}
            />
            <div className="flex flex-wrap gap-2 md:col-span-2">
              <Button type="submit" variant="secondary">
                Save
              </Button>
            </div>
          </form>
          <form
            action={async () => {
              "use server";
              await deleteFootballGameAction(g.id);
            }}
          >
            <Button type="submit" variant="danger">
              Delete game
            </Button>
          </form>
        </Card>
      ))}

      <p className="text-xs text-stone-500">
        Switch event:{" "}
        {events.map((e) => (
          <Link
            key={e.id}
            href={`/admin/football?event=${e.id}`}
            className="mr-2 font-semibold text-rose-800 underline"
          >
            {e.slug}
          </Link>
        ))}
      </p>
    </div>
  );
}
