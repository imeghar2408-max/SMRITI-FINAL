import React, { useEffect, useState } from "react";
import {
  ArrowRight,
  Brain,
  CalendarClock,
  Eye,
  Layers3,
  Sparkles,
  Clock,
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
          if (
            activityName.toLowerCase().includes("spot") ||
            activityName.toLowerCase().includes("difference")
          ) {
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
      description: "Flip the cards and find the matching pairs without any time pressure.",
      difficulty: "Easy",
      duration: "5–10 min",
      image: "/games/memory-match.svg",
      icon: Brain,
      iconBg: "bg-[#6366D8]/15",
      iconColor: "text-[#6366D8] dark:text-[#8B8FE8]",
      view: "patient-game",
      recommended: recommended.view === "patient-game",
    },
    {
      id: "spot-difference",
      title: "Spot the Difference",
      description: "Look carefully and identify the gentle differences between pictures.",
      difficulty: "Easy",
      duration: "5–10 min",
      image: "/games/spot-difference.svg",
      icon: Eye,
      iconBg: "bg-[#78CFA3]/15",
      iconColor: "text-[#2E7D56] dark:text-[#78CFA3]",
      view: "patient-spot-difference",
      recommended: recommended.view === "patient-spot-difference",
    },
    {
      id: "pattern-match",
      title: "Pattern Match",
      description: "Choose the shape or color that comes next in the calming sequence.",
      difficulty: "Easy",
      duration: "5 min",
      image: "/games/pattern-match.svg",
      icon: Layers3,
      iconBg: "bg-[#E8E8FA] dark:bg-[#25283C]",
      iconColor: "text-[#6366D8] dark:text-[#8B8FE8]",
      view: "patient-pattern-match",
      recommended: recommended.view === "patient-pattern-match",
    },
    {
      id: "daily-routine",
      title: "Daily Routine",
      description: "Put everyday activities in a comfortable, familiar sequence.",
      difficulty: "Easy",
      duration: "5–8 min",
      image: "/games/daily-routine.svg",
      icon: CalendarClock,
      iconBg: "bg-[#F3B562]/15",
      iconColor: "text-[#9C6119] dark:text-[#F3B562]",
      view: "patient-daily-routine",
      recommended: recommended.view === "patient-daily-routine",
    },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Sparkles size={16} className="text-[#6366D8] dark:text-[#8B8FE8]" />
          <span className="text-xs font-bold uppercase tracking-wider text-[#6366D8] dark:text-[#8B8FE8]">
            Cognitive Vitality
          </span>
        </div>

        <h1 className="text-3xl md:text-4xl font-extrabold text-[#202238] dark:text-white">
          Choose an Activity
        </h1>

        <p className="text-sm md:text-base text-[#6B6E85] dark:text-[#9A9DB5] mt-1.5 max-w-2xl">
          Take your time. Choose an exercise that feels comfortable for you today.
        </p>
      </div>

      {/* Today's recommendation */}
      <section className="bg-[#E8E8FA]/60 dark:bg-[#25283C]/60 border border-[#6366D8]/20 rounded-3xl p-7 md:p-8 shadow-soft">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#6366D8] dark:text-[#8B8FE8]">
              Today&apos;s Recommendation
            </p>
            <h2 className="text-2xl md:text-3xl font-extrabold text-[#202238] dark:text-white mt-1">
              {recommended.activity}
            </h2>
          </div>

          <div className="w-12 h-12 rounded-2xl bg-white dark:bg-[#1B1D2A] text-[#6366D8] dark:text-[#8B8FE8] flex items-center justify-center shadow-soft shrink-0">
            <Brain size={26} />
          </div>
        </div>

        <p className="text-sm md:text-base text-[#6B6E85] dark:text-[#9A9DB5] max-w-2xl leading-relaxed">
          {recommended.reason}
        </p>

        <div className="flex flex-wrap gap-2.5 mt-5">
          <span className="px-3.5 py-1.5 rounded-full bg-white dark:bg-[#1B1D2A] text-xs font-semibold text-[#202238] dark:text-white border border-[#EAEBF4] dark:border-[#2B2E42]">
            {recommended.difficulty} Level
          </span>

          <span className="px-3.5 py-1.5 rounded-full bg-white dark:bg-[#1B1D2A] text-xs font-semibold text-[#202238] dark:text-white border border-[#EAEBF4] dark:border-[#2B2E42]">
            {recommended.recommendedTime}
          </span>

          <span className="px-3.5 py-1.5 rounded-full bg-[#78CFA3]/15 text-xs font-semibold text-[#2E7D56] dark:text-[#78CFA3] border border-[#78CFA3]/30">
            Gentle Rhythm
          </span>
        </div>

        <button
          onClick={() => setCurrentView(recommended.view)}
          className="mt-6 w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#6366D8] hover:bg-[#5255C5] text-white font-bold flex items-center justify-center gap-2 transition shadow-soft hover:-translate-y-0.5 cursor-pointer"
        >
          <span>START {recommended.activity.toUpperCase()}</span>
          <ArrowRight size={18} />
        </button>
      </section>

      {/* Activities Grid */}
      <section>
        <div className="mb-5">
          <h2 className="text-xl md:text-2xl font-bold text-[#202238] dark:text-white">
            Cognitive Activities
          </h2>
          <p className="text-xs md:text-sm text-[#6B6E85] dark:text-[#9A9DB5] mt-1">
            Carefully calibrated for comfort, visual recall, and motor dexterity.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {activities.map((activity) => {
            const Icon = activity.icon;

            return (
              <div
                key={activity.id}
                className="group bg-white dark:bg-[#1B1D2A] rounded-3xl border border-[#EAEBF4] dark:border-[#2B2E42] shadow-soft overflow-hidden hover:shadow-soft-lg hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  {/* Illustration area */}
                  <div className="relative h-48 bg-[#F7F7FC] dark:bg-[#11121C] overflow-hidden border-b border-[#EAEBF4] dark:border-[#2B2E42] flex items-center justify-center p-6">
                    <img
                      src={activity.image}
                      alt={activity.title}
                      referrerPolicy="no-referrer"
                      className="max-h-36 max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3.5 right-3.5">
                      <div
                        className={`w-10 h-10 rounded-2xl ${activity.iconBg} ${activity.iconColor} flex items-center justify-center shadow-xs`}
                      >
                        <Icon size={20} />
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-xl font-bold text-[#202238] dark:text-white group-hover:text-[#6366D8] dark:group-hover:text-[#8B8FE8] transition-colors">
                          {activity.title}
                        </h3>

                        {activity.recommended && (
                          <span className="inline-flex mt-2 px-2.5 py-0.5 rounded-full bg-[#E8E8FA] dark:bg-[#25283C] text-[#6366D8] dark:text-[#8B8FE8] text-[11px] font-bold">
                            Recommended for you
                          </span>
                        )}
                      </div>

                      <div className="flex gap-2 shrink-0">
                        <span className="px-2.5 py-0.5 rounded-full bg-[#78CFA3]/15 text-[#2E7D56] dark:text-[#78CFA3] text-[11px] font-bold">
                          {activity.difficulty}
                        </span>

                        <span className="px-2.5 py-0.5 rounded-full bg-[#F7F7FC] dark:bg-[#11121C] text-[#6B6E85] dark:text-[#9A9DB5] text-[11px] font-bold border border-[#EAEBF4] dark:border-[#2B2E42]">
                          {activity.duration}
                        </span>
                      </div>
                    </div>

                    <p className="text-sm text-[#6B6E85] dark:text-[#9A9DB5] mt-3 leading-relaxed min-h-[42px]">
                      {activity.description}
                    </p>
                  </div>
                </div>

                <div className="px-6 pb-6">
                  <button
                    onClick={() => setCurrentView(activity.view)}
                    className="w-full py-3.5 rounded-2xl bg-[#6366D8] hover:bg-[#5255C5] text-white font-semibold flex items-center justify-center gap-2 transition shadow-soft cursor-pointer"
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
    </div>
  );
}

export default Activities;
