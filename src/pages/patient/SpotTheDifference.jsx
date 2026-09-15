import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Brain,
  CheckCircle2,
  Clock,
  Eye,
  HelpCircle,
  Play,
  RotateCcw,
  Sparkles,
  Trophy,
  Volume2,
  XCircle,
} from "lucide-react";

// ============================================================
// SCENES WITH CAREFULLY CRAFTED VISUAL DIFFERENCES
// ============================================================
const PUZZLE_SCENES = [
  {
    id: "garden",
    title: "Morning Garden",
    description: "Look at both pictures. Three things in Picture B are different!",
    totalDifferences: 3,
    // Picture A items
    itemsA: [
      { id: "sky", label: "Golden Sun", icon: "☀️", x: "78%", y: "14%", isDiff: false },
      { id: "bird", label: "Blue Bird", icon: "🐦", x: "24%", y: "22%", isDiff: false },
      { id: "flower", label: "Pink Lotus", icon: "🌸", x: "50%", y: "78%", isDiff: false },
      { id: "house", label: "Cottage", icon: "🏡", x: "18%", y: "62%", isDiff: false },
      { id: "tree", label: "Oak Tree", icon: "🌳", x: "80%", y: "60%", isDiff: false },
      { id: "bench", label: "Garden Bench", icon: "🪑", x: "48%", y: "42%", isDiff: false },
    ],
    // Picture B items (with 3 clear differences)
    itemsB: [
      {
        id: "sky",
        label: "Cloudy Sun",
        icon: "⛅",
        x: "78%",
        y: "14%",
        isDiff: true,
        diffName: "Cloud covering the Sun",
        diffHint: "Look at the sky in the top right!",
      },
      {
        id: "bird",
        label: "Red Butterfly",
        icon: "🦋",
        x: "24%",
        y: "22%",
        isDiff: true,
        diffName: "Butterfly instead of a Bird",
        diffHint: "Look near the top left branch!",
      },
      {
        id: "flower",
        label: "Yellow Sunflower",
        icon: "🌻",
        x: "50%",
        y: "78%",
        isDiff: true,
        diffName: "Yellow Sunflower instead of Pink Lotus",
        diffHint: "Look at the flower bed at the bottom!",
      },
      { id: "house", label: "Cottage", icon: "🏡", x: "18%", y: "62%", isDiff: false },
      { id: "tree", label: "Oak Tree", icon: "🌳", x: "80%", y: "60%", isDiff: false },
      { id: "bench", label: "Garden Bench", icon: "🪑", x: "48%", y: "42%", isDiff: false },
    ],
  },
  {
    id: "teatime",
    title: "Cozy Afternoon Tea",
    description: "Compare the living room scenes and find the 3 changes in Picture B.",
    totalDifferences: 3,
    itemsA: [
      { id: "tea", label: "Hot Tea", icon: "☕", x: "48%", y: "46%", isDiff: false },
      { id: "clock", label: "Wall Clock", icon: "🕰️", x: "78%", y: "16%", isDiff: false },
      { id: "cat", label: "Sleeping Cat", icon: "🐱", x: "22%", y: "74%", isDiff: false },
      { id: "book", label: "Reading Book", icon: "📖", x: "74%", y: "68%", isDiff: false },
      { id: "window", label: "Window", icon: "🪟", x: "20%", y: "20%", isDiff: false },
      { id: "plant", label: "Houseplant", icon: "🪴", x: "50%", y: "80%", isDiff: false },
    ],
    itemsB: [
      {
        id: "tea",
        label: "Juice Glass",
        icon: "🧃",
        x: "48%",
        y: "46%",
        isDiff: true,
        diffName: "Juice box instead of Hot Tea",
        diffHint: "Look at the tabletop drink!",
      },
      {
        id: "clock",
        label: "Alarm Clock",
        icon: "⏰",
        x: "78%",
        y: "16%",
        isDiff: true,
        diffName: "Alarm clock instead of Wall Clock",
        diffHint: "Look at the clock on the upper wall!",
      },
      {
        id: "cat",
        label: "Playful Puppy",
        icon: "🐶",
        x: "22%",
        y: "74%",
        isDiff: true,
        diffName: "Puppy resting instead of Cat",
        diffHint: "Look at the pet on the cozy rug!",
      },
      { id: "book", label: "Reading Book", icon: "📖", x: "74%", y: "68%", isDiff: false },
      { id: "window", label: "Window", icon: "🪟", x: "20%", y: "20%", isDiff: false },
      { id: "plant", label: "Houseplant", icon: "🪴", x: "50%", y: "80%", isDiff: false },
    ],
  },
];

function speakInstruction(text) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-IN";
  utterance.rate = 0.85;
  utterance.pitch = 1;
  window.speechSynthesis.speak(utterance);
}

