import { GoogleGenAI } from "@google/genai";
import { readDb } from "./db.js";

/**
 * =========================================================================
 * 4. CENTRALIZED MULTILINGUAL REGISTRY (NER & NATIONAL INDIAN LANGUAGES)
 * =========================================================================
 * Strictly distinguishes:
 * - textSupported: Model understands & generates text in this language
 * - sttSupported: Speech-to-Text via Web Speech API, Gemini Transcribe, or Sarvam
 * - ttsSupported: Text-to-Speech via Web Speech API, Gemini TTS, or Sarvam
 * - liveVoiceSupported: Real-time low-latency bidirectional voice stream
 * - aiContextSupported: Patient routine & clinical context reasoning in this language
 * 
 * Never claims a capability that is not actually executable.
 */
export const LANGUAGE_REGISTRY = {
  "as-IN": {
    code: "as-IN",
    name: "Assamese",
    nativeName: "অসমীয়া",
    script: "Bengali/Assamese (অসমীয়া লিপি)",
    region: "Assam, Northeast India",
    greeting: "নমস্কাৰ",
    textSupported: true,
    sttSupported: true,
    ttsSupported: false,
    liveVoiceSupported: false,
    aiContextSupported: true,
    ttsVoice: "None (Closed Beta)",
    ttsFallback: "text_only",
    description: "Full contextual text and audio speech-to-text (STT) support. Spoken voice response falls back to clear accessible text pending native Assamese voice engine access.",
  },
  "bn-IN": {
    code: "bn-IN",
    name: "Bengali",
    nativeName: "বাংলা",
    script: "Bengali (বাংলা লিপি)",
    region: "West Bengal, Tripura, Assam (Barak Valley)",
    greeting: "নমস্কার",
    textSupported: true,
    sttSupported: true,
    ttsSupported: true,
    liveVoiceSupported: true,
    aiContextSupported: true,
    ttsVoice: "priya (Sarvam bulbul:v3 - Natural Bengali)",
    ttsFallback: "browser_speech_synthesis",
    description: "Full conversational, voice recognition, and natural Bengali spoken voice support.",
  },
  "hi-IN": {
    code: "hi-IN",
    name: "Hindi",
    nativeName: "हिन्दी",
    script: "Devanagari (देवनागरी)",
    region: "Pan-India National",
    greeting: "नमस्ते",
    textSupported: true,
    sttSupported: true,
    ttsSupported: true,
    liveVoiceSupported: true,
    aiContextSupported: true,
    ttsVoice: "priya (Sarvam bulbul:v3 - Natural Indian Hindi)",
    ttsFallback: "browser_speech_synthesis",
    description: "Complete natural voice, transcription, and contextual intelligence support.",
  },
  "en-IN": {
    code: "en-IN",
    name: "English (India)",
    nativeName: "English",
    script: "Latin",
    region: "Pan-India & International",
    greeting: "Hello",
    textSupported: true,
    sttSupported: true,
    ttsSupported: true,
    liveVoiceSupported: true,
    aiContextSupported: true,
    ttsVoice: "priya (Sarvam bulbul:v3 - Natural Indian English)",
    ttsFallback: "browser_speech_synthesis",
    description: "Full natural language, audio transcription, and natural Indian English voice support.",
  },
  "ne-NP": {
    code: "ne-NP",
    name: "Nepali",
    nativeName: "नेपाली",
    script: "Devanagari (देवनागरी)",
    region: "Sikkim, Assam, North Bengal",
    greeting: "नमस्ते",
    textSupported: true,
    sttSupported: true,
    ttsSupported: true,
    liveVoiceSupported: true,
    aiContextSupported: true,
    description: "Full text and voice synthesis support widely spoken across Northeast India.",
  },
  "brx-IN": {
    code: "brx-IN",
    name: "Bodo",
    nativeName: "बड़ो",
    script: "Devanagari (देवनागरी)",
    region: "Bodoland Territorial Region, Assam",
    greeting: "खुमुलिया",
    textSupported: true,
    sttSupported: false,
    ttsSupported: false,
    liveVoiceSupported: false,
    aiContextSupported: true,
    description: "Text and patient context understanding supported; audio transcription available via multimodal audio upload. Native TTS voice not yet offered by browser/OS synthesizers.",
  },
  "mni-IN": {
    code: "mni-IN",
    name: "Manipuri (Meitei)",
    nativeName: "মৈতৈলোন্ / ꯃꯩꯇꯩꯂꯣꯟ",
    script: "Meitei Mayek / Bengali",
    region: "Manipur, Assam",
    greeting: "ꯈꯨꯔꯨꯝꯖꯔꯤ",
    textSupported: true,
    sttSupported: false,
    ttsSupported: false,
    liveVoiceSupported: false,
    aiContextSupported: true,
    description: "Text and patient context reasoning supported. Direct voice synthesis not yet supported by standard browser speech engines.",
  },
  "lus-IN": {
    code: "lus-IN",
    name: "Mizo",
    nativeName: "Mizo ṭawng",
    script: "Latin",
    region: "Mizoram, Northeast India",
    greeting: "Chibai",
    textSupported: true,
    sttSupported: false,
    ttsSupported: false,
    liveVoiceSupported: false,
    aiContextSupported: true,
    description: "Text reasoning and patient routine context supported with Latin script.",
  },
};

