export type RankedRow<T> = T & { rank: number; rankLabel: string };

/** Competition ranking: 1, 1, 3 when scores tie. */
export function withCompetitionRanks<T extends { total_points: number }>(
  rows: T[]
): RankedRow<T>[] {
  const sorted = [...rows].sort((a, b) => {
    if (b.total_points !== a.total_points) return b.total_points - a.total_points;
    return 0;
  });

  const out: RankedRow<T>[] = [];
  let rank = 1;

  for (let i = 0; i < sorted.length; i++) {
    const row = sorted[i];
    if (i > 0 && row.total_points !== sorted[i - 1]!.total_points) {
      rank = i + 1;
    }
    const tieCount = sorted.filter(
      (r) => r.total_points === row.total_points
    ).length;
    const rankLabel = tieCount > 1 ? `T-${rank}` : String(rank);
    out.push({ ...row, rank, rankLabel });
  }

  return out;
}
