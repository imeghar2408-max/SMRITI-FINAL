import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export default function LocationMap({
  latitude,
  longitude,
  accuracy,
  patientName = "Asha",
  status = "LIVE",
  updatedAt,
  address,
  height = "380px",
  zoom = 15,
  showRecenter = true,
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const circleRef = useRef(null);

  const isLive = status === "LIVE";
  const isLastKnown = status === "LAST KNOWN";

  const formattedTime = updatedAt
    ? new Date(updatedAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : "Recently";

  const hasCoords =
    typeof latitude === "number" &&
    typeof longitude === "number" &&
    !isNaN(latitude) &&
    !isNaN(longitude);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Default view if coordinates are not available yet (e.g., waiting for permission)
    const targetCenter = hasCoords ? [latitude, longitude] : [20, 0];
    const targetZoom = hasCoords ? zoom : 2;

    // If map does not exist yet, create it
    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        zoomControl: true,
        attributionControl: true,
      }).setView(targetCenter, targetZoom);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
      }).addTo(map);

      mapInstanceRef.current = map;
    } else if (hasCoords) {
      // Map exists and we have valid coordinates, pan smoothly
      mapInstanceRef.current.setView([latitude, longitude], targetZoom, { animate: true });
    }

    const map = mapInstanceRef.current;

    if (hasCoords) {
      // Create marker styling
      const markerColor = isLive ? "#0f766e" : isLastKnown ? "#d97706" : "#64748b";
      const pulseRing = isLive
        ? '<div style="position:absolute; width:44px; height:44px; left:-10px; top:-10px; border-radius:50%; background:rgba(15,118,110,0.3); animation:ping 1.8s cubic-bezier(0,0,0.2,1) infinite;"></div>'
        : "";

      const customIcon = L.divIcon({
        className: "custom-anvesha-marker",
        html: `
          <div style="position:relative; width:28px; height:28px;">
            ${pulseRing}
            <div style="
              width:28px; 
              height:28px; 
              border-radius:50%; 
              background:${markerColor}; 
              border:3px solid #ffffff; 
              box-shadow:0 4px 12px rgba(0,0,0,0.3);
              display:flex;
              align-items:center;
              justify-content:center;
              color:white;
              font-size:13px;
              font-weight:bold;
            ">
              👵
            </div>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
        popupAnchor: [0, -16],
      });

      // Update or add Marker
      if (markerRef.current) {
        markerRef.current.setLatLng([latitude, longitude]);
        markerRef.current.setIcon(customIcon);
      } else {
        markerRef.current = L.marker([latitude, longitude], { icon: customIcon }).addTo(map);
      }

      // Popup content
      const popupContent = `
        <div style="font-family:sans-serif; min-width:180px; padding:4px;">
          <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:6px;">
            <strong style="color:#0f3e3a; font-size:14px;">${patientName}</strong>
            <span style="
              font-size:10px; 
              font-weight:bold; 
              padding:2px 8px; 
              border-radius:999px; 
              background:${isLive ? "#dcfce7" : "#fef3c7"}; 
              color:${isLive ? "#15803d" : "#b45309"};
            ">
              ${isLive ? "● LIVE" : "LAST KNOWN"}
            </span>
          </div>
          ${address ? `<p style="margin:2px 0; font-size:11px; color:#4b5563;">📍 ${address}</p>` : ""}
          <p style="margin:2px 0; font-size:11px; color:#6b7280;">🕒 Updated: ${formattedTime}</p>
          ${accuracy ? `<p style="margin:2px 0; font-size:11px; color:#6b7280;">🎯 Accuracy: ±${Math.round(accuracy)}m</p>` : ""}
          <p style="margin:2px 0; font-size:10px; color:#9ca3af;">${latitude.toFixed(5)}°, ${longitude.toFixed(5)}°</p>
        </div>
      `;

      markerRef.current.bindPopup(popupContent);

      // Update or add Accuracy Circle
      if (accuracy && accuracy > 0) {
        const circleColor = isLive ? "#0f766e" : "#d97706";
        if (circleRef.current) {
          circleRef.current.setLatLng([latitude, longitude]);
          circleRef.current.setRadius(accuracy);
          circleRef.current.setStyle({
            color: circleColor,
            fillColor: circleColor,
          });
        } else {
          circleRef.current = L.circle([latitude, longitude], {
            radius: accuracy,
            color: circleColor,
            fillColor: circleColor,
            fillOpacity: 0.12,
            weight: 1.5,
            dashArray: isLive ? null : "4, 4",
          }).addTo(map);
        }
      } else if (circleRef.current) {
        map.removeLayer(circleRef.current);
        circleRef.current = null;
      }
    } else {
      // If coordinates are not present, remove existing marker & circle
      if (markerRef.current) {
        map.removeLayer(markerRef.current);
        markerRef.current = null;
      }
      if (circleRef.current) {
        map.removeLayer(circleRef.current);
        circleRef.current = null;
      }
    }

    // Invalidate size to prevent tile clipping
    const timer = setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [hasCoords, latitude, longitude, accuracy, status, updatedAt, patientName, address, isLive, isLastKnown, zoom, formattedTime]);

  // Clean up map when component unmounts
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
        circleRef.current = null;
      }
    };
  }, []);

  const handleRecenter = () => {
    if (mapInstanceRef.current && typeof latitude === "number" && typeof longitude === "number") {
      mapInstanceRef.current.setView([latitude, longitude], zoom, { animate: true });
      if (markerRef.current) {
        markerRef.current.openPopup();
      }
    }
  };

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-slate-200/80 shadow-xs bg-stone-100">
      <div
        ref={mapContainerRef}
        style={{ height, width: "100%", zIndex: 1 }}
        className="w-full"
      />

      {showRecenter && typeof latitude === "number" && typeof longitude === "number" && (
        <button
          type="button"
          onClick={handleRecenter}
          className="absolute top-3 right-3 z-10 bg-white/95 backdrop-blur hover:bg-white text-slate-800 px-3 py-1.5 rounded-xl text-xs font-semibold shadow-md border border-slate-200/70 transition flex items-center gap-1.5"
          title="Center on Asha"
        >
          <span>🎯</span>
          <span>Center on {patientName}</span>
        </button>
      )}

      {/* Map watermark overlay info */}
      <div className="absolute bottom-2 left-2 z-10 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-lg text-[11px] text-slate-600 font-mono shadow-xs border border-slate-200/50 pointer-events-none">
        {hasCoords
          ? `${latitude.toFixed(4)}°, ${longitude.toFixed(4)}° ${accuracy ? `(±${Math.round(accuracy)}m)` : ""}`
          : "OpenStreetMap • Awaiting GPS Telemetry"}
      </div>
    </div>
  );
}
