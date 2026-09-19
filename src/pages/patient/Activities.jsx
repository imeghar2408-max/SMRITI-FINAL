import React, { useEffect, useState } from "react";
import {
  ArrowRight,
  Brain,
  CalendarClock,
  Eye,
  Layers3,
  Sparkles,
} from "lucide-react";

function Activities({ setCurrentView }) {
  const [recommended, setRecommended] = useState({
    activity: "Memory Match",
    difficulty: "Easy",
    recommendedTime: "5–10 min",
    reason: "A gentle memory activity you can enjoy at your own pace.",
    view: "patient-game",
  });

  useEffect(() => {
    fetch("/api/patient/progress")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.nextRecommended) {
          const rec = data.nextRecommended;
          let view = "patient-game";
          let activityName = rec.activity || "Memory Match";
          if (activityName.toLowerCase().includes("spot") || activityName.toLowerCase().includes("difference")) {
            view = "patient-spot-difference";
            activityName = "Spot the Difference";
          } else if (activityName.toLowerCase().includes("pattern")) {
            view = "patient-pattern-match";
            activityName = "Pattern Match";
          } else if (activityName.toLowerCase().includes("routine")) {
            view = "patient-daily-routine";
            activityName = "Daily Routine";
          } else if (activityName.toLowerCase().includes("family")) {
            view = "patient-family";
            activityName = "Family Memory Recall";
          }

          setRecommended({
            activity: activityName,
            difficulty: rec.difficulty || "Easy",
            recommendedTime: rec.recommendedTime || "5–10 min",
            reason: rec.reason || "Personalized for your cognitive rhythm today.",
            view,
          });
        }
      })
      .catch((err) => console.warn("Could not load recommendations:", err));
  }, []);

  const activities = [
    {
      id: "memory-match",
      title: "Memory Match",
      description: "Flip the cards and find the matching pairs.",
      difficulty: "Easy",
      duration: "5–10 min",
      icon: Brain,
      iconBg: "bg-emerald-50",
      iconColor: "text-[#0f3e3a]",
      view: "patient-game",
      recommended: recommended.view === "patient-game",
    },
    {
      id: "spot-difference",
      title: "Spot the Difference",
      description: "Look carefully and find the changes between two pictures.",
      difficulty: "Easy",
      duration: "5–10 min",
      icon: Eye,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
      view: "patient-spot-difference",
      recommended: recommended.view === "patient-spot-difference",
    },
    {
      id: "pattern-match",
      title: "Pattern Match",
      description: "Choose the shape or color that comes next in the sequence.",
      difficulty: "Easy",
      duration: "5 min",
      icon: Layers3,
      iconBg: "bg-violet-50",
      iconColor: "text-violet-600",
      view: "patient-pattern-match",
      recommended: recommended.view === "patient-pattern-match",
    },
    {
      id: "daily-routine",
      title: "Daily Routine",
      description: "Put everyday activities in the correct order.",
      difficulty: "Easy",
      duration: "5–8 min",
      icon: CalendarClock,
      iconBg: "bg-amber-50",
      iconColor: "text-amber-600",
      view: "patient-daily-routine",
      recommended: recommended.view === "patient-daily-routine",
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Sparkles size={17} className="text-amber-500" />

          <span className="text-xs font-bold uppercase tracking-[0.18em] text-gray-400">
            Keep your mind active
          </span>
        </div>

        <h1 className="text-3xl md:text-4xl font-black text-[#0f3e3a]">
          Choose an Activity
        </h1>

        <p className="text-sm md:text-base text-gray-500 mt-2 max-w-2xl">
          Take your time. Choose an activity that feels comfortable for you
          today.
        </p>
      </div>

      {/* Today's recommendation */}
      <section className="bg-[#edf7f2] border border-emerald-100 rounded-[28px] p-6 md:p-7">
        <div className="flex items-center justify-between gap-4 mb-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0f3e3a]/60">
              Today&apos;s Recommendation
            </p>

            <h2 className="text-xl md:text-2xl font-bold text-[#0f3e3a] mt-1">
              {recommended.activity}
            </h2>
          </div>

          <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-sm">
            <Brain size={24} className="text-[#0f3e3a]" />
          </div>
        </div>

        <p className="text-sm text-gray-600 max-w-2xl leading-relaxed">
          {recommended.reason}
        </p>

        <div className="flex flex-wrap gap-2 mt-4">
          <span className="px-3 py-1.5 rounded-full bg-white text-xs font-semibold text-gray-600">
            {recommended.difficulty}
          </span>

          <span className="px-3 py-1.5 rounded-full bg-white text-xs font-semibold text-gray-600">
            {recommended.recommendedTime}
          </span>

          <span className="px-3 py-1.5 rounded-full bg-white text-xs font-semibold text-gray-600">
            Cognitive Rhythm
          </span>
        </div>

        <button
          onClick={() => setCurrentView(recommended.view)}
          className="mt-6 w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-[#0f3e3a] text-white font-bold flex items-center justify-center gap-2 hover:bg-[#0c312e] transition"
        >
          <span>START {recommended.activity.toUpperCase()}</span>
          <ArrowRight size={18} />
        </button>
      </section>

      {/* Activities */}
      <section>
        <div className="flex items-end justify-between gap-4 mb-5">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900">
              Cognitive Activities
            </h2>

            <p className="text-sm text-gray-400 mt-1">
              More activities can be added here as ANVESHA grows.
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          {activities.map((activity) => {
            const Icon = activity.icon;

            return (
              <div
                key={activity.id}
                className="bg-white rounded-[28px] border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-all"
              >
                {/* Illustration area */}
                <div className="h-40 bg-[#f7faf8] flex items-center justify-center border-b border-gray-100">
                  <div
                    className={`w-20 h-20 rounded-3xl ${activity.iconBg} ${activity.iconColor} flex items-center justify-center`}
                  >
                    <Icon size={38} strokeWidth={1.8} />
                  </div>
                </div>

                {/* Card content */}
                <div className="p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        {activity.title}
                      </h3>

                      {activity.recommended && (
                        <span className="inline-flex mt-2 px-2.5 py-1 rounded-full bg-emerald-50 text-[#0f3e3a] text-[11px] font-bold">
                          Recommended for you
                        </span>
                      )}
                    </div>

                    <div className="flex gap-2 shrink-0">
                      <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold">
                        {activity.difficulty}
                      </span>

                      <span className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 text-[11px] font-bold">
                        {activity.duration}
                      </span>
                    </div>
                  </div>

                  <p className="text-sm text-gray-500 mt-3 leading-relaxed min-h-[42px]">
                    {activity.description}
                  </p>

                  <button
                    onClick={() => setCurrentView(activity.view)}
                    className="w-full mt-5 py-3.5 rounded-2xl bg-[#0f3e3a] text-white font-semibold flex items-center justify-center gap-2 hover:bg-[#0c312e] transition"
                  >
                    <span>START ACTIVITY</span>
                    <ArrowRight size={17} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Future activities */}
      <section className="bg-white rounded-[28px] border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-amber-50 flex items-center justify-center">
            <Sparkles size={20} className="text-amber-500" />
          </div>

          <div>
            <h2 className="font-bold text-gray-900">
              More activities coming soon
            </h2>

            <p className="text-sm text-gray-400 mt-1">
              New memory, attention, recognition and routine activities can be
              added here.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Activities;