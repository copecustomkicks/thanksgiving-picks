import {
  createEventAction,
  ensureDemoEventAction,
  seedSampleDataAction,
} from "@/app/admin/actions";
import { resolveAdminEventId } from "@/lib/admin/event";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { SAMPLE_FAMILY_CODE } from "@/lib/seed-data";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import Link from "next/link";

export default async function AdminOverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ event?: string }>;
}) {
  const sp = await searchParams;
  const { events, eventId } = await resolveAdminEventId(sp.event);

  const db = createAdminSupabaseClient();
  let familyHint: string | null = null;
  if (eventId) {
    const { data: sec } = await db
      .from("event_secrets")
      .select("family_code")
      .eq("event_id", eventId)
      .maybeSingle();
    familyHint = sec?.family_code ?? null;
  }

  return (
    <div className="space-y-8">
      <Card className="space-y-4">
        <h2 className="text-lg font-bold text-rose-950">Events</h2>
        {events.length === 0 ? (
          <p className="text-sm text-stone-600">
            No events yet. Create one below or load the demo event.
          </p>
        ) : (
          <ul className="space-y-2">
            {events.map((e) => (
              <li
                key={e.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-stone-50 px-3 py-2"
              >
                <div>
                  <p className="font-semibold text-rose-950">{e.title}</p>
                  <p className="text-xs text-stone-500">
                    {e.year} · slug <code className="font-mono">{e.slug}</code>
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    className="text-sm font-semibold text-rose-800 underline"
                    href={`/admin/dog-show?event=${e.id}`}
                  >
                    Dog show
                  </Link>
                  <Link
                    className="text-sm font-semibold text-rose-800 underline"
                    href={`/admin/football?event=${e.id}`}
                  >
                    Football
                  </Link>
                  <Link
                    className="text-sm font-semibold text-rose-800 underline"
                    href={`/admin/locks?event=${e.id}`}
                  >
                    Locks
                  </Link>
                  <Link
                    className="text-sm font-semibold text-rose-800 underline"
                    href={`/admin/results?event=${e.id}`}
                  >
                    Results
                  </Link>
                  <Link
                    className="text-sm font-semibold text-rose-800 underline"
                    href={`/admin/reset?event=${e.id}`}
                  >
                    Reset
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
        {eventId && familyHint ? (
          <p className="text-sm text-stone-600">
            Family code for this event (share carefully):{" "}
            <span className="font-mono font-semibold text-rose-950">
              {familyHint}
            </span>
          </p>
        ) : null}
      </Card>

      <Card className="space-y-4">
        <h2 className="text-lg font-bold text-rose-950">Quick start</h2>
        <p className="text-sm text-stone-600">
          Demo event slug <code className="font-mono">thanksgiving-2026</code>{" "}
          with sample code{" "}
          <code className="font-mono">{SAMPLE_FAMILY_CODE}</code> (change the
          secret in production).
        </p>
        <div className="flex flex-wrap gap-2">
          <form
            action={async () => {
              "use server";
              await ensureDemoEventAction();
            }}
          >
            <Button type="submit" variant="secondary">
              Ensure demo event
            </Button>
          </form>
          {eventId ? (
            <form
              action={async (fd: FormData) => {
                "use server";
                await seedSampleDataAction(String(fd.get("seedEventId")));
              }}
            >
              <input type="hidden" name="seedEventId" value={eventId} />
              <Button type="submit" variant="primary">
                Seed sample dogs &amp; games
              </Button>
            </form>
          ) : null}
        </div>
      </Card>

      <Card className="space-y-4">
        <h2 className="text-lg font-bold text-rose-950">Create event</h2>
        <form
          action={async (fd: FormData) => {
            "use server";
            const slug = String(fd.get("slug") ?? "");
            const title = String(fd.get("title") ?? "");
            const year = Number(fd.get("year") ?? new Date().getFullYear());
            const familyCode = String(fd.get("familyCode") ?? "");
            const bis = Number(fd.get("bis") ?? 5);
            await createEventAction({
              slug,
              title,
              year,
              familyCode,
              bestInShowPoints: bis,
            });
          }}
          className="grid gap-3 md:grid-cols-2"
        >
          <div className="space-y-1 md:col-span-2">
            <label className="text-sm font-medium" htmlFor="title">
              Title
            </label>
            <Input id="title" name="title" required placeholder="Thanksgiving 2027" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="slug">
              Slug
            </label>
            <Input id="slug" name="slug" required placeholder="thanksgiving-2027" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="year">
              Year
            </label>
            <Input
              id="year"
              name="year"
              type="number"
              required
              defaultValue={new Date().getFullYear()}
            />
          </div>
          <div className="space-y-1 md:col-span-2">
            <label className="text-sm font-medium" htmlFor="fc">
              Family code
            </label>
            <Input id="fc" name="familyCode" required placeholder="shared with family" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="bis">
              Best in Show points
            </label>
            <Input id="bis" name="bis" type="number" defaultValue={5} required />
          </div>
          <div className="flex items-end md:col-span-2">
            <Button type="submit" variant="primary">
              Create event
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
