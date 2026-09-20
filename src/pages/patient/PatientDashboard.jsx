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
} from "lucide-react";

function PatientDashboard({ setCurrentView }) {
  const [progress, setProgress] = useState({
    completedToday: 0,
    dailyTarget: 3,
    percentage: 0,
    nextRecommended: {
      activity: "Memory Game",
      difficulty: "Easy",
      reason: "A gentle activity to help keep your mind active today.",
      recommendedTime: "5–10 min",
    },
  });

  const [reminders, setReminders] = useState([]);
  const [sosSent, setSosSent] = useState(false);
  const [loading, setLoading] = useState(true);

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
          // Fallback to localStorage if API unavailable
          const storedHistory = JSON.parse(
            localStorage.getItem("smriti-game-history") || "[]"
          );
          const completedCount = storedHistory.length;
          setProgress({
            completedToday: Math.min(completedCount, 3),
            dailyTarget: 3,
            percentage: Math.min(100, Math.round((Math.min(completedCount, 3) / 3) * 100)),
            nextRecommended: {
              activity: "Memory Game",
              difficulty: "Easy",
              reason: "A gentle activity to help keep your mind active today.",
              recommendedTime: "5–10 min",
            },
          });
        }

        if (remRes.status === "fulfilled" && Array.isArray(remRes.value)) {
          setReminders(remRes.value);
        }
      } catch (err) {
        console.warn("Failed to load dashboard data:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadDashboardData();
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
          type: "Emergency",
          message: "Emergency SOS button was pressed by Asha.",
          priority: "EMERGENCY",
          icon: "🚨",
        }),
      });
      setTimeout(() => setSosSent(false), 8000);
    } catch (err) {
      console.error("SOS dispatch error:", err);
    }
  };

  const getProgressMessage = (count) => {
    if (count === 0) return "Just getting started 🌱";
    if (count === 1) return "Great start! 🌿";
    if (count === 2) return "Almost completed! 🌸";
    return "Daily goal accomplished! 🌟";
  };

  const recommendedActivity = progress.nextRecommended || {
    activity: "Memory Game",
    difficulty: "Easy",
    reason: "A gentle activity to keep your cognitive rhythm active.",
    recommendedTime: "5–10 min",
  };

  const isSpotDifference =
    recommendedActivity.activity &&
    recommendedActivity.activity.toLowerCase().includes("spot");

  const startRecommendedActivity = () => {
    if (isSpotDifference) {
      setCurrentView("patient-spot");
    } else {
      setCurrentView("patient-game");
    }
  };

  // Format upcoming reminders
  const displayReminders = (
    reminders.length > 0
      ? reminders.slice(0, 3)
      : [
          {
            title: "Morning Medicine",
            time: "8:00 AM",
            description: "Take 1 tablet after breakfast",
            type: "Medicine",
          },
          {
            title: "Drink Water",
            time: "10:00 AM",
            description: "Drink one glass of water",
            type: "Hydration",
          },
          {
            title: "Doctor Appointment",
            time: "4:00 PM",
            description: "General consultation",
            type: "Appointment",
          },
        ]
  ).map((item) => {
    let icon = Pill;
    let iconBg = "bg-rose-50";
    let iconColor = "text-rose-500";

    if (item.type === "Hydration" || item.title?.toLowerCase().includes("water")) {
      icon = Droplets;
      iconBg = "bg-blue-50";
      iconColor = "text-blue-500";
    } else if (
      item.type === "Appointment" ||
      item.title?.toLowerCase().includes("doctor")
    ) {
      icon = CalendarDays;
      iconBg = "bg-emerald-50";
      iconColor = "text-emerald-600";
    }

    return { ...item, icon, iconBg, iconColor };
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* =====================================================
          SOS SENT NOTIFICATION
      ====================================================== */}
      {sosSent && (
        <div className="bg-red-50 border border-red-200 text-red-900 rounded-2xl p-4 flex items-center justify-between shadow-sm animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
              <AlertTriangle size={20} className="text-red-600" />
            </div>
            <div>
              <p className="font-bold text-sm">Emergency Alert Dispatched</p>
              <p className="text-xs text-red-700">
                Dr. Sarah Jenkins and family have been notified. Help is on the way.
              </p>
            </div>
          </div>
          <button
            onClick={() => setSosSent(false)}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white border border-red-200 text-red-700 hover:bg-red-50 transition"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* =====================================================
          GREETING
      ====================================================== */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
        <div>
          <p className="text-sm font-medium text-gray-400 mb-1">
            Welcome back, Asha
          </p>

          <h1 className="text-4xl md:text-5xl font-black text-[#0f3e3a] tracking-tight flex items-center gap-2">
            Good Morning, Asha
            <span className="text-pink-500">❤️</span>
          </h1>

          <p className="text-base md:text-lg text-gray-500 mt-2">
            Let&apos;s take today one step at a time.
          </p>
        </div>

        {/* Small date / daily message */}
        <div className="hidden lg:flex items-center gap-3 bg-white border border-gray-100 rounded-2xl px-5 py-3 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
            <Sparkles size={19} className="text-amber-500" />
          </div>

          <div>
            <p className="text-xs text-gray-400">Today</p>
            <p className="text-sm font-semibold text-gray-800">
              A new day, new memories
            </p>
          </div>

          <Heart size={16} className="text-pink-500 ml-1" />
        </div>
      </div>

      {/* =====================================================
          MAIN CONTENT
      ====================================================== */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* ===================================================
            PERSONALIZED PLAN
        ==================================================== */}
        <div className="lg:col-span-2 bg-white rounded-[28px] border border-gray-100 shadow-sm p-7">
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-400">
                Today&apos;s Personalized Plan
              </p>

              <p className="text-sm text-gray-400 mt-1">
                Adaptive AI recommendation
              </p>
            </div>

            <div className="w-11 h-11 rounded-2xl bg-emerald-50 flex items-center justify-center">
              <Sparkles size={20} className="text-[#0f3e3a]" />
            </div>
          </div>

          <div className="rounded-3xl bg-[#f7faf8] border border-gray-100 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-5">
              {/* Activity icon */}
              <div className="w-16 h-16 shrink-0 rounded-2xl bg-[#0f3e3a] text-white flex items-center justify-center">
                <Brain size={30} />
              </div>

              {/* Activity information */}
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900">
                  {recommendedActivity.activity}
                </h2>

                <p className="text-sm text-gray-500 mt-2 max-w-xl leading-relaxed">
                  {recommendedActivity.reason}
                </p>

                <div className="flex flex-wrap gap-2 mt-4">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-gray-100 text-xs font-medium text-gray-600">
                    <Clock size={13} />
                    {recommendedActivity.recommendedTime || "5–10 min"}
                  </span>

                  <span className="px-3 py-1.5 rounded-full bg-white border border-gray-100 text-xs font-medium text-gray-600 capitalize">
                    {recommendedActivity.difficulty || "Easy"} Difficulty
                  </span>

                  <span className="px-3 py-1.5 rounded-full bg-white border border-gray-100 text-xs font-medium text-gray-600">
                    Adaptive recommendation
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={startRecommendedActivity}
              className="w-full mt-6 py-4 rounded-2xl bg-[#0f3e3a] text-white font-bold flex items-center justify-center gap-2 hover:bg-[#0c312e] transition-all"
            >
              <span>START ACTIVITY</span>
              <ArrowRight size={18} />
            </button>
          </div>
        </div>

        {/* ===================================================
            TODAY'S PROGRESS (DYNAMIC)
        ==================================================== */}
        <div className="bg-white rounded-[28px] border border-gray-100 shadow-sm p-7 flex flex-col">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-gray-900">
                Today&apos;s Progress
              </p>

              <p className="text-xs text-gray-400 mt-1">
                Keep going at your own pace.
              </p>
            </div>

            <span className="text-2xl font-black text-[#0f3e3a] whitespace-nowrap">
              {progress.completedToday} / {progress.dailyTarget || 3}
            </span>
          </div>

          {/* Progress bar */}
          <div className="mt-7">
            <div className="h-3 rounded-full bg-gray-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-[#0f3e3a] transition-all duration-500"
                style={{
                  width: `${Math.min(
                    100,
                    progress.percentage ??
                      Math.round(((progress.completedToday || 0) / 3) * 100)
                  )}%`,
                }}
              />
            </div>

            <p className="text-sm font-semibold text-gray-700 mt-4">
              {getProgressMessage(progress.completedToday || 0)}
            </p>

            <p className="text-xs text-gray-400 mt-1 leading-relaxed">
              {progress.completedToday >= (progress.dailyTarget || 3)
                ? "You reached your daily activity goal! Well done."
                : "Complete your activities and daily tasks."}
            </p>
          </div>

          {/* Encouragement card */}
          <div className="mt-auto pt-7">
            <div className="rounded-2xl bg-[#f7faf8] p-5 border border-gray-100">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                  <Heart size={17} className="text-pink-500" />
                </div>

                <p className="text-sm text-gray-600 leading-relaxed italic">
                  &quot;Small steps every day make a big difference.&quot;
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================
          COMING UP
      ====================================================== */}
      <div className="bg-white rounded-[28px] border border-gray-100 shadow-sm p-7">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Coming Up Today
            </h2>

            <p className="text-sm text-gray-400 mt-1">
              Things to remember today
            </p>
          </div>

          <button
            onClick={() => setCurrentView("patient-reminders")}
            className="text-sm font-semibold text-[#0f3e3a] hover:underline"
          >
            View all →
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {displayReminders.map((item, idx) => {
            const Icon = item.icon;

            return (
              <button
                key={item.id || item.title || idx}
                onClick={() => setCurrentView("patient-reminders")}
                className="text-left rounded-2xl border border-gray-100 bg-[#fcfcfb] p-5 hover:shadow-sm hover:border-gray-200 transition-all"
              >
                <div
                  className={`w-11 h-11 rounded-2xl ${item.iconBg} ${item.iconColor} flex items-center justify-center mb-4`}
                >
                  <Icon size={20} />
                </div>

                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-gray-900">
                    {item.title}
                  </h3>
                  {item.completed && (
                    <CheckCircle2 size={16} className="text-emerald-600" />
                  )}
                </div>

                <p className="text-sm font-semibold text-[#0f3e3a] mt-1">
                  {item.time}
                </p>

                <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                  {item.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* =====================================================
          QUICK ACTIONS
      ====================================================== */}
      <div className="grid md:grid-cols-3 gap-5">
        {/* Location Sharing */}
        <button
          onClick={() => setCurrentView("patient-location")}
          className="group text-left bg-teal-50/70 border border-teal-100 rounded-[26px] p-6 hover:shadow-sm transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-teal-700 text-white flex items-center justify-center shrink-0 shadow-xs">
              <MapPin size={24} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h2 className="text-lg font-bold text-gray-900">
                  Location Sharing
                </h2>
              </div>

              <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                Share location with Dr. Sarah Jenkins & family.
              </p>
            </div>

            <ArrowRight
              size={18}
              className="text-teal-700 group-hover:translate-x-1 transition-transform shrink-0"
            />
          </div>
        </button>

        {/* Talk to Anvesha */}
        <button
          onClick={() => setCurrentView("patient-smriti")}
          className="group text-left bg-[#edf7f2] border border-emerald-100 rounded-[26px] p-6 hover:shadow-sm transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-[#0f3e3a] text-white flex items-center justify-center shrink-0 shadow-xs">
              <Mic size={24} />
            </div>

            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-gray-900">
                Talk to Anvesha
              </h2>

              <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                Ask anything. I&apos;m here to help.
              </p>
            </div>

            <ArrowRight
              size={18}
              className="text-[#0f3e3a] group-hover:translate-x-1 transition-transform shrink-0"
            />
          </div>
        </button>

        {/* Emergency SOS */}
        <button
          onClick={handleSos}
          className="group text-left bg-red-50 border border-red-100 rounded-[26px] p-6 hover:shadow-sm transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-red-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <AlertTriangle size={24} />
            </div>

            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-red-700">
                Emergency SOS
              </h2>

              <p className="text-xs text-red-500/80 mt-1 line-clamp-2">
                Alert caregiver & family immediately.
              </p>
            </div>

            <ArrowRight
              size={18}
              className="text-red-500 group-hover:translate-x-1 transition-transform shrink-0"
            />
          </div>
        </button>
      </div>

      {/* =====================================================
          FOOTER
      ====================================================== */}
      <div className="text-center pb-3">
        <p className="text-sm text-gray-400">
          You are doing great, Asha{" "}
          <span className="text-pink-500">♡</span>
        </p>
      </div>
    </div>
  );
}

export default PatientDashboard;
