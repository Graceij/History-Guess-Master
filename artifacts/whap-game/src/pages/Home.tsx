import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "@clerk/react";
import { useLocation } from "wouter";
import { GAME_DATA, UNIT_LABELS } from "../data/gameData";
import {
  evaluateGuess,
  getRandomEntry,
  GuessResult,
  MatchResult,
} from "../lib/gameLogic";

const ALL_UNIT_NUMS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

const LB_TABS = [
  { key: "all",    label: "All Units" },
  { key: "unit_1", label: "Unit 1"    },
  { key: "unit_2", label: "Unit 2"    },
  { key: "unit_3", label: "Unit 3"    },
  { key: "unit_4", label: "Unit 4"    },
  { key: "unit_5", label: "Unit 5"    },
  { key: "unit_6", label: "Unit 6"    },
  { key: "unit_7", label: "Unit 7"    },
  { key: "unit_8", label: "Unit 8"    },
  { key: "unit_9", label: "Unit 9"    },
];

const UNIT_SHORT: Record<number, string> = {
  1: "Unit 1 – Global Tapestry",
  2: "Unit 2 – Networks of Exchange",
  3: "Unit 3 – Land Based Empires",
  4: "Unit 4 – Transoceanic Interconnections",
  5: "Unit 5 – Revolutions",
  6: "Unit 6 – Consequences of Industrialization",
  7: "Unit 7 – Global Conflict",
  8: "Unit 8 – Cold War & Decolonization",
  9: "Unit 9 – Globalization",
};

const MAX_GUESSES = 7;

const COL_HEADERS = ["Category", "Religion", "Region", "Unit"];
const COL_HEADERS_SHORT = ["Type", "Faith", "Region", "Unit"];
const COL_KEYS: (keyof Omit<GuessResult, "name" | "unitDirection">)[] = [
  "whatIsIt",
  "religion",
  "geographicArea",
  "unit",
];

const GEO_SHORT: Record<string, string> = {
  "Latin America/Caribbean": "Lat. Am.",
  "North America":           "N. Am.",
  "South Asia":              "S. Asia",
  "East Asia":               "E. Asia",
  "Southeast Asia":          "SE Asia",
  "Central Asia":            "C. Asia",
  "Middle East":             "M. East",
};
const TYPE_SHORT: Record<string, string> = {
  "Beliefs, Ideas & Concepts": "Beliefs",
  "Economics, Trade & Labor":  "Econ.",
  "Environmental":             "Enviro.",
  "Events & Movements":        "Events",
  "Innovation":                "Innov.",
  "People":                    "People",
  "Places & Networks":         "Places",
  "Society & Culture":         "Culture",
  "States & Organizations":    "States",
};
function shortGeo(s: string) { return GEO_SHORT[s] ?? s; }
function shortType(s: string) { return TYPE_SHORT[s] ?? s; }

interface MyEntry {
  displayName: string;
  dailyStreak: number;
  rank: number | null;
  bestScore: number | null;
  totalWins: number | null;
  currentStreak: number | null;
  bestStreak: number | null;
}

interface LbEntry {
  rank: number;
  displayName: string;
  bestScore: number;
  totalWins: number;
  currentStreak: number;
  bestStreak: number;
}

function cellColor(result: MatchResult) {
  if (result === "correct") return "bg-green-300 text-slate-800 border-green-400";
  if (result === "close") return "bg-amber-200 text-slate-800 border-amber-300";
  return "bg-red-400 text-slate-800 border-red-500";
}

function cellIcon(result: MatchResult) {
  if (result === "correct") return "✓";
  if (result === "close") return "~";
  return "✗";
}

