import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import {
  leaderboardUsersTable,
  leaderboardScoresTable,
  gameResultsTable,
} from "@workspace/db/schema";
import { sql, desc, eq, and } from "drizzle-orm";
import { z } from "zod";

const router = Router();

function requireAuth(req: any, res: any, next: any) {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  req.clerkUserId = userId;
  next();
}

const submitScoreSchema = z.object({
  score: z.number().int(),
  guessesUsed: z.number().int().min(1).max(7),
  timeSeconds: z.number().int().min(0),
  won: z.boolean(),
  unitFilter: z.string().regex(/^(all|unit_[1-9])$/),
  termName: z.string().max(255).optional(),
  displayName: z.string().min(1).max(50).trim().optional(),
});

function todayStr() { return new Date().toISOString().slice(0, 10); }
function yesterdayStr() { return new Date(Date.now() - 86400000).toISOString().slice(0, 10); }

// GET /api/leaderboard?filter=all  (default: all)
router.get("/leaderboard", async (req, res) => {
  const filter = (typeof req.query.filter === "string" ? req.query.filter : null) ?? "all";
  if (!/^(all|unit_[1-9])$/.test(filter)) {
    res.status(400).json({ error: "Invalid filter" }); return;
  }
  try {
    const rows = await db
      .select({
        clerkUserId: leaderboardScoresTable.clerkUserId,
        displayName: leaderboardUsersTable.displayName,
        bestScore: leaderboardScoresTable.bestScore,
        totalWins: leaderboardScoresTable.totalWins,
        currentStreak: leaderboardScoresTable.currentStreak,
        bestStreak: leaderboardScoresTable.bestStreak,
      })
      .from(leaderboardScoresTable)
      .innerJoin(
        leaderboardUsersTable,
        eq(leaderboardScoresTable.clerkUserId, leaderboardUsersTable.clerkUserId),
      )
      .where(eq(leaderboardScoresTable.unitFilter, filter))
      .orderBy(desc(leaderboardScoresTable.bestScore))
      .limit(50);
    res.json(rows.map((r, i) => ({ rank: i + 1, ...r, clerkUserId: undefined })));
  } catch (err) {
    req.log.error(err, "Failed to fetch leaderboard");
    res.status(500).json({ error: "Failed to fetch leaderboard" });
  }
});

// GET /api/me/leaderboard — identity + 'all' filter stats + daily streak
router.get("/me/leaderboard", requireAuth, async (req: any, res) => {
  try {
    const [userRow] = await db
      .select()
      .from(leaderboardUsersTable)
      .where(eq(leaderboardUsersTable.clerkUserId, req.clerkUserId))
      .limit(1);

    if (!userRow) { res.json(null); return; }

    const [scoreRow] = await db
      .select()
      .from(leaderboardScoresTable)
      .where(and(
        eq(leaderboardScoresTable.clerkUserId, req.clerkUserId),
        eq(leaderboardScoresTable.unitFilter, "all"),
      ))
      .limit(1);

    let rank: number | null = null;
    if (scoreRow) {
      const allRows = await db
        .select({ clerkUserId: leaderboardScoresTable.clerkUserId })
        .from(leaderboardScoresTable)
        .where(eq(leaderboardScoresTable.unitFilter, "all"))
        .orderBy(desc(leaderboardScoresTable.bestScore));
      const idx = allRows.findIndex((r) => r.clerkUserId === req.clerkUserId);
      if (idx >= 0) rank = idx + 1;
    }

    res.json({
      displayName: userRow.displayName,
      dailyStreak: userRow.dailyStreak,
      rank,
      bestScore: scoreRow?.bestScore ?? null,
      totalWins: scoreRow?.totalWins ?? null,
      currentStreak: scoreRow?.currentStreak ?? null,
      bestStreak: scoreRow?.bestStreak ?? null,
    });
  } catch (err) {
    req.log.error(err, "Failed to fetch user leaderboard entry");
    res.status(500).json({ error: "Failed to fetch entry" });
  }
});

// GET /api/me/games — recent game history
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

// PUT /api/me/display-name
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
    if (updated.length === 0) {
      res.status(404).json({ error: "No profile found. Play a game first." }); return;
    }
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