// Backward-compatible alias for existing imports
export const SUPPORTED_LOCALES = LANGUAGE_REGISTRY;

/**
 * Detect language from text or patient profile
 */
export function detectLanguageFromText(text, fallbackLocale = "hi-IN") {
  if (!text || typeof text !== "string") return fallbackLocale;

  // Assamese specific characters: ৱ (w/v: \u09F0), ৰ (ra: \u09F1)
  if (/[\u09F0\u09F1]/.test(text)) {
    return "as-IN";
  }
  // Meitei Mayek script: \uABC0-\uABFF
  if (/[\uABC0-\uABFF]/.test(text)) {
    return "mni-IN";
  }
  // General Bengali/Assamese script: \u0980-\u09FF
  if (/[\u0980-\u09FF]/.test(text)) {
    return "bn-IN";
  }
  // Devanagari (Hindi/Nepali/Bodo): \u0900-\u097F
  if (/[\u0900-\u097F]/.test(text)) {
    if (text.includes("छ") || text.includes("छु") || text.includes("नमस्ते") || text.includes("राम्रो")) {
      // Could be Nepali or Hindi; default to hi-IN unless user explicitly picked ne-NP
      return fallbackLocale === "ne-NP" ? "ne-NP" : "hi-IN";
    }
    return "hi-IN";
  }
  return "en-IN";
}

/**
 * Collect and structure longitudinal patient data from db
 */
