import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getEventById, getEventIdFromCookie } from "@/lib/event/server";
import { dogShowLocked, footballLocked } from "@/lib/event/locks";
import type { LeaderboardRpcRow } from "@/lib/db/types";
import { LeaderboardView } from "@/components/leaderboard/LeaderboardView";

export default async function LeaderboardPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const eventId = await getEventIdFromCookie();
  if (!eventId) return null;

  const event = await getEventById(eventId);
  if (!event) return null;

  const dogL = dogShowLocked(event);
  const fbL = footballLocked(event);

  const { data: lbRaw, error: lbErr } = await supabase.rpc(
    "leaderboard_for_event",
    { p_event_id: eventId }
  );

  if (lbErr) {
    return (
      <p className="text-red-700">
        Could not load leaderboard: {lbErr.message}
      </p>
    );
  }

  const leaderboard = (lbRaw ?? []) as LeaderboardRpcRow[];

  const { data: groupsData } = await supabase
    .from("dog_groups")
    .select("id, name")
    .eq("event_id", eventId)
    .order("sort_order", { ascending: true });

  const groups = groupsData ?? [];
  const groupIds = groups.map((g) => g.id);

  const { data: entriesRaw } =
    groupIds.length > 0
      ? await supabase.from("dog_entries").select("id, name").in("group_id", groupIds)
      : { data: [] as { id: string; name: string }[] };

  const entries = entriesRaw ?? [];
  const entryNames = Object.fromEntries(entries.map((e) => [e.id, e.name]));

  const { data: groupResultsRaw } =
    groupIds.length > 0
      ? await supabase
          .from("dog_group_results")
          .select("group_id, winning_dog_entry_id")
          .in("group_id", groupIds)
      : { data: [] as { group_id: string; winning_dog_entry_id: string | null }[] };

  const groupResults = groupResultsRaw ?? [];

  const groupResultMap = Object.fromEntries(
    groupResults.map((r) => [r.group_id, r.winning_dog_entry_id])
  );

  const { data: bisRes } = await supabase
    .from("dog_best_in_show_results")
    .select("winning_dog_entry_id")
    .eq("event_id", eventId)
    .maybeSingle();

  const { data: gamesData } = await supabase
    .from("football_games")
    .select("id, home_team, away_team, points_value")
    .eq("event_id", eventId)
    .order("sort_order", { ascending: true });

  const games = gamesData ?? [];
  const gameIds = games.map((g) => g.id);

  const { data: gameResultsRaw } =
    gameIds.length > 0
      ? await supabase
          .from("football_results")
          .select("game_id, winner_side")
          .in("game_id", gameIds)
      : { data: [] as { game_id: string; winner_side: "home" | "away" }[] };

  const gameResults = gameResultsRaw ?? [];

  const gameResultMap = Object.fromEntries(
    gameResults.map((r) => [r.game_id, r.winner_side])
  );

  const { data: groupPicksRaw } = await supabase
    .from("dog_group_picks")
    .select("participant_id, group_id, dog_entry_id")
    .eq("event_id", eventId);

  const groupPicks = groupPicksRaw ?? [];

  const { data: bisPicksRaw } = await supabase
    .from("dog_best_in_show_picks")
    .select("participant_id, dog_entry_id")
    .eq("event_id", eventId);

  const bisPicks = bisPicksRaw ?? [];

  const { data: fbPicksRaw } = await supabase
    .from("football_picks")
    .select("participant_id, game_id, winner_side")
    .eq("event_id", eventId);

  const fbPicks = fbPicksRaw ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-rose-950">Live scores</h2>
        <p className="text-sm text-stone-600">
          Rankings update as results come in. Pull to refresh isn&apos;t needed —
          changes appear automatically.
        </p>
      </div>

      <LeaderboardView
        viewerId={user.id}
        dogLocked={dogL}
        footballLocked={fbL}
        leaderboard={leaderboard.map((row) => ({
          ...row,
          dog_points: Number(row.dog_points),
          football_points: Number(row.football_points),
          total_points: Number(row.total_points),
        }))}
        groupLabels={groups}
        entryNames={entryNames}
        groupResults={groupResultMap}
        bisResultId={bisRes?.winning_dog_entry_id ?? null}
        games={games}
        gameResults={gameResultMap}
        groupPicks={groupPicks}
        bisPicks={bisPicks}
        fbPicks={fbPicks}
      />
    </div>
  );
}
