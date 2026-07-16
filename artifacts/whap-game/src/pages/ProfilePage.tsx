import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useUser, useClerk } from "@clerk/react";
import { useLocation } from "wouter";

interface MyEntry {
  displayName: string;
  dailyStreak: number;
  rank: number | null;
  bestScore: number | null;
  totalWins: number | null;
  currentStreak: number | null;
  bestStreak: number | null;
}

interface GameResult {
  id: number;
  unitFilter: string;
  score: number;
  guessesUsed: number;
  timeSeconds: number;
  won: boolean;
  termName: string | null;
  playedAt: string;
}

function formatTime(secs: number) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function StatCard({
  icon, label, value, accent,
}: {
  icon: string; label: string; value: string | number; accent: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-slate-800 border ${accent} rounded-xl p-4 flex flex-col items-center text-center gap-1`}
    >
      <span className="text-2xl">{icon}</span>
      <span className="text-2xl font-extrabold text-white leading-tight">{value}</span>
      <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">{label}</span>
    </motion.div>
  );
}

export default function ProfilePage() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const [, setLocation] = useLocation();

  const [entry, setEntry] = useState<MyEntry | null>(null);
  const [games, setGames] = useState<GameResult[]>([]);
  const [loading, setLoading] = useState(true);

  const [newName, setNewName] = useState("");
  const [nameError, setNameError] = useState("");
  const [nameSaving, setNameSaving] = useState(false);
  const [nameSuccess, setNameSuccess] = useState(false);

  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) { setLocation("/sign-in"); return; }

    Promise.all([
      fetch("/api/me/leaderboard").then((r) => r.json()),
      fetch("/api/me/games").then((r) => r.json()),
    ]).then(([entryData, gamesData]) => {
      setEntry(entryData);
      setGames(Array.isArray(gamesData) ? gamesData : []);
    }).catch(() => {
      setEntry(null);
      setGames([]);
    }).finally(() => setLoading(false));
  }, [isLoaded, user]);

  async function handleSaveName() {
    const dn = newName.trim();
    if (!dn) { setNameError("Please enter a name."); return; }
    if (dn.length > 50) { setNameError("Must be 50 characters or less."); return; }
    setNameError("");
    setNameSaving(true);
    setNameSuccess(false);
    try {
      const res = await fetch("/api/me/display-name", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: dn }),
      });
      const data = await res.json();
      if (res.status === 409 || res.status === 404) {
        setNameError(data.error ?? "That name is unavailable.");
      } else if (!res.ok) {
        setNameError("Something went wrong.");
      } else {
        setEntry((prev) => prev ? { ...prev, displayName: data.displayName } : prev);
        setNewName("");
        setNameSuccess(true);
        setTimeout(() => setNameSuccess(false), 3000);
      }
    } catch {
      setNameError("Network error. Please try again.");
    } finally {
      setNameSaving(false);
    }
  }

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-slate-400 text-sm animate-pulse">Loading profile…</div>
      </div>
    );
  }

  const displayName = entry?.displayName ?? user?.primaryEmailAddress?.emailAddress?.split("@")[0] ?? "Player";
  const email = user?.primaryEmailAddress?.emailAddress ?? "";
  const initial = displayName[0]?.toUpperCase() ?? "?";

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white">

      {/* Top bar */}
      <header className="sticky top-0 z-10 border-b border-slate-700 bg-slate-900/90 backdrop-blur">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setLocation("/")}
            className="flex items-center gap-2 text-slate-400 hover:text-white text-sm font-semibold transition-colors"
          >
            ← Back to Game
          </button>
          <span className="text-sm font-bold text-slate-200">My Profile</span>
          <button
            onClick={() => signOut({ redirectUrl: basePath || "/" })}
            className="text-slate-400 hover:text-red-400 text-sm font-semibold transition-colors"
          >
            Sign Out
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-8">

        {/* Avatar + name */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-5"
        >
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-2xl font-extrabold text-white shadow-lg shrink-0">
            {initial}
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white leading-tight">{displayName}</h1>
            {email && <p className="text-slate-400 text-sm mt-0.5">{email}</p>}
            {entry && entry.rank !== null && (
              <p className="text-slate-500 text-xs mt-1">Rank #{entry.rank} on the All Units leaderboard</p>
            )}
          </div>
        </motion.div>

        {/* Stats */}
        {entry ? (
          <section>
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Stats</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <StatCard icon="🔥" label="Daily Streak" value={entry.dailyStreak} accent="border-orange-500/40" />
              <StatCard icon="🏆" label="Win Streak" value={entry.currentStreak ?? "—"} accent="border-violet-500/40" />
              <StatCard icon="🎯" label="Best Streak" value={entry.bestStreak ?? "—"} accent="border-violet-500/40" />
              <StatCard icon="✓" label="Total Wins" value={entry.totalWins ?? "—"} accent="border-green-500/40" />
              <StatCard icon="⭐" label="Best Score" value={entry.bestScore !== null ? entry.bestScore.toLocaleString() : "—"} accent="border-amber-500/40" />
              <StatCard icon="📊" label="All Units Rank" value={entry.rank !== null ? `#${entry.rank}` : "—"} accent="border-pink-500/40" />
            </div>
            {entry.bestScore === null && (
              <p className="text-amber-400/80 text-xs mt-2 text-center">
                Play with all 9 units active to appear on the main leaderboard!
              </p>
            )}
            <p className="text-slate-600 text-xs mt-2 text-center">
              Daily streak resets if you skip a day · Score = (7 − guesses) × 1000 − seconds
            </p>
          </section>
        ) : (
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 text-center">
            <p className="text-3xl mb-2">🎮</p>
            <p className="text-slate-300 font-semibold">No stats yet!</p>
            <p className="text-slate-500 text-sm mt-1">Play a game with all 9 units or a single unit to start tracking scores.</p>
            <button
              onClick={() => setLocation("/")}
              className="mt-4 bg-gradient-to-r from-violet-400 to-pink-400 hover:from-violet-300 hover:to-pink-300 text-slate-900 font-bold px-6 py-2 rounded-lg text-sm transition-colors"
            >
              Play Now
            </button>
          </div>
        )}

        {/* Game History */}
        {games.length > 0 && (
          <section>
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Recent Games</h2>
            <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-700 bg-slate-800/80">
                  <tr>
                    <th className="text-left text-xs text-slate-400 font-semibold px-4 py-2.5">Date</th>
                    <th className="text-left text-xs text-slate-400 font-semibold px-2 py-2.5 hidden sm:table-cell">Term</th>
                    <th className="text-center text-xs text-slate-400 font-semibold px-2 py-2.5">Result</th>
                    <th className="text-right text-xs text-slate-400 font-semibold px-2 py-2.5">Guesses</th>
                    <th className="text-right text-xs text-slate-400 font-semibold px-2 py-2.5 hidden sm:table-cell">Time</th>
                    <th className="text-right text-xs text-slate-400 font-semibold px-4 py-2.5">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {games.map((g) => (
                    <tr key={g.id} className="border-b border-slate-700/40 hover:bg-slate-700/20 transition-colors">
                      <td className="px-4 py-2.5 text-slate-400 text-xs whitespace-nowrap">{formatDate(g.playedAt)}</td>
                      <td className="px-2 py-2.5 text-slate-300 text-xs max-w-[120px] truncate hidden sm:table-cell">
                        {g.termName ?? "—"}
                      </td>
                      <td className="px-2 py-2.5 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${g.won ? "bg-green-900/60 text-green-300" : "bg-red-900/60 text-red-400"}`}>
                          {g.won ? "✓ WIN" : "✗ LOSS"}
                        </span>
                      </td>
                      <td className="px-2 py-2.5 text-right text-slate-300 text-xs">{g.guessesUsed}/7</td>
                      <td className="px-2 py-2.5 text-right text-slate-400 text-xs hidden sm:table-cell">{formatTime(g.timeSeconds)}</td>
                      <td className="px-4 py-2.5 text-right font-bold font-mono text-xs">
                        <span className={g.won ? "text-amber-300" : "text-slate-600"}>
                          {g.won ? g.score.toLocaleString() : "—"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Settings */}
        <section>
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Settings</h2>
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 space-y-4">

            {/* Change display name */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-1">
                Change Display Name
              </label>
              {entry && (
                <p className="text-slate-500 text-xs mb-2">
                  Current: <span className="text-violet-300 font-semibold">{entry.displayName}</span>
                </p>
              )}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => { setNewName(e.target.value); setNameError(""); setNameSuccess(false); }}
                  onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
                  placeholder="New unique display name…"
                  maxLength={50}
                  className="flex-1 bg-slate-700 border border-slate-600 focus:border-violet-400 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 outline-none text-sm transition-colors"
                />
                <button
                  onClick={handleSaveName}
                  disabled={nameSaving || !newName.trim()}
                  className="bg-gradient-to-r from-violet-400 to-pink-400 hover:from-violet-300 hover:to-pink-300 disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-500 text-slate-900 font-bold px-5 py-2.5 rounded-lg text-sm transition-all whitespace-nowrap"
                >
                  {nameSaving ? "Saving…" : "Save"}
                </button>
              </div>
              {nameError && <p className="text-red-400 text-xs mt-1.5">{nameError}</p>}
              {nameSuccess && <p className="text-green-400 text-xs mt-1.5">✓ Display name updated!</p>}
              <p className="text-slate-600 text-xs mt-1.5">
                Names must be unique. Your old name becomes available for others to claim.
              </p>
            </div>

            {/* Sign Out */}
            <div className="pt-2 border-t border-slate-700">
              <button
                onClick={() => signOut({ redirectUrl: basePath || "/" })}
                className="w-full bg-slate-700 hover:bg-red-900/40 border border-slate-600 hover:border-red-700 text-slate-300 hover:text-red-400 font-semibold py-2.5 rounded-lg text-sm transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </section>

        <p className="text-center text-slate-700 text-xs pb-4">
          Scholle's AP World History Challenge — Dawson HS, Pearland ISD
        </p>
      </main>
    </div>
  );
}
