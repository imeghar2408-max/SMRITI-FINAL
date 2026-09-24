import React, { useState, useEffect } from "react";
import Patients from "./pages/caregiver/Patients";
import Analytics from "./pages/caregiver/Analytics";
import Rhythm from "./pages/caregiver/Rhythm";
import Vault from "./pages/caregiver/Vault";
import Reminders from "./pages/caregiver/Reminders";
import FamilySocial from "./pages/caregiver/FamilySocial";
import Safety from "./pages/caregiver/Safety";
import CaregiverAuth from "./pages/caregiver/CaregiverAuth";
import FamilyMemory from "./pages/patient/FamilyMemory";
import Mood from "./pages/patient/Mood";
import MemoryGame from "./pages/patient/MemoryGame";
import GameResult from "./pages/patient/Gameresult";
import VoiceTest from "./components/VoiceTest";
import Reminder from "./pages/patient/Reminder";
import AnveshaChat from "./components/AnveshaChat";
import patientData from "./data/patientData";
import { generateAdaptivePlan } from "./ai/adaptiveEngine";
import PatientDashboard from "./pages/patient/PatientDashboard";
import SpotTheDifference from "./pages/patient/SpotTheDifference";
import Activities from "./pages/patient/Activities";
import Progress from "./pages/patient/Progress";
import PatternMatch from "./pages/patient/PatternMatch";
import DailyRoutine from "./pages/patient/DailyRoutine";
import WhoIsAtMyDoor from "./pages/patient/WhoIsAtMyDoor";
import PatientLocation from "./pages/patient/PatientLocation";
import CaregiverLocation from "./pages/caregiver/CaregiverLocation";
import Alerts from "./pages/caregiver/Alerts";
import AuthModal from "./components/AuthModal";
import RealLogin from "./pages/RealLogin";
import heroImage from "./hero.png";
import { ThemeProvider, useTheme } from "./utils/themeContext";
import { PatientProvider, usePatient } from "./context/PatientContext";
import PatientSelector from "./components/PatientSelector";
import {
  Home,
  Brain,
  Calendar,
  Bell,
  ShieldAlert,
  Heart,
  Play,
  CheckCircle2,
  Clock,
  Activity,
  ArrowRight,
  UserCheck,
  Volume2,
  Mic,
  CalendarDays,
  Pill,
  Droplets,
  AlertTriangle,
  BarChart3,
  Sparkles,
  RotateCcw,
  Lightbulb,
  Search,
  Plus,
  Filter,
  ChevronRight,
  X,
  Bot,
  MapPin,
  Eye,
  Compass,
  ShieldCheck,
  Users,
  Check,
  Layers,
  Sun,
  Moon,
  Smile,
  Shield,
} from "lucide-react";

export default function App() {
  return (
    <ThemeProvider>
      <PatientProvider>
        <AuraAppContent />
      </PatientProvider>
    </ThemeProvider>
  );
}

