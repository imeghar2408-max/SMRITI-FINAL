import express from "express";
import http from "http";
import cors from "cors";
import path from "path";
import fs from "fs";
import multer from "multer";
import dotenv from "dotenv";
import { WebSocketServer } from "ws";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import {
  collectPatientTelemetry,
  generateCaregiverInsightsWithGemini,
  detectLanguageFromText,
  SUPPORTED_LOCALES,
  LANGUAGE_REGISTRY,
  queryCaregiverInformation,
} from "./server/aiService.js";
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
import {
  requestOtp,
  verifyOtp,
  registerNewUser,
  requireRealAuth,
  optionalAuth,
  getAuthorizedPatientRecord,
  getCaregiverLinkedPatients,
} from "./server/realAuthService.js";

dotenv.config();

const app = express();
const server = http.createServer(app);
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
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB audio limit
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
  if (!apiKey) return null;
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

// Lazy initialization of Gemini AI with User-Agent header
let geminiClient = null;
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!geminiClient) {
    try {
      geminiClient = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: { "User-Agent": "aistudio-build" },
        },
      });
    } catch (err) {
      console.warn("Could not initialize Gemini Client:", err.message);
      return null;
    }
  }
  return geminiClient;
}

// Helper: Fallback offline chat reply with full NER multilingual support & patient grounding
function getMockChatReply(messages, patientContext, explicitLocale = "") {
  const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
  const rawText = lastUserMsg?.content || "";
  const userText = rawText.toLowerCase();
  const patientName = patientContext?.patient?.name || "Asha";
  const defaultLang = explicitLocale || (patientContext?.patient?.language?.toLowerCase().includes("assam") ? "as-IN" : "hi-IN");
  const detectedLang = explicitLocale || detectLanguageFromText(rawText, defaultLang);

  const meds = patientContext?.reminders?.filter((r) => r.type === "Medicine" || r.type === "Medication") || [];
  const nextMedStr = meds.length > 0 ? `${meds[0].title} (${meds[0].time})` : "scheduled medication";

  // Assamese language branch (as-IN)
  if (detectedLang === "as-IN") {
    if (userText.includes("নমস্কাৰ") || userText.includes("namaskar") || userText.includes("hello") || userText.includes("hi")) {
      return `নমস্কাৰ ${patientName} ডাঙৰীয়া! মই অন্বেষা। আপোনাৰ সহায়ৰ বাবে সদায় সাজু আছো। আজি আপুনি কেনে অনুভৱ কৰিছে? 🌸`;
    }
    if (userText.includes("দৰব") || userText.includes("ঔষধ") || userText.includes("medicine")) {
      return `আপোনাৰ ঔষধ ${nextMedStr} সময়ত লোৱাৰ অনুৰোধ জনালোঁ। লগতে এগিলাচ সতেজ পানী খাবলৈ নাপাহৰিব।`;
    }
    if (userText.includes("পানী") || userText.includes("water")) {
      return "হয়, দিনটোত পৰ্যাপ্ত পানী খোৱা স্বাস্থ্যৰ বাবে বৰ প্ৰয়োজনীয়। এগিলাচ পানী খাই জিৰণি লওক!";
    }
    if (userText.includes("পৰিয়াল") || userText.includes("family") || userText.includes("priya")) {
      return `আপোনাৰ জীয়ৰী প্ৰিয়া শৰ্মাই আপোনাৰ বিশেষ যত্ন লৈছে। তেওঁ সোনকালে আপোনাৰ লগত যোগাযোগ কৰিব।`;
    }
    if (userText.includes("খেলা") || userText.includes("স্মৃতি") || userText.includes("game")) {
      return "আজিৰ বাবে স্মৰণ শক্তিৰ কাৰ্যসূচী সাজু আছে। আপুনি যেতিয়াই আৰাম অনুভৱ কৰে, আৰম্ভ কৰিব পাৰে।";
    }
    return `নমস্কাৰ, মই আপোনাৰ কথা বুজি পাইছো। মই অন্বেষা, আপোনাৰ কাষতেই আছো। আজিৰ দিনটো শুভ আৰু শান্তিপূৰ্ণ হওক! ❤️`;
  }

  // Bengali language branch (bn-IN)
  if (detectedLang === "bn-IN") {
    if (userText.includes("নমস্কার") || userText.includes("hello") || userText.includes("hi")) {
      return `নমস্কার ${patientName}! আমি অন্বেষা। আপনার সেবায় আমি সর্বদা প্রস্তুত। আজ আপনি কেমন আছেন? 🌸`;
    }
    if (userText.includes("ওষুধ") || userText.includes("medicine")) {
      return `আপনার ওষুধ ${nextMedStr} সময়মতো গ্রহণ করুন এবং পর্যাপ্ত জল পান করুন।`;
    }
    if (userText.includes("জল") || userText.includes("পানি") || userText.includes("water")) {
      return "হ্যাঁ, পর্যাপ্ত জল পান করা অত্যন্ত উপকারী। এক গ্লাস তাজা জল খেয়ে নিন।";
    }
    if (userText.includes("পরিবার") || userText.includes("family") || userText.includes("priya")) {
      return `আপনার পরিবার আপনার পাশে রয়েছে। প্রিয়া শর্মা সর্বদা আপনার সাথে যোগাযোগ রাখছেন।`;
    }
    return `নমস্কার, আমি আপনার কথা বুঝতে পেরেছি। আমি অন্বেষা, সবসময় আপনার পাশে আছি। ❤️`;
  }

  // Nepali language branch (ne-NP)
  if (detectedLang === "ne-NP") {
    if (userText.includes("नमस्ते") || userText.includes("hello")) {
      return `नमस्ते ${patientName} जी! म अन्वेषा हुँ। आज तपाईंलाई कस्तो छ? 🌸`;
    }
    if (userText.includes("औषधि") || userText.includes("दबाई") || userText.includes("medicine")) {
      return `तपाईंको औषधि ${nextMedStr} समयमा लिनुहोला। पानी पिउन नबिर्सनुहोला।`;
    }
    return `नमस्ते, म तपाईंको सहयोगी अन्वेषा हुँ। आरामसँग दिन बिताउनुहोस्। ❤️`;
  }

  // Bodo language branch (brx-IN)
  if (detectedLang === "brx-IN") {
    return `खुमुलिया ${patientName}! आं अन्वेषा, नोंथांनि खाथिआवनो दं। नोंथांनि देहा मोजां थाथों। ❤️`;
  }

  // Manipuri / Meitei branch (mni-IN)
  if (detectedLang === "mni-IN") {
    return `ꯈꯨꯔꯨꯝꯖꯔꯤ ${patientName}! ꯑꯩ अन्वेषा ꯅꯤ, ꯅꯍꯥꯛꯄꯨ ꯃꯇꯦꯡ ꯄꯥꯡꯅꯕ ꯁꯦꯃꯗꯨꯅꯥ ꯂꯩꯔꯤ। ❤️`;
  }

  // Mizo branch (lus-IN)
  if (detectedLang === "lus-IN") {
    return `Chibai ${patientName}! Anvesha ka ni e, i kiangah ka awm reng e. Vawiin chu nuam deuhin le. ❤️`;
  }

  // Hindi language branch (hi-IN)
  if (detectedLang === "hi-IN" || /[\u0900-\u097F]/.test(rawText)) {
    if (userText.includes("namaste") || userText.includes("नमस्ते") || userText.includes("hello") || userText.includes("hi")) {
      return `नमस्ते ${patientName} जी! मैं अन्वेषा हूँ। आपकी सेवा के लिए हमेशा यहाँ हूँ। आज आप कैसा महसूस कर रहे हैं? 🌸`;
    }
    if (userText.includes("दवाई") || userText.includes("medicine") || userText.includes("dawai")) {
      return `आपकी अगली दवाई ${nextMedStr} पर निर्धारित है। कृपया समय पर लें और ताज़ा पानी पिएं।`;
    }
    if (userText.includes("पानी") || userText.includes("water")) {
      return "हाँ जी, दिन भर में पर्याप्त पानी पीना बहुत ज़रूरी है। एक गिलास ताज़ा पानी पी लीजिए!";
    }
    if (userText.includes("परिवार") || userText.includes("family") || userText.includes("priya") || userText.includes("rahul")) {
      return `आपके परिवार में प्रिया (बेटी) आपसे बहुत प्यार करती हैं। वे आपकी देखभाल का पूरा ध्यान रखती हैं।`;
    }
    if (userText.includes("खेल") || userText.includes("गतिविधि") || userText.includes("game")) {
      return "आज के लिए आपकी स्मृति और ध्यान गतिविधि तैयार है। जब भी आप चाहें, शुरू कर सकते हैं।";
    }
    return `नमस्ते जी, मैं आपकी बात समझ रही हूँ। मैं अन्वेषा हूँ, आपके साथ हर कदम पर। आज का दिन आपके लिए मंगलमय हो! ❤️`;
  }

  // English fallback
  if (userText.includes("hello") || userText.includes("hi")) {
    return `Hello ${patientName}! I am Anvesha, your cognitive companion. How are you feeling today? 🌸`;
  }
  if (userText.includes("medicine") || userText.includes("medication")) {
    return `Your scheduled medicine is ${nextMedStr}. Please take it on time with fresh water.`;
  }
  if (userText.includes("family") || userText.includes("priya")) {
    return "Your daughter Priya Sharma and family love you dearly and stay connected with your care team.";
  }
  if (userText.includes("water") || userText.includes("hydration")) {
    return "Drinking sufficient water is vital throughout the day. Please enjoy a fresh glass of water.";
  }
  return `Hello, I hear you clearly. I am Anvesha, right here beside you. Have a peaceful, gentle day! ❤️`;
}

