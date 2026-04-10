/**
 * Idempotent seed: creates demo event + secret if missing, then dog groups / entries
 * and football games only when no dog groups exist for that event.
 *
 * Usage (from project root, with env loaded):
 *   npx dotenv -e .env.local -- node scripts/seed.mjs
 * Or set vars in the shell, then:
 *   node scripts/seed.mjs
 */

import { createClient } from "@supabase/supabase-js";

const SAMPLE_EVENT = {
  slug: process.env.SEED_EVENT_SLUG ?? "thanksgiving-2026",
  title: process.env.SEED_EVENT_TITLE ?? "Thanksgiving 2026",
  year: Number(process.env.SEED_EVENT_YEAR ?? 2026),
  best_in_show_points: Number(process.env.SEED_BIS_POINTS ?? 5),
};

const SAMPLE_FAMILY_CODE = process.env.SEED_FAMILY_CODE ?? "family-demo";

const SAMPLE_DOG_GROUPS = [
  {
    name: "Sporting",
    sort_order: 0,
    points_per_correct: 2,
    dogs: [
      "Labrador Retriever",
      "English Springer Spaniel",
      "German Shorthaired Pointer",
    ],
  },
  {
    name: "Hound",
    sort_order: 1,
    points_per_correct: 2,
    dogs: ["Beagle", "Whippet", "Afghan Hound"],
  },
  {
    name: "Working",
    sort_order: 2,
    points_per_correct: 2,
    dogs: ["Boxer", "Great Dane", "Siberian Husky"],
  },
  {
    name: "Terrier",
    sort_order: 3,
    points_per_correct: 2,
    dogs: [
      "West Highland White Terrier",
      "Scottish Terrier",
      "Airedale Terrier",
    ],
  },
  {
    name: "Toy",
    sort_order: 4,
    points_per_correct: 2,
    dogs: ["Pomeranian", "Cavalier King Charles Spaniel", "Havanese"],
  },
  {
    name: "Non-Sporting",
    sort_order: 5,
    points_per_correct: 2,
    dogs: ["French Bulldog", "Dalmatian", "Miniature Poodle"],
  },
  {
    name: "Herding",
    sort_order: 6,
    points_per_correct: 2,
    dogs: ["Border Collie", "German Shepherd Dog", "Pembroke Welsh Corgi"],
  },
];

const SAMPLE_FOOTBALL_GAMES = [
  {
    home_team: "Lions",
    away_team: "Bears",
    points_value: 3,
    sort_order: 0,
  },
  {
    home_team: "Cowboys",
    away_team: "Commanders",
    points_value: 3,
    sort_order: 1,
  },
  {
    home_team: "49ers",
    away_team: "Seahawks",
    points_value: 3,
    sort_order: 2,
  },
];

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment."
    );
    process.exit(1);
  }

  const db = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let eventId;
  const { data: existing } = await db
    .from("events")
    .select("id")
    .eq("slug", SAMPLE_EVENT.slug)
    .maybeSingle();

  if (existing) {
    eventId = existing.id;
    console.log("Event already exists:", SAMPLE_EVENT.slug, eventId);
  } else {
    const { data: ev, error } = await db
      .from("events")
      .insert({
        slug: SAMPLE_EVENT.slug,
        title: SAMPLE_EVENT.title,
        year: SAMPLE_EVENT.year,
        best_in_show_points: SAMPLE_EVENT.best_in_show_points,
      })
      .select("id")
      .single();
    if (error) throw error;
    eventId = ev.id;
    const { error: secErr } = await db.from("event_secrets").insert({
      event_id: eventId,
      family_code: SAMPLE_FAMILY_CODE,
    });
    if (secErr) throw secErr;
    console.log(
      "Created event",
      SAMPLE_EVENT.slug,
      "family code:",
      SAMPLE_FAMILY_CODE
    );
  }

  const { count, error: cErr } = await db
    .from("dog_groups")
    .select("*", { count: "exact", head: true })
    .eq("event_id", eventId);
  if (cErr) throw cErr;

  if ((count ?? 0) > 0) {
    console.log(
      "Dog groups already exist for this event — skipping dog/football seed. Use Admin → Reset if you need a clean slate."
    );
    return;
  }

  for (const g of SAMPLE_DOG_GROUPS) {
    const { data: grp, error: gErr } = await db
      .from("dog_groups")
      .insert({
        event_id: eventId,
        name: g.name,
        sort_order: g.sort_order,
        points_per_correct: g.points_per_correct,
      })
      .select("id")
      .single();
    if (gErr) throw gErr;
    for (let i = 0; i < g.dogs.length; i++) {
      const { error: dErr } = await db.from("dog_entries").insert({
        group_id: grp.id,
        name: g.dogs[i],
        sort_order: i,
      });
      if (dErr) throw dErr;
    }
  }

  for (const gm of SAMPLE_FOOTBALL_GAMES) {
    const { error: fErr } = await db.from("football_games").insert({
      event_id: eventId,
      home_team: gm.home_team,
      away_team: gm.away_team,
      points_value: gm.points_value,
      sort_order: gm.sort_order,
      game_time: null,
    });
    if (fErr) throw fErr;
  }

  console.log("Seeded dog groups, entries, and football games.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
