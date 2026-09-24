import React from "react";
import { usePatient } from "../context/PatientContext";
import { ChevronDown, User } from "lucide-react";

export default function PatientSelector({ className = "", showLabel = true, compact = false }) {
  const { patients, selectedPatientId, setSelectedPatientId, selectedPatient } = usePatient();

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {showLabel && (
        <span className="text-xs font-bold text-[#6B6E85] dark:text-[#9A9DB5] whitespace-nowrap hidden sm:inline">
          Patient:
        </span>
      )}
      <div className="relative inline-flex items-center">
        <select
          id="global-caregiver-patient-selector"
          aria-label="Select Monitored Patient"
          value={selectedPatientId}
          onChange={(e) => setSelectedPatientId(e.target.value)}
          className={`appearance-none bg-white dark:bg-[#1B1D2A] text-[#202238] dark:text-[#EDEFFF] border border-[#EAEBF4] dark:border-[#2B2E42] hover:border-[#6366D8]/50 focus:border-[#6366D8] rounded-xl text-xs font-bold pl-3 pr-8 py-1.5 shadow-xs focus:outline-hidden transition cursor-pointer ${
            compact ? "text-[11px] py-1" : ""
          }`}
        >
          {patients.map((p) => (
            <option
              key={p.id || p.patientId}
              value={p.id || p.patientId}
              className="bg-white dark:bg-[#1B1D2A] text-[#202238] dark:text-[#EDEFFF] py-1 font-semibold"
            >
              {p.avatar || (p.id === "P001" ? "👵" : "👤")} {p.name} (Room {p.room})
              {p.hasDemoData ? " — Demo Data" : " — New Patient"}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6B6E85] dark:text-[#9A9DB5]">
          <ChevronDown size={14} />
        </div>
      </div>
    </div>
  );
}
