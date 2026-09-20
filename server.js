import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import multer from "multer";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import {
  getPatientProfile,
  updatePatientProfile,
  getReminders,
  addReminder,
  toggleReminder,
  deleteReminder,
  getMoodLogs,
  addMoodLog,
  recordActivityResult,
  getProgress,
  getCaregiverPatients,
  getCaregiverPatientById,
  getCaregiverAlerts,
  createCaregiverAlert,
  resolveCaregiverAlert,
  getCaregiverAnalytics,
  getPatientSyncStatus,
  updatePatientSyncPing,
  getPatientActivities,
  getMemories,
  getMemoriesByPatientId,
  saveMemoryWithImage,
  deleteMemory,
  updateMemory,
  addMemory,
  getPatientLocation,
  updatePatientLocation,
  readDb,
} from "./server/db.js";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Set up server-side uploads directory for persistent memory images
const UPLOADS_MEMORIES_DIR = path.join(process.cwd(), "uploads", "memories");
if (!fs.existsSync(UPLOADS_MEMORIES_DIR)) {
  fs.mkdirSync(UPLOADS_MEMORIES_DIR, { recursive: true });
}

// Serve uploaded memory images safely
app.use(
  "/uploads/memories",
  express.static(UPLOADS_MEMORIES_DIR, {
    maxAge: "1d",
    index: false,
    dotfiles: "ignore",
  })
);

// Multer memory storage for audio transcription
const upload = multer({
  storage: multer.memoryStorage(),
});

// Multer disk storage for memory images
const memoryDiskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_MEMORIES_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeExt = [".jpg", ".jpeg", ".png", ".gif", ".webp"].includes(ext)
      ? ext
      : ".jpg";
    const patientId =
      req.body && req.body.patientId
        ? String(req.body.patientId).replace(/[^a-zA-Z0-9_-]/g, "")
        : "P001";
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `memory-${patientId}-${uniqueSuffix}${safeExt}`);
  },
});

const memoryUpload = multer({
  storage: memoryDiskStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype || !file.mimetype.startsWith("image/")) {
      const err = new Error(
        "Invalid file type. Only image files (JPEG, PNG, WebP, GIF) are allowed."
      );
      err.code = "INVALID_FILE_TYPE";
      return cb(err, false);
    }
    cb(null, true);
  },
});

// Middleware for memory upload handling both 'image' and 'file' field names with graceful error handling
const uploadMemoryMiddleware = (req, res, next) => {
  const uploadHandler = memoryUpload.fields([
    { name: "image", maxCount: 1 },
    { name: "file", maxCount: 1 },
  ]);

  uploadHandler(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res
          .status(400)
          .json({ error: "Image file is too large. Maximum allowed size is 10MB." });
      }
      return res.status(400).json({ error: `Upload error: ${err.message}` });
    } else if (err) {
      return res
        .status(400)
        .json({ error: err.message || "Failed to process image upload." });
    }

    if (req.files) {
      if (req.files.image && req.files.image[0]) {
        req.file = req.files.image[0];
      } else if (req.files.file && req.files.file[0]) {
        req.file = req.files.file[0];
      }
    }
    next();
  });
};

// Lazy initialization of Sarvam AI
let sarvamClient = null;
async function getSarvamClient() {
  const apiKey = process.env.SARVAM_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!sarvamClient) {
    try {
      const { SarvamAIClient } = await import("sarvamai");
      sarvamClient = new SarvamAIClient({
        apiSubscriptionKey: apiKey,
      });
    } catch (err) {
      console.warn("Could not initialize SarvamAIClient:", err.message);
      return null;
    }
  }
  return sarvamClient;
}

// Lazy initialization of Gemini AI
let geminiClient = null;
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!geminiClient) {
    try {
      geminiClient = new GoogleGenAI({ apiKey });
    } catch (err) {
      console.warn("Could not initialize Gemini Client:", err.message);
      return null;
    }
  }
  return geminiClient;
}

