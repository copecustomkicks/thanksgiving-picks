"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export function RefreshOnRealtime({ eventId }: { eventId: string }) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    const channel = supabase.channel(`refresh-${eventId}`);
    const bump = () => router.refresh();

    const watch = (
      table: string,
      filter?: string
    ) => {
      channel.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table,
          ...(filter ? { filter } : {}),
        },
        bump
      );
    };

    watch("events", `id=eq.${eventId}`);
    watch("dog_groups", `event_id=eq.${eventId}`);
    watch("dog_entries");
    watch("dog_group_picks", `event_id=eq.${eventId}`);
    watch("dog_best_in_show_picks", `event_id=eq.${eventId}`);
    watch("dog_group_results");
    watch("dog_best_in_show_results", `event_id=eq.${eventId}`);
    watch("football_games", `event_id=eq.${eventId}`);
    watch("football_picks", `event_id=eq.${eventId}`);
    watch("football_results");
    watch("event_participants", `event_id=eq.${eventId}`);
    watch("profiles");

    channel.subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [eventId, router]);

  return null;
}
