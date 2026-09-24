import React, { useEffect, useState, useCallback } from "react";
import {
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Radio,
  BarChart3,
  ChevronRight,
  Sparkles,
  Brain,
  Clock,
  Activity,
  UserCheck,
  ShieldCheck,
  Info,
} from "lucide-react";

const defaultPatient = {
  id: "P001",
  name: "Asha",
  age: 78,
  room: "402",
  status: "Stable",
  memory: 82,
  attention: 76,
  engagement: 87,
  sessions: 18,
  completion: 92,
  trend: [68, 72, 75, 78, 80, 79, 82],
  activities: [
    { name: "Memory Recall", score: 84, sessions: 7 },
    { name: "Pattern Recognition", score: 78, sessions: 6 },
    { name: "Word Association", score: 81, sessions: 5 },
  ],
};

function getInsight(patient) {
  const trend =
    Array.isArray(patient?.trend) && patient.trend.length > 0 ? patient.trend : [75, 75];
  const first = trend[0];
  const latest = trend[trend.length - 1];
  const change = latest - first;

  if (change <= -10) {
    return {
      title: "Noticeable variance detected",
      text: `Recent cognitive metrics for ${patient?.name || "the patient"} show an observed downward variance. An attentive clinical check is recommended.`,
      style: "bg-[#E98B9B]/15 border-[#E98B9B]/40 text-[#C7485E] dark:text-[#E98B9B]",
    };
  }

  if (change < 0) {
    return {
      title: "Gentle monitoring suggested",
      text: `Recent sessions indicate mild fatigue or hesitation. Continue observing ${patient?.name || "patient"} engagement closely.`,
      style: "bg-[#F3B562]/15 border-[#F3B562]/40 text-[#9C6119] dark:text-[#F3B562]",
    };
  }

  return {
    title: "Cognitive rhythm stable",
    text: `Recent sessions reflect steady cognitive performance with consistent engagement across scheduled activities.`,
    style: "bg-[#78CFA3]/15 border-[#78CFA3]/40 text-[#2E7D56] dark:text-[#78CFA3]",
  };
}

