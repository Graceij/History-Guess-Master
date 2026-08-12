import { GameEntry } from "../data/gameData";

export type MatchResult = "correct" | "close" | "wrong";

export interface GuessResult {
  name: string;
  whatIsIt: MatchResult;
  religion: MatchResult;
  geographicArea: MatchResult;
  unit: MatchResult;
  unitDirection?: "higher" | "lower" | null;
}

// Geographic proximity groupings (updated for new specific regions)
const GEO_GROUPS: Record<string, string[]> = {
  "North America":          ["North America", "Latin America/Caribbean"],
  "Latin America/Caribbean":["Latin America/Caribbean", "North America"],
  "Europe":                 ["Europe", "Middle East"],
  "Middle East":            ["Middle East", "Europe", "Africa", "Central Asia"],
  "Africa":                 ["Africa", "Middle East"],
  "Central Asia":           ["Central Asia", "Middle East", "East Asia", "South Asia"],
  "East Asia":              ["East Asia", "Southeast Asia", "Central Asia"],
  "Southeast Asia":         ["Southeast Asia", "East Asia", "South Asia"],
  "South Asia":             ["South Asia", "Southeast Asia", "Central Asia"],
  "Oceania":                ["Oceania", "Southeast Asia"],
  "Global":                 ["Global"],
};

// Religion proximity groupings
const RELIGION_GROUPS: Record<string, string[]> = {
  "Christianity":  ["Christianity", "Judaism", "Islam"],
  "Islam":         ["Islam", "Christianity", "Judaism"],
  "Judaism":       ["Judaism", "Christianity", "Islam"],
  "Buddhism":      ["Buddhism", "Hinduism", "Sikhism", "Confucianism"],
  "Hinduism":      ["Hinduism", "Buddhism", "Sikhism"],
  "Sikhism":       ["Sikhism", "Hinduism", "Buddhism"],
  "Confucianism":  ["Confucianism", "Buddhism"],
  "Animism":       ["Animism", "Polytheistic"],
  "Polytheistic":  ["Polytheistic", "Animism"],
  "NA":            ["NA"],
};

export function evaluateGuess(guess: GameEntry, answer: GameEntry): GuessResult {
  // What is it: exact match only
  const whatIsIt: MatchResult = guess.whatIsIt === answer.whatIsIt ? "correct" : "wrong";

  // Religion: exact → correct; related group → close; else wrong
  let religion: MatchResult = "wrong";
  if (guess.religion === answer.religion) {
    religion = "correct";
  } else {
    const group = RELIGION_GROUPS[answer.religion] || [answer.religion];
    if (group.includes(guess.religion)) religion = "close";
  }

  // Geographic area: exact → correct; nearby region → close; else wrong
  let geographicArea: MatchResult = "wrong";
  if (guess.geographicArea === answer.geographicArea) {
    geographicArea = "correct";
  } else {
    const group = GEO_GROUPS[answer.geographicArea] || [answer.geographicArea];
    if (group.includes(guess.geographicArea)) geographicArea = "close";
    // "Global" is considered close to everything
    if (guess.geographicArea === "Global" || answer.geographicArea === "Global") {
      geographicArea = "close";
    }
  }
  // Exact match always wins
  if (guess.geographicArea === answer.geographicArea) geographicArea = "correct";

  // Unit: exact → correct; within 1 unit → close; else wrong + direction hint
  let unit: MatchResult = "wrong";
  let unitDirection: "higher" | "lower" | null = null;
  if (guess.unitNum === answer.unitNum) {
    unit = "correct";
  } else {
    const diff = Math.abs(guess.unitNum - answer.unitNum);
    if (diff === 1) unit = "close";
    unitDirection = guess.unitNum < answer.unitNum ? "higher" : "lower";
  }

  return {
    name: guess.name,
    whatIsIt,
    religion,
    geographicArea,
    unit,
    unitDirection,
  };
}

export function getRandomEntry(entries: GameEntry[], excludeIds: number[] = []): GameEntry {
  const available = entries.filter(e => !excludeIds.includes(e.id));
  const pool = available.length > 0 ? available : entries;
  return pool[Math.floor(Math.random() * pool.length)];
}
