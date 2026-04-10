"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(typeof j.error === "string" ? j.error : "Login failed");
        return;
      }
      router.push("/admin");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-full max-w-md flex-1 flex-col justify-center px-4 py-12">
      <Card className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-rose-950">Admin login</h1>
          <p className="mt-1 text-sm text-stone-600">
            Enter the admin password configured on the server.
          </p>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="pw">
              Password
            </label>
            <Input
              id="pw"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error ? (
            <p className="text-sm font-medium text-red-700" role="alert">
              {error}
            </p>
          ) : null}
          <Button
            type="submit"
            variant="primary"
            className="w-full"
            disabled={pending}
          >
            {pending ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </Card>
    </main>
  );
}