// Helper: Fallback offline chat reply
function getMockChatReply(messages, patientContext) {
  const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
  const userText = (lastUserMsg?.content || "").toLowerCase();
  const patientName = patientContext?.patient?.name || "आशा जी";

  if (userText.includes("namaste") || userText.includes("नमस्ते") || userText.includes("hello") || userText.includes("hi")) {
    return `नमस्ते ${patientName}! मैं अन्वेषा हूँ। आपकी सेवा के लिए हमेशा यहाँ हूँ। आज आप कैसा महसूस कर रहे हैं?`;
  }
  if (userText.includes("दवाई") || userText.includes("medicine") || userText.includes("dawai")) {
    const meds = patientContext?.reminders?.filter((r) => r.type === "Medicine") || [];
    if (meds.length > 0) {
      return `आपकी अगली दवाई ${meds[0].title} (${meds[0].time}) पर निर्धारित है। कृपया समय पर लें और पानी पिएं।`;
    }
    return "आपकी दवाइयों का समय पर ध्यान रखा जा रहा है। क्या आपने सुबह का नाश्ता कर लिया?";
  }
  if (userText.includes("पानी") || userText.includes("water")) {
    return "हाँ जी, दिन भर में पर्याप्त पानी पीना बहुत ज़रूरी है। एक गिलास ताज़ा पानी पी लीजिए!";
  }
  if (userText.includes("परिवार") || userText.includes("family") || userText.includes("priya") || userText.includes("rahul")) {
    return `आपके परिवार में प्रिया (बेटी) और राहुल (बेटा) आपसे बहुत प्यार करते हैं। वे जल्द ही आपसे बात करेंगे।`;
  }
  return `नमस्ते जी, मैं आपकी बात समझ रही हूँ। मैं अन्वेषा हूँ, आपके साथ हर कदम पर। आज का दिन आपके लिए मंगलमय हो! ❤️`;
}

// ==================================================
// HEALTH CHECK
// ==================================================
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "ANVESHA voice server is running",
    sarvamConfigured: !!process.env.SARVAM_API_KEY,
    geminiConfigured: !!process.env.GEMINI_API_KEY,
  });
});

// ==================================================
// SPEECH TO TEXT
// ==================================================
app.post("/api/transcribe", upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: "Audio file is required",
      });
    }

    const client = await getSarvamClient();
    if (client) {
      try {
        const response = await client.speechToText.transcribe({
          file: new Blob([req.file.buffer], {
            type: req.file.mimetype || "audio/webm",
          }),
          model: "saaras:v4",
          mode: "transcribe",
          language_code: "unknown",
        });

        return res.json({
          transcript: response.transcript,
          language_code: response.language_code,
        });
      } catch (sarvamErr) {
        console.warn("Sarvam STT failed, using fallback:", sarvamErr.message);
      }
    }

    // Fallback if no Sarvam key or transcription error
    res.json({
      transcript: "नमस्ते स्मृति जी",
      language_code: "hi-IN",
      notice: "Live speech recognition requires SARVAM_API_KEY.",
    });
  } catch (error) {
    console.error("Speech-to-text error:", error);
    res.status(500).json({
      error: "Unable to transcribe audio",
    });
  }
});

// ==================================================
// TEXT TO SPEECH
// ==================================================
app.post("/api/speak", async (req, res) => {
  try {
    const { text, language_code } = req.body;
    const speechText = typeof text === "string" ? text.trim() : "";

    if (!speechText) {
      return res.status(400).json({
        error: "Text is required",
      });
    }

    if (speechText.length > 2500) {
      return res.status(400).json({
        error: "Text must be 2500 characters or fewer",
      });
    }

    const client = await getSarvamClient();
    if (client) {
      try {
        const response = await client.textToSpeech.convert({
          text: speechText,
          language_code:
            typeof language_code === "string" && language_code.trim()
              ? language_code
              : "hi-IN",
          model: "bulbul:v3",
          speaker: "priya",
          output_audio_codec: "wav",
        });

        const audio = response?.audios?.[0];
        if (audio) {
          return res.json({
            audio,
            contentType: "audio/wav",
          });
        }
      } catch (sarvamErr) {
        console.warn("Sarvam TTS failed:", sarvamErr.message);
      }
    }

    res.status(503).json({
      error: "Text-to-speech requires SARVAM_API_KEY to be configured in settings.",
    });
  } catch (error) {
    console.error("Text-to-speech error:", error);
    res.status(500).json({
      error: error.message || "Unable to generate speech",
    });
  }
});

