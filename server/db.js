import fs from "fs";
import path from "path";

const DB_PATH = path.join(process.cwd(), "data", "db.json");

const defaultSeed = {
  patient: {
    id: "P001",
    name: "Asha",
    age: 78,
    room: "402",
    status: "active",
    hasDemoData: true,
    memory: 82,
    attention: 76,
    engagement: 87,
    caregiver: "Dr. Sarah Jenkins",
    language: "Assamese",
    location: "Assam, NER",
    medication: "Taken",
    hydration: "Good",
    sleep: "7h 20m",
    familyContact: "Priya Sharma",
    familyRelation: "Daughter",
    safetyStatus: "Safe",
    emergencyContact: "Priya Sharma"
  },
  patients: [
    {
      id: "P001",
      patientId: "P001",
      name: "Asha",
      age: 78,
      room: "402",
      status: "active",
      hasDemoData: true,
      memory: 82,
      attention: 76,
      lastActive: "Just now",
      recentActivity: "Memory Recall",
      gameScore: 84,
      mood: "Calm",
      alert: "No immediate alerts",
      activityTime: "Just now",
      language: "Assamese",
      location: "Assam, NER",
      caregiver: "Dr. Sarah Jenkins",
      medication: "Taken",
      hydration: "Good",
      sleep: "7h 20m",
      engagement: "87%",
      familyContact: "Priya Sharma",
      familyRelation: "Daughter",
      safetyStatus: "Safe",
      emergencyContact: "Priya Sharma",
      activityHistory: [
        {
          name: "Memory Recall",
          score: 84,
          time: "Today • 2:00 PM",
          icon: "🧠"
        }
      ]
    },
    {
      id: "P002",
      patientId: "P002",
      name: "Ramesh",
      age: 74,
      room: "205",
      status: "active",
      hasDemoData: false,
      caregiver: "Dr. Sarah Jenkins",
      familyContact: "Anita Kumar",
      familyRelation: "Spouse",
      emergencyContact: "Anita Kumar",
      memory: null,
      attention: null,
      engagement: null,
      lastActive: "No sessions yet",
      recentActivity: null,
      gameScore: null,
      mood: "Not logged",
      alert: "None",
      activityTime: null,
      language: "Hindi",
      location: "Care Wing B",
      medication: "Pending",
      hydration: "Pending",
      sleep: "Not recorded",
      safetyStatus: "Safe",
      activityHistory: []
    },
    {
      id: "P003",
      patientId: "P003",
      name: "Kavita",
      age: 69,
      room: "318",
      status: "active",
      hasDemoData: false,
      caregiver: "Dr. Sarah Jenkins",
      familyContact: "Suresh Patel",
      familyRelation: "Son",
      emergencyContact: "Suresh Patel",
      memory: null,
      attention: null,
      engagement: null,
      lastActive: "No sessions yet",
      recentActivity: null,
      gameScore: null,
      mood: "Not logged",
      alert: "None",
      activityTime: null,
      language: "English",
      location: "Care Wing C",
      medication: "Pending",
      hydration: "Pending",
      sleep: "Not recorded",
      safetyStatus: "Safe",
      activityHistory: []
    },
    {
      id: "P004",
      patientId: "P004",
      name: "David",
      age: 81,
      room: "114",
      status: "active",
      hasDemoData: false,
      caregiver: "Dr. Sarah Jenkins",
      familyContact: "Grace Chen",
      familyRelation: "Daughter",
      emergencyContact: "Grace Chen",
      memory: null,
      attention: null,
      engagement: null,
      lastActive: "No sessions yet",
      recentActivity: null,
      gameScore: null,
      mood: "Not logged",
      alert: "None",
      activityTime: null,
      language: "English",
      location: "Care Wing A",
      medication: "Pending",
      hydration: "Pending",
      sleep: "Not recorded",
      safetyStatus: "Safe",
      activityHistory: []
    }
  ],
  reminders: [
    {
      id: 1,
      type: "Medicine",
      title: "Morning Medicine",
      time: "8:00 AM",
      description: "Take your morning medicine after breakfast.",
      completed: true
    },
    {
      id: 2,
      type: "Hydration",
      title: "Drink Water",
      time: "10:00 AM",
      description: "Drink one glass of fresh water.",
      completed: false
    },
    {
      id: 3,
      type: "Medicine",
      title: "Afternoon Medicine",
      time: "2:00 PM",
      description: "Take your afternoon medicine.",
      completed: false
    },
    {
      id: 4,
      type: "Appointment",
      title: "Doctor Appointment",
      time: "4:00 PM",
      description: "General wellness consultation at 4 PM.",
      completed: false
    }
  ],
  moodLogs: [
    {
      id: 1,
      mood: "happy",
      label: "Happy",
      emoji: "😊",
      timestamp: new Date().toISOString(),
      dateLabel: "Today",
      reasons: ["Family", "Music"],
      note: "Felt cheerful and enjoyed talking with family."
    }
  ],
  activityResults: [],
  alerts: [
    {
      id: 1,
      patient: "Martha Washington",
      patientId: "P002",
      age: 82,
      room: "Rm 112",
      type: "Medication",
      message: "Morning medication is overdue by 30 minutes.",
      time: "15 mins ago",
      priority: "HIGH",
      icon: "💊",
      status: "Pending"
    }
  ],
  analytics: {
    trend: [68, 72, 75, 78, 80, 79, 82],
    memory: 82,
    attention: 76,
    engagement: 87,
    completion: 92
  }
};

