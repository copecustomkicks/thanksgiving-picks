import { updateEventSettingsAction } from "@/app/admin/actions";
import { resolveAdminEventId } from "@/lib/admin/event";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import Link from "next/link";

export default async function AdminLocksPage({
  searchParams,
}: {
  searchParams: Promise<{ event?: string }>;
}) {
  const sp = await searchParams;
  const { eventId, events } = await resolveAdminEventId(sp.event);

  if (!eventId) {
    return (
      <p className="text-stone-600">
        <Link href="/admin" className="font-semibold text-rose-800 underline">
          Pick an event
        </Link>{" "}
        first.
      </p>
    );
  }

  const db = createAdminSupabaseClient();
  const { data: event } = await db
    .from("events")
    .select("*")
    .eq("id", eventId)
    .single();

  if (!event) return <p className="text-red-700">Event not found.</p>;

  const dogLockLocal = event.dog_show_lock_at
    ? new Date(event.dog_show_lock_at).toISOString().slice(0, 16)
    : "";
  const fbLockLocal = event.football_lock_at
    ? new Date(event.football_lock_at).toISOString().slice(0, 16)
    : "";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-rose-950">Locks &amp; scoring</h2>
        <p className="text-sm text-stone-600">
          Schedule automatic locks or flip manual overrides. Empty time = no auto
          lock.
        </p>
      </div>

      <Card className="space-y-4">
        <form
          action={async (fd: FormData) => {
            "use server";
            const dogAt = String(fd.get("dogAt") || "");
            const fbAt = String(fd.get("fbAt") || "");
            await updateEventSettingsAction({
              eventId: String(fd.get("eventId")),
              bestInShowPoints: Number(fd.get("bis")),
              dogShowLockAt: dogAt ? new Date(dogAt).toISOString() : null,
              footballLockAt: fbAt ? new Date(fbAt).toISOString() : null,
              dogShowLockedManual: fd.get("dogManual") === "on",
              footballLockedManual: fd.get("fbManual") === "on",
            });
          }}
          className="space-y-4"
        >
          <input type="hidden" name="eventId" value={eventId} />

          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="bis">
              Best in Show points
            </label>
            <Input
              id="bis"
              name="bis"
              type="number"
              defaultValue={event.best_in_show_points}
              required
            />
          </div>

          <fieldset className="space-y-2 rounded-xl border border-stone-200 p-3">
            <legend className="font-semibold text-rose-950">Dog show</legend>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="dogManual"
                defaultChecked={event.dog_show_locked_manual}
              />
              Manually locked now
            </label>
            <label className="block text-sm font-medium text-stone-700">
              Auto-lock at (local time)
              <Input
                name="dogAt"
                type="datetime-local"
                defaultValue={dogLockLocal}
                className="mt-1"
              />
            </label>
          </fieldset>

          <fieldset className="space-y-2 rounded-xl border border-stone-200 p-3">
            <legend className="font-semibold text-rose-950">Football</legend>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="fbManual"
                defaultChecked={event.football_locked_manual}
              />
              Manually locked now
            </label>
            <label className="block text-sm font-medium text-stone-700">
              Auto-lock at (local time)
              <Input
                name="fbAt"
                type="datetime-local"
                defaultValue={fbLockLocal}
                className="mt-1"
              />
            </label>
          </fieldset>

          <Button type="submit" variant="primary">
            Save settings
          </Button>
        </form>
      </Card>

      <p className="text-xs text-stone-500">
        Switch event:{" "}
        {events.map((e) => (
          <Link
            key={e.id}
            href={`/admin/locks?event=${e.id}`}
            className="mr-2 font-semibold text-rose-800 underline"
          >
            {e.slug}
          </Link>
        ))}
      </p>
    </div>
  );
}