// ==================================================
// ANVESHA CHAT
// ==================================================
app.post("/api/chat", async (req, res) => {
  try {
    const { messages, patientContext: incomingContext } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({
        error: "Messages are required",
      });
    }

    // Hydrate patient context with live DB data
    const liveDb = readDb();
    const patientContext = {
      patient: liveDb.patient || incomingContext?.patient,
      reminders: liveDb.reminders || incomingContext?.reminders || [],
      mood: liveDb.moodLogs?.[0] || incomingContext?.mood,
      recentGameResults: (liveDb.activityResults || []).slice(0, 3),
      ...incomingContext,
    };

    const systemInstructions = `You are Anvesha, a personalized AI companion for this patient.

The following information is the patient's current available context. Use it only to answer relevant patient-specific questions.

PATIENT CONTEXT:
${JSON.stringify(patientContext || {}, null, 2)}

Rules:
- Treat the patient context as factual application data.
- Never invent patient-specific information.
- Never infer missing medications, timings, appointments, relationships, or medical information.
- If the requested information is not present in the patient context, say that you do not have that information.
- Do not expose unnecessary patient information when it is unrelated to the user's question.
- Do not reveal the entire patient context unless the user asks for it and it is appropriate.
- Continue following these language rules: reply in Hindi to Hindi, Assamese to Assamese, Bengali to Bengali, English to English, and naturally follow the patient's style for mixed-language messages.
- Keep responses short, warm, simple, and suitable for an elderly user.
- Patient context is application data, not medical advice. Do not diagnose or change treatment.`;

    // 1. Try Sarvam AI if key provided
    const client = await getSarvamClient();
    if (client) {
      try {
        const response = await client.chat.completions({
          model: "sarvam-105b-conversations",
          messages: [
            { role: "system", content: systemInstructions },
            ...messages,
          ],
          reasoning_effort: null,
          max_tokens: 150,
        });

        const reply = response?.choices?.[0]?.message?.content;
        if (reply) {
          return res.json({ reply });
        }
      } catch (sarvamErr) {
        console.warn("Sarvam chat failed, attempting fallback:", sarvamErr.message);
      }
    }

    // 2. Try Gemini API fallback if key available
    const gemini = getGeminiClient();
    if (gemini) {
      try {
        const userPrompt = messages.map((m) => `${m.role}: ${m.content}`).join("\n");
        const generateWithTimeout = (modelName) =>
          Promise.race([
            gemini.models.generateContent({
              model: modelName,
              contents: userPrompt,
              config: {
                systemInstruction: systemInstructions,
                maxOutputTokens: 200,
                temperature: 0.7,
              },
            }),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error(`Timeout with ${modelName}`)), 7000)
            ),
          ]);

        let aiResponse;
        try {
          aiResponse = await generateWithTimeout("gemini-3.8-flash");
        } catch (mErr) {
          console.warn("Primary gemini-3.8-flash attempt failed, trying gemini-3.6-flash:", mErr.message);
          aiResponse = await generateWithTimeout("gemini-3.6-flash");
        }

        const reply = aiResponse?.text;
        if (reply) {
          return res.json({ reply });
        }
      } catch (geminiErr) {
        console.warn("Gemini chat failed:", geminiErr.message);
      }
    }

    // 3. Fallback mock reply for seamless local testing
    const fallbackReply = getMockChatReply(messages, patientContext);
    return res.json({ reply: fallbackReply });
  } catch (error) {
    console.error("CHAT ERROR:", error);
    res.status(500).json({
      error: error.message || "Unable to generate AI response",
    });
  }
});