// ==================================================
// HEALTH CHECK
// ==================================================
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "ANVESHA Multilingual AI & Voice Intelligence Server is running",
    geminiConfigured: !!process.env.GEMINI_API_KEY,
    sarvamConfigured: !!process.env.SARVAM_API_KEY,
    supportedLanguagesCount: Object.keys(LANGUAGE_REGISTRY).length,
    offlineCapable: true,
  });
});

// ==================================================
// 2. SPEECH TO TEXT (STT) WITH GEMINI TRANSCRIBE & MULTILINGUAL DETECTION
// ==================================================
app.post("/api/transcribe", upload.single("audio"), async (req, res) => {
  try {
    const file = req.file;
    const requestedLanguage = req.body?.language_code || "as-IN";

    if (!file || !file.buffer) {
      return res.status(400).json({
        error: "Audio file buffer is required for transcription",
      });
    }

    const mimeType = file.mimetype || "audio/webm";
    const base64Audio = file.buffer.toString("base64");

    // 1. Try Gemini 3.5 Transcribe
    const gemini = getGeminiClient();
    if (gemini) {
      try {
        const langMeta = LANGUAGE_REGISTRY[requestedLanguage] || LANGUAGE_REGISTRY["as-IN"];
        const transcribeResponse = await gemini.models.generateContent({
          model: "gemini-3.5-transcribe",
          contents: {
            parts: [
              {
                inlineData: {
                  mimeType,
                  data: base64Audio,
                },
              },
              {
                text: `Transcribe this patient audio verbatim. The patient may be speaking in ${langMeta.name} (${langMeta.code}), Hindi, Bengali, or English. Return only the clean transcription text.`,
              },
            ],
          },
        });

        const transcript = transcribeResponse.text?.trim();
        if (transcript) {
          const detectedLang = detectLanguageFromText(transcript, requestedLanguage);
          return res.json({
            transcript,
            language_code: detectedLang,
            source: "gemini-3.5-transcribe",
          });
        }
      } catch (geminiErr) {
        console.warn("Gemini transcription failed, trying secondary fallback:", geminiErr.message);
      }
    }

    // 2. Try Sarvam AI STT
    const sarvam = await getSarvamClient();
    if (sarvam) {
      try {
        const response = await sarvam.speechToText.transcribe({
          file: new Blob([file.buffer], { type: mimeType }),
          model: "saaras:v4",
          mode: "transcribe",
          language_code: "unknown",
        });

        if (response?.transcript) {
          const detectedLang = response.language_code || detectLanguageFromText(response.transcript, requestedLanguage);
          return res.json({
            transcript: response.transcript,
            language_code: detectedLang,
            source: "sarvam-saaras",
          });
        }
      } catch (sarvamErr) {
        console.warn("Sarvam STT failed:", sarvamErr.message);
      }
    }

    // 3. Graceful offline fallback: Prompt client that audio was received
    const defaultGreeting = LANGUAGE_REGISTRY[requestedLanguage]?.greeting || "নমস্কাৰ";
    res.json({
      transcript: `${defaultGreeting} অন্বেষা`,
      language_code: requestedLanguage,
      source: "offline_heuristic_stt",
      notice: "Live cloud speech transcription offline. You can also use on-device speech recognition or keyboard typing.",
    });
  } catch (error) {
    console.error("Speech-to-text error:", error);
    res.status(500).json({
      error: "Unable to transcribe audio",
    });
  }
});

