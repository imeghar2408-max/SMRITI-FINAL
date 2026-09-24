import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export const INITIAL_PATIENTS = [
  {
    patientId: "P001",
    id: "P001",
    name: "Asha",
    age: 78,
    room: "402",
    caregiver: "Dr. Sarah Jenkins",
    familyContact: "Priya Sharma",
    familyRelation: "Daughter",
    status: "active",
    hasDemoData: true,
    avatar: "👵",
    language: "Assamese",
    location: "Assam, NER",
  },
  {
    patientId: "P002",
    id: "P002",
    name: "Ramesh",
    age: 74,
    room: "205",
    caregiver: "Dr. Sarah Jenkins",
    familyContact: "Anita Kumar",
    familyRelation: "Spouse",
    status: "active",
    hasDemoData: false,
    avatar: "👤",
    language: "Hindi",
    location: "Care Wing B",
  },
  {
    patientId: "P003",
    id: "P003",
    name: "Kavita",
    age: 69,
    room: "318",
    caregiver: "Dr. Sarah Jenkins",
    familyContact: "Suresh Patel",
    familyRelation: "Son",
    status: "active",
    hasDemoData: false,
    avatar: "👤",
    language: "English",
    location: "Care Wing C",
  },
  {
    patientId: "P004",
    id: "P004",
    name: "David",
    age: 81,
    room: "114",
    caregiver: "Dr. Sarah Jenkins",
    familyContact: "Grace Chen",
    familyRelation: "Daughter",
    status: "active",
    hasDemoData: false,
    avatar: "👤",
    language: "English",
    location: "Care Wing A",
  },
];

const PatientContext = createContext(null);

const STORAGE_KEY = "anvesha_selected_patient_id";

export function PatientProvider({ children }) {
  const [patients, setPatients] = useState(INITIAL_PATIENTS);
  const [selectedPatientId, setSelectedPatientIdState] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && (stored === "P001" || stored === "P002" || stored === "P003" || stored === "P004")) {
        return stored;
      }
    } catch {}
    return "P001";
  });

  // Re-fetch patient list from API to synchronize real telemetry status
  const refreshPatients = useCallback(async () => {
    try {
      const res = await fetch("/api/caregiver/patients");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          // Merge with initial metadata
          const merged = INITIAL_PATIENTS.map((initP) => {
            const apiP = data.find((d) => d.id === initP.id || d.patientId === initP.patientId);
            return apiP ? { ...initP, ...apiP } : initP;
          });
          setPatients(merged);
        }
      }
    } catch (err) {
      console.warn("PatientContext: could not fetch patient roster from backend:", err);
    }
  }, []);

  useEffect(() => {
    refreshPatients();
  }, [refreshPatients]);

  const setSelectedPatientId = useCallback((id) => {
    setSelectedPatientIdState(id);
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {}
  }, []);

  const selectPatient = useCallback((patientOrId) => {
    const id = typeof patientOrId === "object" ? (patientOrId.id || patientOrId.patientId) : patientOrId;
    if (id) {
      setSelectedPatientId(id);
    }
  }, [setSelectedPatientId]);

  const selectedPatient =
    patients.find((p) => p.id === selectedPatientId || p.patientId === selectedPatientId) ||
    patients[0] ||
    INITIAL_PATIENTS[0];

  const isAsha = selectedPatientId === "P001";
  const hasDemoData = Boolean(selectedPatient?.hasDemoData ?? isAsha);

  const value = {
    patients,
    selectedPatientId,
    selectedPatient,
    setSelectedPatientId,
    selectPatient,
    isAsha,
    hasDemoData,
    refreshPatients,
  };

  return <PatientContext.Provider value={value}>{children}</PatientContext.Provider>;
}

export function usePatient() {
  const context = useContext(PatientContext);
  if (!context) {
    throw new Error("usePatient must be used within a PatientProvider");
  }
  return context;
}
