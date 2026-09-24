import patientData from "../data/patientData.js";

/**
 * Storage Keys monitored by ANVESHA Client
 */
export const STORAGE_KEYS = {
  GAME_HISTORY: ["smriti-game-history", "aura-game-history"],
  LAST_GAME_RESULT: ["smriti-last-game-result", "aura-last-game-result"],
  MOOD_HISTORY: ["aura-mood-history", "anvesha-mood-history"],
  KNOWN_PEOPLE: ["anvesha_known_people", "who-is-at-my-door", "smriti-memories"],
  REMINDERS: ["anvesha-reminders", "smriti-reminders", "aura-reminders"],
  LOCATION: ["anvesha_last_known_location"],
  LOCATION_PREF: ["anvesha_location_share_preference"],
  OFFLINE_QUEUE: ["anvesha_offline_activity_queue"],
  CACHED_TELEMETRY: "anvesha-cached-telemetry",
};

/**
 * Safe LocalStorage item reader with error catching
 */
export function safeGetLocalStorage(key, fallback = null) {
  if (typeof window === "undefined" || !window.localStorage) {
    return fallback;
  }
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null || raw === undefined || raw === "") return fallback;
    return JSON.parse(raw);
  } catch (err) {
    console.warn(`[dataProcessor] Failed to read or parse localStorage key "${key}":`, err);
    return fallback;
  }
}

/**
 * Safe LocalStorage item writer
 */
export function safeSetLocalStorage(key, value) {
  if (typeof window === "undefined" || !window.localStorage) {
    return false;
  }
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (err) {
    console.warn(`[dataProcessor] Failed to write to localStorage key "${key}":`, err);
    return false;
  }
}

/**
 * Reads the first available value matching any of the candidate keys
 */
export function getFirstAvailableStorage(candidateKeys, fallback = null) {
  for (const key of candidateKeys) {
    const val = safeGetLocalStorage(key, null);
    if (val !== null && val !== undefined) {
      return val;
    }
  }
  return fallback;
}

/**
 * Normalize and clean game activity records
 * Ensures numeric bounds, standardized timestamps, deduplication, and game tagging.
 */
export function cleanGameResults(rawResults = []) {
  if (!Array.isArray(rawResults)) {
    if (rawResults && typeof rawResults === "object") {
      rawResults = [rawResults];
    } else {
      return [];
    }
  }

  const seenSignatures = new Set();
  const cleaned = [];

  for (const item of rawResults) {
    if (!item || typeof item !== "object") continue;

    const rawGameName = item.game || item.gameId || item.title || "Cognitive Exercise";
    const canonicalGame = mapCanonicalGame(rawGameName);

    // Extract numerical accuracy / score
    let accuracy = Number(item.accuracy);
    if (isNaN(accuracy)) {
      accuracy = Number(item.score);
      if (isNaN(accuracy)) accuracy = 75; // fallback neutral baseline
    }
    accuracy = Math.max(0, Math.min(100, Math.round(accuracy)));

    // Score extraction
    let score = Number(item.score);
    if (isNaN(score)) score = accuracy;
    score = Math.max(0, Math.round(score));

    // Time elapsed in seconds
    let elapsedTime = Number(item.elapsedTime || item.timeSpent || item.duration || 0);
    if (isNaN(elapsedTime) || elapsedTime < 0) elapsedTime = 0;
    // If elapsedTime seems to be in milliseconds (> 60000ms and looks like ms)
    if (elapsedTime > 3600 && item.completedAt) {
      // plausible milliseconds
      elapsedTime = Math.round(elapsedTime / 1000);
    }

    // Hints used
    let hintsUsed = Number(item.hintsUsed || item.hints || 0);
    if (isNaN(hintsUsed) || hintsUsed < 0) hintsUsed = 0;
    hintsUsed = Math.round(hintsUsed);

    // Mistakes & attempts
    let mistakes = Number(item.mistakes || 0);
    if (isNaN(mistakes) || mistakes < 0) mistakes = 0;
    let attempts = Number(item.attempts || item.moves || 0);
    if (isNaN(attempts) || attempts < 0) attempts = mistakes;

    // Difficulty normalization
    const rawDiff = String(item.difficulty || "easy").toLowerCase();
    const difficulty =
      rawDiff.includes("hard") ? "hard" : rawDiff.includes("med") ? "medium" : "easy";

    // Category normalization
    const category = categorizeGame(canonicalGame.id, item.category);

    // Timestamp normalization
    let completedAt = item.completedAt || item.timestamp || item.date || item.dateLabel;
    let dateObj = new Date(completedAt);
    if (isNaN(dateObj.getTime())) {
      dateObj = new Date();
    }
    const isoDate = dateObj.toISOString();

    // Unique signature to deduplicate identical recorded runs
    const signature = `${canonicalGame.id}-${isoDate}-${accuracy}-${elapsedTime}`;
    if (seenSignatures.has(signature)) continue;
    seenSignatures.add(signature);

    cleaned.push({
      id: item.id || `act-${Math.random().toString(36).slice(2, 9)}`,
      gameId: canonicalGame.id,
      game: canonicalGame.name,
      category,
      difficulty,
      accuracy,
      score,
      elapsedTime,
      hintsUsed,
      mistakes,
      attempts,
      completedAt: isoDate,
      dateLabel: formatDateLabel(dateObj),
      patientId: item.patientId || "P001",
    });
  }

  // Sort descending by completion time (newest first)
  cleaned.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));

  return cleaned;
}

