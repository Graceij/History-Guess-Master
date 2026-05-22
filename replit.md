# WHAP Challenge

A Wordle-style AP World History guessing game for students, built by Scholle at Dawson HS, Pearland ISD.

## Run & Operate

- `pnpm --filter @workspace/whap-game run dev` — run the game (via workflow: `artifacts/whap-game: web`)
- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + TailwindCSS + Framer Motion
- Game logic: fully client-side, no backend needed
- API: Express 5 (unused by the game, available for future features)
- DB: PostgreSQL + Drizzle ORM (available for future features)

## Where things live

- `artifacts/whap-game/src/data/gameData.ts` — all 250 AP World History terms (source of truth)
- `artifacts/whap-game/src/lib/gameLogic.ts` — guess evaluation logic (colors, proximity, direction)
- `artifacts/whap-game/src/pages/Home.tsx` — main game UI

## Product

Students guess a hidden AP World History term in up to 5 tries. After each guess, color-coded feedback shows how close their guess was across 4 categories: What is it?, Religion, Geographic Area, and Unit. Green = exact match, Yellow = close/related, Red = wrong. Unit guesses also show ↑↓ arrows. 250 terms sourced from the teacher's Excel file. Fully random each game.

## User preferences

- Game should be randomized (not student-picked number)
- Clean, polished classroom-review-game aesthetic
- Hosted on Replit (no external services needed)
- Credit: "Scholle's AP World History Challenge — Dawson HS, Pearland ISD"

## Gotchas

- All 250 terms are hardcoded in `gameData.ts` — edit that file to add/remove/change terms
- The game tracks played IDs in a session ref so the same term won't repeat until all 250 are exhausted
- "NA" religion means the term has no primary religion association

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
