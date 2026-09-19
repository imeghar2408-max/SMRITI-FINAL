import Patients from "./pages/caregiver/Patients";
import Analytics from "./pages/caregiver/Analytics";
import Rhythm from "./pages/caregiver/Rhythm";
import Vault from "./pages/caregiver/Vault";
import Reminders from "./pages/caregiver/Reminders";
import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import Alerts from "./pages/caregiver/Alerts";

export default function AuraApp() {
  // Navigation State
  // Views: 'landing', 'patient-dashboard', 'patient-activities', 'patient-game',
  //        'patient-game-result', 'patient-family',
  //        'caregiver-overview', 'caregiver-patient', 'caregiver-rhythm', 'caregiver-alerts'
  const [currentView, setCurrentView] = useState("landing");

  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [loginRole, setLoginRole] = useState("patient");

 const [loggedInCaregiver, setLoggedInCaregiver] = useState(null);

  // Interactive Memory Game State
  const initialCards = [
    { id: 1, symbol: "🐾", matched: true, flipped: true },
    { id: 2, symbol: "🌸", matched: false, flipped: true },
    { id: 3, symbol: "🧠", matched: false, flipped: false },
    { id: 4, symbol: "☀️", matched: false, flipped: false },
    { id: 5, symbol: "🐾", matched: true, flipped: true },
    { id: 6, symbol: "🌸", matched: false, flipped: false },
    { id: 7, symbol: "🧠", matched: false, flipped: false },
    { id: 8, symbol: "☀️", matched: false, flipped: false },
  ];
  const [cards, setCards] = useState(initialCards);
  const [gameComplete, setGameComplete] = useState(false);

  const handleCardClick = (index) => {
    if (cards[index].flipped || cards[index].matched) return;
    const newCards = [...cards];
    newCards[index].flipped = true;
    setCards(newCards);

    // Simple complete check trigger
    const allFlipped = newCards.filter((c) => !c.flipped).length <= 1;
    if (allFlipped) setTimeout(() => setGameComplete(true), 800);
  };

  const resetGame = () => {
    setCards(initialCards.map((c) => ({ ...c, flipped: c.matched })));
    setGameComplete(false);
  };

  return (
    <div className="min-h-screen bg-[#f8faf9] text-gray-800 font-sans antialiased">
      {/* GLOBAL NAVBAR (Visible on Landing or accessible via quick-switch) */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-gray-200/80 px-6 py-3.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center space-x-4">
          <div
            onClick={() => setCurrentView("landing")}
            className="text-2xl font-black tracking-wider text-[#0f3e3a] cursor-pointer hover:opacity-85 transition flex items-center space-x-2"
          >
            <span>ANVESHA</span>
          </div>
          <span className="text-xs bg-stone-100 text-stone-600 px-2.5 py-1 rounded-full font-medium hidden sm:inline-block">
            Cognitive Care Platform
          </span>
        </div>

        <nav className="flex items-center space-x-3 text-sm font-medium">
          {currentView.startsWith("patient") && (
            <div className="flex items-center space-x-2">
              <span className="hidden md:inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-teal-50 text-[#0f3e3a] text-xs font-bold border border-teal-200/60">
                <span>👵</span>
                <span>Patient: Asha (Rm 402)</span>
              </span>
              <button
                onClick={() => setCurrentView("caregiver-overview")}
                className="px-3.5 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold transition flex items-center space-x-1.5"
              >
                <span>Caregiver Portal →</span>
              </button>
            </div>
          )}

          {currentView.startsWith("caregiver") && currentView !== "caregiver-login" && (
            <div className="flex items-center space-x-2">
              <span className="hidden md:inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-teal-900 text-white text-xs font-bold shadow-xs">
                <span>🩺</span>
                <span>Caregiver: {loggedInCaregiver?.name || "Dr. Sarah Jenkins"}</span>
              </span>
              <button
                onClick={() => setCurrentView("patient-dashboard")}
                className="px-3.5 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-[#0f3e3a] text-xs font-semibold transition border border-teal-200/60 flex items-center space-x-1.5"
              >
                <span>Patient Portal (Asha) →</span>
              </button>
            </div>
          )}

          {currentView === "landing" && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentView("patient-dashboard")}
                className="px-4 py-2 rounded-xl bg-teal-50 text-[#0f3e3a] text-xs font-bold hover:bg-teal-100 transition border border-teal-200"
              >
                Patient Portal
              </button>
              <button
                onClick={() => setCurrentView("caregiver-overview")}
                className="px-4 py-2 rounded-xl bg-[#0f3e3a] text-white text-xs font-bold hover:bg-[#0c312e] transition shadow-xs"
              >
                Caregiver Portal
              </button>
            </div>
          )}

          <button
            onClick={() => setIsLoginOpen(true)}
            className="px-4 py-1.5 rounded-xl border border-gray-300 font-semibold text-xs text-gray-700 hover:border-[#0f3e3a] transition"
          >
            Switch Account
          </button>
        </nav>
      </header>

      {/* LOGIN MODAL */}
      {isLoginOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative">
            <button
              onClick={() => setIsLoginOpen(false)}
              className="absolute top-6 right-6 text-gray-400 hover:text-gray-700"
            >
              <X size={20} />
            </button>

            <h2 className="text-2xl font-bold text-[#0f3e3a] mb-2">
              Welcome to ANVESHA
            </h2>

            <p className="text-sm text-gray-500 mb-6">
              Select your portal to continue
            </p>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <button
                type="button"
                onClick={() => setLoginRole("patient")}
                className={`py-3 rounded-xl border text-sm font-semibold transition ${
                  loginRole === "patient"
                    ? "border-[#0f3e3a] bg-[#0f3e3a]/10 text-[#0f3e3a]"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                Patient
              </button>

              <button
                type="button"
                onClick={() => setLoginRole("caregiver")}
                className={`py-3 rounded-xl border text-sm font-semibold transition ${
                  loginRole === "caregiver"
                    ? "border-[#0f3e3a] bg-[#0f3e3a]/10 text-[#0f3e3a]"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                Caregiver
              </button>
            </div>

            {loginRole === "patient" ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Patient ID or Family PIN
                  </label>

                  <input
                    type="text"
                    placeholder="e.g., ASHA-8204"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0f3e3a]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Password
                  </label>

                  <input
                    type="password"
                    placeholder="••••••••"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0f3e3a]"
                  />
                </div>

                <button
                  onClick={() => {
                    setIsLoginOpen(false);
                    setCurrentView("patient-dashboard");
                  }}
                  className="w-full py-3.5 bg-[#0f3e3a] text-white font-semibold rounded-xl hover:bg-[#0c312e] transition shadow-md"
                >
                  Log In as Patient
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-teal-50 border border-teal-100 rounded-2xl p-4">
                  <p className="text-sm font-semibold text-[#0f3e3a]">
                    Caregiver authentication
                  </p>

                  <p className="text-xs text-gray-500 mt-1">
                    Login with your caregiver account to continue.
                  </p>
                </div>

                <button
                  type="button"
                 onClick={() => {
  setIsLoginOpen(false);
  setCurrentView("caregiver-login");
}}
                  className="w-full py-3.5 bg-[#0f3e3a] text-white font-semibold rounded-xl hover:bg-[#0c312e] transition shadow-md"
                >
                  Continue to Caregiver Login
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* DYNAMIC SCREENS */}
      {currentView === "caregiver-login" && (
  <CaregiverAuth
    onBack={() => {
      setCurrentView("landing");
    }}
    onSarahLogin={(caregiver) => {
      setLoggedInCaregiver(caregiver);
      setCurrentView("caregiver-overview");
    }}
  />
)}
      <main>
     
  {currentView === "landing" && (
    <LandingView
     onOpenPatient={() => {
  setIsLoginOpen(false);
  setCurrentView("patient-dashboard");
}}
      onOpenCaregiver={() => {
        setIsLoginOpen(false);
        setCurrentView("caregiver-login");
      }}
    />
  )}

  {currentView === "voice-test" && (
    <VoiceTest />
  )}


        {/* PATIENT INTERFACES */}
        {currentView.startsWith("patient") && (
          <PatientLayout
            currentView={currentView}
            setCurrentView={setCurrentView}
          >
            {currentView === "patient-dashboard" && (
  <PatientDashboard setCurrentView={setCurrentView} />
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
{currentView === "patient-progress" && (
  <Progress />
)}
           {currentView === "patient-family" && (
  <FamilyMemory />
)}
{currentView === "patient-reminders" && (
  <Reminder setCurrentView={setCurrentView} />
)}

{currentView === "patient-door" && (
  <WhoIsAtMyDoor />
)}
{currentView === "patient-smriti" && (
  <AnveshaChat />
)}

{currentView === "patient-pattern-match" && (
  <PatternMatch setCurrentView={setCurrentView} />
)}
{currentView === "patient-daily-routine" && (
  <DailyRoutine setCurrentView={setCurrentView} />
)}
{currentView === "patient-mood" && (
  <Mood />
)}
{currentView === "patient-game-result" && (
  <GameResult setCurrentView={setCurrentView} />
)}

          </PatientLayout>
        )}

        {/* CAREGIVER INTERFACES */}
        {currentView.startsWith("caregiver") &&
  currentView !== "caregiver-login" && (
    <CaregiverLayout
      currentView={currentView}
      setCurrentView={setCurrentView}
      caregiver={loggedInCaregiver}
    >
            {currentView === "caregiver-patients" && <Patients />}

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
   1. LANDING VIEW
   ========================================================================== */
function LandingView({ onOpenPatient, onOpenCaregiver }) {
  return (
    <div className="pb-24">

      {/* Hero Section */}
      <section className="relative h-[80vh] flex flex-col items-center justify-center text-center px-4 overflow-hidden bg-gradient-to-b from-stone-100/60 to-white">

        <div className="max-w-2xl mx-auto space-y-4 z-10">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-[#0f3e3a] tracking-tight">
            Explore. Remember. Connect. Care.
          </h1>

          <p className="text-base sm:text-lg text-gray-600 font-light">
            AI-powered cognitive assistance for elderly care and memory support.
          </p>
        </div>

        <div className="absolute bottom-10 flex flex-col items-center text-xs text-gray-400 tracking-widest uppercase gap-2">
          <span>Scroll to explore</span>
          <span className="animate-bounce">↓</span>
        </div>
      </section>

      {/* About Section */}
      <section className="max-w-5xl mx-auto px-6 py-12 space-y-12">

        <div>
          <h2 className="text-xl font-bold text-[#0f3e3a] mb-2">
            About ANVESHA
          </h2>

          <p className="text-sm text-gray-600 max-w-xl">
            A sanctuary of support, engineered with empathetic professionalism.
            We bridge the gap between clinical precision and accessible warmth.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">

          {/* AI */}
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
            <div className="space-y-4">

              <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-[#0f3e3a]">
                <Brain size={20} />
              </div>

              <h3 className="font-bold text-lg text-gray-900">
                AI Personalization
              </h3>

              <p className="text-xs text-gray-500 leading-relaxed">
                Adaptive algorithms learn daily routines and cognitive patterns,
                tailoring gentle interventions that feel natural, never
                intrusive. The system evolves with the patient.
              </p>

            </div>
          </div>

          {/* NER */}
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
            <div className="space-y-4">

              <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-[#0f3e3a]">
                <UserCheck size={20} />
              </div>

              <h3 className="font-bold text-lg text-gray-900">
                NER Accessibility
              </h3>

              <p className="text-xs text-gray-500 leading-relaxed">
                Built on a Fixed Grid model to reduce cognitive load:
                high-contrast interfaces, massive touch targets, and tonal
                layering ensure predictable navigation for visual and motor
                impairments.
              </p>

            </div>
          </div>

        </div>

        {/* How it works */}
        <div className="bg-[#0f3e3a] text-white p-8 md:p-12 rounded-3xl space-y-8">

          <div className="flex items-center space-x-2 text-teal-200 text-sm font-semibold">
            <Activity size={18} />
            <span>How it Works</span>
          </div>

          <p className="text-base md:text-lg text-teal-50 max-w-2xl font-light">
            ANVESHA seamlessly connects an intuitive patient terminal with a
            powerful, data-rich caregiver dashboard. Continuous monitoring
            translates into actionable insights, ensuring safety without
            sacrificing dignity.
          </p>

          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-teal-800/60 text-xs">

            <div>
              <p className="font-bold">Observe</p>
              <p className="text-teal-200/70">
                Ambient data collection
              </p>
            </div>

            <div>
              <p className="font-bold">Analyze</p>
              <p className="text-teal-200/70">
                Pattern recognition
              </p>
            </div>

            <div>
              <p className="font-bold">Support</p>
              <p className="text-teal-200/70">
                Timely, gentle cues
              </p>
            </div>

          </div>
        </div>

        {/* Entry Portals */}
        <div className="grid md:grid-cols-2 gap-6 pt-4">

          {/* PATIENT */}
          <button
            type="button"
            onClick={onOpenPatient}
            className="group text-left p-8 rounded-3xl bg-[#0f3e3a] text-white hover:bg-[#124b46] transition flex flex-col justify-between h-48 shadow-lg"
          >
            <h4 className="text-xl font-semibold">
              Continue as Patient
            </h4>

            <div className="flex items-center space-x-2 text-xs text-teal-200 font-medium">
              <span>ENTER PORTAL</span>
              <ArrowRight size={14} />
            </div>
          </button>

          {/* CAREGIVER */}
          <button
            type="button"
            onClick={onOpenCaregiver}
            className="group text-left p-8 rounded-3xl bg-gray-200/70 text-gray-900 hover:bg-gray-300/70 transition flex flex-col justify-between h-48"
          >
            <h4 className="text-xl font-semibold">
              Continue as Caregiver
            </h4>

            <div className="flex items-center space-x-2 text-xs text-gray-600 font-medium">
              <span>ACCESS LOGIN</span>
              <ArrowRight size={14} />
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
    { label: "Home", view: "patient-dashboard", icon: Home },
    { label: "Activities", view: "patient-activities", icon: Brain },
    { label: "My Memories", view: "patient-family", icon: Heart },
    { label: "My Mood", view: "patient-mood", icon: Heart },
    { label: "My Day", view: "patient-reminders", icon: Calendar },
    { label: "Who Is At My Door?", view: "patient-door", icon: UserCheck },
    { label: "Progress", view: "patient-progress", icon: BarChart3 },
    { label: "Talk to Anvesha", view: "patient-smriti", icon: Bot },
  ];
  return (
    <div className="flex min-h-[calc(100vh-73px)]">
      {/* Reassuring SOS Banner */}
      {sosSent && (
        <div className="fixed top-20 right-6 z-50 bg-red-600 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center space-x-3 animate-in fade-in slide-in-from-top-2">
          <ShieldAlert size={20} className="animate-pulse text-white" />
          <div>
            <p className="font-bold text-sm">Emergency Alert Sent!</p>
            <p className="text-xs text-red-100">Dr. Sarah Jenkins and family emergency contacts have been notified.</p>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <aside className="w-64 bg-stone-100/70 border-r border-gray-200/70 p-6 flex flex-col justify-between">
        <div className="space-y-6">
          <div>
            <h2 className="font-bold text-gray-900 text-lg">Patient Portal</h2>
            <p className="text-xs text-gray-500">Safe Mode Active • Asha (Room 402)</p>
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
                      ? "bg-[#0f3e3a] text-white shadow-sm"
                      : "text-gray-600 hover:bg-gray-200/50"
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
            className="w-full flex items-center justify-center space-x-2 py-3.5 rounded-2xl border-2 border-red-400 bg-red-50 text-red-700 font-bold hover:bg-red-100 active:scale-95 transition shadow-sm"
          >
            <AlertTriangle size={20} className="text-red-600" />
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
function PatientGameView({
  cards,
  handleCardClick,
  resetGame,
  gameComplete,
  setCurrentView,
}) {
  if (gameComplete) {
    return (
      <div className="max-w-xl mx-auto text-center space-y-8 py-10 animate-in zoom-in-95">
        <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 text-[#0f3e3a] flex items-center justify-center text-3xl font-bold">
          ★
        </div>
        <div>
          <h2 className="text-3xl font-extrabold text-[#0f3e3a]">
            Great job, Asha!
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Memory Match Game Complete
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-gray-100 text-center">
            <p className="text-xs text-gray-400 font-bold">Score</p>
            <p className="text-xl font-bold text-gray-800 mt-1">8/10</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-gray-100 text-center">
            <p className="text-xs text-gray-400 font-bold">Accuracy</p>
            <p className="text-xl font-bold text-[#0f3e3a] mt-1">80%</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-gray-100 text-center">
            <p className="text-xs text-gray-400 font-bold">Reaction Time</p>
            <p className="text-xl font-bold text-gray-800 mt-1">2.4s</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-teal-100 text-left space-y-4 shadow-sm">
          <span className="text-[10px] bg-teal-50 text-teal-800 px-2 py-1 rounded font-bold uppercase">
            AI Adaptive Path
          </span>
          <p className="text-sm font-semibold text-gray-800">
            Based on your recent performance, your next activity has been
            adjusted.
          </p>
          <div className="bg-stone-50 p-3 rounded-xl border border-gray-100 text-xs">
            <p className="font-bold text-gray-700">
              Recommended: Pattern Recognition
            </p>
            <p className="text-gray-400">Medium Difficulty</p>
          </div>
          <button
            onClick={() => setCurrentView("patient-activities")}
            className="w-full py-3 bg-[#0f3e3a] text-white font-bold rounded-xl flex items-center justify-center space-x-2"
          >
            <span>START NEXT ACTIVITY</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#0f3e3a]">
            Daily Memory Exercise
          </h2>
          <p className="text-xs text-gray-400">
            Focus: Short-term recall & pattern recognition
          </p>
        </div>
        <div className="flex space-x-6 text-right">
          <div>
            <p className="text-[10px] text-gray-400 font-bold uppercase">
              Score
            </p>
            <p className="text-lg font-bold">1250</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-bold uppercase">
              Accuracy
            </p>
            <p className="text-lg font-bold text-[#0f3e3a]">85%</p>
          </div>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-4 gap-4 max-w-2xl mx-auto py-4">
        {cards.map((card, idx) => (
          <div
            key={card.id}
            onClick={() => handleCardClick(idx)}
            className={`h-28 rounded-2xl flex items-center justify-center text-3xl cursor-pointer border-2 transition-all ${
              card.flipped
                ? "bg-white border-[#0f3e3a] shadow-md"
                : "bg-stone-200/60 border-transparent hover:bg-stone-300/60"
            }`}
          >
            {card.flipped ? card.symbol : "⚙️"}
          </div>
        ))}
      </div>

      <p className="text-center text-xs text-gray-500">
        Find the matching pair for the card.
      </p>

      <div className="flex items-center justify-center space-x-4">
        <button className="flex items-center space-x-2 px-6 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold hover:bg-gray-100">
          <Lightbulb size={16} />
          <span>Hint</span>
        </button>
        <button
          onClick={resetGame}
          className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-[#0f3e3a] text-white text-xs font-semibold hover:bg-[#0c312e]"
        >
          <RotateCcw size={16} />
          <span>Reset Board</span>
        </button>
      </div>
    </div>
  );
}

function PatientFamilyMemoriesView() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-[#0f3e3a]">Family Memories</h1>
        <p className="text-sm text-gray-500 mt-1">
          Let's look at some familiar faces today.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Family Cards */}
        <div className="lg:col-span-2 grid sm:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-3xl border border-gray-200 space-y-3">
            <div className="h-44 bg-amber-100 rounded-2xl flex items-center justify-center text-4xl">
              👩‍🦰
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-gray-900">Priya</h4>
                <p className="text-xs text-gray-400">Daughter</p>
              </div>
              <button className="w-8 h-8 rounded-full bg-[#0f3e3a] text-white flex items-center justify-center">
                <Volume2 size={14} />
              </button>
            </div>
          </div>

          <div className="bg-white p-4 rounded-3xl border border-gray-200 space-y-3">
            <div className="h-44 bg-sky-100 rounded-2xl flex items-center justify-center text-4xl">
              👦
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-gray-900">Rahul</h4>
                <p className="text-xs text-gray-400">Grandson</p>
              </div>
              <button className="w-8 h-8 rounded-full bg-[#0f3e3a] text-white flex items-center justify-center">
                <Volume2 size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Prompt Card */}
        <div className="bg-white p-6 rounded-3xl border border-gray-200 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-800">Who is this?</h3>
            <button className="flex items-center space-x-1 text-xs bg-gray-100 px-3 py-1 rounded-full font-medium">
              <Play size={10} /> <span>Play Audio</span>
            </button>
          </div>

          <div className="h-28 bg-stone-100 rounded-2xl flex items-center justify-center text-3xl">
            👴
          </div>

          <div className="space-y-2">
            {["Priya (Daughter)", "Rahul (Grandson)", "Anil (Husband)"].map(
              (name, i) => (
                <label
                  key={i}
                  className="flex items-center space-x-3 p-3 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50 text-xs font-semibold"
                >
                  <input
                    type="radio"
                    name="family"
                    className="text-[#0f3e3a] focus:ring-0"
                  />
                  <span>{name}</span>
                </label>
              ),
            )}
          </div>

          <button className="w-full py-3 bg-[#0f3e3a] text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-2">
            <Mic size={14} />
            <span>Answer by Voice</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
   3. CAREGIVER DASHBOARD LAYOUT & VIEWS
   ========================================================================== */
function CaregiverLayout({ children, currentView, setCurrentView, caregiver }) {
  const menuItems = [
    { label: "Overview", view: "caregiver-overview", icon: Home },
    { label: "Patients", view: "caregiver-patients", icon: UserCheck },
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
      <aside className="w-64 bg-stone-50 border-r border-gray-200 p-6 flex flex-col justify-between">
        <div className="space-y-6">
          <div>
            <h2 className="font-bold text-gray-900 text-lg">
              Caregiver Dashboard
            </h2>
            <p className="text-xs text-gray-400">Active Monitoring</p>
          </div>

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
                      ? "bg-teal-50 text-[#0f3e3a] font-bold border-r-4 border-[#0f3e3a]"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center space-x-3 pt-4 border-t border-gray-200 text-xs">
          <div className="w-9 h-9 rounded-full bg-teal-900 text-white flex items-center justify-center font-bold">
            SJ
          </div>
          <div>
            <p className="font-bold text-gray-800">
              {caregiver?.name || "Sarah Jenkins"}
            </p>
            <p className="text-gray-400">Settings</p>
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
          <h1 className="text-2xl font-black text-gray-900">Caregiver Overview</h1>
          <p className="text-xs text-gray-400">Real-time Patient Monitoring & Clinical Analytics</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setCurrentView("caregiver-patients")}
            className="bg-[#0f3e3a] text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1 hover:bg-[#0c312e] transition"
          >
            <span>View All Patients</span>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center text-gray-500 text-xs mb-2">
            <span>Monitored Patients</span>
            <span className="text-green-600 bg-green-50 px-1.5 py-0.5 rounded font-bold">
              Active
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{patients.length || 4}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center text-gray-500 text-xs mb-2">
            <span>Completed Sessions</span>
            <span className="text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded font-bold">
              Live
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {analytics?.totalSessions ?? 14}
          </p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center text-gray-500 text-xs mb-2">
            <span>Cognitive Index (Asha)</span>
            <span className="text-teal-700 font-bold">
              {analytics?.averageScore ? `${analytics.averageScore}%` : "82%"}
            </span>
          </div>
          <p className="text-2xl font-bold text-[#0f3e3a]">
            {analytics?.averageScore ? `${analytics.averageScore}%` : "82%"}
          </p>
        </div>
        <div className={`p-5 rounded-2xl border transition shadow-sm ${pendingAlertsCount > 0 ? "border-red-300 bg-red-50/70" : "bg-white border-gray-100"}`}>
          <div className="flex justify-between items-center text-xs mb-2">
            <span className={pendingAlertsCount > 0 ? "text-red-700 font-bold" : "text-gray-500"}>Pending Alerts</span>
            <span className={`px-1.5 py-0.5 rounded font-bold ${pendingAlertsCount > 0 ? "bg-red-200 text-red-800 animate-pulse" : "bg-gray-100 text-gray-600"}`}>
              {pendingAlertsCount > 0 ? "Action Req." : "Normal"}
            </span>
          </div>
          <p className={`text-2xl font-bold ${pendingAlertsCount > 0 ? "text-red-600" : "text-gray-900"}`}>
            {pendingAlertsCount}
          </p>
        </div>
      </div>

      {/* Patient Table */}
      <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="p-5 border-b border-gray-100 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-gray-800 text-sm">
              Patient Roster & Real-Time Status
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">Click any patient to inspect cognitive history, routine, and notes.</p>
          </div>
          <span className="text-xs text-teal-800 font-semibold bg-teal-50 px-3 py-1 rounded-full">
            File-Backed Persistent Database
          </span>
        </div>
        <table className="w-full text-left text-xs">
          <thead className="bg-gray-50 text-gray-400 font-semibold border-b">
            <tr>
              <th className="p-4">PATIENT</th>
              <th>STATUS</th>
              <th>MEMORY</th>
              <th>ATTENTION</th>
              <th>RECENT ACTIVITY</th>
              <th>ALERTS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {patients.map((p) => {
              const isUrgent = p.safetyStatus === "Triggered" || p.status === "Urgent";
              return (
                <tr
                  key={p.id}
                  onClick={() => setCurrentView("caregiver-patients")}
                  className="hover:bg-teal-50/40 cursor-pointer transition"
                >
                  <td className="p-4 font-bold text-gray-900">
                    <div className="flex items-center space-x-2">
                      <span className="text-base">{p.id === "P001" ? "👵" : "👤"}</span>
                      <div>
                        <span>{p.name}</span>
                        <span className="text-gray-400 font-normal ml-1">
                          ({p.age} yrs • Rm {p.room})
                        </span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        isUrgent
                          ? "bg-red-100 text-red-800 animate-pulse"
                          : p.status === "Stable"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {isUrgent ? "EMERGENCY" : p.status || "Stable"}
                    </span>
                  </td>
                  <td className="font-semibold text-gray-800">{p.memory}%</td>
                  <td className="font-semibold text-gray-800">{p.attention}%</td>
                  <td className="text-gray-600">{p.recentActivity || "Memory Match"}</td>
                  <td className={isUrgent ? "text-red-600 font-bold" : "text-gray-400"}>
                    {isUrgent ? "🚨 Active SOS" : "None"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
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
        <h1 className="text-2xl font-black text-[#0f3e3a]">
          Adaptive Cognitive Rhythm
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          Continuous AI monitoring adjusts daily activity difficulty and timing
          based on real-time metrics.
        </p>
      </div>

      {/* Engine Flow */}
      <div className="bg-white p-6 rounded-3xl border border-gray-200 space-y-6">
        <h4 className="font-bold text-gray-800 text-xs uppercase tracking-wider">
          Engine Workflow
        </h4>
        <div className="flex items-center justify-between text-center max-w-xl mx-auto text-xs font-semibold">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-gray-100 mx-auto flex items-center justify-center text-gray-700 mb-1">
              📊
            </div>
            <span>Baseline</span>
          </div>
          <span>→</span>
          <div>
            <div className="w-12 h-12 rounded-2xl bg-gray-100 mx-auto flex items-center justify-center text-gray-700 mb-1">
              🔄
            </div>
            <span>Performance</span>
          </div>
          <span>→</span>
          <div>
            <div className="w-12 h-12 rounded-2xl bg-[#0f3e3a] text-white mx-auto flex items-center justify-center text-lg mb-1 shadow-md">
              ⚙️
            </div>
            <span className="text-[#0f3e3a] font-bold">AI Engine</span>
          </div>
          <span>→</span>
          <div>
            <div className="w-12 h-12 rounded-2xl bg-gray-100 mx-auto flex items-center justify-center text-gray-700 mb-1">
              🎯
            </div>
            <span>Adaptive Task</span>
          </div>
        </div>
      </div>

      {/* Rhythm Schedule Cards */}
      <div className="bg-white p-6 rounded-3xl border border-gray-200 space-y-4">
        <div className="flex justify-between items-center">
          <h4 className="font-bold text-gray-800 text-sm">
            Personalized Daily Plan
          </h4>
          <button className="text-xs border px-3 py-1.5 rounded-xl font-semibold text-gray-600 hover:bg-gray-50">
            Override Plan
          </button>
        </div>
        <div className="grid grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-2xl border border-teal-100 bg-teal-50/20 space-y-2">
            <span className="font-bold text-[#0f3e3a]">09:00 AM • Medium</span>
            <p className="font-semibold text-gray-800">Memory Match</p>
            <p className="text-[10px] text-gray-500">Visual Recall</p>
          </div>
          <div className="p-4 rounded-2xl border border-gray-100 bg-stone-50 space-y-2">
            <span className="font-bold text-gray-600">01:00 PM • Easy</span>
            <p className="font-semibold text-gray-800">Pattern Recog.</p>
            <p className="text-[10px] text-gray-500">Logic sequence</p>
          </div>
          <div className="p-4 rounded-2xl border border-gray-100 bg-stone-50 space-y-2">
            <span className="font-bold text-gray-600">06:00 PM • Easy</span>
            <p className="font-semibold text-gray-800">Family Recog.</p>
            <p className="text-[10px] text-gray-500">Emotional connection</p>
          </div>
        </div>
      </div>
    </div>
  );
}