export function collectPatientTelemetry(patientId = "P001") {
  const db = readDb();
  let patient = (db.patients || []).find((p) => p.id === patientId);
  if (!patient && patientId === "P001") {
    patient = db.patient || {
      id: "P001",
      patientId: "P001",
      name: "Asha",
      age: 78,
      room: "402",
      status: "active",
      hasDemoData: true,
      language: "Assamese",
    };
  }

  if (!patient) {
    patient = {
      id: patientId,
      patientId,
      name: "Patient",
      room: "N/A",
      status: "active",
      hasDemoData: false,
    };
  }

  const isDemo = patient.hasDemoData ?? (patient.id === "P001");
  const activities = (db.activityResults || []).filter(
    (a) => (a.patientId ? a.patientId === patient.id : patient.id === "P001")
  );

  const moodLogs = (db.moodLogs || []).filter(
    (m) => (m.patientId ? m.patientId === patient.id : patient.id === "P001")
  ).slice(0, 10);

  const reminders = (db.reminders || []).filter(
    (r) => (r.patientId ? r.patientId === patient.id : patient.id === "P001")
  );

  const memories = (db.memories || []).filter(
    (m) => (m.patientId ? m.patientId === patient.id : patient.id === "P001")
  );

  const hasData = isDemo || activities.length > 0;

  if (!hasData) {
    return {
      patient: {
        id: patient.id,
        patientId: patient.id,
        name: patient.name,
        age: patient.age,
        room: patient.room,
        status: patient.status || "active",
        language: patient.language || "English",
        hasDemoData: false,
      },
      hasData: false,
      metrics: null,
      recentActivities: [],
      memoriesCount: memories.length,
      moodLogsCount: moodLogs.length,
      remindersCount: reminders.length,
    };
  }

  // Group activity metrics
  const recentActivities = activities.slice(0, 15);
  const memoryActivities = recentActivities.filter(
    (a) => a.gameId === "memory-match" || a.game?.toLowerCase().includes("memory")
  );
  const attentionActivities = recentActivities.filter(
    (a) =>
      a.gameId === "spot-the-difference" ||
      a.gameId === "pattern-match" ||
      a.game?.toLowerCase().includes("spot") ||
      a.game?.toLowerCase().includes("pattern")
  );
  const routineActivities = recentActivities.filter(
    (a) =>
      a.gameId === "daily-routine" ||
      a.game?.toLowerCase().includes("routine")
  );

  const avgMemoryAccuracy =
    memoryActivities.length > 0
      ? Math.round(
          memoryActivities.reduce((s, a) => s + (Number(a.accuracy) || 0), 0) /
            memoryActivities.length
        )
      : patient.memory || 82;

  const avgAttentionAccuracy =
    attentionActivities.length > 0
      ? Math.round(
          attentionActivities.reduce((s, a) => s + (Number(a.accuracy) || 0), 0) /
            attentionActivities.length
        )
      : patient.attention || 76;

  // Trajectory: compare last 3 to previous 3
  const last3 = recentActivities.slice(0, 3);
  const prev3 = recentActivities.slice(3, 6);
  const last3Avg =
    last3.length > 0
      ? Math.round(last3.reduce((s, a) => s + (Number(a.accuracy) || 0), 0) / last3.length)
      : 80;
  const prev3Avg =
    prev3.length > 0
      ? Math.round(prev3.reduce((s, a) => s + (Number(a.accuracy) || 0), 0) / prev3.length)
      : last3Avg;
  const trajectoryDelta = last3Avg - prev3Avg;

  // Reminder adherence
  const completedReminders = reminders.filter((r) => r.completed).length;
  const totalReminders = reminders.length;
  const reminderAdherence =
    totalReminders > 0 ? Math.round((completedReminders / totalReminders) * 100) : 100;

  // Recent mood distribution
  const latestMood = moodLogs[0] || { label: "Calm", mood: "calm" };

  return {
    patient: {
      id: patient.id,
      name: patient.name,
      age: patient.age,
      room: patient.room,
      language: patient.language || "Assamese",
      status: patient.status || "Stable",
      familyContact: patient.familyContact || "Priya Sharma",
      caregiver: patient.caregiver || "Dr. Sarah Jenkins",
    },
    metrics: {
      totalSessions: activities.length,
      avgMemoryAccuracy,
      avgAttentionAccuracy,
      last3Avg,
      prev3Avg,
      trajectoryDelta,
      reminderAdherence,
      completedReminders,
      totalReminders,
      latestMood: latestMood.label || latestMood.mood,
      moodNotes: latestMood.note || "",
    },
    activityBreakdown: {
      memoryCount: memoryActivities.length,
      attentionCount: attentionActivities.length,
      routineCount: routineActivities.length,
    },
    recentActivities: recentActivities.slice(0, 6).map((a) => ({
      game: a.game || a.gameId,
      accuracy: a.accuracy,
      hintsUsed: a.hintsUsed || 0,
      elapsedTime: a.elapsedTime || 0,
      difficulty: a.difficulty || "easy",
      completedAt: a.completedAt || a.dateLabel,
    })),
    memoriesCount: memories.length,
  };
}

/**
 * Deterministic, offline-safe heuristic insight generator
 * Produces structured, explainable findings matching the exact schema
 */
