import { pgTable, varchar, integer, date, timestamp } from "drizzle-orm/pg-core";

export const leaderboardUsersTable = pgTable("leaderboard_users", {
  clerkUserId: varchar("clerk_user_id", { length: 100 }).primaryKey(),
  displayName: varchar("display_name", { length: 50 }).notNull().unique(),
  dailyStreak: integer("daily_streak").default(0).notNull(),
  lastPlayedDate: date("last_played_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type LeaderboardUser = typeof leaderboardUsersTable.$inferSelect;
