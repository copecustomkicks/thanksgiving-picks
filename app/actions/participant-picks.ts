"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";

async function getUserId() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function saveDogGroupPickAction(input: {
  eventId: string;
  groupId: string;
  dogEntryId: string | null;
}) {
  const { supabase, user } = await getUserId();
  if (!user) throw new Error("Not signed in");

  const { error } = await supabase.from("dog_group_picks").upsert(
    {
      event_id: input.eventId,
      participant_id: user.id,
      group_id: input.groupId,
      dog_entry_id: input.dogEntryId,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "participant_id,group_id" }
  );
  if (error) throw new Error(error.message);
  revalidatePath("/dog-show");
  revalidatePath("/leaderboard");
}

export async function saveBestInShowPickAction(input: {
  eventId: string;
  dogEntryId: string | null;
}) {
  const { supabase, user } = await getUserId();
  if (!user) throw new Error("Not signed in");

  const { error } = await supabase.from("dog_best_in_show_picks").upsert(
    {
      event_id: input.eventId,
      participant_id: user.id,
      dog_entry_id: input.dogEntryId,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "participant_id,event_id" }
  );
  if (error) throw new Error(error.message);
  revalidatePath("/dog-show");
  revalidatePath("/leaderboard");
}

export async function saveFootballPickAction(input: {
  eventId: string;
  gameId: string;
  winnerSide: "home" | "away";
}) {
  const { supabase, user } = await getUserId();
  if (!user) throw new Error("Not signed in");

  const { error } = await supabase.from("football_picks").upsert(
    {
      event_id: input.eventId,
      participant_id: user.id,
      game_id: input.gameId,
      winner_side: input.winnerSide,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "participant_id,game_id" }
  );
  if (error) throw new Error(error.message);
  revalidatePath("/football");
  revalidatePath("/leaderboard");
}
