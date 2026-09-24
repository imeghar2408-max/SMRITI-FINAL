import React, { useState, useEffect } from "react";
import {
  Bell,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  Pill,
  Droplets,
  Utensils,
  Brain,
  CalendarDays,
  X,
  Trash2,
} from "lucide-react";

const initialReminders = [
  {
    id: 1,
    title: "Morning Medication",
    type: "Medication",
    time: "08:00 AM",
    frequency: "Daily",
    status: "Completed",
  },
  {
    id: 2,
    title: "Drink Water",
    type: "Hydration",
    time: "10:00 AM",
    frequency: "Every 2 hours",
    status: "Completed",
  },
  {
    id: 3,
    title: "Lunch",
    type: "Meal",
    time: "01:00 PM",
    frequency: "Daily",
    status: "Upcoming",
  },
  {
    id: 4,
    title: "Attention Match",
    type: "Activity",
    time: "03:00 PM",
    frequency: "Daily",
    status: "Upcoming",
  },
  {
    id: 5,
    title: "Doctor Appointment",
    type: "Appointment",
    time: "04:00 PM",
    frequency: "Today",
    status: "Upcoming",
  },
  {
    id: 6,
    title: "Evening Medication",
    type: "Medication",
    time: "08:00 PM",
    frequency: "Daily",
    status: "Upcoming",
  },
];

