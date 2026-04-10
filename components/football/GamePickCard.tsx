"use client";

import { useTransition } from "react";
import { saveFootballPickAction } from "@/app/actions/participant-picks";
import type { FootballGameRow } from "@/lib/db/types";
import { footballPickState } from "@/lib/scoring/compute";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

type Props = {
  eventId: string;
  game: FootballGameRow;
  locked: boolean;
  myPick: "home" | "away" | null;
  result: "home" | "away" | null | undefined;
};

export function GamePickCard({
  eventId,
  game,
  locked,
  myPick,
  result,
}: Props) {
  const [pending, start] = useTransition();
  const state = footballPickState(myPick, result ?? null);

  const statusVariant =
    locked && !result
      ? ("locked" as const)
      : !myPick && !locked
        ? ("pending" as const)
        : result
          ? state === "correct"
            ? ("correct" as const)
            : state === "incorrect"
              ? ("incorrect" as const)
              : ("pending" as const)
          : ("pending" as const);

  const statusLabel = locked
    ? result
      ? state === "correct"
        ? "Correct"
        : state === "incorrect"
          ? "Incorrect"
          : "Pending"
      : "Locked"
    : myPick
      ? "Pick saved"
      : "Pick a winner";

  function pick(side: "home" | "away") {
    if (locked || pending) return;
    start(async () => {
      await saveFootballPickAction({ eventId, gameId: game.id, winnerSide: side });
    });
  }

  const winnerName =
    result === "home" ? game.home_team : result === "away" ? game.away_team : null;

  return (
    <Card className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
            {game.game_time
              ? new Date(game.game_time).toLocaleString(undefined, {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })
              : "Kickoff TBA"}
          </p>
          <h2 className="text-lg font-bold text-rose-950">
            {game.away_team} @ {game.home_team}
          </h2>
          <p className="text-sm text-stone-600">{game.points_value} pts</p>
        </div>
        <Badge variant={statusVariant}>{statusLabel}</Badge>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant={myPick === "home" ? "primary" : "secondary"}
          disabled={locked || pending}
          onClick={() => pick("home")}
          className="py-3 text-base"
        >
          {game.home_team}
        </Button>
        <Button
          type="button"
          variant={myPick === "away" ? "primary" : "secondary"}
          disabled={locked || pending}
          onClick={() => pick("away")}
          className="py-3 text-base"
        >
          {game.away_team}
        </Button>
      </div>

      {result ? (
        <p className="text-sm text-stone-700">
          Final: <span className="font-semibold text-rose-950">{winnerName}</span>
        </p>
      ) : null}
    </Card>
  );
}
