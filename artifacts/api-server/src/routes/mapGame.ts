import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import {
  mapGameChallengesTable,
  mapGameResultsTable,
  mapLeaderboardScoresTable,
  mapPlayersTable,
} from "@workspace/db/schema";
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import { MAP_TERMS, type MapPeriod, type MapRegion, type MapTerm } from "../../../whap-game/src/data/mapData";

const router = Router();
const MAP_PERIODS = ["1200-1450", "1450-1750", "1750-1900", "1900-2001"] as const;
const MAP_FILTERS = ["all", ...MAP_PERIODS] as const;
const MAP_REGIONS = ["Africa", "Central America", "East Asia", "Europe", "Middle East", "North America", "Russia", "South America", "South Asia", "Southeast Asia"] as const;

function requireAuth(req: any, res: any, next: any) {
  const userId = getAuth(req)?.userId;
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  req.clerkUserId = userId;
  next();
}

function shuffle<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5);
}

function makeRound(period: MapPeriod | "all") {
  const terms = MAP_TERMS.filter((term) => period === "all" || term.period === period);
  return shuffle([
    ...shuffle(terms.filter((term) => term.category === "Easy")).slice(0, 3),
    ...shuffle(terms.filter((term) => term.category === "Hard")).slice(0, 1),
    ...shuffle(terms.filter((term) => term.category === "Geography")).slice(0, 1),
  ]);
}

function verifyAttempts(terms: MapTerm[], attempts: MapRegion[]) {
  let termIndex = 0;
  let strikes = 0;
  for (let i = 0; i < attempts.length; i += 1) {
    if (termIndex >= terms.length) return null;
    if (attempts[i] === terms[termIndex].region) termIndex += 1;
    else strikes += 1;
    const ended = termIndex === terms.length || strikes === 3;
    if (ended && i !== attempts.length - 1) return null;
  }
  if (termIndex !== terms.length && strikes !== 3) return null;
  return { won: termIndex === terms.length, strikes };
}

async function updateScore(executor: any, clerkUserId: string, periodFilter: string, won: boolean, score: number) {
  const [existing] = await executor.select().from(mapLeaderboardScoresTable)
    .where(and(eq(mapLeaderboardScoresTable.clerkUserId, clerkUserId), eq(mapLeaderboardScoresTable.periodFilter, periodFilter)))
    .limit(1);

  const currentStreak = won ? (existing?.currentStreak ?? 0) + 1 : 0;
  const currentStreakScore = won ? (existing?.currentStreakScore ?? 0) + score : 0;
  const bestStreak = won ? Math.max(existing?.bestStreak ?? 0, currentStreak) : (existing?.bestStreak ?? 0);
  const bestScore = won ? Math.max(existing?.bestScore ?? 0, currentStreakScore) : (existing?.bestScore ?? 0);
  await executor.insert(mapLeaderboardScoresTable).values({
    clerkUserId, periodFilter, bestScore, totalGames: 1, totalWins: won ? 1 : 0,
    currentStreak, bestStreak, currentStreakScore, lastResultWon: won,
  }).onConflictDoUpdate({
    target: [mapLeaderboardScoresTable.clerkUserId, mapLeaderboardScoresTable.periodFilter],
    set: {
      bestScore,
      totalGames: sql`${mapLeaderboardScoresTable.totalGames} + 1`,
      totalWins: won ? sql`${mapLeaderboardScoresTable.totalWins} + 1` : mapLeaderboardScoresTable.totalWins,
      currentStreak, bestStreak, currentStreakScore, lastResultWon: won, updatedAt: sql`NOW()`,
    },
  });
}

