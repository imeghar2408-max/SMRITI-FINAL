import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Brain,
  Calendar,
  CheckCircle2,
  Clock,
  HelpCircle,
  Play,
  RotateCcw,
  Sparkles,
  Trophy,
  Volume2,
  XCircle,
} from "lucide-react";

// ============================================================
// FAMILIAR DAILY ROUTINES (Comfortable sequencing for seniors)
// ============================================================
const DAILY_ROUTINES = [
  {
    id: "morning",
    title: "Morning Routine",
    description: "Arrange the steps from waking up to starting your day.",
    steps: [
      { id: "m1", order: 1, label: "Wake up & stretch in bed", icon: "🌅" },
      { id: "m2", order: 2, label: "Wash face & brush teeth", icon: "🪥" },
      { id: "m3", order: 3, label: "Enjoy a warm breakfast", icon: "🥣" },
      { id: "m4", order: 4, label: "Take morning medicine with water", icon: "💊" },
    ],
  },
  {
    id: "teatime",
    title: "Making Afternoon Chai",
    description: "Put the steps of making a warm cup of tea in order.",
    steps: [
      { id: "t1", order: 1, label: "Pour fresh water into kettle", icon: "💧" },
      { id: "t2", order: 2, label: "Heat the water until it boils", icon: "🔥" },
      { id: "t3", order: 3, label: "Add tea leaves and spices", icon: "🍃" },
      { id: "t4", order: 4, label: "Pour into cup & enjoy warm", icon: "☕" },
    ],
  },
  {
    id: "evening",
    title: "Evening Wind-Down",
    description: "Arrange the peaceful steps before going to sleep.",
    steps: [
      { id: "e1", order: 1, label: "Eat a light comforting dinner", icon: "🍲" },
      { id: "e2", order: 2, label: "Read a book or hear soothing music", icon: "📖" },
      { id: "e3", order: 3, label: "Wash hands and brush teeth", icon: "🪥" },
      { id: "e4", order: 4, label: "Tuck into bed for restful sleep", icon: "🛏️" },
    ],
  },
];

function shuffleArray(array) {
  return [...array].sort(() => Math.random() - 0.5);
}

function speakInstruction(text) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-IN";
  utterance.rate = 0.85;
  utterance.pitch = 1;
  window.speechSynthesis.speak(utterance);
}