/**
 * Maps game names and IDs to canonical names and IDs
 */
function mapCanonicalGame(nameOrId = "") {
  const s = String(nameOrId).toLowerCase();
  if (s.includes("spot") || s.includes("difference")) {
    return { id: "spot-the-difference", name: "Spot the Difference" };
  }
  if (s.includes("pattern")) {
    return { id: "pattern-match", name: "Pattern Match" };
  }
  if (s.includes("routine") || s.includes("daily")) {
    return { id: "daily-routine", name: "Daily Routine" };
  }
  if (s.includes("door") || s.includes("face") || s.includes("who")) {
    return { id: "who-is-at-door", name: "Who Is At My Door" };
  }
  if (s.includes("word") || s.includes("association")) {
    return { id: "word-association", name: "Word Association" };
  }
  return { id: "memory-match", name: "Memory Game" };
}

/**
 * Categorizes game into cognitive domain
 */
function categorizeGame(gameId, explicitCategory) {
  if (explicitCategory && typeof explicitCategory === "string") {
    const c = explicitCategory.toLowerCase();
    if (["memory", "attention", "sequencing", "orientation", "executive"].includes(c)) {
      return c;
    }
  }

  switch (gameId) {
    case "memory-match":
    case "who-is-at-door":
      return "memory";
    case "spot-the-difference":
    case "pattern-match":
      return "attention";
    case "daily-routine":
      return "sequencing";
    case "word-association":
      return "language";
    default:
      return "memory";
  }
}

/**
 * Clean and normalize mood entries
 */
export function cleanMoodHistory(rawMoods = []) {
  if (!Array.isArray(rawMoods)) {
    if (rawMoods && typeof rawMoods === "object") {
      rawMoods = [rawMoods];
    } else {
      return [];
    }
  }

  const cleaned = [];
  for (const entry of rawMoods) {
    if (!entry) continue;

    let moodName = "Calm";
    let note = "";
    let rawDate = entry.timestamp || entry.date || entry.completedAt || new Date().toISOString();

    if (typeof entry === "string") {
      moodName = entry;
    } else if (typeof entry === "object") {
      moodName = entry.mood || entry.label || entry.state || "Calm";
      note = entry.note || entry.comment || entry.details || "";
    }

    // Capitalize properly
    moodName = moodName.trim();
    if (moodName.length > 0) {
      moodName = moodName.charAt(0).toUpperCase() + moodName.slice(1);
    }

    let dateObj = new Date(rawDate);
    if (isNaN(dateObj.getTime())) dateObj = new Date();

    cleaned.push({
      mood: moodName,
      label: moodName,
      note: String(note).trim(),
      timestamp: dateObj.toISOString(),
      dateLabel: formatDateLabel(dateObj),
    });
  }

  // Newest first
  cleaned.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  return cleaned;
}

/**
 * Clean and normalize reminders and adherence
 */
export function cleanReminders(rawReminders = []) {
  if (!Array.isArray(rawReminders)) {
    rawReminders = [];
  }

  const cleaned = rawReminders.map((r, idx) => {
    const completed =
      r.completed === true ||
      r.status === "completed" ||
      r.status === "taken" ||
      r.status === "done";

    return {
      id: r.id || idx + 1,
      title: r.title || r.name || "Daily Care Step",
      type: r.type || "Routine",
      time: r.time || "08:00",
      description: r.description || "",
      completed,
      status: completed ? "completed" : r.status || "pending",
    };
  });

  const total = cleaned.length;
  const completedCount = cleaned.filter((r) => r.completed).length;
  const adherenceRate = total > 0 ? Math.round((completedCount / total) * 100) : 100;

  return {
    items: cleaned,
    total,
    completedCount,
    pendingCount: total - completedCount,
    adherenceRate,
  };
}

