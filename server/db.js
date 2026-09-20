import fs from "fs";
import path from "path";

const DB_PATH = path.join(process.cwd(), "data", "db.json");

const defaultSeed = {
  patient: {
    id: "P001",
    name: "Asha",
    age: 78,
    room: "402",
    status: "Stable",
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
      name: "Asha",
      age: 78,
      room: "402",
      status: "Stable",
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
    return JSON.parse(raw);
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

export function getReminders() {
  const db = readDb();
  return db.reminders || [];
}

export function addReminder(reminder) {
  const db = readDb();
  const newReminder = {
    id: Date.now(),
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

  const history = db.activityResults || [];
  const adaptivePlan = generateAdaptivePlan(formattedResult, history);
  formattedResult.adaptivePlan = adaptivePlan;

  db.activityResults = [formattedResult, ...history];

  // Update Asha's caregiver record in db.patients[0]
  if (db.patients && db.patients.length > 0) {
    const asha = db.patients[0];
    asha.lastActive = "Just now";
    asha.activityTime = "Just now";
    asha.recentActivity = formattedResult.game;
    asha.gameScore = formattedResult.score || formattedResult.accuracy;

    // Recalculate memory, attention, or cognitive index based on activity
    if (formattedResult.category === "attention" || formattedResult.gameId === "spot-the-difference" || formattedResult.gameId === "pattern-match") {
      asha.attention = Math.round((asha.attention * 0.65) + (formattedResult.accuracy * 0.35));
    } else {
      asha.memory = Math.round((asha.memory * 0.65) + (formattedResult.accuracy * 0.35));
    }

    let icon = "🧠";
    if (formattedResult.gameId === "spot-the-difference") icon = "🎯";
    else if (formattedResult.gameId === "pattern-match") icon = "🧩";
    else if (formattedResult.gameId === "daily-routine") icon = "📅";

    asha.activityHistory = [
      {
        name: formattedResult.game,
        score: formattedResult.accuracy,
        time: formattedResult.dateLabel,
        icon,
      },
      ...(asha.activityHistory || []).slice(0, 9),
    ];
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

export function getCaregiverPatients() {
  const db = readDb();
  return db.patients || [];
}

export function getCaregiverPatientById(id) {
  const db = readDb();
  return (db.patients || []).find((p) => p.id === id) || null;
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

export function getCaregiverAnalytics() {
  const db = readDb();
  const patient = db.patients?.[0] || db.patient;
  const activities = db.activityResults || [];

  const memorySessions = activities.filter((a) => a.gameId === "memory-match").length || 7;
  const spotSessions = activities.filter((a) => a.gameId === "spot-the-difference").length || 5;
  const patternSessions = activities.filter((a) => a.gameId === "pattern-match").length || 4;
  const routineSessions = activities.filter((a) => a.gameId === "daily-routine").length || 3;

  return {
    patient: {
      ...patient,
      trend: db.analytics?.trend || [70, 75, 78, 80, 82],
      completion: db.analytics?.completion || 92,
      sessions: activities.length + 12,
    },
    activities: [
      { name: "Memory Recall", score: patient?.memory || 82, sessions: memorySessions },
      { name: "Pattern Recognition", score: patient?.attention || 76, sessions: patternSessions + spotSessions },
      { name: "Daily Routine", score: 81, sessions: routineSessions },
    ]
  };
}

export function getMemories() {
  const db = readDb();
  return db.memories || [
    {
      id: 1,
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
      title: "Festival Memory",
      subtitle: "A familiar celebration",
      category: "Culture",
      image: "",
      description: "A familiar festival memory involving family, traditional food and celebration.",
      year: "Family Tradition",
      favorite: false,
    },
  ];
}
export function updateMemory(id, updates) {
  const db = readDb();
  const numId = Number(id);

  const memories = db.memories || [];

  const index = memories.findIndex(
    (memory) => memory.id === numId
  );

  if (index === -1) {
    return null;
  }

  memories[index] = {
    ...memories[index],
    ...updates,
  };

  db.memories = memories;

  writeDb(db);

  return memories[index];
}

export function addMemory(mem) {
  const db = readDb();
  const newMem = {
    id: Date.now(),
    title: mem.title || "New Memory",
    subtitle: mem.subtitle || "Family Memory",
    category: mem.category || "Family",
    image: mem.image || "",
    description: mem.description || "",
    year: mem.year || "2025",
    favorite: !!mem.favorite,
  };
  db.memories = [newMem, ...(db.memories || getMemories())];
  writeDb(db);
  return newMem;
}
