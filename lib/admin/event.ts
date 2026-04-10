import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function resolveAdminEventId(
  eventParam: string | undefined
): Promise<{ eventId: string | null; events: { id: string; slug: string; title: string; year: number }[] }> {
  const db = createAdminSupabaseClient();
  const { data: eventsRaw } = await db
    .from("events")
    .select("id, slug, title, year")
    .order("year", { ascending: false });

  const events = eventsRaw ?? [];

  if (eventParam) {
    const found = events.find((e) => e.id === eventParam);
    if (found) return { eventId: found.id, events };
  }

  const first = events[0];
  return { eventId: first?.id ?? null, events };
}