/**
 * Clean and normalize recognized family/memories list
 */
export function cleanMemories(rawMemories = []) {
  if (!Array.isArray(rawMemories)) return [];

  return rawMemories
    .filter((m) => m && (m.name || m.relation))
    .map((m, idx) => ({
      id: m.id || idx + 1,
      name: m.name || "Family Member",
      relation: m.relation || "Relative",
      notes: m.notes || m.description || "",
      lastInteracted: m.lastInteracted || null,
    }));
}

/**
 * Extracts raw patient telemetry and activity history from localStorage
 * with automatic fallback to mock state (patientData).
 */
export function extractRawPatientData(customSource = {}) {
  // 1. Game History
  let rawGames =
    customSource.gameHistory ||
    getFirstAvailableStorage(STORAGE_KEYS.GAME_HISTORY, null) ||
    patientData.recentGameResults ||
    [];

  // Also check last game result if history is empty
  if (rawGames.length === 0) {
    const lastResult =
      customSource.lastGameResult ||
      getFirstAvailableStorage(STORAGE_KEYS.LAST_GAME_RESULT, null);
    if (lastResult) {
      rawGames = [lastResult];
    }
  }

  // 2. Mood Logs
  const rawMoods =
    customSource.moodHistory ||
    getFirstAvailableStorage(STORAGE_KEYS.MOOD_HISTORY, null) ||
    (patientData.mood ? [{ mood: patientData.mood.current, date: patientData.mood.lastUpdated }] : []);

  // 3. Reminders
  const rawReminders =
    customSource.reminders ||
    getFirstAvailableStorage(STORAGE_KEYS.REMINDERS, null) ||
    patientData.reminders ||
    [];

  // 4. Memories
  const rawMemories =
    customSource.memories ||
    getFirstAvailableStorage(STORAGE_KEYS.KNOWN_PEOPLE, null) ||
    patientData.memories ||
    [];

  // 5. Patient Profile
  const rawPatient = customSource.patient || patientData.patient || {
    id: "P001",
    name: "Asha",
    age: 78,
    caregiver: "Dr. Sarah Jenkins",
    room: "402",
    status: "Stable",
    language: "Assamese",
  };

  // 6. Location / Safety
  const rawLocation =
    customSource.location ||
    getFirstAvailableStorage(STORAGE_KEYS.LOCATION, null);

  return {
    rawPatient,
    rawGames,
    rawMoods,
    rawReminders,
    rawMemories,
    rawLocation,
  };
}

/**
 * Master Aggregator: Extracts, cleans, and computes domain-specific metrics
 * ready for AI ingestion (both Gemini prompts and heuristic rule engines).
 */