router.get("/map/leaderboard", async (req, res) => {
  const period = typeof req.query.period === "string" ? req.query.period : "all";
  if (!MAP_FILTERS.includes(period as typeof MAP_FILTERS[number])) {
    res.status(400).json({ error: "Invalid time period" }); return;
  }
  try {
    const rows = await db.select({
      clerkUserId: mapLeaderboardScoresTable.clerkUserId,
      displayName: mapPlayersTable.displayName,
      bestScore: mapLeaderboardScoresTable.bestScore,
      totalGames: mapLeaderboardScoresTable.totalGames,
      totalWins: mapLeaderboardScoresTable.totalWins,
      currentStreak: mapLeaderboardScoresTable.currentStreak,
      bestStreak: mapLeaderboardScoresTable.bestStreak,
    }).from(mapLeaderboardScoresTable)
      .innerJoin(mapPlayersTable, eq(mapLeaderboardScoresTable.clerkUserId, mapPlayersTable.clerkUserId))
      .where(eq(mapLeaderboardScoresTable.periodFilter, period))
      .orderBy(desc(mapLeaderboardScoresTable.bestScore))
      .limit(50);
    res.json(rows.map((row, index) => ({ rank: index + 1, ...row, clerkUserId: undefined })));
  } catch (error) {
    req.log.error(error, "Failed to load map leaderboard");
    res.status(500).json({ error: "Failed to load map leaderboard" });
  }
});

router.post("/map/challenge", requireAuth, async (req: any, res) => {
  const parsed = z.object({ period: z.enum(MAP_FILTERS) }).safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid time period" }); return; }
  const terms = makeRound(parsed.data.period);
  try {
    const id = crypto.randomUUID();
    await db.insert(mapGameChallengesTable).values({
      id,
      clerkUserId: req.clerkUserId,
      period: parsed.data.period,
      termsJson: JSON.stringify(terms),
      expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
    });
    res.json({ challengeId: id, terms });
  } catch (error) {
    req.log.error(error, "Failed to create map challenge");
    res.status(500).json({ error: "Failed to create map challenge" });
  }
});

router.post("/map/challenge/:id/start", requireAuth, async (req: any, res) => {
  try {
    const [challenge] = await db.select().from(mapGameChallengesTable)
      .where(and(eq(mapGameChallengesTable.id, req.params.id), eq(mapGameChallengesTable.clerkUserId, req.clerkUserId), isNull(mapGameChallengesTable.completedAt)))
      .limit(1);
    if (!challenge || challenge.expiresAt < new Date()) { res.status(404).json({ error: "Map challenge is unavailable" }); return; }
    if (!challenge.startedAt) {
      await db.update(mapGameChallengesTable).set({ startedAt: new Date() }).where(eq(mapGameChallengesTable.id, challenge.id));
    }
    res.json({ ok: true });
  } catch (error) {
    req.log.error(error, "Failed to start map challenge");
    res.status(500).json({ error: "Failed to start map challenge" });
  }
});

router.get("/me/map-stats", requireAuth, async (req: any, res) => {
  try {
    const [score] = await db.select().from(mapLeaderboardScoresTable)
      .where(and(eq(mapLeaderboardScoresTable.clerkUserId, req.clerkUserId), eq(mapLeaderboardScoresTable.periodFilter, "all")))
      .limit(1);
    if (!score) { res.json(null); return; }
    const ranked = await db.select({ clerkUserId: mapLeaderboardScoresTable.clerkUserId })
      .from(mapLeaderboardScoresTable).where(eq(mapLeaderboardScoresTable.periodFilter, "all"))
      .orderBy(desc(mapLeaderboardScoresTable.bestScore));
    const rank = ranked.findIndex((row) => row.clerkUserId === req.clerkUserId) + 1;
    res.json({
      rank: rank || null, bestScore: score.bestScore, totalGames: score.totalGames, totalWins: score.totalWins,
      totalLosses: score.totalGames - score.totalWins, currentStreak: score.currentStreak, bestStreak: score.bestStreak,
    });
  } catch (error) {
    req.log.error(error, "Failed to load map stats");
    res.status(500).json({ error: "Failed to load map stats" });
  }
});