// ==================================================
// 3. TEXT TO SPEECH (TTS) - REGIONAL INDIAN NATURAL VOICES AUDITED
// ==================================================
const REGIONAL_VOICE_CONFIG = {
  "en-IN": {
    provider: "sarvam-ai",
    model: "bulbul:v3",
    speaker: "priya",
    pace: 0.92,
    nativeSupported: true,
    voiceName: "priya (Indian English)",
    accent: "Natural Indian English pronunciation",
  },
  "hi-IN": {
    provider: "sarvam-ai",
    model: "bulbul:v3",
    speaker: "priya",
    pace: 0.92,
    nativeSupported: true,
    voiceName: "priya (Indian Hindi)",
    accent: "Natural Indian Hindi pronunciation",
  },
  "bn-IN": {
    provider: "sarvam-ai",
    model: "bulbul:v3",
    speaker: "priya",
    pace: 0.92,
    nativeSupported: true,
    voiceName: "priya (Bengali)",
    accent: "Natural Bengali pronunciation",
  },
  "as-IN": {
    provider: "sarvam-ai",
    model: "bulbul:v3",
    speaker: "priya",
    pace: 0.92,
    nativeSupported: false, // Closed-beta restricted on Sarvam; no genuine native engine on cloud/browser
    voiceName: "None (Closed Beta)",
    fallback: "text_only",
    accent: "Native Assamese (currently closed beta on cloud engine)",
  },
};