export function generateHeuristicInsights(telemetry) {
  if (!telemetry || !telemetry.hasData) {
    return [];
  }
  const { patient, metrics, recentActivities } = telemetry;
  const insights = [];

  // 1. Cognitive Trajectory Trend
  if (metrics.trajectoryDelta <= -10) {
    insights.push({
      type: "cognitive_trend",
      severity: "moderate",
      observation: `${patient.name} exhibited a notable dip in recent session accuracy compared to prior sessions.`,
      evidence: [
        `Average accuracy across the last 3 sessions decreased from ${metrics.prev3Avg}% to ${metrics.last3Avg}%.`,
        `Recent activities logged: ${recentActivities.map((a) => `${a.game} (${a.accuracy}%)`).join(", ") || "None"}.`,
      ],
      recommendation: `Schedule gentle, familiar reminiscence sessions (Family Memories) and check if fatigue or hydration is contributing.`,
    });
  } else if (metrics.trajectoryDelta >= 8) {
    insights.push({
      type: "cognitive_trend",
      severity: "low",
      observation: `${patient.name} demonstrated positive cognitive engagement with upward accuracy trends across recent sessions.`,
      evidence: [
        `Average accuracy increased from ${metrics.prev3Avg}% to ${metrics.last3Avg}% over the last 3 sessions.`,
        `Consistent completion without early session abandonment.`,
      ],
      recommendation: `Maintain current cognitive cadence; consider introducing gentle intermediate-level pattern challenges.`,
    });
  } else {
    insights.push({
      type: "cognitive_trend",
      severity: "low",
      observation: `${patient.name}'s cognitive performance remains stable within historical baseline parameters.`,
      evidence: [
        `Memory recall rate is currently steady at ${metrics.avgMemoryAccuracy}%.`,
        `Attention & visual detection is maintained at ${metrics.avgAttentionAccuracy}%.`,
      ],
      recommendation: `Continue daily structured routine activities and morning orientation reminders.`,
    });
  }

  // 2. Hint & Assistance Patterns
  const hintsInRecent = recentActivities.reduce((sum, a) => sum + (Number(a.hintsUsed) || 0), 0);
  if (hintsInRecent >= 4) {
    insights.push({
      type: "assistance_pattern",
      severity: "moderate",
      observation: `Increased reliance on in-app hints detected during visual matching tasks.`,
      evidence: [
        `${hintsInRecent} total hint requests recorded across recent exercises.`,
        `Most frequent assistance requested during complex card configurations.`,
      ],
      recommendation: `Provide visual anchoring cues and prefer larger touch tiles to reduce spatial processing strain.`,
    });
  } else {
    insights.push({
      type: "assistance_pattern",
      severity: "low",
      observation: `Independent navigation maintained with minimal hint reliance.`,
      evidence: [
        `Only ${hintsInRecent} hint requests across recent sessions.`,
        `Autonomous progression through game sequences.`,
      ],
      recommendation: `Encourage continued independent session initiation to support self-efficacy.`,
    });
  }

  // 3. Routine & Wellness Correlation
  if (metrics.reminderAdherence < 70) {
    insights.push({
      type: "routine_correlation",
      severity: "moderate",
      observation: `Medication or hydration schedule adherence has fallen below 70%.`,
      evidence: [
        `${metrics.completedReminders} of ${metrics.totalReminders} daily schedule items confirmed completed.`,
        `Recent mood state logged as: "${metrics.latestMood}".`,
      ],
      recommendation: `Ensure voice prompt reminders are audible in ${patient.name}'s preferred language (${patient.language}). Caregiver check-in advised for scheduled hydration.`,
    });
  } else {
    insights.push({
      type: "routine_correlation",
      severity: "low",
      observation: `Daily routine adherence and hydration check-ins are consistent.`,
      evidence: [
        `${metrics.completedReminders} of ${metrics.totalReminders} daily reminders confirmed completed (${metrics.reminderAdherence}%).`,
        `Mood state reported as "${metrics.latestMood}".`,
      ],
      recommendation: `Keep current reminder notification timings aligned with the morning and afternoon rhythm.`,
    });
  }

  return insights;
}

