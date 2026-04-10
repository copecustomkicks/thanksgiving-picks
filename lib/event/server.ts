import { cookies } from "next/headers";
import { EVENT_COOKIE_NAME } from "@/lib/constants";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { EventRow } from "@/lib/db/types";

export async function getEventIdFromCookie(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(EVENT_COOKIE_NAME)?.value ?? null;
}

export async function getEventById(id: string): Promise<EventRow | null> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return data as EventRow;
}

export async function resolveDefaultEvent(): Promise<EventRow | null> {
  const supabase = await createServerSupabaseClient();
  const slug = process.env.NEXT_PUBLIC_DEFAULT_EVENT_SLUG;
  if (slug) {
    const { data } = await supabase
      .from("events")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();
    if (data) return data as EventRow;
  }
  const { data } = await supabase
    .from("events")
    .select("*")
    .order("year", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as EventRow) ?? null;
}
