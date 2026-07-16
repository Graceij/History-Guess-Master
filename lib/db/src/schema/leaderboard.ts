import { pgTable, varchar, integer, boolean, timestamp, date } from "drizzle-orm/pg-core";

export const leaderboardUsersTable = pgTable("leaderboard_users", {
  clerkUserId: varchar("clerk_user_id", { length: 100 }).primaryKey(),
  displayName: varchar("display_name", { length: 50 }).notNull().unique(),
  bestScore: integer("best_score").default(0).notNull(),
  totalWins: integer("total_wins").default(0).notNull(),
  currentStreak: integer("current_streak").default(0).notNull(),
  bestStreak: integer("best_streak").default(0).notNull(),
  dailyStreak: integer("daily_streak").default(0).notNull(),
  lastPlayedDate: date("last_played_date"),
  lastResultWon: boolean("last_result_won").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type LeaderboardUser = typeof leaderboardUsersTable.$inferSelect;
