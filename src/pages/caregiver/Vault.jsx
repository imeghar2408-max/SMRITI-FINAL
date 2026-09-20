import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Search,
  Plus,
  Image as ImageIcon,
  Mic,
  Heart,
  X,
  Upload,
  Calendar,
  RefreshCw,
  Clock,
  User,
} from "lucide-react";

function Vault({ setCurrentView, initialPatientId = "P001" }) {
  const [patientList, setPatientList] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState(initialPatientId);
  const [patient, setPatient] = useState(null);
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [showAddForm, setShowAddForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);

  const [newMemory, setNewMemory] = useState({
    name: "",
    relation: "",
    category: "Family",
    description: "",
  });

  // Load caregiver's patient list
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

  // Fetch selected patient's profile and real persistent memories
  const loadMemories = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [memRes, patRes] = await Promise.all([
        fetch(`/api/memories/${selectedPatientId}`),
        fetch(`/api/caregiver/patients/${selectedPatientId}`),
      ]);

      if (memRes.ok) {
        const memData = await memRes.json();
        setMemories(Array.isArray(memData) ? memData : []);
      } else {
        setMemories([]);
      }

      if (patRes.ok) {
        const patData = await patRes.json();
        setPatient(patData);
      }
    } catch (err) {
      console.error("Failed to load patient memories:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedPatientId]);

  useEffect(() => {
    loadMemories();
  }, [loadMemories]);

  // Filter memories
  const filteredMemories = memories.filter((memory) => {
    const title = (memory.title || memory.name || "").toLowerCase();
    const desc = (memory.description || "").toLowerCase();
    const rel = (memory.subtitle || memory.relation || "").toLowerCase();
    const query = searchTerm.toLowerCase();

    const matchesSearch = title.includes(query) || desc.includes(query) || rel.includes(query);

    const normCat = memory.category || "Family";
    const matchesCategory =
      activeCategory === "All" ||
      normCat.toLowerCase() === activeCategory.toLowerCase() ||
      (activeCategory === "Family" && (normCat === "People" || normCat === "Family"));

    return matchesSearch && matchesCategory;
  });

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleAddMemory = async (e) => {
    e.preventDefault();
    if (!newMemory.name.trim()) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("patientId", selectedPatientId);
      formData.append("title", newMemory.name);
      formData.append("subtitle", newMemory.relation || "Family");
      formData.append("category", newMemory.category || "Family");
      formData.append("description", newMemory.description || "");
      formData.append("year", new Date().getFullYear().toString());

      if (selectedFile) {
        formData.append("image", selectedFile);
      }

      const res = await fetch("/api/memories/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        // Reload persisted memories
        await loadMemories(true);
        setShowAddForm(false);
        setNewMemory({
          name: "",
          relation: "",
          category: "Family",
          description: "",
        });
        setSelectedFile(null);
        setPreviewUrl(null);
      } else {
        alert("Failed to save memory. Please check connection.");
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert("Error saving memory. Please retry.");
    } finally {
      setUploading(false);
    }
  };

  const patientDisplayName = patient?.name || (selectedPatientId === "P001" ? "Asha" : `Patient ${selectedPatientId}`);

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      {/* HEADER */}
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-[#0f3e3a]">
              <Heart size={23} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                Memory Vault
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Persistent photos and cognitive recall memories for {patientDisplayName}.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Patient Selector */}
          {patientList.length > 0 && (
            <div className="flex items-center gap-2">
              <label htmlFor="vault-patient-select" className="text-xs font-bold text-slate-600">
                Patient:
              </label>
              <select
                id="vault-patient-select"
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
            onClick={() => loadMemories(true)}
            disabled={refreshing}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition shadow-xs"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin text-teal-700" : ""} />
            <span>{refreshing ? "Syncing..." : "Refresh"}</span>
          </button>

          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center justify-center gap-2 rounded-xl bg-[#0f3e3a] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0c312e] shadow-xs"
          >
            <Plus size={16} />
            Add Memory
          </button>
        </div>
      </div>

      {/* PATIENT CONTEXT STRIP */}
      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-2xl border border-teal-100">
            👵
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">
                {patientDisplayName}
              </h2>
              <span className="text-xs px-2.5 py-0.5 rounded-md bg-stone-100 text-stone-600 font-semibold">
                Room {patient?.room || "402"}
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-md bg-teal-50 text-[#0f3e3a] font-semibold">
                ID: {selectedPatientId}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-slate-500">
              {memories.length} saved {memories.length === 1 ? "memory" : "memories"} synchronized with patient portal
            </p>
          </div>
        </div>

        <div className="text-right text-xs text-slate-500">
          <p className="font-semibold text-slate-700">Storage Backend</p>
          <p className="text-[11px] text-emerald-700 font-medium">Persistent Disk & SQLite/JSON DB</p>
        </div>
      </div>

      {/* SEARCH + FILTER */}
      <div className="mb-6">
        <div className="relative mb-4">
          <Search
            size={17}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search memories by name, relationship, description..."
            className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {["All", "Family", "Places", "Objects", "Memories"].map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                activeCategory === category
                  ? "bg-slate-900 text-white"
                  : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* MEMORY GRID OR EMPTY STATES */}
      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <RefreshCw size={28} className="mx-auto animate-spin text-teal-700 mb-3" />
          <p className="text-sm font-semibold text-slate-700">Loading {patientDisplayName}'s memories...</p>
        </div>
      ) : memories.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-white p-12 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-[#0f3e3a]">
            <ImageIcon size={28} />
          </div>
          <h3 className="text-lg font-bold text-slate-900">
            No memories uploaded yet for {patientDisplayName}
          </h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
            When {patientDisplayName} uploads photos from the patient Memory portal, or when you add photos here, they will securely appear in this vault.
          </p>
          <button
            onClick={() => setShowAddForm(true)}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#0f3e3a] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#0c312e] transition"
          >
            <Plus size={16} />
            Add First Memory
          </button>
        </div>
      ) : filteredMemories.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
            <Search size={20} className="text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900">
            No memories found matching "{searchTerm}"
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Try another search keyword or switch the category filter.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredMemories.map((memory) => (
            <MemoryCard
              key={memory.id}
              memory={memory}
              patientName={patientDisplayName}
            />
          ))}
        </div>
      )}

      {/* HOW IT WORKS */}
      <div className="mt-8 rounded-2xl border border-teal-100 bg-teal-50/60 p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0f3e3a] text-white">
            <Heart size={18} />
          </div>
          <div>
            <h2 className="font-semibold text-[#0f3e3a]">
              Personalized Cognitive Content
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Caregivers can review familiar people, places, objects, and meaningful memories uploaded by {patientDisplayName}.
              ANVESHA utilizes this persistent content in personalized recognition and recall activities.
            </p>
          </div>
        </div>
      </div>

      {/* NAVIGATION */}
      <div className="mt-6 flex flex-wrap gap-3">
        <button
          onClick={() => setCurrentView("caregiver-patients")}
          className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          ← Back to Patients
        </button>

        <button
          onClick={() => setCurrentView("caregiver-rhythm")}
          className="rounded-xl bg-[#0f3e3a] px-5 py-3 text-sm font-semibold text-white hover:bg-[#0c312e]"
        >
          View Adaptive Rhythm
        </button>
      </div>

      {/* ADD MEMORY MODAL WITH PERSISTENT FILE UPLOAD */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => {
                setShowAddForm(false);
                setSelectedFile(null);
                setPreviewUrl(null);
              }}
              className="absolute right-5 top-5 text-slate-400 hover:text-slate-700"
            >
              <X size={20} />
            </button>

            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-900">
                Add Memory for {patientDisplayName}
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                This will persist permanently to the backend for patient and caregiver portals.
              </p>
            </div>

            <form onSubmit={handleAddMemory} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                  Name / Memory Title *
                </label>
                <input
                  type="text"
                  required
                  value={newMemory.name}
                  onChange={(e) =>
                    setNewMemory({
                      ...newMemory,
                      name: e.target.value,
                    })
                  }
                  placeholder="e.g. Priya"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                  Relationship / Type
                </label>
                <input
                  type="text"
                  value={newMemory.relation}
                  onChange={(e) =>
                    setNewMemory({
                      ...newMemory,
                      relation: e.target.value,
                    })
                  }
                  placeholder="e.g. Daughter"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                  Category
                </label>
                <select
                  value={newMemory.category}
                  onChange={(e) =>
                    setNewMemory({
                      ...newMemory,
                      category: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                >
                  <option value="Family">Family</option>
                  <option value="Places">Places</option>
                  <option value="Objects">Objects</option>
                  <option value="Memories">Memories</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                  Description
                </label>
                <textarea
                  value={newMemory.description}
                  onChange={(e) =>
                    setNewMemory({
                      ...newMemory,
                      description: e.target.value,
                    })
                  }
                  placeholder="Add a short description to assist recall..."
                  rows="3"
                  className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                />
              </div>

              {/* REAL IMAGE UPLOAD */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                  Memory Photo
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />

                {previewUrl ? (
                  <div className="relative rounded-xl border border-slate-200 overflow-hidden h-36 bg-slate-100">
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFile(null);
                        setPreviewUrl(null);
                      }}
                      className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 hover:bg-black/80"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="flex h-28 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 transition"
                  >
                    <div className="text-center">
                      <Upload size={20} className="mx-auto text-slate-400" />
                      <p className="mt-1 text-xs text-slate-600 font-semibold">
                        Click to select image file
                      </p>
                      <p className="text-[10px] text-slate-400">
                        PNG, JPG, or WEBP saved directly to backend
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => {
                    setShowAddForm(false);
                    setSelectedFile(null);
                    setPreviewUrl(null);
                  }}
                  className="flex-1 rounded-xl border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 rounded-xl bg-[#0f3e3a] py-3 text-sm font-semibold text-white hover:bg-[#0c312e] flex items-center justify-center gap-2"
                >
                  {uploading ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Add Memory</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   MEMORY CARD
========================================================= */

function MemoryCard({ memory, patientName }) {
  const displayName = memory.title || memory.name || "Untitled Memory";
  const relation = memory.subtitle || memory.relation || "Personal Memory";
  const formattedDate = memory.uploadedAt || memory.createdAt || memory.timestamp
    ? new Date(memory.uploadedAt || memory.createdAt || memory.timestamp).toLocaleString([], {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : null;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col justify-between">
      <div>
        {/* IMAGE AREA */}
        <div className="relative flex h-48 items-center justify-center bg-slate-100 overflow-hidden">
          {memory.image ? (
            <img
              src={memory.image}
              alt={displayName}
              className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
            />
          ) : (
            <div className="text-center p-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm">
                <ImageIcon size={24} />
              </div>
              <p className="mt-3 text-xs font-semibold text-slate-500">
                No image file uploaded
              </p>
              <p className="mt-0.5 text-[10px] text-slate-400">
                Upload image to show in recognition games
              </p>
            </div>
          )}

          {/* UPLOAD TIMESTAMP PILL */}
          {formattedDate && (
            <div className="absolute bottom-2 right-2 rounded-lg bg-black/65 backdrop-blur-xs px-2.5 py-1 text-[10px] font-medium text-white flex items-center gap-1">
              <Clock size={11} />
              <span>{formattedDate}</span>
            </div>
          )}
        </div>

        {/* CONTENT */}
        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {memory.category || "Memory"}
              </p>
              <h3 className="mt-1 text-lg font-bold text-slate-900">
                {displayName}
              </h3>
              <p className="mt-0.5 text-xs text-slate-500 font-medium">
                {relation}
              </p>
            </div>

            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-600">
              {memory.category || "Personal"}
            </span>
          </div>

          <p className="mt-3 text-xs leading-5 text-slate-600 line-clamp-3">
            {memory.description || "No description recorded for this memory."}
          </p>
        </div>
      </div>

      {/* ACTIONS */}
      <div className="p-5 pt-0">
        <div className="mt-2 flex gap-2 border-t border-slate-100 pt-3">
          <button
            type="button"
            onClick={() =>
              alert(`Voice memory playback for "${displayName}" will be available in future audio updates.`)
            }
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-slate-100 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition"
          >
            <Mic size={14} />
            Voice Note
          </button>

          <button
            type="button"
            onClick={() =>
              alert(`Memory Details:\n\nTitle: ${displayName}\nRelationship: ${relation}\nCategory: ${memory.category}\nPatient: ${patientName}\nDate: ${formattedDate || "N/A"}\n\n${memory.description}`)
            }
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#0f3e3a] py-2.5 text-xs font-semibold text-white hover:bg-[#0c312e] transition"
          >
            View Details
          </button>
        </div>
      </div>
    </div>
  );
}

export default Vault;
