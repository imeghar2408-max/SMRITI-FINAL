import React, { useState } from "react";
import {
  ArrowLeft,
  ShieldCheck,
  LogIn,
  CheckCircle2,
} from "lucide-react";

const SARAH_ACCOUNT = {
  email: "sarah.jenkins@smriti.org",
  password: "Sarah@123",
  name: "Sarah Jenkins",
};

export default function CaregiverAuth({ onSarahLogin, onBack }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();
    setLoginError("");

    const normalizedEmail = email.trim().toLowerCase();

    if (
      normalizedEmail === SARAH_ACCOUNT.email &&
      password === SARAH_ACCOUNT.password
    ) {
      onSarahLogin({
        name: SARAH_ACCOUNT.name,
        email: SARAH_ACCOUNT.email,
        isDemo: true,
      });

      return;
    }

    setLoginError(
      "Invalid caregiver email or password. Please check your credentials."
    );
  };

  const fillDemoAccount = () => {
    setEmail(SARAH_ACCOUNT.email);
    setPassword(SARAH_ACCOUNT.password);
  };

  return (
    <div className="min-h-[calc(100vh-73px)] flex items-center justify-center px-6 py-10 animate-in fade-in duration-300">
      <div className="w-full max-w-4xl">
        {/* BACK */}
        <button
          onClick={onBack}
          className="mb-6 flex items-center gap-2 text-sm font-semibold text-[#6B6E85] hover:text-[#6366D8] dark:hover:text-[#8B8FE8] transition cursor-pointer"
        >
          <ArrowLeft size={17} />
          <span>Back to Home</span>
        </button>

        <div className="grid lg:grid-cols-[0.85fr_1.15fr] bg-white dark:bg-[#1B1D2A] rounded-3xl border border-[#EAEBF4] dark:border-[#2B2E42] shadow-soft-lg overflow-hidden">
          {/* LEFT SIDE: BRAND / PURPOSE */}
          <div className="bg-[#6366D8] text-white p-8 lg:p-10 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-6 shadow-soft">
                <ShieldCheck size={26} />
              </div>

              <h1 className="text-3xl font-extrabold tracking-tight mb-4">
                ANVESHA Caregiver Portal
              </h1>

              <p className="text-white/85 text-sm leading-relaxed">
                Secure access for caregivers and healthcare professionals managing cognitive care, daily telemetry, and patient wellbeing.
              </p>

              <div className="mt-8 space-y-3.5 text-xs font-medium">
                <div className="flex items-center gap-3">
                  <CheckCircle2 size={16} className="text-[#E8E8FA] shrink-0" />
                  <span>Real-time patient telemetry &amp; sync</span>
                </div>

                <div className="flex items-center gap-3">
                  <CheckCircle2 size={16} className="text-[#E8E8FA] shrink-0" />
                  <span>Adaptive cognitive rhythm calibration</span>
                </div>

                <div className="flex items-center gap-3">
                  <CheckCircle2 size={16} className="text-[#E8E8FA] shrink-0" />
                  <span>Memory vault curation &amp; photo stories</span>
                </div>

                <div className="flex items-center gap-3">
                  <CheckCircle2 size={16} className="text-[#E8E8FA] shrink-0" />
                  <span>Safety geofencing &amp; emergency alerts</span>
                </div>
              </div>
            </div>

            {/* DEMO ACCOUNT QUICK FILL */}
            <div className="relative z-10 mt-8 p-4 rounded-2xl bg-white/15 border border-white/20 text-xs leading-5">
              <div className="flex items-center justify-between mb-1.5">
                <p className="font-bold">Demo Clinical Account</p>
                <button
                  type="button"
                  onClick={fillDemoAccount}
                  className="px-2.5 py-0.5 rounded-lg bg-white text-[#6366D8] font-bold text-[11px] hover:bg-[#E8E8FA] transition cursor-pointer"
                >
                  Quick Fill
                </button>
              </div>
              <p className="opacity-90">Dr. Sarah Jenkins</p>
              <p className="font-mono text-[11px] opacity-80">sarah.jenkins@smriti.org</p>
              <p className="font-mono text-[11px] opacity-80">Password: Sarah@123</p>
            </div>
          </div>

          {/* RIGHT SIDE: FORM */}
          <div className="p-8 lg:p-10 flex flex-col justify-center">
            <div className="mb-7">
              <h2 className="text-2xl font-bold text-[#202238] dark:text-white">
                Caregiver Login
              </h2>
              <p className="text-sm text-[#6B6E85] dark:text-[#9A9DB5] mt-1">
                Sign in to access your monitored patient roster.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              {/* EMAIL */}
              <div>
                <label className="block text-xs font-semibold text-[#6B6E85] dark:text-[#9A9DB5] mb-2 uppercase tracking-wider">
                  Work Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="sarah.jenkins@smriti.org"
                  className="w-full px-4 py-3.5 rounded-xl border border-[#EAEBF4] dark:border-[#2B2E42] bg-[#F7F7FC] dark:bg-[#11121C] text-[#202238] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6366D8]"
                  required
                />
              </div>

              {/* PASSWORD */}
              <div>
                <label className="block text-xs font-semibold text-[#6B6E85] dark:text-[#9A9DB5] mb-2 uppercase tracking-wider">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your clinical password"
                  className="w-full px-4 py-3.5 rounded-xl border border-[#EAEBF4] dark:border-[#2B2E42] bg-[#F7F7FC] dark:bg-[#11121C] text-[#202238] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6366D8]"
                  required
                />
              </div>

              {/* ERROR */}
              {loginError && (
                <div className="bg-[#E98B9B]/15 text-[#C7485E] dark:text-[#E98B9B] border border-[#E98B9B]/30 rounded-xl p-3 text-xs font-semibold">
                  {loginError}
                </div>
              )}

              {/* SUBMIT BUTTON */}
              <button
                type="submit"
                className="w-full py-4 bg-[#6366D8] hover:bg-[#5255C5] text-white rounded-xl font-bold transition shadow-soft flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                <LogIn size={18} />
                <span>Login to Dashboard</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
