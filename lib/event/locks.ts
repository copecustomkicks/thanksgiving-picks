import type { EventRow } from "@/lib/db/types";

export function dogShowLocked(event: EventRow): boolean {
  if (event.dog_show_locked_manual) return true;
  if (!event.dog_show_lock_at) return false;
  return new Date(event.dog_show_lock_at).getTime() <= Date.now();
}

export function footballLocked(event: EventRow): boolean {
  if (event.football_locked_manual) return true;
  if (!event.football_lock_at) return false;
  return new Date(event.football_lock_at).getTime() <= Date.now();
}
