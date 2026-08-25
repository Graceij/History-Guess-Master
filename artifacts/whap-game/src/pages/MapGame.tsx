import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useUser } from "@clerk/react";
import { useLocation } from "wouter";
import { MAP_PERIODS, MAP_TERMS, type MapPeriod, type MapRegion, type MapTerm } from "../data/mapData";
import mapArtwork from "../../../../attached_assets/Map_File_1787626458238.jpg";

type Screen = "setup" | "playing" | "complete";

interface MapLeaderboardEntry {
  rank: number;
  displayName: string;
  bestScore: number;
  totalGames: number;
  totalWins: number;
  currentStreak: number;
  bestStreak: number;
}

const regionPaths: Record<MapRegion, string> = {
  "North America": "M15 40 L250 42 L292 135 L255 215 L190 242 L121 211 L68 173 L15 150 Z",
  "Central America": "M206 218 L281 221 L301 258 L272 287 L218 276 L188 246 Z",
  "South America": "M236 275 L316 267 L349 323 L325 428 L283 495 L234 437 L205 353 Z",
  "Europe": "M350 44 L495 43 L533 98 L488 161 L412 173 L363 136 Z",
  "Africa": "M382 170 L520 177 L559 282 L515 413 L444 459 L373 362 L349 260 Z",
  "Middle East": "M500 151 L590 155 L624 214 L584 276 L506 264 L474 210 Z",
  "Russia": "M488 26 L861 28 L888 95 L809 146 L692 162 L595 136 L529 101 Z",
  "South Asia": "M570 218 L657 191 L704 238 L667 310 L608 300 Z",
  "East Asia": "M686 151 L822 136 L894 195 L861 279 L765 295 L699 242 Z",
  "Southeast Asia": "M702 282 L818 271 L904 323 L840 399 L743 377 L691 329 Z",
};

function formatTime(secs: number) {
  return `${Math.floor(secs / 60)}:${(secs % 60).toString().padStart(2, "0")}`;
}

function shuffle<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5);
}

function buildRound(period: MapPeriod) {
  const forPeriod = MAP_TERMS.filter((term) => term.period === period);
  return shuffle([
    ...shuffle(forPeriod.filter((term) => term.category === "Easy")).slice(0, 3),
    ...shuffle(forPeriod.filter((term) => term.category === "Hard")).slice(0, 1),
    ...shuffle(forPeriod.filter((term) => term.category === "Geography")).slice(0, 1),
  ]);
}

function RegionMap({
  correctRegions,
  wrongRegion,
  onSelect,
  disabled,
}: {
  correctRegions: MapRegion[];
  wrongRegion: MapRegion | null;
  onSelect: (region: MapRegion) => void;
  disabled: boolean;
}) {
  return (
    <div className="relative aspect-[2/1] overflow-hidden rounded-2xl border-2 border-slate-600 bg-slate-950 shadow-2xl">
      <img src={mapArtwork} alt="World regional map for AP World History" className="absolute inset-0 h-full w-full select-none object-cover" draggable={false} />
      <svg viewBox="0 0 1024 512" className="absolute inset-0 h-full w-full" aria-label="Click the matching world region">
        {Object.entries(regionPaths).map(([region, path]) => {
          const typedRegion = region as MapRegion;
          const isCorrect = correctRegions.includes(typedRegion);
          const isWrong = wrongRegion === typedRegion;
          return (
            <motion.path
              key={region}
              d={path}
              role="button"
              tabIndex={disabled ? -1 : 0}
              aria-label={`Choose ${region}`}
              onClick={() => !disabled && onSelect(typedRegion)}
              onKeyDown={(event) => {
                if (!disabled && (event.key === "Enter" || event.key === " ")) {
                  event.preventDefault();
                  onSelect(typedRegion);
                }
              }}
              animate={isWrong ? { x: [-7, 7, -5, 5, 0] } : { x: 0 }}
              transition={{ duration: 0.35 }}
              className="cursor-pointer outline-none focus-visible:stroke-white"
              fill={isCorrect ? "rgba(250, 204, 21, .64)" : isWrong ? "rgba(239, 68, 68, .72)" : "rgba(0,0,0,0.01)"}
              stroke={isCorrect ? "#fde047" : isWrong ? "#f87171" : "rgba(255,255,255,.10)"}
              strokeWidth={isCorrect || isWrong ? 5 : 1.5}
            />
          );
        })}
      </svg>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/70 to-transparent px-4 pb-3 pt-10 text-center text-[10px] font-medium tracking-wide text-slate-300 sm:text-xs">
        Click the region where the active term belongs
      </div>
    </div>
  );
}