// ==================================================
// TEST CHAT
// ==================================================
app.post("/api/test-chat", async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ error: "Message is required" });
    }

    const client = await getSarvamClient();
    if (client) {
      try {
        const response = await client.chat.completions({
          model: "sarvam-105b-conversations",
          messages: [{ role: "user", content: message }],
        });
        const reply = response?.choices?.[0]?.message?.content;
        if (reply) return res.json({ reply });
      } catch (sarvamErr) {
        console.warn("Sarvam test-chat error:", sarvamErr.message);
      }
    }

    res.json({
      reply: "नमस्ते! मैं अन्वेषा हूँ। मैं आपकी सहायता करने के लिए यहाँ हूँ।",
    });
  } catch (error) {
    console.error("Sarvam error:", error);
    res.status(500).json({
      error: error.message || "Unable to get response from Anvesha",
    });
  }
});

// ==================================================
// REST APIs: PATIENT PROFILE
// ==================================================
app.get("/api/patient/profile", (req, res) => {
  try {
    const profile = getPatientProfile();
    res.json(profile);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch patient profile" });
  }
});

app.put("/api/patient/profile", (req, res) => {
  try {
    const updated = updatePatientProfile(req.body);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Failed to update patient profile" });
  }
});

// ==================================================
// REST APIs: REMINDERS
// ==================================================
app.get("/api/patient/reminders", (req, res) => {
  try {
    res.json(getReminders());
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch reminders" });
  }
});

app.post("/api/patient/reminders", (req, res) => {
  try {
    const created = addReminder(req.body);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: "Failed to add reminder" });
  }
});

app.patch("/api/patient/reminders/:id/toggle", (req, res) => {
  try {
    const updated = toggleReminder(req.params.id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Failed to toggle reminder" });
  }
});

app.delete("/api/patient/reminders/:id", (req, res) => {
  try {
    const result = deleteReminder(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Failed to delete reminder" });
  }
});

// ==================================================
// REST APIs: MOOD
// ==================================================
app.get("/api/patient/mood", (req, res) => {
  try {
    const logs = getMoodLogs();
    res.json({ logs, current: logs[0] || null });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch mood logs" });
  }
});

app.post("/api/patient/mood", (req, res) => {
  try {
    const created = addMoodLog(req.body);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: "Failed to save mood log" });
  }
});

// ==================================================
// REST APIs: ACTIVITIES & PROGRESS
// ==================================================
app.get("/api/patient/progress", (req, res) => {
  try {
    const progress = getProgress();
    res.json(progress);
  } catch (err) {
    res.status(500).json({ error: "Failed to calculate progress" });
  }
});

app.get("/api/patient/activities", (req, res) => {
  try {
    const db = readDb();
    res.json(db.activityResults || []);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch activities" });
  }
});

const handleRecordActivity = (req, res) => {
  try {
    const outcome = recordActivityResult(req.body);
    const progress = getProgress();
    res.status(201).json({
      success: true,
      ...outcome,
      progress,
    });
  } catch (err) {
    console.error("Record activity error:", err);
    res.status(500).json({ error: "Failed to record activity" });
  }
};

app.post("/api/patient/activities", handleRecordActivity);
app.post("/api/patient/activities/record", handleRecordActivity);

// ==================================================
// REST APIs: CAREGIVER (PATIENTS, ALERTS, ANALYTICS)
// ==================================================
app.get("/api/caregiver/patients", (req, res) => {
  try {
    res.json(getCaregiverPatients());
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch caregiver patients" });
  }
});

app.get("/api/caregiver/patients/:id", (req, res) => {
  try {
    const patient = getCaregiverPatientById(req.params.id);
    if (!patient) return res.status(404).json({ error: "Patient not found" });
    res.json(patient);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch patient" });
  }
});

app.get("/api/caregiver/alerts", (req, res) => {
  try {
    res.json(getCaregiverAlerts());
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch caregiver alerts" });
  }
});

app.post("/api/caregiver/alerts", (req, res) => {
  try {
    const created = createCaregiverAlert(req.body);
    res.status(201).json({ success: true, alert: created, ...created });
  } catch (err) {
    res.status(500).json({ error: "Failed to create caregiver alert" });
  }
});

app.patch("/api/caregiver/alerts/:id/resolve", (req, res) => {
  try {
    const resolved = resolveCaregiverAlert(req.params.id);
    res.json(resolved);
  } catch (err) {
    res.status(500).json({ error: "Failed to resolve alert" });
  }
});

