import { resetEventAction } from "@/app/admin/actions";
import { resolveAdminEventId } from "@/lib/admin/event";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import Link from "next/link";

export default async function AdminResetPage({
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-rose-950">Reset event</h2>
        <p className="text-sm text-stone-600">
          Clears picks and results so you can run a fresh game. Optionally remove
          dog groups and games too.
        </p>
      </div>

      <Card className="space-y-4 border-red-200 bg-red-50/40">
        <form
          action={async (fd: FormData) => {
            "use server";
            await resetEventAction({
              eventId: String(fd.get("eventId")),
              removeStructure: fd.get("structure") === "on",
            });
          }}
          className="space-y-4"
        >
          <input type="hidden" name="eventId" value={eventId} />
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" name="structure" className="mt-1" />
            <span>
              Also delete dog groups, dogs, and football games (full structure
              reset).
            </span>
          </label>
          <Button type="submit" variant="danger">
            Reset this event
          </Button>
        </form>
      </Card>

      <p className="text-xs text-stone-500">
        Switch event:{" "}
        {events.map((e) => (
          <Link
            key={e.id}
            href={`/admin/reset?event=${e.id}`}
            className="mr-2 font-semibold text-rose-800 underline"
          >
            {e.slug}
          </Link>
        ))}
      </p>
    </div>
  );
}