export default function DailyRoutine({ setCurrentView }) {
  const [gameState, setGameState] = useState("start"); // 'start' | 'playing' | 'completed'
  const [selectedRoutineIdx, setSelectedRoutineIdx] = useState(0);

  // Placed steps array (length up to 4)
  const [placedSteps, setPlacedSteps] = useState([]);
  // Unplaced steps pool
  const [unplacedSteps, setUnplacedSteps] = useState([]);

  const [attempts, setAttempts] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [feedback, setFeedback] = useState("Tap cards below to place them in order from first to last.");
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState("idle"); // 'idle' | 'saving' | 'saved' | 'offline'
  const [isCheckingOrder, setIsCheckingOrder] = useState(false);

  const routine = DAILY_ROUTINES[selectedRoutineIdx];
  const totalSteps = routine.steps.length;

  // Live timer
  useEffect(() => {
    if (gameState !== "playing") return;
    const timer = setInterval(() => {
      setElapsedTime((t) => t + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [gameState]);

  // Scoring
  const accuracy = useMemo(() => {
    if (attempts === 0) return 100;
    const scoreVal = 100 - mistakes * 15;
    return Math.min(100, Math.max(30, scoreVal));
  }, [attempts, mistakes]);

  const score = useMemo(() => {
    const base = 80;
    const accuracyBonus = Math.round(accuracy * 0.2);
    return Math.min(100, base + accuracyBonus);
  }, [accuracy]);

  const performanceLevel = useMemo(() => {
    if (accuracy >= 85) return "Natural Rhythm & Sequence Recall";
    if (accuracy >= 70) return "Strong Routine Awareness";
    if (accuracy >= 55) return "Steady Step Practice";
    return "Gentle Daily Exercise";
  }, [accuracy]);

  const startPlaying = (idx = selectedRoutineIdx) => {
    setSelectedRoutineIdx(idx);
    const r = DAILY_ROUTINES[idx];
    setPlacedSteps([]);
    setUnplacedSteps(shuffleArray(r.steps));
    setAttempts(0);
    setMistakes(0);
    setElapsedTime(0);
    setIsCheckingOrder(false);
    setSaveStatus("idle");
    setFeedback("Tap each step below to place it into the daily timeline.");
    setGameState("playing");
  };

  // Tap a card from pool to place into next open slot
  const handlePlaceStep = (step) => {
    if (placedSteps.length >= totalSteps) return;
    setUnplacedSteps((prev) => prev.filter((s) => s.id !== step.id));
    setPlacedSteps((prev) => [...prev, step]);
    setFeedback(`Placed "${step.label}". Keep going or reorder anytime!`);
  };

  // Tap a placed step to remove it back to pool
  const handleRemovePlacedStep = (step) => {
    setPlacedSteps((prev) => prev.filter((s) => s.id !== step.id));
    setUnplacedSteps((prev) => [...prev, step]);
    setFeedback(`Returned "${step.label}" to the choices below.`);
  };

  // Move step up/down in placed list
  const handleMoveStep = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= placedSteps.length) return;
    const updated = [...placedSteps];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setPlacedSteps(updated);
    setFeedback("Swapped order. Check if this order feels right!");
  };

  // Check sequence
  const handleCheckOrder = () => {
    if (isCheckingOrder || gameState !== "playing" || placedSteps.length < totalSteps) return;
    setIsCheckingOrder(true);
    setAttempts((prev) => prev + 1);

    const isCorrect = placedSteps.every((step, idx) => step.order === idx + 1);

    if (isCorrect) {
      handleComplete();
    } else {
      setMistakes((prev) => prev + 1);
      const correctCount = placedSteps.filter((s, i) => s.order === i + 1).length;
      setFeedback(
        `Almost there! ${correctCount} of 4 steps are in the right place. Tap any card to adjust.`
      );
      setTimeout(() => setIsCheckingOrder(false), 500);
    }
  };

  const handleComplete = async () => {
    setGameState("completed");
    setFeedback("Wonderful! You arranged the routine in perfect daily sequence.");

    const finalResult = {
      gameId: "daily-routine",
      game: "Daily Routine",
      routine: routine.title,
      score,
      total: totalSteps,
      accuracy,
      performanceLevel,
      moves: attempts + 1,
      mistakes,
      elapsedTime,
      difficulty: "easy",
      category: "sequencing",
      completedAt: new Date().toISOString(),
    };

    localStorage.setItem("smriti-last-game-result", JSON.stringify(finalResult));
    try {
      const prev = JSON.parse(localStorage.getItem("smriti-game-history") || "[]");
      localStorage.setItem("smriti-game-history", JSON.stringify([finalResult, ...prev].slice(0, 20)));
    } catch (e) {
      console.warn("Storage error:", e);
    }

    setIsSaving(true);
    setSaveStatus("saving");
    try {
      const res = await fetch("/api/patient/activities/record", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(finalResult),
      });
      if (res.ok) {
        setSaveStatus("saved");
      } else {
        setSaveStatus("offline");
      }
    } catch (err) {
      console.warn("Failed to persist Daily Routine, stored offline:", err);
      setSaveStatus("offline");
    } finally {
      setIsSaving(false);
      setIsCheckingOrder(false);
    }
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const slotLabels = ["1. First", "2. Next", "3. Then", "4. Finally"];

  // ==========================================================
  // VIEW 1: START SCREEN
  // ==========================================================
  if (gameState === "start") {
    return (
      <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-300">
        <button
          onClick={() => setCurrentView("patient-activities")}
          className="inline-flex items-center gap-2 text-base font-semibold text-gray-600 hover:text-[#0f3e3a] transition"
        >
          <ArrowLeft size={20} />
          Back to Activities
        </button>

        <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-6 sm:p-10 text-center">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-teal-50 text-[#0f3e3a] flex items-center justify-center mb-5">
            <Calendar size={44} />
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0f3e3a]">
            Daily Routine
          </h1>

          <p className="text-lg text-gray-600 mt-2 max-w-xl mx-auto">
            Place familiar daily activities in their natural step-by-step order.
          </p>

          {/* Simple step explanation */}
          <div className="mt-8 grid sm:grid-cols-3 gap-4 text-left">
            <div className="bg-[#f8faf9] p-4 rounded-2xl border border-stone-200/60">
              <div className="w-8 h-8 rounded-full bg-[#0f3e3a] text-white flex items-center justify-center font-bold text-sm mb-2">
                1
              </div>
              <p className="font-bold text-[#0f3e3a] text-sm">Select Steps</p>
              <p className="text-xs text-gray-600 mt-1">
                Tap each activity card to place it into the timeline.
              </p>
            </div>

            <div className="bg-[#f8faf9] p-4 rounded-2xl border border-stone-200/60">
              <div className="w-8 h-8 rounded-full bg-[#0f3e3a] text-white flex items-center justify-center font-bold text-sm mb-2">
                2
              </div>
              <p className="font-bold text-[#0f3e3a] text-sm">Arrange in Order</p>
              <p className="text-xs text-gray-600 mt-1">
                Order from what happens first to what happens last.
              </p>
            </div>

            <div className="bg-[#f8faf9] p-4 rounded-2xl border border-stone-200/60">
              <div className="w-8 h-8 rounded-full bg-[#0f3e3a] text-white flex items-center justify-center font-bold text-sm mb-2">
                3
              </div>
              <p className="font-bold text-[#0f3e3a] text-sm">No Rush</p>
              <p className="text-xs text-gray-600 mt-1">
                Tap cards anytime to change or swap them.
              </p>
            </div>
          </div>

          {/* Choose Routine */}
          <div className="mt-8 text-left">
            <label className="block text-sm font-bold text-gray-800 mb-3">
              Choose a Routine:
            </label>
            <div className="grid sm:grid-cols-3 gap-3">
              {DAILY_ROUTINES.map((r, idx) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setSelectedRoutineIdx(idx)}
                  className={`p-4 rounded-2xl border-2 text-left transition ${
                    selectedRoutineIdx === idx
                      ? "border-[#0f3e3a] bg-[#eef6f3] shadow-sm"
                      : "border-stone-200 bg-white hover:border-stone-300"
                  }`}
                >
                  <p className="font-bold text-gray-900">{r.title}</p>
                  <p className="text-xs text-gray-500 mt-1">{r.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => startPlaying(selectedRoutineIdx)}
              className="w-full sm:w-auto px-10 py-4 rounded-2xl bg-[#0f3e3a] text-white font-bold text-lg flex items-center justify-center gap-3 hover:bg-[#0c312e] shadow-md transition"
            >
              <Play size={22} className="fill-white" />
              Start Routine
            </button>

            <button
              onClick={() =>
                speakInstruction(
                  "Everyday activities follow a natural order. Tap the cards to arrange them from first to last."
                )
              }
              className="w-full sm:w-auto px-6 py-4 rounded-2xl border-2 border-stone-300 bg-white text-gray-700 font-bold text-base flex items-center justify-center gap-2 hover:bg-stone-50 transition"
            >
              <Volume2 size={20} />
              Hear Instructions
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================
  // VIEW 2: COMPLETION SCREEN
  // ==========================================================
  if (gameState === "completed") {
    return (
      <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-300">
        <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-6 sm:p-10 text-center">
          <div className="w-20 h-20 mx-auto rounded-full bg-teal-50 text-[#0f3e3a] flex items-center justify-center mb-3">
            <Trophy size={42} />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-100 text-[#0f3e3a] text-xs font-bold uppercase tracking-wider mb-3">
            <Sparkles size={14} />
            {performanceLevel}
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0f3e3a]">
            Splendid, Asha!
          </h1>

          <p className="text-gray-600 mt-2 text-base">
            You arranged the {routine.title} in harmonious natural order.
          </p>

          {/* 4 Score Metric Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8">
            <div className="bg-[#f8faf9] rounded-2xl border border-stone-200 p-4">
              <p className="text-xs font-bold uppercase text-gray-500">Score</p>
              <p className="text-3xl font-extrabold text-[#0f3e3a] mt-1">
                {score}
              </p>
              <p className="text-[11px] text-gray-400">points</p>
            </div>

            <div className="bg-[#f8faf9] rounded-2xl border border-stone-200 p-4">
              <p className="text-xs font-bold uppercase text-gray-500">Accuracy</p>
              <p className="text-3xl font-extrabold text-[#0f3e3a] mt-1">
                {accuracy}%
              </p>
              <p className="text-[11px] text-gray-400">{attempts} check(s)</p>
            </div>

            <div className="bg-[#f8faf9] rounded-2xl border border-stone-200 p-4">
              <p className="text-xs font-bold uppercase text-gray-500">Time</p>
              <p className="text-3xl font-extrabold text-[#0f3e3a] mt-1">
                {formatTime(elapsedTime)}
              </p>
              <p className="text-[11px] text-gray-400">elapsed</p>
            </div>

            <div className="bg-[#f8faf9] rounded-2xl border border-stone-200 p-4">
              <p className="text-xs font-bold uppercase text-gray-500">Steps</p>
              <p className="text-3xl font-extrabold text-[#0f3e3a] mt-1">
                {totalSteps}/{totalSteps}
              </p>
              <p className="text-[11px] text-gray-400">all ordered</p>
            </div>
          </div>

          <div
            className={`mt-6 p-4 rounded-2xl border flex items-center justify-center gap-2 text-sm font-medium transition-all ${
              saveStatus === "offline"
                ? "bg-amber-50 border-amber-200 text-amber-900"
                : "bg-[#eef6f3] border-teal-100 text-[#0f3e3a]"
            }`}
          >
            <CheckCircle2
              size={18}
              className={saveStatus === "offline" ? "text-amber-600 shrink-0" : "text-emerald-600 shrink-0"}
            />
            <span>
              {isSaving
                ? "Saving result to your cognitive health profile..."
                : saveStatus === "offline"
                ? "Saved securely to your device! Your progress will sync automatically."
                : "Your results are saved and updated in the Caregiver Portal."}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 grid sm:grid-cols-3 gap-3">
            <button
              onClick={() => startPlaying((selectedRoutineIdx + 1) % DAILY_ROUTINES.length)}
              className="py-3.5 px-4 rounded-2xl bg-[#0f3e3a] text-white font-bold flex items-center justify-center gap-2 hover:bg-[#0c312e] transition"
            >
              <RotateCcw size={18} />
              Try Next Routine
            </button>

            <button
              onClick={() => setCurrentView("patient-game-result")}
              className="py-3.5 px-4 rounded-2xl bg-teal-50 border border-teal-200 text-[#0f3e3a] font-bold flex items-center justify-center gap-2 hover:bg-teal-100 transition"
            >
              <Brain size={18} />
              Cognitive Report
            </button>

            <button
              onClick={() => setCurrentView("patient-activities")}
              className="py-3.5 px-4 rounded-2xl border-2 border-stone-200 text-gray-700 font-bold hover:bg-stone-50 transition"
            >
              Back to Activities
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================
  // VIEW 3: ACTIVE GAMEPLAY
  // ==========================================================
  const allPlaced = placedSteps.length === totalSteps;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <button
            onClick={() => setGameState("start")}
            className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-[#0f3e3a] mb-1 transition"
          >
            <ArrowLeft size={18} />
            Back to Options
          </button>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0f3e3a]">
            {routine.title}
          </h1>
        </div>

        <button
          onClick={() =>
            speakInstruction("Arrange the cards in order from first to last. Tap on any card to move it.")
          }
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl border border-stone-200 bg-white text-gray-700 text-sm font-semibold hover:bg-stone-50 transition self-start sm:self-auto"
        >
          <Volume2 size={18} />
          Hear Instructions
        </button>
      </div>

      {/* Progress & Live Counters */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl border border-stone-200 p-3 sm:p-4 text-center shadow-xs">
          <p className="text-xs font-bold uppercase text-gray-400">Steps Placed</p>
          <p className="text-xl sm:text-2xl font-black text-[#0f3e3a] mt-1">
            {placedSteps.length} / {totalSteps}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 p-3 sm:p-4 text-center shadow-xs">
          <p className="text-xs font-bold uppercase text-gray-400">Order Checks</p>
          <p className="text-xl sm:text-2xl font-black text-gray-800 mt-1">
            {attempts}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 p-3 sm:p-4 text-center shadow-xs">
          <div className="flex items-center justify-center gap-1">
            <Clock size={14} className="text-[#0f3e3a]" />
            <p className="text-xs font-bold uppercase text-gray-400">Time</p>
          </div>
          <p className="text-xl sm:text-2xl font-black text-gray-800 mt-1">
            {formatTime(elapsedTime)}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-stone-200 h-2.5 rounded-full overflow-hidden">
        <div
          className="bg-[#0f3e3a] h-full transition-all duration-500 rounded-full"
          style={{ width: `${(placedSteps.length / totalSteps) * 100}%` }}
        />
      </div>

      {/* Gentle Status Message */}
      <div
        className={`rounded-2xl px-5 py-3 text-center transition-all ${
          feedback.includes("Almost")
            ? "bg-amber-50 text-amber-900 border border-amber-200"
            : feedback.includes("Wonderful") || feedback.includes("Placed")
            ? "bg-emerald-50 text-emerald-900 border border-emerald-200"
            : "bg-white text-[#0f3e3a] border border-stone-200"
        }`}
      >
        <p className="text-base font-semibold">{feedback}</p>
      </div>

      {/* TIMELINE SLOTS (ORDERED SECTION) */}
      <div className="bg-white rounded-3xl border-2 border-stone-200 p-5 sm:p-6 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-gray-800">
            Timeline Order (First to Last):
          </p>
          <span className="text-xs text-gray-400">
            Tap a placed card to remove or use arrows to adjust
          </span>
        </div>

        <div className="grid gap-3">
          {slotLabels.map((slotLabel, idx) => {
            const step = placedSteps[idx];

            return (
              <div
                key={slotLabel}
                className={`min-h-[76px] rounded-2xl border-2 p-3 sm:p-4 flex items-center justify-between transition-all ${
                  step
                    ? "bg-[#f8faf9] border-[#0f3e3a]/30 shadow-xs"
                    : "bg-stone-50/70 border-dashed border-stone-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs sm:text-sm font-extrabold text-gray-400 w-16 sm:w-20">
                    {slotLabel}
                  </span>

                  {step ? (
                    <div className="flex items-center gap-3">
                      <span className="text-3xl sm:text-4xl">{step.icon}</span>
                      <span className="text-sm sm:text-base font-bold text-gray-800">
                        {step.label}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs sm:text-sm text-gray-400 italic">
                      Tap a card from below to place here
                    </span>
                  )}
                </div>

                {step && (
                  <div className="flex items-center gap-1">
                    {idx > 0 && (
                      <button
                        type="button"
                        onClick={() => handleMoveStep(idx, -1)}
                        title="Move Earlier"
                        className="p-2 rounded-xl bg-white border border-stone-200 text-gray-700 hover:bg-stone-100 transition"
                      >
                        <ArrowUp size={16} />
                      </button>
                    )}
                    {idx < placedSteps.length - 1 && (
                      <button
                        type="button"
                        onClick={() => handleMoveStep(idx, 1)}
                        title="Move Later"
                        className="p-2 rounded-xl bg-white border border-stone-200 text-gray-700 hover:bg-stone-100 transition"
                      >
                        <ArrowDown size={16} />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemovePlacedStep(step)}
                      title="Remove card"
                      className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 transition ml-1"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* CARDS POOL (UNPLACED ACTIVITIES) */}
      <div className="space-y-3">
        <label className="block text-sm font-bold text-gray-800">
          Available Steps (Tap to place into the next timeline slot):
        </label>

        {unplacedSteps.length === 0 ? (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center text-emerald-900 font-semibold text-sm">
            All 4 steps are placed! Tap &quot;Check My Sequence&quot; below to verify.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {unplacedSteps.map((step) => (
              <button
                key={step.id}
                type="button"
                onClick={() => handlePlaceStep(step)}
                className="p-4 rounded-2xl bg-white border-2 border-stone-200 hover:border-[#0f3e3a] hover:shadow-md active:scale-98 transition text-left flex items-center gap-4 cursor-pointer"
              >
                <span className="text-4xl">{step.icon}</span>
                <div>
                  <p className="text-sm font-bold text-gray-800">{step.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Tap to add</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* CHECK ORDER BUTTON */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
        <button
          type="button"
          onClick={handleCheckOrder}
          disabled={!allPlaced || isCheckingOrder}
          className={`w-full sm:w-auto px-10 py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition shadow-md ${
            allPlaced && !isCheckingOrder
              ? "bg-[#0f3e3a] text-white hover:bg-[#0c312e] cursor-pointer"
              : "bg-stone-200 text-gray-400 cursor-not-allowed"
          }`}
        >
          <CheckCircle2 size={22} />
          {isCheckingOrder ? "Checking..." : "Check My Sequence"}
        </button>

        <button
          type="button"
          onClick={() => startPlaying(selectedRoutineIdx)}
          className="w-full sm:w-auto px-6 py-4 rounded-2xl border-2 border-stone-200 bg-white text-gray-700 font-bold hover:bg-stone-50 transition"
        >
          <RotateCcw size={18} />
          Reset Steps
        </button>
      </div>

      <p className="text-center text-xs text-gray-400 pb-4">
        Take your time to think about everyday habits. There is no rush.
      </p>
    </div>
  );
}
