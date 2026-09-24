import crypto from "crypto";
import fs from "fs";
import path from "path";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "anvesha-clinical-care-jwt-secret-2026-secure";
const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const MAX_OTP_ATTEMPTS = 3;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_REQUESTS_PER_WINDOW = 5;

// Persistent file storage directory for offline/local mode
const DATA_DIR = path.join(process.cwd(), "server", "data");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
const DB_FILE = path.join(DATA_DIR, "real_auth_db.json");

/**
 * Initial Seeds for Real Authenticated System
 * Distinct from Demo Data: represents real verified accounts in MongoDB / persistent store
 */
const INITIAL_REAL_STORE = {
  users: [
    {
      userId: "USR-PAT-001",
      phone: "+919876543210",
      name: "Savitri Devi",
      role: "patient",
      patientId: "PAT-REAL-001",
      caregiverId: null,
      createdAt: "2026-09-01T08:00:00.000Z",
      verifiedAt: "2026-09-01T08:05:00.000Z",
    },
    {
      userId: "USR-CG-001",
      phone: "+919876511111",
      name: "Dr. Ananya Roy",
      role: "caregiver",
      patientId: null,
      caregiverId: "CG-REAL-001",
      createdAt: "2026-09-01T09:00:00.000Z",
      verifiedAt: "2026-09-01T09:02:00.000Z",
    },
  ],
  patients: [
    {
      patientId: "PAT-REAL-001",
      userId: "USR-PAT-001",
      name: "Savitri Devi",
      age: 74,
      room: "204",
      language: "Hindi",
      languageCode: "hi-IN",
      condition: "Mild Cognitive Impairment (Observational Routine Support)",
      emergencyContact: "+919876511111",
      reminders: [
        { id: "rem-101", title: "Morning Blood Pressure & Water", time: "08:30 AM", completed: true },
        { id: "rem-102", title: "Memory Tile Activity", time: "11:30 AM", completed: false },
        { id: "rem-103", title: "Gentle Evening Walk in Courtyard", time: "05:00 PM", completed: false },
      ],
      metrics: {
        cognitiveScore: 84,
        activityStreak: 6,
        sleepQuality: "Restful (7.5 hrs)",
        adherenceRate: 96,
      },
    },
  ],
  caregivers: [
    {
      caregiverId: "CG-REAL-001",
      userId: "USR-CG-001",
      name: "Dr. Ananya Roy",
      email: "ananya.roy@eldercare.org",
      phone: "+919876511111",
      roleTitle: "Consultant Geriatric Specialist",
    },
  ],
  caregiver_patient_links: [
    {
      linkId: "LNK-001",
      caregiverId: "CG-REAL-001",
      patientId: "PAT-REAL-001",
      relationship: "Assigned Primary Specialist",
      status: "active",
      createdAt: "2026-09-01T09:10:00.000Z",
    },
  ],
  otp_sessions: [],
};

// In-memory cache + persistent sync
let memoryStore = null;

function loadStore() {
  if (memoryStore) return memoryStore;
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, "utf8");
      memoryStore = JSON.parse(raw);
    } else {
      memoryStore = JSON.parse(JSON.stringify(INITIAL_REAL_STORE));
      fs.writeFileSync(DB_FILE, JSON.stringify(memoryStore, null, 2), "utf8");
    }
  } catch (err) {
    console.warn("Could not read real_auth_db.json, initializing fresh store:", err.message);
    memoryStore = JSON.parse(JSON.stringify(INITIAL_REAL_STORE));
  }
  return memoryStore;
}

function saveStore() {
  if (!memoryStore) return;
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(memoryStore, null, 2), "utf8");
  } catch (err) {
    console.error("Failed to save real_auth_db.json:", err.message);
  }
}

// Clean expired OTP sessions periodically
function cleanExpiredSessions() {
  const store = loadStore();
  const now = Date.now();
  store.otp_sessions = (store.otp_sessions || []).filter(
    (s) => new Date(s.expiresAt).getTime() > now && s.attempts < MAX_OTP_ATTEMPTS
  );
  saveStore();
}

/**
 * Normalizes phone numbers (handles +91, spaces, hyphens)
 */