export function aggregatePatientTelemetry(options = {}) {
  const {
    customSource,
    patientId = "P001",
    historyLimit = 25,
  } = options;

  // 1. Extract raw data
  const raw = extractRawPatientData(customSource);

  // 2. Clean records
  const cleanedGames = cleanGameResults(raw.rawGames).slice(0, historyLimit);
  const cleanedMoods = cleanMoodHistory(raw.rawMoods);
  const reminderSummary = cleanReminders(raw.rawReminders);
  const cleanedMemories = cleanMemories(raw.rawMemories);

  const patient = {
    id: raw.rawPatient.id || patientId,
    name: raw.rawPatient.name || "Asha",
    age: raw.rawPatient.age || 78,
    room: raw.rawPatient.room || "402",
    language: raw.rawPatient.language || "Assamese",
    status: raw.rawPatient.status || "Stable",
    caregiver: raw.rawPatient.caregiver || "Dr. Sarah Jenkins",
  };

  // 3. Cognitive Domain Breakdowns
  const memoryActivities = cleanedGames.filter((g) => g.category === "memory");
  const attentionActivities = cleanedGames.filter((g) => g.category === "attention");
  const sequencingActivities = cleanedGames.filter((g) => g.category === "sequencing");

  const avgMemoryAccuracy = calculateAverage(
    memoryActivities.map((a) => a.accuracy),
    82
  );
  const avgAttentionAccuracy = calculateAverage(
    attentionActivities.map((a) => a.accuracy),
    76
  );
  const avgSequencingAccuracy = calculateAverage(
    sequencingActivities.map((a) => a.accuracy),
    80
  );

  // Overall cognitive composite score (weighted mean)
  const overallCognitiveScore = Math.round(
    avgMemoryAccuracy * 0.45 + avgAttentionAccuracy * 0.35 + avgSequencingAccuracy * 0.2
  );

  // 4. Longitudinal Trajectory Detection (last 3 vs previous 3 sessions)
  const last3 = cleanedGames.slice(0, 3);
  const prev3 = cleanedGames.slice(3, 6);

  const last3Avg = calculateAverage(
    last3.map((a) => a.accuracy),
    overallCognitiveScore
  );
  const prev3Avg = calculateAverage(
    prev3.map((a) => a.accuracy),
    last3Avg
  );
  const trajectoryDelta = last3Avg - prev3Avg;

  let trajectoryStatus = "stable";
  if (trajectoryDelta <= -10) {
    trajectoryStatus = "declining";
  } else if (trajectoryDelta >= 8) {
    trajectoryStatus = "improving";
  }

  // 5. Hint Dependency Trends
  const totalHints = cleanedGames.reduce((acc, g) => acc + g.hintsUsed, 0);
  const avgHintsPerSession =
    cleanedGames.length > 0 ? Number((totalHints / cleanedGames.length).toFixed(1)) : 0;

  const recentHintsAvg = calculateAverage(last3.map((g) => g.hintsUsed), avgHintsPerSession);
  const prevHintsAvg = calculateAverage(prev3.map((g) => g.hintsUsed), avgHintsPerSession);
  const hintTrend =
    recentHintsAvg > prevHintsAvg + 0.5
      ? "increasing"
      : recentHintsAvg < prevHintsAvg - 0.5
      ? "decreasing"
      : "stable";

  // 6. Average Completion Time & Fatigue indicator
  const avgElapsedTime = calculateAverage(
    cleanedGames.map((g) => g.elapsedTime),
    45
  );

  // 7. Latest Mood & Behavioral observations
  const latestMoodObj = cleanedMoods[0] || { mood: "Calm", label: "Calm", note: "" };

  // 8. Generate safe, non-diagnostic observational evidence for AI
  const clinicalObservations = [];
  if (trajectoryStatus === "declining") {
    clinicalObservations.push({
      topic: "Accuracy Dip",
      note: `Observed ${Math.abs(trajectoryDelta)}% accuracy decrease over recent sessions compared to earlier baseline.`,
      severity: "moderate",
    });
  }
  if (hintTrend === "increasing") {
    clinicalObservations.push({
      topic: "Prompt Dependency",
      note: `Patient utilized increased assistance prompts (${recentHintsAvg} hints/session vs ${prevHintsAvg} previously).`,
      severity: "low",
    });
  }
  if (reminderSummary.adherenceRate < 70) {
    clinicalObservations.push({
      topic: "Medication & Hydration Adherence",
      note: `Adherence rate recorded at ${reminderSummary.adherenceRate}% (${reminderSummary.completedCount}/${reminderSummary.total} completed).`,
      severity: "moderate",
    });
  }

  const aggregated = {
    patient,
    metrics: {
      totalSessions: cleanedGames.length,
      overallCognitiveScore,
      avgMemoryAccuracy,
      avgAttentionAccuracy,
      avgSequencingAccuracy,
      last3Avg,
      prev3Avg,
      trajectoryDelta,
      trajectoryStatus,
      avgHintsPerSession,
      hintTrend,
      avgElapsedTimeSeconds: avgElapsedTime,
      reminderAdherence: reminderSummary.adherenceRate,
      completedReminders: reminderSummary.completedCount,
      totalReminders: reminderSummary.total,
      latestMood: latestMoodObj.mood,
      moodNotes: latestMoodObj.note,
    },
    activityBreakdown: {
      memoryCount: memoryActivities.length,
      attentionCount: attentionActivities.length,
      sequencingCount: sequencingActivities.length,
    },
    recentActivities: cleanedGames.slice(0, 8).map((g) => ({
      game: g.game,
      gameId: g.gameId,
      category: g.category,
      accuracy: g.accuracy,
      score: g.score,
      hintsUsed: g.hintsUsed,
      elapsedTime: g.elapsedTime,
      difficulty: g.difficulty,
      completedAt: g.completedAt,
      dateLabel: g.dateLabel,
    })),
    recentMoods: cleanedMoods.slice(0, 5),
    reminders: reminderSummary.items,
    memoriesCount: cleanedMemories.length,
    clinicalObservations,
    metadata: {
      extractedAt: new Date().toISOString(),
      source: customSource ? "custom_state" : "local_storage_and_mock",
      offlineCapable: true,
    },
  };

  return aggregated;
}

