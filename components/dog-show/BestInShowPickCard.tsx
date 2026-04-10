"use client";

import { useTransition } from "react";
import { saveBestInShowPickAction } from "@/app/actions/participant-picks";
import type { DogEntryRow } from "@/lib/db/types";
import { dogGroupPickState } from "@/lib/scoring/compute";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";

export type BisOption = DogEntryRow & { group_name: string };

type Props = {
  eventId: string;
  options: BisOption[];
  locked: boolean;
  myPickId: string | null;
  resultWinnerId: string | null | undefined;
  bisPoints: number;
};

export function BestInShowPickCard({
  eventId,
  options,
  locked,
  myPickId,
  resultWinnerId,
  bisPoints,
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
      : "Choose Best in Show";

  async function onPick(value: string) {
    const id = value === "" ? null : value;
    start(async () => {
      await saveBestInShowPickAction({ eventId, dogEntryId: id });
    });
  }

  const sorted = [...options].sort((a, b) => {
    const g = a.group_name.localeCompare(b.group_name);
    if (g !== 0) return g;
    return a.sort_order - b.sort_order;
  });

  return (
    <Card className="space-y-3 border-rose-900/20 bg-amber-50/40">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold text-rose-950">Best in Show</h2>
          <p className="text-sm text-stone-600">{bisPoints} pts if correct</p>
        </div>
        <Badge variant={statusVariant}>{statusLabel}</Badge>
      </div>

      <Select
        disabled={locked || pending}
        value={myPickId ?? ""}
        onChange={(e) => void onPick(e.target.value)}
        aria-label="Best in Show pick"
      >
        <option value="">Select overall winner…</option>
        {sorted.map((d) => (
          <option key={d.id} value={d.id}>
            {d.name} ({d.group_name})
          </option>
        ))}
      </Select>

      {resultWinnerId ? (
        <p className="text-sm text-stone-700">
          Official Best in Show:{" "}
          <span className="font-semibold text-rose-950">
            {options.find((e) => e.id === resultWinnerId)?.name ?? "—"}
          </span>
        </p>
      ) : null}
    </Card>
  );
}
