---
name: Multi-leaderboard schema
description: How the leaderboard tables are structured after the multi-board refactor
---

## Tables

- `leaderboard_users` — identity only: clerk_user_id (PK), display_name (unique), daily_streak, last_played_date, created_at, updated_at. No score columns.
- `leaderboard_scores` — composite PK (clerk_user_id, unit_filter); columns: best_score, total_wins, current_streak, best_streak, last_result_won, updated_at.
- `game_results` — id, clerk_user_id, unit_filter, score, guesses_used, time_seconds, won, term_name, played_at.

## unit_filter values
- `'all'` — all 9 units active
- `'unit_1'` through `'unit_9'` — single unit active
- `'practice'` — 2-8 units (stored in game_results only, not leaderboard_scores)

## API shape
- `GET /api/leaderboard?filter=all` — top 50, joins leaderboard_scores + leaderboard_users
- `GET /api/me/leaderboard` — returns MyEntry: { displayName, dailyStreak, rank|null, bestScore|null, totalWins|null, currentStreak|null, bestStreak|null }; rank/scores are nullable if user has never played 'all' filter
- `POST /api/leaderboard` — body must include `unitFilter`; upserts leaderboard_users (daily streak) + leaderboard_scores (per-filter); always returns 'all' filter MyEntry

**Why:** Allows separate competitive boards per unit (study mode) while keeping one authoritative display name per user.