app.get("/api/caregiver/analytics", (req, res) => {
  try {
    const patientId = req.query.patientId || "P001";
    res.json(getCaregiverAnalytics(patientId));
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch caregiver analytics" });
  }
});

app.get("/api/caregiver/patients/:id/sync-status", (req, res) => {
  try {
    const syncStatus = getPatientSyncStatus(req.params.id);
    res.json(syncStatus);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch patient sync status" });
  }
});

app.get("/api/caregiver/patients/:id/activities", (req, res) => {
  try {
    const activities = getPatientActivities(req.params.id);
    res.json(activities);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch patient activities" });
  }
});

app.post("/api/patient/sync-ping", (req, res) => {
  try {
    const { patientId = "P001", isOnline = true, pendingCount = 0 } = req.body || {};
    const status = updatePatientSyncPing({ patientId, isOnline, pendingCount });
    res.json({ success: true, syncStatus: status });
  } catch (err) {
    res.status(500).json({ error: "Failed to update sync ping" });
  }
});

// ==================================================
// REST APIs: MEMORIES (PATIENT & CAREGIVER VAULT)
// ==================================================

// GET /api/memories/:patientId - Return all saved memories for a specific patient
app.get("/api/memories/:patientId", (req, res) => {
  try {
    const { patientId } = req.params;
    const memories = getMemoriesByPatientId(patientId);
    res.json(memories);
  } catch (err) {
    console.error("Failed to fetch memories for patient:", err);
    res.status(500).json({ error: "Failed to fetch memories" });
  }
});

// POST /api/memories - Upload a memory image, save metadata, and return saved memory object
app.post("/api/memories", uploadMemoryMiddleware, (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ error: "No image file was provided in the upload request." });
    }

    const patientId = req.body.patientId || "P001";
    const memoryId = req.body.memoryId || req.body.id;
    const originalFilename = req.file.originalname;
    const storedFilename = req.file.filename;
    const storedPath = `/uploads/memories/${storedFilename}`;
    const mimetype = req.file.mimetype;
    const uploadTimestamp = new Date().toISOString();

    const savedMemory = saveMemoryWithImage({
      memoryId,
      patientId,
      originalFilename,
      storedFilename,
      storedPath,
      mimetype,
      size: req.file.size,
      uploadTimestamp,
      title: req.body.title,
      subtitle: req.body.subtitle,
      category: req.body.category,
      description: req.body.description,
      year: req.body.year,
      favorite: req.body.favorite,
    });

    res.status(201).json({
      success: true,
      message: "Memory image uploaded and saved successfully",
      imageUrl: storedPath,
      memory: savedMemory,
      ...savedMemory,
    });
  } catch (err) {
    console.error("Failed to save memory image:", err);
    res.status(500).json({ error: "Server failed to save memory image" });
  }
});

// DELETE /api/memories/:memoryId - Delete memory metadata AND corresponding image file
app.delete("/api/memories/:memoryId", (req, res) => {
  try {
    const { memoryId } = req.params;
    const result = deleteMemory(memoryId);
    if (!result.found) {
      return res.status(404).json({ error: "Memory not found" });
    }
    res.json({
      success: true,
      message: "Memory and associated image deleted successfully",
      deletedMemoryId: memoryId,
    });
  } catch (err) {
    console.error("Failed to delete memory:", err);
    res.status(500).json({ error: "Failed to delete memory" });
  }
});

// Legacy / compatibility routes:
app.get("/api/patient/memories", (req, res) => {
  try {
    const patientId = req.query.patientId || "P001";
    res.json(getMemoriesByPatientId(patientId));
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch memories" });
  }
});

app.patch("/api/patient/memories/:id", (req, res) => {
  try {
    const updated = updateMemory(req.params.id, {
      ...(req.body.image ? { image: req.body.image } : {}),
      ...(req.body.title ? { title: req.body.title } : {}),
      ...(req.body.subtitle ? { subtitle: req.body.subtitle } : {}),
      ...(req.body.category ? { category: req.body.category } : {}),
      ...(typeof req.body.favorite !== "undefined" ? { favorite: req.body.favorite } : {}),
    });

    if (!updated) {
      return res.status(404).json({
        error: "Memory not found",
      });
    }

    res.json(updated);
  } catch (err) {
    console.error("Failed to update memory image:", err);
    res.status(500).json({
      error: "Failed to update memory image",
    });
  }
});