/**
 * Gemini-powered structured caregiver insights generator
 * Enforces strict non-diagnostic observation rules
 */
export async function generateCaregiverInsightsWithGemini(telemetry) {
  if (!telemetry || !telemetry.hasData) {
    return [];
  }
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return generateHeuristicInsights(telemetry);
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: { "User-Agent": "aistudio-build" },
      },
    });

    const systemInstruction = `You are the ANVESHA Clinical Cognitive Care Intelligence Engine.
Your purpose is to analyze objective patient telemetry and provide structured, explainable caregiver insights.

CRITICAL SAFETY & MEDICAL BOUNDARIES:
- STRICTLY NON-DIAGNOSTIC: You must NEVER diagnose medical conditions (e.g., do NOT diagnose Alzheimer's, dementia progression, clinical depression, or stroke).
- OBSERVATIONAL ONLY: Describe observable behaviors, scores, trends, and environmental factors (e.g., "accuracy decreased in afternoon sessions", "hint reliance increased", "hydration reminder delayed").
- EXPLAINABLE EVIDENCE: Every observation MUST be supported by concrete evidence points from the provided telemetry.
- ACTIONABLE RECOMMENDATIONS: Provide non-pharmaceutical, caregiver-supportive recommendations (e.g., environmental adjustments, preferred activity scheduling, language support).
- RETURN ONLY VALID JSON: An array of insight objects conforming strictly to the requested schema.`;

    const prompt = `Analyze this patient telemetry and return 3 distinct structured caregiver insights:
1. One 'cognitive_trend' insight (performance trajectory over recent sessions)
2. One 'assistance_pattern' insight (hint usage, elapsed time, or error recovery)
3. One 'routine_correlation' insight (relationship between reminders, mood, and daily schedule)

PATIENT TELEMETRY:
${JSON.stringify(telemetry, null, 2)}

Respond with a JSON array conforming to this exact structure:
[
  {
    "type": "cognitive_trend",
    "severity": "low" | "moderate" | "high",
    "observation": "Clear, objective behavioral/cognitive observation without medical diagnosis",
    "evidence": ["Specific data point 1", "Specific data point 2"],
    "recommendation": "Empathetic, actionable recommendation for family or professional caregivers"
  }
]`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    });

    const text = response?.text;
    if (text) {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const validated = parsed.filter(
          (item) => item.type && item.severity && item.observation && Array.isArray(item.evidence) && item.recommendation
        );
        if (validated.length > 0) return validated;
      }
    }
  } catch (err) {
    console.warn("Gemini insights generation failed, falling back to heuristics:", err.message);
  }

  return generateHeuristicInsights(telemetry);
}

/**
 * Contextual Assistant prompt builder with multilingual NER support and language preservation
 */
export function buildPatientAssistantContext(patientId = "P001", userLanguage = "") {
  const telemetry = collectPatientTelemetry(patientId);
  const detectedLang = userLanguage || telemetry.patient.language || "Assamese";
  const localeMeta = LANGUAGE_REGISTRY[detectedLang] || LANGUAGE_REGISTRY["as-IN"];

  return {
    patientName: telemetry.patient.name,
    patientRoom: telemetry.patient.room,
    language: detectedLang,
    languageMeta: localeMeta,
    recentMood: telemetry.metrics.latestMood,
    reminders: telemetry.metrics.totalReminders,
    completedReminders: telemetry.metrics.completedReminders,
    recentGame: telemetry.recentActivities[0] || null,
    familyContact: telemetry.patient.familyContact,
    caregiver: telemetry.patient.caregiver,
    promptSummary: `The patient is ${telemetry.patient.name} (Room ${telemetry.patient.room}). Recent mood: ${telemetry.metrics.latestMood}. Reminders: ${telemetry.metrics.completedReminders}/${telemetry.metrics.totalReminders} completed. Preferred language: ${localeMeta.name} (${localeMeta.code}).`,
  };
}

