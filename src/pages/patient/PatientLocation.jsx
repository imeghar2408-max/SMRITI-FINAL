import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  MapPin,
  ShieldCheck,
  Radio,
  Wifi,
  WifiOff,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Navigation,
  Info,
  ChevronRight,
  Eye,
  EyeOff,
} from "lucide-react";
import LocationMap from "../../components/LocationMap";

const STORAGE_PREF_KEY = "anvesha_location_sharing_enabled";
const STORAGE_LOCATION_KEY = "anvesha_patient_last_location";

export default function PatientLocation({ setCurrentView }) {
  const [sharingEnabled, setSharingEnabled] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_PREF_KEY);
      return stored !== null ? stored === "true" : true;
    } catch {
      return true;
    }
  });

  const [locationData, setLocationData] = useState(null);
  const [status, setStatus] = useState("requesting"); // requesting | active | denied | error | stopped
  const [errorMessage, setErrorMessage] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState("synced"); // synced | syncing | pending_offline | error
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);

  const syncTimerRef = useRef(null);
  const pendingSyncRef = useRef(null);

  // Online / offline listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      fetch("/api/patient/sync-ping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId: "P001", isOnline: true, pendingCount: pendingSyncRef.current ? 1 : 0 }),
      }).catch(() => {});

      if (pendingSyncRef.current) {
        syncWithBackend(pendingSyncRef.current);
      }
    };
    const handleOffline = () => {
      setIsOnline(false);
      setSyncStatus("pending_offline");
      fetch("/api/patient/sync-ping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId: "P001", isOnline: false, pendingCount: 1 }),
      }).catch(() => {});
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Sync with backend helper
  const syncWithBackend = useCallback(async (payload) => {
    if (!navigator.onLine) {
      setSyncStatus("pending_offline");
      pendingSyncRef.current = payload;
      return false;
    }

    setSyncStatus("syncing");
    try {
      const res = await fetch("/api/patient/location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("Server rejected location update");
      }

      const result = await res.json();
      setSyncStatus("synced");
      setLastSyncTime(new Date());
      pendingSyncRef.current = null;
      if (result.location) {
        setLocationData(result.location);
        try {
          localStorage.setItem(STORAGE_LOCATION_KEY, JSON.stringify(result.location));
        } catch {
          /* ignore */
        }
      }
      return true;
    } catch (err) {
      console.warn("Location sync failed, queuing for retry:", err);
      setSyncStatus("pending_offline");
      pendingSyncRef.current = payload;
      return false;
    }
  }, []);

  // Capture position function using dynamic device geolocation
  const captureCurrentPosition = useCallback(async (isPeriodic = false) => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setErrorMessage("Geolocation is not supported by your browser device.");
      setStatus("error");
      return false;
    }

    if (!isPeriodic) {
      setIsUpdating(true);
      setStatus("requesting");
    }
    setErrorMessage(null);

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const acc = position.coords.accuracy;
          const ts = new Date(position.timestamp || Date.now()).toISOString();

          const payload = {
            patientId: "P001",
            latitude: lat,
            longitude: lng,
            accuracy: Math.round(acc),
            timestamp: ts,
            sharingEnabled: true,
            address: "Current Device Location",
          };

          setLocationData(payload);
          setStatus("active");
          setErrorMessage(null);
          setIsUpdating(false);
          setSharingEnabled(true);

          try {
            localStorage.setItem(STORAGE_PREF_KEY, "true");
            localStorage.setItem(STORAGE_LOCATION_KEY, JSON.stringify(payload));
          } catch {
            /* ignore */
          }

          await syncWithBackend(payload);
          resolve(true);
        },
        (error) => {
          setIsUpdating(false);
          console.warn("Geolocation request failed:", error);

          if (error.code === error.PERMISSION_DENIED) {
            setStatus("denied");
            setErrorMessage(
              "Location permission is required to show your current location."
            );
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            setStatus("error");
            setErrorMessage(
              "Location signal is currently unavailable from your device. Please verify your device GPS is enabled."
            );
          } else if (error.code === error.TIMEOUT) {
            setStatus("error");
            setErrorMessage("Location request timed out. Please try again.");
          } else {
            setStatus("error");
            setErrorMessage(
              "Unable to retrieve device location: " + (error.message || "Unknown error")
            );
          }
          resolve(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0, // Always request fresh device coordinates
        }
      );
    });
  }, [syncWithBackend]);

  // Request browser geolocation immediately when page loads
  useEffect(() => {
    captureCurrentPosition(false);
  }, [captureCurrentPosition]);

  // Toggle handler
  const handleToggleSharing = async () => {
    const nextState = !sharingEnabled;
    setSharingEnabled(nextState);

    try {
      localStorage.setItem(STORAGE_PREF_KEY, String(nextState));
    } catch {
      /* ignore */
    }

    if (nextState) {
      await captureCurrentPosition(false);
    } else {
      // Disabled sharing
      setStatus("stopped");
      if (syncTimerRef.current) {
        clearInterval(syncTimerRef.current);
        syncTimerRef.current = null;
      }

      // Notify backend sharing turned off
      syncWithBackend({
        patientId: "P001",
        sharingEnabled: false,
      });
    }
  };

  // Periodic updates while active
  useEffect(() => {
    if (!sharingEnabled) {
      if (syncTimerRef.current) {
        clearInterval(syncTimerRef.current);
        syncTimerRef.current = null;
      }
      return;
    }

    // Sensible update interval: periodic refresh while viewing page
    syncTimerRef.current = setInterval(() => {
      if (sharingEnabled && navigator.onLine) {
        captureCurrentPosition(true);
      }
    }, 30000);

    return () => {
      if (syncTimerRef.current) {
        clearInterval(syncTimerRef.current);
        syncTimerRef.current = null;
      }
    };
  }, [sharingEnabled, captureCurrentPosition]);

  // Status computation for display
  const hasCoordinates =
    locationData &&
    typeof locationData.latitude === "number" &&
    typeof locationData.longitude === "number" &&
    !isNaN(locationData.latitude) &&
    !isNaN(locationData.longitude);

  const displayStatus = !sharingEnabled
    ? "SHARING OFF"
    : status === "requesting"
    ? "ACQUIRING DEVICE GPS..."
    : status === "denied"
    ? "PERMISSION DENIED"
    : status === "error"
    ? "GPS UNAVAILABLE"
    : !isOnline
    ? "OFFLINE (QUEUED)"
    : status === "active" && hasCoordinates
    ? "LIVE DEVICE GPS"
    : "DEVICE GPS READY";

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-gray-200/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black text-[#0f3e3a]">
              Location Sharing
            </span>
            <span
              className={`text-xs font-bold px-3 py-1 rounded-full border ${
                status === "active" && hasCoordinates
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : status === "denied"
                  ? "bg-red-50 text-red-800 border-red-200"
                  : status === "requesting"
                  ? "bg-teal-50 text-teal-800 border-teal-200 animate-pulse"
                  : "bg-stone-100 text-stone-600 border-stone-200"
              }`}
            >
              {displayStatus}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Keep Dr. Sarah Jenkins and your family updated with your real device location for your safety.
          </p>
        </div>

        {/* Connectivity indicator */}
        <div className="flex items-center gap-2 text-xs">
          {isOnline ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50 text-[#0f3e3a] font-semibold border border-teal-200/60">
              <Wifi size={14} className="text-teal-700" />
              <span>Connected</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 font-semibold border border-amber-200">
              <WifiOff size={14} className="text-amber-600" />
              <span>Low Connectivity • Local Queue Active</span>
            </span>
          )}
        </div>
      </div>

      {/* Main Switch Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/90 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="space-y-1.5 max-w-xl">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
              <ShieldCheck className="text-teal-700" size={22} />
              Share my device location with caregiver
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              When turned on, your device's browser GPS coordinates are dynamically shared with Dr. Sarah Jenkins and emergency contacts. You can turn this off at any moment.
            </p>
          </div>

          {/* Big Accessible Toggle Switch */}
          <div className="flex items-center gap-3 self-start sm:self-center">
            <span
              className={`text-xs font-bold uppercase tracking-wider ${
                sharingEnabled ? "text-teal-800" : "text-gray-400"
              }`}
            >
              {sharingEnabled ? "ON" : "OFF"}
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={sharingEnabled}
              onClick={handleToggleSharing}
              disabled={isUpdating && !sharingEnabled}
              className={`relative inline-flex h-9 w-16 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#0f3e3a] focus:ring-offset-2 shadow-inner ${
                sharingEnabled ? "bg-[#0f3e3a]" : "bg-stone-300"
              }`}
            >
              <span
                className={`inline-block h-7 w-7 transform rounded-full bg-white shadow-md transition-transform ${
                  sharingEnabled ? "translate-x-8" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Clear Permission / Error Guidance */}
        {status === "denied" && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-start gap-2.5">
              <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-amber-950">Location Permission Required</p>
                <p className="mt-0.5 text-amber-800">
                  Location permission is required to show your current location. Please allow browser location access in your address bar.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => captureCurrentPosition(false)}
              className="self-start sm:self-center px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition shrink-0"
            >
              Try Again
            </button>
          </div>
        )}

        {status === "error" && errorMessage && status !== "denied" && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-start gap-2.5">
              <AlertTriangle size={18} className="text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Geolocation Notice</p>
                <p className="mt-0.5">{errorMessage}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => captureCurrentPosition(false)}
              className="self-start sm:self-center px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-xs transition shrink-0"
            >
              Retry
            </button>
          </div>
        )}

        {/* Status / Metrics Grid displaying device coordinates */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
          <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200/70 col-span-1">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Sharing Status
            </p>
            <p className="text-sm font-bold text-gray-900 mt-1 flex items-center gap-1.5 truncate">
              <span
                className={`h-2.5 w-2.5 rounded-full shrink-0 ${
                  sharingEnabled && hasCoordinates
                    ? "bg-emerald-500 animate-pulse"
                    : status === "requesting"
                    ? "bg-teal-500 animate-spin"
                    : sharingEnabled
                    ? "bg-amber-500"
                    : "bg-gray-400"
                }`}
              />
              <span className="truncate">{sharingEnabled ? "Active" : "Disabled"}</span>
            </p>
          </div>

          <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200/70 col-span-2 sm:col-span-1">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Device Coordinates
            </p>
            <p className="text-xs sm:text-sm font-bold text-[#0f3e3a] mt-1 font-mono truncate">
              {hasCoordinates ? (
                `${locationData.latitude.toFixed(4)}°, ${locationData.longitude.toFixed(4)}°`
              ) : status === "requesting" ? (
                <span className="text-teal-700">Acquiring GPS...</span>
              ) : status === "denied" ? (
                <span className="text-amber-700">Permission Denied</span>
              ) : (
                <span className="text-gray-400">Awaiting GPS</span>
              )}
            </p>
          </div>

          <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200/70 col-span-1">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              GPS Accuracy
            </p>
            <p className="text-sm font-bold text-gray-900 mt-1 truncate">
              {hasCoordinates && locationData?.accuracy
                ? `±${Math.round(locationData.accuracy)}m`
                : "--"}
            </p>
          </div>

          <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200/70 col-span-1">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Last Updated
            </p>
            <p className="text-sm font-bold text-gray-900 mt-1 truncate">
              {lastSyncTime
                ? lastSyncTime.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })
                : hasCoordinates && locationData?.timestamp
                ? new Date(locationData.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "Not yet acquired"}
            </p>
          </div>

          <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200/70 col-span-1">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Sync Status
            </p>
            <p className="text-sm font-bold text-gray-900 mt-1 flex items-center gap-1 truncate">
              {syncStatus === "syncing" ? (
                <>
                  <RefreshCw size={13} className="animate-spin text-teal-700 shrink-0" />
                  <span className="truncate">Syncing...</span>
                </>
              ) : syncStatus === "pending_offline" ? (
                <>
                  <AlertTriangle size={13} className="text-amber-600 shrink-0" />
                  <span className="text-amber-700 truncate">Queued</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                  <span className="text-emerald-700 truncate">Up to date</span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="text-xs text-gray-500 flex items-center gap-1.5">
            <Clock size={14} className="text-gray-400" />
            <span>Browser GPS automatically updates while active.</span>
          </div>

          {sharingEnabled && (
            <button
              type="button"
              onClick={() => captureCurrentPosition(false)}
              disabled={isUpdating}
              className="px-4 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-[#0f3e3a] text-xs font-bold border border-teal-200 transition flex items-center gap-2"
            >
              <RefreshCw size={14} className={isUpdating ? "animate-spin" : ""} />
              <span>{isUpdating ? "Acquiring GPS..." : "Update Location Now"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Interactive Map Preview Card - Leaflet + OpenStreetMap */}
      <div className="bg-white rounded-3xl p-6 border border-gray-200/90 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <MapPin size={18} className="text-teal-700" />
              <span>Device Location Map</span>
            </h3>
            <p className="text-xs text-gray-500">
              Interactive OpenStreetMap displaying your device's coordinates.
            </p>
          </div>

          <span
            className={`text-xs font-bold px-2.5 py-1 rounded-full ${
              hasCoordinates
                ? "bg-emerald-100 text-emerald-800"
                : "bg-stone-100 text-stone-700"
            }`}
          >
            {hasCoordinates ? "● Centered on Current Device" : "Awaiting Device GPS"}
          </span>
        </div>

        {/* The map is always rendered and usable */}
        <LocationMap
          latitude={locationData?.latitude}
          longitude={locationData?.longitude}
          accuracy={locationData?.accuracy}
          patientName="Asha"
          status={status === "active" && hasCoordinates ? "LIVE" : "LAST KNOWN"}
          updatedAt={locationData?.timestamp || locationData?.updatedAt}
          address={locationData?.address || "Current Device Location"}
          height="360px"
        />
      </div>

      {/* Privacy & Safety Guarantee */}
      <div className="bg-teal-50/60 rounded-3xl p-5 border border-teal-200/70 text-xs text-teal-950 space-y-2">
        <div className="flex items-center gap-2 font-bold text-teal-900 text-sm">
          <Info size={16} className="text-teal-700" />
          <span>Privacy & Clinical Safety Notice</span>
        </div>
        <p className="text-teal-800 leading-relaxed">
          Your actual device coordinates are encrypted and transmitted directly to the secure ANVESHA clinical portal. Only authorized caregivers (Dr. Sarah Jenkins) and verified emergency contacts (Priya Sharma) have access to monitor this map.
        </p>
      </div>
    </div>
  );
}
