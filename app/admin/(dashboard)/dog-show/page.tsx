import {
  addDogEntryAction,
  addDogGroupAction,
  deleteDogEntryAction,
  deleteDogGroupAction,
  updateDogEntryAction,
  updateDogGroupAction,
} from "@/app/admin/actions";
import { resolveAdminEventId } from "@/lib/admin/event";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import Link from "next/link";

export default async function AdminDogShowPage({
  searchParams,
}: {
  searchParams: Promise<{ event?: string }>;
}) {
  const sp = await searchParams;
  const { eventId, events } = await resolveAdminEventId(sp.event);

  if (!eventId) {
    return (
      <p className="text-stone-600">
        Create an event on the{" "}
        <Link href="/admin" className="font-semibold text-rose-800 underline">
          overview
        </Link>{" "}
        first.
      </p>
    );
  }

  const db = createAdminSupabaseClient();
  const { data: groupsData } = await db
    .from("dog_groups")
    .select("*")
    .eq("event_id", eventId)
    .order("sort_order", { ascending: true });

  const groups = groupsData ?? [];
  const groupIds = groups.map((g) => g.id);
  const { data: entriesRaw } =
    groupIds.length > 0
      ? await db.from("dog_entries").select("*").in("group_id", groupIds)
      : { data: [] as { id: string; group_id: string; name: string; sort_order: number }[] };

  const entries = entriesRaw ?? [];

  const entriesByGroup = new Map<string, typeof entries>();
  for (const e of entries) {
    const list = entriesByGroup.get(e.group_id) ?? [];
    list.push(e);
    entriesByGroup.set(e.group_id, list);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-rose-950">Dog show setup</h2>
        <p className="text-sm text-stone-600">
          Groups, breeds, and points per correct group pick.
        </p>
      </div>

      <Card className="space-y-3">
        <h3 className="font-bold text-rose-950">Add group</h3>
        <form
          action={async (fd: FormData) => {
            "use server";
            await addDogGroupAction({
              eventId: String(fd.get("eventId")),
              name: String(fd.get("name")),
              pointsPerCorrect: Number(fd.get("points") ?? 1),
            });
          }}
          className="flex flex-wrap items-end gap-2"
        >
          <input type="hidden" name="eventId" value={eventId} />
          <Input name="name" required placeholder="Group name" className="max-w-xs" />
          <Input
            name="points"
            type="number"
            defaultValue={1}
            className="w-24"
            title="Points"
          />
          <Button type="submit" variant="primary">
            Add
          </Button>
        </form>
      </Card>

      {groups.map((g) => {
        const dogs = (entriesByGroup.get(g.id) ?? []).sort(
          (a, b) => a.sort_order - b.sort_order
        );
        return (
          <Card key={g.id} className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <form
                action={async (fd: FormData) => {
                  "use server";
                  await updateDogGroupAction({
                    id: String(fd.get("id")),
                    name: String(fd.get("name")),
                    pointsPerCorrect: Number(fd.get("points")),
                    sortOrder: Number(fd.get("sort")),
                  });
                }}
                className="flex flex-1 flex-wrap items-end gap-2"
              >
                <input type="hidden" name="id" value={g.id} />
                <div className="space-y-1">
                  <label className="text-xs font-medium text-stone-500">Name</label>
                  <Input name="name" defaultValue={g.name} required />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-stone-500">Pts</label>
                  <Input
                    name="points"
                    type="number"
                    defaultValue={g.points_per_correct}
                    className="w-20"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-stone-500">Order</label>
                  <Input
                    name="sort"
                    type="number"
                    defaultValue={g.sort_order}
                    className="w-20"
                  />
                </div>
                <Button type="submit" variant="secondary">
                  Save group
                </Button>
              </form>
              <form
                action={async () => {
                  "use server";
                  await deleteDogGroupAction(g.id);
                }}
              >
                <Button type="submit" variant="danger">
                  Delete group
                </Button>
              </form>
            </div>

            <div className="space-y-2 border-t border-stone-100 pt-3">
              <h4 className="text-sm font-semibold text-stone-700">Breeds / dogs</h4>
              <ul className="space-y-2">
                {dogs.map((d) => (
                  <li
                    key={d.id}
                    className="flex flex-wrap items-end gap-2 rounded-lg bg-stone-50 px-2 py-2"
                  >
                    <form
                      action={async (fd: FormData) => {
                        "use server";
                        await updateDogEntryAction({
                          id: String(fd.get("id")),
                          name: String(fd.get("name")),
                          sortOrder: Number(fd.get("sort")),
                        });
                      }}
                      className="flex flex-1 flex-wrap items-end gap-2"
                    >
                      <input type="hidden" name="id" value={d.id} />
                      <Input name="name" defaultValue={d.name} required className="min-w-[12rem] flex-1" />
                      <Input
                        name="sort"
                        type="number"
                        defaultValue={d.sort_order}
                        className="w-20"
                      />
                      <Button type="submit" variant="secondary">
                        Save
                      </Button>
                    </form>
                    <form
                      action={async () => {
                        "use server";
                        await deleteDogEntryAction(d.id);
                      }}
                    >
                      <Button type="submit" variant="ghost" className="text-red-700">
                        Remove
                      </Button>
                    </form>
                  </li>
                ))}
              </ul>
              <form
                action={async (fd: FormData) => {
                  "use server";
                  await addDogEntryAction({
                    groupId: String(fd.get("groupId")),
                    name: String(fd.get("name")),
                  });
                }}
                className="flex flex-wrap items-end gap-2"
              >
                <input type="hidden" name="groupId" value={g.id} />
                <Input name="name" required placeholder="New breed name" className="max-w-sm" />
                <Button type="submit" variant="primary">
                  Add dog
                </Button>
              </form>
            </div>
          </Card>
        );
      })}

      <p className="text-xs text-stone-500">
        Switch event:{" "}
        {events.map((e) => (
          <Link
            key={e.id}
            href={`/admin/dog-show?event=${e.id}`}
            className="mr-2 font-semibold text-rose-800 underline"
          >
            {e.slug}
          </Link>
        ))}
      </p>
    </div>
  );
}
