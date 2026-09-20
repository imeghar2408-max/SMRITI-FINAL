import React, { useEffect, useState, useCallback } from "react";
import { RefreshCw, CheckCircle2, AlertTriangle, Radio, BarChart3, ChevronRight } from "lucide-react";

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
  const trend = Array.isArray(patient?.trend) && patient.trend.length > 0 ? patient.trend : [75, 75];
  const first = trend[0];
  const latest = trend[trend.length - 1];
  const change = latest - first;

  if (change <= -10) {
    return {
      title: "Significant decline detected",
      text: `Recent cognitive performance for ${patient?.name || "the patient"} shows a noticeable downward trend. A clinical review is recommended.`,
      style: "bg-red-50 border-red-200 text-red-700",
    };
  }

  if (change < 0) {
    return {
      title: "Performance requires monitoring",
      text: `Recent sessions show mild decline. Continue monitoring ${patient?.name || "patient"} performance and engagement closely.`,
      style: "bg-amber-50 border-amber-200 text-amber-700",
    };
  }

  return {
    title: "Performance appears stable",
    text: `Recent sessions show stable cognitive performance with consistent engagement across activities.`,
    style: "bg-emerald-50 border-emerald-200 text-emerald-800",
  };
}

function Analytics({ setCurrentView, initialPatientId = "P001" }) {
  const [patientList, setPatientList] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState(initialPatientId);
  const [patient, setPatient] = useState(defaultPatient);
  const [syncStatus, setSyncStatus] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

  const fetchAnalytics = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const [analyticsRes, activitiesRes, syncRes] = await Promise.all([
        fetch(`/api/caregiver/analytics?patientId=${selectedPatientId}`),
        fetch(`/api/caregiver/patients/${selectedPatientId}/activities`),
        fetch(`/api/caregiver/patients/${selectedPatientId}/sync-status`),
      ]);

      if (analyticsRes.ok) {
        const data = await analyticsRes.json();
        if (data && data.patient) {
          setPatient({
            ...defaultPatient,
            ...data.patient,
            trend: Array.isArray(data.trend) && data.trend.length > 0 ? data.trend : (data.patient.trend || defaultPatient.trend),
            activities: Array.isArray(data.activities) && data.activities.length > 0 ? data.activities : defaultPatient.activities,
          });
        }
      }

      if (activitiesRes.ok) {
        const actData = await activitiesRes.json();
        setRecentActivities(actData.activities || []);
      }

      if (syncRes.ok) {
        const sData = await syncRes.json();
        setSyncStatus(sData);
      }
    } catch (err) {
      console.warn("Failed to load analytics:", err);
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  }, [selectedPatientId]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const overallScore = Math.round(
    ((patient.memory || 80) + (patient.attention || 75)) / 2
  );

  const insight = getInsight(patient);

  const trendList = Array.isArray(patient.trend) && patient.trend.length > 0 ? patient.trend : [70, 75, 80];
  const maxTrend = Math.max(...trendList);
  const minTrend = Math.min(...trendList);
  const trendChange = (trendList[trendList.length - 1] || 0) - (trendList[0] || 0);

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl font-bold text-slate-900">
              Cognitive Analytics
            </h1>

            {/* Synchronization Status Indicator */}
            {syncStatus && (
              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded-full border flex items-center gap-1.5 ${
                  syncStatus.state === "synced"
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                    : syncStatus.state === "pending"
                    ? "bg-amber-50 text-amber-800 border-amber-200"
                    : "bg-slate-100 text-slate-700 border-slate-300"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    syncStatus.state === "synced"
                      ? "bg-emerald-500"
                      : syncStatus.state === "pending"
                      ? "bg-amber-500"
                      : "bg-slate-400"
                  }`}
                />
                {syncStatus.label}
              </span>
            )}
          </div>
          <p className="mt-1 text-slate-500">
            Real-time cognitive performance, engagement scores, and session analytics for {patient.name}.
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Patient Selection Dropdown */}
          {patientList.length > 0 && (
            <div className="flex items-center gap-2">
              <label htmlFor="analytics-patient-select" className="text-xs font-bold text-slate-600">
                Patient:
              </label>
              <select
                id="analytics-patient-select"
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 shadow-xs focus:border-teal-600 focus:outline-hidden"
              >
                {patientList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (Room {p.room})
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            type="button"
            onClick={() => fetchAnalytics(true)}
            disabled={refreshing}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition shadow-xs"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin text-teal-700" : ""} />
            <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
          </button>
        </div>
      </div>

      {/* Patient Identity Strip */}
      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-xl border border-teal-100">
              👵
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">
                  {patient.name}
                </h2>
                <span className="text-xs px-2 py-0.5 rounded-md bg-stone-100 text-stone-600 font-semibold">
                  Room {patient.room || "402"}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-md bg-teal-50 text-[#0f3e3a] font-semibold">
                  ID: {selectedPatientId}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-slate-500">
                {patient.age} years old • Caregiver: Dr. Sarah Jenkins • Family: Priya Sharma
              </p>
            </div>
          </div>

          <span
            className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${
              patient.status === "Stable"
                ? "bg-emerald-50 text-emerald-700"
                : patient.status === "Needs Attention"
                ? "bg-amber-50 text-amber-700"
                : "bg-red-50 text-red-700"
            }`}
          >
            ● {patient.status}
          </span>
        </div>
      </div>

      {/* Main Stats */}
      <div className="mb-6 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {/* Overall */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Overall Cognitive Score</p>
          <p className="mt-2 text-4xl font-bold text-slate-900">{overallScore}%</p>
          <p className="mt-2 text-xs text-slate-400">Average of memory and attention metrics</p>
        </div>

        {/* Engagement */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Engagement Rate</p>
          <p className="mt-2 text-4xl font-bold text-slate-900">{patient.engagement || 87}%</p>
          <p className="mt-2 text-xs text-slate-400">Consistent activity adherence</p>
        </div>

        {/* Sessions */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Recorded Sessions</p>
          <p className="mt-2 text-4xl font-bold text-slate-900">{patient.sessions || recentActivities.length || 18}</p>
          <p className="mt-2 text-xs text-slate-400">Total activities completed to date</p>
        </div>

        {/* Completion */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Completion Rate</p>
          <p className="mt-2 text-4xl font-bold text-slate-900">{patient.completion || 92}%</p>
          <p className="mt-2 text-xs text-slate-400">Sessions finished without abandonment</p>
        </div>
      </div>

      {/* Memory + Attention Dual Gauge */}
      <div className="mb-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Memory */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Memory Recall</p>
              <p className="mt-1 text-3xl font-bold text-slate-900">{patient.memory}%</p>
            </div>
            <span className="text-2xl">🧠</span>
          </div>

          <div className="h-3 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-teal-800 transition-all duration-500"
              style={{ width: `${patient.memory}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-slate-400">Visual and family memory retention</p>
        </div>

        {/* Attention */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Attention & Focus</p>
              <p className="mt-1 text-3xl font-bold text-slate-900">{patient.attention}%</p>
            </div>
            <span className="text-2xl">🎯</span>
          </div>

          <div className="h-3 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-slate-600 transition-all duration-500"
              style={{ width: `${patient.attention}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-slate-400">Target detection and pattern matching</p>
        </div>
      </div>

      {/* Performance Trend Chart */}
      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Cognitive Performance Trend
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Session-by-session progression across recent activities
            </p>
          </div>

          <div className="text-left sm:text-right">
            <p className="text-xs text-slate-400">Net Trajectory</p>
            <p
              className={`text-lg font-bold ${
                trendChange >= 0 ? "text-emerald-600" : "text-red-600"
              }`}
            >
              {trendChange >= 0 ? "+" : ""}
              {trendChange}%
            </p>
          </div>
        </div>

        {/* Simple Bar Trend */}
        <div className="flex h-56 items-end gap-3 rounded-xl bg-slate-50 p-5">
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
                <span className="text-xs font-semibold text-slate-600">
                  {value}%
                </span>
                <div
                  className="w-full max-w-10 rounded-t-lg bg-slate-800 transition-all hover:bg-teal-700"
                  style={{ height: `${height}%` }}
                  title={`Session ${index + 1}: ${value}%`}
                />
                <span className="text-[10px] text-slate-400">
                  S{index + 1}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Activity Performance Breakdown */}
      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5">
          <h2 className="text-lg font-bold text-slate-900">
            Activity Performance Breakdown
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Persistent scores categorized by cognitive exercise domain
          </p>
        </div>

        <div className="space-y-5">
          {patient.activities.map((activity) => (
            <div key={activity.name}>
              <div className="mb-2 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    {activity.name}
                  </p>
                  <p className="text-xs text-slate-400">
                    {activity.sessions} logged {activity.sessions === 1 ? "session" : "sessions"}
                  </p>
                </div>
                <span className="text-sm font-bold text-slate-900">
                  {activity.score}%
                </span>
              </div>

              <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-teal-800 transition-all duration-500"
                  style={{ width: `${activity.score}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Persisted Game Sessions */}
      {recentActivities.length > 0 && (
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-1">
            Recent Activity Logs
          </h2>
          <p className="text-xs text-slate-500 mb-4">
            Directly recorded from {patient.name}'s interactive sessions
          </p>

          <div className="space-y-3">
            {recentActivities.slice(0, 5).map((act, idx) => (
              <div key={act.id || idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-xl">
                    {act.gameId === "memory-match" ? "🧠" : act.gameId === "spot-the-difference" ? "🎯" : "🧩"}
                  </span>
                  <div>
                    <p className="text-xs font-bold text-slate-800">{act.game || act.gameId}</p>
                    <p className="text-[11px] text-slate-400">
                      {act.difficulty || "standard"} • {act.performanceLevel || "Completed"}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-bold text-teal-800 px-2 py-0.5 rounded-md bg-teal-50">
                    {act.score ?? act.accuracy}%
                  </span>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {act.timestamp ? new Date(act.timestamp).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "Recorded"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Clinical Insight */}
      <div className={`rounded-2xl border p-6 shadow-sm ${insight.style}`}>
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

      {/* Navigation & Action */}
      <div className="mt-6 flex flex-wrap gap-3">
        <button
          onClick={() => setCurrentView("caregiver-patients")}
          className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          ← Back to Patients
        </button>

        <button
          onClick={() => setCurrentView("caregiver-rhythm")}
          className="rounded-xl bg-[#0f3e3a] px-5 py-3 text-sm font-semibold text-white hover:bg-[#0c312e]"
        >
          View Adaptive Rhythm
        </button>

        <button
          onClick={() => setCurrentView("caregiver-location")}
          className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Patient Location Map
        </button>
      </div>
    </div>
  );
}

export default Analytics;
