import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import { leaderboardUsersTable } from "@workspace/db/schema";
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
  };
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

// GET /api/me/leaderboard — returns current user's entry
router.get("/me/leaderboard", requireAuth, async (req: any, res) => {
  try {
    const rows = await db
      .select()
      .from(leaderboardUsersTable)
      .orderBy(desc(leaderboardUsersTable.bestScore));

    const idx = rows.findIndex((r) => r.clerkUserId === req.clerkUserId);
    if (idx === -1) {
      res.json(null);
      return;
    }
    res.json(buildEntry(rows[idx], idx + 1));
  } catch (err) {
    req.log.error(err, "Failed to fetch user leaderboard entry");
    res.status(500).json({ error: "Failed to fetch entry" });
  }
});

// POST /api/leaderboard — submit game result (auth required)
router.post("/leaderboard", requireAuth, async (req: any, res) => {
  const parsed = submitScoreSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }

  const { score, won, guessesUsed, timeSeconds, displayName } = parsed.data;
  const clerkUserId: string = req.clerkUserId;

  try {
    // Resolve display name: use provided one for new accounts, else keep existing
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

    await db
      .insert(leaderboardUsersTable)
      .values({
        clerkUserId,
        displayName: resolvedDisplayName,
        bestScore: won ? score : 0,
        totalWins: won ? 1 : 0,
        currentStreak: won ? 1 : 0,
        bestStreak: won ? 1 : 0,
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
          lastResultWon: won,
          updatedAt: sql`NOW()`,
        },
      });

    const rows = await db
      .select()
      .from(leaderboardUsersTable)
      .orderBy(desc(leaderboardUsersTable.bestScore));

    const idx = rows.findIndex((r) => r.clerkUserId === clerkUserId);
    res.json(buildEntry(rows[idx], idx + 1));
  } catch (err: any) {
    // Unique constraint violation on display_name
    if (err?.code === "23505") {
      res.status(409).json({ error: "That display name is already taken. Please choose another." });
      return;
    }
    req.log.error(err, "Failed to submit score");
    res.status(500).json({ error: "Failed to submit score" });
  }
});

export default router;
