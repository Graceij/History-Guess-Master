import { pgTable, varchar, integer, boolean, timestamp, primaryKey } from "drizzle-orm/pg-core";

export const leaderboardScoresTable = pgTable("leaderboard_scores", {
  clerkUserId: varchar("clerk_user_id", { length: 100 }).notNull(),
  unitFilter: varchar("unit_filter", { length: 20 }).notNull(),
  bestScore: integer("best_score").default(0).notNull(),
  totalWins: integer("total_wins").default(0).notNull(),
  currentStreak: integer("current_streak").default(0).notNull(),
  bestStreak: integer("best_streak").default(0).notNull(),
  lastResultWon: boolean("last_result_won").default(false).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  primaryKey({ columns: [t.clerkUserId, t.unitFilter] }),
]);

export type LeaderboardScore = typeof leaderboardScoresTable.$inferSelect;
