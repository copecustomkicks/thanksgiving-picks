import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getEventById, getEventIdFromCookie } from "@/lib/event/server";
import { footballLocked } from "@/lib/event/locks";
import { GamePickCard } from "@/components/football/GamePickCard";
import { Badge } from "@/components/ui/Badge";

export default async function FootballPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const eventId = await getEventIdFromCookie();
  if (!eventId) return null;

  const event = await getEventById(eventId);
  if (!event) return null;

  const locked = footballLocked(event);

  const { data: gamesData } = await supabase
    .from("football_games")
    .select("*")
    .eq("event_id", eventId)
    .order("sort_order", { ascending: true });

  const games = gamesData ?? [];
  const gameIds = games.map((g) => g.id);

  const { data: picksRaw } =
    gameIds.length > 0
      ? await supabase
          .from("football_picks")
          .select("game_id, winner_side, participant_id")
          .eq("event_id", eventId)
      : { data: [] as { game_id: string; winner_side: "home" | "away"; participant_id: string }[] };

  const picks = picksRaw ?? [];

  const { data: resultsRaw } =
    gameIds.length > 0
      ? await supabase
          .from("football_results")
          .select("game_id, winner_side")
          .in("game_id", gameIds)
      : { data: [] as { game_id: string; winner_side: "home" | "away" }[] };

  const results = resultsRaw ?? [];

  const resultByGame = Object.fromEntries(
    results.map((r) => [r.game_id, r.winner_side])
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-2xl font-bold text-rose-950">Football picks</h2>
          <p className="text-sm text-stone-600">
            Pick the winner for each Thanksgiving game.
          </p>
        </div>
        <Badge variant={locked ? "locked" : "pending"}>
          {locked ? "Locked" : "Open"}
        </Badge>
      </div>

      {games.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-amber-900/20 bg-white/60 px-4 py-8 text-center text-stone-600">
          Games aren&apos;t posted yet. Your host will add them before kickoff.
        </p>
      ) : (
        <div className="space-y-4">
          {games.map((g) => {
            const mine = picks.find(
              (p) => p.game_id === g.id && p.participant_id === user.id
            );
            return (
              <GamePickCard
                key={g.id}
                eventId={eventId}
                game={g}
                locked={locked}
                myPick={mine?.winner_side ?? null}
                result={resultByGame[g.id]}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
