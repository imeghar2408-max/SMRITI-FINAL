import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Brain,
  CheckCircle2,
  Clock,
  HelpCircle,
  Play,
  RotateCcw,
  Sparkles,
  Trophy,
  Volume2,
} from "lucide-react";

// ============================================================
// PROGRESSIVE PATTERN ROUNDS (Elderly-friendly visual logic)
// ============================================================
const PATTERN_ROUNDS = [
  {
    id: 1,
    level: "Gentle Rhythm",
    hint: "Look at how the flower and sun take turns!",
    sequence: [
      { id: "s1", icon: "🌸", name: "Lotus" },
      { id: "s2", icon: "☀️", name: "Sun" },
      { id: "s3", icon: "🌸", name: "Lotus" },
      { id: "s4", icon: "☀️", name: "Sun" },
      { id: "s5", icon: "🌸", name: "Lotus" },
    ],
    correct: { icon: "☀️", name: "Sun" },
    options: [
      { id: "opt-sun", icon: "☀️", name: "Sun" },
      { id: "opt-flower", icon: "🌸", name: "Lotus" },
      { id: "opt-leaf", icon: "🌿", name: "Leaf" },
      { id: "opt-bird", icon: "🐦", name: "Bird" },
    ],
    explanation: "Lotus and Sun alternate one after the other.",
  },
  {
    id: 2,
    level: "Double Step",
    hint: "Notice that there are two leaves before each flower.",
    sequence: [
      { id: "s1", icon: "🌿", name: "Leaf" },
      { id: "s2", icon: "🌿", name: "Leaf" },
      { id: "s3", icon: "🌸", name: "Lotus" },
      { id: "s4", icon: "🌿", name: "Leaf" },
      { id: "s5", icon: "🌿", name: "Leaf" },
    ],
    correct: { icon: "🌸", name: "Lotus" },
    options: [
      { id: "opt-flower", icon: "🌸", name: "Lotus" },
      { id: "opt-leaf", icon: "🌿", name: "Leaf" },
      { id: "opt-sun", icon: "☀️", name: "Sun" },
      { id: "opt-tea", icon: "☕", name: "Warm Chai" },
    ],
    explanation: "Two green leaves are always followed by one pink lotus.",
  },
  {
    id: 3,
    level: "Three-Color Cycle",
    hint: "Watch the repeating group of three colors: Gold, Blue, Violet.",
    sequence: [
      { id: "s1", icon: "🟡", name: "Gold" },
      { id: "s2", icon: "🔵", name: "Blue" },
      { id: "s3", icon: "🟣", name: "Violet" },
      { id: "s4", icon: "🟡", name: "Gold" },
      { id: "s5", icon: "🔵", name: "Blue" },
    ],
    correct: { icon: "🟣", name: "Violet" },
    options: [
      { id: "opt-violet", icon: "🟣", name: "Violet" },
      { id: "opt-gold", icon: "🟡", name: "Gold" },
      { id: "opt-blue", icon: "🔵", name: "Blue" },
      { id: "opt-green", icon: "🟢", name: "Green" },
    ],
    explanation: "Gold, Blue, and Violet cycle in order.",
  },
  {
    id: 4,
    level: "Daily Harmony",
    hint: "A morning sunrise, then two warm chais, then sunrise...",
    sequence: [
      { id: "s1", icon: "☀️", name: "Morning Sun" },
      { id: "s2", icon: "☕", name: "Chai" },
      { id: "s3", icon: "☕", name: "Chai" },
      { id: "s4", icon: "☀️", name: "Morning Sun" },
      { id: "s5", icon: "☕", name: "Chai" },
    ],
    correct: { icon: "☕", name: "Chai" },
    options: [
      { id: "opt-chai", icon: "☕", name: "Chai" },
      { id: "opt-sun", icon: "☀️", name: "Morning Sun" },
      { id: "opt-moon", icon: "🌙", name: "Night Moon" },
      { id: "opt-book", icon: "📖", name: "Book" },
    ],
    explanation: "Each sunrise is followed by two comforting cups of chai.",
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

export default function PatternMatch({ setCurrentView }) {
  const [gameState, setGameState] = useState("start"); // 'start' | 'playing' | 'completed'
  const [currentRoundIdx, setCurrentRoundIdx] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [firstTryCorrectCount, setFirstTryCorrectCount] = useState(0);
  const [currentRoundTries, setCurrentRoundTries] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [feedback, setFeedback] = useState("Look at the pattern above. Tap the symbol that belongs in the empty box.");
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAdvancing, setIsAdvancing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState("idle"); // 'idle' | 'saving' | 'saved' | 'offline'

  const round = PATTERN_ROUNDS[currentRoundIdx];
  const totalRounds = PATTERN_ROUNDS.length;

  // Live Timer during gameplay
  useEffect(() => {
    if (gameState !== "playing") return;
    const timer = setInterval(() => {
      setElapsedTime((t) => t + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [gameState]);

  // Scoring and Accuracy
  const accuracy = useMemo(() => {
    if (attempts === 0) return 100;
    return Math.min(100, Math.max(25, Math.round((totalRounds / attempts) * 100)));
  }, [attempts, totalRounds]);

  const score = useMemo(() => {
    const roundScore = totalRounds * 20;
    const firstTryBonus = firstTryCorrectCount * 5;
    return Math.min(100, roundScore + firstTryBonus);
  }, [totalRounds, firstTryCorrectCount]);

  const performanceLevel = useMemo(() => {
    if (accuracy >= 85) return "Keen Logic & Sequence Recognition";
    if (accuracy >= 70) return "Strong Pattern Awareness";
    if (accuracy >= 55) return "Steady Sequence Recall";
    return "Gentle Rhythmic Exercise";
  }, [accuracy]);

  const startPlaying = () => {
    setCurrentRoundIdx(0);
    setAttempts(0);
    setFirstTryCorrectCount(0);
    setCurrentRoundTries(0);
    setElapsedTime(0);
    setSelectedOption(null);
    setIsAdvancing(false);
    setSaveStatus("idle");
    setFeedback("Look at the repeating symbols. Which symbol comes next in the box marked with a question mark?");
    setGameState("playing");
  };

  const handleOptionSelect = (option) => {
    if (gameState !== "playing" || isAdvancing) return;

    setSelectedOption(option.name);
    setAttempts((prev) => prev + 1);
    const triesInThisRound = currentRoundTries + 1;
    setCurrentRoundTries(triesInThisRound);

    const isMatch = option.name === round.correct.name;

    if (isMatch) {
      if (triesInThisRound === 1) {
        setFirstTryCorrectCount((prev) => prev + 1);
      }
      setIsAdvancing(true);
      setFeedback(`Correct! ${option.name} completes the pattern.`);

      setTimeout(() => {
        if (currentRoundIdx + 1 < totalRounds) {
          setCurrentRoundIdx((prev) => prev + 1);
          setCurrentRoundTries(0);
          setSelectedOption(null);
          setIsAdvancing(false);
          setFeedback("Great work! Here is the next pattern.");
        } else {
          handleComplete();
        }
      }, 1000);
    } else {
      setFeedback(`Not quite. Look closely at how the symbols repeat. Try another!`);
      setTimeout(() => {
        setSelectedOption(null);
      }, 800);
    }
  };

  const handleComplete = async () => {
    setGameState("completed");
    setFeedback("Wonderful! You completed all the pattern sequences.");

    const finalResult = {
      gameId: "pattern-match",
      game: "Pattern Match",
      score,
      total: totalRounds,
      accuracy,
      performanceLevel,
      moves: attempts,
      mistakes: Math.max(0, attempts - totalRounds),
      elapsedTime,
      difficulty: "medium",
      category: "attention",
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
      console.warn("Failed to persist Pattern Match, stored offline:", err);
      setSaveStatus("offline");
    } finally {
      setIsSaving(false);
    }
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
            <Brain size={44} />
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0f3e3a]">
            Pattern Match
          </h1>

          <p className="text-lg text-gray-600 mt-2 max-w-xl mx-auto">
            Discover the rhythmic order of symbols and choose what comes next.
          </p>

          {/* Simple step explanation */}
          <div className="mt-8 grid sm:grid-cols-3 gap-4 text-left">
            <div className="bg-[#f8faf9] p-4 rounded-2xl border border-stone-200/60">
              <div className="w-8 h-8 rounded-full bg-[#0f3e3a] text-white flex items-center justify-center font-bold text-sm mb-2">
                1
              </div>
              <p className="font-bold text-[#0f3e3a] text-sm">Observe Rhythm</p>
              <p className="text-xs text-gray-600 mt-1">
                Look at the line of symbols repeating in order from left to right.
              </p>
            </div>

            <div className="bg-[#f8faf9] p-4 rounded-2xl border border-stone-200/60">
              <div className="w-8 h-8 rounded-full bg-[#0f3e3a] text-white flex items-center justify-center font-bold text-sm mb-2">
                2
              </div>
              <p className="font-bold text-[#0f3e3a] text-sm">Find Missing One</p>
              <p className="text-xs text-gray-600 mt-1">
                One spot has a question mark (?). Tap the symbol that fits.
              </p>
            </div>

            <div className="bg-[#f8faf9] p-4 rounded-2xl border border-stone-200/60">
              <div className="w-8 h-8 rounded-full bg-[#0f3e3a] text-white flex items-center justify-center font-bold text-sm mb-2">
                3
              </div>
              <p className="font-bold text-[#0f3e3a] text-sm">Gentle Progression</p>
              <p className="text-xs text-gray-600 mt-1">
                4 short rounds that gently challenge sequence recall.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={startPlaying}
              className="w-full sm:w-auto px-10 py-4 rounded-2xl bg-[#0f3e3a] text-white font-bold text-lg flex items-center justify-center gap-3 hover:bg-[#0c312e] shadow-md transition"
            >
              <Play size={22} className="fill-white" />
              Start Pattern Match
            </button>

            <button
              onClick={() =>
                speakInstruction(
                  "Look at the symbols repeating in order. Tap the card below that correctly fills in the question mark."
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
            Magnificent, Asha!
          </h1>

          <p className="text-gray-600 mt-2 text-base">
            You solved all {totalRounds} visual patterns with great rhythm and focus.
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
              <p className="text-[11px] text-gray-400">{attempts} total tries</p>
            </div>

            <div className="bg-[#f8faf9] rounded-2xl border border-stone-200 p-4">
              <p className="text-xs font-bold uppercase text-gray-500">Time</p>
              <p className="text-3xl font-extrabold text-[#0f3e3a] mt-1">
                {formatTime(elapsedTime)}
              </p>
              <p className="text-[11px] text-gray-400">elapsed</p>
            </div>

            <div className="bg-[#f8faf9] rounded-2xl border border-stone-200 p-4">
              <p className="text-xs font-bold uppercase text-gray-500">Solved</p>
              <p className="text-3xl font-extrabold text-[#0f3e3a] mt-1">
                {totalRounds}/{totalRounds}
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
              onClick={startPlaying}
              className="py-3.5 px-4 rounded-2xl bg-[#0f3e3a] text-white font-bold flex items-center justify-center gap-2 hover:bg-[#0c312e] transition"
            >
              <RotateCcw size={18} />
              Play Again
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
            Pattern Match: Round {currentRoundIdx + 1} of {totalRounds}
          </h1>
        </div>

        <button
          onClick={() =>
            speakInstruction(`Look at the pattern: ${round.hint}. Tap the missing symbol below.`)
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
          <p className="text-xs font-bold uppercase text-gray-400">Progress</p>
          <p className="text-xl sm:text-2xl font-black text-[#0f3e3a] mt-1">
            {currentRoundIdx + 1} / {totalRounds}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 p-3 sm:p-4 text-center shadow-xs">
          <p className="text-xs font-bold uppercase text-gray-400">Attempts</p>
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
          className="bg-amber-600 h-full transition-all duration-500 rounded-full"
          style={{ width: `${((currentRoundIdx + 1) / totalRounds) * 100}%` }}
        />
      </div>

      {/* Gentle Status Message */}
      <div
        className={`rounded-2xl px-5 py-3 text-center transition-all ${
          feedback.includes("Not")
            ? "bg-amber-50 text-amber-900 border border-amber-200"
            : feedback.includes("Correct") || feedback.includes("Great")
            ? "bg-emerald-50 text-emerald-900 border border-emerald-200"
            : "bg-white text-[#0f3e3a] border border-stone-200"
        }`}
      >
        <p className="text-base font-semibold">{feedback}</p>
      </div>

      {/* SEQUENCE DISPLAY CARD */}
      <div className="bg-white rounded-3xl border-2 border-stone-200 p-6 sm:p-8 shadow-sm text-center">
        <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
          {round.level}
        </p>
        <p className="text-base text-gray-600 mb-6 font-medium">
          {round.hint}
        </p>

        {/* Large Sequence Row */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 select-none">
          {round.sequence.map((item, idx) => (
            <div
              key={`${item.id}-${idx}`}
              className="w-18 sm:w-24 min-h-[95px] sm:min-h-[110px] rounded-2xl bg-[#f8faf9] border-2 border-stone-200 flex flex-col items-center justify-center p-2 shadow-xs"
            >
              <span className="text-4xl sm:text-5xl">{item.icon}</span>
              <span className="text-xs font-bold text-gray-700 mt-2">{item.name}</span>
            </div>
          ))}

          {/* Missing Item Slot */}
          <div className="w-18 sm:w-24 min-h-[95px] sm:min-h-[110px] rounded-2xl bg-amber-50/80 border-3 border-dashed border-amber-500 flex flex-col items-center justify-center p-2 shadow-xs animate-pulse">
            <span className="text-3xl sm:text-4xl font-extrabold text-amber-700">?</span>
            <span className="text-xs font-extrabold text-amber-800 mt-2">Next</span>
          </div>
        </div>
      </div>

      {/* LARGE VISUAL CHOICES */}
      <div className="space-y-3">
        <label className="block text-center text-sm font-bold text-gray-700">
          Tap the symbol that belongs in the box:
        </label>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {round.options.map((option) => {
            const isSelected = selectedOption === option.name;
            const isCorrect = isSelected && option.name === round.correct.name;

            return (
              <button
                key={option.id}
                type="button"
                onClick={() => handleOptionSelect(option)}
                disabled={isAdvancing}
                className={`min-h-[100px] sm:min-h-[120px] rounded-3xl p-4 flex flex-col items-center justify-center border-2 transition-all duration-200 select-none ${
                  isCorrect
                    ? "bg-emerald-100 border-emerald-500 ring-4 ring-emerald-300 scale-105"
                    : isSelected
                    ? "bg-amber-100 border-amber-500 scale-95"
                    : "bg-white border-stone-200 hover:border-[#0f3e3a] hover:shadow-md active:scale-95 cursor-pointer"
                }`}
              >
                <span className="text-4xl sm:text-5xl">{option.icon}</span>
                <span className="text-sm font-bold text-gray-800 mt-2">
                  {option.name}
                </span>
                {isCorrect && (
                  <span className="text-xs font-bold text-emerald-800 flex items-center gap-1 mt-1">
                    <CheckCircle2 size={13} /> Correct!
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom helper */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        <button
          type="button"
          onClick={() => setFeedback(`Helpful Tip: ${round.explanation}`)}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl border-2 border-stone-200 bg-white text-gray-700 font-bold hover:bg-stone-50 transition"
        >
          <HelpCircle size={18} className="text-amber-600" />
          Explain the Rule
        </button>

        <button
          type="button"
          onClick={startPlaying}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl border-2 border-stone-200 bg-white text-gray-700 font-bold hover:bg-stone-50 transition"
        >
          <RotateCcw size={18} />
          Restart Pattern
        </button>
      </div>

      <p className="text-center text-xs text-gray-400 pb-4">
        Take all the time you need. Each sequence gently stimulates logical reasoning.
      </p>
    </div>
  );
}