export function normalizePhone(rawPhone) {
  if (!rawPhone || typeof rawPhone !== "string") return "";
  let digits = rawPhone.replace(/[^\d+]/g, "");
  if (!digits.startsWith("+")) {
    if (digits.length === 10) {
      digits = "+91" + digits;
    } else if (digits.length === 12 && digits.startsWith("91")) {
      digits = "+" + digits;
    } else {
      digits = "+" + digits;
    }
  }
  return digits;
}

/**
 * Secure cryptographic hashing of OTP to avoid plaintext storage
 */
function hashOtp(otpCode, phone) {
  return crypto
    .createHmac("sha256", JWT_SECRET)
    .update(`${phone}:${otpCode}`)
    .digest("hex");
}

/**
 * REQUEST OTP
 * Rate-limited, secure generation, non-plaintext storage
 */
export async function requestOtp({ phone }) {
  cleanExpiredSessions();
  const store = loadStore();
  const cleanPhone = normalizePhone(phone);

  if (!cleanPhone || cleanPhone.length < 10) {
    throw new Error("A valid phone number is required (e.g. +91 98765 43210)");
  }

  // Rate limiting check: max N requests in 10 minutes
  const now = Date.now();
  const recentRequests = (store.otp_sessions || []).filter(
    (s) => s.phone === cleanPhone && now - new Date(s.createdAt).getTime() < RATE_LIMIT_WINDOW_MS
  );

  if (recentRequests.length >= MAX_REQUESTS_PER_WINDOW) {
    throw new Error("Too many OTP requests for this phone number. Please wait a few minutes before trying again.");
  }

  // Invalidate any prior active sessions for this phone
  store.otp_sessions = (store.otp_sessions || []).map((s) =>
    s.phone === cleanPhone ? { ...s, active: false } : s
  );

  // Generate cryptographically random 6-digit OTP
  const rawOtp = String(crypto.randomInt(100000, 999999));
  const otpHash = hashOtp(rawOtp, cleanPhone);
  const sessionId = "OTP-" + crypto.randomUUID();
  const expiresAt = new Date(now + OTP_EXPIRY_MS).toISOString();

  const newSession = {
    sessionId,
    phone: cleanPhone,
    otpHash,
    attempts: 0,
    maxAttempts: MAX_OTP_ATTEMPTS,
    verified: false,
    active: true,
    createdAt: new Date().toISOString(),
    expiresAt,
  };

  store.otp_sessions.push(newSession);
  saveStore();

  // Check if phone belongs to an existing user
  const existingUser = (store.users || []).find((u) => u.phone === cleanPhone);

  console.log(`[Real Auth OTP] Phone: ${cleanPhone} | Session: ${sessionId} | Code: ${rawOtp} (Valid for 5 mins)`);

  return {
    success: true,
    sessionId,
    phone: cleanPhone,
    expiresAt,
    isExistingUser: !!existingUser,
    existingRole: existingUser ? existingUser.role : null,
    existingName: existingUser ? existingUser.name : null,
    // Provide development OTP in dev mode for immediate verification
    devOtp: process.env.NODE_ENV !== "production" ? rawOtp : undefined,
    message: "OTP sent successfully. Valid for 5 minutes.",
  };
}

/**
 * VERIFY OTP
 * Enforces attempt limits, invalidates on success, generates JWT
 */