app.post("/api/patient/memories", (req, res) => {
  try {
    const created = addMemory(req.body);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: "Failed to add memory" });
  }
});

// ==================================================
// REST APIs: PATIENT LOCATION & CAREGIVER MONITORING
// ==================================================
app.get("/api/patient/location", (req, res) => {
  try {
    const patientId = req.query.patientId || "P001";
    const loc = getPatientLocation(patientId);
    res.json(loc);
  } catch (err) {
    console.error("Fetch patient location error:", err);
    res.status(500).json({ error: "Failed to fetch patient location" });
  }
});

app.post("/api/patient/location", (req, res) => {
  try {
    const { latitude, longitude, accuracy, timestamp, sharingEnabled, address, patientId } = req.body || {};

    if (latitude !== undefined && latitude !== null && (typeof latitude !== "number" || isNaN(latitude) || latitude < -90 || latitude > 90)) {
      return res.status(400).json({ error: "Latitude must be a valid number between -90 and 90" });
    }
    if (longitude !== undefined && longitude !== null && (typeof longitude !== "number" || isNaN(longitude) || longitude < -180 || longitude > 180)) {
      return res.status(400).json({ error: "Longitude must be a valid number between -180 and 180" });
    }
    if (accuracy !== undefined && accuracy !== null && (typeof accuracy !== "number" || isNaN(accuracy) || accuracy < 0)) {
      return res.status(400).json({ error: "Accuracy must be a non-negative number" });
    }

    const updated = updatePatientLocation({
      patientId: patientId || "P001",
      latitude: latitude !== undefined && latitude !== null ? Number(latitude) : undefined,
      longitude: longitude !== undefined && longitude !== null ? Number(longitude) : undefined,
      accuracy: accuracy !== undefined && accuracy !== null ? Number(accuracy) : undefined,
      timestamp,
      sharingEnabled: typeof sharingEnabled === "boolean" ? sharingEnabled : undefined,
      address,
    });

    res.json({
      success: true,
      location: updated,
    });
  } catch (err) {
    console.error("Update patient location error:", err);
    res.status(500).json({ error: err.message || "Failed to update location" });
  }
});

app.get("/api/caregiver/patients/:id/location", (req, res) => {
  try {
    const loc = getPatientLocation(req.params.id);
    res.json(loc);
  } catch (err) {
    console.error("Fetch caregiver patient location error:", err);
    res.status(500).json({ error: "Failed to fetch patient location for caregiver" });
  }
});

app.get("/api/patient/:id/location", (req, res) => {
  try {
    const loc = getPatientLocation(req.params.id);
    res.json(loc);
  } catch (err) {
    console.error("Fetch patient location error:", err);
    res.status(500).json({ error: "Failed to fetch patient location" });
  }
});

// ==================================================
// REST APIs: AUTHENTICATION (PATIENT / CAREGIVER)
// ==================================================
app.post("/api/auth/login", (req, res) => {
  const { role, identifier, email, password } = req.body || {};
  const userIdentifier = (identifier || email || "").trim().toLowerCase();

  if (role === "caregiver") {
    return res.json({
      success: true,
      role: "caregiver",
      user: {
        name: "Dr. Sarah Jenkins",
        email: userIdentifier || "sarah.jenkins@smriti.org",
        role: "Caregiver Specialist",
      },
    });
  }

  // Patient authentication (Asha P001 or PIN 1234 or direct patient login)
  const patient = getPatientProfile();
  return res.json({
    success: true,
    role: "patient",
    user: {
      id: patient.id,
      name: patient.name,
      room: patient.room,
    },
  });
});

// ==================================================
// VITE MIDDLEWARE / STATIC ASSETS
// ==================================================
async function start() {
  if (process.env.NODE_ENV === "production") {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`ANVESHA server running on http://0.0.0.0:${PORT}`);
  });
}

start();