app.post("/api/speak", async (req, res) => {
  try {
    const { text, language_code } = req.body;
    const speechText = typeof text === "string" ? text.trim() : "";
    const targetLang = language_code || "as-IN";

    if (!speechText) {
      return res.status(400).json({ error: "Text is required" });
    }

    if (speechText.length > 2500) {
      return res.status(400).json({ error: "Text must be 2500 characters or fewer" });
    }

    // 1. Check language-specific voice configuration
    const voiceCfg = REGIONAL_VOICE_CONFIG[targetLang] || {
      provider: "sarvam-ai",
      model: "bulbul:v3",
      speaker: "priya",
      pace: 0.92,
      nativeSupported: false,
      voiceName: "default",
      fallback: "text_only",
      accent: targetLang,
    };

    // 2. Assamese (as-IN) & unsupported voice handling:
    // Native Assamese TTS engine is restricted to closed beta on Sarvam.
    // To prevent 400 BadRequestError logs and avoid substituting Bengali (which distorts phonology),
    // we directly and cleanly return the text_only fallback without triggering error logs.
    if (targetLang.startsWith("as") || targetLang === "as-IN" || !voiceCfg.nativeSupported) {
      console.log(
        `[TTS Service] Language: ${targetLang} | Voice output: text_only fallback | Reason: Native ${targetLang} voice engine is in closed beta; gracefully displaying text to ensure clear accessibility.`
      );
      return res.json({
        audio: null,
        provider: "none",
        model: null,
        voice: null,
        fallback: "text_only",
        language_code: targetLang,
        text: speechText,
        message: `Native ${targetLang} voice output is currently in closed beta. Response is presented as readable text.`,
      });
    }

    // 3. For supported regional Indian languages (en-IN, hi-IN, bn-IN):
    // Use Sarvam AI bulbul:v3 with speaker 'priya' for gentle, authentic pronunciation
    const sarvam = await getSarvamClient();
    if (sarvam && voiceCfg.nativeSupported) {
      try {
        const response = await sarvam.textToSpeech.convert({
          text: speechText,
          language_code: voiceCfg.language_code || targetLang,
          model: voiceCfg.model || "bulbul:v3",
          speaker: voiceCfg.speaker || "priya",
          pace: voiceCfg.pace || 0.92,
          output_audio_codec: "wav",
        });

        const audio = response?.audios?.[0];
        if (audio) {
          console.log(
            `[TTS Audit] Language: ${targetLang} | Provider: ${voiceCfg.provider} | Model: ${voiceCfg.model} | Voice: ${voiceCfg.voiceName} | Fallback: none | Result: Success (${audio.length} chars base64 audio)`
          );
          return res.json({
            audio,
            contentType: "audio/wav",
            provider: voiceCfg.provider,
            model: voiceCfg.model,
            voice: voiceCfg.voiceName,
            accent: voiceCfg.accent,
            language_code: targetLang,
            fallback: "none",
          });
        }
      } catch (sarvamErr) {
        console.warn(
          `[TTS Audit] Sarvam TTS failed for ${targetLang}: ${sarvamErr.message}. Falling back to browser SpeechSynthesis.`
        );
      }
    }

    // 4. Fallback to Browser SpeechSynthesis (offline or when cloud TTS fails)
    console.log(
      `[TTS Audit] Language: ${targetLang} | Provider: browser_speech_synthesis | Model: on_device | Voice: regional_${targetLang} | Fallback: browser_speech_synthesis | Result: Delegated to client`
    );

    res.json({
      audio: null,
      fallbackToBrowser: true,
      fallback: "browser_speech_synthesis",
      provider: "browser_speech_synthesis",
      voice: `native_${targetLang}`,
      text: speechText,
      language_code: targetLang,
      message: "Cloud audio synthesis offline. Client browser SpeechSynthesis with regional voice will vocalize.",
    });
  } catch (error) {
    console.error("Text-to-speech error:", error);
    res.status(500).json({
      error: error.message || "Unable to generate speech",
    });
  }
});