function Reminders({ setCurrentView }) {
  const [reminders, setReminders] = useState(initialReminders);
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeFilter, setActiveFilter] = useState("All");

  const [newReminder, setNewReminder] = useState({
    title: "",
    type: "Medication",
    time: "",
    frequency: "Daily",
  });

  const loadReminders = () => {
    fetch("/api/patient/reminders")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const normalized = data.map((r) => ({
            ...r,
            status: r.status || (r.completed ? "Completed" : "Upcoming"),
            type: r.type || "Medication",
          }));
          setReminders(normalized);
        }
      })
      .catch((err) => console.warn("Could not fetch reminders:", err));
  };

  useEffect(() => {
    loadReminders();
    const interval = setInterval(loadReminders, 4000);
    return () => clearInterval(interval);
  }, []);

  const completedCount = reminders.filter((r) => r.status === "Completed").length;
  const upcomingCount = reminders.filter((r) => r.status === "Upcoming").length;
  const missedCount = reminders.filter((r) => r.status === "Missed").length;

  const filteredReminders = reminders.filter((r) => {
    if (activeFilter === "All") return true;
    return r.type?.toLowerCase() === activeFilter.toLowerCase();
  });

  const handleAddReminder = async (e) => {
    e.preventDefault();
    if (!newReminder.title || !newReminder.time) return;

    const payload = {
      title: newReminder.title,
      type: newReminder.type,
      time: newReminder.time,
      frequency: newReminder.frequency,
      status: "Upcoming",
    };

    try {
      const res = await fetch("/api/patient/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        loadReminders();
      }
    } catch (e) {
      setReminders((prev) => [...prev, { ...payload, id: Date.now() }]);
    }

    setNewReminder({
      title: "",
      type: "Medication",
      time: "",
      frequency: "Daily",
    });

    setShowAddForm(false);
  };

  const markCompleted = async (id) => {
    setReminders((prev) =>
      prev.map((reminder) =>
        reminder.id === id
          ? {
              ...reminder,
              status: reminder.status === "Completed" ? "Upcoming" : "Completed",
              completed: reminder.status !== "Completed",
            }
          : reminder,
      ),
    );

    try {
      await fetch(`/api/patient/reminders/${id}/toggle`, {
        method: "PATCH",
      });
    } catch (err) {
      console.warn("Failed to toggle reminder on backend:", err);
    }
  };

  const dismissReminder = (id) => {
    setReminders((prev) => prev.filter((r) => r.id !== id));
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case "Medication":
        return <Pill size={18} className="text-[#E98B9B]" />;
      case "Hydration":
        return <Droplets size={18} className="text-[#6366D8]" />;
      case "Meal":
        return <Utensils size={18} className="text-[#F3B562]" />;
      case "Activity":
        return <Brain size={18} className="text-[#78CFA3]" />;
      default:
        return <CalendarDays size={18} className="text-[#8B8FE8]" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F7FC] dark:bg-[#11121C] p-6 transition-colors">
      {/* HEADER */}
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E8E8FA] dark:bg-[#25283C] text-[#6366D8] dark:text-[#8B8FE8]">
            <Bell size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-[#202238] dark:text-[#F3F4F6]">
              Reminders & Care Plan
            </h1>
            <p className="mt-1 text-sm text-[#6B6E85] dark:text-[#9A9DB5]">
              Manage Asha's daily medication, activities, hydration, meals, and appointments.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center justify-center gap-2 rounded-xl bg-[#6366D8] hover:bg-[#5255C5] px-5 py-3 text-sm font-semibold text-white shadow-soft transition"
        >
          <Plus size={16} />
          Add Reminder
        </button>
      </div>

      {/* PATIENT CONTEXT */}
      <div className="mb-6 rounded-3xl border border-stone-200/80 dark:border-stone-800/80 bg-white dark:bg-[#1B1D2A] p-5 shadow-soft flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E8E8FA] dark:bg-[#25283C] text-2xl border border-[#6366D8]/20">
          👵
        </div>
        <div>
          <h2 className="text-lg font-bold text-[#202238] dark:text-[#F3F4F6]">Asha</h2>
          <p className="mt-0.5 text-xs text-[#6B6E85] dark:text-[#9A9DB5]">Daily care schedule</p>
        </div>
      </div>

      {/* SUMMARY */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <SummaryCard
          title="Completed"
          value={completedCount}
          subtitle="Completed today"
          icon={<CheckCircle2 size={18} />}
          color="green"
        />
        <SummaryCard
          title="Upcoming"
          value={upcomingCount}
          subtitle="Still scheduled"
          icon={<Clock size={18} />}
          color="lavender"
        />
        <SummaryCard
          title="Missed"
          value={missedCount}
          subtitle="Needs attention"
          icon={<AlertCircle size={18} />}
          color="red"
        />
      </div>

      {/* FILTERS */}
      <div className="mb-5 flex flex-wrap gap-2">
        {["All", "Medication", "Hydration", "Meal", "Activity", "Appointment"].map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`rounded-xl px-4 py-2 text-xs font-semibold transition ${
              activeFilter === filter
                ? "bg-[#6366D8] text-white shadow-soft"
                : "border border-stone-200 dark:border-stone-700 bg-white dark:bg-[#1B1D2A] text-[#6B6E85] dark:text-[#C5C8D8] hover:bg-stone-50 dark:hover:bg-stone-800"
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* REMINDER LIST */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredReminders.map((reminder) => (
          <div
            key={reminder.id}
            className={`rounded-3xl border p-5 shadow-soft transition ${
              reminder.status === "Completed"
                ? "border-emerald-200/80 dark:border-emerald-900/40 bg-emerald-50/40 dark:bg-emerald-950/20"
                : "border-stone-200/80 dark:border-stone-800/80 bg-white dark:bg-[#1B1D2A]"
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-stone-100 dark:bg-[#11121C]">
                  {getTypeIcon(reminder.type)}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#202238] dark:text-[#F3F4F6]">
                    {reminder.title}
                  </h3>
                  <p className="mt-0.5 text-xs text-[#6B6E85] dark:text-[#9A9DB5]">
                    {reminder.frequency} • {reminder.type}
                  </p>
                </div>
              </div>

              <span
                className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                  reminder.status === "Completed"
                    ? "bg-[#78CFA3]/20 text-[#78CFA3]"
                    : "bg-[#6366D8]/15 text-[#6366D8] dark:text-[#8B8FE8]"
                }`}
              >
                {reminder.status}
              </span>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-stone-100 dark:border-stone-800 pt-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#6B6E85] dark:text-[#9A9DB5]">
                <Clock size={13} />
                <span>{reminder.time}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => markCompleted(reminder.id)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                    reminder.status === "Completed"
                      ? "bg-stone-100 dark:bg-stone-800 text-[#6B6E85] dark:text-[#C5C8D8]"
                      : "bg-[#6366D8] hover:bg-[#5255C5] text-white shadow-soft"
                  }`}
                >
                  {reminder.status === "Completed" ? "Completed ✓" : "Mark Done"}
                </button>

                <button
                  type="button"
                  onClick={() => dismissReminder(reminder.id)}
                  className="text-stone-400 hover:text-red-500 p-1"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ADD MODAL */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-[#1B1D2A] p-7 shadow-2xl border border-stone-200/80 dark:border-stone-800/80">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-[#202238] dark:text-[#F3F4F6]">
                Add Care Reminder
              </h2>
              <button onClick={() => setShowAddForm(false)} className="text-[#6B6E85] hover:text-[#202238]">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddReminder} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[#202238] dark:text-[#C5C8D8]">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  value={newReminder.title}
                  onChange={(e) => setNewReminder({ ...newReminder, title: e.target.value })}
                  placeholder="e.g. Evening Blood Pressure Pill"
                  className="w-full rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-[#11121C] px-4 py-3 text-sm text-[#202238] dark:text-[#F3F4F6] outline-none focus:border-[#6366D8]"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[#202238] dark:text-[#C5C8D8]">
                  Category
                </label>
                <select
                  value={newReminder.type}
                  onChange={(e) => setNewReminder({ ...newReminder, type: e.target.value })}
                  className="w-full rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-[#11121C] px-4 py-3 text-sm text-[#202238] dark:text-[#F3F4F6] outline-none focus:border-[#6366D8]"
                >
                  <option value="Medication">Medication</option>
                  <option value="Hydration">Hydration</option>
                  <option value="Meal">Meal</option>
                  <option value="Activity">Activity</option>
                  <option value="Appointment">Appointment</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[#202238] dark:text-[#C5C8D8]">
                  Scheduled Time *
                </label>
                <input
                  type="text"
                  required
                  value={newReminder.time}
                  onChange={(e) => setNewReminder({ ...newReminder, time: e.target.value })}
                  placeholder="e.g. 09:30 AM"
                  className="w-full rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-[#11121C] px-4 py-3 text-sm text-[#202238] dark:text-[#F3F4F6] outline-none focus:border-[#6366D8]"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[#202238] dark:text-[#C5C8D8]">
                  Frequency
                </label>
                <input
                  type="text"
                  value={newReminder.frequency}
                  onChange={(e) => setNewReminder({ ...newReminder, frequency: e.target.value })}
                  placeholder="e.g. Daily, Every 2 hours"
                  className="w-full rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-[#11121C] px-4 py-3 text-sm text-[#202238] dark:text-[#F3F4F6] outline-none focus:border-[#6366D8]"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-[#11121C] py-3 text-sm font-semibold text-[#6B6E85] dark:text-[#C5C8D8]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-[#6366D8] hover:bg-[#5255C5] py-3 text-sm font-semibold text-white shadow-soft transition"
                >
                  Save Reminder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ title, value, subtitle, icon, color }) {
  const colorMap = {
    green: "text-[#78CFA3]",
    lavender: "text-[#6366D8] dark:text-[#8B8FE8]",
    red: "text-[#E98B9B]",
  };

  return (
    <div className="rounded-3xl border border-stone-200/80 dark:border-stone-800/80 bg-white dark:bg-[#1B1D2A] p-5 shadow-soft">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-[#6B6E85] dark:text-[#9A9DB5]">{title}</p>
        <div className={colorMap[color]}>{icon}</div>
      </div>
      <p className={`mt-2 text-3xl font-extrabold ${colorMap[color]}`}>{value}</p>
      <p className="mt-1 text-xs text-[#6B6E85]/80 dark:text-[#9A9DB5]/80">{subtitle}</p>
    </div>
  );
}

export default Reminders;