/**
 * Prepares clean patient activity data specifically structured for AI service ingestion
 * (e.g. backend /api/ai/insights, /api/ai/patterns, or /api/chat patientContext).
 */
export function prepareForAIService(sourceData = null, options = {}) {
  const aggregated = aggregatePatientTelemetry({
    customSource: sourceData,
    ...options,
  });

  return aggregated;
}

/**
 * Formats aggregated patient telemetry into a concise, high-signal contextual prompt
 * suitable for feeding directly into Gemini or the patient conversational assistant.
 */
export function formatForGeminiPrompt(aggregatedData) {
  if (!aggregatedData) {
    aggregatedData = aggregatePatientTelemetry();
  }

  const { patient, metrics, activityBreakdown, recentActivities, reminders } = aggregatedData;

  const activitiesSummary =
    recentActivities.length > 0
      ? recentActivities
          .map(
            (a) =>
              `- ${a.game}: ${a.accuracy}% accuracy, ${a.hintsUsed} hints, ${a.elapsedTime}s (${a.difficulty})`
          )
          .join("\n")
      : "- No recent sessions recorded yet.";

  const pendingReminders = reminders
    .filter((r) => !r.completed)
    .map((r) => `- ${r.title} at ${r.time} (${r.type})`)
    .join("\n") || "- All scheduled reminders completed for today.";

  return `
PATIENT CONTEXT (NON-DIAGNOSTIC TELEMETRY):
- Patient: ${patient.name} (Age: ${patient.age}, Room: ${patient.room}, Preferred Language: ${patient.language})
- Caregiver: ${patient.caregiver}
- Status: ${patient.status}

COGNITIVE PERFORMANCE SUMMARY:
- Overall Score: ${metrics.overallCognitiveScore}/100
- Memory Recall Rate: ${metrics.avgMemoryAccuracy}% (${activityBreakdown.memoryCount} sessions)
- Visual Attention & Discrimination: ${metrics.avgAttentionAccuracy}% (${activityBreakdown.attentionCount} sessions)
- Sequence & Routine: ${metrics.avgSequencingAccuracy}% (${activityBreakdown.sequencingCount} sessions)
- Trajectory Trend: ${metrics.trajectoryStatus.toUpperCase()} (Delta: ${metrics.trajectoryDelta >= 0 ? "+" : ""}${metrics.trajectoryDelta}%)
- Assistance Prompts (Hints): ${metrics.avgHintsPerSession} avg/session (Trend: ${metrics.hintTrend})

DAILY CARE ADHERENCE & MOOD:
- Reminder Adherence: ${metrics.reminderAdherence}% (${metrics.completedReminders}/${metrics.totalReminders} completed)
- Latest Mood Recorded: "${metrics.latestMood}" ${metrics.moodNotes ? `("${metrics.moodNotes}")` : ""}
- Pending Care Reminders:
${pendingReminders}

RECENT EXERCISE SESSIONS:
${activitiesSummary}

BOUNDARIES & ETHICS:
Keep observations grounded strictly in behavioral telemetry. Never output formal medical diagnoses or medication changes.
`.trim();
}

/**
 * Cache current aggregated summary into localStorage for offline availability
 */
export function syncAggregatedToLocalStorage(telemetry) {
  if (!telemetry) {
    telemetry = aggregatePatientTelemetry();
  }
  return safeSetLocalStorage(STORAGE_KEYS.CACHED_TELEMETRY, telemetry);
}

/**
 * Export telemetry as a formatted JSON string (for debugging or export)
 */
export function exportTelemetryJSON(pretty = true) {
  const telemetry = aggregatePatientTelemetry();
  return pretty ? JSON.stringify(telemetry, null, 2) : JSON.stringify(telemetry);
}

/**
 * Mathematical helpers
 */
function calculateAverage(numbers = [], fallback = 0) {
  const valid = numbers.filter((n) => typeof n === "number" && !isNaN(n));
  if (valid.length === 0) return fallback;
  const sum = valid.reduce((acc, curr) => acc + curr, 0);
  return Math.round(sum / valid.length);
}

function formatDateLabel(dateObj) {
  try {
    return dateObj.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "Recent";
  }
}

export default {
  STORAGE_KEYS,
  safeGetLocalStorage,
  safeSetLocalStorage,
  getFirstAvailableStorage,
  cleanGameResults,
  cleanMoodHistory,
  cleanReminders,
  cleanMemories,
  extractRawPatientData,
  aggregatePatientTelemetry,
  prepareForAIService,
  formatForGeminiPrompt,
  syncAggregatedToLocalStorage,
  exportTelemetryJSON,
};