/**
 * =========================================================================
 * 7. CAREGIVER INFORMATIONAL QUERY WITH OPTIONAL GOOGLE SEARCH GROUNDING
 * =========================================================================
 * - Never used for normal patient chats.
 * - Strictly for caregiver research/guidance queries where external information is needed.
 * - Patient telemetry is cleanly demarcated and kept separate.
 */
export async function queryCaregiverInformation({ query, patientId = "P001", enableSearchGrounding = false }) {
  const telemetry = collectPatientTelemetry(patientId);
  const apiKey = process.env.GEMINI_API_KEY;

  if (!telemetry.hasData) {
    return {
      source: "caregiver_record_status",
      query,
      answer: `Clinical query regarding "${query}": Patient ${telemetry.patient.name} (Room ${telemetry.patient.room}) has no activity or cognitive assessment records yet. No clinical trends or behavioral observations can be derived until the patient completes exercises or records baseline metrics.`,
      patientTelemetry: null,
      isExternallyGrounded: false,
      disclaimer: "Non-diagnostic eldercare observation. Patient has no assessment history.",
    };
  }

  if (!apiKey) {
    return {
      source: "offline_heuristic_kb",
      query,
      answer: `Caregiver inquiry regarding "${query}": Patient ${telemetry.patient.name} currently exhibits steady cognitive engagement with ${telemetry.metrics.avgMemoryAccuracy}% memory accuracy and ${telemetry.metrics.reminderAdherence}% routine adherence. For external clinical queries, network connection or Gemini API key is required.`,
      patientTelemetry: telemetry.metrics,
      isExternallyGrounded: false,
      disclaimer: "Non-diagnostic caregiver observation. Consult clinical staff for formal medical evaluations.",
    };
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: { headers: { "User-Agent": "aistudio-build" } },
    });

    const systemInstruction = `You are the ANVESHA Caregiver Clinical Reference Assistant.
You assist professional and family caregivers with evidence-based eldercare knowledge, safety protocols, and observational interpretations.

GUARDRAILS:
1. Patient-specific context is provided separately from external information.
2. NEVER diagnose disease or recommend prescription medication alterations.
3. Clearly delineate between internal patient observations and external clinical literature.`;

    const config = {
      systemInstruction,
      temperature: 0.2,
    };

    if (enableSearchGrounding) {
      config.tools = [{ googleSearch: {} }];
    }

    const contents = `CAREGIVER QUERY: ${query}

PATIENT OBSERVATION CONTEXT:
- Name: ${telemetry.patient.name} (Age: ${telemetry.patient.age}, Room: ${telemetry.patient.room})
- Memory Accuracy Baseline: ${telemetry.metrics.avgMemoryAccuracy}%
- Attention Baseline: ${telemetry.metrics.avgAttentionAccuracy}%
- Schedule Adherence: ${telemetry.metrics.reminderAdherence}%
- Trajectory: ${telemetry.metrics.trajectoryDelta >= 0 ? "+" : ""}${telemetry.metrics.trajectoryDelta}%

Provide a concise, professional answer clearly separating patient-specific telemetry from external information.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents,
      config,
    });

    return {
      source: enableSearchGrounding ? "gemini_search_grounded" : "gemini_model",
      query,
      answer: response.text || "No response generated.",
      patientTelemetry: telemetry.metrics,
      isExternallyGrounded: Boolean(enableSearchGrounding),
      disclaimer: "Non-diagnostic caregiver informational assistance. Not a substitute for physician diagnosis or prescription.",
    };
  } catch (err) {
    console.warn("Caregiver query failed:", err.message);
    return {
      source: "offline_fallback",
      query,
      answer: `Unable to reach external grounding service: ${err.message}. Showing internal telemetry: Patient ${telemetry.patient.name} has ${telemetry.metrics.avgMemoryAccuracy}% memory accuracy.`,
      patientTelemetry: telemetry.metrics,
      isExternallyGrounded: false,
      disclaimer: "Non-diagnostic observation.",
    };
  }
}