function AuraAppContent() {
  const { isDark, toggleTheme } = useTheme();

  // Navigation State
  // Views: 'landing', 'real-login', 'patient-dashboard', 'patient-activities', 'patient-game',
  //        'patient-game-result', 'patient-family',
  //        'caregiver-overview', 'caregiver-patient', 'caregiver-rhythm', 'caregiver-alerts'
  const [currentView, setCurrentView] = useState("landing");

  // Dual Authentication State: "demo" (default) or "real" (phone OTP verified)
  const [authMode, setAuthMode] = useState("demo");
  const [realUser, setRealUser] = useState(() => {
    try {
      const stored = localStorage.getItem("anvesha_real_user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [loginModalTab, setLoginModalTab] = useState("phone"); // "demo" | "phone"

  const [loggedInCaregiver, setLoggedInCaregiver] = useState(null);
  const [patientSync, setPatientSync] = useState(null);

  useEffect(() => {
    const fetchSync = () => {
      fetch("/api/caregiver/patients/P001/sync-status")
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data) setPatientSync(data);
        })
        .catch(() => {});
    };

    fetchSync();
    const interval = setInterval(fetchSync, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#F7F7FC] dark:bg-[#11121C] text-[#202238] dark:text-[#EDEFFF] font-sans antialiased transition-colors duration-200">
      {/* GLOBAL NAVBAR */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-[#1B1D2A]/90 backdrop-blur-md border-b border-[#EAEBF4] dark:border-[#2B2E42] px-6 py-3.5 flex items-center justify-between shadow-xs">
        {/* Brand Zone */}
        <div className="flex items-center space-x-3">
          <div
            onClick={() => setCurrentView("landing")}
            className="text-2xl font-black tracking-tight text-[#6366D8] dark:text-[#8B8FE8] cursor-pointer hover:opacity-90 transition flex items-center space-x-2"
          >
            <span>ANVESHA</span>
          </div>
          <span className="text-xs bg-[#E8E8FA] dark:bg-[#25283C] text-[#6366D8] dark:text-[#8B8FE8] px-2.5 py-0.5 rounded-full font-semibold hidden sm:inline-block">
            Cognitive Care
          </span>
        </div>

        {/* Action Controls & Navigation */}
        <nav className="flex items-center space-x-2.5 text-sm font-medium">
          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            className="p-2 rounded-xl border border-[#EAEBF4] dark:border-[#2B2E42] text-[#6B6E85] dark:text-[#9A9DB5] hover:text-[#6366D8] dark:hover:text-[#8B8FE8] hover:bg-[#F7F7FC] dark:hover:bg-[#25283C] transition cursor-pointer"
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDark ? <Sun size={17} className="text-[#F3B562]" /> : <Moon size={17} />}
          </button>

          {currentView.startsWith("patient") && (
            <div className="flex items-center space-x-2">
              <span className="hidden md:inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#E8E8FA] dark:bg-[#25283C] text-[#6366D8] dark:text-[#8B8FE8] text-xs font-bold border border-[#6366D8]/20">
                <span>👵</span>
                <span>
                  {authMode === "real" && realUser
                    ? `Patient: ${realUser.name} (${realUser.phone})`
                    : "Patient: Asha (Rm 402)"}
                </span>
                {authMode === "real" && (
                  <span className="px-1.5 py-0.2 bg-[#78CFA3]/20 text-[#2E7D56] dark:text-[#78CFA3] rounded text-[10px] font-black">
                    VERIFIED
                  </span>
                )}
              </span>
              <button
                onClick={() => setCurrentView("caregiver-overview")}
                className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-[#1B1D2A] hover:bg-[#E8E8FA] dark:hover:bg-[#25283C] text-[#6366D8] dark:text-[#8B8FE8] border border-[#EAEBF4] dark:border-[#2B2E42] text-xs font-semibold transition flex items-center space-x-1.5"
              >
                <span>Caregiver Portal →</span>
              </button>
              {authMode === "real" && (
                <button
                  type="button"
                  onClick={() => {
                    localStorage.removeItem("anvesha_real_token");
                    localStorage.removeItem("anvesha_real_user");
                    setRealUser(null);
                    setAuthMode("demo");
                    setCurrentView("landing");
                  }}
                  className="px-2.5 py-1.5 rounded-xl border border-[#EAEBF4] dark:border-[#2B2E42] text-xs text-[#6B6E85] dark:text-[#9A9DB5] hover:text-[#E98B9B]"
                  title="Sign out of real account"
                >
                  Sign Out
                </button>
              )}
            </div>
          )}

          {currentView.startsWith("caregiver") && currentView !== "caregiver-login" && (
            <div className="flex items-center space-x-2">
              {patientSync && (
                <span
                  title={
                    patientSync.lastSyncedAt
                      ? `Last synced: ${new Date(patientSync.lastSyncedAt).toLocaleTimeString()}`
                      : "Sync telemetry"
                  }
                  className={`hidden sm:inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border ${
                    patientSync.state === "synced"
                      ? "bg-[#78CFA3]/15 text-[#2E7D56] dark:text-[#78CFA3] border-[#78CFA3]/30"
                      : patientSync.state === "pending"
                      ? "bg-[#F3B562]/15 text-[#9C6119] dark:text-[#F3B562] border-[#F3B562]/30"
                      : "bg-[#EAEBF4] text-[#6B6E85] border-[#D6D8E5]"
                  }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${
                      patientSync.state === "synced"
                        ? "bg-[#78CFA3] animate-pulse"
                        : patientSync.state === "pending"
                        ? "bg-[#F3B562]"
                        : "bg-slate-400"
                    }`}
                  />
                  <span>Asha: {patientSync.label}</span>
                </span>
              )}

              {/* Global Patient Selector in Caregiver Header */}
              <PatientSelector compact={true} />

              <span className="hidden md:inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#6366D8] text-white text-xs font-bold shadow-xs">
                <span>🩺</span>
                <span>
                  {authMode === "real" && realUser
                    ? `Dr. ${realUser.name} (${realUser.phone})`
                    : `Caregiver: ${loggedInCaregiver?.name || "Dr. Sarah Jenkins"}`}
                </span>
                {authMode === "real" && (
                  <span className="px-1.5 py-0.2 bg-white/20 text-white rounded text-[10px] font-black">
                    VERIFIED
                  </span>
                )}
              </span>
              <button
                onClick={() => setCurrentView("patient-dashboard")}
                className="px-3.5 py-1.5 rounded-xl bg-[#E8E8FA] dark:bg-[#25283C] hover:bg-[#6366D8]/20 text-[#6366D8] dark:text-[#8B8FE8] text-xs font-semibold transition border border-[#6366D8]/20 flex items-center space-x-1.5"
              >
                <span>Patient Portal →</span>
              </button>
              {authMode === "real" && (
                <button
                  type="button"
                  onClick={() => {
                    localStorage.removeItem("anvesha_real_token");
                    localStorage.removeItem("anvesha_real_user");
                    setRealUser(null);
                    setAuthMode("demo");
                    setCurrentView("landing");
                  }}
                  className="px-2.5 py-1.5 rounded-xl border border-[#EAEBF4] dark:border-[#2B2E42] text-xs text-[#6B6E85] dark:text-[#9A9DB5] hover:text-[#E98B9B]"
                  title="Sign out of real account"
                >
                  Sign Out
                </button>
              )}
            </div>
          )}

          {currentView === "landing" && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  setAuthMode("demo");
                  setCurrentView("patient-dashboard");
                }}
                className="px-3.5 py-1.5 rounded-xl bg-[#E8E8FA] dark:bg-[#25283C] text-[#6366D8] dark:text-[#8B8FE8] text-xs font-bold hover:bg-[#6366D8]/20 transition border border-[#6366D8]/20"
              >
                Demo Patient
              </button>
              <button
                onClick={() => {
                  setAuthMode("demo");
                  setCurrentView("caregiver-login");
                }}
                className="px-3.5 py-1.5 rounded-xl bg-[#6366D8] hover:bg-[#5255C5] text-white text-xs font-bold transition shadow-xs"
              >
                Demo Caregiver
              </button>
              <button
                onClick={() => {
                  setLoginModalTab("phone");
                  setIsLoginOpen(true);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-[#78CFA3]/15 hover:bg-[#78CFA3]/25 text-[#2E7D56] dark:text-[#78CFA3] border border-[#78CFA3]/30 text-xs font-bold transition flex items-center gap-1.5"
              >
                <span>📱</span>
                <span>Phone Login</span>
              </button>
            </div>
          )}

          <button
            onClick={() => {
              setLoginModalTab("demo");
              setIsLoginOpen(true);
            }}
            className="px-3.5 py-1.5 rounded-xl border border-[#EAEBF4] dark:border-[#2B2E42] font-semibold text-xs text-[#6B6E85] dark:text-[#9A9DB5] hover:border-[#6366D8] hover:text-[#6366D8] transition"
          >
            Switch Portal
          </button>
        </nav>
      </header>

      {/* DUAL-MODE AUTH MODAL: DEMO ACCESS & REAL PHONE OTP */}
      <AuthModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        initialTab={loginModalTab}
        onDemoPatientSelect={() => {
          setAuthMode("demo");
          setIsLoginOpen(false);
          setCurrentView("patient-dashboard");
        }}
        onDemoCaregiverSelect={() => {
          setAuthMode("demo");
          setIsLoginOpen(false);
          setCurrentView("caregiver-login");
        }}
        onRealAuthSuccess={(data) => {
          setAuthMode("real");
          setRealUser(data.user);
          setIsLoginOpen(false);
          if (data.user?.role === "caregiver") {
            setLoggedInCaregiver({
              name: data.user.name,
              phone: data.user.phone,
              isReal: true,
            });
            setCurrentView("caregiver-overview");
          } else {
            setCurrentView("patient-dashboard");
          }
        }}
      />

      {/* DYNAMIC SCREENS */}
      {currentView === "real-login" && (
        <RealLogin
          onBack={() => setCurrentView("landing")}
          onDemoPatientSelect={() => {
            setAuthMode("demo");
            setCurrentView("patient-dashboard");
          }}
          onDemoCaregiverSelect={() => {
            setAuthMode("demo");
            setCurrentView("caregiver-login");
          }}
          onRealAuthSuccess={(data) => {
            setAuthMode("real");
            setRealUser(data.user);
            if (data.user?.role === "caregiver") {
              setLoggedInCaregiver({
                name: data.user.name,
                phone: data.user.phone,
                isReal: true,
              });
              setCurrentView("caregiver-overview");
            } else {
              setCurrentView("patient-dashboard");
            }
          }}
        />
      )}

      {currentView === "caregiver-login" && (
        <CaregiverAuth
          onBack={() => {
            setCurrentView("landing");
          }}
          onSarahLogin={(caregiver) => {
            setAuthMode("demo");
            setLoggedInCaregiver(caregiver);
            setCurrentView("caregiver-overview");
          }}
        />
      )}

      <main>
        {currentView === "landing" && (
          <LandingView
            onOpenPatient={() => {
              setAuthMode("demo");
              setIsLoginOpen(false);
              setCurrentView("patient-dashboard");
            }}
            onOpenCaregiver={() => {
              setAuthMode("demo");
              setIsLoginOpen(false);
              setCurrentView("caregiver-login");
            }}
            onOpenRealLogin={() => {
              setLoginModalTab("phone");
              setIsLoginOpen(true);
            }}
          />
        )}

        {currentView === "voice-test" && <VoiceTest />}

        {/* PATIENT INTERFACES */}
        {currentView.startsWith("patient") && (
          <PatientLayout currentView={currentView} setCurrentView={setCurrentView}>
            {currentView === "patient-dashboard" && (
              <PatientDashboard setCurrentView={setCurrentView} />
            )}
            {currentView === "patient-location" && (
              <PatientLocation setCurrentView={setCurrentView} />
            )}
            {currentView === "patient-activities" && (
              <Activities setCurrentView={setCurrentView} />
            )}
            {currentView === "patient-spot-difference" && (
              <SpotTheDifference setCurrentView={setCurrentView} />
            )}
            {currentView === "patient-game" && (
              <MemoryGame setCurrentView={setCurrentView} />
            )}
            {currentView === "patient-progress" && <Progress />}
            {currentView === "patient-family" && <FamilyMemory />}
            {currentView === "patient-reminders" && (
              <Reminder setCurrentView={setCurrentView} />
            )}
            {currentView === "patient-door" && <WhoIsAtMyDoor />}
            {currentView === "patient-smriti" && <AnveshaChat />}
            {currentView === "patient-pattern-match" && (
              <PatternMatch setCurrentView={setCurrentView} />
            )}
            {currentView === "patient-daily-routine" && (
              <DailyRoutine setCurrentView={setCurrentView} />
            )}
            {currentView === "patient-mood" && <Mood />}
            {currentView === "patient-game-result" && (
              <GameResult setCurrentView={setCurrentView} />
            )}
          </PatientLayout>
        )}

        {/* CAREGIVER INTERFACES */}
        {currentView.startsWith("caregiver") && currentView !== "caregiver-login" && (
          <CaregiverLayout
            currentView={currentView}
            setCurrentView={setCurrentView}
            caregiver={loggedInCaregiver}
            patientSync={patientSync}
          >
            {currentView === "caregiver-patients" && (
              <Patients setCurrentView={setCurrentView} />
            )}

            {currentView === "caregiver-location" && (
              <CaregiverLocation setCurrentView={setCurrentView} />
            )}

            {currentView === "caregiver-analytics" && <Analytics />}

            {currentView === "caregiver-overview" && (
              <CaregiverOverviewView setCurrentView={setCurrentView} />
            )}

            {currentView === "caregiver-patient" && (
              <CaregiverPatientDetailView setCurrentView={setCurrentView} />
            )}

            {currentView === "caregiver-rhythm" && (
              <Rhythm setCurrentView={setCurrentView} />
            )}

            {currentView === "caregiver-alerts" && (
              <Alerts setCurrentView={setCurrentView} />
            )}

            {currentView === "caregiver-vault" && (
              <Vault setCurrentView={setCurrentView} />
            )}

            {currentView === "caregiver-reminders" && (
              <Reminders setCurrentView={setCurrentView} />
            )}

            {currentView === "caregiver-family" && (
              <FamilySocial setCurrentView={setCurrentView} />
            )}

            {currentView === "caregiver-safety" && (
              <Safety setCurrentView={setCurrentView} />
            )}
          </CaregiverLayout>
        )}
      </main>
    </div>
  );
}

/* ==========================================================================
   1. LANDING VIEW & SCROLL HOOKS
   ========================================================================== */

function useScrollReveal(threshold = 0.12) {
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = React.useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setIsVisible(true);
      return;
    }

    const target = elementRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold, rootMargin: "0px 0px -30px 0px" }
    );

    observer.observe(target);

    return () => {
      if (target) observer.unobserve(target);
      observer.disconnect();
    };
  }, [threshold]);

  return [elementRef, isVisible];
}

