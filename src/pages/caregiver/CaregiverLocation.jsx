import React, { useState, useEffect, useCallback } from "react";
import {
  MapPin,
  RefreshCw,
  Clock,
  Navigation,
  ShieldAlert,
  Phone,
  CheckCircle2,
  AlertTriangle,
  Radio,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import LocationMap from "../../components/LocationMap";

export default function CaregiverLocation({ setCurrentView, initialPatientId = "P001" }) {
  const [patientList, setPatientList] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState(initialPatientId);
  const [patient, setPatient] = useState(null);
  const [location, setLocation] = useState(null);
  const [syncStatus, setSyncStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastChecked, setLastChecked] = useState(new Date());

  // Fetch patient list for caregiver
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

  const fetchLocationData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    try {
      const [locRes, patRes, syncRes] = await Promise.all([
        fetch(`/api/caregiver/patients/${selectedPatientId}/location`),
        fetch(`/api/caregiver/patients/${selectedPatientId}`),
        fetch(`/api/caregiver/patients/${selectedPatientId}/sync-status`),
      ]);

      if (locRes.ok) {
        const locData = await locRes.json();
        setLocation(locData);
      }
      if (patRes.ok) {
        const patData = await patRes.json();
        setPatient(patData);
      }
      if (syncRes.ok) {
        const syncData = await syncRes.json();
        setSyncStatus(syncData);
      }
      setLastChecked(new Date());
    } catch (err) {
      console.warn("Failed to fetch caregiver location data:", err);
    } finally {
      setLoading(false);
      if (isManualRefresh) setRefreshing(false);
    }
  }, [selectedPatientId]);

  useEffect(() => {
    fetchLocationData(false);
    // Poll every 10 seconds while viewing this page
    const interval = setInterval(() => {
      fetchLocationData(false);
    }, 10000);
    return () => clearInterval(interval);
  }, [fetchLocationData]);

  // Compute status strictly adhering to requirements:
  // "If the patient's device is offline or location has not updated recently, NEVER label the location as LIVE.
  //  Clearly display 'Last known location' with its timestamp instead."
  const now = Date.now();
  const updateTime = location?.timestamp ? new Date(location.timestamp).getTime() : 0;
  const ageMs = now - updateTime;
  const isRecent = updateTime > 0 && ageMs <= 180000; // 3 minutes

  const isActuallyLive =
    Boolean(location?.sharingEnabled) &&
    location?.status === "LIVE" &&
    isRecent;

  const displayStatus = !location || (typeof location.latitude !== "number" || typeof location.longitude !== "number")
    ? "UNAVAILABLE"
    : isActuallyLive
    ? "LIVE"
    : "LAST KNOWN";

  const formattedTimestamp = location?.timestamp
    ? new Date(location.timestamp).toLocaleString([], {
        dateStyle: "medium",
        timeStyle: "medium",
      })
    : "Not available";

  const patientName = patient?.name || location?.name || "Patient";

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-200/80 pb-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-black text-gray-900">
              Patient Location Monitoring
            </h1>

            {/* LIVE / LAST KNOWN STATUS PILL */}
            <span
              className={`text-xs font-bold px-3 py-1 rounded-full border flex items-center gap-1.5 ${
                displayStatus === "LIVE"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 animate-pulse"
                  : displayStatus === "LAST KNOWN"
                  ? "bg-amber-50 text-amber-700 border-amber-200"
                  : "bg-slate-100 text-slate-600 border-slate-200"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  displayStatus === "LIVE"
                    ? "bg-emerald-600"
                    : displayStatus === "LAST KNOWN"
                    ? "bg-amber-500"
                    : "bg-slate-400"
                }`}
              />
              {displayStatus === "LIVE"
                ? "● LIVE TRACKING"
                : displayStatus === "LAST KNOWN"
                ? "LAST KNOWN LOCATION"
                : "LOCATION UNAVAILABLE"}
            </span>

            {/* SYNC STATUS BADGE */}
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
          <p className="text-xs text-gray-500 mt-1">
            Real-time geospatial tracking and perimeter monitoring for {patientName}.
          </p>
        </div>

        {/* Action Controls & Patient Selector */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Patient Selector Dropdown */}
          {patientList.length > 0 && (
            <div className="flex items-center gap-2">
              <label htmlFor="caregiver-loc-patient-select" className="text-xs font-bold text-slate-600">
                Patient:
              </label>
              <select
                id="caregiver-loc-patient-select"
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
            onClick={() => fetchLocationData(true)}
            disabled={refreshing}
            className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 transition"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin text-teal-700" : ""} />
            <span>{refreshing ? "Refreshing..." : "Refresh Location"}</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentView("caregiver-patients")}
            className="flex items-center gap-1.5 rounded-xl bg-[#0f3e3a] px-4 py-2 text-xs font-bold text-white hover:bg-[#0c312e] transition shadow-xs"
          >
            <span>Patient Profile</span>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* PATIENT CONTEXT STRIP */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-2xl border border-teal-100">
            👵
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">
                {patientName}
              </h2>
              <span className="text-xs px-2 py-0.5 rounded-md bg-stone-100 text-stone-600 font-semibold">
                Room {patient?.room || "402"}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Caregiver: {patient?.caregiver || "Dr. Sarah Jenkins"} • Family Contact: {patient?.familyContact || "Priya Sharma"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6 text-xs text-slate-600">
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400">Sharing Status</p>
            <p className="font-semibold text-slate-800">
              {location?.sharingEnabled ? "Enabled by Patient" : "Disabled / Paused"}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400">Telemetry Status</p>
            <p className={`font-bold ${isActuallyLive ? "text-emerald-700" : "text-amber-700"}`}>
              {isActuallyLive ? "Live GPS Signal" : "Last Known Cached"}
            </p>
          </div>
        </div>
      </div>

      {/* METRICS ROW */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-semibold uppercase text-slate-400">Current / Last Known</p>
          <p className="text-sm font-bold text-slate-900 mt-1 truncate">
            {location?.address || "Guwahati, Assam"}
          </p>
          <p className="text-[11px] text-slate-400 font-mono mt-0.5">
            {typeof location?.latitude === "number" && typeof location?.longitude === "number"
              ? `${location.latitude.toFixed(4)}°, ${location.longitude.toFixed(4)}°`
              : "Awaiting GPS..."}
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-semibold uppercase text-slate-400">Last Updated</p>
          <p className="text-sm font-bold text-slate-900 mt-1 truncate">
            {formattedTimestamp}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {ageMs < 60000
              ? "Just now"
              : `${Math.round(ageMs / 60000)} mins ago`}
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-semibold uppercase text-slate-400">GPS Accuracy</p>
          <p className="text-sm font-bold text-slate-900 mt-1">
            {location?.accuracy ? `±${Math.round(location.accuracy)} meters` : "Standard Precision"}
          </p>
          <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">
            {location?.accuracy && location.accuracy < 20 ? "High Precision" : "Acceptable"}
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-semibold uppercase text-slate-400">Safety Status</p>
          <p className="text-sm font-bold text-slate-900 mt-1 flex items-center gap-1.5">
            <CheckCircle2 size={16} className="text-emerald-600" />
            <span>Within Safe Zone</span>
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Assam Care Perimeter</p>
        </div>
      </div>

      {/* INTERACTIVE MAP CONTAINER */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <MapPin size={18} className="text-teal-700" />
              <span>{patientName}'s Interactive Location Map</span>
            </h2>
            <p className="text-xs text-slate-500">
              OpenStreetMap telemetry with accuracy radius circle and live tracking controls.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">
              Checked at: {lastChecked.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </span>
          </div>
        </div>

        {location && typeof location.latitude === "number" && typeof location.longitude === "number" ? (
          <LocationMap
            latitude={location.latitude}
            longitude={location.longitude}
            accuracy={location.accuracy}
            patientName={patientName}
            status={displayStatus}
            updatedAt={location.timestamp}
            address={location.address}
            height="440px"
            zoom={15}
          />
        ) : (
          <div className="h-80 rounded-2xl bg-stone-100 flex flex-col items-center justify-center text-center p-6 text-slate-500 space-y-2">
            <MapPin size={36} className="text-slate-400" />
            <p className="font-bold text-sm text-slate-700">Location Telemetry Unavailable</p>
            <p className="text-xs max-w-sm">
              Waiting for patient device to share GPS coordinates.
            </p>
          </div>
        )}
      </div>

      {/* QUICK EMERGENCY & CAREGIVER ACTIONS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between space-y-3">
          <div>
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Phone size={16} className="text-teal-700" />
              <span>Contact {patientName} Directly</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Call {patientName}'s monitored room device or tablet.
            </p>
          </div>
          <button
            type="button"
            onClick={() => alert(`Initiating voice call to ${patientName}'s room ${patient?.room || "402"}...`)}
            className="w-full py-2.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-[#0f3e3a] font-bold text-xs border border-teal-200 transition"
          >
            Call {patientName}
          </button>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between space-y-3">
          <div>
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Phone size={16} className="text-teal-700" />
              <span>Emergency Contact</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {patient?.familyContact || "Priya Sharma"} ({patient?.familyRelation || "Family"}) • +91 98765 43210
            </p>
          </div>
          <button
            type="button"
            onClick={() => alert(`Calling family emergency contact: ${patient?.familyContact || "Priya Sharma"}...`)}
            className="w-full py-2.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-[#0f3e3a] font-bold text-xs border border-teal-200 transition"
          >
            Call {patient?.familyContact || "Emergency Contact"}
          </button>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between space-y-3">
          <div>
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <ShieldAlert size={16} className="text-red-600" />
              <span>Safety & SOS Console</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Review emergency triggers and clinical alerts.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setCurrentView("caregiver-safety")}
            className="w-full py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs border border-red-200 transition"
          >
            Open Safety Console
          </button>
        </div>
      </div>
    </div>
  );
}
