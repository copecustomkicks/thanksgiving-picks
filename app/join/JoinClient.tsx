"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { joinEventAction } from "@/app/actions/join";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

type Props = { defaultSlug: string };

export function JoinClient({ defaultSlug }: Props) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [familyCode, setFamilyCode] = useState("");
  const [eventSlug, setEventSlug] = useState(defaultSlug);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const supabase = createBrowserSupabaseClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        const { error: anonErr } = await supabase.auth.signInAnonymously();
        if (anonErr) {
          if (!cancelled) setError(anonErr.message);
          return;
        }
      }
      if (!cancelled) setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const res = await joinEventAction({
        displayName,
        familyCode,
        eventSlug,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.push("/dog-show");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-full max-w-lg flex-1 flex-col justify-center px-4 py-10">
      <Card className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-rose-950">Join the game</h1>
          <p className="mt-1 text-sm text-stone-600">
            Enter your name and the family code your host shared.
          </p>
        </div>

        {!ready ? (
          <p className="text-sm text-stone-600">Getting you signed in…</p>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-rose-950" htmlFor="name">
                Display name
              </label>
              <Input
                id="name"
                required
                autoComplete="nickname"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Uncle Mike"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-rose-950" htmlFor="code">
                Family code
              </label>
              <Input
                id="code"
                required
                value={familyCode}
                onChange={(e) => setFamilyCode(e.target.value)}
                placeholder="From your host"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-rose-950" htmlFor="slug">
                Event
              </label>
              <Input
                id="slug"
                required
                value={eventSlug}
                onChange={(e) => setEventSlug(e.target.value)}
                placeholder="thanksgiving-2026"
              />
              <p className="text-xs text-stone-500">
                Slug for this year&apos;s event (admin sets this).
              </p>
            </div>
            {error ? (
              <p className="text-sm font-medium text-red-700" role="alert">
                {error}
              </p>
            ) : null}
            <Button
              type="submit"
              variant="primary"
              className="w-full py-3 text-base"
              disabled={pending}
            >
              {pending ? "Joining…" : "Enter game"}
            </Button>
          </form>
        )}
      </Card>
    </main>
  );
}
