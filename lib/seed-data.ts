/** Shared sample content for scripts/admin seed (not the access code). */

export const SAMPLE_EVENT = {
  slug: "thanksgiving-2026",
  title: "Thanksgiving 2026",
  year: 2026,
  best_in_show_points: 5,
};

export const SAMPLE_FAMILY_CODE = "family-demo";

export const SAMPLE_DOG_GROUPS: {
  name: string;
  sort_order: number;
  points_per_correct: number;
  dogs: string[];
}[] = [
  {
    name: "Sporting",
    sort_order: 0,
    points_per_correct: 2,
    dogs: ["Labrador Retriever", "English Springer Spaniel", "German Shorthaired Pointer"],
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
    dogs: ["West Highland White Terrier", "Scottish Terrier", "Airedale Terrier"],
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

export const SAMPLE_FOOTBALL_GAMES: {
  home_team: string;
  away_team: string;
  points_value: number;
  sort_order: number;
}[] = [
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