// ==================================================
// 1 & 5. ANVESHA CHAT (LANGUAGE-AWARE PATIENT CONTEXT & GEMINI)
// ==================================================
app.post("/api/chat", async (req, res) => {
  try {
    const { messages, message, patientContext: incomingContext, language_code } = req.body;

    // Support both `messages` array and single `message` string
    let messageList = Array.isArray(messages) ? messages : [];
    if (messageList.length === 0 && typeof message === "string" && message.trim()) {
      messageList = [{ role: "user", content: message.trim() }];
    }

    if (messageList.length === 0) {
      return res.status(400).json({
        error: "Valid messages or message text required",
      });
    }

    const lastUserText = [...messageList].reverse().find((m) => m.role === "user")?.content || "";

    // Hydrate patient context with live DB data and telemetry
    const liveDb = readDb();
    const patientId = incomingContext?.patient?.id || liveDb.patient?.id || "P001";
    const telemetry = collectPatientTelemetry(patientId);

    // Resolve language preference
    const userPreferredLang = language_code || incomingContext?.language || telemetry.patient.language || "as-IN";
    const detectedLang = detectLanguageFromText(lastUserText, userPreferredLang);
    const langMeta = LANGUAGE_REGISTRY[detectedLang] || LANGUAGE_REGISTRY[userPreferredLang] || LANGUAGE_REGISTRY["as-IN"];

    const patientContext = {
      patient: liveDb.patient || incomingContext?.patient || telemetry.patient,
      reminders: liveDb.reminders || incomingContext?.reminders || [],
      mood: liveDb.moodLogs?.[0] || incomingContext?.mood,
      recentGameResults: (liveDb.activityResults || []).slice(0, 3),
      metricsSummary: telemetry.metrics,
      recentActivities: telemetry.recentActivities,
      memoriesCount: telemetry.memoriesCount,
      preferredLanguage: langMeta.name,
      languageLocale: langMeta.code,
      ...incomingContext,
    };

    const systemInstructions = `You are Anvesha, an empathetic, personalized cognitive care companion for this elderly patient.
Current Patient: ${patientContext.patient?.name || "Asha"} (Age: ${patientContext.patient?.age || 78}, Room: ${patientContext.patient?.room || "402"}).
Preferred Language: ${langMeta.name} (${langMeta.code}, Script: ${langMeta.script}).

GROUNDED PATIENT CONTEXT:
${JSON.stringify(patientContext, null, 2)}

STRICT SAFETY & ETHICAL RULES:
1. NON-DIAGNOSTIC: Never diagnose clinical conditions (dementia, stroke, depression) or modify medication dosages.
2. CONTEXT-GROUNDED: Answer patient queries about daily routine, medications, reminders, and loved ones using the context above.
3. LANGUAGE PRESERVATION: Reply naturally in ${langMeta.name} (${langMeta.code}) matching the patient's language and script.
4. TONE: Warm, clear, respectful, gentle, and easily understood by an elderly user. Keep responses concise (2-4 sentences).`;

    // 1. Try Gemini API
    const gemini = getGeminiClient();
    if (gemini) {
      try {
        const conversationText = messageList.map((m) => `${m.role}: ${m.content}`).join("\n");
        const response = await gemini.models.generateContent({
          model: "gemini-3.8-flash",
          contents: conversationText,
          config: {
            systemInstruction: systemInstructions,
            maxOutputTokens: 250,
            temperature: 0.3,
          },
        });

        const reply = response?.text?.trim();
        if (reply) {
          return res.json({
            reply,
            language_code: langMeta.code,
            language_name: langMeta.name,
            source: "gemini-3.8-flash",
            nonDiagnostic: true,
          });
        }
      } catch (geminiErr) {
        console.warn("Gemini chat failed, trying Sarvam fallback:", geminiErr.message);
      }
    }

    // 2. Try Sarvam AI
    const sarvam = await getSarvamClient();
    if (sarvam) {
      try {
        const response = await sarvam.chat.completions({
          model: "sarvam-105b-conversations",
          messages: [
            { role: "system", content: systemInstructions },
            ...messageList,
          ],
          max_tokens: 200,
        });

        const reply = response?.choices?.[0]?.message?.content?.trim();
        if (reply) {
          return res.json({
            reply,
            language_code: langMeta.code,
            language_name: langMeta.name,
            source: "sarvam-105b",
            nonDiagnostic: true,
          });
        }
      } catch (sarvamErr) {
        console.warn("Sarvam chat failed:", sarvamErr.message);
      }
    }

    // 3. Fallback mock reply with full language & context preservation
    const fallbackReply = getMockChatReply(messageList, patientContext, langMeta.code);
    return res.json({
      reply: fallbackReply,
      language_code: langMeta.code,
      language_name: langMeta.name,
      source: "offline_heuristic_engine",
      nonDiagnostic: true,
    });
  } catch (error) {
    console.error("CHAT ERROR:", error);
    res.status(500).json({
      error: error.message || "Unable to generate AI response",
    });
  }
});

