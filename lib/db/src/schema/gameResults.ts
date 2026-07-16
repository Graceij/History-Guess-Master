import { pgTable, serial, varchar, integer, boolean, timestamp } from "drizzle-orm/pg-core";

export const gameResultsTable = pgTable("game_results", {
  id: serial("id").primaryKey(),
  clerkUserId: varchar("clerk_user_id", { length: 100 }).notNull(),
  unitFilter: varchar("unit_filter", { length: 20 }).notNull().default("practice"),
  score: integer("score").notNull(),
  guessesUsed: integer("guesses_used").notNull(),
  timeSeconds: integer("time_seconds").notNull(),
  won: boolean("won").notNull(),
  termName: varchar("term_name", { length: 255 }),
  playedAt: timestamp("played_at").defaultNow().notNull(),
});

export type GameResult = typeof gameResultsTable.$inferSelect;
