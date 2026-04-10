import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getEventIdFromCookie } from "@/lib/event/server";
import { JoinClient } from "./JoinClient";

export default async function JoinPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const eventId = await getEventIdFromCookie();

  if (user && eventId) {
    redirect("/dog-show");
  }

  const defaultSlug =
    process.env.NEXT_PUBLIC_DEFAULT_EVENT_SLUG ?? "thanksgiving-2026";

  return <JoinClient defaultSlug={defaultSlug} />;
}
