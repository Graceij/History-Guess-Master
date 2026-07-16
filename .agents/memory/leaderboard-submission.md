---
name: Leaderboard submission rules
description: Which unit filter triggers which leaderboard, and what practice mode means
---

## Rules

- **9 units selected** → `unitFilter = 'all'` → submitted to "All Units" leaderboard
- **1 unit selected** → `unitFilter = 'unit_N'` → submitted to "Unit N" leaderboard
- **2–8 units selected** → `null` (practice mode) → no leaderboard submission, game_results stored with unitFilter='practice'

## Frontend (Home.tsx)
- `getUnitFilter()` returns `string | null`
- `handleGameEnd` calls `getUnitFilter()` and returns early if null
- Game-over banner shows a "practice mode" amber note when null, a "Unit N leaderboard!" violet note for single-unit

## Leaderboard modal
- Horizontally scrollable filter tabs: "All Units" + "Unit 1" through "Unit 9"
- Default tab = current game's filter (or 'all' if practice mode)
- Top 50 entries per board

**Why:** Lets students practice specific units competitively (e.g., before a unit test) without polluting the main all-units leaderboard.
