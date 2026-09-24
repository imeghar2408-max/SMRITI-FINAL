import React, { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Clock,
  Filter,
  Search,
  ShieldAlert,
  X,
  ChevronRight,
} from "lucide-react";

function Alerts({ setCurrentView }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [showFilters, setShowFilters] = useState(false);

  const [alerts, setAlerts] = useState([
    {
      id: 1,
      patient: "Martha Washington",
      age: 82,
      room: "Rm 112",
      type: "Medication",
      message: "Morning medication is overdue by 30 minutes.",
      time: "15 mins ago",
      priority: "HIGH",
      icon: "💊",
      status: "Pending",
    },
    {
      id: 2,
      patient: "Eleanor Vance",
      age: 79,
      room: "At Home",
      type: "Emergency",
      message: "SOS button has been triggered.",
      time: "Just now",
      priority: "EMERGENCY",
      icon: "🚨",
      status: "Pending",
    },
    {
      id: 3,
      patient: "Arthur Pendelton",
      age: 78,
      room: "Rm 402",
      type: "Cognitive",
      message: "Reaction time has decreased across recent activities.",
      time: "42 mins ago",
      priority: "MEDIUM",
      icon: "🧠",
      status: "Pending",
    },
    {
      id: 4,
      patient: "Hector Rivera",
      age: 74,
      room: "Rm 305",
      type: "Activity",
      message: "No cognitive activity completed today.",
      time: "1 hour ago",
      priority: "MEDIUM",
      icon: "📊",
      status: "Pending",
    },
    {
      id: 5,
      patient: "Beatrice Clark",
      age: 81,
      room: "At Home",
      type: "Activity",
      message: "Patient has been inactive for 4 hours.",
      time: "2 hours ago",
      priority: "LOW",
      icon: "⏱️",
      status: "Pending",
    },
  ]);

  useEffect(() => {
    fetch("/api/caregiver/alerts")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setAlerts(data);
        }
      })
      .catch((err) => console.warn("Failed to fetch alerts:", err));
  }, []);

  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      const matchesSearch =
        alert.patient.toLowerCase().includes(search.toLowerCase()) ||
        alert.message.toLowerCase().includes(search.toLowerCase()) ||
        alert.type.toLowerCase().includes(search.toLowerCase());

      const matchesFilter =
        filter === "All" || alert.priority === filter;

      return matchesSearch && matchesFilter;
    });
  }, [alerts, search, filter]);

  const resolveAlert = async (id) => {
    setAlerts((current) =>
      current.map((alert) =>
        alert.id === id
          ? { ...alert, status: "Resolved" }
          : alert
      )
    );

    try {
      await fetch(`/api/caregiver/alerts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Resolved" }),
      });
    } catch (err) {
      console.warn("Failed to update alert on server:", err);
    }
  };

  const dismissAlert = async (id) => {
    setAlerts((current) =>
      current.filter((alert) => alert.id !== id)
    );

    try {
      await fetch(`/api/caregiver/alerts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Dismissed" }),
      });
    } catch (err) {
      console.warn("Failed to dismiss alert on server:", err);
    }
  };

  const pendingCount = alerts.filter(
    (alert) => alert.status === "Pending"
  ).length;

  const emergencyCount = alerts.filter(
    (alert) =>
      alert.priority === "EMERGENCY" &&
      alert.status === "Pending"
  ).length;

  const highCount = alerts.filter(
    (alert) =>
      alert.priority === "HIGH" &&
      alert.status === "Pending"
  ).length;

  return (
    <div className="space-y-8 animate-in fade-in">

      {/* PAGE HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center">
              <Bell size={21} />
            </div>

            <div>
              <h1 className="text-2xl font-black text-gray-900">
                Alert Center
              </h1>

              <p className="text-xs text-gray-400 mt-1">
                Monitor and respond to important patient events.
              </p>
            </div>
          </div>
        </div>

        <div className="text-right">
          <p className="text-xs text-[#6B6E85] dark:text-[#9A9DB5]">
            Pending alerts
          </p>
          <p className="text-2xl font-black text-[#6366D8] dark:text-[#8B8FE8]">
            {pendingCount}
          </p>
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard
          label="Total Pending"
          value={pendingCount}
          subtitle="Needs review"
          icon={<Bell size={17} />}
        />

        <SummaryCard
          label="Emergency"
          value={emergencyCount}
          subtitle="Immediate action"
          icon={<ShieldAlert size={17} />}
          danger
        />

        <SummaryCard
          label="High Priority"
          value={highCount}
          subtitle="Requires attention"
          icon={<AlertTriangle size={17} />}
        />

        <SummaryCard
          label="Resolved Today"
          value={alerts.filter(
            (alert) => alert.status === "Resolved"
          ).length}
          subtitle="Completed actions"
          icon={<CheckCircle2 size={17} />}
          success
        />
      </div>

      {/* SEARCH + FILTER */}
      <div className="bg-white dark:bg-[#1B1D2A] rounded-3xl border border-[#EAEBF4] dark:border-[#2B2E42] p-5 shadow-soft">
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search
              size={16}
              className="absolute left-3.5 top-3.5 text-[#6B6E85]"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search patient or alert..."
              className="w-full pl-10 pr-4 py-2.5 border border-[#EAEBF4] dark:border-[#2B2E42] bg-[#F7F7FC] dark:bg-[#11121C] text-[#202238] dark:text-white rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#6366D8]"
            />
          </div>

          <div className="relative">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#EAEBF4] dark:border-[#2B2E42] bg-white dark:bg-[#1B1D2A] text-xs font-semibold text-[#202238] dark:text-white hover:border-[#6366D8] cursor-pointer"
            >
              <Filter size={15} />
              <span>Filter</span>
            </button>

            {showFilters && (
              <div className="absolute right-0 top-12 z-20 w-44 bg-white dark:bg-[#1B1D2A] rounded-2xl border border-[#EAEBF4] dark:border-[#2B2E42] shadow-soft-lg p-2">
                {["All", "EMERGENCY", "HIGH", "MEDIUM", "LOW"].map(
                  (option) => (
                    <button
                      key={option}
                      onClick={() => {
                        setFilter(option);
                        setShowFilters(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer ${
                        filter === option
                          ? "bg-[#E8E8FA] dark:bg-[#25283C] text-[#6366D8] dark:text-[#8B8FE8]"
                          : "text-[#6B6E85] dark:text-[#9A9DB5] hover:bg-[#F7F7FC] dark:hover:bg-[#25283C]"
                      }`}
                    >
                      {option}
                    </button>
                  )
                )}
              </div>
            )}
          </div>
        </div>

        {/* ACTIVE FILTER */}
        <div className="flex items-center gap-2 mt-4">
          <span className="text-[10px] text-[#6B6E85] dark:text-[#9A9DB5] uppercase tracking-wider font-bold">
            Showing
          </span>
          <span className="px-2.5 py-0.5 rounded-full bg-[#E8E8FA] dark:bg-[#25283C] text-[#6366D8] dark:text-[#8B8FE8] text-[10px] font-bold">
            {filter}
          </span>
          {filter !== "All" && (
            <button
              onClick={() => setFilter("All")}
              className="text-[#6B6E85] hover:text-[#202238] dark:hover:text-white"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* ALERT TABLE */}
      <div className="bg-white dark:bg-[#1B1D2A] rounded-3xl border border-[#EAEBF4] dark:border-[#2B2E42] overflow-hidden shadow-soft">
        <div className="p-5 border-b border-[#EAEBF4] dark:border-[#2B2E42] flex items-center justify-between">
          <div>
            <h3 className="font-bold text-[#202238] dark:text-white text-sm">
              Patient Alerts
            </h3>
            <p className="text-[10px] text-[#6B6E85] dark:text-[#9A9DB5] mt-0.5">
              Review and respond to alerts generated by telemetry and safety geofences.
            </p>
          </div>
          <span className="text-[10px] text-[#6B6E85] dark:text-[#9A9DB5]">
            {filteredAlerts.length} alerts
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F7F7FC] dark:bg-[#11121C] text-[#6B6E85] dark:text-[#9A9DB5] font-semibold border-b border-[#EAEBF4] dark:border-[#2B2E42]">
              <tr>
                <th className="p-4">PATIENT</th>
                <th>TYPE</th>
                <th>ALERT</th>
                <th>TIME</th>
                <th>PRIORITY</th>
                <th>STATUS</th>
                <th className="text-right p-4">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAEBF4] dark:divide-[#2B2E42]">
              {filteredAlerts.length > 0 ? (
                filteredAlerts.map((alert) => (
                  <tr
                    key={alert.id}
                    className={`transition ${
                      alert.priority === "EMERGENCY"
                        ? "bg-[#E98B9B]/10"
                        : "hover:bg-[#F7F7FC] dark:hover:bg-[#25283C]/30"
                    }`}
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-2xl bg-[#E8E8FA] dark:bg-[#25283C] flex items-center justify-center text-base">
                          {alert.icon}
                        </div>
                        <div>
                          <p className="font-bold text-[#202238] dark:text-white">
                            {alert.patient}
                          </p>
                          <p className="text-[10px] text-[#6B6E85] dark:text-[#9A9DB5]">
                            {alert.age} yrs • {alert.room}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="text-[10px] font-semibold text-[#6B6E85] dark:text-[#9A9DB5]">
                        {alert.type}
                      </span>
                    </td>
                    <td className="max-w-xs">
                      <p className="font-semibold text-[#202238] dark:text-white">
                        {alert.message}
                      </p>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5 text-[#6B6E85] dark:text-[#9A9DB5]">
                        <Clock size={13} />
                        {alert.time}
                      </div>
                    </td>
                    <td>
                      <PriorityBadge priority={alert.priority} />
                    </td>
                    <td>
                      {alert.status === "Resolved" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#78CFA3]/15 text-[#2E7D56] dark:text-[#78CFA3] text-[10px] font-bold">
                          <CheckCircle2 size={11} />
                          Resolved
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#F3B562]/15 text-[#9C6119] dark:text-[#F3B562] text-[10px] font-bold">
                          <Clock size={11} />
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        {alert.status === "Pending" && (
                          <button
                            onClick={() => resolveAlert(alert.id)}
                            className="px-3 py-1.5 rounded-xl bg-[#6366D8] hover:bg-[#5255C5] text-white text-[10px] font-bold transition cursor-pointer"
                          >
                            Resolve
                          </button>
                        )}
                        <button
                          onClick={() => dismissAlert(alert.id)}
                          className="px-3 py-1.5 rounded-xl border border-[#EAEBF4] dark:border-[#2B2E42] text-[#6B6E85] hover:text-[#202238] text-[10px] font-bold transition cursor-pointer"
                        >
                          Dismiss
                        </button>
                        <button
                          onClick={() => setCurrentView?.("caregiver-patient")}
                          className="p-1.5 text-[#6B6E85] hover:text-[#6366D8]"
                          title="View patient"
                        >
                          <ChevronRight size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="p-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-[#78CFA3]/15 text-[#78CFA3] flex items-center justify-center">
                        <CheckCircle2 size={22} />
                      </div>
                      <div>
                        <p className="font-bold text-[#202238] dark:text-white">
                          No matching alerts
                        </p>
                        <p className="text-xs text-[#6B6E85] dark:text-[#9A9DB5] mt-1">
                          Try adjusting your search query or filter.
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FOOTNOTE */}
      <div className="flex items-center justify-between text-[10px] text-gray-400 px-1">
        <p>
          Alerts are generated from patient activity, reminders and safety events.
        </p>

        <p>
          ANVESHA Caregiver Portal
        </p>
      </div>

    </div>
  );
}

/* ---------------------------------------------
   SUMMARY CARD
--------------------------------------------- */

function SummaryCard({
  label,
  value,
  subtitle,
  icon,
  danger,
  success,
}) {
  return (
    <div
      className={`p-5 rounded-2xl border shadow-soft ${
        danger
          ? "bg-[#E98B9B]/10 border-[#E98B9B]/30"
          : "bg-white dark:bg-[#1B1D2A] border-[#EAEBF4] dark:border-[#2B2E42]"
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center ${
            danger
              ? "bg-[#E98B9B]/20 text-[#C7485E] dark:text-[#E98B9B]"
              : success
              ? "bg-[#78CFA3]/20 text-[#2E7D56] dark:text-[#78CFA3]"
              : "bg-[#E8E8FA] dark:bg-[#25283C] text-[#6366D8] dark:text-[#8B8FE8]"
          }`}
        >
          {icon}
        </div>
      </div>

      <p className="text-[10px] text-[#6B6E85] dark:text-[#9A9DB5] font-semibold uppercase tracking-wider">
        {label}
      </p>

      <p
        className={`text-2xl font-black mt-1 tabular-nums ${
          danger
            ? "text-[#C7485E] dark:text-[#E98B9B]"
            : "text-[#202238] dark:text-white"
        }`}
      >
        {value}
      </p>

      <p className="text-[10px] text-[#6B6E85] dark:text-[#9A9DB5] mt-1">
        {subtitle}
      </p>
    </div>
  );
}

/* ---------------------------------------------
   PRIORITY BADGE
--------------------------------------------- */

function PriorityBadge({ priority }) {
  const styles = {
    EMERGENCY: "bg-red-600 text-white",
    HIGH: "bg-orange-100 text-orange-700",
    MEDIUM: "bg-amber-100 text-amber-700",
    LOW: "bg-gray-100 text-gray-600",
  };

  return (
    <span
      className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
        styles[priority] || styles.LOW
      }`}
    >
      {priority}
    </span>
  );
}

export default Alerts;
