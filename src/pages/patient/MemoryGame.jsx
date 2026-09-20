import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Brain,
  CheckCircle2,
  Clock,
  HelpCircle,
  Lightbulb,
  Play,
  RotateCcw,
  Sparkles,
  Trophy,
  Volume2,
} from "lucide-react";

// ============================================================
// MEMORY CARD ITEMS (Familiar, distinct, cheerful symbols)
// ============================================================
const MEMORY_ITEMS = [
  { id: "family", name: "Family", icon: "👨‍👩‍👧‍👦" },
  { id: "home", name: "Home", icon: "🏡" },
  { id: "garden", name: "Garden", icon: "🌳" },
  { id: "chai", name: "Warm Chai", icon: "☕" },
  { id: "flower", name: "Lotus", icon: "🌸" },
  { id: "sun", name: "Sun", icon: "☀️" },
  { id: "bird", name: "Bird", icon: "🐦" },
  { id: "music", name: "Music", icon: "🎵" },
];

const DIFFICULTY_CONFIG = {
  gentle: {
    pairs: 3,
    label: "Gentle (6 Cards)",
    description: "Relaxed start with 3 matching pairs",
    gridCols: "grid-cols-2 sm:grid-cols-3",
  },
  easy: {
    pairs: 4,
    label: "Classic (8 Cards)",
    description: "Comfortable exercise with 4 matching pairs",
    gridCols: "grid-cols-2 sm:grid-cols-4",
  },
  medium: {
    pairs: 6,
    label: "Focus (12 Cards)",
    description: "Expanded recall with 6 matching pairs",
    gridCols: "grid-cols-3 sm:grid-cols-4",
  },
};

function shuffleArray(array) {
  return [...array].sort(() => Math.random() - 0.5);
}