// POST /api/leaderboard — submit a game result
router.post("/leaderboard", requireAuth, async (req: any, res) => {
  const parsed = submitScoreSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid request" }); return; }

  const { score, won, guessesUsed, timeSeconds, unitFilter, displayName, termName } = parsed.data;
  const clerkUserId: string = req.clerkUserId;
  const today = todayStr();
  const yesterday = yesterdayStr();

  try {
    // ── 1. Upsert leaderboard_users (identity + daily streak) ──
    const [existing] = await db
      .select()
      .from(leaderboardUsersTable)
      .where(eq(leaderboardUsersTable.clerkUserId, clerkUserId))
      .limit(1);

    const resolvedDisplayName = existing?.displayName ?? (displayName ?? "");
    if (!resolvedDisplayName) {
      res.status(400).json({ error: "Display name is required for first submission" }); return;
    }

    const lastDate = existing?.lastPlayedDate as string | null ?? null;
    let newDailyStreak: number;
    if (!existing) {
      newDailyStreak = 1;
    } else if (lastDate === today) {
      newDailyStreak = existing.dailyStreak;
    } else if (lastDate === yesterday) {
      newDailyStreak = existing.dailyStreak + 1;
    } else {
      newDailyStreak = 1;
    }

    await db
      .insert(leaderboardUsersTable)
      .values({
        clerkUserId,
        displayName: resolvedDisplayName,
        dailyStreak: newDailyStreak,
        lastPlayedDate: today,
      })
      .onConflictDoUpdate({
        target: leaderboardUsersTable.clerkUserId,
        set: {
          dailyStreak: newDailyStreak,
          lastPlayedDate: today,
          updatedAt: sql`NOW()`,
        },
      });

    // ── 2. Upsert leaderboard_scores for this filter ──
    const [existingScore] = await db
      .select()
      .from(leaderboardScoresTable)
      .where(and(
        eq(leaderboardScoresTable.clerkUserId, clerkUserId),
        eq(leaderboardScoresTable.unitFilter, unitFilter),
      ))
      .limit(1);

    const prevStreak = existingScore?.currentStreak ?? 0;
    const prevStreakScore = existingScore?.currentStreakScore ?? 0;

    // currentStreakScore: accumulate scores for consecutive wins; reset on loss
    const newCurrentStreak = won ? prevStreak + 1 : 0;
    const newCurrentStreakScore = won ? prevStreakScore + score : 0;

    const newBestStreak = won
      ? Math.max(existingScore?.bestStreak ?? 0, newCurrentStreak)
      : (existingScore?.bestStreak ?? 0);

    // bestScore = best cumulative consecutive-win total ever achieved
    const newBestScore = won
      ? Math.max(existingScore?.bestScore ?? 0, newCurrentStreakScore)
      : (existingScore?.bestScore ?? 0);

    await db
      .insert(leaderboardScoresTable)
      .values({
        clerkUserId,
        unitFilter,
        bestScore: newBestScore,
        totalWins: won ? 1 : 0,
        currentStreak: newCurrentStreak,
        bestStreak: newBestStreak,
        currentStreakScore: newCurrentStreakScore,
        lastResultWon: won,
      })
      .onConflictDoUpdate({
        target: [leaderboardScoresTable.clerkUserId, leaderboardScoresTable.unitFilter],
        set: {
          bestScore: newBestScore,
          totalWins: won
            ? sql`${leaderboardScoresTable.totalWins} + 1`
            : leaderboardScoresTable.totalWins,
          currentStreak: newCurrentStreak,
          bestStreak: newBestStreak,
          currentStreakScore: newCurrentStreakScore,
          lastResultWon: won,
          updatedAt: sql`NOW()`,
        },
      });

    // ── 3. Record game result ──
    await db.insert(gameResultsTable).values({
      clerkUserId,
      unitFilter,
      score,
      guessesUsed,
      timeSeconds,
      won,
      termName: termName ?? null,
    });

    // ── 4. Return updated MyEntry ──
    const [updatedScore] = await db
      .select()
      .from(leaderboardScoresTable)
      .where(and(
        eq(leaderboardScoresTable.clerkUserId, clerkUserId),
        eq(leaderboardScoresTable.unitFilter, "all"),
      ))
      .limit(1);

    let rank: number | null = null;
    if (updatedScore) {
      const allRows = await db
        .select({ clerkUserId: leaderboardScoresTable.clerkUserId })
        .from(leaderboardScoresTable)
        .where(eq(leaderboardScoresTable.unitFilter, "all"))
        .orderBy(desc(leaderboardScoresTable.bestScore));
      const idx = allRows.findIndex((r) => r.clerkUserId === clerkUserId);
      if (idx >= 0) rank = idx + 1;
    }

    res.json({
      displayName: resolvedDisplayName,
      dailyStreak: newDailyStreak,
      rank,
      bestScore: updatedScore?.bestScore ?? null,
      totalWins: updatedScore?.totalWins ?? null,
      currentStreak: updatedScore?.currentStreak ?? null,
      bestStreak: updatedScore?.bestStreak ?? null,
    });
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
