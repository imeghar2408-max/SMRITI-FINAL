import React, { useState, useEffect } from "react";
import {
  X,
  Phone,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Lock,
  User,
  Heart,
  Activity,
  KeyRound,
  Check,
  ChevronRight,
  Info,
} from "lucide-react";

export default function AuthModal({
  isOpen,
  onClose,
  initialTab = "phone", // "phone" | "demo"
  onDemoPatientSelect,
  onDemoCaregiverSelect,
  onRealAuthSuccess,
}) {
  const [activeTab, setActiveTab] = useState(initialTab); // "demo" | "phone"

  // Real Phone + OTP State
  const [step, setStep] = useState("enter-phone"); // "enter-phone" | "enter-otp" | "register"
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [devOtp, setDevOtp] = useState("");
  const [timer, setTimer] = useState(300);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Registration for new phone numbers
  const [regName, setRegName] = useState("");
  const [regRole, setRegRole] = useState("patient"); // "patient" | "caregiver"

  // Demo selection state
  const [demoRole, setDemoRole] = useState("patient");

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Countdown timer for OTP expiry
  useEffect(() => {
    let interval = null;
    if (step === "enter-otp" && timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    } else if (timer === 0 && step === "enter-otp") {
      setErrorMsg("Verification code expired. Please request a new OTP.");
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  if (!isOpen) return null;

  // Format seconds to MM:SS
  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // 1. Request OTP
  const handleRequestOtp = async (overridePhone = null) => {
    const targetPhone = overridePhone || phoneNumber;
    if (!targetPhone || targetPhone.replace(/\D/g, "").length < 10) {
      setErrorMsg("Please enter a valid 10-digit mobile phone number.");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await fetch("/api/real/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: targetPhone }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to send verification code");
      }

      setSessionId(data.sessionId);
      setDevOtp(data.devOtp || "");
      setTimer(300);
      setStep("enter-otp");
      setSuccessMsg(data.message || "Verification code sent successfully.");
    } catch (err) {
      setErrorMsg(err.message || "Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // 2. Verify OTP
  const handleVerifyOtp = async (overrideOtp = null) => {
    const codeToVerify = overrideOtp || otpCode;
    if (!codeToVerify || codeToVerify.length !== 6) {
      setErrorMsg("Please enter the complete 6-digit verification code.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/real/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          phone: phoneNumber,
          otpCode: codeToVerify,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Invalid verification code");
      }

      if (data.needsRegistration) {
        setStep("register");
        setSuccessMsg("Phone verified! Please set your name and role.");
        return;
      }

      // Existing user verified!
      localStorage.setItem("anvesha_real_token", data.token);
      localStorage.setItem("anvesha_real_user", JSON.stringify(data.user));

      onRealAuthSuccess(data);
      onClose();
    } catch (err) {
      setErrorMsg(err.message || "Failed to verify code.");
    } finally {
      setLoading(false);
    }
  };

  // 3. Register New Profile
  const handleRegister = async (e) => {
    e.preventDefault();
    if (!regName.trim()) {
      setErrorMsg("Please provide your full name.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/real/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          phone: phoneNumber,
          name: regName.trim(),
          role: regRole,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to complete registration");
      }

      localStorage.setItem("anvesha_real_token", data.token);
      localStorage.setItem("anvesha_real_user", JSON.stringify(data.user));

      onRealAuthSuccess(data);
      onClose();
    } catch (err) {
      setErrorMsg(err.message || "Failed to complete setup.");
    } finally {
      setLoading(false);
    }
  };

  // Quick fill sample credentials for evaluators
  const quickFillSample = (samplePhone) => {
    setPhoneNumber(samplePhone);
    handleRequestOtp(samplePhone);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-[#1B1D2A] border border-[#EAEBF4] dark:border-[#2B2E42] rounded-3xl max-w-xl w-full shadow-soft-lg relative animate-in fade-in zoom-in-95 duration-200 overflow-hidden my-8">
        {/* MODAL HEADER */}
        <div className="relative px-8 pt-8 pb-4 border-b border-[#EAEBF4] dark:border-[#2B2E42]">
          <button
            onClick={onClose}
            className="absolute top-6 right-6 text-[#6B6E85] hover:text-[#202238] dark:hover:text-white transition p-1 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800"
            aria-label="Close"
          >
            <X size={20} />
          </button>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-[#E8E8FA] dark:bg-[#25283C] text-[#6366D8] dark:text-[#8B8FE8] flex items-center justify-center font-black shadow-xs">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-[#202238] dark:text-white tracking-tight">
                ANVESHA Portal Access
              </h2>
              <p className="text-xs text-[#6B6E85] dark:text-[#9A9DB5]">
                Cognitive Eldercare Platform
              </p>
            </div>
          </div>

          {/* TWO CLEARLY SEPARATED MODES */}
          <div className="grid grid-cols-2 gap-2 mt-5 p-1 bg-[#F7F7FC] dark:bg-[#11121C] rounded-2xl border border-[#EAEBF4] dark:border-[#2B2E42]">
            <button
              type="button"
              onClick={() => {
                setActiveTab("demo");
                setErrorMsg("");
                setSuccessMsg("");
              }}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === "demo"
                  ? "bg-white dark:bg-[#1B1D2A] text-[#6366D8] dark:text-[#8B8FE8] shadow-xs border border-[#EAEBF4] dark:border-[#2B2E42]"
                  : "text-[#6B6E85] dark:text-[#9A9DB5] hover:text-[#202238] dark:hover:text-white"
              }`}
            >
              <Sparkles size={15} />
              <span>Demo Access</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("phone");
                setErrorMsg("");
                setSuccessMsg("");
              }}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === "phone"
                  ? "bg-white dark:bg-[#1B1D2A] text-[#6366D8] dark:text-[#8B8FE8] shadow-xs border border-[#EAEBF4] dark:border-[#2B2E42]"
                  : "text-[#6B6E85] dark:text-[#9A9DB5] hover:text-[#202238] dark:hover:text-white"
              }`}
            >
              <Phone size={15} />
              <span>Login with Phone</span>
            </button>
          </div>
        </div>

        {/* MODAL BODY */}
        <div className="p-8">
          {/* ==========================================================
              OPTION 1: DEMO ACCESS (100% PRESERVED, NO OTP REQUIRED)
              ========================================================== */}
          {activeTab === "demo" && (
            <div className="space-y-6">
              <div className="bg-[#E8E8FA]/70 dark:bg-[#25283C]/70 border border-[#6366D8]/20 rounded-2xl p-4 text-xs text-[#202238] dark:text-[#EDEFFF] flex items-start gap-3">
                <Info size={18} className="text-[#6366D8] dark:text-[#8B8FE8] shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <span className="font-bold text-[#6366D8] dark:text-[#8B8FE8]">
                    Hackathon Evaluation Mode:{" "}
                  </span>
                  Instant demo access with pre-configured longitudinal patient data, cognitive activities, telemetry, and safe-zone tracking. Completely offline-capable with zero OTP required.
                </div>
              </div>

              {/* DEMO PORTAL SELECTOR */}
              <div className="grid sm:grid-cols-2 gap-4">
                {/* Demo Patient Portal */}
                <div
                  onClick={() => {
                    onClose();
                    onDemoPatientSelect();
                  }}
                  className="group p-5 rounded-2xl border-2 border-[#EAEBF4] dark:border-[#2B2E42] hover:border-[#6366D8] bg-[#F7F7FC] dark:bg-[#11121C] transition-all hover:-translate-y-0.5 cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-2xl">👵</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#78CFA3]/20 text-[#2E7D56] dark:text-[#78CFA3]">
                        DEMO READY
                      </span>
                    </div>
                    <h3 className="font-bold text-base text-[#202238] dark:text-white group-hover:text-[#6366D8] transition-colors">
                      Patient Portal
                    </h3>
                    <p className="text-xs text-[#6B6E85] dark:text-[#9A9DB5] mt-1 leading-relaxed">
                      Asha (Age 78, Rm 402). Memory vault, Smriti AI companion, and routine puzzles.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-[#EAEBF4] dark:border-[#2B2E42] flex items-center justify-between text-xs font-bold text-[#6366D8] dark:text-[#8B8FE8]">
                    <span>Enter Demo Portal</span>
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>

                {/* Demo Caregiver Portal */}
                <div
                  onClick={() => {
                    onClose();
                    onDemoCaregiverSelect();
                  }}
                  className="group p-5 rounded-2xl border-2 border-[#EAEBF4] dark:border-[#2B2E42] hover:border-[#6366D8] bg-[#F7F7FC] dark:bg-[#11121C] transition-all hover:-translate-y-0.5 cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-2xl">🩺</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#6366D8]/20 text-[#6366D8] dark:text-[#8B8FE8]">
                        CLINICAL
                      </span>
                    </div>
                    <h3 className="font-bold text-base text-[#202238] dark:text-white group-hover:text-[#6366D8] transition-colors">
                      Caregiver Portal
                    </h3>
                    <p className="text-xs text-[#6B6E85] dark:text-[#9A9DB5] mt-1 leading-relaxed">
                      Dr. Sarah Jenkins. Live telemetry, cognitive trajectory graphs, and geofence alerts.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-[#EAEBF4] dark:border-[#2B2E42] flex items-center justify-between text-xs font-bold text-[#6366D8] dark:text-[#8B8FE8]">
                    <span>Enter Caregiver Login</span>
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>

              {/* DEMO CREDENTIAL NOTICE */}
              <div className="p-3.5 bg-stone-50 dark:bg-[#11121C] rounded-xl border border-stone-200 dark:border-stone-800 text-[11px] text-[#6B6E85] dark:text-[#9A9DB5] flex items-center justify-between">
                <span>Demo Caregiver credentials: <strong className="font-mono text-[#202238] dark:text-white">sarah.jenkins@smriti.org</strong> / <strong className="font-mono text-[#202238] dark:text-white">Sarah@123</strong></span>
              </div>
            </div>
          )}

          {/* ==========================================================
              OPTION 2: REAL PHONE + OTP LOGIN
              ========================================================== */}
          {activeTab === "phone" && (
            <div>
              {/* STEP 1: ENTER PHONE NUMBER */}
              {step === "enter-phone" && (
                <div className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-[#202238] dark:text-white mb-2 uppercase tracking-wider">
                      Mobile Phone Number
                    </label>
                    <div className="relative flex items-center">
                      <span className="absolute left-4 text-sm font-bold text-[#6B6E85] dark:text-[#9A9DB5]">
                        🇮🇳 +91
                      </span>
                      <input
                        type="tel"
                        value={phoneNumber.replace(/^\+91/, "")}
                        onChange={(e) => setPhoneNumber("+91" + e.target.value.replace(/\D/g, ""))}
                        placeholder="98765 43210"
                        maxLength={11}
                        className="w-full pl-20 pr-4 py-3.5 rounded-xl border border-[#EAEBF4] dark:border-[#2B2E42] bg-[#F7F7FC] dark:bg-[#11121C] text-[#202238] dark:text-white text-base font-medium focus:outline-none focus:ring-2 focus:ring-[#6366D8]"
                      />
                    </div>
                    <p className="text-[11px] text-[#6B6E85] dark:text-[#9A9DB5] mt-1.5">
                      We'll send a 6-digit one-time verification code via secure SMS.
                    </p>
                  </div>

                  {errorMsg && (
                    <div className="p-3 rounded-xl bg-[#E98B9B]/15 border border-[#E98B9B]/30 text-xs text-[#A82D42] dark:text-[#E98B9B] flex items-center gap-2">
                      <AlertCircle size={15} className="shrink-0" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  {/* QUICK FILL SAMPLE PHONE NUMBERS FOR EVALUATORS */}
                  <div className="bg-[#F7F7FC] dark:bg-[#11121C] p-3.5 rounded-2xl border border-[#EAEBF4] dark:border-[#2B2E42]">
                    <div className="flex items-center justify-between mb-2 text-[11px] text-[#6B6E85] dark:text-[#9A9DB5] font-semibold">
                      <span>Evaluator Test Accounts (1-Click Fill):</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => quickFillSample("+919876543210")}
                        className="p-2 rounded-xl bg-white dark:bg-[#1B1D2A] border border-[#EAEBF4] dark:border-[#2B2E42] hover:border-[#6366D8] text-left transition"
                      >
                        <div className="font-bold text-[#202238] dark:text-white flex items-center gap-1.5">
                          <span>👵</span>
                          <span>Real Patient</span>
                        </div>
                        <div className="text-[10px] text-[#6B6E85] dark:text-[#9A9DB5] font-mono mt-0.5">
                          98765 43210
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => quickFillSample("+919876511111")}
                        className="p-2 rounded-xl bg-white dark:bg-[#1B1D2A] border border-[#EAEBF4] dark:border-[#2B2E42] hover:border-[#6366D8] text-left transition"
                      >
                        <div className="font-bold text-[#202238] dark:text-white flex items-center gap-1.5">
                          <span>🩺</span>
                          <span>Real Caregiver</span>
                        </div>
                        <div className="text-[10px] text-[#6B6E85] dark:text-[#9A9DB5] font-mono mt-0.5">
                          98765 11111
                        </div>
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRequestOtp()}
                    disabled={loading || phoneNumber.replace(/\D/g, "").length < 10}
                    className="w-full py-4 bg-[#6366D8] hover:bg-[#5255C5] disabled:opacity-50 text-white font-bold rounded-xl transition shadow-soft flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>{loading ? "Sending Code..." : "Send Verification Code (OTP)"}</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              )}

              {/* STEP 2: ENTER OTP */}
              {step === "enter-otp" && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs text-[#6B6E85] dark:text-[#9A9DB5]">Verifying phone</span>
                      <p className="font-mono font-bold text-sm text-[#202238] dark:text-white">
                        {phoneNumber}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setStep("enter-phone");
                        setOtpCode("");
                        setErrorMsg("");
                      }}
                      className="text-xs font-semibold text-[#6366D8] dark:text-[#8B8FE8] hover:underline"
                    >
                      Change Phone
                    </button>
                  </div>

                  {/* DEVELOPMENT OTP PILL FOR IMMEDIATE EVALUATION */}
                  {devOtp && (
                    <div className="p-3.5 rounded-2xl bg-[#78CFA3]/15 border border-[#78CFA3]/30 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 text-[#2E7D56] dark:text-[#78CFA3] font-semibold">
                        <KeyRound size={16} />
                        <span>Dev OTP Code: <strong className="font-mono text-sm tracking-widest">{devOtp}</strong></span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setOtpCode(devOtp);
                          handleVerifyOtp(devOtp);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-[#78CFA3] text-white text-[11px] font-bold hover:bg-[#68BE92] transition"
                      >
                        Auto-Fill
                      </button>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-[#202238] dark:text-white mb-2 uppercase tracking-wider">
                      Enter 6-Digit Code
                    </label>
                    <input
                      type="text"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="• • • • • •"
                      maxLength={6}
                      autoFocus
                      className="w-full text-center tracking-[0.5em] text-2xl font-mono py-3.5 rounded-xl border border-[#EAEBF4] dark:border-[#2B2E42] bg-[#F7F7FC] dark:bg-[#11121C] text-[#202238] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6366D8]"
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs text-[#6B6E85] dark:text-[#9A9DB5]">
                    <span>Code expires in: <strong className="font-mono text-[#6366D8] dark:text-[#8B8FE8]">{formatTimer(timer)}</strong></span>
                    <button
                      type="button"
                      onClick={() => handleRequestOtp()}
                      disabled={timer > 240}
                      className="font-semibold text-[#6366D8] dark:text-[#8B8FE8] disabled:opacity-40 hover:underline"
                    >
                      Resend Code
                    </button>
                  </div>

                  {errorMsg && (
                    <div className="p-3 rounded-xl bg-[#E98B9B]/15 border border-[#E98B9B]/30 text-xs text-[#A82D42] dark:text-[#E98B9B] flex items-center gap-2">
                      <AlertCircle size={15} className="shrink-0" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => handleVerifyOtp()}
                    disabled={loading || otpCode.length !== 6}
                    className="w-full py-4 bg-[#6366D8] hover:bg-[#5255C5] disabled:opacity-50 text-white font-bold rounded-xl transition shadow-soft flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>{loading ? "Verifying..." : "Verify & Continue"}</span>
                    <CheckCircle2 size={16} />
                  </button>
                </div>
              )}

              {/* STEP 3: REGISTER NEW USER PROFILE */}
              {step === "register" && (
                <form onSubmit={handleRegister} className="space-y-5">
                  <div className="p-3 rounded-2xl bg-[#E8E8FA] dark:bg-[#25283C] text-xs text-[#6366D8] dark:text-[#8B8FE8]">
                    Welcome! Please complete your account profile to access your designated portal.
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#202238] dark:text-white mb-2 uppercase tracking-wider">
                      Your Full Name
                    </label>
                    <input
                      type="text"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="e.g. Ramesh Chandra"
                      required
                      className="w-full px-4 py-3.5 rounded-xl border border-[#EAEBF4] dark:border-[#2B2E42] bg-[#F7F7FC] dark:bg-[#11121C] text-[#202238] dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#6366D8]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#202238] dark:text-white mb-2 uppercase tracking-wider">
                      Select Your Role
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setRegRole("patient")}
                        className={`p-3.5 rounded-xl border text-left transition ${
                          regRole === "patient"
                            ? "border-[#6366D8] bg-[#E8E8FA] dark:bg-[#25283C] text-[#6366D8] dark:text-[#8B8FE8]"
                            : "border-[#EAEBF4] dark:border-[#2B2E42] text-[#6B6E85] dark:text-[#9A9DB5]"
                        }`}
                      >
                        <div className="font-bold text-sm flex items-center gap-1.5">
                          <span>👵</span>
                          <span>Patient</span>
                        </div>
                        <p className="text-[11px] opacity-80 mt-1">
                          Access memory vault, games & routine
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setRegRole("caregiver")}
                        className={`p-3.5 rounded-xl border text-left transition ${
                          regRole === "caregiver"
                            ? "border-[#6366D8] bg-[#E8E8FA] dark:bg-[#25283C] text-[#6366D8] dark:text-[#8B8FE8]"
                            : "border-[#EAEBF4] dark:border-[#2B2E42] text-[#6B6E85] dark:text-[#9A9DB5]"
                        }`}
                      >
                        <div className="font-bold text-sm flex items-center gap-1.5">
                          <span>🩺</span>
                          <span>Caregiver</span>
                        </div>
                        <p className="text-[11px] opacity-80 mt-1">
                          Monitor telemetry & manage care
                        </p>
                      </button>
                    </div>
                  </div>

                  {errorMsg && (
                    <div className="p-3 rounded-xl bg-[#E98B9B]/15 border border-[#E98B9B]/30 text-xs text-[#A82D42] dark:text-[#E98B9B]">
                      {errorMsg}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading || !regName.trim()}
                    className="w-full py-4 bg-[#6366D8] hover:bg-[#5255C5] disabled:opacity-50 text-white font-bold rounded-xl transition shadow-soft flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>{loading ? "Creating Profile..." : "Complete Setup & Enter Portal"}</span>
                    <ArrowRight size={16} />
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
