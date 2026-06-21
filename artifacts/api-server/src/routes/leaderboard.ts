import { Router } from "express";
import { db } from "@workspace/db";
import { leaderboardUsersTable } from "@workspace/db/schema";
import { sql, desc } from "drizzle-orm";
import { z } from "zod";

const router = Router();

const submitScoreSchema = z.object({
  username: z.string().min(1).max(50).trim(),
  score: z.number().int(),
  guessesUsed: z.number().int().min(1).max(7),
  timeSeconds: z.number().int().min(0),
  won: z.boolean(),
});

router.get("/leaderboard", async (req, res) => {
  try {
    const rows = await db
      .select()
      .from(leaderboardUsersTable)
      .orderBy(desc(leaderboardUsersTable.bestScore));

    const entries = rows.map((row, i) => ({
      rank: i + 1,
      username: row.username,
      bestScore: row.bestScore,
      totalWins: row.totalWins,
      currentStreak: row.currentStreak,
      bestStreak: row.bestStreak,
    }));

    res.json(entries);
  } catch (err) {
    req.log.error(err, "Failed to fetch leaderboard");
    res.status(500).json({ error: "Failed to fetch leaderboard" });
  }
});

router.post("/leaderboard", async (req, res) => {
  const parsed = submitScoreSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }

  const { username, score, won } = parsed.data;

  try {
    await db
      .insert(leaderboardUsersTable)
      .values({
        username,
        bestScore: won ? score : 0,
        totalWins: won ? 1 : 0,
        currentStreak: won ? 1 : 0,
        bestStreak: won ? 1 : 0,
        lastResultWon: won,
      })
      .onConflictDoUpdate({
        target: leaderboardUsersTable.username,
        set: {
          bestScore: won
            ? sql`GREATEST(${leaderboardUsersTable.bestScore}, ${score})`
            : leaderboardUsersTable.bestScore,
          totalWins: won
            ? sql`${leaderboardUsersTable.totalWins} + 1`
            : leaderboardUsersTable.totalWins,
          currentStreak: won
            ? sql`${leaderboardUsersTable.currentStreak} + 1`
            : sql`0`,
          bestStreak: won
            ? sql`GREATEST(${leaderboardUsersTable.bestStreak}, ${leaderboardUsersTable.currentStreak} + 1)`
            : leaderboardUsersTable.bestStreak,
          lastResultWon: won,
          updatedAt: sql`NOW()`,
        },
      });

    const rows = await db
      .select()
      .from(leaderboardUsersTable)
      .orderBy(desc(leaderboardUsersTable.bestScore));

    const rank = rows.findIndex((r) => r.username === username) + 1;
    const user = rows[rank - 1];

    res.json({
      rank,
      username: user.username,
      bestScore: user.bestScore,
      totalWins: user.totalWins,
      currentStreak: user.currentStreak,
      bestStreak: user.bestStreak,
    });
  } catch (err) {
    req.log.error(err, "Failed to submit score");
    res.status(500).json({ error: "Failed to submit score" });
  }
});

export default router;
