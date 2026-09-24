import React, { useState, useEffect } from "react";
import {
  Bell,
  CheckCircle2,
  Clock,
  Droplets,
  Calendar,
  Pill,
  Plus,
  X,
} from "lucide-react";

const initialReminders = [
  {
    id: 1,
    type: "Medicine",
    title: "Morning Medicine",
    time: "8:00 AM",
    description: "Take your morning medicine after breakfast.",
    icon: Pill,
    completed: false,
  },
  {
    id: 2,
    type: "Hydration",
    title: "Drink Water",
    time: "10:00 AM",
    description: "Have a glass of fresh water or herbal tea.",
    icon: Droplets,
    completed: true,
  },
  {
    id: 3,
    type: "Medicine",
    title: "Afternoon Medicine",
    time: "2:00 PM",
    description: "Take your afternoon tablet with milk.",
    icon: Pill,
    completed: false,
  },
  {
    id: 4,
    type: "Appointment",
    title: "Doctor Appointment",
    time: "4:00 PM",
    description: "Courtyard consultation with Dr. Sarah Jenkins.",
    icon: Calendar,
    completed: false,
  },
];

export default function Reminders({ setCurrentView }) {
  const [reminders, setReminders] = useState(initialReminders);
  const [showAdd, setShowAdd] = useState(false);

  const [title, setTitle] = useState("");
  const [time, setTime] = useState("");
  const [type, setType] = useState("Medicine");
  const [description, setDescription] = useState("");

  const iconMap = {
    Medicine: Pill,
    Hydration: Droplets,
    Appointment: Calendar,
    Activity: Bell,
  };

  useEffect(() => {
    fetch("/api/patient/reminders")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const mapped = data.map((item) => ({
            ...item,
            icon: iconMap[item.type] || Bell,
          }));
          setReminders(mapped);
        }
      })
      .catch((err) => console.warn("Failed to fetch reminders:", err));
  }, []);

  const toggleCompleted = async (id) => {
    setReminders((current) =>
      current.map((reminder) =>
        reminder.id === id
          ? { ...reminder, completed: !reminder.completed }
          : reminder
      )
    );

    try {
      await fetch(`/api/patient/reminders/${id}/toggle`, {
        method: "PATCH",
      });
    } catch (err) {
      console.warn("Failed to toggle reminder on server:", err);
    }
  };

  const addReminder = async (e) => {
    e.preventDefault();

    if (!title || !time) return;

    const newReminder = {
      id: Date.now(),
      title,
      time,
      type,
      description,
      icon: iconMap[type] || Bell,
      completed: false,
    };

    setReminders((current) => [newReminder, ...current]);

    try {
      await fetch("/api/patient/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newReminder),
      });
    } catch (err) {
      console.warn("Failed to save reminder:", err);
    }

    setTitle("");
    setTime("");
    setType("Medicine");
    setDescription("");
    setShowAdd(false);
  };

  const completedCount = reminders.filter((r) => r.completed).length;

  return (
    <div className="space-y-7 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Bell size={26} className="text-[#6366D8] dark:text-[#8B8FE8]" />
            <h1 className="text-3xl font-extrabold text-[#202238] dark:text-white">
              My Reminders
            </h1>
          </div>
          <p className="mt-1 text-sm text-[#6B6E85] dark:text-[#9A9DB5]">
            Gentle cues to help you stay comfortable and on track.
          </p>
        </div>

        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center justify-center gap-2 rounded-2xl bg-[#6366D8] hover:bg-[#5255C5] px-5 py-3 text-sm font-bold text-white transition shadow-soft cursor-pointer"
        >
          <Plus size={17} />
          <span>Add Reminder</span>
        </button>
      </div>

      {/* Summary Row */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-[#EAEBF4] dark:border-[#2B2E42] bg-white dark:bg-[#1B1D2A] p-5 shadow-soft">
          <p className="text-xs font-bold uppercase tracking-wide text-[#6B6E85] dark:text-[#9A9DB5]">
            Today's Reminders
          </p>
          <p className="mt-2 text-3xl font-extrabold text-[#6366D8] dark:text-[#8B8FE8] tabular-nums">
            {reminders.length}
          </p>
        </div>

        <div className="rounded-2xl border border-[#EAEBF4] dark:border-[#2B2E42] bg-white dark:bg-[#1B1D2A] p-5 shadow-soft">
          <p className="text-xs font-bold uppercase tracking-wide text-[#6B6E85] dark:text-[#9A9DB5]">
            Completed
          </p>
          <p className="mt-2 text-3xl font-extrabold text-[#78CFA3] tabular-nums">
            {completedCount}
          </p>
        </div>

        <div className="rounded-2xl border border-[#EAEBF4] dark:border-[#2B2E42] bg-white dark:bg-[#1B1D2A] p-5 shadow-soft">
          <p className="text-xs font-bold uppercase tracking-wide text-[#6B6E85] dark:text-[#9A9DB5]">
            Remaining
          </p>
          <p className="mt-2 text-3xl font-extrabold text-[#F3B562] tabular-nums">
            {reminders.length - completedCount}
          </p>
        </div>
      </div>

      {/* Reminder List */}
      <section className="space-y-4">
        {reminders.map((reminder) => {
          const Icon = reminder.icon;

          return (
            <div
              key={reminder.id}
              className={`rounded-3xl border p-5 shadow-soft transition-all duration-200 ${
                reminder.completed
                  ? "bg-[#78CFA3]/10 border-[#78CFA3]/30 opacity-75"
                  : "bg-white dark:bg-[#1B1D2A] border-[#EAEBF4] dark:border-[#2B2E42]"
              }`}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${
                    reminder.completed
                      ? "bg-[#78CFA3]/20 text-[#2E7D56] dark:text-[#78CFA3]"
                      : "bg-[#E8E8FA] dark:bg-[#25283C] text-[#6366D8] dark:text-[#8B8FE8]"
                  }`}
                >
                  <Icon size={24} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2
                      className={`text-lg font-bold ${
                        reminder.completed
                          ? "text-[#6B6E85] line-through"
                          : "text-[#202238] dark:text-white"
                      }`}
                    >
                      {reminder.title}
                    </h2>

                    <span className="rounded-full bg-[#F7F7FC] dark:bg-[#11121C] border border-[#EAEBF4] dark:border-[#2B2E42] px-2.5 py-0.5 text-[10px] font-bold text-[#6B6E85] dark:text-[#9A9DB5]">
                      {reminder.type}
                    </span>
                  </div>

                  <div className="mt-1 flex items-center gap-1.5 text-xs text-[#6366D8] dark:text-[#8B8FE8] font-semibold">
                    <Clock size={14} />
                    <span>{reminder.time}</span>
                  </div>

                  <p className="mt-2 text-xs md:text-sm text-[#6B6E85] dark:text-[#9A9DB5] leading-relaxed">
                    {reminder.description}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleCompleted(reminder.id);
                  }}
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border transition cursor-pointer ${
                    reminder.completed
                      ? "border-[#78CFA3] bg-[#78CFA3] text-white"
                      : "border-[#EAEBF4] dark:border-[#2B2E42] bg-[#F7F7FC] dark:bg-[#11121C] text-[#6B6E85] hover:border-[#6366D8] hover:text-[#6366D8]"
                  }`}
                  aria-label="Mark reminder complete"
                >
                  <CheckCircle2 size={22} />
                </button>
              </div>
            </div>
          );
        })}
      </section>

      {/* Add Reminder Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <form
            onSubmit={addReminder}
            className="relative w-full max-w-md rounded-3xl bg-white dark:bg-[#1B1D2A] border border-[#EAEBF4] dark:border-[#2B2E42] p-7 shadow-soft-lg animate-in fade-in zoom-in-95"
          >
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full bg-[#F7F7FC] dark:bg-[#25283C] text-[#6B6E85] dark:text-[#9A9DB5] hover:text-[#202238] dark:hover:text-white"
            >
              <X size={18} />
            </button>

            <h2 className="text-xl font-bold text-[#202238] dark:text-white">
              Add a Reminder
            </h2>

            <p className="mt-1 text-xs text-[#6B6E85] dark:text-[#9A9DB5]">
              Add an important reminder to your schedule.
            </p>

            <div className="mt-6 space-y-4">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Reminder title (e.g. Afternoon Tea)"
                className="w-full rounded-xl border border-[#EAEBF4] dark:border-[#2B2E42] bg-[#F7F7FC] dark:bg-[#11121C] text-[#202238] dark:text-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#6366D8]"
                required
              />

              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full rounded-xl border border-[#EAEBF4] dark:border-[#2B2E42] bg-[#F7F7FC] dark:bg-[#11121C] text-[#202238] dark:text-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#6366D8]"
                required
              />

              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full rounded-xl border border-[#EAEBF4] dark:border-[#2B2E42] bg-[#F7F7FC] dark:bg-[#11121C] text-[#202238] dark:text-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#6366D8]"
              >
                <option value="Medicine">Medicine</option>
                <option value="Hydration">Hydration</option>
                <option value="Appointment">Appointment</option>
                <option value="Activity">Activity</option>
              </select>

              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description or special instructions..."
                rows={3}
                className="w-full resize-none rounded-xl border border-[#EAEBF4] dark:border-[#2B2E42] bg-[#F7F7FC] dark:bg-[#11121C] text-[#202238] dark:text-white p-4 text-sm outline-none focus:ring-2 focus:ring-[#6366D8]"
              />

              <button
                type="submit"
                className="w-full rounded-xl bg-[#6366D8] hover:bg-[#5255C5] py-3.5 text-sm font-bold text-white shadow-soft transition cursor-pointer"
              >
                Save Reminder
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