export default function MapGame() {
  const { user, isLoaded } = useUser();
  const [, setLocation] = useLocation();
  const [period, setPeriod] = useState<MapPeriod>("1200-1450");
  const [screen, setScreen] = useState<Screen>("setup");
  const [round, setRound] = useState<MapTerm[]>([]);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [attempts, setAttempts] = useState<MapRegion[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [strikes, setStrikes] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [correctRegions, setCorrectRegions] = useState<MapRegion[]>([]);
  const [wrongRegion, setWrongRegion] = useState<MapRegion | null>(null);
  const [resolving, setResolving] = useState(false);
  const [won, setWon] = useState(false);
  const [savedScore, setSavedScore] = useState<number | null>(null);
  const [saveMessage, setSaveMessage] = useState("");
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [nameError, setNameError] = useState("");
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboardPeriod, setLeaderboardPeriod] = useState<"all" | MapPeriod>("all");
  const [leaderboard, setLeaderboard] = useState<MapLeaderboardEntry[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

  useEffect(() => {
    if (screen !== "playing" || !startedAt) return;
    const timer = window.setInterval(() => setElapsed(Math.floor((Date.now() - startedAt) / 1000)), 250);
    return () => window.clearInterval(timer);
  }, [screen, startedAt]);

  const activeTerm = round[activeIndex];
  const score = useMemo(() => won ? Math.max(500, 6000 - elapsed * 25 - strikes * 250) : 0, [elapsed, strikes, won]);
  const myInitial = (user?.primaryEmailAddress?.emailAddress ?? "?")[0].toUpperCase();

  function resetRound(nextRound: MapTerm[], nextChallengeId: string | null) {
    setRound(nextRound);
    setChallengeId(nextChallengeId);
    setAttempts([]);
    setActiveIndex(0);
    setStrikes(0);
    setStartedAt(null);
    setElapsed(0);
    setCorrectRegions([]);
    setWrongRegion(null);
    setResolving(false);
    setWon(false);
    setSavedScore(null);
    setSaveMessage("");
    setScreen("playing");
  }

  async function startRound() {
    if (!user) {
      resetRound(buildRound(period), null);
      return;
    }
    setResolving(true);
    try {
      const response = await fetch("/api/map/challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ period }),
      });
      const data = await response.json();
      if (response.ok) {
        resetRound(data.terms, data.challengeId);
      } else {
        resetRound(buildRound(period), null);
        setSaveMessage("This round could not be verified for the leaderboard.");
      }
    } catch {
      resetRound(buildRound(period), null);
      setSaveMessage("This round could not be verified for the leaderboard.");
    } finally {
      setResolving(false);
    }
  }

  async function submitResult(suppliedName?: string, finalAttempts: MapRegion[] = attempts) {
    if (!user || !challengeId) {
      setSaveMessage("This round finished, but it could not be verified for the leaderboard.");
      return;
    }
    try {
      const response = await fetch("/api/map/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeId, attempts: finalAttempts, displayName: suppliedName?.trim() || undefined }),
      });
      const data = await response.json();
      if (response.ok) {
        setSavedScore(data.score);
        setShowNamePrompt(false);
        setSaveMessage(data.won ? `Saved! Your map win streak is ${data.currentStreak}.` : "Round saved. Start another to rebuild your streak.");
      } else if (response.status === 400 && data.error?.includes("Display name")) {
        setShowNamePrompt(true);
      } else {
        setSaveMessage("Your round finished, but it could not be saved.");
      }
    } catch {
      setSaveMessage("Your round finished, but it could not be saved.");
    }
  }

  function finishRound(resultWon: boolean, finalAttempts: MapRegion[]) {
    setWon(resultWon);
    setScreen("complete");
    if (user) void submitResult(undefined, finalAttempts);
    else setSaveMessage("Sign in to save map stats and join the leaderboard.");
  }

  function handleRegion(region: MapRegion) {
    if (!activeTerm || resolving) return;
    const nextAttempts = [...attempts, region];
    setAttempts(nextAttempts);
    if (!startedAt) {
      setStartedAt(Date.now());
      if (challengeId) void fetch(`/api/map/challenge/${challengeId}/start`, { method: "POST" });
    }
    setResolving(true);
    if (region === activeTerm.region) {
      setCorrectRegions((previous) => previous.includes(region) ? previous : [...previous, region]);
      window.setTimeout(() => {
        if (activeIndex === round.length - 1) finishRound(true, nextAttempts);
        else setActiveIndex((previous) => previous + 1);
        setResolving(false);
      }, 550);
    } else {
      const nextStrikes = strikes + 1;
      setWrongRegion(region);
      setStrikes(nextStrikes);
      window.setTimeout(() => {
        setWrongRegion(null);
        setResolving(false);
        if (nextStrikes >= 3) finishRound(false, nextAttempts);
      }, 650);
    }
  }

  async function openLeaderboard(nextPeriod: "all" | MapPeriod = leaderboardPeriod) {
    setLeaderboardPeriod(nextPeriod);
    setShowLeaderboard(true);
    setLeaderboardLoading(true);
    try {
      const response = await fetch(`/api/map/leaderboard?period=${encodeURIComponent(nextPeriod)}`);
      const data = await response.json();
      setLeaderboard(Array.isArray(data) ? data : []);
    } catch {
      setLeaderboard([]);
    } finally {
      setLeaderboardLoading(false);
    }
  }

  async function saveName() {
    const name = displayName.trim();
    if (!name) { setNameError("Enter a display name to save this round."); return; }
    if (name.length > 50) { setNameError("Display names must be 50 characters or less."); return; }
    setNameError("");
    await submitResult(name);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white">
      <header className="border-b border-slate-700">
        <div className="mx-auto max-w-4xl px-4 pt-1 pb-2">
          <div className="flex flex-col items-center gap-0.5">
            <img
              src={`${basePath}/go-for-five.png`}
              alt="Go For Five"
              className="w-full max-w-xs h-auto sm:max-w-lg"
              style={{ maxHeight: "110px", objectFit: "contain" }}
            />
            <h1 className="text-base font-extrabold tracking-tight text-white leading-tight">AP World History Review Game</h1>
            <p className="text-slate-400 text-xs">Become an AP World History Master!</p>
            <div className="mt-1.5 flex flex-wrap items-center justify-center gap-1.5">
              <button onClick={() => setLocation("/")} className="rounded-lg border border-slate-600 bg-slate-700/80 px-3 py-1.5 text-xs font-semibold text-slate-200 transition-colors hover:bg-slate-600 hover:text-white">
                ← Wordle Game
              </button>
              <button onClick={() => openLeaderboard()} className="rounded-lg border border-slate-600 bg-slate-700/80 px-3 py-1.5 text-xs font-semibold text-slate-200 transition-colors hover:border-violet-500 hover:bg-violet-700/60 hover:text-white">
                🏆 Map Leaderboard
              </button>
              {isLoaded && !user && (
                <div className="flex gap-1.5">
                  <button onClick={() => setLocation("/sign-in")} className="rounded-lg border border-slate-600 bg-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200 transition-colors hover:bg-slate-600">Sign In</button>
                  <button onClick={() => setLocation("/sign-up")} className="rounded-lg bg-gradient-to-r from-violet-500 to-pink-500 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:from-violet-400 hover:to-pink-400">Sign Up</button>
                </div>
              )}
              {user && (
                <button onClick={() => setLocation("/profile")} className="flex items-center gap-1.5 rounded-lg border border-slate-600 bg-slate-700/80 px-3 py-1.5 text-xs font-semibold text-slate-200 transition-colors hover:border-violet-500 hover:bg-violet-700/60 hover:text-white">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full border border-violet-400/50 bg-gradient-to-br from-violet-500 to-pink-500 text-[10px] font-extrabold text-white">{myInitial}</span>
                  Profile
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-3 py-3 sm:px-4 sm:py-6">
        <AnimatePresence mode="wait">
          {screen === "setup" && (
            <motion.section key="setup" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mx-auto text-center">
              <p className="mb-2 text-sm font-bold uppercase tracking-[0.18em] text-violet-300">Map Challenge</p>
              <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">Map It in Five</h2>
              <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-slate-400 sm:text-base">
                Click the world region for each term in order. Every round gives you three easy terms, one hard term, and one geography term. You have three strikes.
              </p>
              <div className="mx-auto mt-5 max-w-3xl rounded-lg border border-slate-700 bg-slate-800 p-4 text-left sm:p-5">
                <h2 className="text-base font-bold text-white">Choose a time period</h2>
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {MAP_PERIODS.map((option) => (
                    <button key={option} onClick={() => setPeriod(option)} className={`rounded-lg border px-3 py-3 text-sm font-bold transition-all ${period === option ? "border-violet-300 bg-gradient-to-r from-violet-500 to-pink-500 text-white shadow-lg shadow-violet-500/20" : "border-slate-600 bg-slate-800 text-slate-300 hover:border-violet-400"}`}>
                      {option}
                    </button>
                  ))}
                </div>
                <div className="mt-6 grid gap-3 border-t border-slate-700 pt-5 text-xs text-slate-400 sm:grid-cols-3">
                  <p><span className="font-bold text-slate-200">5 terms</span><br />3 easy · 1 hard · 1 geography</p>
                  <p><span className="font-bold text-slate-200">3 strikes</span><br />Wrong regions turn red</p>
                  <p><span className="font-bold text-slate-200">Streak scores</span><br />Fast, accurate wins build your board score</p>
                </div>
                <button onClick={startRound} className="mt-6 w-full rounded-lg bg-gradient-to-r from-violet-500 to-pink-500 px-5 py-3 text-sm font-extrabold text-white shadow-lg shadow-violet-500/20 transition-transform hover:scale-[1.01]">
                  Start {period} Round →
                </button>
              </div>
            </motion.section>
          )}

          {screen === "playing" && activeTerm && (
            <motion.section key="playing" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-amber-300">{period} · Term {activeIndex + 1} of 5</p>
                  <p className="mt-1 text-sm text-slate-400">Gold regions are correct. Three strikes ends the round.</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 font-mono text-sm text-slate-200">⏱ {formatTime(elapsed)}</span>
                  <span className={`rounded-lg border px-3 py-2 text-sm font-bold ${strikes >= 2 ? "border-red-500/70 bg-red-500/10 text-red-300" : "border-slate-600 bg-slate-800 text-slate-300"}`}>✕ {strikes}/3</span>
                </div>
              </div>
              <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_290px]">
                <RegionMap correctRegions={correctRegions} wrongRegion={wrongRegion} onSelect={handleRegion} disabled={resolving} />
                <aside className="rounded-lg border border-slate-700 bg-slate-800 p-4 lg:sticky lg:top-5">
                  <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">Click in this order</h2>
                  <ol className="space-y-2">
                    {round.map((term, index) => {
                      const done = index < activeIndex;
                      const active = index === activeIndex;
                      return (
                        <li key={term.id} className={`flex items-center gap-2 rounded-xl border px-3 py-3 transition-colors ${active ? "border-amber-300 bg-amber-300/15" : done ? "border-green-500/40 bg-green-500/10" : "border-slate-700 bg-slate-900/50"}`}>
                          <span className={`w-5 text-center text-sm font-bold ${active ? "text-amber-300" : done ? "text-green-300" : "text-slate-500"}`}>{done ? "✓" : active ? "➜" : index + 1}</span>
                          <span className="min-w-0 flex-1 text-sm font-bold text-white">{term.name}</span>
                          <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${term.category === "Hard" ? "bg-fuchsia-400/15 text-fuchsia-200" : term.category === "Geography" ? "bg-sky-400/15 text-sky-200" : "bg-green-400/15 text-green-200"}`}>{term.category}</span>
                        </li>
                      );
                    })}
                  </ol>
                </aside>
              </div>
            </motion.section>
          )}

          {screen === "complete" && (
            <motion.section key="complete" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="mx-auto max-w-3xl">
              <div className={`rounded-lg border p-5 text-center sm:p-6 ${won ? "border-amber-300/60 bg-amber-300/10" : "border-red-500/50 bg-red-500/10"}`}>
                <p className="text-4xl">{won ? "🏆" : "🧭"}</p>
                <h1 className="mt-3 text-3xl font-extrabold text-white">{won ? "Map mastered!" : "Round complete"}</h1>
                <p className="mt-2 text-sm text-slate-300">{won ? `You placed all five terms in ${formatTime(elapsed)} with ${strikes} strike${strikes === 1 ? "" : "s"}.` : "Three strikes ended this round. Review the correct regions below and try again."}</p>
                {won && <p className="mt-3 text-xl font-extrabold text-amber-300">Round score: {(savedScore ?? score).toLocaleString()}</p>}
                {saveMessage && <p className="mt-3 text-xs font-semibold text-slate-300">{saveMessage}</p>}
                {!user && isLoaded && <button onClick={() => setLocation("/sign-in")} className="mt-4 rounded-lg bg-violet-400 px-4 py-2 text-xs font-bold text-slate-950">Sign in to save your map score</button>}
              </div>
              <div className="mt-4 overflow-hidden rounded-lg border border-slate-700 bg-slate-800">
                <div className="border-b border-slate-700 px-5 py-3 text-sm font-bold text-white">Round recap</div>
                {round.map((term, index) => (
                  <div key={term.id} className="flex items-center gap-3 border-b border-slate-700/60 px-5 py-3 last:border-0">
                    <span className="w-5 text-center text-xs font-bold text-slate-500">{index + 1}</span>
                    <span className="flex-1 text-sm font-bold text-slate-100">{term.name}</span>
                    <span className="hidden rounded bg-slate-700 px-2 py-1 text-[10px] font-bold text-slate-300 sm:inline">{term.category}</span>
                    <span className="text-xs font-semibold text-amber-200">{term.region}</span>
                  </div>
                ))}
              </div>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <button onClick={startRound} className="flex-1 rounded-lg bg-gradient-to-r from-violet-500 to-pink-500 px-5 py-3 text-sm font-extrabold text-white">Play another round</button>
                <button onClick={() => setScreen("setup")} className="rounded-lg border border-slate-600 px-5 py-3 text-sm font-bold text-slate-200 hover:bg-slate-800">Change time period</button>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {showNamePrompt && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
            <motion.div initial={{ y: 16, scale: 0.97 }} animate={{ y: 0, scale: 1 }} className="w-full max-w-sm rounded-2xl border border-slate-600 bg-slate-800 p-6 shadow-2xl">
              <h2 className="text-lg font-extrabold text-white">Join the map leaderboard</h2>
              <p className="mt-1 text-sm text-slate-400">Choose a display name to save this finished round.</p>
              <input autoFocus value={displayName} onChange={(event) => { setDisplayName(event.target.value); setNameError(""); }} onKeyDown={(event) => event.key === "Enter" && void saveName()} maxLength={50} placeholder="Display name" className="mt-4 w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none focus:border-amber-300" />
              {nameError && <p className="mt-2 text-xs text-red-300">{nameError}</p>}
              <button onClick={() => void saveName()} className="mt-4 w-full rounded-lg bg-amber-300 px-4 py-2.5 text-sm font-extrabold text-slate-950">Save map score</button>
            </motion.div>
          </motion.div>
        )}
        {showLeaderboard && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={(event) => event.target === event.currentTarget && setShowLeaderboard(false)} className="fixed inset-0 z-40 overflow-y-auto bg-black/75 p-4 backdrop-blur-sm">
            <motion.div initial={{ y: 18, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="mx-auto my-8 w-full max-w-2xl rounded-2xl border border-slate-600 bg-slate-800 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-700 p-5">
                <div><h2 className="font-extrabold text-white">🏆 Map Leaderboard</h2><p className="mt-0.5 text-xs text-slate-400">Best cumulative score across a winning streak</p></div>
                <button onClick={() => setShowLeaderboard(false)} className="text-xl text-slate-400 hover:text-white">✕</button>
              </div>
              <div className="flex gap-2 overflow-x-auto border-b border-slate-700 px-4 py-3">
                {(["all", ...MAP_PERIODS] as const).map((option) => <button key={option} onClick={() => void openLeaderboard(option)} className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-bold ${leaderboardPeriod === option ? "bg-amber-300 text-slate-950" : "bg-slate-700 text-slate-300 hover:bg-slate-600"}`}>{option === "all" ? "All Periods" : option}</button>)}
              </div>
              <div className="p-4">
                {leaderboardLoading ? <p className="py-10 text-center text-sm text-slate-400">Loading leaderboard…</p> : leaderboard.length === 0 ? <p className="py-10 text-center text-sm text-slate-400">No map rounds saved for this period yet.</p> : (
                  <div className="overflow-hidden rounded-xl border border-slate-700">
                    {leaderboard.map((entry) => <div key={`${entry.rank}-${entry.displayName}`} className="grid grid-cols-[42px_1fr_auto] items-center gap-3 border-b border-slate-700/70 px-4 py-3 last:border-0">
                      <span className={`text-center text-sm font-extrabold ${entry.rank <= 3 ? "text-amber-300" : "text-slate-500"}`}>#{entry.rank}</span>
                      <div><p className="text-sm font-bold text-white">{entry.displayName}</p><p className="text-[10px] text-slate-400">{entry.totalWins} wins · best streak {entry.bestStreak}</p></div>
                      <span className="font-mono text-sm font-bold text-amber-200">{entry.bestScore.toLocaleString()}</span>
                    </div>)}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <footer className="mx-auto max-w-4xl px-4 pb-5 pt-1 text-center text-[11px] text-slate-600">
        <p>Scholle's AP World History Challenge — Designed by Grace Ji — Dawson HS, Pearland ISD</p>
        <p className="mt-0.5">Questions or comments? goforfivehistory@gmail.com</p>
      </footer>
    </div>
  );
}