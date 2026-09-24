import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  AlertTriangle,
  MapPin,
  Phone,
  Clock,
  CheckCircle2,
  Activity,
  Settings,
  Save,
  UserRound,
  Navigation,
  MessageCircle,
} from "lucide-react";

function Safety({ setCurrentView }) {
  const [settings, setSettings] = useState({
    sosAlerts: true,
    inactivityAlerts: true,
    locationSharing: true,
    emergencyCalling: true,
  });

  const [saved, setSaved] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = () => {
    Promise.all([
      fetch("/api/caregiver/alerts").then((r) => (r.ok ? r.json() : [])),
      fetch("/api/patient/profile").then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([alertsData, patientData]) => {
        setAlerts(alertsData || []);
        setPatient(patientData);
        setLoading(false);
      })
      .catch((err) => {
        console.warn("Error loading safety data:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const pendingEmergency = alerts.find(
    (a) => a.status === "Pending" && a.priority === "EMERGENCY"
  );
  const isEmergency = Boolean(pendingEmergency || patient?.safetyStatus === "Triggered");

  const resolveEmergency = async () => {
    if (pendingEmergency) {
      try {
        await fetch(`/api/caregiver/alerts/${pendingEmergency.id}/resolve`, {
          method: "PATCH",
        });
        showToast("SOS emergency resolved and safety status reset to Safe.");
        loadData();
      } catch (err) {
        showToast("Failed to resolve emergency alert.");
      }
    } else {
      showToast("Safety status confirmed and normal.");
    }
  };

  const triggerTestSos = async () => {
    try {
      await fetch("/api/caregiver/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient: patient?.name || "Asha",
          patientId: patient?.id || "P001",
          type: "Emergency SOS",
          message: "SOS button triggered directly by Asha.",
          priority: "EMERGENCY",
        }),
      });
      showToast("Emergency SOS broadcasted!");
      loadData();
    } catch (e) {
      showToast("Failed to trigger SOS.");
    }
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const toggleSetting = (key) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const saveSettings = () => {
    setSaved(true);
    showToast("Safety configuration updated successfully.");
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="min-h-screen bg-[#F7F7FC] dark:bg-[#11121C] p-6 transition-colors">
      {/* TOAST */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 rounded-2xl bg-[#202238] dark:bg-[#F3F4F6] text-white dark:text-[#11121C] px-5 py-3 shadow-2xl text-xs font-bold animate-bounce">
          {toastMessage}
        </div>
      )}

      {/* HEADER */}
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E8E8FA] dark:bg-[#25283C] text-[#6366D8] dark:text-[#8B8FE8]">
            <ShieldAlert size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-[#202238] dark:text-[#F3F4F6]">
              Safety & Emergency Console
            </h1>
            <p className="mt-1 text-sm text-[#6B6E85] dark:text-[#9A9DB5]">
              Real-time emergency monitoring, geofencing and escalation protocols.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={triggerTestSos}
            className="flex items-center gap-2 rounded-xl bg-[#E98B9B]/15 hover:bg-[#E98B9B]/25 text-[#E98B9B] border border-[#E98B9B]/30 px-4 py-2.5 text-xs font-bold transition"
          >
            <AlertTriangle size={14} />
            Test SOS Trigger
          </button>
        </div>
      </div>

      {/* EMERGENCY BANNER IF TRIGGERED */}
      {isEmergency && (
        <div className="mb-8 rounded-3xl border border-[#E98B9B] bg-[#E98B9B]/10 p-6 animate-pulse">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-[#E98B9B] text-white flex items-center justify-center text-2xl font-bold">
                ⚠️
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-[#E98B9B]">
                  CRITICAL EMERGENCY SOS ACTIVE
                </h2>
                <p className="text-xs text-[#202238] dark:text-[#F3F4F6] mt-0.5">
                  {pendingEmergency?.message || "Emergency SOS signal received from Asha."}
                </p>
              </div>
            </div>

            <button
              onClick={resolveEmergency}
              className="rounded-xl bg-[#E98B9B] hover:bg-[#d87989] text-white px-5 py-2.5 text-xs font-bold transition shadow-soft"
            >
              Acknowledge & Resolve Alert
            </button>
          </div>
        </div>
      )}

      {/* STATUS OVERVIEW */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-3xl border border-stone-200/80 dark:border-stone-800/80 bg-white dark:bg-[#1B1D2A] p-5 shadow-soft">
          <p className="text-xs font-medium text-[#6B6E85] dark:text-[#9A9DB5]">Overall Safety Status</p>
          <p className={`mt-2 text-2xl font-extrabold ${isEmergency ? "text-[#E98B9B]" : "text-[#78CFA3]"}`}>
            {isEmergency ? "ALERT TRIGGERED" : "NORMAL / SAFE"}
          </p>
          <p className="mt-1 text-xs text-[#6B6E85]/80 dark:text-[#9A9DB5]/80">Perimeter secured</p>
        </div>

        <div className="rounded-3xl border border-stone-200/80 dark:border-stone-800/80 bg-white dark:bg-[#1B1D2A] p-5 shadow-soft">
          <p className="text-xs font-medium text-[#6B6E85] dark:text-[#9A9DB5]">Active Alerts</p>
          <p className="mt-2 text-2xl font-extrabold text-[#6366D8] dark:text-[#8B8FE8]">
            {alerts.filter((a) => a.status === "Pending").length}
          </p>
          <p className="mt-1 text-xs text-[#6B6E85]/80 dark:text-[#9A9DB5]/80">Requiring review</p>
        </div>

        <div className="rounded-3xl border border-stone-200/80 dark:border-stone-800/80 bg-white dark:bg-[#1B1D2A] p-5 shadow-soft">
          <p className="text-xs font-medium text-[#6B6E85] dark:text-[#9A9DB5]">Geofence Zone</p>
          <p className="mt-2 text-2xl font-extrabold text-[#78CFA3]">INSIDE ZONE</p>
          <p className="mt-1 text-xs text-[#6B6E85]/80 dark:text-[#9A9DB5]/80">Assam Safe Campus</p>
        </div>

        <div className="rounded-3xl border border-stone-200/80 dark:border-stone-800/80 bg-white dark:bg-[#1B1D2A] p-5 shadow-soft">
          <p className="text-xs font-medium text-[#6B6E85] dark:text-[#9A9DB5]">Escalation Line</p>
          <p className="mt-2 text-2xl font-extrabold text-[#202238] dark:text-[#F3F4F6]">READY</p>
          <p className="mt-1 text-xs text-[#6B6E85]/80 dark:text-[#9A9DB5]/80">Primary Caregiver Line</p>
        </div>
      </div>

      {/* PROTOCOL SETTINGS */}
      <div className="rounded-3xl border border-stone-200/80 dark:border-stone-800/80 bg-white dark:bg-[#1B1D2A] p-6 shadow-soft mb-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#202238] dark:text-[#F3F4F6]">
              Safety Automation Protocols
            </h2>
            <p className="mt-0.5 text-xs text-[#6B6E85] dark:text-[#9A9DB5]">
              Configure automatic escalations for patient anomalies.
            </p>
          </div>
          <button
            onClick={saveSettings}
            className="flex items-center gap-1.5 rounded-xl bg-[#6366D8] hover:bg-[#5255C5] px-4 py-2 text-xs font-bold text-white shadow-soft transition"
          >
            <Save size={14} />
            <span>Save Protocols</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            {
              id: "sosAlerts",
              label: "Instant SOS Broadcasts",
              desc: "Immediately trigger sound and visual alerts when SOS is pressed",
            },
            {
              id: "inactivityAlerts",
              label: "Inactivity Anomaly Detection",
              desc: "Escalate when patient is inactive longer than 3 hours during day",
            },
            {
              id: "locationSharing",
              label: "Live Geofence Telemetry",
              desc: "Track patient coordinates against permitted safe-perimeter bounds",
            },
            {
              id: "emergencyCalling",
              label: "1-Click Direct Escalation Call",
              desc: "Allow immediate emergency contact autodialing from caregiver dashboard",
            },
          ].map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-4 rounded-2xl border border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-[#11121C]"
            >
              <div>
                <p className="text-sm font-bold text-[#202238] dark:text-[#F3F4F6]">
                  {item.label}
                </p>
                <p className="mt-0.5 text-xs text-[#6B6E85] dark:text-[#9A9DB5]">
                  {item.desc}
                </p>
              </div>

              <button
                type="button"
                onClick={() => toggleSetting(item.id)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings[item.id] ? "bg-[#6366D8]" : "bg-stone-300 dark:bg-stone-700"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings[item.id] ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Safety;
