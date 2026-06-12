import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GAME_DATA, ALL_NAMES, UNIT_LABELS } from "../data/gameData";
import {
  evaluateGuess,
  getRandomEntry,
  GuessResult,
  MatchResult,
} from "../lib/gameLogic";

const ALL_UNIT_NUMS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

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

const MAX_GUESSES = 5;

const COL_HEADERS = ["What is it?", "Religion", "Geographic Area", "Unit"];
const COL_KEYS: (keyof Omit<GuessResult, "name" | "unitDirection">)[] = [
  "whatIsIt",
  "religion",
  "geographicArea",
  "unit",
];

function cellColor(result: MatchResult) {
  if (result === "correct")
    return "bg-green-300 text-slate-800 border-green-400";
  if (result === "close") return "bg-amber-200 text-slate-800 border-amber-300";
  return "bg-red-400 text-slate-800 border-red-500";
}

function cellIcon(result: MatchResult) {
  if (result === "correct") return "✓";
  if (result === "close") return "~";
  return "✗";
}

function GuessRow({
  result,
  entry,
  animate,
}: {
  result: GuessResult;
  entry: {
    whatIsIt: string;
    religion: string;
    geographicArea: string;
    unit: string;
  };
  animate: boolean;
}) {
  const cells: {
    key: keyof Omit<GuessResult, "name" | "unitDirection">;
    value: string | React.ReactNode;
  }[] = [
    { key: "whatIsIt", value: entry.whatIsIt },
    { key: "religion", value: entry.religion },
    { key: "geographicArea", value: entry.geographicArea },
    {
  key: "unit",
      value: (
        <>
          {entry.unit}
          {result.unit !== "correct" && result.unitDirection && (
            <div className="text-xs font-bold italic">
              {result.unitDirection === "higher" ? "later" : "earlier"}
            </div>
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
      className="grid grid-cols-5 gap-1.5 mb-1.5"
    >
      {/* Name column */}
      <div className="flex items-center bg-slate-700 border border-slate-600 rounded-lg px-3 py-2.5">
        <span className="text-white font-extrabold text-sm leading-tight">
          {result.name}
        </span>
      </div>
      {/* Category columns */}
      {cells.map((cell) => (
        <motion.div
          key={cell.key}
          initial={animate ? { scale: 0.8, opacity: 0 } : false}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          className={`flex flex-col items-center justify-center rounded-lg border px-2 py-2.5 text-center ${cellColor(result[cell.key])}`}
        >
          <span className="text-base font-bold">
            {cellIcon(result[cell.key])}
          </span>
          <span className="text-xs font-medium mt-0.5 leading-tight">
            {cell.value}
          </span>
        </motion.div>
      ))}
    </motion.div>
  );
}

function LegendBadge({ color, label }: { color: string; label: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${color}`}
    >
      {label}
    </span>
  );
}

export default function Home() {
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
  const playedIds = useRef<number[]>([]);

  // Close filter panel when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function toggleUnit(unitNum: number) {
    setSelectedUnits((prev) =>
      prev.includes(unitNum) ? prev.filter((u) => u !== unitNum) : [...prev, unitNum]
    );
  }

  function selectAllUnits() { setSelectedUnits(ALL_UNIT_NUMS); }
  function clearAllUnits() { setSelectedUnits([]); }

  const guessedNames = guesses.map((g) => g.name);

  const poolNames = filteredPool.map((e) => e.name).sort((a, b) => a.localeCompare(b));

  useEffect(() => {
    if (input.trim().length === 0) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    const chars = input.toLowerCase().split("").filter((c) => c !== " ");
    const filtered = poolNames
      .filter((n) => {
        const lower = n.toLowerCase();
        return chars.every((c) => lower.includes(c)) && !guessedNames.includes(n);
      })
      .slice(0, 10);
    setSuggestions(filtered);
    setShowSuggestions(filtered.length > 0);
    setHighlightIdx(-1);
  }, [input]);

  function selectSuggestion(name: string) {
    setInput(name);
    setShowSuggestions(false);
    setSuggestions([]);
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

    const entry = GAME_DATA.find(
      (e) => e.name.toLowerCase() === name.toLowerCase(),
    );
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
    if (isWin) {
      setWon(true);
      setGameOver(true);
      setShowAnswer(true);
      setScore((s) => ({ ...s, wins: s.wins + 1, played: s.played + 1 }));
    } else if (newGuesses.length >= MAX_GUESSES) {
      setGameOver(true);
      setShowAnswer(true);
      setScore((s) => ({ ...s, losses: s.losses + 1, played: s.played + 1 }));
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (showSuggestions && suggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightIdx((i) => Math.min(i + 1, suggestions.length - 1));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightIdx((i) => Math.max(i - 1, -1));
        return;
      }
      if (e.key === "Enter" && highlightIdx >= 0) {
        e.preventDefault();
        selectSuggestion(suggestions[highlightIdx]);
        return;
      }
      if (e.key === "Escape") {
        setShowSuggestions(false);
        return;
      }
    }
    if (e.key === "Enter") {
      e.preventDefault();
      submitGuess();
    }
  }

  function newGame(pool = filteredPool) {
    if (pool.length === 0) return;
    playedIds.current.push(answer.id);
    const next = getRandomEntry(pool, playedIds.current);
    setAnswer(next);
    setGuesses([]);
    setGuessEntries([]);
    setInput("");
    setSuggestions([]);
    setShowSuggestions(false);
    setGameOver(false);
    setWon(false);
    setShowAnswer(false);
    setErrorMsg("");
    setHighlightIdx(-1);
    setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 100);
  }

  const remaining = MAX_GUESSES - guesses.length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Header */}
      <header className="border-b border-slate-700 bg-[#0a0e28] sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 pt-3 pb-2 flex flex-col items-center gap-0.5">
          {/* Wide logo — centered */}
          <img
            src={`${import.meta.env.BASE_URL}go-for-five.png`}
            alt="Go For Five"
            className="w-full max-w-lg h-auto"
            style={{ maxHeight: "110px", objectFit: "contain" }}
          />
          {/* Title + subtitle */}
          <h1 className="text-base font-extrabold tracking-tight text-white leading-tight">
            AP World History Review Game
          </h1>
          <p className="text-slate-400 text-xs">Become an AP World History Master!</p>
          {/* Score stats */}
          <div className="flex gap-6 text-center mt-1.5">
            <div>
              <div className="text-base font-bold text-green-300">{score.wins}</div>
              <div className="text-xs text-slate-400">Won</div>
            </div>
            <div>
              <div className="text-base font-bold text-red-400">{score.losses}</div>
              <div className="text-xs text-slate-400">Lost</div>
            </div>
            <div>
              <div className="text-base font-bold text-slate-300">{score.played}</div>
              <div className="text-xs text-slate-400">Played</div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Unit Filter */}
        <div className="mb-4 relative" ref={filterRef}>
          <button
            onClick={() => setFilterOpen((o) => !o)}
            className="flex items-center gap-2 bg-slate-800 border border-slate-600 hover:border-violet-400 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-colors"
          >
            <span>Filter by Unit</span>
            <span className="bg-slate-700 text-violet-300 text-xs px-2 py-0.5 rounded-full font-bold">
              {selectedUnits.length === 9
                ? "All"
                : selectedUnits.length === 0
                  ? "None"
                  : `${selectedUnits.length} / 9`}
            </span>
            <span className="text-slate-400 text-xs ml-1">{filterOpen ? "▲" : "▼"}</span>
          </button>

          <AnimatePresence>
            {filterOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
                className="absolute z-30 top-full left-0 mt-1.5 bg-slate-800 border border-slate-600 rounded-xl shadow-2xl p-3 min-w-72"
              >
                {/* Select / Clear all */}
                <div className="flex gap-2 mb-3">
                  <button
                    onClick={selectAllUnits}
                    className="flex-1 text-xs font-semibold bg-slate-700 hover:bg-violet-700 text-white rounded-lg py-1.5 transition-colors"
                  >
                    Select All
                  </button>
                  <button
                    onClick={clearAllUnits}
                    className="flex-1 text-xs font-semibold bg-slate-700 hover:bg-red-700 text-white rounded-lg py-1.5 transition-colors"
                  >
                    Clear All
                  </button>
                </div>

                {/* Checkboxes */}
                <div className="space-y-1">
                  {ALL_UNIT_NUMS.map((u) => {
                    const checked = selectedUnits.includes(u);
                    const count = GAME_DATA.filter((e) => e.unitNum === u).length;
                    return (
                      <label
                        key={u}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors select-none ${
                          checked
                            ? "bg-violet-900/50 border border-violet-600"
                            : "bg-slate-700/50 border border-transparent hover:bg-slate-700"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleUnit(u)}
                          className="accent-violet-400 w-4 h-4 cursor-pointer"
                        />
                        <span className="text-sm text-white flex-1">{UNIT_SHORT[u]}</span>
                        <span className="text-xs text-slate-400">{count} terms</span>
                      </label>
                    );
                  })}
                </div>

                {/* Warning if nothing selected */}
                {noUnitsSelected && (
                  <p className="mt-3 text-xs text-red-400 text-center font-medium">
                    Select at least one unit to play.
                  </p>
                )}

                {/* Apply / close */}
                <button
                  onClick={() => {
                    setFilterOpen(false);
                    if (!noUnitsSelected) newGame(filteredPool);
                  }}
                  disabled={noUnitsSelected}
                  className="mt-3 w-full text-sm font-bold bg-gradient-to-r from-violet-300 to-pink-300 hover:from-violet-200 hover:to-pink-200 disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-500 text-slate-900 py-2 rounded-lg transition-colors"
                >
                  Apply & New Game
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Instructions */}
        <div className="mb-5 bg-slate-800/50 border border-slate-700 rounded-xl p-4">
          <p className="text-slate-200 text-sm mb-3">
            Guess the hidden AP World History person, place, event, or concept
            in{" "}
            <span className="bg-gradient-to-r from-violet-300 to-pink-300 bg-clip-text text-transparent font-extrabold">
              {MAX_GUESSES} tries
            </span>
            . After each guess, the colors show how close you are:
          </p>
          <div className="flex flex-wrap gap-2">
            <LegendBadge
              color="bg-green-300 text-slate-800"
              label="✓ Correct match"
            />
            <LegendBadge
              color="bg-amber-200 text-slate-800"
              label="~ Close (related)"
            />
            <LegendBadge color="bg-red-400 text-slate-800" label="✗ Wrong" />
          </div>
        </div>

        {/* Column Headers + Guess Board — scrollable on small screens */}
        <div className="overflow-x-auto -mx-2 px-2 mb-4">
          <div className="min-w-[480px]">
            <div className="grid grid-cols-5 gap-1.5 mb-2 px-0">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-3 py-1">
                Your Guess
              </div>
              {COL_HEADERS.map((h) => (
                <div
                  key={h}
                  className="text-xs font-bold text-slate-400 uppercase tracking-wider text-center px-1 py-1"
                >
                  {h}
                </div>
              ))}
            </div>

            <AnimatePresence>
              {guesses.map((g, i) => (
                <GuessRow
                  key={i}
                  result={g}
                  entry={guessEntries[i]}
                  animate={i === guesses.length - 1}
                />
              ))}
            </AnimatePresence>

            {/* Empty rows */}
            {!gameOver &&
              Array.from({ length: remaining }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="grid grid-cols-5 gap-1.5 mb-1.5"
                >
                  <div
                    className={`h-12 rounded-lg border ${i === 0 ? "border-slate-500 bg-slate-800/50" : "border-slate-700 bg-slate-800/20"}`}
                  />
                  {[0, 1, 2, 3].map((j) => (
                    <div
                      key={j}
                      className={`h-12 rounded-lg border ${i === 0 ? "border-slate-500 bg-slate-800/50" : "border-slate-700 bg-slate-800/20"}`}
                    />
                  ))}
                </div>
              ))}
          </div>
        </div>

        {/* Game Over Banner */}
        <AnimatePresence>
          {showAnswer && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className={`mb-5 rounded-xl border p-4 text-center ${
                won
                  ? "bg-green-900/40 border-green-600"
                  : "bg-red-900/40 border-red-600"
              }`}
            >
              <div className="text-2xl font-extrabold mb-1">
                {won ? "🎉 Correct!" : "Game Over"}
              </div>
              {won ? (
                <p className="text-green-300 text-sm mb-1">
                  You got it in {guesses.length}{" "}
                  {guesses.length === 1 ? "guess" : "guesses"}!
                </p>
              ) : (
                <p className="text-red-300 text-sm mb-1">
                  Better luck next time!
                </p>
              )}
              <p className="text-white font-bold text-lg">{answer.name}</p>
              {answer.description && (
                <motion.div
                  initial={{ scale: 0.5, opacity: 0, y: 10 }}
                  animate={{ scale: [0.5, 1.08, 1], opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.55, ease: "easeOut" }}
                  className="mt-3 mb-1 mx-auto max-w-sm rounded-xl border-2 border-amber-400 bg-amber-400/10 px-4 py-3 shadow-[0_0_24px_4px_rgba(251,191,36,0.35)]"
                >
                  <p className="text-xs font-bold uppercase tracking-widest text-amber-400 mb-1">
                    📖 Did you know?
                  </p>
                  <p className="text-white text-sm leading-snug font-medium">
                    {answer.description}
                  </p>
                </motion.div>
              )}
              <div className="mt-2 flex flex-wrap justify-center gap-2 text-xs text-slate-300">
                <span className="bg-slate-700 px-2 py-1 rounded">
                  {answer.whatIsIt}
                </span>
                <span className="bg-slate-700 px-2 py-1 rounded">
                  {answer.religion}
                </span>
                <span className="bg-slate-700 px-2 py-1 rounded">
                  {answer.geographicArea}
                </span>
                <span className="bg-slate-700 px-2 py-1 rounded">
                  {UNIT_LABELS[answer.unitNum]}
                </span>
              </div>
              <button
                onClick={() => newGame()}
                className="mt-4 bg-gradient-to-r from-violet-300 to-pink-300 hover:from-violet-200 hover:to-pink-200 text-slate-900 font-bold px-6 py-1 rounded-lg transition-colors"

              >
                Play Again
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input Area */}
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
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onFocus={() =>
                          suggestions.length > 0 && setShowSuggestions(true)
                        }
                        onBlur={() =>
                          setTimeout(() => setShowSuggestions(false), 150)
                        }
                        placeholder={`Guess ${guesses.length + 1} of ${MAX_GUESSES} — type to search...`}
                        className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 outline-none transition-colors text-[16px]"
                        autoCorrect="off"
                        autoCapitalize="none"
                        autoComplete="off"
                        spellCheck={false}
                      />
                    </div>
                    {/* Dropdown suggestions — opens upward so the input stays put */}
                    {showSuggestions && suggestions.length > 0 && (
                      <div
                        ref={dropdownRef}
                        className="absolute z-20 bottom-full left-0 right-0 mb-1 bg-slate-800 border border-slate-600 rounded-lg shadow-xl overflow-y-auto max-h-60"
                      >
                        {suggestions.map((s, i) => (
                          <button
                            key={s}
                            onMouseDown={() => selectSuggestion(s)}
                            className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                              i === highlightIdx
                                ? "bg-amber-500 text-slate-900 font-semibold"
                                : "text-slate-200 hover:bg-slate-700"
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => submitGuess()}
                    disabled={!input.trim()}
                    className="
                      bg-gradient-to-r from-violet-300 to-pink-300
                      hover:from-violet-200 hover:to-pink-200
                      disabled:from-slate-700 disabled:to-slate-700
                      disabled:text-slate-500
                      text-slate-900 font-bold px-5 py-3 rounded-lg
                      transition-all text-sm whitespace-nowrap"
                  >
                    Guess
                  </button>
                </div>
                {/* Error message */}
                <AnimatePresence>
                  {errorMsg && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="text-red-400 text-xs mt-1.5 ml-1"
                    >
                      {errorMsg}
                    </motion.p>
                  )}
                </AnimatePresence>
                <p className="text-white text-xs mt-1.5 ml-1">
                  {remaining} guess{remaining !== 1 ? "es" : ""} remaining
                </p>
              </>
            )}
          </div>
        )}

        {/* Answer key hint (when game over) */}
        {gameOver && (
          <div className="mt-6 bg-slate-800/50 border border-slate-700 rounded-xl p-4">
            <h3 className="text-sm font-bold text-slate-300 mb-2 uppercase tracking-wider">
              Answer Reference
            </h3>
            {answer.description && (
              <p className="text-slate-200 text-sm mb-3 italic leading-relaxed">
                {answer.description}
              </p>
            )}
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-slate-400">Term:</span>{" "}
                <span className="text-white font-medium">{answer.name}</span>
              </div>
              <div>
                <span className="text-slate-400">Type:</span>{" "}
                <span className="text-white">{answer.whatIsIt}</span>
              </div>
              <div>
                <span className="text-slate-400">Religion:</span>{" "}
                <span className="text-white">{answer.religion}</span>
              </div>
              <div>
                <span className="text-slate-400">Region:</span>{" "}
                <span className="text-white">{answer.geographicArea}</span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-400">Unit:</span>{" "}
                <span className="text-white">
                  {UNIT_LABELS[answer.unitNum]}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Copyright */}
        <p className="text-center text-slate-600 text-xs mt-8">
          Scholle's AP World History Challenge — Dawson HS, Pearland ISD
        </p>
      </main>
    </div>
  );
}