router.get("/me/map-games", requireAuth, async (req: any, res) => {
  try {
    const rows = await db.select().from(mapGameResultsTable)
      .where(eq(mapGameResultsTable.clerkUserId, req.clerkUserId))
      .orderBy(desc(mapGameResultsTable.playedAt)).limit(20);
    res.json(rows);
  } catch (error) {
    req.log.error(error, "Failed to load map game history");
    res.status(500).json({ error: "Failed to load map game history" });
  }
});

const submitSchema = z.object({
  challengeId: z.string().uuid(),
  attempts: z.array(z.enum(MAP_REGIONS)).min(1).max(8),
  displayName: z.string().min(1).max(50).trim().optional(),
});

router.post("/map/submit", requireAuth, async (req: any, res) => {
  const parsed = submitSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid map result" }); return; }
  const { challengeId, attempts, displayName } = parsed.data;
  const clerkUserId: string = req.clerkUserId;

  try {
    const result = await db.transaction(async (tx) => {
      await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${clerkUserId}))`);
      const [challenge] = await tx.select().from(mapGameChallengesTable)
        .where(and(eq(mapGameChallengesTable.id, challengeId), eq(mapGameChallengesTable.clerkUserId, clerkUserId)))
        .limit(1);
      if (!challenge || challenge.completedAt || !challenge.startedAt || challenge.expiresAt < new Date()) {
        throw new Error("MAP_CHALLENGE_UNAVAILABLE");
      }
      const terms = JSON.parse(challenge.termsJson) as MapTerm[];
      const verified = verifyAttempts(terms, attempts);
      if (!verified) throw new Error("MAP_ATTEMPTS_INVALID");

      const [player] = await tx.select().from(mapPlayersTable).where(eq(mapPlayersTable.clerkUserId, clerkUserId)).limit(1);
      const name = player?.displayName ?? displayName ?? "";
      if (!name) throw new Error("MAP_NAME_REQUIRED");
      await tx.insert(mapPlayersTable).values({ clerkUserId, displayName: name }).onConflictDoNothing();

      const timeSeconds = Math.max(1, Math.floor((Date.now() - challenge.startedAt.getTime()) / 1000));
      const score = verified.won ? Math.max(500, 6000 - timeSeconds * 25 - verified.strikes * 250) : 0;
       await updateScore(tx, clerkUserId, "all", verified.won, score);
       if (challenge.period !== "all") {
         await updateScore(tx, clerkUserId, challenge.period, verified.won, score);
       }
      await tx.insert(mapGameResultsTable).values({
        clerkUserId, period: challenge.period, score, strikes: verified.strikes, timeSeconds,
        won: verified.won, termsJson: challenge.termsJson,
      });
      await tx.update(mapGameChallengesTable).set({ completedAt: new Date() }).where(eq(mapGameChallengesTable.id, challengeId));
      const [updated] = await tx.select().from(mapLeaderboardScoresTable)
        .where(and(eq(mapLeaderboardScoresTable.clerkUserId, clerkUserId), eq(mapLeaderboardScoresTable.periodFilter, "all"))).limit(1);
      return { won: verified.won, score, strikes: verified.strikes, timeSeconds, ...updated };
    });
    res.json({
      score: result.score, strikes: result.strikes, timeSeconds: result.timeSeconds, won: result.won,
      bestScore: result.bestScore ?? 0, totalGames: result.totalGames ?? 0, totalWins: result.totalWins ?? 0,
      totalLosses: (result.totalGames ?? 0) - (result.totalWins ?? 0), currentStreak: result.currentStreak ?? 0,
      bestStreak: result.bestStreak ?? 0,
    });
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    if (code === "MAP_NAME_REQUIRED") { res.status(400).json({ error: "Display name is required for your first score." }); return; }
    if (code === "MAP_CHALLENGE_UNAVAILABLE" || code === "MAP_ATTEMPTS_INVALID") { res.status(400).json({ error: "This map round could not be verified." }); return; }
    req.log.error(error, "Failed to save map result");
    res.status(500).json({ error: "Failed to save map result" });
  }
});

export default router;