export function readDb() {
  try {
    if (!fs.existsSync(DB_PATH)) {
      const dir = path.dirname(DB_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(DB_PATH, JSON.stringify(defaultSeed, null, 2), "utf8");
      return defaultSeed;
    }
    const raw = fs.readFileSync(DB_PATH, "utf8");
    const db = JSON.parse(raw);

    // Normalize patients list to guarantee the 4 official patients
    if (!db.patients || !Array.isArray(db.patients)) {
      db.patients = defaultSeed.patients;
    }

    const asha = db.patients.find((p) => p.id === "P001") || defaultSeed.patients[0];
    asha.hasDemoData = true;
    asha.patientId = "P001";
    asha.status = "active";
    asha.room = "402";
    asha.caregiver = "Dr. Sarah Jenkins";
    asha.familyContact = "Priya Sharma";

    const officialEmpty = [
      {
        id: "P002",
        patientId: "P002",
        name: "Ramesh",
        age: 74,
        room: "205",
        status: "active",
        hasDemoData: false,
        caregiver: "Dr. Sarah Jenkins",
        familyContact: "Anita Kumar",
        familyRelation: "Spouse",
        emergencyContact: "Anita Kumar",
        memory: null,
        attention: null,
        engagement: null,
        lastActive: "No sessions yet",
        recentActivity: null,
        gameScore: null,
        mood: "Not logged",
        alert: "None",
        activityTime: null,
        language: "Hindi",
        location: "Care Wing B",
        medication: "Pending",
        hydration: "Pending",
        sleep: "Not recorded",
        safetyStatus: "Safe",
        activityHistory: [],
      },
      {
        id: "P003",
        patientId: "P003",
        name: "Kavita",
        age: 69,
        room: "318",
        status: "active",
        hasDemoData: false,
        caregiver: "Dr. Sarah Jenkins",
        familyContact: "Suresh Patel",
        familyRelation: "Son",
        emergencyContact: "Suresh Patel",
        memory: null,
        attention: null,
        engagement: null,
        lastActive: "No sessions yet",
        recentActivity: null,
        gameScore: null,
        mood: "Not logged",
        alert: "None",
        activityTime: null,
        language: "English",
        location: "Care Wing C",
        medication: "Pending",
        hydration: "Pending",
        sleep: "Not recorded",
        safetyStatus: "Safe",
        activityHistory: [],
      },
      {
        id: "P004",
        patientId: "P004",
        name: "David",
        age: 81,
        room: "114",
        status: "active",
        hasDemoData: false,
        caregiver: "Dr. Sarah Jenkins",
        familyContact: "Grace Chen",
        familyRelation: "Daughter",
        emergencyContact: "Grace Chen",
        memory: null,
        attention: null,
        engagement: null,
        lastActive: "No sessions yet",
        recentActivity: null,
        gameScore: null,
        mood: "Not logged",
        alert: "None",
        activityTime: null,
        language: "English",
        location: "Care Wing A",
        medication: "Pending",
        hydration: "Pending",
        sleep: "Not recorded",
        safetyStatus: "Safe",
        activityHistory: [],
      },
    ];

    const normalizedEmpty = officialEmpty.map((reqP) => {
      const existing = db.patients.find((p) => p.id === reqP.id);
      if (existing) {
        return {
          ...existing,
          ...reqP,
          hasDemoData: false,
          activityHistory: existing.activityHistory && existing.activityHistory.length > 0 && existing.name === reqP.name ? existing.activityHistory : [],
        };
      }
      return reqP;
    });

    db.patients = [asha, ...normalizedEmpty];

    return db;
  } catch (err) {
    console.error("Error reading db.json:", err);
    return defaultSeed;
  }
}

export function writeDb(data) {
  try {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf8");
    return true;
  } catch (err) {
    console.error("Error writing db.json:", err);
    return false;
  }
}

// Adaptive plan generator helper (matches src/ai/adaptiveEngine.js)
const ACTIVITY_LEVELS = ["easy", "medium", "hard"];

function analyzePerformance(result, history = []) {
  const accuracy = Number(result?.accuracy || 0);
  const hints = Number(result?.hintsUsed || 0);
  const time = Number(result?.elapsedTime || 0);

  let performanceScore = accuracy;
  performanceScore -= hints * 5;
  if (time > 0 && time <= 40) {
    performanceScore += 5;
  } else if (time >= 90) {
    performanceScore -= 5;
  }

  performanceScore = Math.max(0, Math.min(100, Math.round(performanceScore)));

  let performanceBand = "moderate";
  if (performanceScore >= 80) {
    performanceBand = "strong";
  } else if (performanceScore < 60) {
    performanceBand = "needs_support";
  }

  return {
    performanceScore,
    performanceBand,
    accuracy,
    hints,
    time,
    historyCount: history.length,
  };
}

function generateAdaptivePlan(result, history = []) {
  const analysis = analyzePerformance(result, history);
  let difficulty = result?.difficulty || "easy";
  let activity = "Memory Game";
  let reason = "";

  if (analysis.performanceBand === "strong") {
    const idx = ACTIVITY_LEVELS.indexOf(difficulty);
    difficulty = ACTIVITY_LEVELS[Math.min(idx + 1, ACTIVITY_LEVELS.length - 1)];
    activity = result?.category === "People" ? "Spot the Difference" : "Memory Game";
    reason = "Strong recent performance detected. Increasing cognitive challenge gradually.";
  } else if (analysis.performanceBand === "needs_support") {
    const idx = ACTIVITY_LEVELS.indexOf(difficulty);
    difficulty = ACTIVITY_LEVELS[Math.max(idx - 1, 0)];
    activity = "Family Memory Recall";
    reason = "Recent performance suggests higher cognitive load. Returning to familiar memories with gentler difficulty.";
  } else {
    difficulty = result?.difficulty || "medium";
    activity = result?.category === "People" ? "Family Memory Recall" : "Memory Game";
    reason = "Performance is stable. Maintaining challenge while reinforcing cognitive rhythm.";
  }

  return {
    activity,
    difficulty,
    performanceScore: analysis.performanceScore,
    performanceBand: analysis.performanceBand,
    reason,
    recommendedTime: analysis.performanceBand === "strong" ? "10–15 min" : "5–10 min",
  };
}

// Service Methods
export function getPatientProfile() {
  const db = readDb();
  return db.patient;
}

export function updatePatientProfile(updates) {
  const db = readDb();
  db.patient = { ...db.patient, ...updates };
  // Keep first patient in roster in sync
  if (db.patients && db.patients.length > 0 && db.patients[0].id === db.patient.id) {
    db.patients[0] = { ...db.patients[0], ...updates };
  }
  writeDb(db);
  return db.patient;
}

export function getReminders(patientId) {
  const db = readDb();
  const all = db.reminders || [];
  if (!patientId) return all;
  if (patientId === "P001") {
    return all.filter((r) => !r.patientId || r.patientId === "P001");
  }
  return all.filter((r) => r.patientId === patientId);
}

export function addReminder(reminder) {
  const db = readDb();
  const newReminder = {
    id: Date.now(),
    patientId: reminder.patientId || "P001",
    type: reminder.type || "Medicine",
    title: reminder.title || "New Reminder",
    time: reminder.time || "12:00 PM",
    description: reminder.description || "",
    completed: false,
    ...reminder,
  };
  db.reminders = [...(db.reminders || []), newReminder];
  writeDb(db);
  return newReminder;
}

export function toggleReminder(id) {
  const db = readDb();
  const numId = Number(id);
  db.reminders = (db.reminders || []).map((r) =>
    r.id === numId ? { ...r, completed: !r.completed } : r
  );
  writeDb(db);
  return db.reminders.find((r) => r.id === numId);
}

export function deleteReminder(id) {
  const db = readDb();
  const numId = Number(id);
  db.reminders = (db.reminders || []).filter((r) => r.id !== numId);
  writeDb(db);
  return { success: true };
}

export function getMoodLogs() {
  const db = readDb();
  return db.moodLogs || [];
}

export function addMoodLog(entry) {
  const db = readDb();
  const newLog = {
    id: Date.now(),
    mood: entry.mood || "calm",
    label: entry.label || "Calm",
    emoji: entry.emoji || "😌",
    timestamp: new Date().toISOString(),
    dateLabel: "Today",
    reasons: entry.reasons || [],
    note: entry.note || "",
  };
  db.moodLogs = [newLog, ...(db.moodLogs || [])];
  
  // Update patient's current mood in profile and caregiver roster
  if (db.patient) {
    db.patient.mood = newLog.label;
  }
  if (db.patients && db.patients.length > 0) {
    db.patients[0].mood = newLog.label;
  }

  writeDb(db);
  return newLog;
}

export function recordActivityResult(result) {
  const db = readDb();
  const now = new Date();

  const formattedResult = {
    id: Date.now(),
    gameId: result.gameId || (result.game === "Spot the Difference" ? "spot-the-difference" : "memory-match"),
    game: result.game || (result.gameId === "spot-the-difference" ? "Spot the Difference" : "Memory Game"),
    difficulty: result.difficulty || "easy",
    theme: result.theme || "Family",
    category: result.category || "memory",
    accuracy: Number(result.accuracy ?? 80),
    score: Number(result.score ?? result.accuracy ?? 80),
    performanceLevel: result.performanceLevel || (Number(result.accuracy ?? 80) >= 85 ? "Strong" : Number(result.accuracy ?? 80) >= 65 ? "Good" : "Needs Support"),
    moves: Number(result.moves || 0),
    hintsUsed: Number(result.hintsUsed || 0),
    mistakes: Number(result.mistakes || 0),
    elapsedTime: Number(result.elapsedTime || 0),
    completedAt: now.toISOString(),
    dateLabel: `Today • ${now.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}`,
  };

  const patientId = result.patientId || "P001";
  formattedResult.patientId = patientId;

  const history = db.activityResults || [];
  const adaptivePlan = generateAdaptivePlan(formattedResult, history);
  formattedResult.adaptivePlan = adaptivePlan;

  db.activityResults = [formattedResult, ...history];

  const syncTimestamp = now.toISOString();

  // Update target patient's record in db.patients
  if (db.patients && db.patients.length > 0) {
    const targetPatient = db.patients.find((p) => p.id === patientId) || db.patients[0];
    targetPatient.lastActive = "Just now";
    targetPatient.activityTime = "Just now";
    targetPatient.recentActivity = formattedResult.game;
    targetPatient.gameScore = formattedResult.score || formattedResult.accuracy;
    targetPatient.lastSyncedAt = syncTimestamp;
    targetPatient.isOnline = true;
    targetPatient.pendingSyncCount = 0;

    // Recalculate memory, attention, or cognitive index based on activity
    if (formattedResult.category === "attention" || formattedResult.gameId === "spot-the-difference" || formattedResult.gameId === "pattern-match") {
      targetPatient.attention = Math.round(((targetPatient.attention || 76) * 0.65) + (formattedResult.accuracy * 0.35));
    } else {
      targetPatient.memory = Math.round(((targetPatient.memory || 82) * 0.65) + (formattedResult.accuracy * 0.35));
    }

    let icon = "🧠";
    if (formattedResult.gameId === "spot-the-difference") icon = "🎯";
    else if (formattedResult.gameId === "pattern-match") icon = "🧩";
    else if (formattedResult.gameId === "daily-routine") icon = "📅";

    targetPatient.activityHistory = [
      {
        name: formattedResult.game,
        score: formattedResult.score || formattedResult.accuracy,
        time: formattedResult.dateLabel,
        timestamp: formattedResult.completedAt,
        icon,
      },
      ...(targetPatient.activityHistory || []).slice(0, 9),
    ];
  }

  if (db.patient && (!result.patientId || result.patientId === db.patient.id)) {
    db.patient.lastActive = "Just now";
    db.patient.activityTime = "Just now";
    db.patient.recentActivity = formattedResult.game;
    db.patient.gameScore = formattedResult.score || formattedResult.accuracy;
    db.patient.lastSyncedAt = syncTimestamp;
    db.patient.isOnline = true;
  }

  // Update analytics trend
  if (db.analytics && Array.isArray(db.analytics.trend)) {
    db.analytics.trend = [...db.analytics.trend.slice(-6), formattedResult.accuracy];
    if (db.patients && db.patients[0]) {
      db.analytics.memory = db.patients[0].memory;
      db.analytics.attention = db.patients[0].attention;
    }
  }

  writeDb(db);
  return { result: formattedResult, adaptivePlan };
}

export function getProgress() {
  const db = readDb();
  const activities = db.activityResults || [];

  // Determine completed today
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const completedToday = activities.filter((act) => {
    if (!act.completedAt) return false;
    const actDate = new Date(act.completedAt);
    return actDate >= startOfDay;
  }).length;

  const totalAccuracy = activities.reduce((sum, a) => sum + (Number(a.accuracy) || 0), 0);
  const averageAccuracy = activities.length > 0 ? Math.round(totalAccuracy / activities.length) : 84;
  const bestAccuracy = activities.length > 0 ? Math.max(...activities.map((a) => Number(a.accuracy) || 0)) : 88;
  const totalTime = activities.reduce((sum, a) => sum + (Number(a.elapsedTime) || 0), 0);

  const lastActivity = activities[0] || null;
  const nextRecommended = lastActivity?.adaptivePlan || {
    activity: "Memory Game",
    difficulty: "easy",
    performanceScore: 84,
    performanceBand: "strong",
    reason: "A gentle activity to keep your cognitive rhythm active.",
    recommendedTime: "5–10 min",
  };

  const dailyTarget = 3;
  const percentage = Math.min(100, Math.round((completedToday / dailyTarget) * 100));

  return {
    completedToday,
    dailyTarget,
    percentage,
    gamesPlayed: activities.length,
    averageAccuracy,
    bestAccuracy,
    totalTime,
    recentActivities: activities.slice(0, 10),
    nextRecommended,
  };
}

export function getPatientSyncStatus(patientId = "P001") {
  const db = readDb();
  let patient = (db.patients || []).find((p) => p.id === patientId) || db.patient;
  if (!patient) {
    patient = db.patient || { id: "P001", name: "Asha" };
  }

  const lastSyncedAt = patient.lastSyncedAt || patient.currentLocation?.updatedAt || patient.currentLocation?.timestamp || null;
  const pendingCount = Number(patient.pendingSyncCount || 0);

  let state = "offline"; // "synced" | "pending" | "offline"
  let label = "Offline";
  let color = "gray"; // "green" | "yellow" | "gray"

  const now = Date.now();
  const syncTime = lastSyncedAt ? new Date(lastSyncedAt).getTime() : 0;
  const ageMs = now - syncTime;
  const isRecent = syncTime > 0 && ageMs <= 180000; // within 3 minutes

  if (pendingCount > 0) {
    state = "pending";
    label = "Pending sync";
    color = "yellow";
  } else if (isRecent && patient.isOnline !== false) {
    state = "synced";
    label = "Synced";
    color = "green";
  } else if (lastSyncedAt) {
    state = "offline";
    const formatted = new Date(lastSyncedAt).toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
    label = `Last synced ${formatted}`;
    color = "gray";
  } else {
    state = "offline";
    label = "Not yet synced";
    color = "gray";
  }

  return {
    patientId: patient.id || patientId,
    name: patient.name || "Asha",
    state,
    label,
    color,
    lastSyncedAt,
    isRecent,
    pendingCount,
    isOnline: Boolean(isRecent && patient.isOnline !== false),
    updatedAt: new Date().toISOString(),
  };
}

export function updatePatientSyncPing({ patientId = "P001", isOnline = true, pendingCount = 0 }) {
  const db = readDb();
  const targetPatientIndex = (db.patients || []).findIndex((p) => p.id === patientId);
  const nowIso = new Date().toISOString();

  if (db.patient && db.patient.id === patientId) {
    db.patient.isOnline = isOnline;
    db.patient.pendingSyncCount = pendingCount;
    if (isOnline) db.patient.lastSyncedAt = nowIso;
  }

  if (targetPatientIndex !== -1) {
    db.patients[targetPatientIndex].isOnline = isOnline;
    db.patients[targetPatientIndex].pendingSyncCount = pendingCount;
    if (isOnline) db.patients[targetPatientIndex].lastSyncedAt = nowIso;
  }

  writeDb(db);
  return getPatientSyncStatus(patientId);
}

export function getCaregiverPatients() {
  const db = readDb();
  return (db.patients || []).map((p) => ({
    ...p,
    syncStatus: getPatientSyncStatus(p.id),
  }));
}

export function getCaregiverPatientById(id) {
  const db = readDb();
  const p = (db.patients || []).find((patient) => patient.id === id) || (db.patient?.id === id ? db.patient : null);
  if (!p) return null;
  return {
    ...p,
    syncStatus: getPatientSyncStatus(p.id),
  };
}

export function getPatientActivities(patientId = "P001") {
  const db = readDb();
  const targetPatient = (db.patients || []).find((p) => p.id === patientId) || (patientId === "P001" ? db.patient : null);
  const isDemo = targetPatient?.hasDemoData ?? (patientId === "P001");
  const allActivities = db.activityResults || [];
  const patientActivities = allActivities.filter((a) => (a.patientId ? a.patientId === patientId : patientId === "P001"));

  const hasData = isDemo || patientActivities.length > 0;

  return {
    patientId,
    patientName: targetPatient?.name || "Patient",
    hasData,
    activities: patientActivities,
    recentActivity: hasData ? (targetPatient?.recentActivity || (patientActivities[0]?.game ?? "Memory Game")) : null,
    gameScore: hasData ? (targetPatient?.gameScore || (patientActivities[0]?.score ?? 84)) : null,
    activityHistory: hasData ? (targetPatient?.activityHistory || []) : [],
    totalSessions: patientActivities.length,
    syncStatus: getPatientSyncStatus(patientId),
  };
}

export function getCaregiverAlerts() {
  const db = readDb();
  return db.alerts || [];
}

export function createCaregiverAlert(alertData) {
  const db = readDb();
  const newAlert = {
    id: Date.now(),
    patient: alertData.patient || "Asha",
    patientId: alertData.patientId || "P001",
    age: alertData.age || 78,
    room: alertData.room || "Rm 402",
    type: alertData.type || "Emergency",
    message: alertData.message || "SOS emergency alert triggered by Asha.",
    time: "Just now",
    priority: alertData.priority || "EMERGENCY",
    icon: alertData.icon || "🚨",
    status: "Pending",
  };

  db.alerts = [newAlert, ...(db.alerts || [])];

  // Set safety status to triggered across patient records
  if (db.patient) {
    db.patient.safetyStatus = "Triggered";
  }
  if (db.patients && db.patients.length > 0) {
    db.patients[0].safetyStatus = "Triggered";
    db.patients[0].alert = "SOS button has been triggered";
  }

  writeDb(db);
  return newAlert;
}

export function resolveCaregiverAlert(id) {
  const db = readDb();
  const numId = Number(id);
  db.alerts = (db.alerts || []).map((a) =>
    a.id === numId ? { ...a, status: "Resolved" } : a
  );

  // Check if any emergency alerts remain pending
  const hasPendingEmergency = (db.alerts || []).some(
    (a) => a.status === "Pending" && a.priority === "EMERGENCY"
  );

  if (!hasPendingEmergency) {
    if (db.patient) db.patient.safetyStatus = "Safe";
    if (db.patients && db.patients[0]) {
      db.patients[0].safetyStatus = "Safe";
      db.patients[0].alert = "No immediate alerts";
    }
  }

  writeDb(db);
  return { success: true };
}

export function getCaregiverAnalytics(patientId = "P001") {
  const db = readDb();
  const patient = (db.patients || []).find((p) => p.id === patientId) || (patientId === "P001" ? db.patient : null);
  
  if (!patient) {
    return {
      patient: null,
      hasData: false,
      trend: [],
      totalSessions: 0,
      recentActivities: [],
      activities: [],
      message: "Patient not found",
    };
  }

  const isDemo = patient.hasDemoData ?? (patient.id === "P001");
  const activities = (db.activityResults || []).filter((a) => (a.patientId ? a.patientId === patient.id : patient.id === "P001"));

  if (!isDemo && activities.length === 0) {
    return {
      patient: {
        ...patient,
        trend: [],
        completion: 0,
        sessions: 0,
        syncStatus: getPatientSyncStatus(patient.id),
      },
      hasData: false,
      trend: [],
      totalSessions: 0,
      recentActivities: [],
      activities: [],
      message: "No cognitive assessment data available",
    };
  }

  const memorySessions = activities.filter((a) => a.gameId === "memory-match" || a.game?.includes("Memory")).length || 7;
  const spotSessions = activities.filter((a) => a.gameId === "spot-the-difference" || a.game?.includes("Spot")).length || 5;
  const patternSessions = activities.filter((a) => a.gameId === "pattern-match" || a.game?.includes("Pattern")).length || 4;
  const routineSessions = activities.filter((a) => a.gameId === "daily-routine" || a.game?.includes("Routine")).length || 3;

  // Real trend calculated from actual recorded session accuracy/scores if present
  let trend = [70, 72, 75, 78, 80, 79, 82];
  if (activities.length >= 2) {
    trend = activities.slice(0, 7).reverse().map((a) => Number(a.score || a.accuracy || 75));
  } else if (db.analytics?.trend) {
    trend = db.analytics.trend;
  }

  const completion = db.analytics?.completion || 92;
  const totalSessions = activities.length > 0 ? activities.length : 18;

  return {
    patient: {
      ...patient,
      trend,
      completion,
      sessions: totalSessions,
      syncStatus: getPatientSyncStatus(patient?.id || patientId),
    },
    hasData: true,
    trend,
    totalSessions,
    recentActivities: activities.slice(0, 10),
    activities: [
      { name: "Memory Recall", score: patient?.memory || 82, sessions: memorySessions },
      { name: "Pattern Recognition", score: patient?.attention || 76, sessions: patternSessions + spotSessions },
      { name: "Daily Routine", score: 81, sessions: routineSessions },
    ]
  };
}

export const defaultMemories = [
  {
    id: 1,
    patientId: "P001",
    title: "Priya",
    subtitle: "Daughter",
    category: "People",
    image: "",
    description: "Priya is your daughter. She enjoys spending time with you and visiting on weekends.",
    year: "Family",
    favorite: true,
  },
  {
    id: 2,
    patientId: "P001",
    title: "Rahul",
    subtitle: "Grandson",
    category: "People",
    image: "",
    description: "Rahul is your grandson. You often enjoy talking and playing games together.",
    year: "Family",
    favorite: false,
  },
  {
    id: 3,
    patientId: "P001",
    title: "Family Celebration",
    subtitle: "A special family day",
    category: "Events",
    image: "",
    description: "A happy family gathering filled with conversations, food and shared memories.",
    year: "2024",
    favorite: true,
  },
  {
    id: 4,
    patientId: "P001",
    title: "Morning Garden",
    subtitle: "A familiar place",
    category: "Places",
    image: "",
    description: "A peaceful garden where you enjoyed spending quiet mornings.",
    year: "Childhood",
    favorite: false,
  },
  {
    id: 5,
    patientId: "P001",
    title: "Festival Memory",
    subtitle: "A familiar celebration",
    category: "Culture",
    image: "",
    description: "A familiar festival memory involving family, traditional food and celebration.",
    year: "Family Tradition",
    favorite: false,
  },
  {
    id: 6,
    patientId: "P001",
    title: "Favourite Meal",
    subtitle: "A familiar food memory",
    category: "Culture",
    image: "",
    description: "A favourite traditional meal often prepared during family gatherings.",
    year: "Family Tradition",
    favorite: false,
  },
];

export function getMemoriesByPatientId(patientId = "P001") {
  const db = readDb();
  if (!db.memories || !Array.isArray(db.memories) || db.memories.length === 0) {
    db.memories = defaultMemories.map((m) => ({ ...m, patientId: "P001" }));
    writeDb(db);
  }
  const targetId = patientId || "P001";
  return db.memories.filter((m) => (m.patientId || "P001") === targetId);
}

export function getMemories(patientId = "P001") {
  return getMemoriesByPatientId(patientId);
}

export function saveMemoryWithImage({
  memoryId,
  patientId = "P001",
  originalFilename = "",
  storedFilename = "",
  storedPath = "",
  mimetype = "",
  size = 0,
  uploadTimestamp = new Date().toISOString(),
  title,
  subtitle,
  category,
  description,
  year,
  favorite,
}) {
  const db = readDb();
  if (!db.memories || !Array.isArray(db.memories) || db.memories.length === 0) {
    db.memories = defaultMemories.map((m) => ({ ...m, patientId: "P001" }));
  }

  const existingIndex = memoryId
    ? db.memories.findIndex((m) => String(m.id) === String(memoryId))
    : -1;

  if (existingIndex !== -1) {
    const existing = db.memories[existingIndex];
    // If there was a previous uploaded file on disk, remove it if it differs
    if (existing.filename && existing.filename !== storedFilename) {
      try {
        const oldPath = path.join(process.cwd(), "uploads", "memories", existing.filename);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      } catch (err) {
        console.warn("Could not remove previous memory image file:", err);
      }
    }

    const updated = {
      ...existing,
      patientId: existing.patientId || patientId || "P001",
      image: storedPath,
      originalFilename,
      filename: storedFilename,
      storedPath,
      mimetype,
      size,
      uploadTimestamp,
      timestamp: uploadTimestamp,
      updatedAt: uploadTimestamp,
      ...(title ? { title } : {}),
      ...(subtitle ? { subtitle } : {}),
      ...(category ? { category } : {}),
      ...(description ? { description } : {}),
      ...(year ? { year } : {}),
      ...(typeof favorite !== "undefined" ? { favorite: Boolean(favorite) } : {}),
    };

    db.memories[existingIndex] = updated;
    writeDb(db);
    return updated;
  } else {
    // Create brand new memory
    const newId = memoryId ? (isNaN(Number(memoryId)) ? memoryId : Number(memoryId)) : Date.now();
    const newMemory = {
      id: newId,
      patientId: patientId || "P001",
      title: title || "Personal Memory",
      subtitle: subtitle || "Family moment",
      category: category || "People",
      image: storedPath,
      originalFilename,
      filename: storedFilename,
      storedPath,
      mimetype,
      size,
      uploadTimestamp,
      timestamp: uploadTimestamp,
      description: description || `A personal memory about ${title || "this moment"}.`,
      year: year || "Recent",
      favorite: Boolean(favorite),
    };

    db.memories.unshift(newMemory);

    const targetPatientId = patientId || "P001";
    if (db.patient && db.patient.id === targetPatientId) {
      db.patient.lastSyncedAt = uploadTimestamp;
      db.patient.lastActive = "Just now";
    }
    const targetPatient = (db.patients || []).find((p) => p.id === targetPatientId);
    if (targetPatient) {
      targetPatient.lastSyncedAt = uploadTimestamp;
      targetPatient.lastActive = "Just now";
    }

    writeDb(db);
    return newMemory;
  }
}

export function deleteMemory(memoryId) {
  const db = readDb();
  if (!db.memories || !Array.isArray(db.memories)) {
    return { found: false };
  }

  const memory = db.memories.find((m) => String(m.id) === String(memoryId));
  if (!memory) {
    return { found: false };
  }

  // Delete image file from uploads folder if stored
  const filename = memory.filename || (memory.storedPath ? path.basename(memory.storedPath) : "");
  if (filename) {
    try {
      const filePath = path.join(process.cwd(), "uploads", "memories", filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (err) {
      console.warn("Could not delete image file on disk:", err);
    }
  }

  db.memories = db.memories.filter((m) => String(m.id) !== String(memoryId));
  writeDb(db);
  return { found: true, memory };
}

export function updateMemory(id, updates) {
  const db = readDb();
  const numId = isNaN(Number(id)) ? id : Number(id);

  if (!db.memories || !Array.isArray(db.memories) || db.memories.length === 0) {
    db.memories = defaultMemories.map((m) => ({ ...m, patientId: "P001" }));
  }

  const index = db.memories.findIndex(
    (memory) => String(memory.id) === String(numId)
  );

  if (index === -1) {
    return null;
  }

  db.memories[index] = {
    ...db.memories[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  writeDb(db);
  return db.memories[index];
}

export function addMemory(mem) {
  const db = readDb();
  if (!db.memories || !Array.isArray(db.memories)) {
    db.memories = defaultMemories.map((m) => ({ ...m, patientId: "P001" }));
  }

  const newMem = {
    id: mem.id || Date.now(),
    patientId: mem.patientId || "P001",
    title: mem.title || "New Memory",
    subtitle: mem.subtitle || "Family Memory",
    category: mem.category || "Family",
    image: mem.image || "",
    originalFilename: mem.originalFilename || "",
    filename: mem.filename || "",
    storedPath: mem.storedPath || mem.image || "",
    mimetype: mem.mimetype || "",
    uploadTimestamp: mem.uploadTimestamp || new Date().toISOString(),
    description: mem.description || "",
    year: mem.year || "2025",
    favorite: !!mem.favorite,
  };
  db.memories = [newMem, ...db.memories];
  writeDb(db);
  return newMem;
}

// ==================================================
// PATIENT LOCATION PERSISTENCE & MONITORING
// ==================================================
export function getPatientLocation(patientId = "P001") {
  const db = readDb();
  let patient = (db.patients || []).find((p) => p.id === patientId);
  if (!patient && patientId === "P001") {
    patient = db.patient || { id: "P001", name: "Asha", room: "402", hasDemoData: true };
  }

  if (!patient) {
    return {
      patientId,
      name: "Patient",
      room: null,
      latitude: null,
      longitude: null,
      accuracy: null,
      address: null,
      sharingEnabled: false,
      timestamp: null,
      updatedAt: null,
      status: "UNAVAILABLE",
    };
  }

  const loc = patient?.currentLocation;
  if (!loc || typeof loc.latitude !== "number" || typeof loc.longitude !== "number" || (!patient.hasDemoData && patient.id !== "P001")) {
    return {
      patientId: patient.id || patientId,
      name: patient.name || "Patient",
      room: patient.room || null,
      latitude: null,
      longitude: null,
      accuracy: null,
      address: null,
      sharingEnabled: false,
      timestamp: null,
      updatedAt: null,
      status: "UNAVAILABLE",
    };
  }

  // Determine status: LIVE vs LAST KNOWN vs UNAVAILABLE
  let status = "LAST KNOWN";
  const now = Date.now();
  const updateTime = loc.timestamp ? new Date(loc.timestamp).getTime() : 0;
  const ageMs = now - updateTime;

  if (loc.sharingEnabled === false) {
    status = (typeof loc.latitude === "number" && typeof loc.longitude === "number")
      ? "LAST KNOWN"
      : "UNAVAILABLE";
  } else if (ageMs <= 180000) {
    // Received within last 3 minutes and sharing is active
    status = "LIVE";
  } else {
    // Stale or older
    status = "LAST KNOWN";
  }

  return {
    patientId: patient.id || patientId,
    name: patient.name || "Asha",
    room: patient.room || "402",
    latitude: loc.latitude,
    longitude: loc.longitude,
    accuracy: loc.accuracy != null ? Number(loc.accuracy) : null,
    address: loc.address || "Current Device Location",
    sharingEnabled: Boolean(loc.sharingEnabled),
    timestamp: loc.timestamp || new Date().toISOString(),
    updatedAt: loc.updatedAt || loc.timestamp || new Date().toISOString(),
    status,
  };
}

export function updatePatientLocation(data) {
  const db = readDb();
  const patientId = data.patientId || "P001";

  const { latitude, longitude, accuracy, timestamp, sharingEnabled, address } = data;

  // Validation
  const hasCoordinates = typeof latitude === "number" && typeof longitude === "number";
  if (hasCoordinates) {
    if (isNaN(latitude) || latitude < -90 || latitude > 90) {
      throw new Error("Invalid latitude. Must be a number between -90 and 90.");
    }
    if (isNaN(longitude) || longitude < -180 || longitude > 180) {
      throw new Error("Invalid longitude. Must be a number between -180 and 180.");
    }
  }

  let targetPatientIndex = (db.patients || []).findIndex((p) => p.id === patientId);
  const existingLoc =
    (targetPatientIndex !== -1 && db.patients[targetPatientIndex].currentLocation) ||
    db.patient?.currentLocation ||
    {};

  const finalSharing = typeof sharingEnabled === "boolean" ? sharingEnabled : (existingLoc.sharingEnabled ?? true);

  const updatedLocation = {
    latitude: hasCoordinates ? Number(latitude) : (typeof existingLoc.latitude === "number" ? existingLoc.latitude : null),
    longitude: hasCoordinates ? Number(longitude) : (typeof existingLoc.longitude === "number" ? existingLoc.longitude : null),
    accuracy: typeof accuracy === "number" && !isNaN(accuracy) && accuracy >= 0 ? Number(accuracy) : (existingLoc.accuracy ?? null),
    address: address || existingLoc.address || "Device Current Location",
    sharingEnabled: finalSharing,
    timestamp: timestamp ? new Date(timestamp).toISOString() : new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (db.patient) {
    db.patient.currentLocation = updatedLocation;
    db.patient.lastActive = "Just now";
    db.patient.lastSyncedAt = updatedLocation.updatedAt;
    db.patient.isOnline = true;
    db.patient.pendingSyncCount = 0;
  }

  if (targetPatientIndex !== -1) {
    db.patients[targetPatientIndex].currentLocation = updatedLocation;
    db.patients[targetPatientIndex].lastActive = "Just now";
    db.patients[targetPatientIndex].lastSyncedAt = updatedLocation.updatedAt;
    db.patients[targetPatientIndex].isOnline = true;
    db.patients[targetPatientIndex].pendingSyncCount = 0;
  }

  if (!db.locationHistory) {
    db.locationHistory = [];
  }
  if (hasCoordinates) {
    db.locationHistory.unshift({
      patientId,
      latitude: updatedLocation.latitude,
      longitude: updatedLocation.longitude,
      accuracy: updatedLocation.accuracy,
      timestamp: updatedLocation.timestamp,
    });
    db.locationHistory = db.locationHistory.slice(0, 50);
  }

  writeDb(db);
  return getPatientLocation(patientId);
}

