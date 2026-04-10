import type { LeaderboardRpcRow } from "@/lib/db/types";
import { withCompetitionRanks } from "@/lib/scoring/ranks";
import { dogGroupPickState, footballPickState } from "@/lib/scoring/compute";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";

type GroupPickRow = {
  participant_id: string;
  group_id: string;
  dog_entry_id: string | null;
};

type BisPickRow = {
  participant_id: string;
  dog_entry_id: string | null;
};

type FbPickRow = {
  participant_id: string;
  game_id: string;
  winner_side: "home" | "away";
};

type Props = {
  viewerId: string;
  dogLocked: boolean;
  footballLocked: boolean;
  leaderboard: LeaderboardRpcRow[];
  groupLabels: { id: string; name: string }[];
  entryNames: Record<string, string>;
  groupResults: Record<string, string | null>;
  bisResultId: string | null;
  games: {
    id: string;
    home_team: string;
    away_team: string;
    points_value: number;
  }[];
  gameResults: Record<string, "home" | "away" | undefined>;
  groupPicks: GroupPickRow[];
  bisPicks: BisPickRow[];
  fbPicks: FbPickRow[];
};

function pickBadge(
  state: ReturnType<typeof dogGroupPickState> | ReturnType<typeof footballPickState>,
  hasResult: boolean
) {
  if (!hasResult) return <Badge variant="pending">Pending</Badge>;
  if (state === "correct") return <Badge variant="correct">Correct</Badge>;
  if (state === "incorrect") return <Badge variant="incorrect">Incorrect</Badge>;
  return <Badge variant="pending">Pending</Badge>;
}

export function LeaderboardView(props: Props) {
  const ranked = withCompetitionRanks(props.leaderboard);

  function groupPickFor(pid: string, gid: string) {
    return props.groupPicks.find(
      (p) => p.participant_id === pid && p.group_id === gid
    );
  }

  function bisPickFor(pid: string) {
    return props.bisPicks.find((p) => p.participant_id === pid);
  }

  function fbPickFor(pid: string, gameId: string) {
    return props.fbPicks.find(
      (p) => p.participant_id === pid && p.game_id === gameId
    );
  }

  function canSeeDogPicks(pid: string) {
    return props.dogLocked || pid === props.viewerId;
  }

  function canSeeFbPicks(pid: string) {
    return props.footballLocked || pid === props.viewerId;
  }

  return (
    <div className="space-y-8">
      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[320px] text-left text-sm">
          <thead className="border-b border-amber-900/10 bg-amber-50/60 text-xs uppercase tracking-wide text-stone-600">
            <tr>
              <th className="px-4 py-3">Rank</th>
              <th className="px-4 py-3">Player</th>
              <th className="px-4 py-3 text-right">Dog</th>
              <th className="px-4 py-3 text-right">FB</th>
              <th className="px-4 py-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {ranked.map((row) => (
              <tr
                key={row.participant_id}
                className="border-b border-amber-900/5 odd:bg-white/60"
              >
                <td className="px-4 py-3 text-lg font-bold text-rose-950">
                  {row.rankLabel}
                </td>
                <td className="px-4 py-3 font-semibold text-rose-950">
                  {row.display_name}
                  {row.participant_id === props.viewerId ? (
                    <span className="ml-2 text-xs font-normal text-stone-500">
                      (you)
                    </span>
                  ) : null}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {row.dog_points}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {row.football_points}
                </td>
                <td className="px-4 py-3 text-right text-lg font-bold tabular-nums text-rose-950">
                  {row.total_points}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-rose-950">Pick breakdown</h2>
        <p className="text-sm text-stone-600">
          Other players&apos; picks stay hidden until that section locks. Your
          picks are always visible to you.
        </p>
        <div className="space-y-4">
          {ranked.map((player) => (
            <Card key={player.participant_id} className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-base font-bold text-rose-950">
                  {player.display_name}
                </h3>
                <p className="text-sm text-stone-600">
                  {player.total_points} pts total
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wide text-stone-500">
                  Dog show
                </h4>
                <ul className="space-y-2">
                  {props.groupLabels.map((g) => {
                    const show = canSeeDogPicks(player.participant_id);
                    const pick = groupPickFor(player.participant_id, g.id);
                    const resId = props.groupResults[g.id] ?? null;
                    const pickedId = pick?.dog_entry_id ?? null;
                    const st = dogGroupPickState(pickedId, resId);
                    return (
                      <li
                        key={g.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-stone-50 px-3 py-2 text-sm"
                      >
                        <span className="font-medium text-rose-950">{g.name}</span>
                        <span className="text-stone-700">
                          {show ? (
                            pickedId ? (
                              props.entryNames[pickedId] ?? "—"
                            ) : (
                              <span className="text-stone-400">No pick</span>
                            )
                          ) : (
                            <span className="italic text-stone-400">Hidden</span>
                          )}
                        </span>
                        {show
                          ? pickBadge(st, Boolean(resId))
                          : null}
                      </li>
                    );
                  })}
                  {(() => {
                    const show = canSeeDogPicks(player.participant_id);
                    const pick = bisPickFor(player.participant_id);
                    const resId = props.bisResultId;
                    const pickedId = pick?.dog_entry_id ?? null;
                    const st = dogGroupPickState(pickedId, resId);
                    return (
                      <li className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-amber-50/80 px-3 py-2 text-sm">
                        <span className="font-medium text-rose-950">
                          Best in Show
                        </span>
                        <span className="text-stone-700">
                          {show ? (
                            pickedId ? (
                              props.entryNames[pickedId] ?? "—"
                            ) : (
                              <span className="text-stone-400">No pick</span>
                            )
                          ) : (
                            <span className="italic text-stone-400">Hidden</span>
                          )}
                        </span>
                        {show ? pickBadge(st, Boolean(resId)) : null}
                      </li>
                    );
                  })()}
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wide text-stone-500">
                  Football
                </h4>
                <ul className="space-y-2">
                  {props.games.map((gm) => {
                    const show = canSeeFbPicks(player.participant_id);
                    const pick = fbPickFor(player.participant_id, gm.id);
                    const res = props.gameResults[gm.id];
                    const st = footballPickState(
                      pick?.winner_side ?? null,
                      res ?? null
                    );
                    return (
                      <li
                        key={gm.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-stone-50 px-3 py-2 text-sm"
                      >
                        <span className="font-medium text-rose-950">
                          {gm.away_team} @ {gm.home_team}
                        </span>
                        <span className="text-stone-700">
                          {show ? (
                            pick ? (
                              pick.winner_side === "home"
                                ? gm.home_team
                                : gm.away_team
                            ) : (
                              <span className="text-stone-400">No pick</span>
                            )
                          ) : (
                            <span className="italic text-stone-400">Hidden</span>
                          )}
                        </span>
                        {show ? pickBadge(st, Boolean(res)) : null}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
