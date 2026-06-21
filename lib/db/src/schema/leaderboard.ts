import { pgTable, varchar, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const leaderboardUsersTable = pgTable("leaderboard_users", {
  username: varchar("username", { length: 50 }).primaryKey(),
  bestScore: integer("best_score").default(0).notNull(),
  totalWins: integer("total_wins").default(0).notNull(),
  currentStreak: integer("current_streak").default(0).notNull(),
  bestStreak: integer("best_streak").default(0).notNull(),
  lastResultWon: boolean("last_result_won").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertLeaderboardUserSchema = createInsertSchema(
  leaderboardUsersTable
).omit({ createdAt: true, updatedAt: true });

export type LeaderboardUser = typeof leaderboardUsersTable.$inferSelect;
export type InsertLeaderboardUser = z.infer<typeof insertLeaderboardUserSchema>;
