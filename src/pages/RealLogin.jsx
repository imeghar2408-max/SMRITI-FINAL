import React, { useState, useEffect } from "react";
import {
  Phone,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  User,
  Heart,
  Activity,
  Info,
} from "lucide-react";

export default function RealLogin({
  onDemoPatientSelect,
  onDemoCaregiverSelect,
  onRealAuthSuccess,
  onBack,
}) {
  const [activeTab, setActiveTab] = useState("phone"); // "demo" | "phone"
  const [step, setStep] = useState("enter-phone"); // "enter-phone" | "enter-otp" | "register"
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [devOtp, setDevOtp] = useState("");
  const [timer, setTimer] = useState(300);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [regName, setRegName] = useState("");
  const [regRole, setRegRole] = useState("patient");

  useEffect(() => {
    let interval = null;
    if (step === "enter-otp" && timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    } else if (timer === 0 && step === "enter-otp") {
      setErrorMsg("Verification code expired. Please request a new OTP.");
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

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
      setSuccessMsg(data.message || "Verification code sent.");
    } catch (err) {
      setErrorMsg(err.message || "Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

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

      localStorage.setItem("anvesha_real_token", data.token);
      localStorage.setItem("anvesha_real_user", JSON.stringify(data.user));

      onRealAuthSuccess(data);
    } catch (err) {
      setErrorMsg(err.message || "Failed to verify code.");
    } finally {
      setLoading(false);
    }
  };

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
    } catch (err) {
      setErrorMsg(err.message || "Failed to complete setup.");
    } finally {
      setLoading(false);
    }
  };

  const quickFillSample = (samplePhone) => {
    setPhoneNumber(samplePhone);
    handleRequestOtp(samplePhone);
  };

  return (
    <div className="min-h-[calc(100vh-73px)] flex items-center justify-center px-6 py-10 animate-in fade-in duration-300">
      <div className="w-full max-w-4xl">
        {onBack && (
          <button
            onClick={onBack}
            className="mb-6 flex items-center gap-2 text-sm font-semibold text-[#6B6E85] hover:text-[#6366D8] dark:hover:text-[#8B8FE8] transition cursor-pointer"
          >
            <ArrowLeft size={17} />
            <span>Back to Home</span>
          </button>
        )}

        <div className="grid lg:grid-cols-[0.9fr_1.1fr] bg-white dark:bg-[#1B1D2A] rounded-3xl border border-[#EAEBF4] dark:border-[#2B2E42] shadow-soft-lg overflow-hidden">
          {/* BRAND PANEL */}
          <div className="bg-[#6366D8] text-white p-8 lg:p-10 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-6 shadow-soft">
                <ShieldCheck size={26} />
              </div>

              <h1 className="text-3xl font-extrabold tracking-tight mb-4">
                ANVESHA Portal Login
              </h1>

              <p className="text-white/85 text-sm leading-relaxed">
                Empathetic cognitive care platform with separate pathways for hackathon evaluation and authenticated clinical accounts.
              </p>

              <div className="mt-8 space-y-3.5 text-xs font-medium">
                <div className="flex items-center gap-3">
                  <CheckCircle2 size={16} className="text-[#E8E8FA] shrink-0" />
                  <span>Dual authentication: Demo Access &amp; Real Phone OTP</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 size={16} className="text-[#E8E8FA] shrink-0" />
                  <span>Automatic role-based routing (Patient / Caregiver)</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 size={16} className="text-[#E8E8FA] shrink-0" />
                  <span>Server-side authorization and relationship security</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 size={16} className="text-[#E8E8FA] shrink-0" />
                  <span>Offline-first architecture preserved</span>
                </div>
              </div>
            </div>

            <div className="relative z-10 mt-8 p-4 rounded-2xl bg-white/15 border border-white/20 text-xs">
              <span className="font-bold block mb-1">Evaluator Tip</span>
              <p className="opacity-90 leading-relaxed">
                Use <strong>Demo Access</strong> for instant walkthroughs without SMS, or <strong>Login with Phone</strong> to test live OTP generation &amp; real session verification.
              </p>
            </div>
          </div>

          {/* FORM PANEL */}
          <div className="p-8 lg:p-10 flex flex-col justify-center">
            {/* MODE SWITCHER BUTTONS */}
            <div className="grid grid-cols-2 gap-2 mb-8 p-1.5 bg-[#F7F7FC] dark:bg-[#11121C] rounded-2xl border border-[#EAEBF4] dark:border-[#2B2E42]">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("demo");
                  setErrorMsg("");
                }}
                className={`py-3 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                  activeTab === "demo"
                    ? "bg-white dark:bg-[#1B1D2A] text-[#6366D8] dark:text-[#8B8FE8] shadow-xs border border-[#EAEBF4] dark:border-[#2B2E42]"
                    : "text-[#6B6E85] dark:text-[#9A9DB5] hover:text-[#202238] dark:hover:text-white"
                }`}
              >
                <Sparkles size={16} />
                <span>Demo Access</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab("phone");
                  setErrorMsg("");
                }}
                className={`py-3 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                  activeTab === "phone"
                    ? "bg-white dark:bg-[#1B1D2A] text-[#6366D8] dark:text-[#8B8FE8] shadow-xs border border-[#EAEBF4] dark:border-[#2B2E42]"
                    : "text-[#6B6E85] dark:text-[#9A9DB5] hover:text-[#202238] dark:hover:text-white"
                }`}
              >
                <Phone size={16} />
                <span>Login with Phone</span>
              </button>
            </div>

            {/* TAB 1: DEMO ACCESS */}
            {activeTab === "demo" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-[#202238] dark:text-white">
                    Demo Mode Access
                  </h2>
                  <p className="text-xs text-[#6B6E85] dark:text-[#9A9DB5] mt-1">
                    Select a portal to enter with pre-loaded demo telemetry. No OTP required.
                  </p>
                </div>

                <div className="grid gap-3.5">
                  <button
                    type="button"
                    onClick={onDemoPatientSelect}
                    className="p-5 rounded-2xl border-2 border-[#EAEBF4] dark:border-[#2B2E42] hover:border-[#6366D8] bg-[#F7F7FC] dark:bg-[#11121C] text-left transition hover:-translate-y-0.5 cursor-pointer flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-3xl">👵</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-[#202238] dark:text-white">
                            Patient Portal
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#78CFA3]/20 text-[#2E7D56] dark:text-[#78CFA3]">
                            DEMO
                          </span>
                        </div>
                        <p className="text-xs text-[#6B6E85] dark:text-[#9A9DB5] mt-0.5">
                          Asha (Rm 402) · Memory vault, games &amp; AI companion
                        </p>
                      </div>
                    </div>
                    <ArrowRight size={18} className="text-[#6366D8] dark:text-[#8B8FE8] group-hover:translate-x-1 transition-transform" />
                  </button>

                  <button
                    type="button"
                    onClick={onDemoCaregiverSelect}
                    className="p-5 rounded-2xl border-2 border-[#EAEBF4] dark:border-[#2B2E42] hover:border-[#6366D8] bg-[#F7F7FC] dark:bg-[#11121C] text-left transition hover:-translate-y-0.5 cursor-pointer flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-3xl">🩺</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-[#202238] dark:text-white">
                            Caregiver Portal
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#6366D8]/20 text-[#6366D8] dark:text-[#8B8FE8]">
                            CLINICAL
                          </span>
                        </div>
                        <p className="text-xs text-[#6B6E85] dark:text-[#9A9DB5] mt-0.5">
                          Dr. Sarah Jenkins · Longitudinal telemetry &amp; geofence
                        </p>
                      </div>
                    </div>
                    <ArrowRight size={18} className="text-[#6366D8] dark:text-[#8B8FE8] group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: REAL PHONE + OTP */}
            {activeTab === "phone" && (
              <div>
                {step === "enter-phone" && (
                  <div className="space-y-5">
                    <div>
                      <h2 className="text-xl font-bold text-[#202238] dark:text-white">
                        Real Phone Login
                      </h2>
                      <p className="text-xs text-[#6B6E85] dark:text-[#9A9DB5] mt-1">
                        Sign in with your mobile phone using one-time password verification.
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#202238] dark:text-white mb-2 uppercase tracking-wider">
                        Phone Number
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
                    </div>

                    {errorMsg && (
                      <div className="p-3 rounded-xl bg-[#E98B9B]/15 border border-[#E98B9B]/30 text-xs text-[#A82D42] dark:text-[#E98B9B] flex items-center gap-2">
                        <AlertCircle size={15} className="shrink-0" />
                        <span>{errorMsg}</span>
                      </div>
                    )}

                    {/* Evaluator Quick-Fill */}
                    <div className="bg-[#F7F7FC] dark:bg-[#11121C] p-3.5 rounded-2xl border border-[#EAEBF4] dark:border-[#2B2E42]">
                      <div className="flex items-center justify-between mb-2 text-[11px] text-[#6B6E85] dark:text-[#9A9DB5] font-semibold">
                        <span>Evaluator Seed Accounts:</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <button
                          type="button"
                          onClick={() => quickFillSample("+919876543210")}
                          className="p-2 rounded-xl bg-white dark:bg-[#1B1D2A] border border-[#EAEBF4] dark:border-[#2B2E42] hover:border-[#6366D8] text-left transition"
                        >
                          <div className="font-bold text-[#202238] dark:text-white flex items-center gap-1.5">
                            <span>👵</span>
                            <span>Patient</span>
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
                            <span>Caregiver</span>
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
    </div>
  );
}
