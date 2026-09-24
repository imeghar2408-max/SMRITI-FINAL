import React, { useEffect, useMemo, useState } from "react";
import {
  Heart,
  Smile,
  Meh,
  Frown,
  Mic,
  Volume2,
  Calendar,
  Sparkles,
  CheckCircle2,
  Trash2,
  X,
} from "lucide-react";

const moods = [
  {
    id: "happy",
    label: "Happy",
    emoji: "😊",
    description: "Feeling cheerful",
  },
  {
    id: "calm",
    label: "Calm",
    emoji: "🌸",
    description: "Feeling peaceful",
  },
  {
    id: "okay",
    label: "Okay",
    emoji: "🙂",
    description: "Feeling alright",
  },
  {
    id: "sad",
    label: "Sad",
    emoji: "😔",
    description: "Feeling a little low",
  },
  {
    id: "worried",
    label: "Worried",
    emoji: "😟",
    description: "Feeling concerned",
  },
];

const reasons = [
  "Family",
  "Friends",
  "Memory activity",
  "Music",
  "Food",
  "Rest",
  "Something else",
];

function getToday() {
  return new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function speak(text) {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.85;

    window.speechSynthesis.speak(utterance);
  }
}

function getMoodScore(moodId) {
  const scores = {
    happy: 5,
    calm: 4,
    okay: 3,
    sad: 2,
    worried: 2,
  };

  return scores[moodId] || 3;
}