function LandingView({ onOpenPatient, onOpenCaregiver, onOpenRealLogin }) {
  const [aboutRef, aboutVisible] = useScrollReveal(0.1);
  const [suiteRef, suiteVisible] = useScrollReveal(0.1);
  const [howRef, howVisible] = useScrollReveal(0.1);
  const [connectionRef, connectionVisible] = useScrollReveal(0.1);
  const [portalsRef, portalsVisible] = useScrollReveal(0.12);

  return (
    <div className="min-h-screen text-[#202238] dark:text-[#EDEFFF] overflow-x-hidden">
      {/* ====================================================================
          HERO SECTION (Eldercare Periwinkle/Indigo Overlay with hero.png)
          ==================================================================== */}
      <section className="relative min-h-[88vh] md:min-h-[92vh] flex flex-col justify-between overflow-hidden">
        {/* Background Image with Slow Zoom */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="w-full h-full bg-cover bg-center animate-hero-zoom origin-center"
            style={{
              backgroundImage: `url(${heroImage})`,
            }}
            aria-hidden="true"
          />
          {/* Subtle Lavender/Periwinkle Scrim Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#14162B]/92 via-[#1F2140]/84 to-[#11121C]/96 backdrop-blur-[0.5px]" />
          <div className="absolute inset-0 bg-radial at-center from-transparent via-[#14162B]/30 to-[#11121C]/75" />
        </div>

        {/* Hero Content Area */}
        <div className="relative z-10 max-w-5xl mx-auto px-6 pt-24 md:pt-32 pb-16 text-center flex-1 flex flex-col items-center justify-center">
          {/* Unboxed editorial kicker */}
          <div className="animate-hero-fade inline-flex items-center gap-2 text-xs md:text-sm font-semibold tracking-wide text-[#E8E8FA] mb-6 px-4 py-1.5 rounded-full bg-[#6366D8]/25 border border-[#8B8FE8]/30 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-[#78CFA3] animate-pulse" />
            <span>AI-Powered Cognitive Care &amp; Memory Companion</span>
          </div>

          {/* Primary Headline */}
          <h1 className="animate-hero-fade-d1 text-4xl sm:text-6xl md:text-7xl font-extrabold text-white tracking-tight leading-[1.08] max-w-4xl drop-shadow-xs">
            Explore. Remember. <br className="hidden sm:inline" />
            <span className="text-[#8B8FE8]">Connect. Care.</span>
          </h1>

          {/* Supporting Narrative */}
          <p className="animate-hero-fade-d2 text-base sm:text-xl text-[#E8E8FA]/90 max-w-2xl mt-6 font-normal leading-relaxed text-balance">
            ANVESHA bridges clinical precision and empathetic warmth—supporting patients living with memory challenges while providing families continuous peace of mind.
          </p>

          {/* Primary Action Buttons: Demo Access vs Real Phone Login */}
          <div className="animate-hero-fade-d3 mt-9 flex flex-col sm:flex-row items-center gap-3.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={onOpenPatient}
              className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-[#6366D8] text-white font-bold text-sm hover:bg-[#5255C5] transition-all duration-200 shadow-soft-lg hover:-translate-y-0.5 flex items-center justify-center space-x-2 group cursor-pointer"
            >
              <span>Demo Patient Portal</span>
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              type="button"
              onClick={onOpenCaregiver}
              className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm border border-white/25 backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 flex items-center justify-center space-x-2 cursor-pointer"
            >
              <span>Demo Caregiver</span>
              <ChevronRight size={16} className="text-[#8B8FE8]" />
            </button>

            <button
              type="button"
              onClick={onOpenRealLogin}
              className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-[#78CFA3]/25 hover:bg-[#78CFA3]/35 text-[#E8E8FA] hover:text-white font-bold text-sm border border-[#78CFA3]/40 backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 flex items-center justify-center space-x-2 cursor-pointer shadow-soft"
            >
              <span>📱 Login with Phone</span>
              <ArrowRight size={16} className="text-[#78CFA3]" />
            </button>
          </div>

          {/* Trust Points */}
          <div className="animate-hero-fade-d3 mt-10 hidden sm:flex items-center gap-6 text-xs text-[#E8E8FA]/80 font-medium">
            <span>Ambient Sensor Support</span>
            <span className="text-[#8B8FE8]/60">·</span>
            <span>Predictable Fixed-Grid Layout</span>
            <span className="text-[#8B8FE8]/60">·</span>
            <span>Zero Clinical Jargon</span>
          </div>
        </div>

        {/* Scroll cue */}
        <div className="relative z-10 pb-8 flex flex-col items-center justify-center text-center text-xs tracking-widest uppercase text-[#8B8FE8]/80 gap-2">
          <span>Scroll to explore</span>
          <span className="animate-gentle-float text-[#8B8FE8] text-sm">↓</span>
        </div>
      </section>

      {/* ====================================================================
          ABOUT ANVESHA SECTION (6 Visually Engaging Pillar Cards)
          ==================================================================== */}
      <section
        ref={aboutRef}
        className={`max-w-6xl mx-auto px-6 py-20 transition-all duration-700 ease-out ${
          aboutVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        <div className="max-w-2xl mb-12">
          <div className="text-xs font-bold text-[#6366D8] dark:text-[#8B8FE8] uppercase tracking-widest mb-2">
            About ANVESHA
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#202238] dark:text-white tracking-tight">
            A sanctuary of support, engineered with empathetic professionalism.
          </h2>
          <p className="mt-4 text-base text-[#6B6E85] dark:text-[#9A9DB5] leading-relaxed">
            We bridge the gap between clinical precision and accessible warmth—nurturing patient independence while surrounding families and clinicians with continuous reassurance.
          </p>
        </div>

        {/* 6 Structured Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1: AI Personalization */}
          <div className="bg-white dark:bg-[#1B1D2A] rounded-3xl p-7 border border-[#EAEBF4] dark:border-[#2B2E42] shadow-soft hover:shadow-soft-lg hover:-translate-y-1 transition-all duration-300">
            <div className="w-12 h-12 rounded-2xl bg-[#E8E8FA] dark:bg-[#25283C] text-[#6366D8] dark:text-[#8B8FE8] flex items-center justify-center mb-5">
              <Brain size={24} />
            </div>
            <h3 className="text-lg font-bold text-[#202238] dark:text-white mb-2">
              AI Personalization
            </h3>
            <p className="text-sm text-[#6B6E85] dark:text-[#9A9DB5] leading-relaxed">
              Adaptive models calibrate daily challenges to individual comfort levels, providing positive reinforcement without frustration.
            </p>
            <div className="mt-5 pt-3 border-t border-[#EAEBF4] dark:border-[#2B2E42] text-xs text-[#6366D8] dark:text-[#8B8FE8] font-semibold">
              Dynamic difficulty · Continuous learning
            </div>
          </div>

          {/* Card 2: Accessible by Design */}
          <div className="bg-white dark:bg-[#1B1D2A] rounded-3xl p-7 border border-[#EAEBF4] dark:border-[#2B2E42] shadow-soft hover:shadow-soft-lg hover:-translate-y-1 transition-all duration-300">
            <div className="w-12 h-12 rounded-2xl bg-[#E8E8FA] dark:bg-[#25283C] text-[#6366D8] dark:text-[#8B8FE8] flex items-center justify-center mb-5">
              <UserCheck size={24} />
            </div>
            <h3 className="text-lg font-bold text-[#202238] dark:text-white mb-2">
              Accessible by Design
            </h3>
            <p className="text-sm text-[#6B6E85] dark:text-[#9A9DB5] leading-relaxed">
              Large touch targets, high contrast, predictable navigation, and zero jargon preserve independence across changing abilities.
            </p>
            <div className="mt-5 pt-3 border-t border-[#EAEBF4] dark:border-[#2B2E42] text-xs text-[#6366D8] dark:text-[#8B8FE8] font-semibold">
              WCAG AA · 44px+ touch targets
            </div>
          </div>

          {/* Card 3: Contextual Memory */}
          <div className="bg-white dark:bg-[#1B1D2A] rounded-3xl p-7 border border-[#EAEBF4] dark:border-[#2B2E42] shadow-soft hover:shadow-soft-lg hover:-translate-y-1 transition-all duration-300">
            <div className="w-12 h-12 rounded-2xl bg-[#E8E8FA] dark:bg-[#25283C] text-[#6366D8] dark:text-[#8B8FE8] flex items-center justify-center mb-5">
              <Heart size={24} />
            </div>
            <h3 className="text-lg font-bold text-[#202238] dark:text-white mb-2">
              Contextual Memory
            </h3>
            <p className="text-sm text-[#6B6E85] dark:text-[#9A9DB5] leading-relaxed">
              Gently integrates family photos, voice prompts, and cherished milestones to spark calm emotional recognition every day.
            </p>
            <div className="mt-5 pt-3 border-t border-[#EAEBF4] dark:border-[#2B2E42] text-xs text-[#6366D8] dark:text-[#8B8FE8] font-semibold">
              Reminiscence vault · Familiar voices
            </div>
          </div>

          {/* Card 4: Non-punitive Adaptation */}
          <div className="bg-white dark:bg-[#1B1D2A] rounded-3xl p-7 border border-[#EAEBF4] dark:border-[#2B2E42] shadow-soft hover:shadow-soft-lg hover:-translate-y-1 transition-all duration-300">
            <div className="w-12 h-12 rounded-2xl bg-[#E8E8FA] dark:bg-[#25283C] text-[#6366D8] dark:text-[#8B8FE8] flex items-center justify-center mb-5">
              <Sparkles size={24} />
            </div>
            <h3 className="text-lg font-bold text-[#202238] dark:text-white mb-2">
              Non-punitive Adaptation
            </h3>
            <p className="text-sm text-[#6B6E85] dark:text-[#9A9DB5] leading-relaxed">
              No countdown timers, no failing scores, and no stressful penalties. Sessions adjust gently when hesitation or fatigue is detected.
            </p>
            <div className="mt-5 pt-3 border-t border-[#EAEBF4] dark:border-[#2B2E42] text-xs text-[#6366D8] dark:text-[#8B8FE8] font-semibold">
              Zero stress · Encouraging pacing
            </div>
          </div>

          {/* Card 5: High Contrast Targets */}
          <div className="bg-white dark:bg-[#1B1D2A] rounded-3xl p-7 border border-[#EAEBF4] dark:border-[#2B2E42] shadow-soft hover:shadow-soft-lg hover:-translate-y-1 transition-all duration-300">
            <div className="w-12 h-12 rounded-2xl bg-[#E8E8FA] dark:bg-[#25283C] text-[#6366D8] dark:text-[#8B8FE8] flex items-center justify-center mb-5">
              <Eye size={24} />
            </div>
            <h3 className="text-lg font-bold text-[#202238] dark:text-white mb-2">
              High Contrast Targets
            </h3>
            <p className="text-sm text-[#6B6E85] dark:text-[#9A9DB5] leading-relaxed">
              Vivid visual separation, generous click zones, and dark mode compensation allow effortless interaction even with tremors or low vision.
            </p>
            <div className="mt-5 pt-3 border-t border-[#EAEBF4] dark:border-[#2B2E42] text-xs text-[#6366D8] dark:text-[#8B8FE8] font-semibold">
              Optimized legibility · Big click surfaces
            </div>
          </div>

          {/* Card 6: Fixed-Grid Architecture */}
          <div className="bg-white dark:bg-[#1B1D2A] rounded-3xl p-7 border border-[#EAEBF4] dark:border-[#2B2E42] shadow-soft hover:shadow-soft-lg hover:-translate-y-1 transition-all duration-300">
            <div className="w-12 h-12 rounded-2xl bg-[#E8E8FA] dark:bg-[#25283C] text-[#6366D8] dark:text-[#8B8FE8] flex items-center justify-center mb-5">
              <Layers size={24} />
            </div>
            <h3 className="text-lg font-bold text-[#202238] dark:text-white mb-2">
              Fixed-Grid Architecture
            </h3>
            <p className="text-sm text-[#6B6E85] dark:text-[#9A9DB5] leading-relaxed">
              Spatial stability across screens prevents disorientation. Key actions stay exactly where expected day after day.
            </p>
            <div className="mt-5 pt-3 border-t border-[#EAEBF4] dark:border-[#2B2E42] text-xs text-[#6366D8] dark:text-[#8B8FE8] font-semibold">
              Spatial consistency · Muscle memory
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          COGNITIVE SUITE SECTION (5 Card-Based Core Modules)
          ==================================================================== */}
      <section
        ref={suiteRef}
        className={`max-w-6xl mx-auto px-6 py-12 transition-all duration-700 ease-out ${
          suiteVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        <div className="max-w-2xl mb-12">
          <div className="text-xs font-bold text-[#6366D8] dark:text-[#8B8FE8] uppercase tracking-widest mb-2">
            Cognitive Care Suite
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#202238] dark:text-white tracking-tight">
            Integrated tools for daily recall, comfort, and safety.
          </h2>
          <p className="mt-3 text-sm text-[#6B6E85] dark:text-[#9A9DB5]">
            Explore each pillar below to experience how ANVESHA nurtures memory, stimulates neural vitality, and safeguards routine.
          </p>
        </div>

        {/* 5-Card Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
          {/* Card 1: Memory & Personal Memories (Col span 3) */}
          <div
            onClick={onOpenPatient}
            className="group lg:col-span-3 bg-white dark:bg-[#1B1D2A] rounded-3xl p-7 border border-[#EAEBF4] dark:border-[#2B2E42] shadow-soft hover:shadow-soft-lg hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between cursor-pointer"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-11 h-11 rounded-2xl bg-[#E98B9B]/15 text-[#E98B9B] flex items-center justify-center">
                  <Heart size={22} />
                </div>
                <span className="text-xs font-semibold text-[#E98B9B] uppercase tracking-wider">
                  Reminiscence
                </span>
              </div>

              {/* Media Container */}
              <div className="relative h-44 rounded-2xl overflow-hidden bg-[#E8E8FA] dark:bg-[#25283C] mb-5 border border-[#EAEBF4] dark:border-[#2B2E42]">
                <img
                  src="/uploads/memories/memory-P001-1789906017999-828574790.jpg"
                  alt="Family Memory Reminiscence"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                  onError={(e) => {
                    e.currentTarget.src = "/hero-illustration.svg";
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-3 text-white text-xs font-medium">
                  Family Album · Priya (Daughter)
                </div>
              </div>

              <h3 className="text-xl font-bold text-[#202238] dark:text-white group-hover:text-[#6366D8] dark:group-hover:text-[#8B8FE8] transition-colors">
                Memory &amp; Personal Memories
              </h3>
              <p className="text-sm text-[#6B6E85] dark:text-[#9A9DB5] mt-2 leading-relaxed">
                Familiar faces, voice recordings, and cherished life milestones gently anchor daily identity and spark calm emotional recall.
              </p>
            </div>

            <div className="mt-5 pt-4 border-t border-[#EAEBF4] dark:border-[#2B2E42] flex items-center justify-between text-xs font-bold text-[#6366D8] dark:text-[#8B8FE8]">
              <span>EXPLORE MEMORIES</span>
              <ArrowRight size={16} className="group-hover:translate-x-1.5 transition-transform" />
            </div>
          </div>

          {/* Card 2: Cognitive Activities (Col span 3) */}
          <div
            onClick={onOpenPatient}
            className="group lg:col-span-3 bg-white dark:bg-[#1B1D2A] rounded-3xl p-7 border border-[#EAEBF4] dark:border-[#2B2E42] shadow-soft hover:shadow-soft-lg hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between cursor-pointer"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-11 h-11 rounded-2xl bg-[#6366D8]/15 text-[#6366D8] dark:text-[#8B8FE8] flex items-center justify-center">
                  <Play size={22} />
                </div>
                <span className="text-xs font-semibold text-[#6366D8] dark:text-[#8B8FE8] uppercase tracking-wider">
                  Stimulation
                </span>
              </div>

              {/* Game illustration */}
              <div className="relative h-44 rounded-2xl overflow-hidden bg-gradient-to-br from-[#E8E8FA] via-white to-[#F7F7FC] dark:from-[#25283C] dark:via-[#1B1D2A] dark:to-[#11121C] mb-5 p-4 flex items-center justify-center border border-[#EAEBF4] dark:border-[#2B2E42]">
                <img
                  src="/games/memory-match.svg"
                  alt="Cognitive Exercises"
                  className="max-h-36 max-w-full object-contain group-hover:scale-105 transition-transform duration-500 ease-out"
                />
                <div className="absolute top-2 right-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/90 dark:bg-[#1B1D2A] text-[#6366D8] dark:text-[#8B8FE8] shadow-xs">
                    4 Active Games
                  </span>
                </div>
              </div>

              <h3 className="text-xl font-bold text-[#202238] dark:text-white group-hover:text-[#6366D8] dark:group-hover:text-[#8B8FE8] transition-colors">
                Cognitive Activities
              </h3>
              <p className="text-sm text-[#6B6E85] dark:text-[#9A9DB5] mt-2 leading-relaxed">
                Memory Match, Spot the Difference, Pattern Match, and Daily Routine—evidence-based exercises without countdown clocks or stress.
              </p>
            </div>

            <div className="mt-5 pt-4 border-t border-[#EAEBF4] dark:border-[#2B2E42] flex items-center justify-between text-xs font-bold text-[#6366D8] dark:text-[#8B8FE8]">
              <span>VIEW ACTIVITIES</span>
              <ArrowRight size={16} className="group-hover:translate-x-1.5 transition-transform" />
            </div>
          </div>

          {/* Card 3: Mood Check-in (Col span 2) */}
          <div
            onClick={onOpenPatient}
            className="group lg:col-span-2 bg-white dark:bg-[#1B1D2A] rounded-3xl p-7 border border-[#EAEBF4] dark:border-[#2B2E42] shadow-soft hover:shadow-soft-lg hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between cursor-pointer"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-11 h-11 rounded-2xl bg-[#78CFA3]/15 text-[#2E7D56] dark:text-[#78CFA3] flex items-center justify-center">
                  <Smile size={22} />
                </div>
                <span className="text-xs font-semibold text-[#2E7D56] dark:text-[#78CFA3] uppercase tracking-wider">
                  Emotional State
                </span>
              </div>

              <div className="h-32 rounded-2xl bg-[#E8E8FA]/50 dark:bg-[#25283C]/50 mb-5 p-3 flex flex-col justify-center items-center text-center border border-[#EAEBF4] dark:border-[#2B2E42]">
                <div className="flex items-center gap-2 text-2xl mb-1.5">
                  <span>😊</span>
                  <span>🌸</span>
                  <span>🌿</span>
                </div>
                <span className="text-xs font-bold text-[#202238] dark:text-white">Daily Wellness Reflection</span>
                <span className="text-[11px] text-[#6B6E85] dark:text-[#9A9DB5]">1-Tap Non-Verbal Check-in</span>
              </div>

              <h3 className="text-lg font-bold text-[#202238] dark:text-white group-hover:text-[#6366D8] dark:group-hover:text-[#8B8FE8] transition-colors">
                Mood Check-in
              </h3>
              <p className="text-xs text-[#6B6E85] dark:text-[#9A9DB5] mt-2 leading-relaxed">
                Simple emoji and voice check-ins track daily emotional valence and subtle comfort shifts.
              </p>
            </div>

            <div className="mt-5 pt-4 border-t border-[#EAEBF4] dark:border-[#2B2E42] flex items-center justify-between text-xs font-bold text-[#6366D8] dark:text-[#8B8FE8]">
              <span>CHECK MOOD</span>
              <ArrowRight size={16} className="group-hover:translate-x-1.5 transition-transform" />
            </div>
          </div>

          {/* Card 4: Medication & Routine Reminders (Col span 2) */}
          <div
            onClick={onOpenPatient}
            className="group lg:col-span-2 bg-white dark:bg-[#1B1D2A] rounded-3xl p-7 border border-[#EAEBF4] dark:border-[#2B2E42] shadow-soft hover:shadow-soft-lg hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between cursor-pointer"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-11 h-11 rounded-2xl bg-[#F3B562]/15 text-[#9C6119] dark:text-[#F3B562] flex items-center justify-center">
                  <Pill size={22} />
                </div>
                <span className="text-xs font-semibold text-[#9C6119] dark:text-[#F3B562] uppercase tracking-wider">
                  Routines
                </span>
              </div>

              <div className="h-32 rounded-2xl bg-[#E8E8FA]/50 dark:bg-[#25283C]/50 mb-5 p-3 flex flex-col justify-between border border-[#EAEBF4] dark:border-[#2B2E42]">
                <div className="flex items-center justify-between text-[11px] text-[#6B6E85] dark:text-[#9A9DB5]">
                  <span>Today's Schedule</span>
                  <span className="text-[#78CFA3] font-bold">● Active</span>
                </div>
                <div className="bg-white dark:bg-[#1B1D2A] p-2 rounded-xl border border-[#EAEBF4] dark:border-[#2B2E42] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">💊</span>
                    <span className="text-xs font-semibold text-[#202238] dark:text-white">Morning Tablet</span>
                  </div>
                  <span className="text-[11px] font-bold text-[#6366D8] dark:text-[#8B8FE8]">8:00 AM</span>
                </div>
              </div>

              <h3 className="text-lg font-bold text-[#202238] dark:text-white group-hover:text-[#6366D8] dark:group-hover:text-[#8B8FE8] transition-colors">
                Medication &amp; Routines
              </h3>
              <p className="text-xs text-[#6B6E85] dark:text-[#9A9DB5] mt-2 leading-relaxed">
                Clear reminders for pills, hydration, and doctor visits with gentle auditory chimes.
              </p>
            </div>

            <div className="mt-5 pt-4 border-t border-[#EAEBF4] dark:border-[#2B2E42] flex items-center justify-between text-xs font-bold text-[#6366D8] dark:text-[#8B8FE8]">
              <span>VIEW SCHEDULE</span>
              <ArrowRight size={16} className="group-hover:translate-x-1.5 transition-transform" />
            </div>
          </div>

          {/* Card 5: AI Companion (Col span 2) */}
          <div
            onClick={onOpenPatient}
            className="group lg:col-span-2 bg-white dark:bg-[#1B1D2A] rounded-3xl p-7 border border-[#EAEBF4] dark:border-[#2B2E42] shadow-soft hover:shadow-soft-lg hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between cursor-pointer"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-11 h-11 rounded-2xl bg-[#6366D8]/15 text-[#6366D8] dark:text-[#8B8FE8] flex items-center justify-center">
                  <Bot size={22} />
                </div>
                <span className="text-xs font-semibold text-[#6366D8] dark:text-[#8B8FE8] uppercase tracking-wider">
                  Companion
                </span>
              </div>

              <div className="h-32 rounded-2xl bg-gradient-to-br from-[#E8E8FA] to-white dark:from-[#25283C] dark:to-[#1B1D2A] mb-5 p-3 flex flex-col justify-center items-center text-center border border-[#EAEBF4] dark:border-[#2B2E42]">
                <div className="w-10 h-10 rounded-full bg-white dark:bg-[#1B1D2A] shadow-soft flex items-center justify-center text-[#6366D8] dark:text-[#8B8FE8] mb-1.5 group-hover:scale-110 transition-transform">
                  <Mic size={18} />
                </div>
                <span className="text-xs font-bold text-[#202238] dark:text-white">Smriti Voice Assistant</span>
                <span className="text-[10px] text-[#6B6E85] dark:text-[#9A9DB5]">Multilingual &amp; Non-Judgmental</span>
              </div>

              <h3 className="text-lg font-bold text-[#202238] dark:text-white group-hover:text-[#6366D8] dark:group-hover:text-[#8B8FE8] transition-colors">
                AI Companion
              </h3>
              <p className="text-xs text-[#6B6E85] dark:text-[#9A9DB5] mt-2 leading-relaxed">
                Empathetic conversational agent ready to answer questions, share stories, and reassure in native tongue.
              </p>
            </div>

            <div className="mt-5 pt-4 border-t border-[#EAEBF4] dark:border-[#2B2E42] flex items-center justify-between text-xs font-bold text-[#6366D8] dark:text-[#8B8FE8]">
              <span>TALK TO ANVESHA</span>
              <ArrowRight size={16} className="group-hover:translate-x-1.5 transition-transform" />
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          HOW IT WORKS SECTION (Periwinkle Glow & Connecting Flow)
          ==================================================================== */}
      <section ref={howRef} className="max-w-6xl mx-auto px-6 py-16">
        <div
          className={`bg-gradient-to-br from-[#1E2038] via-[#2A2D4F] to-[#181A2E] text-white rounded-3xl p-8 sm:p-12 md:p-16 shadow-soft-lg relative overflow-hidden transition-all duration-700 ease-out ${
            howVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          {/* Subtle Ambient Glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#8B8FE8]/15 rounded-full blur-3xl pointer-events-none" />

          {/* Header */}
          <div className="relative z-10 max-w-2xl mb-14">
            <div className="inline-flex items-center space-x-2 text-[#8B8FE8] text-xs font-bold tracking-widest uppercase mb-3">
              <Activity size={16} />
              <span>How It Works</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Continuous, dignified cognitive orchestration.
            </h2>
            <p className="mt-3 text-sm sm:text-base text-[#E8E8FA]/80 font-normal leading-relaxed">
              ANVESHA seamlessly links an accessible patient terminal with an explainable caregiver dashboard. Continuous monitoring translates into gentle observations without sacrificing privacy or dignity.
            </p>
          </div>

          {/* Sequential 3 Stages */}
          <div className="relative z-10">
            {/* Desktop Connecting Line */}
            <div
              className="hidden md:block absolute top-7 left-12 right-12 h-0.5 bg-gradient-to-r from-[#6366D8]/30 via-[#8B8FE8]/70 to-[#78CFA3]/60 -z-0"
              aria-hidden="true"
            />

            <div className="grid md:grid-cols-3 gap-8 md:gap-10">
              {/* Stage 1: Observe */}
              <div
                className={`relative bg-[#11121C]/60 border border-[#8B8FE8]/25 rounded-2xl p-6 backdrop-blur-xs transition-all duration-700 delay-100 ${
                  howVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-[#6366D8]/30 border border-[#8B8FE8]/40 text-[#8B8FE8] flex items-center justify-center font-extrabold text-sm">
                    01
                  </div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8B8FE8]">
                    Ambient Telemetry
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Observe</h3>
                <p className="text-xs text-[#E8E8FA]/75 leading-relaxed">
                  Passive background logging of activity rhythms, sleep quality, spatial presence, and cognitive game interactions without intrusive disruptions.
                </p>
                <div className="mt-4 pt-3 border-t border-white/10 text-[11px] text-[#8B8FE8] font-medium">
                  Ambient signals · Voice biomarkers
                </div>
              </div>

              {/* Stage 2: Analyze */}
              <div
                className={`relative bg-[#11121C]/60 border border-[#8B8FE8]/25 rounded-2xl p-6 backdrop-blur-xs transition-all duration-700 delay-200 ${
                  howVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-[#6366D8]/30 border border-[#8B8FE8]/40 text-[#8B8FE8] flex items-center justify-center font-extrabold text-sm">
                    02
                  </div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8B8FE8]">
                    Neural Reasoning
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Analyze</h3>
                <p className="text-xs text-[#E8E8FA]/75 leading-relaxed">
                  Adaptive AI models compare telemetry against personal cognitive baselines, detecting subtle fatigue or confusion patterns early.
                </p>
                <div className="mt-4 pt-3 border-t border-white/10 text-[11px] text-[#8B8FE8] font-medium">
                  Pattern detection · Non-diagnostic
                </div>
              </div>

              {/* Stage 3: Support */}
              <div
                className={`relative bg-[#11121C]/60 border border-[#8B8FE8]/25 rounded-2xl p-6 backdrop-blur-xs transition-all duration-700 delay-300 ${
                  howVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-[#6366D8]/30 border border-[#8B8FE8]/40 text-[#8B8FE8] flex items-center justify-center font-extrabold text-sm">
                    03
                  </div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8B8FE8]">
                    Gentle Care
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Support</h3>
                <p className="text-xs text-[#E8E8FA]/75 leading-relaxed">
                  Provides timely voice reminders, reminiscence prompts, and family connections to the patient, while giving caregivers actionable insights.
                </p>
                <div className="mt-4 pt-3 border-t border-white/10 text-[11px] text-[#8B8FE8] font-medium">
                  Gentle cues · One-touch emergency SOS
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          PRODUCT CONNECTION FLOW ("One platform. Two connected experiences.")
          ==================================================================== */}
      <section
        ref={connectionRef}
        className={`max-w-6xl mx-auto px-6 py-12 transition-all duration-700 ease-out ${
          connectionVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="text-xs font-bold text-[#6366D8] dark:text-[#8B8FE8] uppercase tracking-widest mb-2">
            Integrated Architecture
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#202238] dark:text-white tracking-tight">
            One platform. Two connected experiences.
          </h2>
          <p className="mt-3 text-sm text-[#6B6E85] dark:text-[#9A9DB5]">
            A harmonious bridge linking patient independence with caregiver vigilance in real time.
          </p>
        </div>

        {/* Visual Flow Grid */}
        <div className="grid lg:grid-cols-11 gap-4 items-center bg-white dark:bg-[#1B1D2A] rounded-3xl p-6 sm:p-10 border border-[#EAEBF4] dark:border-[#2B2E42] shadow-soft">
          {/* Patient Side */}
          <div className="lg:col-span-4 bg-[#E8E8FA]/60 dark:bg-[#25283C]/60 rounded-2xl p-6 border border-[#6366D8]/20">
            <div className="flex items-center space-x-2 text-[#6366D8] dark:text-[#8B8FE8] font-bold text-sm uppercase tracking-wider mb-4">
              <span className="w-2.5 h-2.5 rounded-full bg-[#6366D8]" />
              <span>PATIENT TERMINAL</span>
            </div>
            <ul className="space-y-3 text-xs text-[#202238] dark:text-[#EDEFFF] font-medium">
              <li className="flex items-center space-x-2">
                <Check size={15} className="text-[#6366D8] dark:text-[#8B8FE8] shrink-0" />
                <span>Cognitive activities &amp; brain exercises</span>
              </li>
              <li className="flex items-center space-x-2">
                <Check size={15} className="text-[#6366D8] dark:text-[#8B8FE8] shrink-0" />
                <span>Memory &amp; family reminiscence vault</span>
              </li>
              <li className="flex items-center space-x-2">
                <Check size={15} className="text-[#6366D8] dark:text-[#8B8FE8] shrink-0" />
                <span>Smriti AI voice companion</span>
              </li>
              <li className="flex items-center space-x-2">
                <Check size={15} className="text-[#6366D8] dark:text-[#8B8FE8] shrink-0" />
                <span>Daily visual routine &amp; hydration cues</span>
              </li>
              <li className="flex items-center space-x-2">
                <Check size={15} className="text-[#6366D8] dark:text-[#8B8FE8] shrink-0" />
                <span>Safe geofencing &amp; one-touch emergency SOS</span>
              </li>
            </ul>
          </div>

          {/* Central Connecting Hub */}
          <div className="lg:col-span-3 flex flex-col items-center justify-center py-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#6366D8] text-white flex items-center justify-center shadow-soft mb-2">
              <Brain size={26} className="text-[#E8E8FA]" />
            </div>
            <div className="text-base font-extrabold text-[#202238] dark:text-white">ANVESHA</div>
            <div className="text-xs text-[#6B6E85] dark:text-[#9A9DB5] font-medium mt-0.5">
              AI-Powered Cognitive Care
            </div>
            <div className="hidden lg:flex items-center space-x-2 text-[#6366D8] dark:text-[#8B8FE8] text-xs font-semibold mt-3">
              <span>← Bi-directional Sync →</span>
            </div>
          </div>

          {/* Caregiver Side */}
          <div className="lg:col-span-4 bg-[#F7F7FC] dark:bg-[#151724] rounded-2xl p-6 border border-[#EAEBF4] dark:border-[#2B2E42]">
            <div className="flex items-center space-x-2 text-[#202238] dark:text-white font-bold text-sm uppercase tracking-wider mb-4">
              <span className="w-2.5 h-2.5 rounded-full bg-[#78CFA3]" />
              <span>CAREGIVER PORTAL</span>
            </div>
            <ul className="space-y-3 text-xs text-[#202238] dark:text-[#EDEFFF] font-medium">
              <li className="flex items-center space-x-2">
                <Check size={15} className="text-[#78CFA3] shrink-0" />
                <span>Cognitive trajectory &amp; sleep telemetry</span>
              </li>
              <li className="flex items-center space-x-2">
                <Check size={15} className="text-[#78CFA3] shrink-0" />
                <span>AI-generated observational patterns &amp; evidence</span>
              </li>
              <li className="flex items-center space-x-2">
                <Check size={15} className="text-[#78CFA3] shrink-0" />
                <span>Live GPS location &amp; boundary alerts</span>
              </li>
              <li className="flex items-center space-x-2">
                <Check size={15} className="text-[#78CFA3] shrink-0" />
                <span>Medication reminders &amp; schedule sync</span>
              </li>
              <li className="flex items-center space-x-2">
                <Check size={15} className="text-[#78CFA3] shrink-0" />
                <span>Real-time safety monitoring &amp; instant alerts</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* ====================================================================
          FINAL SECTION: PROMINENT ENTRY CARDS
          ==================================================================== */}
      <section
        ref={portalsRef}
        className={`max-w-5xl mx-auto px-6 pt-8 pb-20 transition-all duration-700 ease-out ${
          portalsVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        <div className="text-center max-w-xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#202238] dark:text-white tracking-tight">
            Select your portal to begin
          </h2>
          <p className="mt-2 text-sm text-[#6B6E85] dark:text-[#9A9DB5]">
            Choose your tailored interface to experience ANVESHA.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Continue as Patient (Demo) */}
          <button
            type="button"
            onClick={onOpenPatient}
            className="group text-left p-7 sm:p-8 rounded-3xl bg-[#6366D8] hover:bg-[#5255C5] text-white transition-all duration-300 flex flex-col justify-between h-72 shadow-soft-lg hover:-translate-y-1 cursor-pointer border border-[#8B8FE8]/40 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />

            <div>
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-[#E8E8FA] text-xs font-semibold uppercase tracking-wider mb-3">
                <span>Demo Patient Portal</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Demo Patient
              </h3>
              <p className="text-xs text-[#E8E8FA]/90 mt-2 font-normal leading-relaxed">
                Asha (Age 78, Room 402). Memory vault, Smriti AI companion, and routine puzzles with pre-loaded telemetry.
              </p>
            </div>

            <div className="flex items-center space-x-2 text-xs font-bold text-white uppercase tracking-wider pt-4 group-hover:text-[#E8E8FA]">
              <span>ENTER DEMO</span>
              <ArrowRight size={16} className="group-hover:translate-x-1.5 transition-transform" />
            </div>
          </button>

          {/* Continue as Caregiver (Demo) */}
          <button
            type="button"
            onClick={onOpenCaregiver}
            className="group text-left p-7 sm:p-8 rounded-3xl bg-white dark:bg-[#1B1D2A] text-[#202238] dark:text-white hover:bg-[#F7F7FC] dark:hover:bg-[#25283C] transition-all duration-300 flex flex-col justify-between h-72 shadow-soft hover:shadow-soft-lg hover:-translate-y-1 cursor-pointer border-2 border-[#EAEBF4] dark:border-[#2B2E42] hover:border-[#6366D8] relative overflow-hidden"
          >
            <div>
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#E8E8FA] dark:bg-[#25283C] text-[#6366D8] dark:text-[#8B8FE8] text-xs font-semibold uppercase tracking-wider mb-3">
                <span>Demo Caregiver</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-[#202238] dark:text-white tracking-tight">
                Demo Caregiver
              </h3>
              <p className="text-xs text-[#6B6E85] dark:text-[#9A9DB5] mt-2 font-normal leading-relaxed">
                Dr. Sarah Jenkins. Live location tracking, cognitive trajectory analytics, and instant alert monitoring.
              </p>
            </div>

            <div className="flex items-center space-x-2 text-xs font-bold text-[#6366D8] dark:text-[#8B8FE8] uppercase tracking-wider pt-4 group-hover:text-[#5255C5]">
              <span>CAREGIVER LOGIN</span>
              <ArrowRight size={16} className="group-hover:translate-x-1.5 transition-transform" />
            </div>
          </button>

          {/* Real Login with Phone (New Flow) */}
          <button
            type="button"
            onClick={onOpenRealLogin}
            className="group text-left p-7 sm:p-8 rounded-3xl bg-gradient-to-br from-[#1B1D2A] to-[#25283C] text-white transition-all duration-300 flex flex-col justify-between h-72 shadow-soft hover:shadow-soft-lg hover:-translate-y-1 cursor-pointer border-2 border-[#78CFA3]/40 hover:border-[#78CFA3] relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-48 h-48 bg-[#78CFA3]/10 rounded-full blur-2xl pointer-events-none" />

            <div>
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#78CFA3]/20 border border-[#78CFA3]/30 text-[#78CFA3] text-xs font-semibold uppercase tracking-wider mb-3">
                <span>📱 Real Phone Login</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Login with Phone
              </h3>
              <p className="text-xs text-[#C5C8D8] mt-2 font-normal leading-relaxed">
                Secure SMS one-time password (OTP) authentication for verified patients and authorized clinical caregivers.
              </p>
            </div>

            <div className="flex items-center space-x-2 text-xs font-bold text-[#78CFA3] uppercase tracking-wider pt-4 group-hover:translate-x-1 transition-transform">
              <span>REQUEST OTP LOGIN</span>
              <ArrowRight size={16} />
            </div>
          </button>
        </div>
      </section>
    </div>
  );
}

/* ==========================================================================
   2. PATIENT PORTAL LAYOUT & VIEWS
   ========================================================================== */

function PatientLayout({ children, currentView, setCurrentView }) {
  const [sosSent, setSosSent] = useState(false);
  const [sosLoading, setSosLoading] = useState(false);

  const handleSos = async () => {
    setSosLoading(true);
    try {
      await fetch("/api/caregiver/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient: "Asha",
          patientId: "P001",
          type: "Emergency SOS",
          message: "Emergency SOS pressed by Asha in Patient Portal.",
          priority: "EMERGENCY",
        }),
      });
      setSosSent(true);
      setTimeout(() => setSosSent(false), 6000);
    } catch (err) {
      console.warn("Failed to dispatch SOS alert:", err);
      setSosSent(true);
    } finally {
      setSosLoading(false);
    }
  };

  const navItems = [
    { label: "Today's Care", view: "patient-dashboard", icon: Home },
    { label: "Location Sharing", view: "patient-location", icon: MapPin },
    { label: "Activities", view: "patient-activities", icon: Brain },
    { label: "My Memories", view: "patient-family", icon: Heart },
    { label: "My Mood", view: "patient-mood", icon: Smile },
    { label: "My Day", view: "patient-reminders", icon: Calendar },
    { label: "Who Is At My Door?", view: "patient-door", icon: UserCheck },
    { label: "Progress", view: "patient-progress", icon: BarChart3 },
    { label: "Talk to Anvesha", view: "patient-smriti", icon: Bot },
  ];

  return (
    <div className="flex min-h-[calc(100vh-73px)]">
      {/* Reassuring SOS Banner */}
      {sosSent && (
        <div className="fixed top-20 right-6 z-50 bg-[#E98B9B] text-white px-5 py-3 rounded-2xl shadow-soft-lg flex items-center space-x-3 animate-in fade-in slide-in-from-top-2">
          <ShieldAlert size={20} className="animate-pulse text-white" />
          <div>
            <p className="font-bold text-sm">Emergency Alert Sent!</p>
            <p className="text-xs text-white/90">
              Dr. Sarah Jenkins and family emergency contacts have been notified.
            </p>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-[#1B1D2A] border-r border-[#EAEBF4] dark:border-[#2B2E42] p-6 flex flex-col justify-between">
        <div className="space-y-6">
          <div>
            <h2 className="font-bold text-[#202238] dark:text-white text-lg">Patient Portal</h2>
            <p className="text-xs text-[#6B6E85] dark:text-[#9A9DB5]">Safe Mode Active • Asha (Room 402)</p>
          </div>
          <nav className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.view;
              return (
                <button
                  key={item.label}
                  onClick={() => setCurrentView(item.view)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl text-sm font-semibold transition ${
                    isActive
                      ? "bg-[#6366D8] text-white shadow-soft"
                      : "text-[#6B6E85] dark:text-[#9A9DB5] hover:bg-[#F7F7FC] dark:hover:bg-[#25283C]"
                  }`}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="space-y-3">
          {/* Dedicated High-Visibility SOS */}
          <button
            onClick={handleSos}
            disabled={sosLoading}
            className="w-full flex items-center justify-center space-x-2 py-3.5 rounded-2xl border-2 border-[#E98B9B] bg-[#E98B9B]/10 text-[#C7485E] dark:text-[#E98B9B] font-bold hover:bg-[#E98B9B]/20 active:scale-95 transition shadow-xs cursor-pointer"
          >
            <AlertTriangle size={20} className="text-[#C7485E] dark:text-[#E98B9B]" />
            <span>{sosLoading ? "SENDING SOS..." : "EMERGENCY SOS"}</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <section className="flex-1 p-8 max-w-5xl mx-auto overflow-y-auto">
        {children}
      </section>
    </div>
  );
}

/* ==========================================================================
   3. CAREGIVER DASHBOARD LAYOUT & VIEWS
   ========================================================================== */

function CaregiverLayout({ children, currentView, setCurrentView, caregiver, patientSync }) {
  const menuItems = [
    { label: "Overview", view: "caregiver-overview", icon: Home },
    { label: "Patients", view: "caregiver-patients", icon: UserCheck },
    { label: "Location", view: "caregiver-location", icon: MapPin },
    { label: "Analytics", view: "caregiver-analytics", icon: Activity },
    { label: "Rhythm", view: "caregiver-rhythm", icon: Brain },
    { label: "Vault", view: "caregiver-vault", icon: Calendar },
    { label: "Alerts", view: "caregiver-alerts", icon: Bell },
    { label: "Reminders", view: "caregiver-reminders", icon: Bell },
    { label: "Safety", view: "caregiver-safety", icon: ShieldAlert },
    { label: "Family & Social", view: "caregiver-family", icon: Heart },
  ];

  return (
    <div className="flex min-h-[calc(100vh-73px)]">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-[#1B1D2A] border-r border-[#EAEBF4] dark:border-[#2B2E42] p-6 flex flex-col justify-between">
        <div className="space-y-5">
          <div>
            <h2 className="font-bold text-[#202238] dark:text-white text-lg">
              Caregiver Dashboard
            </h2>
            <p className="text-xs text-[#6B6E85] dark:text-[#9A9DB5]">Active Monitoring</p>
          </div>

          {/* Persistent Patient Sync Indicator */}
          {patientSync && (
            <div className="rounded-2xl border border-[#EAEBF4] dark:border-[#2B2E42] bg-[#F7F7FC] dark:bg-[#11121C] p-3 shadow-xs">
              <div className="flex items-center justify-between text-[11px] font-semibold text-[#6B6E85] dark:text-[#9A9DB5]">
                <span>Patient Telemetry</span>
                <span
                  className={`h-2 w-2 rounded-full ${
                    patientSync.state === "synced"
                      ? "bg-[#78CFA3] animate-pulse"
                      : patientSync.state === "pending"
                      ? "bg-[#F3B562]"
                      : "bg-slate-400"
                  }`}
                />
              </div>
              <p className="mt-1 text-xs font-bold text-[#202238] dark:text-white">
                Asha: {patientSync.label}
              </p>
              <p className="mt-0.5 text-[10px] text-[#6B6E85] dark:text-[#9A9DB5]">
                {patientSync.state === "synced"
                  ? "Real-time bi-directional sync"
                  : patientSync.state === "pending"
                  ? `${patientSync.pendingCount || 1} pending upload items`
                  : patientSync.lastSyncedAt
                  ? `Last sync: ${new Date(patientSync.lastSyncedAt).toLocaleTimeString([], {
                      hour: "numeric",
                      minute: "2-digit",
                    })}`
                  : "Showing cached records"}
              </p>
            </div>
          )}

          <nav className="space-y-1.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.view;
              return (
                <button
                  key={item.label}
                  onClick={() => setCurrentView(item.view)}
                  className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-sm font-medium transition ${
                    isActive
                      ? "bg-[#E8E8FA] dark:bg-[#25283C] text-[#6366D8] dark:text-[#8B8FE8] font-bold border-r-4 border-[#6366D8]"
                      : "text-[#6B6E85] dark:text-[#9A9DB5] hover:bg-[#F7F7FC] dark:hover:bg-[#25283C]"
                  }`}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center space-x-3 pt-4 border-t border-[#EAEBF4] dark:border-[#2B2E42] text-xs">
          <div className="w-9 h-9 rounded-full bg-[#6366D8] text-white flex items-center justify-center font-bold">
            SJ
          </div>
          <div>
            <p className="font-bold text-[#202238] dark:text-white">
              {caregiver?.name || "Sarah Jenkins"}
            </p>
            <p className="text-[#6B6E85] dark:text-[#9A9DB5]">Clinical Lead</p>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <section className="flex-1 p-8 max-w-6xl mx-auto overflow-y-auto">
        {children}
      </section>
    </div>
  );
}

function CaregiverOverviewView({ setCurrentView }) {
  const [patients, setPatients] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/caregiver/patients").then((r) => (r.ok ? r.json() : [])),
      fetch("/api/caregiver/analytics").then((r) => (r.ok ? r.json() : null)),
      fetch("/api/caregiver/alerts").then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([patientsData, analyticsData, alertsData]) => {
        setPatients(patientsData || []);
        setAnalytics(analyticsData);
        setAlerts(alertsData || []);
        setLoading(false);
      })
      .catch((err) => {
        console.warn("Failed to load overview data:", err);
        setLoading(false);
      });
  }, []);

  const pendingAlertsCount = alerts.filter((a) => a.status === "Pending").length;

  return (
    <div className="space-y-8 animate-in fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#202238] dark:text-white">Caregiver Overview</h1>
          <p className="text-xs text-[#6B6E85] dark:text-[#9A9DB5]">
            Real-time Patient Monitoring &amp; Clinical Analytics
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setCurrentView("caregiver-patients")}
            className="bg-[#6366D8] hover:bg-[#5255C5] text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition shadow-soft cursor-pointer"
          >
            <span>View All Patients</span>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#1B1D2A] p-5 rounded-2xl border border-[#EAEBF4] dark:border-[#2B2E42] shadow-soft">
          <div className="flex justify-between items-center text-xs mb-2 text-[#6B6E85] dark:text-[#9A9DB5]">
            <span>Monitored Patients</span>
            <span className="text-[#2E7D56] dark:text-[#78CFA3] bg-[#78CFA3]/15 px-1.5 py-0.5 rounded font-bold">
              Active
            </span>
          </div>
          <p className="text-2xl font-bold text-[#202238] dark:text-white">{patients.length || 4}</p>
        </div>
        <div className="bg-white dark:bg-[#1B1D2A] p-5 rounded-2xl border border-[#EAEBF4] dark:border-[#2B2E42] shadow-soft">
          <div className="flex justify-between items-center text-xs mb-2 text-[#6B6E85] dark:text-[#9A9DB5]">
            <span>Completed Sessions</span>
            <span className="text-[#6366D8] dark:text-[#8B8FE8] bg-[#E8E8FA] dark:bg-[#25283C] px-1.5 py-0.5 rounded font-bold">
              Live
            </span>
          </div>
          <p className="text-2xl font-bold text-[#202238] dark:text-white">
            {analytics?.totalSessions ?? 14}
          </p>
        </div>
        <div className="bg-white dark:bg-[#1B1D2A] p-5 rounded-2xl border border-[#EAEBF4] dark:border-[#2B2E42] shadow-soft">
          <div className="flex justify-between items-center text-xs mb-2 text-[#6B6E85] dark:text-[#9A9DB5]">
            <span>Cognitive Index (Asha)</span>
            <span className="text-[#6366D8] dark:text-[#8B8FE8] font-bold">
              {analytics?.averageScore ? `${analytics.averageScore}%` : "82%"}
            </span>
          </div>
          <p className="text-2xl font-bold text-[#6366D8] dark:text-[#8B8FE8]">
            {analytics?.averageScore ? `${analytics.averageScore}%` : "82%"}
          </p>
        </div>
        <div
          className={`p-5 rounded-2xl border transition shadow-soft ${
            pendingAlertsCount > 0
              ? "border-[#E98B9B]/40 bg-[#E98B9B]/10"
              : "bg-white dark:bg-[#1B1D2A] border-[#EAEBF4] dark:border-[#2B2E42]"
          }`}
        >
          <div className="flex justify-between items-center text-xs mb-2">
            <span
              className={
                pendingAlertsCount > 0
                  ? "text-[#C7485E] dark:text-[#E98B9B] font-bold"
                  : "text-[#6B6E85] dark:text-[#9A9DB5]"
              }
            >
              Pending Alerts
            </span>
            <span
              className={`px-1.5 py-0.5 rounded font-bold ${
                pendingAlertsCount > 0
                  ? "bg-[#E98B9B]/25 text-[#C7485E] dark:text-[#E98B9B] animate-pulse"
                  : "bg-[#EAEBF4] dark:bg-[#25283C] text-[#6B6E85] dark:text-[#9A9DB5]"
              }`}
            >
              {pendingAlertsCount > 0 ? "Action Req." : "Normal"}
            </span>
          </div>
          <p
            className={`text-2xl font-bold ${
              pendingAlertsCount > 0 ? "text-[#C7485E] dark:text-[#E98B9B]" : "text-[#202238] dark:text-white"
            }`}
          >
            {pendingAlertsCount}
          </p>
        </div>
      </div>

      {/* Patient Table */}
      <div className="bg-white dark:bg-[#1B1D2A] rounded-3xl border border-[#EAEBF4] dark:border-[#2B2E42] overflow-hidden shadow-soft">
        <div className="p-5 border-b border-[#EAEBF4] dark:border-[#2B2E42] flex justify-between items-center">
          <div>
            <h3 className="font-bold text-[#202238] dark:text-white text-sm">
              Patient Roster &amp; Real-Time Status
            </h3>
            <p className="text-xs text-[#6B6E85] dark:text-[#9A9DB5] mt-0.5">
              Click any patient to inspect cognitive history, routine, and notes.
            </p>
          </div>
          <span className="text-xs text-[#6366D8] dark:text-[#8B8FE8] font-semibold bg-[#E8E8FA] dark:bg-[#25283C] px-3 py-1 rounded-full">
            Persistent Telemetry Active
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F7F7FC] dark:bg-[#151724] text-[#6B6E85] dark:text-[#9A9DB5] font-semibold border-b border-[#EAEBF4] dark:border-[#2B2E42]">
              <tr>
                <th className="p-4">PATIENT</th>
                <th>STATUS</th>
                <th>SYNC</th>
                <th>MEMORY</th>
                <th>ATTENTION</th>
                <th>RECENT ACTIVITY</th>
                <th>ALERTS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAEBF4] dark:divide-[#2B2E42]">
              {patients.map((p) => {
                const isUrgent = p.safetyStatus === "Triggered" || p.status === "Urgent";
                return (
                  <tr
                    key={p.id}
                    onClick={() => setCurrentView("caregiver-patients")}
                    className="hover:bg-[#E8E8FA]/30 dark:hover:bg-[#25283C]/40 cursor-pointer transition"
                  >
                    <td className="p-4 font-bold text-[#202238] dark:text-white">
                      <div className="flex items-center space-x-2">
                        <span className="text-base">{p.id === "P001" ? "👵" : "👤"}</span>
                        <div>
                          <span>{p.name}</span>
                          <span className="text-[#6B6E85] dark:text-[#9A9DB5] font-normal ml-1">
                            ({p.age} yrs • Rm {p.room})
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          isUrgent
                            ? "bg-[#E98B9B]/20 text-[#C7485E] dark:text-[#E98B9B] animate-pulse"
                            : p.status === "Stable"
                            ? "bg-[#78CFA3]/20 text-[#2E7D56] dark:text-[#78CFA3]"
                            : "bg-[#F3B562]/20 text-[#9C6119] dark:text-[#F3B562]"
                        }`}
                      >
                        {isUrgent ? "EMERGENCY" : p.status || "Stable"}
                      </span>
                    </td>
                    <td>
                      {p.syncStatus ? (
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            p.syncStatus.state === "synced"
                              ? "bg-[#78CFA3]/15 text-[#2E7D56] dark:text-[#78CFA3]"
                              : p.syncStatus.state === "pending"
                              ? "bg-[#F3B562]/15 text-[#9C6119] dark:text-[#F3B562]"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              p.syncStatus.state === "synced"
                                ? "bg-[#78CFA3]"
                                : p.syncStatus.state === "pending"
                                ? "bg-[#F3B562]"
                                : "bg-slate-400"
                            }`}
                          />
                          {p.syncStatus.label}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="font-semibold text-[#202238] dark:text-white tabular-nums">
                      {p.memory}%
                    </td>
                    <td className="font-semibold text-[#202238] dark:text-white tabular-nums">
                      {p.attention}%
                    </td>
                    <td className="text-[#6B6E85] dark:text-[#9A9DB5]">
                      {p.recentActivity || "Memory Match"}
                    </td>
                    <td className={isUrgent ? "text-[#E98B9B] font-bold" : "text-[#6B6E85] dark:text-[#9A9DB5]"}>
                      {isUrgent ? "🚨 Active SOS" : "None"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function CaregiverPatientDetailView({ setCurrentView }) {
  return <Patients setCurrentView={setCurrentView} />;
}

function CaregiverRhythmView() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-[#6366D8] dark:text-[#8B8FE8]">
          Adaptive Cognitive Rhythm
        </h1>
        <p className="text-xs text-[#6B6E85] dark:text-[#9A9DB5] mt-1">
          Continuous AI monitoring adjusts daily activity difficulty and timing based on real-time metrics.
        </p>
      </div>

      {/* Engine Flow */}
      <div className="bg-white dark:bg-[#1B1D2A] p-6 rounded-3xl border border-[#EAEBF4] dark:border-[#2B2E42] space-y-6 shadow-soft">
        <h4 className="font-bold text-[#6B6E85] dark:text-[#9A9DB5] text-xs uppercase tracking-wider">
          Engine Workflow
        </h4>
        <div className="flex items-center justify-between text-center max-w-xl mx-auto text-xs font-semibold">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-[#F7F7FC] dark:bg-[#25283C] mx-auto flex items-center justify-center text-lg mb-1">
              📊
            </div>
            <span>Baseline</span>
          </div>
          <span className="text-[#6B6E85]">→</span>
          <div>
            <div className="w-12 h-12 rounded-2xl bg-[#F7F7FC] dark:bg-[#25283C] mx-auto flex items-center justify-center text-lg mb-1">
              🔄
            </div>
            <span>Performance</span>
          </div>
          <span className="text-[#6B6E85]">→</span>
          <div>
            <div className="w-12 h-12 rounded-2xl bg-[#6366D8] text-white mx-auto flex items-center justify-center text-lg mb-1 shadow-soft">
              ⚙️
            </div>
            <span className="text-[#6366D8] dark:text-[#8B8FE8] font-bold">AI Engine</span>
          </div>
          <span className="text-[#6B6E85]">→</span>
          <div>
            <div className="w-12 h-12 rounded-2xl bg-[#F7F7FC] dark:bg-[#25283C] mx-auto flex items-center justify-center text-lg mb-1">
              🎯
            </div>
            <span>Adaptive Task</span>
          </div>
        </div>
      </div>

      {/* Rhythm Schedule Cards */}
      <div className="bg-white dark:bg-[#1B1D2A] p-6 rounded-3xl border border-[#EAEBF4] dark:border-[#2B2E42] space-y-4 shadow-soft">
        <div className="flex justify-between items-center">
          <h4 className="font-bold text-[#202238] dark:text-white text-sm">
            Personalized Daily Plan
          </h4>
          <button className="text-xs border border-[#EAEBF4] dark:border-[#2B2E42] px-3 py-1.5 rounded-xl font-semibold text-[#6B6E85] dark:text-[#9A9DB5] hover:bg-[#F7F7FC] dark:hover:bg-[#25283C]">
            Override Plan
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-2xl border border-[#6366D8]/20 bg-[#E8E8FA]/30 dark:bg-[#25283C]/30 space-y-2">
            <span className="font-bold text-[#6366D8] dark:text-[#8B8FE8]">09:00 AM • Medium</span>
            <p className="font-semibold text-[#202238] dark:text-white">Memory Match</p>
            <p className="text-[10px] text-[#6B6E85] dark:text-[#9A9DB5]">Visual Recall</p>
          </div>
          <div className="p-4 rounded-2xl border border-[#EAEBF4] dark:border-[#2B2E42] bg-[#F7F7FC] dark:bg-[#151724] space-y-2">
            <span className="font-bold text-[#6B6E85] dark:text-[#9A9DB5]">01:00 PM • Easy</span>
            <p className="font-semibold text-[#202238] dark:text-white">Pattern Recog.</p>
            <p className="text-[10px] text-[#6B6E85] dark:text-[#9A9DB5]">Logic sequence</p>
          </div>
          <div className="p-4 rounded-2xl border border-[#EAEBF4] dark:border-[#2B2E42] bg-[#F7F7FC] dark:bg-[#151724] space-y-2">
            <span className="font-bold text-[#6B6E85] dark:text-[#9A9DB5]">06:00 PM • Easy</span>
            <p className="font-semibold text-[#202238] dark:text-white">Family Recog.</p>
            <p className="text-[10px] text-[#6B6E85] dark:text-[#9A9DB5]">Emotional connection</p>
          </div>
        </div>
      </div>
    </div>
  );
}
