"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/guard";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import {
  SAMPLE_DOG_GROUPS,
  SAMPLE_EVENT,
  SAMPLE_FAMILY_CODE,
  SAMPLE_FOOTBALL_GAMES,
} from "@/lib/seed-data";

async function adminDb() {
  await requireAdmin();
  return createAdminSupabaseClient();
}

export async function createEventAction(input: {
  slug: string;
  title: string;
  year: number;
  familyCode: string;
  bestInShowPoints: number;
}) {
  const db = await adminDb();
  const { data: ev, error } = await db
    .from("events")
    .insert({
      slug: input.slug.trim(),
      title: input.title.trim(),
      year: input.year,
      best_in_show_points: input.bestInShowPoints,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  const { error: sErr } = await db.from("event_secrets").insert({
    event_id: ev.id,
    family_code: input.familyCode.trim(),
  });
  if (sErr) throw new Error(sErr.message);
  revalidatePath("/admin");
  return ev.id as string;
}

export async function updateEventSettingsAction(input: {
  eventId: string;
  bestInShowPoints?: number;
  dogShowLockAt?: string | null;
  footballLockAt?: string | null;
  dogShowLockedManual?: boolean;
  footballLockedManual?: boolean;
}) {
  const db = await adminDb();
  const patch: Record<string, unknown> = {};
  if (input.bestInShowPoints !== undefined)
    patch.best_in_show_points = input.bestInShowPoints;
  if (input.dogShowLockAt !== undefined)
    patch.dog_show_lock_at = input.dogShowLockAt;
  if (input.footballLockAt !== undefined)
    patch.football_lock_at = input.footballLockAt;
  if (input.dogShowLockedManual !== undefined)
    patch.dog_show_locked_manual = input.dogShowLockedManual;
  if (input.footballLockedManual !== undefined)
    patch.football_locked_manual = input.footballLockedManual;

  const { error } = await db.from("events").update(patch).eq("id", input.eventId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
  revalidatePath("/dog-show");
  revalidatePath("/football");
  revalidatePath("/leaderboard");
}

export async function addDogGroupAction(input: {
  eventId: string;
  name: string;
  pointsPerCorrect: number;
}) {
  const db = await adminDb();
  const { count } = await db
    .from("dog_groups")
    .select("*", { count: "exact", head: true })
    .eq("event_id", input.eventId);
  const { error } = await db.from("dog_groups").insert({
    event_id: input.eventId,
    name: input.name.trim(),
    points_per_correct: input.pointsPerCorrect,
    sort_order: (count ?? 0) as number,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/dog-show");
  revalidatePath("/dog-show");
}

export async function updateDogGroupAction(input: {
  id: string;
  name: string;
  pointsPerCorrect: number;
  sortOrder: number;
}) {
  const db = await adminDb();
  const { error } = await db
    .from("dog_groups")
    .update({
      name: input.name.trim(),
      points_per_correct: input.pointsPerCorrect,
      sort_order: input.sortOrder,
    })
    .eq("id", input.id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/dog-show");
  revalidatePath("/dog-show");
}

export async function deleteDogGroupAction(groupId: string) {
  const db = await adminDb();
  const { error } = await db.from("dog_groups").delete().eq("id", groupId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/dog-show");
  revalidatePath("/dog-show");
}

export async function addDogEntryAction(input: {
  groupId: string;
  name: string;
}) {
  const db = await adminDb();
  const { count } = await db
    .from("dog_entries")
    .select("*", { count: "exact", head: true })
    .eq("group_id", input.groupId);
  const { error } = await db.from("dog_entries").insert({
    group_id: input.groupId,
    name: input.name.trim(),
    sort_order: (count ?? 0) as number,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/dog-show");
  revalidatePath("/dog-show");
}

export async function updateDogEntryAction(input: {
  id: string;
  name: string;
  sortOrder: number;
}) {
  const db = await adminDb();
  const { error } = await db
    .from("dog_entries")
    .update({ name: input.name.trim(), sort_order: input.sortOrder })
    .eq("id", input.id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/dog-show");
  revalidatePath("/dog-show");
}

export async function deleteDogEntryAction(entryId: string) {
  const db = await adminDb();
  const { error } = await db.from("dog_entries").delete().eq("id", entryId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/dog-show");
  revalidatePath("/dog-show");
}

export async function addFootballGameAction(input: {
  eventId: string;
  homeTeam: string;
  awayTeam: string;
  gameTime: string | null;
  pointsValue: number;
}) {
  const db = await adminDb();
  const { count } = await db
    .from("football_games")
    .select("*", { count: "exact", head: true })
    .eq("event_id", input.eventId);
  const { error } = await db.from("football_games").insert({
    event_id: input.eventId,
    home_team: input.homeTeam.trim(),
    away_team: input.awayTeam.trim(),
    game_time: input.gameTime || null,
    points_value: input.pointsValue,
    sort_order: (count ?? 0) as number,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/football");
  revalidatePath("/football");
}

export async function updateFootballGameAction(input: {
  id: string;
  homeTeam: string;
  awayTeam: string;
  gameTime: string | null;
  pointsValue: number;
  sortOrder: number;
}) {
  const db = await adminDb();
  const { error } = await db
    .from("football_games")
    .update({
      home_team: input.homeTeam.trim(),
      away_team: input.awayTeam.trim(),
      game_time: input.gameTime || null,
      points_value: input.pointsValue,
      sort_order: input.sortOrder,
    })
    .eq("id", input.id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/football");
  revalidatePath("/football");
}

export async function deleteFootballGameAction(gameId: string) {
  const db = await adminDb();
  const { error } = await db.from("football_games").delete().eq("id", gameId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/football");
  revalidatePath("/football");
}

export async function setDogGroupResultAction(input: {
  groupId: string;
  winningDogEntryId: string | null;
}) {
  const db = await adminDb();
  const { error } = await db.from("dog_group_results").upsert(
    {
      group_id: input.groupId,
      winning_dog_entry_id: input.winningDogEntryId,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "group_id" }
  );
  if (error) throw new Error(error.message);
  revalidatePath("/admin/results");
  revalidatePath("/leaderboard");
  revalidatePath("/dog-show");
}

export async function setBestInShowResultAction(input: {
  eventId: string;
  winningDogEntryId: string | null;
}) {
  const db = await adminDb();
  const { error } = await db.from("dog_best_in_show_results").upsert(
    {
      event_id: input.eventId,
      winning_dog_entry_id: input.winningDogEntryId,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "event_id" }
  );
  if (error) throw new Error(error.message);
  revalidatePath("/admin/results");
  revalidatePath("/leaderboard");
  revalidatePath("/dog-show");
}

export async function setFootballResultAction(input: {
  gameId: string;
  winnerSide: "home" | "away" | null;
}) {
  const db = await adminDb();
  if (input.winnerSide === null) {
    const { error } = await db
      .from("football_results")
      .delete()
      .eq("game_id", input.gameId);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await db.from("football_results").upsert(
      {
        game_id: input.gameId,
        winner_side: input.winnerSide,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "game_id" }
    );
    if (error) throw new Error(error.message);
  }
  revalidatePath("/admin/results");
  revalidatePath("/leaderboard");
  revalidatePath("/football");
}

export async function resetEventAction(input: {
  eventId: string;
  removeStructure: boolean;
}) {
  const db = await adminDb();
  const eventId = input.eventId;

  const { data: games } = await db
    .from("football_games")
    .select("id")
    .eq("event_id", eventId);
  const gameIds = games?.map((g) => g.id) ?? [];
  if (gameIds.length) {
    await db.from("football_results").delete().in("game_id", gameIds);
  }
  await db.from("football_picks").delete().eq("event_id", eventId);

  const { data: groups } = await db
    .from("dog_groups")
    .select("id")
    .eq("event_id", eventId);
  const groupIds = groups?.map((g) => g.id) ?? [];
  if (groupIds.length) {
    await db.from("dog_group_results").delete().in("group_id", groupIds);
  }
  await db.from("dog_best_in_show_results").delete().eq("event_id", eventId);
  await db.from("dog_group_picks").delete().eq("event_id", eventId);
  await db.from("dog_best_in_show_picks").delete().eq("event_id", eventId);

  if (input.removeStructure) {
    await db.from("football_games").delete().eq("event_id", eventId);
    await db.from("dog_groups").delete().eq("event_id", eventId);
  }

  await db
    .from("events")
    .update({
      dog_show_locked_manual: false,
      football_locked_manual: false,
      dog_show_lock_at: null,
      football_lock_at: null,
    })
    .eq("id", eventId);

  revalidatePath("/", "layout");
}

export async function seedSampleDataAction(eventId: string) {
  const db = await adminDb();

  for (const g of SAMPLE_DOG_GROUPS) {
    const { data: grp, error: gErr } = await db
      .from("dog_groups")
      .insert({
        event_id: eventId,
        name: g.name,
        sort_order: g.sort_order,
        points_per_correct: g.points_per_correct,
      })
      .select("id")
      .single();
    if (gErr) throw new Error(gErr.message);
    for (let i = 0; i < g.dogs.length; i++) {
      const { error: dErr } = await db.from("dog_entries").insert({
        group_id: grp.id,
        name: g.dogs[i],
        sort_order: i,
      });
      if (dErr) throw new Error(dErr.message);
    }
  }

  for (const gm of SAMPLE_FOOTBALL_GAMES) {
    const { error: fErr } = await db.from("football_games").insert({
      event_id: eventId,
      home_team: gm.home_team,
      away_team: gm.away_team,
      points_value: gm.points_value,
      sort_order: gm.sort_order,
      game_time: null,
    });
    if (fErr) throw new Error(fErr.message);
  }

  await db
    .from("events")
    .update({ best_in_show_points: SAMPLE_EVENT.best_in_show_points })
    .eq("id", eventId);

  revalidatePath("/", "layout");
}

export async function ensureDemoEventAction() {
  const db = await adminDb();
  const { data: existing } = await db
    .from("events")
    .select("id")
    .eq("slug", SAMPLE_EVENT.slug)
    .maybeSingle();
  if (existing) return existing.id as string;

  const { data: ev, error } = await db
    .from("events")
    .insert({
      slug: SAMPLE_EVENT.slug,
      title: SAMPLE_EVENT.title,
      year: SAMPLE_EVENT.year,
      best_in_show_points: SAMPLE_EVENT.best_in_show_points,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  const { error: sErr } = await db.from("event_secrets").insert({
    event_id: ev.id,
    family_code: SAMPLE_FAMILY_CODE,
  });
  if (sErr) throw new Error(sErr.message);
  revalidatePath("/admin");
  return ev.id as string;
}
