"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { EVENT_COOKIE_NAME } from "@/lib/constants";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export type JoinResult =
  | { ok: true; eventId: string }
  | { ok: false; error: string };

export async function joinEventAction(input: {
  displayName: string;
  familyCode: string;
  eventSlug: string;
}): Promise<JoinResult> {
  const name = input.displayName.trim();
  const code = input.familyCode.trim();
  const slug = input.eventSlug.trim();
  if (!name || !code || !slug) {
    return { ok: false, error: "Please fill in all fields." };
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Sign in failed. Refresh and try again." };
  }

  const admin = createAdminSupabaseClient();
  const { data: event, error: evErr } = await admin
    .from("events")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (evErr || !event) {
    return { ok: false, error: "Event not found." };
  }

  const { data: secret, error: secErr } = await admin
    .from("event_secrets")
    .select("family_code")
    .eq("event_id", event.id)
    .maybeSingle();
  if (secErr || !secret || secret.family_code !== code) {
    return { ok: false, error: "Invalid family code." };
  }

  const { error: profErr } = await supabase
    .from("profiles")
    .upsert({ id: user.id, display_name: name }, { onConflict: "id" });
  if (profErr) {
    return { ok: false, error: profErr.message };
  }

  const { error: partErr } = await supabase.from("event_participants").upsert(
    { event_id: event.id, user_id: user.id },
    { onConflict: "event_id,user_id" }
  );
  if (partErr) {
    return { ok: false, error: partErr.message };
  }

  const jar = await cookies();
  jar.set(EVENT_COOKIE_NAME, event.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 400,
  });

  revalidatePath("/", "layout");
  return { ok: true, eventId: event.id };
}
