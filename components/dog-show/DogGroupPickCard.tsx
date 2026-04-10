"use client";

import { useTransition } from "react";
import { saveDogGroupPickAction } from "@/app/actions/participant-picks";
import type { DogEntryRow, DogGroupRow } from "@/lib/db/types";
import { dogGroupPickState } from "@/lib/scoring/compute";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";

type Props = {
  eventId: string;
  group: DogGroupRow;
  entries: DogEntryRow[];
  locked: boolean;
  myPickId: string | null;
  resultWinnerId: string | null | undefined;
};

export function DogGroupPickCard({
  eventId,
  group,
  entries,
  locked,
  myPickId,
  resultWinnerId,
}: Props) {
  const [pending, start] = useTransition();
  const state = dogGroupPickState(myPickId, resultWinnerId ?? null);

  const statusVariant =
    locked && !resultWinnerId
      ? ("locked" as const)
      : !myPickId && !locked
        ? ("pending" as const)
        : resultWinnerId
          ? state === "correct"
            ? ("correct" as const)
            : state === "incorrect"
              ? ("incorrect" as const)
              : ("pending" as const)
          : ("pending" as const);

  const statusLabel = locked
    ? resultWinnerId
      ? state === "correct"
        ? "Correct"
        : state === "incorrect"
          ? "Incorrect"
          : "Pending result"
      : "Locked"
    : myPickId
      ? "Pick saved"
      : "Choose a winner";

  async function onPick(value: string) {
    const id = value === "" ? null : value;
    start(async () => {
      await saveDogGroupPickAction({
        eventId,
        groupId: group.id,
        dogEntryId: id,
      });
    });
  }

  const sorted = [...entries].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <Card className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold text-rose-950">{group.name}</h2>
          <p className="text-sm text-stone-600">
            {group.points_per_correct} pts if correct
          </p>
        </div>
        <Badge variant={statusVariant}>{statusLabel}</Badge>
      </div>

      <Select
        disabled={locked || pending}
        value={myPickId ?? ""}
        onChange={(e) => void onPick(e.target.value)}
        aria-label={`Pick for ${group.name}`}
      >
        <option value="">Select breed…</option>
        {sorted.map((d) => (
          <option key={d.id} value={d.id}>
            {d.name}
          </option>
        ))}
      </Select>

      {resultWinnerId ? (
        <p className="text-sm text-stone-700">
          Official winner:{" "}
          <span className="font-semibold text-rose-950">
            {entries.find((e) => e.id === resultWinnerId)?.name ?? "—"}
          </span>
        </p>
      ) : null}
    </Card>
  );
}