function Analytics({ setCurrentView, initialPatientId = "P001" }) {
  const [patientList, setPatientList] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState(initialPatientId);
  const [patient, setPatient] = useState(defaultPatient);
  const [syncStatus, setSyncStatus] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);
  const [aiInsights, setAiInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Caregiver External Clinical Knowledge & Grounding Query State
  const [caregiverQueryText, setCaregiverQueryText] = useState("");
  const [useSearchGrounding, setUseSearchGrounding] = useState(true);
  const [queryResult, setQueryResult] = useState(null);
  const [queryLoading, setQueryLoading] = useState(false);

  const handleCaregiverQuery = async (e) => {
    e.preventDefault();
    if (!caregiverQueryText.trim() || queryLoading) return;

    setQueryLoading(true);
    setQueryResult(null);

    try {
      const res = await fetch("/api/ai/caregiver-query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: caregiverQueryText.trim(),
          patientId: selectedPatientId,
          enableSearchGrounding: useSearchGrounding,
        }),
      });
      const data = await res.json();
      setQueryResult(data);
    } catch (err) {
      setQueryResult({
        answer: "Failed to connect to caregiver research service.",
        isExternallyGrounded: false,
        disclaimer: "Offline fallback observation.",
      });
    } finally {
      setQueryLoading(false);
    }
  };

  // Load patient list
  useEffect(() => {
    fetch("/api/caregiver/patients")
      .then((res) => (res.ok ? res.json() : []))
      .then((list) => {
        if (Array.isArray(list) && list.length > 0) {
          setPatientList(list);
          if (!list.some((p) => p.id === selectedPatientId)) {
            setSelectedPatientId(list[0].id);
          }
        }
      })
      .catch((err) => console.warn("Failed to load caregiver patient roster:", err));
  }, []);

  const fetchAnalytics = useCallback(
    async (isManual = false) => {
      if (isManual) setRefreshing(true);
      try {
        const [analyticsRes, activitiesRes, syncRes, insightsRes] = await Promise.allSettled([
          fetch(`/api/caregiver/analytics?patientId=${selectedPatientId}`),
          fetch(`/api/caregiver/patients/${selectedPatientId}/activities`),
          fetch(`/api/caregiver/patients/${selectedPatientId}/sync-status`),
          fetch(`/api/ai/insights?patientId=${selectedPatientId}`),
        ]);

        if (analyticsRes.status === "fulfilled" && analyticsRes.value.ok) {
          const data = await analyticsRes.value.json();
          if (data && data.patient) {
            setPatient({
              ...defaultPatient,
              ...data.patient,
              trend:
                Array.isArray(data.trend) && data.trend.length > 0
                  ? data.trend
                  : data.patient.trend || defaultPatient.trend,
              activities:
                Array.isArray(data.activities) && data.activities.length > 0
                  ? data.activities
                  : defaultPatient.activities,
            });
          }
        }

        if (activitiesRes.status === "fulfilled" && activitiesRes.value.ok) {
          const actData = await activitiesRes.value.json();
          setRecentActivities(actData.activities || []);
        }

        if (syncRes.status === "fulfilled" && syncRes.value.ok) {
          const sData = await syncRes.value.json();
          setSyncStatus(sData);
        }

        if (insightsRes.status === "fulfilled" && insightsRes.value.ok) {
          const insData = await insightsRes.value.json();
          if (Array.isArray(insData.insights) && insData.insights.length > 0) {
            setAiInsights(insData.insights);
          }
        }
      } catch (err) {
        console.warn("Failed to load analytics:", err);
      } finally {
        setLoading(false);
        if (isManual) setRefreshing(false);
      }
    },
    [selectedPatientId]
  );

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const overallScore = Math.round(
    ((patient.memory || 80) + (patient.attention || 75)) / 2
  );

  const insight = getInsight(patient);

  const trendList =
    Array.isArray(patient.trend) && patient.trend.length > 0
      ? patient.trend
      : [70, 75, 80];
  const maxTrend = Math.max(...trendList);
  const minTrend = Math.min(...trendList);
  const trendChange = (trendList[trendList.length - 1] || 0) - (trendList[0] || 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#6366D8] dark:text-[#8B8FE8]">
              Caregiver Intelligence Layer
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#202238] dark:text-white">
            Cognitive Analytics &amp; Trajectory
          </h1>
          <p className="text-xs md:text-sm text-[#6B6E85] dark:text-[#9A9DB5] mt-1">
            Evidence-based observations derived from interactive telemetry and daily rhythms.
          </p>
        </div>

        {/* Sync Status & Refresh */}
        <div className="flex items-center gap-3">
          {syncStatus && (
            <span
              className={`text-xs font-semibold px-3 py-1.5 rounded-xl border flex items-center gap-1.5 ${
                syncStatus.state === "synced"
                  ? "bg-[#78CFA3]/15 text-[#2E7D56] dark:text-[#78CFA3] border-[#78CFA3]/30"
                  : syncStatus.state === "pending"
                  ? "bg-[#F3B562]/15 text-[#9C6119] dark:text-[#F3B562] border-[#F3B562]/30"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 border-slate-200"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  syncStatus.state === "synced"
                    ? "bg-[#78CFA3] animate-pulse"
                    : syncStatus.state === "pending"
                    ? "bg-[#F3B562]"
                    : "bg-slate-400"
                }`}
              />
              <span>{syncStatus.label}</span>
            </span>
          )}

          <button
            onClick={() => fetchAnalytics(true)}
            disabled={refreshing}
            className="p-2.5 rounded-xl border border-[#EAEBF4] dark:border-[#2B2E42] bg-white dark:bg-[#1B1D2A] text-[#6B6E85] dark:text-[#9A9DB5] hover:text-[#6366D8] hover:border-[#6366D8] transition cursor-pointer"
            title="Refresh Telemetry"
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin text-[#6366D8]" : ""} />
          </button>
        </div>
      </div>

      {/* Patient Selector Switcher (if multiple) */}
      {patientList.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {patientList.map((p) => {
            const isSel = p.id === selectedPatientId;
            return (
              <button
                key={p.id}
                onClick={() => setSelectedPatientId(p.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  isSel
                    ? "bg-[#6366D8] text-white shadow-soft"
                    : "bg-white dark:bg-[#1B1D2A] border border-[#EAEBF4] dark:border-[#2B2E42] text-[#6B6E85] dark:text-[#9A9DB5] hover:border-[#6366D8]"
                }`}
              >
                {p.name} (Room {p.room})
              </button>
            );
          })}
        </div>
      )}

      {/* Patient Overview Summary Card */}
      <div className="bg-white dark:bg-[#1B1D2A] rounded-3xl border border-[#EAEBF4] dark:border-[#2B2E42] p-6 shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#E8E8FA] dark:bg-[#25283C] text-[#6366D8] dark:text-[#8B8FE8] flex items-center justify-center text-2xl font-bold">
            👵
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-[#202238] dark:text-white">
                {patient.name}
              </h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#78CFA3]/15 text-[#2E7D56] dark:text-[#78CFA3] font-bold">
                {patient.status || "Stable"}
              </span>
            </div>
            <p className="text-xs text-[#6B6E85] dark:text-[#9A9DB5] mt-0.5">
              Age {patient.age} · Room {patient.room} · {patient.sessions || 18} total sessions logged
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-left md:text-right">
            <span className="text-xs text-[#6B6E85] dark:text-[#9A9DB5]">Routine Adherence</span>
            <p className="text-lg font-bold text-[#78CFA3] tabular-nums">
              {patient.completion || 92}%
            </p>
          </div>
          <div className="w-px h-8 bg-[#EAEBF4] dark:bg-[#2B2E42]" />
          <div className="text-left md:text-right">
            <span className="text-xs text-[#6B6E85] dark:text-[#9A9DB5]">Overall Index</span>
            <p className="text-lg font-bold text-[#6366D8] dark:text-[#8B8FE8] tabular-nums">
              {overallScore}%
            </p>
          </div>
        </div>
      </div>

      {/* 4 Core Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Metric 1: Overall Cognitive Score */}
        <div className="rounded-2xl border border-[#EAEBF4] dark:border-[#2B2E42] bg-white dark:bg-[#1B1D2A] p-5 shadow-soft">
          <div className="flex items-center justify-between text-xs text-[#6B6E85] dark:text-[#9A9DB5] mb-2">
            <span>Cognitive Index</span>
            <span className="text-lg">🧠</span>
          </div>
          <p className="text-3xl font-extrabold text-[#6366D8] dark:text-[#8B8FE8] tabular-nums">
            {overallScore}%
          </p>
          <div className="mt-3 h-2 rounded-full bg-[#E8E8FA] dark:bg-[#25283C] overflow-hidden">
            <div
              className="h-full rounded-full bg-[#6366D8]"
              style={{ width: `${overallScore}%` }}
            />
          </div>
          <p className="mt-2 text-[11px] text-[#6B6E85] dark:text-[#9A9DB5]">Composite cognitive baseline</p>
        </div>

        {/* Metric 2: Memory Retention */}
        <div className="rounded-2xl border border-[#EAEBF4] dark:border-[#2B2E42] bg-white dark:bg-[#1B1D2A] p-5 shadow-soft">
          <div className="flex items-center justify-between text-xs text-[#6B6E85] dark:text-[#9A9DB5] mb-2">
            <span>Memory Retention</span>
            <span className="text-lg">🌸</span>
          </div>
          <p className="text-3xl font-extrabold text-[#202238] dark:text-white tabular-nums">
            {patient.memory}%
          </p>
          <div className="mt-3 h-2 rounded-full bg-[#E8E8FA] dark:bg-[#25283C] overflow-hidden">
            <div
              className="h-full rounded-full bg-[#E98B9B]"
              style={{ width: `${patient.memory}%` }}
            />
          </div>
          <p className="mt-2 text-[11px] text-[#6B6E85] dark:text-[#9A9DB5]">Visual &amp; family recall</p>
        </div>

        {/* Metric 3: Attention & Focus */}
        <div className="rounded-2xl border border-[#EAEBF4] dark:border-[#2B2E42] bg-white dark:bg-[#1B1D2A] p-5 shadow-soft">
          <div className="flex items-center justify-between text-xs text-[#6B6E85] dark:text-[#9A9DB5] mb-2">
            <span>Attention &amp; Focus</span>
            <span className="text-lg">🎯</span>
          </div>
          <p className="text-3xl font-extrabold text-[#202238] dark:text-white tabular-nums">
            {patient.attention}%
          </p>
          <div className="mt-3 h-2 rounded-full bg-[#E8E8FA] dark:bg-[#25283C] overflow-hidden">
            <div
              className="h-full rounded-full bg-[#F3B562]"
              style={{ width: `${patient.attention}%` }}
            />
          </div>
          <p className="mt-2 text-[11px] text-[#6B6E85] dark:text-[#9A9DB5]">Pattern &amp; difference detection</p>
        </div>

        {/* Metric 4: Daily Adherence */}
        <div className="rounded-2xl border border-[#EAEBF4] dark:border-[#2B2E42] bg-white dark:bg-[#1B1D2A] p-5 shadow-soft">
          <div className="flex items-center justify-between text-xs text-[#6B6E85] dark:text-[#9A9DB5] mb-2">
            <span>Engagement &amp; Rhythm</span>
            <span className="text-lg">🌿</span>
          </div>
          <p className="text-3xl font-extrabold text-[#202238] dark:text-white tabular-nums">
            {patient.engagement || 87}%
          </p>
          <div className="mt-3 h-2 rounded-full bg-[#E8E8FA] dark:bg-[#25283C] overflow-hidden">
            <div
              className="h-full rounded-full bg-[#78CFA3]"
              style={{ width: `${patient.engagement || 87}%` }}
            />
          </div>
          <p className="mt-2 text-[11px] text-[#6B6E85] dark:text-[#9A9DB5]">Completion &amp; response speed</p>
        </div>
      </div>

      {/* Cognitive Performance Trajectory Chart */}
      <div className="rounded-3xl border border-[#EAEBF4] dark:border-[#2B2E42] bg-white dark:bg-[#1B1D2A] p-7 shadow-soft">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-[#202238] dark:text-white">
              Cognitive Trajectory Progression
            </h2>
            <p className="mt-1 text-xs text-[#6B6E85] dark:text-[#9A9DB5]">
              Session-by-session telemetry across recent interactive exercises
            </p>
          </div>

          <div className="text-left sm:text-right">
            <p className="text-xs text-[#6B6E85] dark:text-[#9A9DB5]">Net Trajectory Delta</p>
            <p
              className={`text-lg font-extrabold tabular-nums ${
                trendChange >= 0 ? "text-[#78CFA3]" : "text-[#E98B9B]"
              }`}
            >
              {trendChange >= 0 ? "+" : ""}
              {trendChange}%
            </p>
          </div>
        </div>

        {/* Clean Bar Trend */}
        <div className="flex h-56 items-end gap-3 rounded-2xl bg-[#F7F7FC] dark:bg-[#11121C] p-6 border border-[#EAEBF4] dark:border-[#2B2E42]">
          {trendList.map((value, index) => {
            const height =
              maxTrend === minTrend
                ? 50
                : ((value - minTrend) / (maxTrend - minTrend || 1)) * 65 + 35;

            return (
              <div
                key={index}
                className="flex h-full flex-1 flex-col items-center justify-end gap-2"
              >
                <span className="text-xs font-bold text-[#202238] dark:text-white tabular-nums">
                  {value}%
                </span>
                <div
                  className="w-full max-w-11 rounded-t-xl bg-[#6366D8] hover:bg-[#5255C5] transition-all"
                  style={{ height: `${height}%` }}
                  title={`Session ${index + 1}: ${value}%`}
                />
                <span className="text-[10px] font-semibold text-[#6B6E85] dark:text-[#9A9DB5]">
                  S{index + 1}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Activity Performance Breakdown */}
      <div className="rounded-3xl border border-[#EAEBF4] dark:border-[#2B2E42] bg-white dark:bg-[#1B1D2A] p-7 shadow-soft">
        <div className="mb-5">
          <h2 className="text-lg font-bold text-[#202238] dark:text-white">
            Activity Domain Breakdown
          </h2>
          <p className="mt-1 text-xs text-[#6B6E85] dark:text-[#9A9DB5]">
            Persistent retention scores categorized by cognitive task
          </p>
        </div>

        <div className="space-y-4">
          {patient.activities.map((act) => (
            <div key={act.name} className="p-3.5 rounded-2xl bg-[#F7F7FC] dark:bg-[#11121C] border border-[#EAEBF4] dark:border-[#2B2E42]">
              <div className="mb-2 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-[#202238] dark:text-white">
                    {act.name}
                  </p>
                  <p className="text-xs text-[#6B6E85] dark:text-[#9A9DB5]">
                    {act.sessions} completed {act.sessions === 1 ? "session" : "sessions"}
                  </p>
                </div>
                <span className="text-base font-extrabold text-[#6366D8] dark:text-[#8B8FE8] tabular-nums">
                  {act.score}%
                </span>
              </div>

              <div className="h-2.5 rounded-full bg-[#E8E8FA] dark:bg-[#25283C] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#6366D8]"
                  style={{ width: `${act.score}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Persisted Game Sessions */}
      {recentActivities.length > 0 && (
        <div className="rounded-3xl border border-[#EAEBF4] dark:border-[#2B2E42] bg-white dark:bg-[#1B1D2A] p-7 shadow-soft">
          <h2 className="text-lg font-bold text-[#202238] dark:text-white mb-1">
            Recent Telemetry Logs
          </h2>
          <p className="text-xs text-[#6B6E85] dark:text-[#9A9DB5] mb-4">
            Recorded directly from {patient.name}'s interactive sessions
          </p>

          <div className="space-y-3">
            {recentActivities.slice(0, 5).map((act, idx) => (
              <div
                key={act.id || idx}
                className="p-4 rounded-2xl bg-[#F7F7FC] dark:bg-[#11121C] border border-[#EAEBF4] dark:border-[#2B2E42] flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">
                    {act.gameId === "memory-match"
                      ? "🧠"
                      : act.gameId === "spot-the-difference"
                      ? "🎯"
                      : "🧩"}
                  </span>
                  <div>
                    <p className="text-xs font-bold text-[#202238] dark:text-white">
                      {act.game || act.gameId}
                    </p>
                    <p className="text-[11px] text-[#6B6E85] dark:text-[#9A9DB5]">
                      {act.difficulty || "standard"} • {act.performanceLevel || "Completed"}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-bold text-[#6366D8] dark:text-[#8B8FE8] px-2.5 py-1 rounded-md bg-[#E8E8FA] dark:bg-[#25283C] tabular-nums">
                    {act.score ?? act.accuracy}%
                  </span>
                  <p className="text-[10px] text-[#6B6E85] dark:text-[#9A9DB5] mt-1">
                    {act.timestamp
                      ? new Date(act.timestamp).toLocaleTimeString([], {
                          hour: "numeric",
                          minute: "2-digit",
                        })
                      : "Recorded"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Observational Insights Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-[#6366D8] dark:text-[#8B8FE8]" />
              <h2 className="text-lg md:text-xl font-bold text-[#202238] dark:text-white">
                AI Observational Insights
              </h2>
            </div>
            <p className="text-xs text-[#6B6E85] dark:text-[#9A9DB5] mt-0.5">
              Explainable pattern detection based on telemetry trends and daily rhythms.
            </p>
          </div>
          <span className="text-xs px-3 py-1 rounded-full bg-[#E8E8FA] dark:bg-[#25283C] text-[#6366D8] dark:text-[#8B8FE8] font-bold border border-[#6366D8]/20">
            ANVESHA AI Service
          </span>
        </div>

        {aiInsights && aiInsights.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {aiInsights.map((ins, idx) => {
              const isHigh = ins.severity === "high";
              const isMod = ins.severity === "moderate";
              const cardBorder = isHigh
                ? "bg-[#E98B9B]/10 border-[#E98B9B]/40"
                : isMod
                ? "bg-[#F3B562]/10 border-[#F3B562]/40"
                : "bg-white dark:bg-[#1B1D2A] border-[#EAEBF4] dark:border-[#2B2E42]";
              const badgeBg = isHigh
                ? "bg-[#E98B9B]/20 text-[#C7485E] dark:text-[#E98B9B]"
                : isMod
                ? "bg-[#F3B562]/20 text-[#9C6119] dark:text-[#F3B562]"
                : "bg-[#78CFA3]/20 text-[#2E7D56] dark:text-[#78CFA3]";

              const typeLabel =
                ins.type === "cognitive_trend"
                  ? "Cognitive Trajectory"
                  : ins.type === "assistance_pattern"
                  ? "Assistance & Latency Pattern"
                  : ins.type === "routine_correlation"
                  ? "Routine & Wellness Correlation"
                  : String(ins.type || "Observation").replace(/_/g, " ").toUpperCase();

              return (
                <div
                  key={idx}
                  className={`rounded-3xl border p-6 shadow-soft transition-all duration-200 ${cardBorder}`}
                >
                  <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">
                        {isHigh ? "🚨" : isMod ? "⚠️" : "📊"}
                      </span>
                      <span className="text-xs font-bold uppercase tracking-wider text-[#6366D8] dark:text-[#8B8FE8]">
                        {typeLabel}
                      </span>
                    </div>
                    <span
                      className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase ${badgeBg}`}
                    >
                      {ins.severity} priority
                    </span>
                  </div>

                  <p className="text-sm font-semibold text-[#202238] dark:text-white mb-3">
                    {ins.observation}
                  </p>

                  {/* Supporting Evidence Points */}
                  {Array.isArray(ins.evidence) && ins.evidence.length > 0 && (
                    <div className="mb-3 rounded-2xl bg-[#F7F7FC]/80 dark:bg-[#11121C]/80 p-3.5 border border-[#EAEBF4] dark:border-[#2B2E42]">
                      <p className="text-xs font-bold text-[#6B6E85] dark:text-[#9A9DB5] mb-1.5 uppercase tracking-wider">
                        Evidence Points
                      </p>
                      <ul className="list-disc list-inside space-y-1 text-xs text-[#202238] dark:text-[#EDEFFF]">
                        {ins.evidence.map((ev, eIdx) => (
                          <li key={eIdx}>{ev}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Caregiver Recommendation */}
                  {ins.recommendation && (
                    <div className="rounded-2xl bg-[#E8E8FA]/50 dark:bg-[#25283C]/60 p-3.5 border border-[#6366D8]/20">
                      <p className="text-xs font-bold text-[#6366D8] dark:text-[#8B8FE8] mb-0.5 uppercase tracking-wider">
                        Caregiver Recommendation
                      </p>
                      <p className="text-xs text-[#202238] dark:text-[#EDEFFF] leading-relaxed">
                        {ins.recommendation}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className={`rounded-3xl border p-6 shadow-soft ${insight.style}`}>
            <div className="flex gap-4">
              <div className="text-2xl">
                {patient.status === "Stable" ? "✓" : patient.status === "Needs Attention" ? "⚠️" : "🚨"}
              </div>
              <div>
                <h2 className="font-bold text-base">{insight.title}</h2>
                <p className="mt-1 text-sm leading-6 opacity-90">{insight.text}</p>
              </div>
            </div>
          </div>
        )}

        {/* NON-DIAGNOSTIC ADVISORY FOOTNOTE */}
        <div className="rounded-2xl bg-[#F7F7FC] dark:bg-[#11121C] border border-[#EAEBF4] dark:border-[#2B2E42] p-4 flex items-start gap-3">
          <Info size={18} className="text-[#6366D8] dark:text-[#8B8FE8] shrink-0 mt-0.5" />
          <p className="text-xs text-[#6B6E85] dark:text-[#9A9DB5] leading-relaxed">
            <strong>Clinical Notice:</strong> ANVESHA insights are behavioral and observational suggestions derived from gameplay and routine telemetry. They do not constitute formal medical diagnoses or clinical prescriptions.
          </p>
        </div>

        {/* 7. CAREGIVER CLINICAL RESEARCH & SEARCH GROUNDING */}
        <div className="rounded-3xl border border-[#EAEBF4] dark:border-[#2B2E42] bg-white dark:bg-[#1B1D2A] p-6 shadow-soft space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 dark:border-stone-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg">🔎</span>
                <h3 className="text-base font-bold text-[#202238] dark:text-white">
                  Caregiver Clinical Guidance &amp; Grounding
                </h3>
              </div>
              <p className="text-xs text-[#6B6E85] dark:text-[#9A9DB5] mt-0.5">
                Query external eldercare guidelines grounded with Google Search. Patient context remains strictly observational.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="search-grounding-toggle" className="text-xs font-semibold text-[#6B6E85] dark:text-[#9A9DB5] cursor-pointer">
                Google Search Grounding
              </label>
              <input
                id="search-grounding-toggle"
                type="checkbox"
                checked={useSearchGrounding}
                onChange={(e) => setUseSearchGrounding(e.target.checked)}
                className="w-4 h-4 accent-[#6366D8] rounded cursor-pointer"
              />
            </div>
          </div>

          <form onSubmit={handleCaregiverQuery} className="flex gap-2">
            <input
              type="text"
              value={caregiverQueryText}
              onChange={(e) => setCaregiverQueryText(e.target.value)}
              placeholder="e.g. Best non-pharmacological pacing techniques for evening agitation in Assam..."
              className="flex-1 rounded-2xl border border-stone-200 dark:border-stone-700 bg-[#F7F7FC] dark:bg-[#11121C] px-4 py-2.5 text-xs text-[#202238] dark:text-[#F3F4F6] outline-none focus:border-[#6366D8]"
            />
            <button
              type="submit"
              disabled={queryLoading || !caregiverQueryText.trim()}
              className="rounded-2xl bg-[#6366D8] hover:bg-[#5255C5] px-5 py-2.5 text-xs font-bold text-white shadow-soft transition disabled:opacity-40"
            >
              {queryLoading ? "Searching..." : "Ask Clinical AI"}
            </button>
          </form>

          {queryResult && (
            <div className="p-4 rounded-2xl bg-[#F7F7FC] dark:bg-[#11121C] border border-[#6366D8]/20 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-[#6366D8] dark:text-[#8B8FE8]">
                  {queryResult.isExternallyGrounded ? "Grounded with Google Search" : "Internal Knowledge Reference"}
                </span>
                <span className="text-[10px] text-[#78CFA3] font-mono">
                  Telemetry Grounded: {patient.name}
                </span>
              </div>
              <p className="text-xs text-[#202238] dark:text-[#EDEFFF] leading-relaxed whitespace-pre-wrap">
                {queryResult.answer}
              </p>
              {queryResult.disclaimer && (
                <p className="text-[10px] text-[#6B6E85] dark:text-[#9A9DB5] italic pt-1 border-t border-stone-100 dark:border-stone-800">
                  {queryResult.disclaimer}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Navigation Shortcuts */}
      <div className="mt-6 flex flex-wrap gap-3">
        <button
          onClick={() => setCurrentView("caregiver-patients")}
          className="rounded-xl border border-[#EAEBF4] dark:border-[#2B2E42] bg-white dark:bg-[#1B1D2A] px-5 py-3 text-xs md:text-sm font-semibold text-[#202238] dark:text-white hover:border-[#6366D8] transition cursor-pointer"
        >
          ← Back to Patients
        </button>

        <button
          onClick={() => setCurrentView("caregiver-rhythm")}
          className="rounded-xl bg-[#6366D8] hover:bg-[#5255C5] px-5 py-3 text-xs md:text-sm font-semibold text-white transition shadow-soft cursor-pointer"
        >
          View Adaptive Rhythm
        </button>

        <button
          onClick={() => setCurrentView("caregiver-location")}
          className="rounded-xl border border-[#EAEBF4] dark:border-[#2B2E42] bg-white dark:bg-[#1B1D2A] px-5 py-3 text-xs md:text-sm font-semibold text-[#202238] dark:text-white hover:border-[#6366D8] transition cursor-pointer"
        >
          Patient Location Map
        </button>
      </div>
    </div>
  );
}

export default Analytics;