export default function Mood() {
  const [selectedMood, setSelectedMood] = useState("");
  const [selectedReason, setSelectedReason] = useState("");
  const [note, setNote] = useState("");

  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem("aura-mood-history");
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed.map((item, idx) => ({
          ...item,
          id: item.id || `local-mood-${idx}-${item.timestamp || idx}`,
        }));
      }
      return [];
    } catch {
      return [];
    }
  });

  const [savedMessage, setSavedMessage] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [memoryMood, setMemoryMood] = useState("");
  const [showMemoryPrompt, setShowMemoryPrompt] = useState(true);

  useEffect(() => {
    fetch("/api/patient/mood")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        let list = [];
        if (Array.isArray(data)) {
          list = data;
        } else if (data && Array.isArray(data.logs)) {
          list = data.logs;
        }
        if (list.length > 0) {
          setHistory(
            list.map((item, idx) => ({
              ...item,
              id: item.id || `server-mood-${idx}-${item.timestamp || idx}`,
            }))
          );
        }
      })
      .catch((err) => console.warn("Failed to load mood history:", err));
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("aura-mood-history", JSON.stringify(history));
    } catch {}
  }, [history]);

  const saveMood = async () => {
    if (!selectedMood) return;

    const newEntry = {
      id: `mood-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      mood: selectedMood,
      reason: selectedReason || "General feeling",
      note: note || "",
      date: getToday(),
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      score: getMoodScore(selectedMood),
      timestamp: new Date().toISOString(),
    };

    setHistory((prev) => [newEntry, ...prev]);

    try {
      await fetch("/api/patient/mood", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newEntry),
      });
    } catch (err) {
      console.warn("Could not save mood to server:", err);
    }

    setSavedMessage("Your reflection has been gently recorded.");
    setSelectedMood("");
    setSelectedReason("");
    setNote("");

    setTimeout(() => {
      setSavedMessage("");
    }, 4000);
  };

  const averageMood = useMemo(() => {
    if (history.length === 0) return null;
    const total = history.reduce((sum, item) => sum + (item.score || 3), 0);
    const avg = total / history.length;
    if (avg >= 4.2) return "Mostly Positive ☀️";
    if (avg >= 3.2) return "Calm & Stable 🌸";
    return "Needs Gentle Care 🌿";
  }, [history]);

  const moodCounts = useMemo(() => {
    return moods.map((m) => ({
      ...m,
      count: history.filter((h) => h.mood === m.id).length,
    }));
  }, [history]);

  const startVoiceJournal = () => {
    if (
      !("webkitSpeechRecognition" in window) &&
      !("SpeechRecognition" in window)
    ) {
      alert("Voice input is not supported in this browser.");
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.lang = "en-IN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    setIsListening(true);
    recognition.start();

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setNote((current) => (current ? `${current} ${transcript}` : transcript));
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
  };

  const clearHistory = () => {
    setHistory([]);
  };

  const getSuggestion = () => {
    if (!selectedMood) {
      return "Choose your mood to receive a gentle activity suggestion.";
    }
    if (selectedMood === "happy") {
      return "You seem to be having a positive moment. You could revisit a favorite family memory album.";
    }
    if (selectedMood === "calm") {
      return "A calm moment is wonderful for a relaxing memory match game or listening to peaceful music.";
    }
    if (selectedMood === "okay") {
      return "You could try a short pattern activity or talk with your voice companion Anvesha.";
    }
    if (selectedMood === "sad") {
      return "Looking at photos of daughter Priya or listening to familiar family voice recordings can bring comfort.";
    }
    return "A familiar activity, a quiet moment, or talking with Dr. Sarah Jenkins may help you feel supported.";
  };

  return (
    <div className="space-y-7 animate-in fade-in duration-300">
      {/* HEADER */}
      <div>
        <div className="flex items-center gap-2">
          <Heart size={26} className="text-[#6366D8] dark:text-[#8B8FE8]" fill="currentColor" />
          <h1 className="text-3xl font-extrabold text-[#202238] dark:text-white">
            Daily Mood &amp; Well-being
          </h1>
        </div>
        <p className="mt-1 text-sm text-[#6B6E85] dark:text-[#9A9DB5]">
          Take a moment to tell us how you are feeling today.
        </p>
      </div>

      {/* MAIN CHECK-IN */}
      <section className="rounded-3xl border border-[#EAEBF4] dark:border-[#2B2E42] bg-white dark:bg-[#1B1D2A] p-6 shadow-soft">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-[#202238] dark:text-white">
            How are you feeling right now?
          </h2>
          <p className="mt-1 text-xs text-[#6B6E85] dark:text-[#9A9DB5]">
            There is no right or wrong answer. Take your time.
          </p>
        </div>

        {/* MOODS */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {moods.map((mood) => (
            <button
              key={mood.id}
              onClick={() => setSelectedMood(mood.id)}
              className={`rounded-2xl border p-4 text-center transition cursor-pointer ${
                selectedMood === mood.id
                  ? "border-[#6366D8] bg-[#E8E8FA] dark:bg-[#25283C] text-[#6366D8] dark:text-[#8B8FE8] shadow-soft"
                  : "border-[#EAEBF4] dark:border-[#2B2E42] bg-white dark:bg-[#1B1D2A] text-[#202238] dark:text-white hover:border-[#6366D8]/50"
              }`}
            >
              <div className="text-4xl">{mood.emoji}</div>
              <p className="mt-2 text-sm font-bold">{mood.label}</p>
              <p className="mt-1 text-[10px] text-[#6B6E85] dark:text-[#9A9DB5]">
                {mood.description}
              </p>
            </button>
          ))}
        </div>

        {/* REASON */}
        <div className="mt-7">
          <h3 className="mb-3 text-sm font-bold text-[#202238] dark:text-white">
            What made you feel this way?
          </h3>
          <div className="flex flex-wrap gap-2">
            {reasons.map((reason, idx) => (
              <button
                key={`reason-${reason}-${idx}`}
                onClick={() => setSelectedReason(reason)}
                className={`rounded-full border px-4 py-2 text-xs font-semibold transition cursor-pointer ${
                  selectedReason === reason
                    ? "border-[#6366D8] bg-[#6366D8] text-white"
                    : "border-[#EAEBF4] dark:border-[#2B2E42] bg-[#F7F7FC] dark:bg-[#11121C] text-[#6B6E85] dark:text-[#9A9DB5] hover:border-[#6366D8]/40"
                }`}
              >
                {reason}
              </button>
            ))}
          </div>
        </div>

        {/* JOURNAL */}
        <div className="mt-7">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#202238] dark:text-white">
              Want to say more?
            </h3>
            <button
              onClick={startVoiceJournal}
              className="flex items-center gap-2 rounded-xl border border-[#EAEBF4] dark:border-[#2B2E42] px-3.5 py-2 text-xs font-bold text-[#6366D8] dark:text-[#8B8FE8] hover:bg-[#E8E8FA]/40 cursor-pointer"
            >
              <Mic size={15} />
              <span>{isListening ? "Listening..." : "Speak"}</span>
            </button>
          </div>

          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="You can write or speak something about your day..."
            rows={4}
            className="w-full resize-none rounded-2xl border border-[#EAEBF4] dark:border-[#2B2E42] bg-[#F7F7FC] dark:bg-[#11121C] text-[#202238] dark:text-white p-4 text-sm outline-none transition focus:border-[#6366D8]"
          />
        </div>

        {/* SAVE */}
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            onClick={saveMood}
            disabled={!selectedMood}
            className={`flex-1 rounded-2xl py-3.5 text-sm font-bold text-white transition cursor-pointer ${
              selectedMood
                ? "bg-[#6366D8] hover:bg-[#5255C5] shadow-soft"
                : "cursor-not-allowed bg-gray-300 dark:bg-gray-700"
            }`}
          >
            Save Today's Mood Reflection
          </button>

          {savedMessage && (
            <div className="flex items-center gap-2 text-xs font-semibold text-[#78CFA3]">
              <CheckCircle2 size={16} />
              {savedMessage}
            </div>
          )}
        </div>
      </section>

      {/* PERSONALIZED SUGGESTION */}
      <section className="rounded-3xl border border-[#6366D8]/20 bg-[#E8E8FA]/50 dark:bg-[#25283C]/50 p-6 shadow-soft">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white dark:bg-[#1B1D2A] text-[#6366D8] dark:text-[#8B8FE8] shadow-soft">
            <Sparkles size={22} />
          </div>

          <div className="flex-1">
            <h2 className="font-bold text-[#6366D8] dark:text-[#8B8FE8]">
              A Gentle Suggestion
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#202238] dark:text-[#EDEFFF]">
              {getSuggestion()}
            </p>
            <button
              onClick={() => speak(getSuggestion())}
              className="mt-4 flex items-center gap-2 text-xs font-bold text-[#6366D8] dark:text-[#8B8FE8] cursor-pointer hover:underline"
            >
              <Volume2 size={15} />
              <span>Listen Aloud</span>
            </button>
          </div>
        </div>
      </section>

      {/* MEMORY REFLECTION PROMPT */}
      {showMemoryPrompt && (
        <section className="rounded-3xl border border-[#EAEBF4] dark:border-[#2B2E42] bg-white dark:bg-[#1B1D2A] p-6 shadow-soft">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Heart size={18} className="text-[#E98B9B]" />
                <h2 className="font-bold text-[#202238] dark:text-white">
                  How did this memory make you feel?
                </h2>
              </div>
              <p className="mt-1 text-xs text-[#6B6E85] dark:text-[#9A9DB5]">
                A quick reflection after recalling a favorite moment.
              </p>
            </div>
            <button
              onClick={() => setShowMemoryPrompt(false)}
              className="text-[#6B6E85] hover:text-[#202238] dark:hover:text-white"
            >
              <X size={18} />
            </button>
          </div>

          <div className="mt-5 rounded-2xl bg-[#F7F7FC] dark:bg-[#11121C] p-5 border border-[#EAEBF4] dark:border-[#2B2E42]">
            <div className="text-4xl">👨‍👩‍👧‍👦</div>
            <h3 className="mt-2 font-bold text-[#202238] dark:text-white">
              A Family Gathering in Guwahati
            </h3>
            <p className="mt-1 text-xs text-[#6B6E85] dark:text-[#9A9DB5]">
              Remembering laughter and tea with daughter Priya and family.
            </p>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              ["happy", "😊 Happy"],
              ["calm", "🌸 Calm"],
              ["okay", "🙂 Okay"],
              ["sad", "😔 Emotional"],
            ].map(([id, label], idx) => (
              <button
                key={`memory-mood-${id}-${idx}`}
                onClick={() => setMemoryMood(id)}
                className={`rounded-xl border p-3 text-xs font-bold transition cursor-pointer ${
                  memoryMood === id
                    ? "border-[#6366D8] bg-[#E8E8FA] dark:bg-[#25283C] text-[#6366D8] dark:text-[#8B8FE8]"
                    : "border-[#EAEBF4] dark:border-[#2B2E42] bg-white dark:bg-[#1B1D2A] text-[#202238] dark:text-white hover:border-[#6366D8]/50"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {memoryMood && (
            <p className="mt-4 text-xs font-semibold text-[#6366D8] dark:text-[#8B8FE8]">
              Thank you for sharing how that memory made you feel.
            </p>
          )}
        </section>
      )}

      {/* MOOD SUMMARY */}
      <section>
        <div className="mb-4">
          <h2 className="text-lg font-bold text-[#202238] dark:text-white">
            Your Mood Patterns
          </h2>
          <p className="text-xs text-[#6B6E85] dark:text-[#9A9DB5]">
            A simple view of your recorded reflections.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-[#EAEBF4] dark:border-[#2B2E42] bg-white dark:bg-[#1B1D2A] p-5 shadow-soft">
            <p className="text-xs font-semibold text-[#6B6E85] dark:text-[#9A9DB5]">Total Check-ins</p>
            <p className="mt-2 text-3xl font-extrabold text-[#202238] dark:text-white tabular-nums">
              {history.length}
            </p>
            <p className="mt-1 text-[10px] text-[#6B6E85] dark:text-[#9A9DB5]">Reflections recorded</p>
          </div>

          <div className="rounded-2xl border border-[#EAEBF4] dark:border-[#2B2E42] bg-white dark:bg-[#1B1D2A] p-5 shadow-soft">
            <p className="text-xs font-semibold text-[#6B6E85] dark:text-[#9A9DB5]">Average Rhythm</p>
            <p className="mt-2 text-xl font-bold text-[#6366D8] dark:text-[#8B8FE8]">
              {averageMood || "Calm & Stable 🌸"}
            </p>
            <p className="mt-1 text-[10px] text-[#6B6E85] dark:text-[#9A9DB5]">Based on your check-ins</p>
          </div>

          <div className="rounded-2xl border border-[#EAEBF4] dark:border-[#2B2E42] bg-white dark:bg-[#1B1D2A] p-5 shadow-soft">
            <p className="text-xs font-semibold text-[#6B6E85] dark:text-[#9A9DB5]">Latest Mood</p>
            <p className="mt-2 text-3xl">
              {history.length
                ? moods.find((m) => m.id === history[0].mood)?.emoji || "🌸"
                : "🌸"}
            </p>
            <p className="mt-1 text-[10px] text-[#6B6E85] dark:text-[#9A9DB5]">Most recent check-in</p>
          </div>
        </div>
      </section>

      {/* RECENT CHECK-INS */}
      {history.length > 0 && (
        <section className="rounded-3xl border border-[#EAEBF4] dark:border-[#2B2E42] bg-white dark:bg-[#1B1D2A] p-6 shadow-soft">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-[#202238] dark:text-white">Recent Check-ins</h2>
              <p className="mt-0.5 text-xs text-[#6B6E85] dark:text-[#9A9DB5]">Your latest reflections.</p>
            </div>
            <button
              onClick={clearHistory}
              className="flex items-center gap-1 text-xs font-bold text-[#E98B9B] hover:underline"
            >
              <Trash2 size={13} />
              <span>Clear</span>
            </button>
          </div>

          <div className="space-y-3">
            {history.slice(0, 5).map((entry, index) => {
              const m = moods.find((item) => item.id === entry.mood);
              const uniqueKey = entry.id
                ? `history-entry-${entry.id}-${index}`
                : `history-item-${index}-${entry.timestamp || entry.date || "entry"}`;
              return (
                <div
                  key={uniqueKey}
                  className="flex items-center gap-4 rounded-2xl bg-[#F7F7FC] dark:bg-[#11121C] border border-[#EAEBF4] dark:border-[#2B2E42] p-4"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white dark:bg-[#1B1D2A] text-2xl shadow-xs">
                    {m?.emoji || "🌸"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-[#202238] dark:text-white">
                        {m?.label || entry.mood}
                      </p>
                      <span className="text-[10px] text-[#6B6E85] dark:text-[#9A9DB5]">
                        {entry.date} • {entry.time}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-[#6B6E85] dark:text-[#9A9DB5]">
                      Reason: {entry.reason}
                    </p>
                    {entry.note && (
                      <p className="mt-0.5 text-xs italic text-[#202238] dark:text-[#EDEFFF]">
                        "{entry.note}"
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* NON-DIAGNOSTIC NOTICE */}
      <div className="rounded-2xl bg-[#F7F7FC] dark:bg-[#11121C] border border-[#EAEBF4] dark:border-[#2B2E42] p-4 text-center text-xs leading-5 text-[#6B6E85] dark:text-[#9A9DB5]">
        Mood check-ins are for personal reflection and caregiver awareness. They are not medical diagnoses.
      </div>
    </div>
  );
}