export default function SpotTheDifference({ setCurrentView }) {
  const [sceneIndex, setSceneIndex] = useState(0);
  const [gameState, setGameState] = useState("start"); // 'start' | 'playing' | 'completed'
  const [foundIds, setFoundIds] = useState([]);
  const [mistakes, setMistakes] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [feedback, setFeedback] = useState("Tap any item in Picture B that is different from Picture A.");
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState("idle"); // 'idle' | 'saving' | 'saved' | 'offline'

  const scene = PUZZLE_SCENES[sceneIndex];

  // Timer
  useEffect(() => {
    if (gameState !== "playing") return;
    const timer = setInterval(() => {
      setElapsedTime((t) => t + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [gameState]);

  // Scoring
  const accuracy = useMemo(() => {
    const totalTaps = foundIds.length + mistakes;
    if (totalTaps === 0) return 100;
    return Math.min(100, Math.max(10, Math.round((foundIds.length / totalTaps) * 100)));
  }, [foundIds.length, mistakes]);

  const score = useMemo(() => {
    const foundPoints = foundIds.length * 30;
    const accuracyBonus = Math.round(accuracy * 0.1);
    return Math.min(100, Math.max(30, foundPoints + accuracyBonus));
  }, [foundIds.length, accuracy]);

  const performanceLevel = useMemo(() => {
    if (accuracy >= 85) return "Sharp Visual Attention";
    if (accuracy >= 70) return "Good Observation";
    if (accuracy >= 55) return "Careful Focus";
    return "Relaxed Practice";
  }, [accuracy]);

  // Check completion
  useEffect(() => {
    if (gameState !== "playing") return;
    if (foundIds.length === scene.totalDifferences && scene.totalDifferences > 0) {
      handleComplete();
    }
  }, [foundIds, scene.totalDifferences, gameState]);

  const handleComplete = async () => {
    setGameState("completed");
    setFeedback("Wonderful! You found all the differences in this picture.");

    const finalResult = {
      gameId: "spot-the-difference",
      game: "Spot the Difference",
      puzzle: scene.title,
      score,
      total: scene.totalDifferences,
      accuracy,
      performanceLevel,
      mistakes,
      elapsedTime,
      difficulty: "easy",
      category: "attention",
      completedAt: new Date().toISOString(),
    };

    // Save to localStorage for instant local retrieval
    localStorage.setItem("smriti-last-game-result", JSON.stringify(finalResult));
    try {
      const prevHistory = JSON.parse(localStorage.getItem("smriti-game-history") || "[]");
      localStorage.setItem("smriti-game-history", JSON.stringify([finalResult, ...prevHistory].slice(0, 20)));
    } catch (e) {
      console.warn("Storage error:", e);
    }

    // Persist to server
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
      console.warn("Failed to persist Spot the Difference, stored offline:", err);
      setSaveStatus("offline");
    } finally {
      setIsSaving(false);
    }
  };

  const startPlaying = (idx = sceneIndex) => {
    setSceneIndex(idx);
    setFoundIds([]);
    setMistakes(0);
    setElapsedTime(0);
    setSaveStatus("idle");
    setFeedback("Look at Picture A and Picture B. Tap the differences in Picture B.");
    setGameState("playing");
  };

  const handleTapItemB = (item) => {
    if (gameState !== "playing") return;

    if (item.isDiff) {
      if (foundIds.includes(item.id)) {
        setFeedback(`You already discovered the ${item.diffName}! Look for remaining ones.`);
        return;
      }
      setFoundIds((prev) => [...prev, item.id]);
      setFeedback(`Great eyes! You found the ${item.diffName}.`);
    } else {
      setMistakes((prev) => prev + 1);
      setFeedback(`That ${item.label} looks identical in both pictures. Keep looking carefully!`);
    }
  };

  const handleBackgroundTap = () => {
    if (gameState !== "playing") return;
    setMistakes((prev) => prev + 1);
    setFeedback("Nothing changed here. Look closely at the objects and nature symbols!");
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

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
            <Eye size={44} />
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0f3e3a]">
            Spot the Difference
          </h1>

          <p className="text-lg text-gray-600 mt-2 max-w-xl mx-auto">
            Compare two pictures side by side and spot the changes.
          </p>

          {/* Simple step explanation */}
          <div className="mt-8 grid sm:grid-cols-3 gap-4 text-left">
            <div className="bg-[#f8faf9] p-4 rounded-2xl border border-stone-200/60">
              <div className="w-8 h-8 rounded-full bg-[#0f3e3a] text-white flex items-center justify-center font-bold text-sm mb-2">
                1
              </div>
              <p className="font-bold text-[#0f3e3a] text-sm">Compare Pictures</p>
              <p className="text-xs text-gray-600 mt-1">
                Picture A is the original. Picture B has 3 gentle changes.
              </p>
            </div>

            <div className="bg-[#f8faf9] p-4 rounded-2xl border border-stone-200/60">
              <div className="w-8 h-8 rounded-full bg-[#0f3e3a] text-white flex items-center justify-center font-bold text-sm mb-2">
                2
              </div>
              <p className="font-bold text-[#0f3e3a] text-sm">Tap on Picture B</p>
              <p className="text-xs text-gray-600 mt-1">
                Tap directly on Picture B whenever you see something changed.
              </p>
            </div>

            <div className="bg-[#f8faf9] p-4 rounded-2xl border border-stone-200/60">
              <div className="w-8 h-8 rounded-full bg-[#0f3e3a] text-white flex items-center justify-center font-bold text-sm mb-2">
                3
              </div>
              <p className="font-bold text-[#0f3e3a] text-sm">Relaxed Time</p>
              <p className="text-xs text-gray-600 mt-1">
                Take as long as you like. There are 3 differences to find.
              </p>
            </div>
          </div>

          {/* Choose Scene */}
          <div className="mt-8 text-left">
            <label className="block text-sm font-bold text-gray-800 mb-3">
              Choose Scene:
            </label>
            <div className="grid sm:grid-cols-2 gap-4">
              {PUZZLE_SCENES.map((p, idx) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSceneIndex(idx)}
                  className={`p-4 rounded-2xl border-2 text-left transition ${
                    sceneIndex === idx
                      ? "border-[#0f3e3a] bg-[#eef6f3] shadow-sm"
                      : "border-stone-200 bg-white hover:border-stone-300"
                  }`}
                >
                  <p className="font-bold text-gray-900">{p.title}</p>
                  <p className="text-xs text-gray-500 mt-1">{p.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => startPlaying(sceneIndex)}
              className="w-full sm:w-auto px-10 py-4 rounded-2xl bg-[#0f3e3a] text-white font-bold text-lg flex items-center justify-center gap-3 hover:bg-[#0c312e] shadow-md transition"
            >
              <Play size={22} className="fill-white" />
              Start Picture Search
            </button>

            <button
              onClick={() =>
                speakInstruction(
                  "Look carefully at both pictures side by side. Tap on Picture B wherever you see something different."
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
            Well Done, Asha!
          </h1>

          <p className="text-gray-600 mt-2 text-base">
            You found all {scene.totalDifferences} differences in the {scene.title}!
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
              <p className="text-[11px] text-gray-400">{mistakes} mis-taps</p>
            </div>

            <div className="bg-[#f8faf9] rounded-2xl border border-stone-200 p-4">
              <p className="text-xs font-bold uppercase text-gray-500">Time</p>
              <p className="text-3xl font-extrabold text-[#0f3e3a] mt-1">
                {formatTime(elapsedTime)}
              </p>
              <p className="text-[11px] text-gray-400">elapsed</p>
            </div>

            <div className="bg-[#f8faf9] rounded-2xl border border-stone-200 p-4">
              <p className="text-xs font-bold uppercase text-gray-500">Found</p>
              <p className="text-3xl font-extrabold text-[#0f3e3a] mt-1">
                {foundIds.length}/{scene.totalDifferences}
              </p>
              <p className="text-[11px] text-gray-400">all completed</p>
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
              onClick={() => startPlaying((sceneIndex + 1) % PUZZLE_SCENES.length)}
              className="py-3.5 px-4 rounded-2xl bg-[#0f3e3a] text-white font-bold flex items-center justify-center gap-2 hover:bg-[#0c312e] transition"
            >
              <RotateCcw size={18} />
              Try Next Scene
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
  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-300">
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
            Spot the Difference: {scene.title}
          </h1>
        </div>

        <button
          onClick={() =>
            speakInstruction("Look at Picture A on the left, and tap any differences you see in Picture B on the right.")
          }
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl border border-stone-200 bg-white text-gray-700 text-sm font-semibold hover:bg-stone-50 transition self-start sm:self-auto"
        >
          <Volume2 size={18} />
          Hear Instructions
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl border border-stone-200 p-3 sm:p-4 text-center shadow-xs">
          <p className="text-xs font-bold uppercase text-gray-400">Differences Found</p>
          <p className="text-xl sm:text-2xl font-black text-[#0f3e3a] mt-1">
            {foundIds.length} / {scene.totalDifferences}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 p-3 sm:p-4 text-center shadow-xs">
          <p className="text-xs font-bold uppercase text-gray-400">Other Taps</p>
          <p className="text-xl sm:text-2xl font-black text-gray-800 mt-1">
            {mistakes}
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
          style={{ width: `${(foundIds.length / scene.totalDifferences) * 100}%` }}
        />
      </div>

      {/* Gentle Message */}
      <div
        className={`rounded-2xl px-5 py-3 text-center transition-all ${
          feedback.includes("identical") || feedback.includes("Nothing")
            ? "bg-amber-50 text-amber-900 border border-amber-200"
            : feedback.includes("Great") || feedback.includes("Wonderful")
            ? "bg-emerald-50 text-emerald-900 border border-emerald-200"
            : "bg-white text-[#0f3e3a] border border-stone-200"
        }`}
      >
        <p className="text-base font-semibold">{feedback}</p>
      </div>

      {/* SIDE-BY-SIDE PICTURES */}
      <div className="grid md:grid-cols-2 gap-5">
        {/* PICTURE A (REFERENCE) */}
        <div className="bg-white rounded-3xl border-2 border-stone-200 p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-sm font-extrabold uppercase tracking-wide text-gray-700 bg-stone-100 px-3 py-1 rounded-full">
              Picture A (Original)
            </span>
            <span className="text-xs font-semibold text-gray-400">Reference</span>
          </div>

          <div className="relative w-full aspect-[4/3] rounded-2xl bg-gradient-to-b from-[#eef7ff] via-[#e8f4ec] to-[#e4eee7] border border-stone-200 overflow-hidden select-none">
            {scene.itemsA.map((item) => (
              <div
                key={item.id}
                className="absolute flex flex-col items-center justify-center -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                style={{ left: item.x, top: item.y }}
              >
                <span className="text-4xl sm:text-5xl drop-shadow-sm">{item.icon}</span>
                <span className="text-[11px] sm:text-xs font-bold text-gray-700 bg-white/80 px-2 py-0.5 rounded-md mt-1 border border-stone-200/60 shadow-xs">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* PICTURE B (INTERACTIVE) */}
        <div className="bg-white rounded-3xl border-2 border-[#0f3e3a]/30 p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-sm font-extrabold uppercase tracking-wide text-[#0f3e3a] bg-emerald-100 px-3 py-1 rounded-full flex items-center gap-1.5">
              <Eye size={15} /> Picture B (Tap Differences!)
            </span>
            <span className="text-xs font-bold text-[#0f3e3a]">
              {foundIds.length}/{scene.totalDifferences} Found
            </span>
          </div>

          <div
            onClick={handleBackgroundTap}
            className="relative w-full aspect-[4/3] rounded-2xl bg-gradient-to-b from-[#eef7ff] via-[#e8f4ec] to-[#e4eee7] border-2 border-dashed border-[#0f3e3a]/40 overflow-hidden cursor-crosshair select-none"
          >
            {scene.itemsB.map((item) => {
              const isFound = item.isDiff && foundIds.includes(item.id);

              return (
                <button
                  key={item.id}
                  type="button"
                  disabled={isFound || gameState !== "playing"}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTapItemB(item);
                  }}
                  aria-label={item.label}
                  className={`absolute flex flex-col items-center justify-center -translate-x-1/2 -translate-y-1/2 p-2 rounded-2xl transition-all duration-200 ${
                    isFound
                      ? "ring-4 ring-emerald-500 bg-emerald-100/90 shadow-lg scale-110 cursor-default"
                      : "hover:scale-105 active:scale-95 cursor-pointer"
                  }`}
                  style={{ left: item.x, top: item.y }}
                >
                  <span className="text-4xl sm:text-5xl drop-shadow-sm">{item.icon}</span>
                  <span
                    className={`text-[11px] sm:text-xs font-bold px-2 py-0.5 rounded-md mt-1 border shadow-xs ${
                      isFound
                        ? "bg-emerald-700 text-white border-emerald-800"
                        : "bg-white/80 text-gray-700 border-stone-200/60"
                    }`}
                  >
                    {isFound ? `✓ ${item.label}` : item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        <button
          type="button"
          onClick={() => {
            const unfound = scene.itemsB.find((b) => b.isDiff && !foundIds.includes(b.id));
            if (unfound) {
              setFeedback(`Hint: ${unfound.diffHint}`);
            }
          }}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl border-2 border-stone-200 bg-white text-gray-700 font-bold hover:bg-stone-50 transition"
        >
          <HelpCircle size={18} className="text-blue-600" />
          Give Me a Clue
        </button>

        <button
          type="button"
          onClick={() => startPlaying(sceneIndex)}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl border-2 border-stone-200 bg-white text-gray-700 font-bold hover:bg-stone-50 transition"
        >
          <RotateCcw size={18} />
          Restart Picture
        </button>
      </div>

      <p className="text-center text-xs text-gray-400 pb-4">
        Take your time to look between Picture A and Picture B. There is no rush.
      </p>
    </div>
  );
}
