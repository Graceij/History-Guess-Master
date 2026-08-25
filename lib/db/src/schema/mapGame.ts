import {
  boolean,
  integer,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const mapLeaderboardScoresTable = pgTable("map_leaderboard_scores", {
  clerkUserId: varchar("clerk_user_id", { length: 100 }).notNull(),
  periodFilter: varchar("period_filter", { length: 20 }).notNull(),
  bestScore: integer("best_score").default(0).notNull(),
  totalGames: integer("total_games").default(0).notNull(),
  totalWins: integer("total_wins").default(0).notNull(),
  currentStreak: integer("current_streak").default(0).notNull(),
  bestStreak: integer("best_streak").default(0).notNull(),
  currentStreakScore: integer("current_streak_score").default(0).notNull(),
  lastResultWon: boolean("last_result_won").default(false).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  primaryKey({ columns: [t.clerkUserId, t.periodFilter] }),
]);

export const mapPlayersTable = pgTable("map_players", {
  clerkUserId: varchar("clerk_user_id", { length: 100 }).primaryKey(),
  displayName: varchar("display_name", { length: 50 }).notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const mapGameChallengesTable = pgTable("map_game_challenges", {
  id: varchar("id", { length: 36 }).primaryKey(),
  clerkUserId: varchar("clerk_user_id", { length: 100 }).notNull(),
  period: varchar("period", { length: 20 }).notNull(),
  termsJson: text("terms_json").notNull(),
  startedAt: timestamp("started_at"),
  expiresAt: timestamp("expires_at").notNull(),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const mapGameResultsTable = pgTable("map_game_results", {
  id: serial("id").primaryKey(),
  clerkUserId: varchar("clerk_user_id", { length: 100 }).notNull(),
  period: varchar("period", { length: 20 }).notNull(),
  score: integer("score").notNull(),
  strikes: integer("strikes").notNull(),
  timeSeconds: integer("time_seconds").notNull(),
  won: boolean("won").notNull(),
  termsJson: text("terms_json").notNull(),
  playedAt: timestamp("played_at").defaultNow().notNull(),
});

export type MapLeaderboardScore = typeof mapLeaderboardScoresTable.$inferSelect;
export type MapGameResult = typeof mapGameResultsTable.$inferSelect;