export async function verifyOtp({ sessionId, phone, otpCode }) {
  cleanExpiredSessions();
  const store = loadStore();
  const cleanPhone = normalizePhone(phone);
  const cleanCode = String(otpCode || "").trim();

  if (!sessionId || !cleanCode) {
    throw new Error("Session ID and 6-digit OTP code are required.");
  }

  const session = (store.otp_sessions || []).find(
    (s) => s.sessionId === sessionId && s.phone === cleanPhone && s.active !== false
  );

  if (!session) {
    throw new Error("Invalid or expired OTP session. Please request a new verification code.");
  }

  if (new Date(session.expiresAt).getTime() < Date.now()) {
    session.active = false;
    saveStore();
    throw new Error("This verification code has expired. Please request a new OTP.");
  }

  if (session.attempts >= MAX_OTP_ATTEMPTS) {
    session.active = false;
    saveStore();
    throw new Error("Maximum verification attempts exceeded. For security, please request a new OTP.");
  }

  const expectedHash = hashOtp(cleanCode, cleanPhone);
  if (session.otpHash !== expectedHash) {
    session.attempts += 1;
    saveStore();
    const remaining = MAX_OTP_ATTEMPTS - session.attempts;
    throw new Error(`Incorrect verification code. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`);
  }

  // OTP is correct! Invalidate session immediately to prevent replay
  session.verified = true;
  session.active = false;
  saveStore();

  // Locate user in database
  let user = (store.users || []).find((u) => u.phone === cleanPhone);

  if (user) {
    user.verifiedAt = new Date().toISOString();
    saveStore();

    const token = generateToken(user);
    const profile = resolveUserProfile(user, store);

    console.log(`[Real Auth] Verified existing user: ${user.name} (${user.role}) - Phone: ${user.phone}`);

    return {
      success: true,
      needsRegistration: false,
      token,
      user: {
        userId: user.userId,
        phone: user.phone,
        name: user.name,
        role: user.role,
        patientId: user.patientId,
        caregiverId: user.caregiverId,
      },
      profile,
    };
  } else {
    // New phone number: needs name & role registration
    return {
      success: true,
      needsRegistration: true,
      phone: cleanPhone,
      sessionId,
      message: "Phone verified. Please provide your name and role to complete setup.",
    };
  }
}

/**
 * REGISTER NEW USER (After OTP verification)
 */
export async function registerNewUser({ sessionId, phone, name, role }) {
  const store = loadStore();
  const cleanPhone = normalizePhone(phone);
  const cleanName = (name || "").trim();
  const cleanRole = (role || "").toLowerCase() === "caregiver" ? "caregiver" : "patient";

  if (!cleanName || cleanName.length < 2) {
    throw new Error("A valid full name (at least 2 characters) is required.");
  }

  // Confirm session was verified
  const session = (store.otp_sessions || []).find(
    (s) => s.sessionId === sessionId && s.phone === cleanPhone && s.verified === true
  );

  if (!session) {
    throw new Error("Session verification missing or expired. Please verify your phone again.");
  }

  // Check if user already exists
  let user = (store.users || []).find((u) => u.phone === cleanPhone);
  if (user) {
    user.name = cleanName;
    user.role = cleanRole;
    saveStore();
    const token = generateToken(user);
    const profile = resolveUserProfile(user, store);
    return { success: true, token, user, profile };
  }

  const userId = `USR-${cleanRole.toUpperCase().slice(0, 3)}-${Date.now().toString().slice(-6)}`;
  let patientId = null;
  let caregiverId = null;

  if (cleanRole === "patient") {
    patientId = `PAT-REAL-${Date.now().toString().slice(-4)}`;
    const newPatient = {
      patientId,
      userId,
      name: cleanName,
      age: 72,
      room: "305",
      language: "Assamese",
      languageCode: "as-IN",
      condition: "Cognitive Care & Daily Routine Support",
      emergencyContact: "",
      reminders: [
        { id: "rem-auto-1", title: "Morning Medication & Hydration", time: "08:00 AM", completed: false },
        { id: "rem-auto-2", title: "Cognitive Memory Game", time: "02:00 PM", completed: false },
        { id: "rem-auto-3", title: "Evening Rest & Reflection", time: "08:30 PM", completed: false },
      ],
      metrics: {
        cognitiveScore: 80,
        activityStreak: 1,
        sleepQuality: "Good (7.0 hrs)",
        adherenceRate: 100,
      },
    };
    store.patients.push(newPatient);
  } else {
    caregiverId = `CG-REAL-${Date.now().toString().slice(-4)}`;
    const newCaregiver = {
      caregiverId,
      userId,
      name: cleanName,
      email: `${cleanName.toLowerCase().replace(/\s+/g, ".")}@care.org`,
      phone: cleanPhone,
      roleTitle: "Registered Care Specialist",
    };
    store.caregivers.push(newCaregiver);

    // Automatically link to default real patient for immediate functional demonstration
    const defaultPat = store.patients[0];
    if (defaultPat) {
      store.caregiver_patient_links.push({
        linkId: `LNK-${Date.now().toString().slice(-5)}`,
        caregiverId,
        patientId: defaultPat.patientId,
        relationship: "Primary Care Supervisor",
        status: "active",
        createdAt: new Date().toISOString(),
      });
    }
  }

  user = {
    userId,
    phone: cleanPhone,
    name: cleanName,
    role: cleanRole,
    patientId,
    caregiverId,
    createdAt: new Date().toISOString(),
    verifiedAt: new Date().toISOString(),
  };

  store.users.push(user);
  saveStore();

  const token = generateToken(user);
  const profile = resolveUserProfile(user, store);

  console.log(`[Real Auth] Registered new user: ${user.name} (${user.role}) - ID: ${user.userId}`);

  return {
    success: true,
    token,
    user: {
      userId: user.userId,
      phone: user.phone,
      name: user.name,
      role: user.role,
      patientId: user.patientId,
      caregiverId: user.caregiverId,
    },
    profile,
  };
}

