export type EventRow = {
  id: string;
  slug: string;
  title: string;
  year: number;
  dog_show_lock_at: string | null;
  football_lock_at: string | null;
  dog_show_locked_manual: boolean;
  football_locked_manual: boolean;
  best_in_show_points: number;
  created_at: string;
};

export type DogGroupRow = {
  id: string;
  event_id: string;
  name: string;
  sort_order: number;
  points_per_correct: number;
};

export type DogEntryRow = {
  id: string;
  group_id: string;
  name: string;
  sort_order: number;
};

export type FootballGameRow = {
  id: string;
  event_id: string;
  home_team: string;
  away_team: string;
  game_time: string | null;
  points_value: number;
  sort_order: number;
};

export type LeaderboardRpcRow = {
  participant_id: string;
  display_name: string;
  dog_points: number;
  football_points: number;
  total_points: number;
};
