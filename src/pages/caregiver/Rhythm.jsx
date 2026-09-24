import React, { useState } from "react";
import {
  Sparkles,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  TrendingUp,
  Brain,
  Clock,
  Activity,
  Heart,
} from "lucide-react";
import patientData from "../../data/patientData";

function Rhythm({ setCurrentView }) {
  const asha = patientData[0];

  const [adaptivePlan, setAdaptivePlan] = useState({
    activityType: "Visual Recall",
    difficulty: "Gentle",
    suggestedTime: "10:30 AM",
    assistanceLevel: "High Audio Guidance",
    reason:
      "Recent memory recall shows slight hesitation during midday. Morning sessions with gentle difficulty yield 18% higher completion without agitation.",
    confidence: 94,
    strongestArea: "Facial Recognition",
    weakestArea: "Recent Schedule Recall",
  });

  const [refreshing, setRefreshing] = useState(false);

  const refreshPlan = () => {
    setRefreshing(true);
    setTimeout(() => {
      setAdaptivePlan((prev) => ({
        ...prev,
        confidence: Math.min(99, prev.confidence + 1),
      }));
      setRefreshing(false);
    }, 450);
  };

  return (
    <div className="min-h-screen bg-[#F7F7FC] dark:bg-[#11121C] p-6 transition-colors">
      {/* HEADER */}
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E8E8FA] dark:bg-[#25283C] text-[#6366D8] dark:text-[#8B8FE8]">
              <Brain size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-[#202238] dark:text-[#F3F4F6]">
                Adaptive Rhythm Engine
              </h1>
              <p className="mt-1 text-sm text-[#6B6E85] dark:text-[#9A9DB5]">
                Real-time cognitive load balancing and activity pacing for Asha.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={refreshPlan}
          disabled={refreshing}
          className="flex items-center gap-2 rounded-xl bg-[#6366D8] hover:bg-[#5255C5] px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition"
        >
          <RotateCcw size={15} className={refreshing ? "animate-spin" : ""} />
          <span>{refreshing ? "Recalculating..." : "Recalculate Rhythm"}</span>
        </button>
      </div>

      {/* WORKFLOW BANNER */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <WorkflowCard
          number="01"
          icon={<Activity size={18} />}
          title="Telemetry Capture"
          text="Latency, hesitations & completion rates stream from games"
          active
        />
        <WorkflowCard
          number="02"
          icon={<Brain size={18} />}
          title="Pattern Analysis"
          text="Heuristics + Gemini evaluate cognitive fatigue"
        />
        <WorkflowCard
          number="03"
          icon={<Clock size={18} />}
          title="Paced Scheduling"
          text="Calculates optimal time-of-day for each cognitive domain"
        />
        <WorkflowCard
          number="04"
          icon={<CheckCircle2 size={18} />}
          title="Non-Punitive Scaling"
          text="Lowers task burden smoothly when fatigue is detected"
        />
      </div>

      {/* =====================================================
          CURRENT RECOMMENDATION
      ===================================================== */}
      <div className="mb-8 rounded-3xl border border-stone-200/80 dark:border-stone-800/80 bg-white dark:bg-[#1B1D2A] p-6 shadow-soft">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#6366D8] text-white">
              <Sparkles size={19} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#202238] dark:text-[#F3F4F6]">
                ANVESHA Recommendation
              </h2>
              <p className="mt-0.5 text-xs text-[#6B6E85] dark:text-[#9A9DB5]">
                Generated from Asha's current cognitive signals
              </p>
            </div>
          </div>

          <button
            onClick={refreshPlan}
            className="flex items-center justify-center gap-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-[#11121C] px-4 py-2 text-xs font-semibold text-[#6B6E85] dark:text-[#C5C8D8] hover:bg-stone-50 dark:hover:bg-stone-800 transition"
          >
            <RotateCcw size={14} />
            Recalculate
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <RecommendationCard
            title="Activity"
            value={adaptivePlan.activityType}
            icon="🧩"
          />
          <RecommendationCard
            title="Difficulty"
            value={adaptivePlan.difficulty}
            icon="📈"
          />
          <RecommendationCard
            title="Best Time"
            value={adaptivePlan.suggestedTime}
            icon="⏰"
          />
          <RecommendationCard
            title="Assistance"
            value={adaptivePlan.assistanceLevel}
            icon="🤝"
          />
        </div>

        {/* AI reasoning */}
        <div className="mt-5 rounded-2xl border border-[#6366D8]/20 bg-[#E8E8FA]/50 dark:bg-[#25283C]/50 p-4">
          <p className="text-xs font-bold text-[#6366D8] dark:text-[#8B8FE8]">
            Why ANVESHA chose this
          </p>
          <p className="mt-1 text-sm leading-6 text-[#202238] dark:text-[#C5C8D8]">
            {adaptivePlan.reason}
          </p>
        </div>

        {/* Confidence */}
        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-[#6B6E85] dark:text-[#9A9DB5]">
              Recommendation Confidence
            </span>
            <span className="text-xs font-bold text-[#6366D8] dark:text-[#8B8FE8]">
              {adaptivePlan.confidence}%
            </span>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-stone-100 dark:bg-stone-800">
            <div
              className="h-full rounded-full bg-[#6366D8] transition-all duration-500"
              style={{
                width: `${adaptivePlan.confidence}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* =====================================================
          COGNITIVE BALANCE
      ===================================================== */}
      <div className="mb-8 rounded-3xl border border-stone-200/80 dark:border-stone-800/80 bg-white dark:bg-[#1B1D2A] p-6 shadow-soft">
        <div className="mb-5">
          <h2 className="text-lg font-bold text-[#202238] dark:text-[#F3F4F6]">
            Cognitive Balance
          </h2>
          <p className="mt-1 text-sm text-[#6B6E85] dark:text-[#9A9DB5]">
            Current comparison between Asha's main cognitive areas.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <BalanceCard
            title="Strongest Area"
            value={adaptivePlan.strongestArea}
            description="Area currently performing best"
            icon="💪"
          />
          <BalanceCard
            title="Needs Attention"
            value={adaptivePlan.weakestArea}
            description="Area receiving additional support"
            icon="🎯"
          />
        </div>
      </div>

      {/* =====================================================
          DAILY PLAN
      ===================================================== */}
      <div className="mb-8 rounded-3xl border border-stone-200/80 dark:border-stone-800/80 bg-white dark:bg-[#1B1D2A] p-6 shadow-soft">
        <div className="mb-5">
          <h2 className="text-lg font-bold text-[#202238] dark:text-[#F3F4F6]">
            Personalized Daily Plan
          </h2>
          <p className="mt-1 text-sm text-[#6B6E85] dark:text-[#9A9DB5]">
            ANVESHA's current schedule for Asha.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <PlanCard
            time="09:00 AM"
            activity="Memory Match"
            difficulty="Medium"
            focus="Memory"
            current
          />
          <PlanCard
            time="01:00 PM"
            activity="Attention Match"
            difficulty={adaptivePlan.difficulty}
            focus="Attention"
          />
          <PlanCard
            time="06:00 PM"
            activity="Family Recognition"
            difficulty="Easy"
            focus="Emotional engagement"
          />
        </div>
      </div>

      {/* NAVIGATION */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => setCurrentView("caregiver-patients")}
          className="rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-[#1B1D2A] px-5 py-3 text-sm font-semibold text-[#202238] dark:text-[#F3F4F6] hover:bg-stone-50 dark:hover:bg-stone-800 transition"
        >
          ← Back to Patients
        </button>

        <button
          onClick={() => setCurrentView("caregiver-analytics")}
          className="flex items-center gap-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-[#1B1D2A] px-5 py-3 text-sm font-semibold text-[#202238] dark:text-[#F3F4F6] hover:bg-stone-50 dark:hover:bg-stone-800 transition"
        >
          View Analytics
          <ArrowRight size={15} />
        </button>

        <button
          onClick={() => setCurrentView("caregiver-vault")}
          className="flex items-center gap-2 rounded-xl bg-[#6366D8] hover:bg-[#5255C5] px-5 py-3 text-sm font-semibold text-white shadow-soft transition"
        >
          Open Memory Vault
          <ArrowRight size={15} />
        </button>
      </div>
    </div>
  );
}

function WorkflowCard({ number, icon, title, text, active = false }) {
  return (
    <div
      className={`rounded-2xl border p-5 transition-all ${
        active
          ? "border-[#6366D8]/30 bg-[#E8E8FA]/60 dark:bg-[#25283C]/60"
          : "border-stone-200/80 dark:border-stone-800/80 bg-white dark:bg-[#1B1D2A]"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-[#6B6E85] dark:text-[#9A9DB5]">
          {number}
        </span>
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${
            active
              ? "bg-[#6366D8] text-white"
              : "bg-stone-100 dark:bg-stone-800 text-[#6B6E85] dark:text-[#C5C8D8]"
          }`}
        >
          {icon}
        </div>
      </div>
      <h3 className="mt-4 text-sm font-bold text-[#202238] dark:text-[#F3F4F6]">
        {title}
      </h3>
      <p className="mt-1 text-xs leading-5 text-[#6B6E85] dark:text-[#9A9DB5]">
        {text}
      </p>
    </div>
  );
}

function RecommendationCard({ title, value, icon }) {
  return (
    <div className="rounded-2xl border border-stone-200/80 dark:border-stone-800/80 bg-stone-50 dark:bg-[#11121C] p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-[#6B6E85] dark:text-[#9A9DB5]">
          {title}
        </p>
        <span className="text-lg">{icon}</span>
      </div>
      <p className="mt-3 text-sm font-bold text-[#202238] dark:text-[#F3F4F6]">
        {value}
      </p>
    </div>
  );
}

function BalanceCard({ title, value, description, icon }) {
  return (
    <div className="rounded-2xl border border-stone-200/80 dark:border-stone-800/80 bg-stone-50 dark:bg-[#11121C] p-5">
      <div className="flex items-center gap-3">
        <span className="text-xl">{icon}</span>
        <div>
          <p className="text-xs text-[#6B6E85] dark:text-[#9A9DB5]">{title}</p>
          <p className="mt-1 text-lg font-bold text-[#202238] dark:text-[#F3F4F6]">
            {value}
          </p>
        </div>
      </div>
      <p className="mt-3 text-xs text-[#6B6E85] dark:text-[#9A9DB5]">{description}</p>
    </div>
  );
}

function PlanCard({ time, activity, difficulty, focus, current = false }) {
  return (
    <div
      className={`rounded-2xl border p-5 ${
        current
          ? "border-[#6366D8]/30 bg-[#E8E8FA]/50 dark:bg-[#25283C]/50"
          : "border-stone-200/80 dark:border-stone-800/80 bg-stone-50 dark:bg-[#11121C]"
      }`}
    >
      {current && (
        <span className="rounded-full bg-[#6366D8] px-2.5 py-1 text-[10px] font-bold text-white">
          CURRENT
        </span>
      )}
      <p className="mt-3 text-xs font-bold text-[#6366D8] dark:text-[#8B8FE8]">{time}</p>
      <h3 className="mt-2 text-sm font-bold text-[#202238] dark:text-[#F3F4F6]">{activity}</h3>
      <p className="mt-1 text-xs text-[#6B6E85] dark:text-[#9A9DB5]">{focus}</p>
      <span className="mt-4 inline-block rounded-full bg-white dark:bg-[#1B1D2A] px-3 py-1 text-[10px] font-semibold text-[#6B6E85] dark:text-[#C5C8D8]">
        {difficulty} difficulty
      </span>
    </div>
  );
}

export default Rhythm;