function createCards(level) {
  const pairCount = DIFFICULTY_CONFIG[level]?.pairs || 3;
  const selectedItems = shuffleArray(MEMORY_ITEMS).slice(0, pairCount);

  const cards = selectedItems.flatMap((item) => [
    {
      cardId: `${item.id}-1`,
      pairId: item.id,
      name: item.name,
      icon: item.icon,
      flipped: false,
      matched: false,
    },
    {
      cardId: `${item.id}-2`,
      pairId: item.id,
      name: item.name,
      icon: item.icon,
      flipped: false,
      matched: false,
    },
  ]);

  return shuffleArray(cards);
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

export default function MemoryGame({ setCurrentView }) {
  const [difficulty, setDifficulty] = useState("gentle");
  const [cards, setCards] = useState(() => createCards("gentle"));
  const [selectedCards, setSelectedCards] = useState([]);
  const [matches, setMatches] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);

  // States: 'start' | 'playing' | 'completed'
  const [gameState, setGameState] = useState("start");
  const [isChecking, setIsChecking] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState("Tap any card to turn it over.");
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState("idle"); // 'idle' | 'saving' | 'saved' | 'offline'

  const totalPairs = useMemo(
    () => DIFFICULTY_CONFIG[difficulty]?.pairs || 3,
    [difficulty]
  );

  // Accurate scoring & performance calculation
  const accuracy = useMemo(() => {
    if (attempts === 0) return 100;
    return Math.min(100, Math.round((matches / attempts) * 100));
  }, [matches, attempts]);

  const score = useMemo(() => {
    // Score based on completed matches with accuracy bonus and speed consideration
    const base = matches * 25;
    const accuracyBonus = Math.round(accuracy * 0.25);
    const speedBonus = elapsedTime > 0 && elapsedTime < 45 ? 10 : 5;
    return Math.min(100, Math.max(25, base + accuracyBonus + speedBonus));
  }, [matches, accuracy, elapsedTime]);

  const performanceLevel = useMemo(() => {
    if (accuracy >= 85) return "Exceptional Memory";
    if (accuracy >= 70) return "Strong Focus";
    if (accuracy >= 55) return "Steady Recall";
    return "Gentle Exercise";
  }, [accuracy]);

  // Timer: active only during 'playing' state
  useEffect(() => {
    if (gameState !== "playing") return;
    const interval = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [gameState]);

  // Handle completion when all pairs are matched
  useEffect(() => {
    if (gameState !== "playing") return;
    if (matches === totalPairs && totalPairs > 0) {
      handleGameComplete();
    }
  }, [matches, totalPairs, gameState]);

  const handleGameComplete = async () => {
    setGameState("completed");
    setFeedbackMessage("Wonderful! You found all the matching pairs.");

    const finalResult = {
      gameId: "memory-match",
      game: "Memory Game",
      score,
      total: totalPairs,
      accuracy,
      performanceLevel,
      attempts,
      moves: attempts,
      hintsUsed,
      mistakes: Math.max(0, attempts - matches),
      elapsedTime,
      difficulty,
      category: "memory",
      completedAt: new Date().toISOString(),
    };

    // Save to local storage for immediate offline / refresh availability
    localStorage.setItem("smriti-last-game-result", JSON.stringify(finalResult));
    try {
      const prev = JSON.parse(localStorage.getItem("smriti-game-history") || "[]");
      localStorage.setItem("smriti-game-history", JSON.stringify([finalResult, ...prev].slice(0, 20)));
    } catch (e) {
      console.warn("Local storage error:", e);
    }

    // Persist to backend
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
  console.warn("Could not save activity to server, stored offline:", err);
  setSaveStatus("offline");
}
    
  };

  const handleStartGame = (selectedDiff = difficulty) => {
    setDifficulty(selectedDiff);
    setCards(createCards(selectedDiff));
    setSelectedCards([]);
    setMatches(0);
    setAttempts(0);
    setHintsUsed(0);
    setElapsedTime(0);
    setIsChecking(false);
    setSaveStatus("idle");
    setFeedbackMessage("Find the matching pairs. Take your time.");
    setGameState("playing");
  };

  const handleCardClick = (index) => {
    if (isChecking || gameState !== "playing") return;
    const card = cards[index];
    if (!card || card.flipped || card.matched) return;
    if (selectedCards.includes(index)) return;

    // Flip card
    const updatedCards = [...cards];
    updatedCards[index] = { ...updatedCards[index], flipped: true };
    setCards(updatedCards);

    const newSelected = [...selectedCards, index];
    setSelectedCards(newSelected);

    if (newSelected.length !== 2) return;

    // Check pair
    setIsChecking(true);
    setAttempts((prev) => prev + 1);

    const [firstIdx, secondIdx] = newSelected;
    const firstCard = updatedCards[firstIdx];
    const secondCard = updatedCards[secondIdx];

    if (firstCard.pairId === secondCard.pairId) {
      // Match found!
      setTimeout(() => {
        setCards((prev) =>
          prev.map((c, i) =>
            i === firstIdx || i === secondIdx ? { ...c, matched: true, flipped: true } : c
          )
        );
        setMatches((prev) => prev + 1);
        setSelectedCards([]);
        setIsChecking(false);
        setFeedbackMessage(`Great match! You found ${firstCard.name}.`);
      }, 500);
    } else {
      // No match
      setTimeout(() => {
        setCards((prev) =>
          prev.map((c, i) =>
            i === firstIdx || i === secondIdx ? { ...c, flipped: false } : c
          )
        );
        setSelectedCards([]);
        setIsChecking(false);
        setFeedbackMessage("Not a match yet. That’s okay — try another pair.");
      }, 1000);
    }
  };

  const handleUseHint = () => {
    if (gameState !== "playing" || isChecking || selectedCards.length > 0) return;
    const unmatched = cards
      .map((c, i) => ({ ...c, index: i }))
      .filter((c) => !c.matched && !c.flipped);

    const grouped = unmatched.reduce((acc, c) => {
      acc[c.pairId] = acc[c.pairId] || [];
      acc[c.pairId].push(c);
      return acc;
    }, {});

    const pair = Object.values(grouped).find((arr) => arr.length >= 2);
    if (!pair) return;

    const indices = [pair[0].index, pair[1].index];
    setHintsUsed((prev) => prev + 1);
    setIsChecking(true);

    setCards((prev) =>
      prev.map((c, i) => (indices.includes(i) ? { ...c, flipped: true } : c))
    );
    setFeedbackMessage("Here’s a helpful glimpse! Look carefully.");

    setTimeout(() => {
      setCards((prev) =>
        prev.map((c, i) => (indices.includes(i) && !c.matched ? { ...c, flipped: false } : c))
      );
      setIsChecking(false);
    }, 1400);
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
            Memory Match
          </h1>

          <p className="text-lg text-gray-600 mt-2 max-w-xl mx-auto">
            A gentle card game to keep your memory sharp and active.
          </p>

          {/* Simple 3-step explanation */}
          <div className="mt-8 grid sm:grid-cols-3 gap-4 text-left">
            <div className="bg-[#f8faf9] p-4 rounded-2xl border border-stone-200/60">
              <div className="w-8 h-8 rounded-full bg-[#0f3e3a] text-white flex items-center justify-center font-bold text-sm mb-2">
                1
              </div>
              <p className="font-bold text-[#0f3e3a] text-sm">Turn Cards</p>
              <p className="text-xs text-gray-600 mt-1">
                Tap two cards at a time to see their hidden pictures.
              </p>
            </div>

            <div className="bg-[#f8faf9] p-4 rounded-2xl border border-stone-200/60">
              <div className="w-8 h-8 rounded-full bg-[#0f3e3a] text-white flex items-center justify-center font-bold text-sm mb-2">
                2
              </div>
              <p className="font-bold text-[#0f3e3a] text-sm">Match Pairs</p>
              <p className="text-xs text-gray-600 mt-1">
                Find matching pairs like two birds or two warm cups of chai.
              </p>
            </div>

            <div className="bg-[#f8faf9] p-4 rounded-2xl border border-stone-200/60">
              <div className="w-8 h-8 rounded-full bg-[#0f3e3a] text-white flex items-center justify-center font-bold text-sm mb-2">
                3
              </div>
              <p className="font-bold text-[#0f3e3a] text-sm">Relaxed Pace</p>
              <p className="text-xs text-gray-600 mt-1">
                No time pressure. Take as long as you wish for each move.
              </p>
            </div>
          </div>

          {/* Choose difficulty */}
          <div className="mt-8 text-left">
            <label className="block text-sm font-bold text-gray-800 mb-3">
              Choose Card Count:
            </label>
            <div className="grid sm:grid-cols-3 gap-3">
              {Object.entries(DIFFICULTY_CONFIG).map(([key, config]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setDifficulty(key)}
                  className={`p-4 rounded-2xl border-2 text-left transition ${
                    difficulty === key
                      ? "border-[#0f3e3a] bg-[#eef6f3] shadow-sm"
                      : "border-stone-200 bg-white hover:border-stone-300"
                  }`}
                >
                  <p className="font-bold text-gray-900">{config.label}</p>
                  <p className="text-xs text-gray-500 mt-1">{config.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => handleStartGame(difficulty)}
              className="w-full sm:w-auto px-10 py-4 rounded-2xl bg-[#0f3e3a] text-white font-bold text-lg flex items-center justify-center gap-3 hover:bg-[#0c312e] shadow-md transition"
            >
              <Play size={22} className="fill-white" />
              Start Memory Game
            </button>

            <button
              onClick={() =>
                speakInstruction(
                  "Welcome to Memory Match. Tap two cards at a time to find matching pairs. Take all the time you need."
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
  // VIEW 2: COMPLETION / RESULT SCREEN
  // ==========================================================
  if (gameState === "completed") {
    return (
      <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-300">
        <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-6 sm:p-10 text-center">
          <div className="w-20 h-20 mx-auto rounded-full bg-emerald-50 text-[#0f3e3a] flex items-center justify-center mb-3">
            <Trophy size={42} />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-3">
            <Sparkles size={14} />
            {performanceLevel}
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0f3e3a]">
            Wonderful Work, Asha!
          </h1>

          <p className="text-gray-600 mt-2 text-base">
            You successfully matched all {totalPairs} pairs today.
          </p>

          {/* 4 Primary Results */}
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
              <p className="text-[11px] text-gray-400">{attempts} attempts</p>
            </div>

            <div className="bg-[#f8faf9] rounded-2xl border border-stone-200 p-4">
              <p className="text-xs font-bold uppercase text-gray-500">Time Taken</p>
              <p className="text-3xl font-extrabold text-[#0f3e3a] mt-1">
                {formatTime(elapsedTime)}
              </p>
              <p className="text-[11px] text-gray-400">elapsed</p>
            </div>

            <div className="bg-[#f8faf9] rounded-2xl border border-stone-200 p-4">
              <p className="text-xs font-bold uppercase text-gray-500">Pairs Found</p>
              <p className="text-3xl font-extrabold text-[#0f3e3a] mt-1">
                {matches}/{totalPairs}
              </p>
              <p className="text-[11px] text-gray-400">all completed</p>
            </div>
          </div>

          {/* Clinical & Caregiver Synchronization Notice */}
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
              onClick={() => handleStartGame(difficulty)}
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
  // VIEW 3: ACTIVE GAMEPLAY SCREEN
  // ==========================================================
  const gridClass = DIFFICULTY_CONFIG[difficulty]?.gridCols || "grid-cols-2 sm:grid-cols-4";

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Top Navigation & Audio */}
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
            Memory Match
          </h1>
        </div>

        <button
          onClick={() =>
            speakInstruction("Find two matching cards. Take all the time you need.")
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
          <p className="text-xs font-bold uppercase text-gray-400">Pairs Found</p>
          <p className="text-xl sm:text-2xl font-black text-[#0f3e3a] mt-1">
            {matches} / {totalPairs}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 p-3 sm:p-4 text-center shadow-xs">
          <p className="text-xs font-bold uppercase text-gray-400">Tries Taken</p>
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

      {/* Visual Progress Bar */}
      <div className="w-full bg-stone-200 h-2.5 rounded-full overflow-hidden">
        <div
          className="bg-[#0f3e3a] h-full transition-all duration-500 rounded-full"
          style={{ width: `${(matches / totalPairs) * 100}%` }}
        />
      </div>

      {/* Gentle Feedback Message */}
      <div
        className={`rounded-2xl px-5 py-3 text-center transition-all ${
          feedbackMessage.includes("Not")
            ? "bg-amber-50 text-amber-900 border border-amber-200"
            : feedbackMessage.includes("Great") || feedbackMessage.includes("Wonderful")
            ? "bg-emerald-50 text-emerald-900 border border-emerald-200"
            : "bg-white text-[#0f3e3a] border border-stone-200"
        }`}
      >
        <p className="text-base font-semibold">{feedbackMessage}</p>
      </div>

      {/* CARDS GRID */}
      <div className={`grid ${gridClass} gap-4 sm:gap-5`}>
        {cards.map((card, index) => {
          const isFlipped = card.flipped || card.matched;

          return (
            <button
              key={card.cardId}
              type="button"
              onClick={() => handleCardClick(index)}
              disabled={isFlipped || isChecking}
              aria-label={isFlipped ? card.name : `Card number ${index + 1}`}
              className={`min-h-[130px] sm:min-h-[150px] rounded-3xl p-3 sm:p-4 flex flex-col items-center justify-center transition-all duration-300 transform select-none ${
                card.matched
                  ? "bg-emerald-50/90 border-2 border-emerald-400 opacity-90 cursor-default"
                  : isFlipped
                  ? "bg-white border-2 border-[#0f3e3a] shadow-md scale-102"
                  : "bg-gradient-to-b from-[#f3f8f6] to-[#e6f1ed] border-2 border-stone-200 hover:border-[#0f3e3a] hover:shadow-md active:scale-98 cursor-pointer"
              }`}
            >
              {isFlipped ? (
                <>
                  <span className="text-5xl sm:text-6xl animate-in zoom-in-75 duration-200">
                    {card.icon}
                  </span>
                  <span className="text-sm font-bold text-gray-800 mt-2">
                    {card.name}
                  </span>
                  {card.matched && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 mt-1">
                      <CheckCircle2 size={13} /> Matched
                    </span>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-white/70 border border-stone-200 flex items-center justify-center text-[#0f3e3a] font-black text-xl">
                    ?
                  </div>
                  <span className="text-xs text-gray-400 font-medium mt-2">
                    Tap to view
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        <button
          type="button"
          onClick={handleUseHint}
          disabled={isChecking}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl border-2 border-stone-200 bg-white text-gray-700 font-bold hover:bg-stone-50 transition"
        >
          <Lightbulb size={18} className="text-amber-500" />
          Give Me a Hint ({hintsUsed} used)
        </button>

        <button
          type="button"
          onClick={() => handleStartGame(difficulty)}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl border-2 border-stone-200 bg-white text-gray-700 font-bold hover:bg-stone-50 transition"
        >
          <RotateCcw size={18} />
          Restart Cards
        </button>
      </div>

      <p className="text-center text-xs text-gray-400 pb-4">
        Take all the time you need. Each move gently exercises your recall.
      </p>
    </div>
  );
}