// ==================================================
// 4. CENTRALIZED MULTILINGUAL LOCALES API
// ==================================================
app.get("/api/ai/locales", (req, res) => {
  res.json({
    locales: LANGUAGE_REGISTRY,
    defaultLocale: "as-IN",
    count: Object.keys(LANGUAGE_REGISTRY).length,
  });
});

app.get("/api/ai/languages", (req, res) => {
  res.json({
    languages: Object.values(LANGUAGE_REGISTRY),
    defaultLocale: "as-IN",
  });
});

// ==================================================
// REST APIs: ANVESHA AI INTELLIGENCE LAYER
// ==================================================
app.get("/api/ai/insights", async (req, res) => {
  try {
    const patientId = req.query.patientId || "P001";
    const telemetry = collectPatientTelemetry(patientId);
    if (!telemetry.hasData) {
      return res.json({
        success: true,
        patientId,
        hasData: false,
        insights: [],
        message: "No AI insights available yet",
        telemetrySummary: null,
        generatedAt: new Date().toISOString(),
        nonDiagnostic: true,
      });
    }
    const insights = await generateCaregiverInsightsWithGemini(telemetry);
    res.json({
      success: true,
      patientId,
      hasData: true,
      insights,
      telemetrySummary: telemetry.metrics,
      generatedAt: new Date().toISOString(),
      nonDiagnostic: true,
    });
  } catch (err) {
    console.error("AI Insights error:", err);
    res.status(500).json({ error: "Failed to generate AI insights" });
  }
});

app.get("/api/ai/patterns", (req, res) => {
  try {
    const patientId = req.query.patientId || "P001";
    const telemetry = collectPatientTelemetry(patientId);
    res.json(telemetry);
  } catch (err) {
    console.error("AI Patterns error:", err);
    res.status(500).json({ error: "Failed to aggregate patient patterns" });
  }
});

