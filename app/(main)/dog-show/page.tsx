import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getEventById, getEventIdFromCookie } from "@/lib/event/server";
import { dogShowLocked } from "@/lib/event/locks";
import { BestInShowPickCard } from "@/components/dog-show/BestInShowPickCard";
import { DogGroupPickCard } from "@/components/dog-show/DogGroupPickCard";
import { Badge } from "@/components/ui/Badge";

export default async function DogShowPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const eventId = await getEventIdFromCookie();
  if (!eventId) return null;

  const event = await getEventById(eventId);
  if (!event) return null;

  const locked = dogShowLocked(event);

  const { data: groupsData } = await supabase
    .from("dog_groups")
    .select("*")
    .eq("event_id", eventId)
    .order("sort_order", { ascending: true });

  const groups = groupsData ?? [];
  const groupIds = groups.map((g) => g.id);
  const { data: entriesRaw } =
    groupIds.length > 0
      ? await supabase
          .from("dog_entries")
          .select("*")
          .in("group_id", groupIds)
          .order("sort_order", { ascending: true })
      : { data: [] as { id: string; group_id: string; name: string; sort_order: number }[] };

  const entries = entriesRaw ?? [];

  const { data: groupPicksRaw } = await supabase
    .from("dog_group_picks")
    .select("group_id, dog_entry_id, participant_id")
    .eq("event_id", eventId);

  const groupPicks = groupPicksRaw ?? [];

  const { data: groupResultsRaw } =
    groupIds.length > 0
      ? await supabase
          .from("dog_group_results")
          .select("group_id, winning_dog_entry_id")
          .in("group_id", groupIds)
      : { data: [] as { group_id: string; winning_dog_entry_id: string | null }[] };

  const groupResults = groupResultsRaw ?? [];

  const { data: bisResult } = await supabase
    .from("dog_best_in_show_results")
    .select("winning_dog_entry_id")
    .eq("event_id", eventId)
    .maybeSingle();

  const { data: bisPick } = await supabase
    .from("dog_best_in_show_picks")
    .select("dog_entry_id")
    .eq("event_id", eventId)
    .eq("participant_id", user.id)
    .maybeSingle();

  const resultByGroup = Object.fromEntries(
    groupResults.map((r) => [r.group_id, r.winning_dog_entry_id])
  );

  const entriesByGroup = new Map<string, typeof entries>();
  for (const e of entries) {
    const list = entriesByGroup.get(e.group_id) ?? [];
    list.push(e);
    entriesByGroup.set(e.group_id, list);
  }

  const groupNameById = Object.fromEntries(groups.map((g) => [g.id, g.name]));

  const bisOptions = entries.map((e) => ({
    ...e,
    group_name: groupNameById[e.group_id] ?? "",
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-2xl font-bold text-rose-950">Dog show picks</h2>
          <p className="text-sm text-stone-600">
            One winner per group plus Best in Show.
          </p>
        </div>
        <Badge variant={locked ? "locked" : "pending"}>
          {locked ? "Locked" : "Open"}
        </Badge>
      </div>

      {groups.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-amber-900/20 bg-white/60 px-4 py-8 text-center text-stone-600">
          The host hasn&apos;t published dog groups yet. Check back soon.
        </p>
      ) : (
        <div className="space-y-4">
          {groups.map((g) => {
            const my = groupPicks.find(
              (p) => p.group_id === g.id && p.participant_id === user.id
            );
            return (
              <DogGroupPickCard
                key={g.id}
                eventId={eventId}
                group={g}
                entries={entriesByGroup.get(g.id) ?? []}
                locked={locked}
                myPickId={my?.dog_entry_id ?? null}
                resultWinnerId={resultByGroup[g.id]}
              />
            );
          })}
          <BestInShowPickCard
            eventId={eventId}
            options={bisOptions}
            locked={locked}
            myPickId={bisPick?.dog_entry_id ?? null}
            resultWinnerId={bisResult?.winning_dog_entry_id}
            bisPoints={event.best_in_show_points}
          />
        </div>
      )}
    </div>
  );
}
