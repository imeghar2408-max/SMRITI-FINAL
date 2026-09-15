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
    setSaved(false);
  };

  const saveSettings = () => {
    setSaved(true);
    showToast("Safety monitoring preferences saved successfully.");
    setTimeout(() => setSaved(false), 2000);
  };

  const handleAction = (message) => {
    showToast(message);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      {/* Toast message */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 rounded-2xl bg-[#0f3e3a] text-white px-5 py-3 shadow-lg text-sm font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 size={18} className="text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* HEADER */}
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

        <div className="flex items-center gap-3">

          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
            <ShieldAlert size={23} />
          </div>

          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Safety & SOS
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Monitor Asha's safety status and respond to emergency events.
            </p>
          </div>

        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={triggerTestSos}
            className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2 text-xs font-bold text-red-700 hover:bg-red-100 transition"
          >
            <ShieldAlert size={15} />
            Test SOS Trigger
          </button>

          <div className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold ${isEmergency ? "bg-red-100 text-red-700 animate-pulse" : "bg-emerald-50 text-emerald-700"}`}>
            <CheckCircle2 size={15} />
            {isEmergency ? "Emergency Active" : "Safety System Active"}
          </div>
        </div>

      </div>

      {/* PATIENT CONTEXT */}
      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

        <div className="flex items-center gap-4">

          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-xl">
            👵
          </div>

          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              {patient?.name || "Asha"}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Patient ID {patient?.id || "P001"} • Room {patient?.room || "402"} • Safety Status: <span className={isEmergency ? "text-red-600 font-bold" : "text-emerald-600 font-bold"}>{isEmergency ? "TRIGGERED / EMERGENCY" : "Safe"}</span>
            </p>
          </div>

        </div>

      </div>

      {/* CURRENT STATUS */}
      <div className={`mb-6 rounded-2xl border p-6 transition-colors ${isEmergency ? "border-red-300 bg-red-100 shadow-md" : "border-red-100 bg-red-50/60"}`}>

        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">

          <div className="flex items-start gap-4">

            <div className={`flex h-12 w-12 items-center justify-center rounded-2xl text-white ${isEmergency ? "bg-red-700 animate-bounce" : "bg-red-600"}`}>
              <ShieldAlert size={22} />
            </div>

            <div>

              <p className="text-[10px] font-bold uppercase tracking-widest text-red-500">
                Current Safety Status
              </p>

              <h2 className={`mt-1 text-xl font-black ${isEmergency ? "text-red-900" : "text-slate-900"}`}>
                {isEmergency ? "CRITICAL SOS ALERT: Emergency Triggered" : "Asha is Safe"}
              </h2>

              <p className="mt-1 text-sm text-slate-600">
                {isEmergency
                  ? (pendingEmergency?.message || "Emergency SOS triggered by Asha. Please review immediately.")
                  : "No active emergency has been detected in the last 24 hours."}
              </p>

              {isEmergency && (
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    onClick={resolveEmergency}
                    className="flex items-center gap-2 rounded-xl bg-red-700 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-red-800 transition"
                  >
                    <CheckCircle2 size={16} />
                    RESOLVE SOS & RESET TO SAFE
                  </button>
                  <button
                    onClick={() => setCurrentView("caregiver-alerts")}
                    className="flex items-center gap-2 rounded-xl border border-red-300 bg-white px-4 py-2.5 text-xs font-bold text-red-700 hover:bg-red-50 transition"
                  >
                    View in Alerts Center
                  </button>
                </div>
              )}

            </div>

          </div>

          <span className={`w-fit rounded-full px-3 py-1.5 text-[10px] font-black ${isEmergency ? "bg-red-600 text-white animate-pulse" : "bg-emerald-100 text-emerald-700"}`}>
            {isEmergency ? "EMERGENCY ALERT" : "NORMAL"}
          </span>

        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">

          <StatusCard
            title="Last Safety Check"
            value={isEmergency ? "Just now (Triggered)" : "10:42 AM"}
            icon={<Clock size={16} />}
          />

          <StatusCard
            title="Location"
            value="Room 402, Guwahati"
            icon={<MapPin size={16} />}
          />

          <StatusCard
            title="Device"
            value="Active & Connected"
            icon={<Activity size={16} />}
          />

        </div>

      </div>

      {/* EMERGENCY ACTIONS */}
      <div className="mb-6">

        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Emergency Actions
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Quick actions available to the caregiver.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">

          <ActionCard
            icon={<Phone size={20} />}
            title="Call Asha"
            description="Contact Asha's registered device."
            button="CALL ASHA"
            onClick={() =>
              handleAction("Calling Asha...")
            }
          />

          <ActionCard
            icon={<MapPin size={20} />}
            title="View Location"
            description="View Asha's latest known location."
            button="VIEW LOCATION"
            onClick={() =>
              handleAction("Opening Asha's location...")
            }
          />

          <ActionCard
            icon={<Phone size={20} />}
            title="Emergency Contact"
            description="Contact Asha's emergency person."
            button="CALL CONTACT"
            onClick={() =>
              handleAction("Calling Priya Sharma...")
            }
          />

        </div>

      </div>

      {/* SAFETY EVENTS */}
      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

        <div className="mb-5 flex items-center justify-between">

          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Recent Safety Events
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Recent safety-related activity for Asha.
            </p>
          </div>

          <Activity size={17} className="text-slate-400" />

        </div>

        <div className="space-y-3">
          {alerts.length > 0 ? (
            alerts.slice(0, 5).map((a) => (
              <SafetyEvent
                key={a.id}
                icon={
                  a.priority === "EMERGENCY" ? (
                    <ShieldAlert size={16} />
                  ) : a.type?.toLowerCase().includes("inactivity") ? (
                    <AlertTriangle size={16} />
                  ) : (
                    <CheckCircle2 size={16} />
                  )
                }
                title={a.message}
                time={a.time || "Recently"}
                status={a.status || "Pending"}
                type={
                  a.status === "Resolved"
                    ? "success"
                    : a.priority === "EMERGENCY"
                    ? "warning"
                    : "neutral"
                }
              />
            ))
          ) : (
            <p className="text-sm text-slate-400 py-2">No safety events recorded.</p>
          )}
        </div>

      </div>

      {/* LOCATION + EMERGENCY CONTACT */}
      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">

        {/* LOCATION */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="mb-5 flex items-center justify-between">

            <div className="flex items-center gap-2">

              <MapPin size={18} className="text-[#0f3e3a]" />

              <div>
                <h2 className="font-semibold text-slate-900">
                  Last Known Location
                </h2>

                <p className="mt-1 text-[10px] text-slate-400">
                  Updated 3 minutes ago
                </p>
              </div>

            </div>

            <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
              AVAILABLE
            </span>

          </div>

          {/* MAP PLACEHOLDER */}
          <div className="relative flex h-52 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">

            <div className="absolute inset-0 opacity-30">
              <div className="h-full w-full bg-[linear-gradient(90deg,#cbd5e1_1px,transparent_1px),linear-gradient(#cbd5e1_1px,transparent_1px)] bg-[size:30px_30px]" />
            </div>

            <div className="relative flex flex-col items-center">

              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-600 text-white shadow-lg">
                <MapPin size={22} />
              </div>

              <div className="mt-3 rounded-xl bg-white px-4 py-2 text-center shadow-md">

                <p className="text-xs font-bold text-slate-900">
                  Asha's Location
                </p>

                <p className="mt-1 text-[10px] text-slate-400">
                  Patient residence
                </p>

              </div>

            </div>

          </div>

          <button
            onClick={() =>
              handleAction("Opening map for Asha...")
            }
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#0f3e3a] py-3 text-xs font-bold text-white hover:bg-[#0c312e]"
          >
            <Navigation size={14} />
            Open Map
          </button>

        </div>

        {/* EMERGENCY CONTACT */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="mb-5 flex items-center gap-2">

            <UserRound size={18} className="text-[#0f3e3a]" />

            <div>
              <h2 className="font-semibold text-slate-900">
                Emergency Contact
              </h2>

              <p className="mt-1 text-[10px] text-slate-400">
                Primary emergency person
              </p>
            </div>

          </div>

          <div className="rounded-2xl bg-slate-50 p-5">

            <div className="flex items-center gap-4">

              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-xl">
                👩
              </div>

              <div>

                <h3 className="font-bold text-slate-900">
                  Priya Sharma
                </h3>

                <p className="mt-1 text-xs text-slate-400">
                  Daughter
                </p>

                <p className="mt-1 text-xs font-semibold text-slate-700">
                  +91 98765 43210
                </p>

              </div>

            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">

              <button
                onClick={() =>
                  handleAction("Calling Priya Sharma...")
                }
                className="flex items-center justify-center gap-2 rounded-xl bg-red-600 py-3 text-xs font-bold text-white hover:bg-red-700"
              >
                <Phone size={14} />
                Call
              </button>

              <button
                onClick={() =>
                  handleAction("Opening message composer...")
                }
                className="flex items-center justify-center gap-2 rounded-xl bg-slate-200 py-3 text-xs font-bold text-slate-700 hover:bg-slate-300"
              >
                <MessageCircle size={14} />
                Message
              </button>

            </div>

          </div>

        </div>

      </div>

      {/* SAFETY SETTINGS */}
      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">

          <div className="flex items-center gap-2">

            <Settings size={18} className="text-[#0f3e3a]" />

            <div>
              <h2 className="font-semibold text-slate-900">
                Safety Settings
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                Configure the signals SMRITI should monitor.
              </p>
            </div>

          </div>

          <button
            onClick={saveSettings}
            className="flex items-center justify-center gap-2 rounded-xl bg-[#0f3e3a] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#0c312e]"
          >
            <Save size={14} />
            Save Settings
          </button>

        </div>

        <div className="space-y-3">

          <SettingRow
            title="SOS Alerts"
            description="Notify caregiver when Asha triggers SOS."
            enabled={settings.sosAlerts}
            onToggle={() => toggleSetting("sosAlerts")}
          />

          <SettingRow
            title="Inactivity Alerts"
            description="Alert caregiver when unusual inactivity is detected."
            enabled={settings.inactivityAlerts}
            onToggle={() =>
              toggleSetting("inactivityAlerts")
            }
          />

          <SettingRow
            title="Location Sharing"
            description="Allow caregiver access to Asha's location."
            enabled={settings.locationSharing}
            onToggle={() =>
              toggleSetting("locationSharing")
            }
          />

          <SettingRow
            title="Emergency Calling"
            description="Allow configured emergency actions."
            enabled={settings.emergencyCalling}
            onToggle={() =>
              toggleSetting("emergencyCalling")
            }
          />

        </div>

        {saved && (
          <div className="mt-5 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-700">
            <CheckCircle2 size={15} />
            Safety settings saved successfully.
          </div>
        )}

      </div>

      {/* NAVIGATION */}
      <div className="flex flex-wrap gap-3">

        <button
          onClick={() => setCurrentView("caregiver-patients")}
          className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          ← Back to Patients
        </button>

        <button
          onClick={() => setCurrentView("caregiver-alerts")}
          className="rounded-xl bg-[#0f3e3a] px-5 py-3 text-sm font-semibold text-white hover:bg-[#0c312e]"
        >
          View Alerts
        </button>

      </div>

    </div>
  );
}

/* =========================================================
   COMPONENTS
========================================================= */

function StatusCard({ title, value, icon }) {
  return (
    <div className="rounded-xl border border-red-100 bg-white/80 p-4">

      <div className="flex items-center gap-2 text-slate-400">
        {icon}

        <span className="text-[10px] font-semibold">
          {title}
        </span>
      </div>

      <p className="mt-2 text-sm font-bold text-slate-900">
        {value}
      </p>

    </div>
  );
}

function ActionCard({
  icon,
  title,
  description,
  button,
  onClick,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600">
        {icon}
      </div>

      <h3 className="mt-4 text-sm font-bold text-slate-900">
        {title}
      </h3>

      <p className="mt-1 text-xs leading-5 text-slate-400">
        {description}
      </p>

      <button
        onClick={onClick}
        className="mt-5 w-full rounded-xl bg-slate-100 py-2.5 text-[10px] font-black text-slate-700 hover:bg-slate-200"
      >
        {button}
      </button>

    </div>
  );
}

function SafetyEvent({
  icon,
  title,
  time,
  status,
  type,
}) {
  const styles = {
    success: "bg-emerald-50 text-emerald-700",
    warning: "bg-amber-50 text-amber-700",
    neutral: "bg-slate-100 text-slate-600",
  };

  return (
    <div className="flex items-center justify-between rounded-xl p-3 hover:bg-slate-50">

      <div className="flex items-center gap-3">

        <div
          className={`flex h-9 w-9 items-center justify-center rounded-xl ${styles[type]}`}
        >
          {icon}
        </div>

        <div>

          <p className="text-xs font-bold text-slate-800">
            {title}
          </p>

          <p className="mt-1 text-[10px] text-slate-400">
            {time}
          </p>

        </div>

      </div>

      <span
        className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${styles[type]}`}
      >
        {status}
      </span>

    </div>
  );
}

function SettingRow({
  title,
  description,
  enabled,
  onToggle,
}) {
  return (
    <div className="flex items-center justify-between gap-5 rounded-xl border border-slate-100 p-4">

      <div>

        <p className="text-xs font-bold text-slate-800">
          {title}
        </p>

        <p className="mt-1 text-[10px] text-slate-400">
          {description}
        </p>

      </div>

      <button
        onClick={onToggle}
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${
          enabled ? "bg-[#0f3e3a]" : "bg-slate-300"
        }`}
      >
        <span
          className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
            enabled ? "left-6" : "left-1"
          }`}
        />
      </button>

    </div>
  );
}

export default Safety;