// ==================================================
// 7. CAREGIVER INFORMATIONAL QUERY WITH GOOGLE SEARCH GROUNDING
// ==================================================
app.post("/api/ai/caregiver-query", async (req, res) => {
  try {
    const { query, patientId = "P001", enableSearchGrounding = true } = req.body;
    if (!query || typeof query !== "string") {
      return res.status(400).json({ error: "Caregiver query string is required" });
    }

    const result = await queryCaregiverInformation({
      query: query.trim(),
      patientId,
      enableSearchGrounding: Boolean(enableSearchGrounding),
    });

    res.json({
      success: true,
      ...result,
    });
  } catch (err) {
    console.error("Caregiver search grounding query error:", err);
    res.status(500).json({ error: "Failed to process caregiver informational query" });
  }
});

// ==================================================
// 6. CAREGIVER PATIENT LOCATION SAFETY & GEOFENCE STATUS
// ==================================================
app.get("/api/caregiver/patient-location-safety/:patientId?", (req, res) => {
  try {
    const patientId = req.params.patientId || "P001";
    const loc = getPatientLocation(patientId);

    // Observational safe campus boundary (Assam Care Campus)
    const campusCenter = { lat: 26.1445, lng: 91.7362 }; // Guwahati, Assam
    let distanceFromCenterMeters = null;
    let isInsidePerimeter = true;
    let hasCoords = false;

    if (loc && typeof loc.latitude === "number" && typeof loc.longitude === "number") {
      hasCoords = true;
      // Rough Haversine distance in meters
      const R = 6371000;
      const dLat = ((loc.latitude - campusCenter.lat) * Math.PI) / 180;
      const dLon = ((loc.longitude - campusCenter.lng) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((campusCenter.lat * Math.PI) / 180) *
          Math.cos((loc.latitude * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      distanceFromCenterMeters = Math.round(R * c);
      isInsidePerimeter = distanceFromCenterMeters <= 1500; // 1.5km safe campus perimeter
    }

    res.json({
      patientId,
      location: loc,
      geofence: hasCoords
        ? {
            campusName: "Assam Eldercare Safe Perimeter",
            distanceFromCenterMeters,
            isInsidePerimeter,
            status: isInsidePerimeter ? "Within Safe Zone" : "Outside Safe Perimeter",
            landmarks: [
              { name: "Care Center Main Clinic", distanceMeters: 45 },
              { name: "Sensory Garden & Courtyard", distanceMeters: 120 },
              { name: "Guwahati Medical Facility", distanceMeters: 1400 },
            ],
          }
        : {
            campusName: "Assam Eldercare Safe Perimeter",
            distanceFromCenterMeters: null,
            isInsidePerimeter: null,
            status: "Location unavailable",
            landmarks: [],
          },
      nonDiagnostic: true,
    });
  } catch (err) {
    console.error("Location safety error:", err);
    res.status(500).json({ error: "Failed to evaluate location safety" });
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
    const patientId = req.query.patientId;
    res.json(getReminders(patientId));
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
      return res.status(404).json({ error: "Memory not found" });
    }

    res.json(updated);
  } catch (err) {
    console.error("Failed to update memory image:", err);
    res.status(500).json({ error: "Failed to update memory image" });
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
  const { role, identifier, email } = req.body || {};
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
// REAL AUTHENTICATION: PHONE OTP & AUTHORIZATION ENDPOINTS
// ==================================================
// 1. Request OTP (Server-side generated, rate-limited, SHA-256 hashed)
app.post("/api/real/auth/request-otp", async (req, res) => {
  try {
    const { phone } = req.body || {};
    const result = await requestOtp({ phone });
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message || "Failed to send verification code" });
  }
});

// 2. Verify OTP (Validates attempts, invalidates session, returns JWT)
app.post("/api/real/auth/verify-otp", async (req, res) => {
  try {
    const { sessionId, phone, otpCode } = req.body || {};
    const result = await verifyOtp({ sessionId, phone, otpCode });
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message || "Failed to verify code" });
  }
});

// 3. Register New User (After phone OTP verification)
app.post("/api/real/auth/register", async (req, res) => {
  try {
    const { sessionId, phone, name, role } = req.body || {};
    const result = await registerNewUser({ sessionId, phone, name, role });
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message || "Failed to complete registration" });
  }
});