/**
 * Generate Secure JWT
 */
export function generateToken(user) {
  return jwt.sign(
    {
      userId: user.userId,
      phone: user.phone,
      role: user.role,
      patientId: user.patientId,
      caregiverId: user.caregiverId,
      name: user.name,
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

/**
 * Verify JWT Token
 */
export function verifyAuthToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

/**
 * Resolve profile from user
 */
function resolveUserProfile(user, store) {
  if (user.role === "patient" && user.patientId) {
    return store.patients.find((p) => p.patientId === user.patientId) || null;
  }
  if (user.role === "caregiver" && user.caregiverId) {
    return store.caregivers.find((c) => c.caregiverId === user.caregiverId) || null;
  }
  return null;
}

/**
 * Express Middleware: Authenticate Real User via Bearer Token
 */
export function requireRealAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authentication token required. Please sign in with your phone." });
  }

  const token = authHeader.split(" ")[1];
  const decoded = verifyAuthToken(token);

  if (!decoded) {
    return res.status(401).json({ error: "Session expired or invalid. Please sign in again." });
  }

  req.user = decoded;
  next();
}

/**
 * Express Middleware: Optional Auth (Distinguishes Real Authenticated vs Demo)
 */
export function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    const decoded = verifyAuthToken(token);
    if (decoded) {
      req.user = decoded;
    }
  }
  next();
}

/**
 * Authorization: Check Caregiver Patient Link
 * Never permits accessing a patient unless linked
 */
export function checkCaregiverPatientLink(caregiverId, patientId) {
  const store = loadStore();
  const link = (store.caregiver_patient_links || []).find(
    (l) => l.caregiverId === caregiverId && l.patientId === patientId && l.status === "active"
  );
  return !!link;
}

/**
 * Get Patient Data for Authorized User
 */
export function getAuthorizedPatientRecord(reqUser, targetPatientId) {
  const store = loadStore();

  // If requester is a patient, they can ONLY access their own patientId
  if (reqUser.role === "patient") {
    if (reqUser.patientId !== targetPatientId) {
      throw new Error("Unauthorized: Patients can only access their own clinical record.");
    }
    return store.patients.find((p) => p.patientId === reqUser.patientId);
  }

  // If requester is a caregiver, verify caregiver_patient_links
  if (reqUser.role === "caregiver") {
    const isLinked = checkCaregiverPatientLink(reqUser.caregiverId, targetPatientId);
    if (!isLinked) {
      throw new Error(`Unauthorized: Patient ${targetPatientId} is not linked to your caregiver account.`);
    }
    return store.patients.find((p) => p.patientId === targetPatientId);
  }

  throw new Error("Unauthorized role.");
}

/**
 * Get All Patients Linked to a Caregiver
 */
export function getCaregiverLinkedPatients(caregiverId) {
  const store = loadStore();
  const links = (store.caregiver_patient_links || []).filter(
    (l) => l.caregiverId === caregiverId && l.status === "active"
  );
  const patientIds = links.map((l) => l.patientId);
  return store.patients.filter((p) => patientIds.includes(p.patientId));
}
