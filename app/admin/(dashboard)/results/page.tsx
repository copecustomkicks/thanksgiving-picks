import {
  setBestInShowResultAction,
  setDogGroupResultAction,
  setFootballResultAction,
} from "@/app/admin/actions";
import { resolveAdminEventId } from "@/lib/admin/event";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import Link from "next/link";

export default async function AdminResultsPage({
  searchParams,
}: {
  searchParams: Promise<{ event?: string }>;
}) {
  const sp = await searchParams;
  const { eventId, events } = await resolveAdminEventId(sp.event);

  if (!eventId) {
    return (
      <p className="text-stone-600">
        <Link href="/admin" className="font-semibold text-rose-800 underline">
          Pick an event
        </Link>{" "}
        first.
      </p>
    );
  }

  const db = createAdminSupabaseClient();

  const { data: groupsData } = await db
    .from("dog_groups")
    .select("*")
    .eq("event_id", eventId)
    .order("sort_order", { ascending: true });

  const groups = groupsData ?? [];
  const groupIds = groups.map((g) => g.id);
  const { data: entriesRaw } =
    groupIds.length > 0
      ? await db.from("dog_entries").select("*").in("group_id", groupIds)
      : { data: [] as { id: string; group_id: string; name: string }[] };

  const entries = entriesRaw ?? [];

  const { data: groupResultsRaw } =
    groupIds.length > 0
      ? await db
          .from("dog_group_results")
          .select("*")
          .in("group_id", groupIds)
      : { data: [] as { group_id: string; winning_dog_entry_id: string | null }[] };

  const groupResults = groupResultsRaw ?? [];

  const grMap = Object.fromEntries(
    groupResults.map((r) => [r.group_id, r.winning_dog_entry_id])
  );

  const { data: bisRes } = await db
    .from("dog_best_in_show_results")
    .select("*")
    .eq("event_id", eventId)
    .maybeSingle();

  const { data: gamesData } = await db
    .from("football_games")
    .select("*")
    .eq("event_id", eventId)
    .order("sort_order", { ascending: true });

  const games = gamesData ?? [];
  const gameIds = games.map((g) => g.id);
  const { data: fbResRaw } =
    gameIds.length > 0
      ? await db.from("football_results").select("*").in("game_id", gameIds)
      : { data: [] as { game_id: string; winner_side: "home" | "away" }[] };

  const fbRes = fbResRaw ?? [];

  const fbMap = Object.fromEntries(fbRes.map((r) => [r.game_id, r.winner_side]));

  const entriesByGroup = new Map<string, typeof entries>();
  for (const e of entries) {
    const list = entriesByGroup.get(e.group_id) ?? [];
    list.push(e);
    entriesByGroup.set(e.group_id, list);
  }

  const allEntries = entries;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-rose-950">Live results</h2>
        <p className="text-sm text-stone-600">
          Set winners as they&apos;re announced. The leaderboard updates for
          everyone in real time.
        </p>
      </div>

      <Card className="space-y-4">
        <h3 className="font-bold text-rose-950">Dog groups</h3>
        {groups.map((g) => {
          const dogs = entriesByGroup.get(g.id) ?? [];
          const current = grMap[g.id] ?? "";
          return (
            <form
              key={g.id}
              action={async (fd: FormData) => {
                "use server";
                const v = String(fd.get("winner") || "");
                await setDogGroupResultAction({
                  groupId: String(fd.get("groupId")),
                  winningDogEntryId: v ? v : null,
                });
              }}
              className="flex flex-wrap items-end gap-2 border-b border-stone-100 pb-3 last:border-0"
            >
              <input type="hidden" name="groupId" value={g.id} />
              <div className="min-w-[10rem] flex-1">
                <p className="text-sm font-semibold text-rose-950">{g.name}</p>
              </div>
              <Select name="winner" defaultValue={current} className="max-w-md">
                <option value="">Not set</option>
                {dogs.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </Select>
              <Button type="submit" variant="secondary">
                Save
              </Button>
            </form>
          );
        })}
      </Card>

      <Card className="space-y-3">
        <h3 className="font-bold text-rose-950">Best in Show</h3>
        <form
          action={async (fd: FormData) => {
            "use server";
            const v = String(fd.get("winner") || "");
            await setBestInShowResultAction({
              eventId: String(fd.get("eventId")),
              winningDogEntryId: v ? v : null,
            });
          }}
          className="flex flex-wrap items-end gap-2"
        >
          <input type="hidden" name="eventId" value={eventId} />
          <Select
            name="winner"
            defaultValue={bisRes?.winning_dog_entry_id ?? ""}
            className="max-w-lg flex-1"
          >
            <option value="">Not set</option>
            {allEntries.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </Select>
          <Button type="submit" variant="secondary">
            Save
          </Button>
        </form>
      </Card>

      <Card className="space-y-4">
        <h3 className="font-bold text-rose-950">Football</h3>
        {games.map((g) => {
          const cur = fbMap[g.id] ?? "";
          return (
            <form
              key={g.id}
              action={async (fd: FormData) => {
                "use server";
                const v = String(fd.get("winner") || "");
                await setFootballResultAction({
                  gameId: String(fd.get("gameId")),
                  winnerSide:
                    v === "home" || v === "away"
                      ? v
                      : null,
                });
              }}
              className="flex flex-wrap items-end gap-2 border-b border-stone-100 pb-3 last:border-0"
            >
              <input type="hidden" name="gameId" value={g.id} />
              <div className="min-w-[12rem] flex-1">
                <p className="text-sm font-semibold text-rose-950">
                  {g.away_team} @ {g.home_team}
                </p>
              </div>
              <Select name="winner" defaultValue={cur} className="w-48">
                <option value="">Not set</option>
                <option value="home">{g.home_team}</option>
                <option value="away">{g.away_team}</option>
              </Select>
              <Button type="submit" variant="secondary">
                Save
              </Button>
            </form>
          );
        })}
      </Card>

      <p className="text-xs text-stone-500">
        Switch event:{" "}
        {events.map((e) => (
          <Link
            key={e.id}
            href={`/admin/results?event=${e.id}`}
            className="mr-2 font-semibold text-rose-800 underline"
          >
            {e.slug}
          </Link>
        ))}
      </p>
    </div>
  );
}
