import React, { useEffect, useState } from "react";
import {
  Brain,
  Clock,
  ArrowRight,
  CalendarDays,
  Pill,
  Droplets,
  Mic,
  AlertTriangle,
  Heart,
  Sparkles,
  CheckCircle2,
  MapPin,
  Smile,
  Volume2,
  Calendar,
  Bot,
  Play,
  Check,
} from "lucide-react";

function PatientDashboard({ setCurrentView }) {
  const [progress, setProgress] = useState({
    completedToday: 0,
    dailyTarget: 3,
    percentage: 0,
    nextRecommended: {
      activity: "Memory Match",
      difficulty: "Easy",
      reason: "A gentle activity to exercise visual recall and focus at your own relaxed pace.",
      recommendedTime: "5–10 min",
    },
  });

  const [reminders, setReminders] = useState([]);
  const [sosSent, setSosSent] = useState(false);
  const [selectedMood, setSelectedMood] = useState(null);
  const [moodFeedback, setMoodFeedback] = useState("");
  const [completedReminders, setCompletedReminders] = useState({});

  useEffect(() => {
    let mounted = true;

    async function loadDashboardData() {
      try {
        const [progRes, remRes] = await Promise.allSettled([
          fetch("/api/patient/progress").then((r) => (r.ok ? r.json() : null)),
          fetch("/api/patient/reminders").then((r) => (r.ok ? r.json() : null)),
        ]);

        if (!mounted) return;

        if (progRes.status === "fulfilled" && progRes.value) {
          setProgress(progRes.value);
        } else {
          const storedHistory = JSON.parse(
            localStorage.getItem("smriti-game-history") || "[]"
          );
          const completedCount = storedHistory.length;
          setProgress({
            completedToday: Math.min(completedCount, 3),
            dailyTarget: 3,
            percentage: Math.min(100, Math.round((Math.min(completedCount, 3) / 3) * 100)),
            nextRecommended: {
              activity: "Memory Match",
              difficulty: "Easy",
              reason: "A gentle activity to exercise visual recall and focus at your own relaxed pace.",
              recommendedTime: "5–10 min",
            },
          });
        }

        if (remRes.status === "fulfilled" && Array.isArray(remRes.value)) {
          setReminders(remRes.value);
        }
      } catch (err) {
        console.warn("Failed to load patient dashboard data:", err);
      }
    }

    loadDashboardData();

    // Check if mood was recorded today
    try {
      const storedMood = localStorage.getItem("aura-last-mood");
      if (storedMood) {
        setSelectedMood(storedMood);
      }
    } catch {}

    return () => {
      mounted = false;
    };
  }, []);

  const handleSos = async () => {
    try {
      setSosSent(true);
      await fetch("/api/caregiver/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient: "Asha",
          patientId: "P001",
          room: "Rm 402",
          type: "Emergency SOS",
          message: "Emergency SOS button was pressed by Asha in Today's Care.",
          priority: "EMERGENCY",
          icon: "🚨",
        }),
      });
      setTimeout(() => setSosSent(false), 8000);
    } catch (err) {
      console.error("SOS dispatch error:", err);
    }
  };

  const handleMoodSelect = (moodName, phrase) => {
    setSelectedMood(moodName);
    setMoodFeedback(phrase);
    try {
      localStorage.setItem("aura-last-mood", moodName);
      const history = JSON.parse(localStorage.getItem("aura-mood-history") || "[]");
      history.unshift({
        mood: moodName,
        timestamp: new Date().toISOString(),
        note: phrase,
      });
      localStorage.setItem("aura-mood-history", JSON.stringify(history.slice(0, 30)));
    } catch {}
  };

  const toggleReminderCompleted = (id) => {
    setCompletedReminders((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const recommendedActivity = progress.nextRecommended || {
    activity: "Memory Match",
    difficulty: "Easy",
    reason: "A gentle activity to exercise visual recall and focus at your own relaxed pace.",
    recommendedTime: "5–10 min",
  };

  const isSpotDifference =
    recommendedActivity.activity &&
    recommendedActivity.activity.toLowerCase().includes("spot");

  const startRecommendedActivity = () => {
    if (isSpotDifference) {
      setCurrentView("patient-spot-difference");
    } else {
      setCurrentView("patient-game");
    }
  };

  const displayReminders = (
    reminders.length > 0
      ? reminders.slice(0, 3)
      : [
          {
            id: "rem-1",
            title: "Morning Medicine",
            time: "8:00 AM",
            description: "Take 1 blue capsule with water after breakfast",
            type: "Medicine",
          },
          {
            id: "rem-2",
            title: "Hydration Break",
            time: "10:30 AM",
            description: "Drink one glass of fresh water or warm herbal tea",
            type: "Hydration",
          },
          {
            id: "rem-3",
            title: "Gentle Garden Walk",
            time: "4:00 PM",
            description: "Fresh air stroll in the courtyard with nurse Sarah",
            type: "Appointment",
          },
        ]
  ).map((item) => {
    let icon = Pill;
    let iconColor = "text-[#E98B9B]";
    let iconBg = "bg-[#E98B9B]/15";

    if (item.type === "Hydration" || item.title?.toLowerCase().includes("water")) {
      icon = Droplets;
      iconColor = "text-[#6366D8]";
      iconBg = "bg-[#6366D8]/15";
    } else if (
      item.type === "Appointment" ||
      item.title?.toLowerCase().includes("walk") ||
      item.title?.toLowerCase().includes("doctor")
    ) {
      icon = CalendarDays;
      iconColor = "text-[#78CFA3]";
      iconBg = "bg-[#78CFA3]/15";
    }

    return { ...item, icon, iconColor, iconBg };
  });

  const moods = [
    { label: "Peaceful", icon: "🌸", phrase: "Feeling peaceful and at ease." },
    { label: "Happy", icon: "☀️", phrase: "Bright spirits and warm thoughts today." },
    { label: "Quiet", icon: "🕊️", phrase: "Taking time to rest quietly and recharge." },
    { label: "Thoughtful", icon: "🌿", phrase: "Reflecting on pleasant memories." },
    { label: "Tired", icon: "🌙", phrase: "A little tired; resting comfortably." },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* SOS Alert Banner */}
      {sosSent && (
        <div className="bg-[#E98B9B]/15 border border-[#E98B9B]/40 text-[#C7485E] dark:text-[#E98B9B] rounded-2xl p-4 flex items-center justify-between shadow-soft animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E98B9B]/20 flex items-center justify-center shrink-0">
              <AlertTriangle size={20} className="text-[#C7485E] dark:text-[#E98B9B]" />
            </div>
            <div>
              <p className="font-bold text-sm">Emergency Alert Dispatched</p>
              <p className="text-xs opacity-90">
                Dr. Sarah Jenkins and family care team have been alerted. Help is on the way.
              </p>
            </div>
          </div>
          <button
            onClick={() => setSosSent(false)}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white dark:bg-[#1B1D2A] border border-[#E98B9B]/30 hover:bg-[#E98B9B]/10 transition cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 1. GREETING & ORIENTATION */}
      <div className="bg-white dark:bg-[#1B1D2A] border border-[#EAEBF4] dark:border-[#2B2E42] rounded-3xl p-7 md:p-8 shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E8E8FA] dark:bg-[#25283C] text-[#6366D8] dark:text-[#8B8FE8] text-xs font-bold uppercase tracking-wider mb-3">
            <Sparkles size={14} />
            <span>Today's Care Orientation</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-black text-[#202238] dark:text-white tracking-tight flex items-center gap-3">
            <span>Good Morning, Asha</span>
            <span className="text-2xl md:text-4xl">🌸</span>
          </h1>

          <p className="text-base md:text-lg text-[#6B6E85] dark:text-[#9A9DB5] mt-2 font-normal leading-relaxed">
            You are safe and surrounded by care. Let's take today step by step, at your own natural pace.
          </p>
        </div>

        {/* Date & Room Orientation Pill */}
        <div className="bg-[#F7F7FC] dark:bg-[#11121C] border border-[#EAEBF4] dark:border-[#2B2E42] rounded-2xl p-4 md:p-5 text-left md:text-right shrink-0">
          <p className="text-xs font-bold text-[#6366D8] dark:text-[#8B8FE8] uppercase tracking-wider">
            Current Residence
          </p>
          <p className="text-base font-extrabold text-[#202238] dark:text-white mt-0.5">
            Room 402 · Oakwood Suite
          </p>
          <p className="text-xs text-[#6B6E85] dark:text-[#9A9DB5] mt-1">
            Dr. Sarah Jenkins on duty
          </p>
        </div>
      </div>

      {/* 2 & 3. TODAY'S ACTIVITIES & COGNITIVE ACTIVITY */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Highlighted Next Cognitive Activity */}
        <div className="lg:col-span-2 bg-white dark:bg-[#1B1D2A] rounded-3xl border border-[#EAEBF4] dark:border-[#2B2E42] shadow-soft p-7 md:p-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#6366D8] dark:text-[#8B8FE8]">
                  Recommended Cognitive Activity
                </p>
                <h2 className="text-2xl md:text-3xl font-extrabold text-[#202238] dark:text-white mt-1">
                  {recommendedActivity.activity}
                </h2>
              </div>

              <div className="w-12 h-12 rounded-2xl bg-[#E8E8FA] dark:bg-[#25283C] text-[#6366D8] dark:text-[#8B8FE8] flex items-center justify-center shrink-0">
                <Brain size={26} />
              </div>
            </div>

            <p className="text-base text-[#6B6E85] dark:text-[#9A9DB5] leading-relaxed mb-6">
              {recommendedActivity.reason}
            </p>

            {/* Badges */}
            <div className="flex flex-wrap gap-2.5 mb-6">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#F7F7FC] dark:bg-[#11121C] border border-[#EAEBF4] dark:border-[#2B2E42] text-xs font-semibold text-[#202238] dark:text-[#EDEFFF]">
                <Clock size={14} className="text-[#6366D8]" />
                {recommendedActivity.recommendedTime || "5–10 min"}
              </span>

              <span className="px-3.5 py-1.5 rounded-full bg-[#F7F7FC] dark:bg-[#11121C] border border-[#EAEBF4] dark:border-[#2B2E42] text-xs font-semibold text-[#202238] dark:text-[#EDEFFF] capitalize">
                {recommendedActivity.difficulty || "Easy"} Level
              </span>

              <span className="px-3.5 py-1.5 rounded-full bg-[#78CFA3]/15 border border-[#78CFA3]/30 text-xs font-semibold text-[#2E7D56] dark:text-[#78CFA3]">
                Zero Pressure · No Timers
              </span>
            </div>
          </div>

          {/* Large touch button */}
          <button
            onClick={startRecommendedActivity}
            className="w-full py-4 rounded-2xl bg-[#6366D8] hover:bg-[#5255C5] text-white font-bold text-base md:text-lg flex items-center justify-center gap-3 transition-all duration-200 shadow-soft-lg hover:-translate-y-0.5 cursor-pointer"
          >
            <span>Start {recommendedActivity.activity}</span>
            <ArrowRight size={20} />
          </button>
        </div>

        {/* Daily Activity Progress */}
        <div className="bg-white dark:bg-[#1B1D2A] rounded-3xl border border-[#EAEBF4] dark:border-[#2B2E42] shadow-soft p-7 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#6B6E85] dark:text-[#9A9DB5]">
                  Today's Progress
                </p>
                <h3 className="text-xl font-bold text-[#202238] dark:text-white mt-0.5">
                  Daily Rhythm
                </h3>
              </div>
              <span className="text-2xl font-black text-[#6366D8] dark:text-[#8B8FE8]">
                {progress.completedToday} / {progress.dailyTarget || 3}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="mt-4 mb-5">
              <div className="h-3.5 rounded-full bg-[#E8E8FA] dark:bg-[#25283C] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#6366D8] transition-all duration-500"
                  style={{
                    width: `${Math.min(
                      100,
                      progress.percentage ??
                        Math.round(((progress.completedToday || 0) / 3) * 100)
                    )}%`,
                  }}
                />
              </div>
            </div>

            <p className="text-sm font-semibold text-[#202238] dark:text-white leading-relaxed">
              {progress.completedToday >= (progress.dailyTarget || 3)
                ? "🌟 Wonderful achievement! You reached your daily goal."
                : progress.completedToday === 0
                ? "🌱 Take your time to begin whenever you feel ready."
                : "🌿 You are doing wonderfully today. Keep going at your own comfort."}
            </p>
          </div>

          <div className="mt-6 pt-5 border-t border-[#EAEBF4] dark:border-[#2B2E42] flex items-center justify-between">
            <span className="text-xs text-[#6B6E85] dark:text-[#9A9DB5]">All 4 Activities</span>
            <button
              onClick={() => setCurrentView("patient-activities")}
              className="text-xs font-bold text-[#6366D8] dark:text-[#8B8FE8] hover:underline flex items-center gap-1"
            >
              <span>Browse All</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* 4. MEDICATION & ROUTINE REMINDERS */}
      <div className="bg-white dark:bg-[#1B1D2A] rounded-3xl border border-[#EAEBF4] dark:border-[#2B2E42] shadow-soft p-7 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-[#6366D8] dark:text-[#8B8FE8]" />
              <h2 className="text-xl md:text-2xl font-bold text-[#202238] dark:text-white">
                Medication &amp; Daily Schedule
              </h2>
            </div>
            <p className="text-xs md:text-sm text-[#6B6E85] dark:text-[#9A9DB5] mt-1">
              Gentle reminders scheduled for you today
            </p>
          </div>

          <button
            onClick={() => setCurrentView("patient-reminders")}
            className="text-xs md:text-sm font-bold text-[#6366D8] dark:text-[#8B8FE8] hover:underline"
          >
            View Full Day →
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {displayReminders.map((item) => {
            const Icon = item.icon;
            const isDone = !!completedReminders[item.id];

            return (
              <div
                key={item.id}
                className={`rounded-2xl border p-5 transition-all duration-200 flex flex-col justify-between ${
                  isDone
                    ? "bg-[#78CFA3]/10 border-[#78CFA3]/30 opacity-75"
                    : "bg-[#F7F7FC] dark:bg-[#11121C] border-[#EAEBF4] dark:border-[#2B2E42] hover:shadow-xs"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-11 h-11 rounded-2xl ${item.iconBg} ${item.iconColor} flex items-center justify-center`}>
                      <Icon size={20} />
                    </div>
                    <span className="text-sm font-extrabold text-[#6366D8] dark:text-[#8B8FE8]">
                      {item.time}
                    </span>
                  </div>

                  <h3 className={`font-bold text-base ${isDone ? "line-through text-[#6B6E85]" : "text-[#202238] dark:text-white"}`}>
                    {item.title}
                  </h3>

                  <p className="text-xs text-[#6B6E85] dark:text-[#9A9DB5] mt-1.5 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-[#EAEBF4] dark:border-[#2B2E42] flex items-center justify-between">
                  <button
                    onClick={() => toggleReminderCompleted(item.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                      isDone
                        ? "bg-[#78CFA3] text-white"
                        : "bg-white dark:bg-[#1B1D2A] border border-[#EAEBF4] dark:border-[#2B2E42] text-[#202238] dark:text-white hover:border-[#6366D8]"
                    }`}
                  >
                    <Check size={14} />
                    <span>{isDone ? "Completed" : "Mark as Taken"}</span>
                  </button>

                  <span className="text-[11px] text-[#6B6E85] dark:text-[#9A9DB5]">
                    {item.type}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. MOOD CHECK-IN */}
      <div className="bg-white dark:bg-[#1B1D2A] rounded-3xl border border-[#EAEBF4] dark:border-[#2B2E42] shadow-soft p-7 md:p-8">
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="flex items-center gap-2">
              <Smile size={20} className="text-[#6366D8] dark:text-[#8B8FE8]" />
              <h2 className="text-xl md:text-2xl font-bold text-[#202238] dark:text-white">
                How Are You Feeling Right Now?
              </h2>
            </div>
            <p className="text-xs md:text-sm text-[#6B6E85] dark:text-[#9A9DB5] mt-1">
              Tap any face to record your comfort. Your care team is here for you.
            </p>
          </div>

          <button
            onClick={() => setCurrentView("patient-mood")}
            className="text-xs font-bold text-[#6366D8] dark:text-[#8B8FE8] hover:underline"
          >
            Mood History →
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {moods.map((m) => {
            const isCurrent = selectedMood === m.label;
            return (
              <button
                key={m.label}
                type="button"
                onClick={() => handleMoodSelect(m.label, m.phrase)}
                className={`p-4 rounded-2xl border text-center transition-all duration-200 cursor-pointer flex flex-col items-center justify-center gap-2 ${
                  isCurrent
                    ? "bg-[#6366D8] text-white border-[#6366D8] shadow-soft scale-102"
                    : "bg-[#F7F7FC] dark:bg-[#11121C] border-[#EAEBF4] dark:border-[#2B2E42] text-[#202238] dark:text-white hover:border-[#6366D8]/50 hover:bg-[#E8E8FA]/30"
                }`}
              >
                <span className="text-3xl">{m.icon}</span>
                <span className="text-sm font-bold">{m.label}</span>
              </button>
            );
          })}
        </div>

        {moodFeedback && (
          <div className="mt-4 p-3.5 rounded-2xl bg-[#E8E8FA] dark:bg-[#25283C] text-xs font-semibold text-[#6366D8] dark:text-[#8B8FE8] flex items-center gap-2 animate-in fade-in">
            <span>✨</span>
            <span>Recorded: {moodFeedback} Thank you for sharing with us.</span>
          </div>
        )}
      </div>

      {/* 6 & 7. MEMORIES & AI COMPANION */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Family Memories Preview */}
        <div
          onClick={() => setCurrentView("patient-family")}
          className="group bg-white dark:bg-[#1B1D2A] rounded-3xl border border-[#EAEBF4] dark:border-[#2B2E42] shadow-soft p-7 flex flex-col justify-between hover:shadow-soft-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-11 h-11 rounded-2xl bg-[#E98B9B]/15 text-[#E98B9B] flex items-center justify-center">
                <Heart size={22} />
              </div>
              <span className="text-xs font-bold text-[#E98B9B] uppercase tracking-wider">
                Family Album
              </span>
            </div>

            {/* Photo preview */}
            <div className="relative h-40 rounded-2xl overflow-hidden bg-[#F7F7FC] dark:bg-[#11121C] mb-4 border border-[#EAEBF4] dark:border-[#2B2E42]">
              <img
                src="/uploads/memories/memory-P001-1789906017999-828574790.jpg"
                alt="Family Memory"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                onError={(e) => {
                  e.currentTarget.src = "/hero-illustration.svg";
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-3 left-3 text-white text-xs font-medium">
                Priya (Daughter) &amp; Grandchildren
              </div>
            </div>

            <h3 className="text-xl font-bold text-[#202238] dark:text-white group-hover:text-[#6366D8] dark:group-hover:text-[#8B8FE8] transition-colors">
              Cherished Family Memories
            </h3>
            <p className="text-xs md:text-sm text-[#6B6E85] dark:text-[#9A9DB5] mt-1.5 leading-relaxed">
              Listen to audio stories recorded by your family and see familiar photos.
            </p>
          </div>

          <div className="mt-5 pt-4 border-t border-[#EAEBF4] dark:border-[#2B2E42] flex items-center justify-between text-xs font-bold text-[#6366D8] dark:text-[#8B8FE8]">
            <span>OPEN MEMORY ALBUM</span>
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Talk to Anvesha Voice Companion */}
        <div
          onClick={() => setCurrentView("patient-smriti")}
          className="group bg-gradient-to-br from-[#E8E8FA] to-white dark:from-[#25283C] dark:to-[#1B1D2A] rounded-3xl border border-[#6366D8]/30 shadow-soft p-7 flex flex-col justify-between hover:shadow-soft-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-11 h-11 rounded-2xl bg-[#6366D8] text-white flex items-center justify-center shadow-soft">
                <Mic size={22} />
              </div>
              <span className="text-xs font-bold text-[#6366D8] dark:text-[#8B8FE8] uppercase tracking-wider">
                Voice Assistant
              </span>
            </div>

            <div className="h-40 rounded-2xl bg-white/70 dark:bg-[#1B1D2A]/70 border border-[#EAEBF4] dark:border-[#2B2E42] p-5 mb-4 flex flex-col justify-center items-center text-center">
              <div className="w-14 h-14 rounded-full bg-[#6366D8]/10 text-[#6366D8] dark:text-[#8B8FE8] flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <Bot size={28} />
              </div>
              <p className="text-xs font-bold text-[#202238] dark:text-white">
                "Ask me anything, Asha"
              </p>
              <p className="text-[11px] text-[#6B6E85] dark:text-[#9A9DB5] mt-0.5">
                Stories, reminders, or peaceful conversations
              </p>
            </div>

            <h3 className="text-xl font-bold text-[#202238] dark:text-white group-hover:text-[#6366D8] dark:group-hover:text-[#8B8FE8] transition-colors">
              Talk to Anvesha
            </h3>
            <p className="text-xs md:text-sm text-[#6B6E85] dark:text-[#9A9DB5] mt-1.5 leading-relaxed">
              A companion ready to listen patiently, reminisce, and speak in your preferred language.
            </p>
          </div>

          <div className="mt-5 pt-4 border-t border-[#EAEBF4] dark:border-[#2B2E42] flex items-center justify-between text-xs font-bold text-[#6366D8] dark:text-[#8B8FE8]">
            <span>START VOICE CONVERSATION</span>
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>

      {/* QUICK ASSISTANCE CARDS */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Location Sharing */}
        <button
          onClick={() => setCurrentView("patient-location")}
          className="p-5 rounded-2xl bg-white dark:bg-[#1B1D2A] border border-[#EAEBF4] dark:border-[#2B2E42] text-left hover:border-[#6366D8] transition shadow-xs flex items-center justify-between cursor-pointer"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-[#78CFA3]/15 text-[#2E7D56] dark:text-[#78CFA3] flex items-center justify-center">
              <MapPin size={22} />
            </div>
            <div>
              <p className="font-bold text-sm text-[#202238] dark:text-white">Location Sharing</p>
              <p className="text-xs text-[#6B6E85] dark:text-[#9A9DB5]">Connected with family &amp; caregiver</p>
            </div>
          </div>
          <ArrowRight size={16} className="text-[#6B6E85]" />
        </button>

        {/* Emergency SOS Button */}
        <button
          onClick={handleSos}
          className="p-5 rounded-2xl bg-[#E98B9B]/10 border border-[#E98B9B]/30 text-left hover:bg-[#E98B9B]/20 transition shadow-xs flex items-center justify-between cursor-pointer"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-[#E98B9B] text-white flex items-center justify-center">
              <AlertTriangle size={22} />
            </div>
            <div>
              <p className="font-bold text-sm text-[#C7485E] dark:text-[#E98B9B]">Emergency Help Call</p>
              <p className="text-xs text-[#C7485E]/80 dark:text-[#E98B9B]/80">Instant alert to Dr. Sarah Jenkins</p>
            </div>
          </div>
          <ArrowRight size={16} className="text-[#C7485E] dark:text-[#E98B9B]" />
        </button>
      </div>

      {/* Gentle Footer Message */}
      <div className="text-center py-4 text-xs text-[#6B6E85] dark:text-[#9A9DB5]">
        <span>You are doing wonderful today, Asha</span>
        <span className="text-[#E98B9B] ml-1.5">♡</span>
      </div>
    </div>
  );
}

export default PatientDashboard;