function formatTime(secs: number) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function GuessRow({
  result,
  entry,
  animate,
}: {
  result: GuessResult;
  entry: { whatIsIt: string; religion: string; geographicArea: string; unit: string; unitNum: number };
  animate: boolean;
}) {
  const cells: {
    key: keyof Omit<GuessResult, "name" | "unitDirection">;
    full: string | React.ReactNode;
    short: string | React.ReactNode;
  }[] = [
    { key: "whatIsIt",       full: entry.whatIsIt,      short: shortType(entry.whatIsIt) },
    { key: "religion",       full: entry.religion,       short: entry.religion },
    { key: "geographicArea", full: entry.geographicArea, short: shortGeo(entry.geographicArea) },
    {
      key: "unit",
      full: (
        <>
          {entry.unit}
          {result.unit !== "correct" && result.unitDirection && (
            <div className="text-xs font-bold italic">
              {result.unitDirection === "higher" ? "later" : "earlier"}
            </div>
          )}
        </>
      ),
      short: (
        <>
          {`U${entry.unitNum}`}
          {result.unit !== "correct" && result.unitDirection && (
            <span className="font-bold ml-0.5">
              {result.unitDirection === "higher" ? "↑" : "↓"}
            </span>
          )}
        </>
      ),
    },
  ];

  return (
    <motion.div
      initial={animate ? { opacity: 0, y: 20 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="grid grid-cols-[1.7fr_1fr_1fr_1fr_0.85fr] sm:grid-cols-5 gap-1 sm:gap-1.5 mb-1 sm:mb-1.5"
    >
      <div className="flex items-center bg-slate-700 border border-slate-600 rounded-md sm:rounded-lg px-1.5 sm:px-3 py-1 sm:py-2.5">
        <span className="text-white font-extrabold text-[10px] sm:text-sm leading-tight break-words min-w-0">
          {result.name}
        </span>
      </div>
      {cells.map((cell) => (
        <motion.div
          key={cell.key}
          initial={animate ? { scale: 0.8, opacity: 0 } : false}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          className={`flex flex-col items-center justify-center rounded-md sm:rounded-lg border px-0.5 sm:px-2 py-1 sm:py-2.5 text-center ${cellColor(result[cell.key])}`}
        >
          <span className="text-xs sm:text-base font-bold leading-none">
            {cellIcon(result[cell.key])}
          </span>
          <span className="text-[9px] sm:text-xs font-medium mt-0.5 leading-tight">
            <span className="sm:hidden">{cell.short}</span>
            <span className="hidden sm:inline">{cell.full}</span>
          </span>
        </motion.div>
      ))}
    </motion.div>
  );
}

function LegendBadge({ color, label }: { color: string; label: string }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold ${color}`}>
      {label}
    </span>
  );
}

export default function Home() {
  const { user, isLoaded } = useUser();
  const [, setLocation] = useLocation();
  const isSignedIn = isLoaded && !!user;

  // Game state
  const [selectedUnits, setSelectedUnits] = useState<number[]>(ALL_UNIT_NUMS);
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  const filteredPool = GAME_DATA.filter((e) => selectedUnits.includes(e.unitNum));
  const noUnitsSelected = selectedUnits.length === 0;

  const [answer, setAnswer] = useState(() => getRandomEntry(GAME_DATA));
  const [guesses, setGuesses] = useState<GuessResult[]>([]);
  const [guessEntries, setGuessEntries] = useState<typeof GAME_DATA>([]);
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [score, setScore] = useState({ wins: 0, losses: 0, played: 0 });
  const [errorMsg, setErrorMsg] = useState("");
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const [showAnswer, setShowAnswer] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const answerBannerRef = useRef<HTMLDivElement>(null);
  const playedIds = useRef<number[]>([]);

  // Timer — only starts when user begins typing
  const gameStartTimeRef = useRef<number>(Date.now());
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [finalTime, setFinalTime] = useState(0);
  const [finalScore, setFinalScore] = useState(0);

  // Leaderboard / account
  const [myEntry, setMyEntry] = useState<MyEntry | null>(null);
  const [myEntryLoaded, setMyEntryLoaded] = useState(false);
  const [showDisplayNamePrompt, setShowDisplayNamePrompt] = useState(false);
  const [displayNameInput, setDisplayNameInput] = useState("");
  const [displayNameError, setDisplayNameError] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LbEntry[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [lbFilter, setLbFilter] = useState<string>("all");
  const leaderboardUserRowRef = useRef<HTMLTableRowElement>(null);

  // Pending game result waiting for display name
  const pendingResultRef = useRef<{
    won: boolean; score: number; guessesUsed: number; timeSeconds: number; unitFilter: string;
  } | null>(null);

  // Load user's leaderboard entry when signed in
  useEffect(() => {
    if (!isSignedIn) { setMyEntry(null); setMyEntryLoaded(true); return; }
    fetch("/api/me/leaderboard")
      .then((r) => r.json())
      .then((data) => { setMyEntry(data); setMyEntryLoaded(true); })
      .catch(() => { setMyEntry(null); setMyEntryLoaded(true); });
  }, [isSignedIn]);

  // Timer tick — only runs after user types first character
  useEffect(() => {
    if (gameOver || !timerActive) return;
    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - gameStartTimeRef.current) / 1000));
    }, 500);
    return () => clearInterval(interval);
  }, [gameOver, timerActive]);

  // Scroll banner into view on game over
  useEffect(() => {
    if (showAnswer && answerBannerRef.current) {
      setTimeout(() => {
        answerBannerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 200);
    }
  }, [showAnswer]);

  // Scroll to user row in leaderboard
  useEffect(() => {
    if (showLeaderboard && myEntry && leaderboardUserRowRef.current) {
      setTimeout(() => {
        leaderboardUserRowRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 300);
    }
  }, [showLeaderboard, leaderboard, myEntry]);

  // Close filter panel on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Lock body scroll when modals open
  useEffect(() => {
    document.body.style.overflow = showLeaderboard || showDisplayNamePrompt ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [showLeaderboard, showDisplayNamePrompt]);

  // Determine which leaderboard filter applies to the current game
  function getUnitFilter(): string | null {
    if (selectedUnits.length === ALL_UNIT_NUMS.length) return "all";
    if (selectedUnits.length === 1) return `unit_${selectedUnits[0]}`;
    return null; // 2-8 units = practice mode
  }

  async function apiSubmitScore(
    didWin: boolean, sc: number, guessesUsed: number, timeSeconds: number,
    unitFilter: string, termName?: string, displayName?: string,
  ): Promise<MyEntry | null> {
    try {
      const res = await fetch("/api/leaderboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score: sc, guessesUsed, timeSeconds, won: didWin, unitFilter, termName, displayName }),
      });
      if (res.status === 409) {
        const data = await res.json();
        setDisplayNameError(data.error ?? "That name is already taken.");
        return null;
      }
      if (!res.ok) return null;
      return (await res.json()) as MyEntry;
    } catch {
      return null;
    }
  }

  async function fetchLeaderboard(filter: string) {
    setLeaderboardLoading(true);
    setLbFilter(filter);
    try {
      const res = await fetch(`/api/leaderboard?filter=${encodeURIComponent(filter)}`);
      if (!res.ok) { setLeaderboard([]); return; }
      const data = await res.json();
      setLeaderboard(Array.isArray(data) ? data : []);
    } catch {
      setLeaderboard([]);
    } finally {
      setLeaderboardLoading(false);
    }
  }

  function openLeaderboard() {
    const gf = getUnitFilter() ?? "all";
    setShowLeaderboard(true);
    fetchLeaderboard(gf);
  }

  function toggleUnit(u: number) {
    setSelectedUnits((prev) => prev.includes(u) ? prev.filter((x) => x !== u) : [...prev, u]);
  }
  function selectAllUnits() { setSelectedUnits(ALL_UNIT_NUMS); }
  function clearAllUnits() { setSelectedUnits([]); }

  const guessedNames = guesses.map((g) => g.name);
  // Full alphabetical list of unguessed terms — always shown in the dropdown
  const allSortedNames = filteredPool
    .map((e) => e.name)
    .filter((n) => !guessedNames.includes(n))
    .sort((a, b) => a.localeCompare(b));

  // Find the best match index for auto-scroll + keyboard highlight
  const bestMatchIdx = (() => {
    const q = input.trim().toLowerCase();
    if (!q) return -1;
    // Tier 1: starts with input
    let idx = allSortedNames.findIndex((n) => n.toLowerCase().startsWith(q));
    if (idx >= 0) return idx;
    // Tier 2: any word starts with input
    idx = allSortedNames.findIndex((n) => n.toLowerCase().split(/\s+/).some((w) => w.startsWith(q)));
    if (idx >= 0) return idx;
    // Tier 3: contains input anywhere
    idx = allSortedNames.findIndex((n) => n.toLowerCase().includes(q));
    return idx;
  })();

  const scrollTargetRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const q = input.trim();
    if (q.length === 0) { setShowSuggestions(false); setHighlightIdx(-1); return; }
    setShowSuggestions(true);
    setHighlightIdx(bestMatchIdx);
  }, [input, bestMatchIdx]);

  // Auto-scroll the dropdown to the best match whenever it changes
  useEffect(() => {
    if (showSuggestions && scrollTargetRef.current) {
      scrollTargetRef.current.scrollIntoView({ block: "nearest" });
    }
  }, [bestMatchIdx, showSuggestions]);

  function selectSuggestion(name: string) {
    setInput(name);
    setShowSuggestions(false);
    inputRef.current?.focus();
  }

  function submitGuess(nameOverride?: string) {
    const name = (nameOverride ?? input).trim();
    if (!name) return;

    if (guessedNames.includes(name)) {
      setErrorMsg("You already guessed that!");
      setTimeout(() => setErrorMsg(""), 2000);
      return;
    }

    const entry = GAME_DATA.find((e) => e.name.toLowerCase() === name.toLowerCase());
    if (!entry) {
      setErrorMsg("Not found in the list — pick from the suggestions.");
      setTimeout(() => setErrorMsg(""), 2500);
      return;
    }

    const result = evaluateGuess(entry, answer);
    const newGuesses = [...guesses, result];
    const newEntries = [...guessEntries, entry];
    setGuesses(newGuesses);
    setGuessEntries(newEntries);
    setInput("");
    setSuggestions([]);
    setShowSuggestions(false);

    const isWin = entry.id === answer.id;
    const now = Math.floor((Date.now() - gameStartTimeRef.current) / 1000);

    if (isWin) {
      const sc = (MAX_GUESSES - newGuesses.length) * 1000 - now;
      setFinalTime(now);
      setFinalScore(sc);
      setWon(true);
      setGameOver(true);
      setShowAnswer(true);
      setScore((s) => ({ ...s, wins: s.wins + 1, played: s.played + 1 }));
      handleGameEnd(true, sc, newGuesses.length, now);
    } else if (newGuesses.length >= MAX_GUESSES) {
      setFinalTime(now);
      setGameOver(true);
      setShowAnswer(true);
      setScore((s) => ({ ...s, losses: s.losses + 1, played: s.played + 1 }));
      handleGameEnd(false, 0, newGuesses.length, now);
    }
  }

  function handleGameEnd(didWin: boolean, sc: number, guessesUsed: number, timeSeconds: number) {
    if (!isSignedIn) return;
    const unitFilter = getUnitFilter();
    if (!unitFilter) return; // practice mode — no submission
    if (myEntry) {
      apiSubmitScore(didWin, sc, guessesUsed, timeSeconds, unitFilter, answer.name).then((updated) => {
        if (updated) setMyEntry(updated);
      });
    } else if (myEntryLoaded) {
      pendingResultRef.current = { won: didWin, score: sc, guessesUsed, timeSeconds, unitFilter };
      setTimeout(() => setShowDisplayNamePrompt(true), 900);
    }
  }

  async function handleSetDisplayName() {
    const dn = displayNameInput.trim();
    if (!dn) { setDisplayNameError("Please enter a display name."); return; }
    if (dn.length > 50) { setDisplayNameError("Must be 50 characters or less."); return; }
    setDisplayNameError("");
    setSubmitLoading(true);

    const pending = pendingResultRef.current;
    if (pending) {
      const result = await apiSubmitScore(
        pending.won, pending.score, pending.guessesUsed, pending.timeSeconds,
        pending.unitFilter, answer.name, dn,
      );
      if (result) {
        setMyEntry(result);
        pendingResultRef.current = null;
        setShowDisplayNamePrompt(false);
        setDisplayNameInput("");
      }
    }
    setSubmitLoading(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (showSuggestions && allSortedNames.length > 0) {
      if (e.key === "ArrowDown") { e.preventDefault(); setHighlightIdx((i) => Math.min(i + 1, allSortedNames.length - 1)); return; }
      if (e.key === "ArrowUp") { e.preventDefault(); setHighlightIdx((i) => Math.max(i - 1, -1)); return; }
      if (e.key === "Enter" && highlightIdx >= 0) { e.preventDefault(); selectSuggestion(allSortedNames[highlightIdx]); return; }
      if (e.key === "Escape") { setShowSuggestions(false); return; }
    }
    if (e.key === "Enter") { e.preventDefault(); submitGuess(); }
  }

  function newGame(pool = filteredPool) {
    if (pool.length === 0) return;
    playedIds.current.push(answer.id);
    const next = getRandomEntry(pool, playedIds.current);
    setAnswer(next);
    setGuesses([]);
    setGuessEntries([]);
    setInput("");
    setShowSuggestions(false);
    setGameOver(false);
    setWon(false);
    setShowAnswer(false);
    setErrorMsg("");
    setHighlightIdx(-1);
    setFinalTime(0);
    setFinalScore(0);
    setElapsedSeconds(0);
    setTimerActive(false);
    gameStartTimeRef.current = Date.now();
    setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 100);
  }

  const remaining = MAX_GUESSES - guesses.length;
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

  // Computed for rendering
  const unitFilter = getUnitFilter();
  const isPracticeMode = unitFilter === null;
  const isSingleUnit = selectedUnits.length === 1;
  const myInitial = (myEntry?.displayName ?? user?.primaryEmailAddress?.emailAddress ?? "?")[0].toUpperCase();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white">

      {/* ── Display Name Prompt Modal ── */}
      <AnimatePresence>
        {showDisplayNamePrompt && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-slate-800 border border-violet-500/60 rounded-2xl p-6 w-full max-w-sm shadow-2xl"
            >
              <div className="text-3xl text-center mb-2">🏆</div>
              <h2 className="text-lg font-extrabold text-white text-center mb-1">
                Pick Your Display Name
              </h2>
              <p className="text-slate-400 text-sm text-center mb-4">
                This is what shows on the leaderboard. It's permanent and unique to your account.
              </p>
              <input
                type="text"
                value={displayNameInput}
                onChange={(e) => { setDisplayNameInput(e.target.value); setDisplayNameError(""); }}
                onKeyDown={(e) => { if (e.key === "Enter") handleSetDisplayName(); }}
                placeholder="Your display name…"
                maxLength={50}
                className="w-full bg-slate-700 border border-slate-600 focus:border-violet-400 rounded-lg px-4 py-2.5 text-white placeholder-slate-400 outline-none text-sm mb-2"
                autoFocus
              />
              {displayNameError && (
                <p className="text-red-400 text-xs mb-2">{displayNameError}</p>
              )}
              <button
                onClick={handleSetDisplayName}
                disabled={submitLoading}
                className="w-full bg-gradient-to-r from-violet-400 to-pink-400 hover:from-violet-300 hover:to-pink-300 disabled:opacity-50 text-slate-900 font-bold py-2.5 rounded-lg text-sm transition-all"
              >
                {submitLoading ? "Saving…" : "Save & Submit Score"}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Leaderboard Modal ── */}
      <AnimatePresence>
        {showLeaderboard && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) setShowLeaderboard(false); }}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-slate-800 border border-slate-600 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[85vh]"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-700 shrink-0">
                <div>
                  <h2 className="text-lg font-extrabold text-white">🏆 Leaderboard</h2>
                  <p className="text-slate-400 text-xs mt-0.5">Top 50 per board · ranked by best score</p>
                </div>
                <button onClick={() => setShowLeaderboard(false)} className="text-slate-400 hover:text-white text-xl leading-none px-1">✕</button>
              </div>

              {/* Filter tabs */}
              <div className="flex gap-1.5 px-4 py-2.5 overflow-x-auto border-b border-slate-700 shrink-0 scrollbar-hide">
                {LB_TABS.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => fetchLeaderboard(tab.key)}
                    className={`shrink-0 px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                      lbFilter === tab.key
                        ? "bg-violet-600 text-white"
                        : "bg-slate-700 text-slate-400 hover:text-white"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* My stats bar */}
              {isSignedIn && myEntry && (
                <div className="px-5 py-2.5 bg-violet-900/30 border-b border-violet-700/40 shrink-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-violet-300 font-bold text-sm">{myEntry.displayName}</span>
                      {myEntry.rank !== null && (
                        <span className="text-slate-400 text-xs ml-2">#{myEntry.rank} All Units</span>
                      )}
                    </div>
                    <div className="flex gap-4 text-center">
                      <div>
                        <div className="text-green-300 font-bold text-sm">{myEntry.totalWins ?? "—"}</div>
                        <div className="text-slate-500 text-[10px]">Wins</div>
                      </div>
                      <div>
                        <div className="text-amber-300 font-bold text-sm">
                          {myEntry.bestScore !== null ? myEntry.bestScore.toLocaleString() : "—"}
                        </div>
                        <div className="text-slate-500 text-[10px]">Best</div>
                      </div>
                      <div>
                        <div className="text-orange-300 font-bold text-sm">🔥 {myEntry.dailyStreak}</div>
                        <div className="text-slate-500 text-[10px]">Daily</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Sign-in CTA */}
              {!isSignedIn && (
                <div className="px-5 py-3 bg-slate-700/40 border-b border-slate-700 shrink-0 flex items-center justify-between gap-3">
                  <p className="text-slate-400 text-xs">Sign in to track your scores!</p>
                  <button
                    onClick={() => { setShowLeaderboard(false); setLocation("/sign-in"); }}
                    className="text-violet-300 hover:text-violet-200 text-xs font-semibold whitespace-nowrap"
                  >
                    Sign In →
                  </button>
                </div>
              )}

              {/* Table */}
              <div className="overflow-y-auto flex-1">
                {leaderboardLoading ? (
                  <div className="flex items-center justify-center py-16 text-slate-400 text-sm">Loading…</div>
                ) : leaderboard.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-slate-400 text-sm gap-2">
                    <span className="text-3xl">🏜️</span>
                    <span>No scores yet — be the first!</span>
                  </div>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-slate-800 border-b border-slate-700">
                      <tr>
                        <th className="text-left text-xs text-slate-400 font-semibold px-4 py-2.5 w-10">#</th>
                        <th className="text-left text-xs text-slate-400 font-semibold px-2 py-2.5">Player</th>
                        <th className="text-right text-xs text-slate-400 font-semibold px-2 py-2.5">Best</th>
                        <th className="text-right text-xs text-slate-400 font-semibold px-2 py-2.5">Wins</th>
                        <th className="text-right text-xs text-slate-400 font-semibold px-4 py-2.5">Streak</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaderboard.map((entry) => {
                        const isMe = myEntry?.displayName === entry.displayName;
                        return (
                          <tr
                            key={entry.displayName}
                            ref={isMe ? leaderboardUserRowRef : undefined}
                            className={`border-b border-slate-700/50 transition-colors ${isMe ? "bg-violet-900/30 border-l-2 border-l-violet-400" : "hover:bg-slate-700/30"}`}
                          >
                            <td className="px-4 py-2.5 text-slate-400 text-xs font-mono">
                              {entry.rank <= 3 ? ["🥇","🥈","🥉"][entry.rank - 1] : entry.rank}
                            </td>
                            <td className="px-2 py-2.5">
                              <span className={`font-semibold ${isMe ? "text-violet-300" : "text-white"}`}>{entry.displayName}</span>
                              {isMe && <span className="ml-1.5 text-[10px] text-violet-400 font-bold">YOU</span>}
                            </td>
                            <td className="px-2 py-2.5 text-right text-amber-300 font-bold font-mono">{entry.bestScore.toLocaleString()}</td>
                            <td className="px-2 py-2.5 text-right text-green-300 font-medium">{entry.totalWins}</td>
                            <td className="px-4 py-2.5 text-right text-orange-300 font-medium">
                              {entry.currentStreak > 0 ? `🔥 ${entry.currentStreak}` : "—"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
              <div className="px-5 py-3 border-t border-slate-700 text-center shrink-0">
                <p className="text-slate-500 text-xs">Score = (7 − guesses) × 1000 − seconds</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── MOBILE Header (compact single row) ── */}
      <header className="border-b border-slate-700 bg-[#0a0e28] sticky top-0 z-10">
        {/* Mobile */}
        <div className="sm:hidden flex items-center gap-2 px-3 py-2">
          <img
            src={`${basePath}/go-for-five.png`}
            alt="Go For Five"
            className="h-9 w-auto shrink-0"
            style={{ objectFit: "contain" }}
          />
          <div className="flex items-center gap-3 ml-auto">
            {/* Session stats */}
            <div className="flex gap-2 text-xs font-bold leading-none">
              <span>
                <span className="text-green-300">{score.wins}</span>
                <span className="text-slate-500 font-normal">W</span>
              </span>
              <span>
                <span className="text-red-400">{score.losses}</span>
                <span className="text-slate-500 font-normal">L</span>
              </span>
            </div>
            {/* Leaderboard */}
            <button
              onClick={openLeaderboard}
              className="p-1.5 bg-slate-700 hover:bg-violet-700 border border-slate-600 hover:border-violet-500 rounded-lg text-sm leading-none transition-colors"
              aria-label="Leaderboard"
            >🏆</button>
            {/* Auth */}
            {isLoaded && !isSignedIn && (
              <button
                onClick={() => setLocation("/sign-in")}
                className="px-2.5 py-1.5 bg-violet-600 hover:bg-violet-500 rounded-lg text-xs font-bold text-white transition-colors"
              >
                Sign In
              </button>
            )}
            {isSignedIn && (
              <button
                onClick={() => setLocation("/profile")}
                className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-sm font-extrabold text-white shrink-0 border-2 border-violet-400/50"
                aria-label="My profile"
              >
                {myInitial}
              </button>
            )}
          </div>
        </div>

        {/* Desktop */}
        <div className="hidden sm:block max-w-4xl mx-auto px-4 pt-1 pb-2">
          <div className="flex flex-col items-center gap-0.5">
            <img
              src={`${basePath}/go-for-five.png`}
              alt="Go For Five"
              className="w-full max-w-lg h-auto"
              style={{ maxHeight: "110px", objectFit: "contain" }}
            />
            <h1 className="text-base font-extrabold tracking-tight text-white leading-tight">
              AP World History Review Game
            </h1>
            <p className="text-slate-400 text-xs">Become an AP World History Master!</p>

            <div className="flex items-center gap-3 mt-1.5 flex-wrap justify-center">
              <div className="flex gap-5 text-center">
                <div><div className="text-base font-bold text-green-300">{score.wins}</div><div className="text-xs text-slate-400">Won</div></div>
                <div><div className="text-base font-bold text-red-400">{score.losses}</div><div className="text-xs text-slate-400">Lost</div></div>
                <div><div className="text-base font-bold text-slate-300">{score.played}</div><div className="text-xs text-slate-400">Played</div></div>
              </div>
              <button
                onClick={openLeaderboard}
                className="flex items-center gap-1.5 bg-slate-700/80 hover:bg-violet-700/60 border border-slate-600 hover:border-violet-500 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-200 hover:text-white transition-colors"
              >
                🏆 Leaderboard
              </button>
              {isLoaded && !isSignedIn && (
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setLocation("/sign-in")}
                    className="bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-200 hover:text-white transition-colors"
                  >Sign In</button>
                  <button
                    onClick={() => setLocation("/sign-up")}
                    className="bg-gradient-to-r from-violet-500 to-pink-500 hover:from-violet-400 hover:to-pink-400 rounded-lg px-3 py-1.5 text-xs font-bold text-white transition-colors"
                  >Sign Up</button>
                </div>
              )}
              {isSignedIn && (
                <button
                  onClick={() => setLocation("/profile")}
                  className="flex items-center gap-1.5 bg-slate-700/80 hover:bg-violet-700/60 border border-slate-600 hover:border-violet-500 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-200 hover:text-white transition-colors"
                >
                  <span className="w-5 h-5 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-[10px] font-extrabold text-white shrink-0">
                    {myInitial}
                  </span>
                  <span className="max-w-[80px] truncate">{myEntry?.displayName ?? "Profile"}</span>
                  {myEntry && myEntry.dailyStreak > 1 && (
                    <span className="text-orange-400">🔥{myEntry.dailyStreak}</span>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-3 sm:px-4 py-3 sm:py-6">

        {/* ── Unit Filter ── */}
        <div className="mb-3 sm:mb-4 relative" ref={filterRef}>
          <button
            onClick={() => setFilterOpen((o) => !o)}
            className="flex items-center gap-2 bg-slate-800 border border-slate-600 hover:border-violet-400 rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-white transition-colors"
          >
            <span>Filter by Unit</span>
            <span className="bg-slate-700 text-violet-300 text-xs px-2 py-0.5 rounded-full font-bold">
              {selectedUnits.length === 9 ? "All" : selectedUnits.length === 0 ? "None" : `${selectedUnits.length} / 9`}
            </span>
            {isPracticeMode && <span className="text-amber-400 text-[10px] font-bold hidden sm:inline">Practice</span>}
            {isSingleUnit && <span className="text-violet-400 text-[10px] font-bold hidden sm:inline">Unit {selectedUnits[0]} LB</span>}
            <span className="text-slate-400 text-xs ml-1">{filterOpen ? "▲" : "▼"}</span>
          </button>

          <AnimatePresence>
            {filterOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}
                className="absolute z-30 top-full left-0 mt-1.5 bg-slate-800 border border-slate-600 rounded-xl shadow-2xl p-3 min-w-72"
              >
                <div className="flex gap-2 mb-3">
                  <button onClick={selectAllUnits} className="flex-1 text-xs font-semibold bg-slate-700 hover:bg-violet-700 text-white rounded-lg py-1.5 transition-colors">Select All</button>
                  <button onClick={clearAllUnits} className="flex-1 text-xs font-semibold bg-slate-700 hover:bg-red-700 text-white rounded-lg py-1.5 transition-colors">Clear All</button>
                </div>
                <div className="mb-2 text-[10px] text-slate-400 px-1">
                  All 9 = main leaderboard · 1 unit = unit leaderboard · 2–8 = practice
                </div>
                <div className="space-y-1">
                  {ALL_UNIT_NUMS.map((u) => {
                    const checked = selectedUnits.includes(u);
                    const count = GAME_DATA.filter((e) => e.unitNum === u).length;
                    return (
                      <label key={u} className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors select-none ${checked ? "bg-violet-900/50 border border-violet-600" : "bg-slate-700/50 border border-transparent hover:bg-slate-700"}`}>
                        <input type="checkbox" checked={checked} onChange={() => toggleUnit(u)} className="accent-violet-400 w-4 h-4 cursor-pointer" />
                        <span className="text-sm text-white flex-1">{UNIT_SHORT[u]}</span>
                        <span className="text-xs text-slate-400">{count} terms</span>
                      </label>
                    );
                  })}
                </div>
                {noUnitsSelected && <p className="mt-3 text-xs text-red-400 text-center font-medium">Select at least one unit to play.</p>}
                <button
                  onClick={() => { setFilterOpen(false); if (!noUnitsSelected) newGame(filteredPool); }}
                  disabled={noUnitsSelected}
                  className="mt-3 w-full text-sm font-bold bg-gradient-to-r from-violet-300 to-pink-300 hover:from-violet-200 hover:to-pink-200 disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-500 text-slate-900 py-2 rounded-lg transition-colors"
                >
                  Apply & New Game
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Instructions — desktop full, mobile legend-only ── */}
        {/* Mobile legend */}
        <div className="sm:hidden flex items-center gap-1.5 mb-2.5 flex-wrap">
          <LegendBadge color="bg-green-300 text-slate-800" label="✓ Match" />
          <LegendBadge color="bg-amber-200 text-slate-800" label="~ Close" />
          <LegendBadge color="bg-red-400 text-slate-800" label="✗ Wrong" />
          <span className="text-slate-500 text-[10px] ml-0.5">Unit ↑↓ = later/earlier</span>
        </div>
        {/* Desktop instructions */}
        <div className="hidden sm:block mb-5 bg-slate-800/50 border border-slate-700 rounded-xl p-4">
          <p className="text-slate-200 text-sm mb-3">
            Guess the hidden AP World History person, place, event, or concept in{" "}
            <span className="bg-gradient-to-r from-violet-300 to-pink-300 bg-clip-text text-transparent font-extrabold">{MAX_GUESSES} tries</span>.
            After each guess, the colors show how close you are:
          </p>
          <div className="flex flex-wrap gap-2">
            <LegendBadge color="bg-green-300 text-slate-800" label="✓ Correct match" />
            <LegendBadge color="bg-amber-200 text-slate-800" label="~ Close (related)" />
            <LegendBadge color="bg-red-400 text-slate-800" label="✗ Wrong" />
          </div>
        </div>

        {/* ── Grid ── */}
        <div className="mb-3 sm:mb-4 sm:overflow-x-auto sm:-mx-2 sm:px-2">
          <div className="sm:min-w-[480px]">
            {/* Column headers */}
            <div className="grid grid-cols-[1.7fr_1fr_1fr_1fr_0.85fr] sm:grid-cols-5 gap-1 sm:gap-1.5 mb-1 sm:mb-2">
              <div className="text-[9px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider px-1.5 sm:px-3 py-1">
                <span className="sm:hidden">Guess</span><span className="hidden sm:inline">Your Guess</span>
              </div>
              {COL_HEADERS.map((h, i) => (
                <div key={h} className="text-[9px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider text-center px-0.5 sm:px-1 py-1">
                  <span className="sm:hidden">{COL_HEADERS_SHORT[i]}</span><span className="hidden sm:inline">{h}</span>
                </div>
              ))}
            </div>

            <AnimatePresence>
              {guesses.map((g, i) => (
                <GuessRow key={i} result={g} entry={guessEntries[i]} animate={i === guesses.length - 1} />
              ))}
            </AnimatePresence>

            {!gameOver && Array.from({ length: remaining }).map((_, i) => (
              <div key={`empty-${i}`} className="grid grid-cols-[1.7fr_1fr_1fr_1fr_0.85fr] sm:grid-cols-5 gap-1 sm:gap-1.5 mb-1 sm:mb-1.5">
                <div className={`h-8 sm:h-12 rounded-md sm:rounded-lg border ${i === 0 ? "border-slate-500 bg-slate-800/50" : "border-slate-700 bg-slate-800/20"}`} />
                {[0,1,2,3].map((j) => <div key={j} className={`h-8 sm:h-12 rounded-md sm:rounded-lg border ${i === 0 ? "border-slate-500 bg-slate-800/50" : "border-slate-700 bg-slate-800/20"}`} />)}
              </div>
            ))}
          </div>
        </div>

        {/* ── Game Over Banner ── */}
        <AnimatePresence>
          {showAnswer && (
            <motion.div
              ref={answerBannerRef}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className={`mb-5 rounded-xl border p-4 text-center ${won ? "bg-green-900/40 border-green-600" : "bg-red-900/40 border-red-600"}`}
            >
              <div className="text-2xl font-extrabold mb-1">{won ? "🎉 Correct!" : "Game Over"}</div>
              {won ? (
                <p className="text-green-300 text-sm mb-1">You got it in {guesses.length} {guesses.length === 1 ? "guess" : "guesses"}!</p>
              ) : (
                <p className="text-red-300 text-sm mb-1">Better luck next time!</p>
              )}

              {/* Score breakdown */}
              {won && (
                <div className="flex items-center justify-center gap-3 my-2 flex-wrap">
                  <div className="bg-slate-800/70 rounded-lg px-3 py-1.5 text-center">
                    <div className="text-amber-300 font-extrabold text-lg">{finalScore.toLocaleString()}</div>
                    <div className="text-slate-400 text-[10px] uppercase tracking-wider">Score</div>
                  </div>
                  <div className="bg-slate-800/70 rounded-lg px-3 py-1.5 text-center">
                    <div className="text-slate-200 font-bold text-base">{guesses.length}/{MAX_GUESSES}</div>
                    <div className="text-slate-400 text-[10px] uppercase tracking-wider">Guesses</div>
                  </div>
                  <div className="bg-slate-800/70 rounded-lg px-3 py-1.5 text-center">
                    <div className="text-slate-200 font-bold text-base">{formatTime(finalTime)}</div>
                    <div className="text-slate-400 text-[10px] uppercase tracking-wider">Time</div>
                  </div>
                  {myEntry && myEntry.currentStreak !== null && (
                    <div className="bg-violet-900/50 border border-violet-600 rounded-lg px-3 py-1.5 text-center">
                      <div className="text-violet-300 font-extrabold text-base">🔥 {myEntry.currentStreak}</div>
                      <div className="text-slate-400 text-[10px] uppercase tracking-wider">Streak</div>
                    </div>
                  )}
                </div>
              )}

              {/* Leaderboard submission note */}
              {!isSignedIn && (
                <div className="my-2 text-xs text-slate-400">
                  <button onClick={() => setLocation("/sign-up")} className="text-violet-400 hover:text-violet-300 font-semibold transition-colors">
                    Sign up
                  </button>{" "}to save scores &amp; track your streak!
                </div>
              )}
              {isSignedIn && isPracticeMode && (
                <div className="my-2 px-3 py-1.5 bg-amber-900/40 border border-amber-600/50 rounded-lg text-xs text-amber-300">
                  🎯 Practice mode — select all 9 units or a single unit to submit to a leaderboard.
                </div>
              )}
              {isSignedIn && isSingleUnit && (
                <div className="my-2 px-3 py-1.5 bg-violet-900/40 border border-violet-600/50 rounded-lg text-xs text-violet-300">
                  📊 Score saved to the Unit {selectedUnits[0]} leaderboard!
                </div>
              )}

              <p className="text-white font-bold text-lg">{answer.name}</p>

              {answer.description && (
                <motion.div
                  initial={{ scale: 0.5, opacity: 0, y: 10 }}
                  animate={{ scale: [0.5, 1.08, 1], opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.55, ease: "easeOut" }}
                  className="mt-3 mb-1 mx-auto max-w-sm rounded-xl border-2 border-amber-400 bg-amber-400/10 px-4 py-3 shadow-[0_0_24px_4px_rgba(251,191,36,0.35)]"
                >
                  <p className="text-xs font-bold uppercase tracking-widest text-amber-400 mb-1">📖 Did you know?</p>
                  <p className="text-white text-sm leading-snug font-medium">{answer.description}</p>
                </motion.div>
              )}

              <div className="mt-2 flex flex-wrap justify-center gap-2 text-xs text-slate-300">
                <span className="bg-slate-700 px-2 py-1 rounded">{answer.whatIsIt}</span>
                <span className="bg-slate-700 px-2 py-1 rounded">{answer.religion}</span>
                <span className="bg-slate-700 px-2 py-1 rounded">{answer.geographicArea}</span>
                <span className="bg-slate-700 px-2 py-1 rounded">{UNIT_LABELS[answer.unitNum]}</span>
              </div>

              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <button onClick={() => newGame()} className="bg-gradient-to-r from-violet-300 to-pink-300 hover:from-violet-200 hover:to-pink-200 text-slate-900 font-bold px-6 py-2 rounded-lg transition-colors text-sm">
                  Play Again
                </button>
                <button onClick={openLeaderboard} className="bg-slate-700 hover:bg-slate-600 border border-slate-600 text-white font-semibold px-5 py-2 rounded-lg transition-colors text-sm">
                  🏆 Leaderboard
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Input Area ── */}
        {!gameOver && (
          <div className="relative flex-1">
            {noUnitsSelected ? (
              <div className="flex items-center gap-3 bg-red-950/60 border border-red-700 rounded-xl px-4 py-3">
                <span className="text-red-400 text-lg">⚠️</span>
                <div>
                  <p className="text-red-300 text-sm font-semibold">Select at least one unit to play.</p>
                  <p className="text-red-400/70 text-xs mt-0.5">Use the "Filter by Unit" menu above to choose units.</p>
                </div>
              </div>
            ) : (
              <>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <div className="p-[2px] rounded-lg bg-gradient-to-r from-violet-300 to-pink-300 focus-within:from-violet-400 focus-within:to-pink-400 transition-all">
                      <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={(e) => {
                          const val = e.target.value;
                          setInput(val);
                          // Start timer on very first character typed
                          if (!timerActive && val.trim()) {
                            gameStartTimeRef.current = Date.now();
                            setTimerActive(true);
                          }
                        }}
                        onKeyDown={handleKeyDown}
                        onFocus={() => input.trim() && setShowSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                        placeholder={`Guess ${guesses.length + 1} of ${MAX_GUESSES}…`}
                        className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-white placeholder-slate-500 outline-none transition-colors text-[16px]"
                        autoCorrect="off" autoCapitalize="none" autoComplete="off" spellCheck={false}
                      />
                    </div>
                    {showSuggestions && allSortedNames.length > 0 && (
                      <div ref={dropdownRef} className="absolute z-20 bottom-full left-0 right-0 mb-1 bg-slate-800 border border-slate-600 rounded-lg shadow-xl overflow-y-auto max-h-60">
                        {allSortedNames.map((s, i) => (
                          <button
                            key={s}
                            ref={i === bestMatchIdx ? scrollTargetRef : undefined}
                            onMouseDown={() => selectSuggestion(s)}
                            className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${i === highlightIdx ? "bg-amber-500 text-slate-900 font-semibold" : "text-slate-200 hover:bg-slate-700"}`}
                          >{s}</button>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => submitGuess()}
                    disabled={!input.trim()}
                    className="bg-gradient-to-r from-violet-300 to-pink-300 hover:from-violet-200 hover:to-pink-200 disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-500 text-slate-900 font-bold px-4 sm:px-5 py-2.5 sm:py-3 rounded-lg transition-all text-sm whitespace-nowrap"
                  >
                    Guess
                  </button>
                </div>
                <AnimatePresence>
                  {errorMsg && (
                    <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-red-400 text-xs mt-1.5 ml-1">
                      {errorMsg}
                    </motion.p>
                  )}
                </AnimatePresence>
                <div className="flex items-center justify-between mt-1.5 ml-1">
                  <p className="text-white text-xs">{remaining} guess{remaining !== 1 ? "es" : ""} remaining</p>
                  <p className="text-slate-500 text-xs font-mono">⏱ {formatTime(elapsedSeconds)}</p>
                </div>
              </>
            )}
          </div>
        )}

        {/* Answer Reference */}
        {gameOver && (
          <div className="mt-4 sm:mt-6 bg-slate-800/50 border border-slate-700 rounded-xl p-4">
            <h3 className="text-sm font-bold text-slate-300 mb-2 uppercase tracking-wider">Answer Reference</h3>
            {answer.description && <p className="text-slate-200 text-sm mb-3 italic leading-relaxed">{answer.description}</p>}
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-slate-400">Term:</span> <span className="text-white font-medium">{answer.name}</span></div>
              <div><span className="text-slate-400">Type:</span> <span className="text-white">{answer.whatIsIt}</span></div>
              <div><span className="text-slate-400">Religion:</span> <span className="text-white">{answer.religion}</span></div>
              <div><span className="text-slate-400">Region:</span> <span className="text-white">{answer.geographicArea}</span></div>
              <div className="col-span-2"><span className="text-slate-400">Unit:</span> <span className="text-white">{UNIT_LABELS[answer.unitNum]}</span></div>
            </div>
          </div>
        )}

        <p className="text-center text-slate-600 text-xs mt-8">
          Scholle's AP World History Challenge — Dawson HS, Pearland ISD
        </p>
      </main>
    </div>
  );
}
