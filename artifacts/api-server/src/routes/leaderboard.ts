import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import { leaderboardUsersTable, gameResultsTable } from "@workspace/db/schema";
import { sql, desc, eq } from "drizzle-orm";
import { z } from "zod";

const router = Router();

function requireAuth(req: any, res: any, next: any) {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  req.clerkUserId = userId;
  next();
}

const submitScoreSchema = z.object({
  score: z.number().int(),
  guessesUsed: z.number().int().min(1).max(7),
  timeSeconds: z.number().int().min(0),
  won: z.boolean(),
  termName: z.string().max(255).optional(),
  displayName: z.string().min(1).max(50).trim().optional(),
});

function buildEntry(row: typeof leaderboardUsersTable.$inferSelect, rank: number) {
  return {
    rank,
    displayName: row.displayName,
    bestScore: row.bestScore,
    totalWins: row.totalWins,
    currentStreak: row.currentStreak,
    bestStreak: row.bestStreak,
    dailyStreak: row.dailyStreak,
  };
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function yesterdayStr() {
  return new Date(Date.now() - 86400000).toISOString().slice(0, 10);
}

// GET /api/leaderboard — public
router.get("/leaderboard", async (req, res) => {
  try {
    const rows = await db
      .select()
      .from(leaderboardUsersTable)
      .orderBy(desc(leaderboardUsersTable.bestScore));
    res.json(rows.map((r, i) => buildEntry(r, i + 1)));
  } catch (err) {
    req.log.error(err, "Failed to fetch leaderboard");
    res.status(500).json({ error: "Failed to fetch leaderboard" });
  }
});

// GET /api/me/leaderboard — current user's stats
router.get("/me/leaderboard", requireAuth, async (req: any, res) => {
  try {
    const rows = await db
      .select()
      .from(leaderboardUsersTable)
      .orderBy(desc(leaderboardUsersTable.bestScore));
    const idx = rows.findIndex((r) => r.clerkUserId === req.clerkUserId);
    if (idx === -1) { res.json(null); return; }
    res.json(buildEntry(rows[idx], idx + 1));
  } catch (err) {
    req.log.error(err, "Failed to fetch user leaderboard entry");
    res.status(500).json({ error: "Failed to fetch entry" });
  }
});

// GET /api/me/games — current user's recent game history
router.get("/me/games", requireAuth, async (req: any, res) => {
  try {
    const rows = await db
      .select()
      .from(gameResultsTable)
      .where(eq(gameResultsTable.clerkUserId, req.clerkUserId))
      .orderBy(desc(gameResultsTable.playedAt))
      .limit(20);
    res.json(rows);
  } catch (err) {
    req.log.error(err, "Failed to fetch game history");
    res.status(500).json({ error: "Failed to fetch game history" });
  }
});

// PUT /api/me/display-name — change display name
router.put("/me/display-name", requireAuth, async (req: any, res) => {
  const parsed = z.object({ displayName: z.string().min(1).max(50).trim() }).safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid display name" }); return; }
  const { displayName } = parsed.data;
  try {
    const updated = await db
      .update(leaderboardUsersTable)
      .set({ displayName, updatedAt: sql`NOW()` })
      .where(eq(leaderboardUsersTable.clerkUserId, req.clerkUserId))
      .returning();
    if (updated.length === 0) { res.status(404).json({ error: "No profile found. Play a game first." }); return; }
    res.json({ displayName: updated[0].displayName });
  } catch (err: any) {
    if (err?.code === "23505") {
      res.status(409).json({ error: "That display name is already taken. Please choose another." });
      return;
    }
    req.log.error(err, "Failed to update display name");
    res.status(500).json({ error: "Failed to update display name" });
  }
});

// POST /api/leaderboard — submit game result (auth required)
router.post("/leaderboard", requireAuth, async (req: any, res) => {
  const parsed = submitScoreSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid request" }); return; }

  const { score, won, guessesUsed, timeSeconds, displayName, termName } = parsed.data;
  const clerkUserId: string = req.clerkUserId;
  const today = todayStr();
  const yesterday = yesterdayStr();

  try {
    const existing = await db
      .select()
      .from(leaderboardUsersTable)
      .where(eq(leaderboardUsersTable.clerkUserId, clerkUserId))
      .limit(1);

    const resolvedDisplayName =
      existing.length > 0 ? existing[0].displayName : (displayName ?? "");
    if (!resolvedDisplayName) {
      res.status(400).json({ error: "Display name is required for first submission" });
      return;
    }

    // Compute new daily streak
    let newDailyStreak = 1;
    if (existing.length > 0) {
      const lastDate = existing[0].lastPlayedDate as string | null;
      if (lastDate === today) {
        newDailyStreak = existing[0].dailyStreak; // already played today
      } else if (lastDate === yesterday) {
        newDailyStreak = existing[0].dailyStreak + 1;
      } else {
        newDailyStreak = 1;
      }
    }

    await db
      .insert(leaderboardUsersTable)
      .values({
        clerkUserId,
        displayName: resolvedDisplayName,
        bestScore: won ? score : 0,
        totalWins: won ? 1 : 0,
        currentStreak: won ? 1 : 0,
        bestStreak: won ? 1 : 0,
        dailyStreak: newDailyStreak,
        lastPlayedDate: today,
        lastResultWon: won,
      })
      .onConflictDoUpdate({
        target: leaderboardUsersTable.clerkUserId,
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
          dailyStreak: newDailyStreak,
          lastPlayedDate: today,
          lastResultWon: won,
          updatedAt: sql`NOW()`,
        },
      });

    // Record individual game result
    await db.insert(gameResultsTable).values({
      clerkUserId,
      score,
      guessesUsed,
      timeSeconds,
      won,
      termName: termName ?? null,
    });

    const rows = await db
      .select()
      .from(leaderboardUsersTable)
      .orderBy(desc(leaderboardUsersTable.bestScore));
    const idx = rows.findIndex((r) => r.clerkUserId === clerkUserId);
    res.json(buildEntry(rows[idx], idx + 1));
  } catch (err: any) {
    if (err?.code === "23505") {
      res.status(409).json({ error: "That display name is already taken. Please choose another." });
      return;
    }
    req.log.error(err, "Failed to submit score");
    res.status(500).json({ error: "Failed to submit score" });
  }
});

export default router;
