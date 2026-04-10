export type PickState = "pending" | "correct" | "incorrect";

export function dogGroupPickState(
  pickedId: string | null,
  resultWinnerId: string | null | undefined
): PickState {
  if (!pickedId) return "pending";
  if (!resultWinnerId) return "pending";
  return pickedId === resultWinnerId ? "correct" : "incorrect";
}

export function footballPickState(
  picked: "home" | "away" | null,
  result: "home" | "away" | null | undefined
): PickState {
  if (!picked) return "pending";
  if (!result) return "pending";
  return picked === result ? "correct" : "incorrect";
}
