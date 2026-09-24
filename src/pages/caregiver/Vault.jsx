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
  ArrowRight,
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
    <div className="min-h-screen bg-[#F7F7FC] dark:bg-[#11121C] p-6 transition-colors">
      {/* HEADER */}
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E8E8FA] dark:bg-[#25283C] text-[#6366D8] dark:text-[#8B8FE8]">
              <Heart size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-[#202238] dark:text-[#F3F4F6]">
                Memory Vault
              </h1>
              <p className="mt-1 text-sm text-[#6B6E85] dark:text-[#9A9DB5]">
                Persistent photos and cognitive recall memories for {patientDisplayName}.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Patient Selector */}
          {patientList.length > 0 && (
            <div className="flex items-center gap-2">
              <label htmlFor="vault-patient-select" className="text-xs font-bold text-[#6B6E85] dark:text-[#9A9DB5]">
                Patient:
              </label>
              <select
                id="vault-patient-select"
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                className="rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-[#1B1D2A] px-3 py-2 text-xs font-semibold text-[#202238] dark:text-[#F3F4F6] shadow-xs focus:border-[#6366D8] focus:outline-hidden"
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
            className="flex items-center gap-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-[#1B1D2A] px-4 py-2.5 text-xs font-semibold text-[#6B6E85] dark:text-[#C5C8D8] hover:bg-stone-50 dark:hover:bg-stone-800 transition shadow-xs"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin text-[#6366D8]" : ""} />
            <span>{refreshing ? "Syncing..." : "Refresh"}</span>
          </button>

          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center justify-center gap-2 rounded-xl bg-[#6366D8] hover:bg-[#5255C5] px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition"
          >
            <Plus size={16} />
            Add Memory
          </button>
        </div>
      </div>

      {/* PATIENT CONTEXT STRIP */}
      <div className="mb-6 rounded-3xl border border-stone-200/80 dark:border-stone-800/80 bg-white dark:bg-[#1B1D2A] p-5 shadow-soft flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E8E8FA] dark:bg-[#25283C] text-2xl border border-[#6366D8]/20">
            👵
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-[#202238] dark:text-[#F3F4F6]">
                {patientDisplayName}
              </h2>
              <span className="text-xs px-2.5 py-0.5 rounded-lg bg-stone-100 dark:bg-stone-800 text-[#6B6E85] dark:text-[#C5C8D8] font-semibold">
                Room {patient?.room || "402"}
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-lg bg-[#E8E8FA] dark:bg-[#25283C] text-[#6366D8] dark:text-[#8B8FE8] font-semibold">
                ID: {selectedPatientId}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-[#6B6E85] dark:text-[#9A9DB5]">
              {memories.length} saved {memories.length === 1 ? "memory" : "memories"} synchronized with patient portal
            </p>
          </div>
        </div>

        <div className="text-right text-xs text-[#6B6E85] dark:text-[#9A9DB5]">
          <p className="font-semibold text-[#202238] dark:text-[#F3F4F6]">Storage Backend</p>
          <p className="text-[11px] text-[#78CFA3] font-medium">Persistent Disk & SQLite/JSON DB</p>
        </div>
      </div>

      {/* SEARCH + FILTER */}
      <div className="mb-6">
        <div className="relative mb-4">
          <Search
            size={17}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6B6E85] dark:text-[#9A9DB5]"
          />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search memories by name, relationship, description..."
            className="w-full rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-[#1B1D2A] py-3 pl-11 pr-4 text-sm text-[#202238] dark:text-[#F3F4F6] outline-none focus:border-[#6366D8] focus:ring-2 focus:ring-[#6366D8]/20 transition"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {["All", "Family", "Places", "Objects", "Memories"].map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                activeCategory === category
                  ? "bg-[#6366D8] text-white shadow-soft"
                  : "border border-stone-200 dark:border-stone-700 bg-white dark:bg-[#1B1D2A] text-[#6B6E85] dark:text-[#C5C8D8] hover:bg-stone-50 dark:hover:bg-stone-800"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* MEMORY GRID OR EMPTY STATES */}
      {loading ? (
        <div className="rounded-3xl border border-stone-200/80 dark:border-stone-800/80 bg-white dark:bg-[#1B1D2A] p-12 text-center shadow-soft">
          <RefreshCw size={28} className="mx-auto animate-spin text-[#6366D8] mb-3" />
          <p className="text-sm font-semibold text-[#202238] dark:text-[#F3F4F6]">Loading {patientDisplayName}'s memories...</p>
        </div>
      ) : memories.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-stone-300 dark:border-stone-700 bg-white dark:bg-[#1B1D2A] p-12 text-center shadow-soft">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E8E8FA] dark:bg-[#25283C] text-[#6366D8] dark:text-[#8B8FE8]">
            <ImageIcon size={28} />
          </div>
          <h3 className="text-lg font-bold text-[#202238] dark:text-[#F3F4F6]">
            No memories uploaded yet for {patientDisplayName}
          </h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-[#6B6E85] dark:text-[#9A9DB5]">
            When {patientDisplayName} uploads photos from the patient Memory portal, or when you add photos here, they will securely appear in this vault.
          </p>
          <button
            onClick={() => setShowAddForm(true)}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#6366D8] hover:bg-[#5255C5] px-5 py-2.5 text-xs font-bold text-white transition shadow-soft"
          >
            <Plus size={16} />
            Add First Memory
          </button>
        </div>
      ) : filteredMemories.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-stone-300 dark:border-stone-700 bg-white dark:bg-[#1B1D2A] px-6 py-12 text-center shadow-soft">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-stone-100 dark:bg-stone-800">
            <Search size={20} className="text-[#6B6E85] dark:text-[#9A9DB5]" />
          </div>
          <h3 className="text-lg font-semibold text-[#202238] dark:text-[#F3F4F6]">
            No memories found matching "{searchTerm}"
          </h3>
          <p className="mt-1 text-sm text-[#6B6E85] dark:text-[#9A9DB5]">
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
      <div className="mt-8 rounded-3xl border border-[#6366D8]/20 bg-[#E8E8FA]/50 dark:bg-[#25283C]/50 p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#6366D8] text-white">
            <Heart size={18} />
          </div>
          <div>
            <h2 className="font-bold text-[#6366D8] dark:text-[#8B8FE8]">
              Personalized Cognitive Content
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#202238] dark:text-[#C5C8D8]">
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
          className="rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-[#1B1D2A] px-5 py-3 text-sm font-semibold text-[#202238] dark:text-[#F3F4F6] hover:bg-stone-50 dark:hover:bg-stone-800 transition"
        >
          ← Back to Patients
        </button>

        <button
          onClick={() => setCurrentView("caregiver-rhythm")}
          className="rounded-xl bg-[#6366D8] hover:bg-[#5255C5] px-5 py-3 text-sm font-semibold text-white shadow-soft transition"
        >
          View Adaptive Rhythm
        </button>
      </div>

      {/* ADD MEMORY MODAL WITH PERSISTENT FILE UPLOAD */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-[#1B1D2A] p-7 shadow-2xl max-h-[90vh] overflow-y-auto border border-stone-200/80 dark:border-stone-800/80">
            <button
              onClick={() => {
                setShowAddForm(false);
                setSelectedFile(null);
                setPreviewUrl(null);
              }}
              className="absolute right-5 top-5 text-[#6B6E85] hover:text-[#202238] dark:hover:text-white"
            >
              <X size={20} />
            </button>

            <div className="mb-6">
              <h2 className="text-xl font-bold text-[#202238] dark:text-[#F3F4F6]">
                Add Memory for {patientDisplayName}
              </h2>
              <p className="mt-1 text-xs text-[#6B6E85] dark:text-[#9A9DB5]">
                This will persist permanently to the backend for patient and caregiver portals.
              </p>
            </div>

            <form onSubmit={handleAddMemory} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[#202238] dark:text-[#C5C8D8]">
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
                  className="w-full rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-[#11121C] px-4 py-3 text-sm text-[#202238] dark:text-[#F3F4F6] outline-none focus:border-[#6366D8] focus:ring-2 focus:ring-[#6366D8]/20"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[#202238] dark:text-[#C5C8D8]">
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
                  className="w-full rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-[#11121C] px-4 py-3 text-sm text-[#202238] dark:text-[#F3F4F6] outline-none focus:border-[#6366D8] focus:ring-2 focus:ring-[#6366D8]/20"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[#202238] dark:text-[#C5C8D8]">
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
                  className="w-full rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-[#11121C] px-4 py-3 text-sm text-[#202238] dark:text-[#F3F4F6] outline-none focus:border-[#6366D8] focus:ring-2 focus:ring-[#6366D8]/20"
                >
                  <option value="Family">Family</option>
                  <option value="Places">Places</option>
                  <option value="Objects">Objects</option>
                  <option value="Memories">Memories</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[#202238] dark:text-[#C5C8D8]">
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
                  className="w-full resize-none rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-[#11121C] px-4 py-3 text-sm text-[#202238] dark:text-[#F3F4F6] outline-none focus:border-[#6366D8] focus:ring-2 focus:ring-[#6366D8]/20"
                />
              </div>

              {/* REAL IMAGE UPLOAD */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[#202238] dark:text-[#C5C8D8]">
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
                  <div className="relative rounded-2xl border border-stone-200 dark:border-stone-700 overflow-hidden h-36 bg-stone-100 dark:bg-stone-800">
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
                    className="flex h-28 cursor-pointer items-center justify-center rounded-2xl border-2 border-dashed border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-[#11121C] hover:bg-stone-100 dark:hover:bg-stone-800 transition"
                  >
                    <div className="text-center">
                      <Upload size={20} className="mx-auto text-[#6B6E85] dark:text-[#9A9DB5]" />
                      <p className="mt-1 text-xs text-[#202238] dark:text-[#F3F4F6] font-semibold">
                        Click to select image file
                      </p>
                      <p className="text-[10px] text-[#6B6E85] dark:text-[#9A9DB5]">
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
                  className="flex-1 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-[#11121C] py-3 text-sm font-semibold text-[#6B6E85] dark:text-[#C5C8D8] hover:bg-stone-50 dark:hover:bg-stone-800 transition"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 rounded-xl bg-[#6366D8] hover:bg-[#5255C5] py-3 text-sm font-semibold text-white flex items-center justify-center gap-2 shadow-soft transition"
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
    <div className="overflow-hidden rounded-3xl border border-stone-200/80 dark:border-stone-800/80 bg-white dark:bg-[#1B1D2A] shadow-soft flex flex-col justify-between transition-all hover:-translate-y-1 hover:shadow-card">
      <div>
        {/* IMAGE AREA */}
        <div className="relative flex h-48 items-center justify-center bg-stone-100 dark:bg-[#11121C] overflow-hidden">
          {memory.image ? (
            <img
              src={memory.image}
              alt={displayName}
              className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
            />
          ) : (
            <div className="text-center p-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white dark:bg-[#1B1D2A] text-[#6B6E85] dark:text-[#9A9DB5] shadow-xs">
                <ImageIcon size={24} />
              </div>
              <p className="mt-3 text-xs font-semibold text-[#6B6E85] dark:text-[#9A9DB5]">
                No image file uploaded
              </p>
              <p className="mt-0.5 text-[10px] text-[#6B6E85]/70 dark:text-[#9A9DB5]/70">
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
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#6366D8] dark:text-[#8B8FE8]">
                {memory.category || "Memory"}
              </p>
              <h3 className="mt-1 text-lg font-bold text-[#202238] dark:text-[#F3F4F6]">
                {displayName}
              </h3>
              <p className="mt-0.5 text-xs text-[#6B6E85] dark:text-[#9A9DB5] font-medium">
                {relation}
              </p>
            </div>

            <span className="rounded-full bg-[#E8E8FA] dark:bg-[#25283C] px-2.5 py-1 text-[10px] font-semibold text-[#6366D8] dark:text-[#8B8FE8]">
              {memory.category || "Personal"}
            </span>
          </div>

          <p className="mt-3 text-xs leading-5 text-[#6B6E85] dark:text-[#C5C8D8] line-clamp-3">
            {memory.description || "No description recorded for this memory."}
          </p>
        </div>
      </div>

      {/* ACTIONS */}
      <div className="p-5 pt-0">
        <div className="mt-2 flex gap-2 border-t border-stone-100 dark:border-stone-800 pt-3">
          <button
            type="button"
            onClick={() =>
              alert(`Voice memory playback for "${displayName}" will be available in future audio updates.`)
            }
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 py-2.5 text-xs font-semibold text-[#202238] dark:text-[#F3F4F6] hover:bg-stone-200 dark:hover:bg-stone-700 transition"
          >
            <Mic size={14} />
            Voice Note
          </button>

          <button
            type="button"
            onClick={() =>
              alert(`Memory Details:\n\nTitle: ${displayName}\nRelationship: ${relation}\nCategory: ${memory.category}\nPatient: ${patientName}\nDate: ${formattedDate || "N/A"}\n\n${memory.description}`)
            }
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#6366D8] hover:bg-[#5255C5] py-2.5 text-xs font-semibold text-white transition shadow-soft"
          >
            View Details
          </button>
        </div>
      </div>
    </div>
  );
}

export default Vault;