// 4. Current Real User Profile & Session
app.get("/api/real/auth/me", requireRealAuth, (req, res) => {
  try {
    res.json({
      success: true,
      user: req.user,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch user session" });
  }
});

// 5. Authorized Patient Record: Patients can ONLY access their own record
app.get("/api/real/patient/dashboard", requireRealAuth, (req, res) => {
  try {
    if (req.user.role !== "patient") {
      return res.status(403).json({ error: "Access denied. Patient role required." });
    }
    const patientRecord = getAuthorizedPatientRecord(req.user, req.user.patientId);
    res.json({
      success: true,
      user: req.user,
      patient: patientRecord,
    });
  } catch (err) {
    res.status(403).json({ error: err.message });
  }
});

// 6. Authorized Caregiver Patient Roster: Returns ONLY patients linked via caregiver_patient_links
app.get("/api/real/caregiver/patients", requireRealAuth, (req, res) => {
  try {
    if (req.user.role !== "caregiver") {
      return res.status(403).json({ error: "Access denied. Caregiver role required." });
    }
    const patients = getCaregiverLinkedPatients(req.user.caregiverId);
    res.json({
      success: true,
      caregiverId: req.user.caregiverId,
      patients,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Authorized Caregiver Patient Record: Verifies link before granting access
app.get("/api/real/caregiver/patient/:id", requireRealAuth, (req, res) => {
  try {
    const patientRecord = getAuthorizedPatientRecord(req.user, req.params.id);
    res.json({
      success: true,
      patient: patientRecord,
    });
  } catch (err) {
    res.status(403).json({ error: err.message });
  }
});

// ==================================================
// 1. GEMINI LIVE API WEBSOCKET BRIDGE (/api/live-voice)
// ==================================================
const wss = new WebSocketServer({ server, path: "/api/live-voice" });

wss.on("connection", async (clientWs) => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    clientWs.send(
      JSON.stringify({
        type: "status",
        connected: false,
        message: "Gemini Live API is not configured. Speech-to-Text and TTS fallback active.",
        liveSupported: false,
      })
    );
    return;
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: { headers: { "User-Agent": "aistudio-build" } },
    });

    const patientProfile = getPatientProfile();
    const liveSession = await ai.live.connect({
      model: "gemini-3.8-live",
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: "Kore" } },
        },
        systemInstruction: `You are Anvesha, a gentle eldercare AI voice assistant speaking with ${patientProfile.name} in Room ${patientProfile.room}. Maintain a comforting, non-diagnostic tone and answer questions about routine and reminders simply.`,
      },
      callbacks: {
        onmessage: (msg) => {
          const audioChunk = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
          if (audioChunk) {
            clientWs.send(JSON.stringify({ type: "audio", audio: audioChunk }));
          }
          if (msg.serverContent?.interrupted) {
            clientWs.send(JSON.stringify({ type: "interrupted", interrupted: true }));
          }
        },
      },
    });

    clientWs.send(
      JSON.stringify({
        type: "status",
        connected: true,
        message: "Live bidirectional voice connection established with Anvesha",
        liveSupported: true,
      })
    );

    clientWs.on("message", (raw) => {
      try {
        const data = JSON.parse(raw.toString());
        if (data.audio) {
          liveSession.sendRealtimeInput({
            audio: { data: data.audio, mimeType: "audio/pcm;rate=16000" },
          });
        }
      } catch (err) {
        console.warn("Live voice chunk parse error:", err.message);
      }
    });

    clientWs.on("close", () => {
      try {
        liveSession.close?.();
      } catch (_) {}
    });
  } catch (liveErr) {
    console.warn("Gemini Live session connection failed:", liveErr.message);
    clientWs.send(
      JSON.stringify({
        type: "status",
        connected: false,
        error: liveErr.message,
        message: "Live streaming audio session unavailable. Standard voice messaging fallback active.",
        liveSupported: false,
      })
    );
  }
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

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`ANVESHA server running on http://0.0.0.0:${PORT}`);
  });
}

start();
