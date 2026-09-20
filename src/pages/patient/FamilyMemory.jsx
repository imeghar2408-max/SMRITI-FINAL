import React, { useMemo, useState, useEffect } from "react";
import {
  Heart,
  Volume2,
  Play,
  Mic,
  Star,
  Calendar,
  Users,
  X,
  CheckCircle2,
  RotateCcw,
  Plus,
  Sparkles,
  ImagePlus,
  Upload,
  Trash2,
  Loader2,
  WifiOff,
  AlertCircle,
} from "lucide-react";

const initialMemories = [
  {
    id: 1,
    patientId: "P001",
    title: "Priya",
    subtitle: "Daughter",
    category: "People",
    image: "",
    description:
      "Priya is your daughter. She enjoys spending time with you and visiting on weekends.",
    year: "Family",
    favorite: true,
  },
  {
    id: 2,
    patientId: "P001",
    title: "Rahul",
    subtitle: "Grandson",
    category: "People",
    image: "",
    description:
      "Rahul is your grandson. You often enjoy talking and playing games together.",
    year: "Family",
    favorite: false,
  },
  {
    id: 3,
    patientId: "P001",
    title: "Family Celebration",
    subtitle: "A special family day",
    category: "Events",
    image: "",
    description:
      "A happy family gathering filled with conversations, food and shared memories.",
    year: "2024",
    favorite: true,
  },
  {
    id: 4,
    patientId: "P001",
    title: "Morning Garden",
    subtitle: "A familiar place",
    category: "Places",
    image: "",
    description:
      "A peaceful garden where you enjoyed spending quiet mornings.",
    year: "Childhood",
    favorite: false,
  },
  {
    id: 5,
    patientId: "P001",
    title: "Festival Memory",
    subtitle: "A familiar celebration",
    category: "Culture",
    image: "",
    description:
      "A familiar festival memory involving family, traditional food and celebration.",
    year: "Family Tradition",
    favorite: false,
  },
  {
    id: 6,
    patientId: "P001",
    title: "Favourite Meal",
    subtitle: "A familiar food memory",
    category: "Culture",
    image: "",
    description:
      "A favourite traditional meal often prepared during family gatherings.",
    year: "Family Tradition",
    favorite: false,
  },
];

const categories = ["All", "People", "Places", "Events", "Culture"];

const recallOptions = ["Priya", "Rahul", "Anil"];

function speak(text) {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.85;
    utterance.pitch = 1;

    window.speechSynthesis.speak(utterance);
  }
}

function ImageSlot({ image, onUpload, large = false, isUploading = false }) {
  return (
    <label
      className={`relative flex cursor-pointer items-center justify-center overflow-hidden border-2 border-dashed border-gray-300 bg-stone-100 transition hover:border-[#0f3e3a] ${
        large ? "h-48 rounded-2xl" : "h-44 rounded-3xl"
      }`}
    >
      {isUploading ? (
        <div className="flex flex-col items-center justify-center text-center text-[#0f3e3a] p-4">
          <Loader2 size={32} className="animate-spin mb-2 text-[#0f3e3a]" />
          <p className="text-xs font-bold text-[#0f3e3a]">Saving photo...</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Uploading to vault</p>
        </div>
      ) : image ? (
        <img
          src={image}
          alt="Memory"
          className="h-full w-full object-cover"
          onError={(e) => {
            // Gracefully handle broken image links
            e.currentTarget.style.display = "none";
          }}
        />
      ) : (
        <div className="flex flex-col items-center justify-center text-center text-gray-400">
          <ImagePlus size={36} className="mb-2 text-[#0f3e3a]" />
          <p className="text-sm font-bold text-gray-600">
            Add Memory Photo
          </p>
          <p className="mt-1 text-xs text-gray-400">
            Click to upload an image
          </p>
        </div>
      )}

      {!isUploading && (
        <div className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 shadow-md">
          <Upload size={16} className="text-[#0f3e3a]" />
        </div>
      )}

      <input
        type="file"
        accept="image/*"
        disabled={isUploading}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            onUpload(file);
            e.target.value = "";
          }
        }}
      />
    </label>
  );
}

export default function FamilyMemory() {
  const [memories, setMemories] = useState(initialMemories);
  const [activeCategory, setActiveCategory] = useState("All");
  const [selectedMemory, setSelectedMemory] = useState(null);
  const [uploadingId, setUploadingId] = useState(null);
  const [feedbackMessage, setFeedbackMessage] = useState(null);
  const [pendingUploads, setPendingUploads] = useState([]);

  // Fetch patient memories from backend on mount
  const fetchPatientMemories = async () => {
    try {
      const res = await fetch("/api/memories/P001");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setMemories(data);
          return;
        }
      }
      // Fallback if needed
      const fallbackRes = await fetch("/api/patient/memories");
      if (fallbackRes.ok) {
        const fallbackData = await fallbackRes.json();
        if (Array.isArray(fallbackData) && fallbackData.length > 0) {
          setMemories(fallbackData);
        }
      }
    } catch (err) {
      console.warn("Failed to load memories from backend:", err);
    }
  };

  useEffect(() => {
    fetchPatientMemories();
  }, []);

  // Offline retry handler
  useEffect(() => {
    const handleOnline = async () => {
      if (pendingUploads.length > 0) {
        setFeedbackMessage({
          type: "pending",
          text: "Connection restored! Uploading pending photos...",
        });
        const toRetry = [...pendingUploads];
        setPendingUploads([]);
        for (const item of toRetry) {
          await updateMemoryImage(item.id, item.file);
        }
      }
    };
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [pendingUploads]);

  const [showAddMemory, setShowAddMemory] = useState(false);
  const [newMemoryTitle, setNewMemoryTitle] = useState("");
  const [newMemorySubtitle, setNewMemorySubtitle] = useState("");
  const [newMemoryCategory, setNewMemoryCategory] = useState("People");
  const [newMemoryImage, setNewMemoryImage] = useState("");
  const [newMemoryFile, setNewMemoryFile] = useState(null);
  const [isSubmittingNew, setIsSubmittingNew] = useState(false);

  const [recallMemory, setRecallMemory] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [recallResult, setRecallResult] = useState(null);

  const [isListening, setIsListening] = useState(false);

  const filteredMemories = useMemo(() => {
    if (activeCategory === "All") return memories;

    return memories.filter(
      (memory) => memory.category === activeCategory
    );
  }, [memories, activeCategory]);

  const favoriteMemories = memories.filter(
    (memory) => memory.favorite
  );

  const memoryOfTheDay = memories[0] || initialMemories[0];

  const toggleFavorite = async (id) => {
    const currentMemory = memories.find((m) => String(m.id) === String(id));
    const newFavorite = currentMemory ? !currentMemory.favorite : true;

    setMemories((current) =>
      current.map((memory) =>
        String(memory.id) === String(id)
          ? { ...memory, favorite: newFavorite }
          : memory
      )
    );

    try {
      await fetch(`/api/patient/memories/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ favorite: newFavorite }),
      });
    } catch (err) {
      console.warn("Could not save favorite state:", err);
    }
  };

  const updateMemoryImage = async (id, file) => {
    if (!file) return;

    if (!file.type || !file.type.startsWith("image/")) {
      setFeedbackMessage({
        type: "error",
        text: "Please select a valid image file (JPEG, PNG, WebP, GIF).",
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setFeedbackMessage({
        type: "error",
        text: "Image is too large. Maximum allowed size is 10MB.",
      });
      return;
    }

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setFeedbackMessage({
        type: "pending",
        text: "Upload pending — will sync when connection returns.",
      });
      setPendingUploads((prev) => [...prev, { id, file }]);
      return;
    }

    setUploadingId(id);
    setFeedbackMessage(null);

    try {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("patientId", "P001");
      formData.append("memoryId", id);

      const response = await fetch("/api/memories", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || `Server error (${response.status})`);
      }

      const savedData = await response.json();
      const updatedMemory = savedData.memory || savedData;

      // Update state strictly upon backend confirmation
      setMemories((current) =>
        current.map((memory) =>
          String(memory.id) === String(id)
            ? { ...memory, ...updatedMemory, image: updatedMemory.image || updatedMemory.storedPath }
            : memory
        )
      );

      setSelectedMemory((current) =>
        current && String(current.id) === String(id)
          ? { ...current, ...updatedMemory, image: updatedMemory.image || updatedMemory.storedPath }
          : current
      );

      setRecallMemory((current) =>
        current && String(current.id) === String(id)
          ? { ...current, ...updatedMemory, image: updatedMemory.image || updatedMemory.storedPath }
          : current
      );

      setFeedbackMessage({
        type: "success",
        text: "Photo saved permanently to your memory vault!",
      });
      setTimeout(() => setFeedbackMessage(null), 4000);
    } catch (error) {
      console.error("Unable to upload image:", error);
      if (
        (typeof navigator !== "undefined" && !navigator.onLine) ||
        error.message.includes("Failed to fetch")
      ) {
        setFeedbackMessage({
          type: "pending",
          text: "Upload pending — will sync when connection returns.",
        });
        setPendingUploads((prev) => [...prev, { id, file }]);
      } else {
        setFeedbackMessage({
          type: "error",
          text: error.message || "Unable to upload this image. Please try again.",
        });
      }
    } finally {
      setUploadingId(null);
    }
  };

  const handleNewMemoryImage = (file) => {
    if (!file) return;

    if (!file.type || !file.type.startsWith("image/")) {
      setFeedbackMessage({
        type: "error",
        text: "Please select a valid image file.",
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setFeedbackMessage({
        type: "error",
        text: "Image file is too large (max 10MB).",
      });
      return;
    }

    setNewMemoryFile(file);
    const previewUrl = URL.createObjectURL(file);
    setNewMemoryImage(previewUrl);
  };

  const addMemory = async (event) => {
    event.preventDefault();

    if (!newMemoryTitle.trim()) return;

    setIsSubmittingNew(true);
    setFeedbackMessage(null);

    try {
      if (newMemoryFile) {
        const formData = new FormData();
        formData.append("image", newMemoryFile);
        formData.append("patientId", "P001");
        formData.append("title", newMemoryTitle.trim());
        formData.append("subtitle", newMemorySubtitle.trim() || "Personal memory");
        formData.append("category", newMemoryCategory);
        formData.append("description", `A personal memory about ${newMemoryTitle.trim()}.`);
        formData.append("year", "Personal");
        formData.append("favorite", "false");

        const response = await fetch("/api/memories", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const errJson = await response.json().catch(() => ({}));
          throw new Error(errJson.error || "Failed to save memory with image");
        }

        const data = await response.json();
        const created = data.memory || data;
        setMemories((current) => [created, ...current]);
      } else {
        const newMemory = {
          patientId: "P001",
          title: newMemoryTitle.trim(),
          subtitle: newMemorySubtitle.trim() || "Personal memory",
          category: newMemoryCategory,
          image: "",
          description: `A personal memory about ${newMemoryTitle.trim()}.`,
          year: "Personal",
          favorite: false,
        };

        const response = await fetch("/api/patient/memories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newMemory),
        });

        if (!response.ok) {
          throw new Error("Failed to save memory");
        }

        const created = await response.json();
        setMemories((current) => [created, ...current]);
      }

      setNewMemoryTitle("");
      setNewMemorySubtitle("");
      setNewMemoryCategory("People");
      setNewMemoryImage("");
      setNewMemoryFile(null);
      setShowAddMemory(false);

      setFeedbackMessage({
        type: "success",
        text: "New memory saved permanently to your vault!",
      });
      setTimeout(() => setFeedbackMessage(null), 4000);
    } catch (err) {
      console.warn("Could not persist memory to backend:", err);
      setFeedbackMessage({
        type: "error",
        text: err.message || "Could not save memory. Please check connection.",
      });
    } finally {
      setIsSubmittingNew(false);
    }
  };

  const handleDeleteMemory = async (memoryId) => {
    if (!window.confirm("Are you sure you want to delete this memory?")) {
      return;
    }

    try {
      const res = await fetch(`/api/memories/${memoryId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Failed to delete memory");
      }

      setMemories((current) =>
        current.filter((m) => String(m.id) !== String(memoryId))
      );

      if (selectedMemory && String(selectedMemory.id) === String(memoryId)) {
        setSelectedMemory(null);
      }

      if (recallMemory && String(recallMemory.id) === String(memoryId)) {
        setRecallMemory(null);
      }

      setFeedbackMessage({
        type: "success",
        text: "Memory removed from your vault.",
      });
      setTimeout(() => setFeedbackMessage(null), 3000);
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Could not delete memory: " + err.message);
    }
  };

  const startRecallGame = () => {
    const personMemories = memories.filter(
      (memory) => memory.category === "People"
    );

    if (!personMemories.length) return;

    const randomMemory =
      personMemories[
        Math.floor(Math.random() * personMemories.length)
      ];

    setRecallMemory(randomMemory);
    setSelectedAnswer("");
    setRecallResult(null);
  };

  const checkRecallAnswer = () => {
    if (!selectedAnswer || !recallMemory) return;

    if (selectedAnswer === recallMemory.title) {
      setRecallResult("correct");

      // Record successful recall exercise to backend
      fetch("/api/patient/activities/record", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameId: "family-recall",
          game: "Family Memory Recall",
          difficulty: "easy",
          theme: "Family Recognition",
          category: "memory",
          accuracy: 100,
          moves: 1,
          mistakes: 0,
          hintsUsed: 0,
          elapsedTime: 15,
        }),
      }).catch((e) => console.warn("Could not record recall activity:", e));
    } else {
      setRecallResult("wrong");
    }
  };

  const handleVoiceAnswer = () => {
    setIsListening(true);

    if (
      "SpeechRecognition" in window ||
      "webkitSpeechRecognition" in window
    ) {
      const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;

      const recognition = new SpeechRecognition();

      recognition.lang = "en-IN";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.start();

      recognition.onresult = (event) => {
        const spokenText =
          event.results[0][0].transcript.toLowerCase();

        const matchedOption = recallOptions.find((option) =>
          spokenText.includes(option.toLowerCase())
        );

        if (matchedOption) {
          setSelectedAnswer(matchedOption);
        }

        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };
    } else {
      setIsListening(false);
      alert("Voice recognition is not supported in this browser.");
    }
  };

  return (
    <div className="space-y-7 animate-in fade-in duration-300">
      {/* HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Heart
              size={26}
              className="text-[#0f3e3a]"
              fill="currentColor"
            />

            <h1 className="text-3xl font-black text-[#0f3e3a]">
              Family Memories
            </h1>
          </div>

          <p className="mt-1 text-sm text-gray-500">
            Familiar faces, places and moments that matter to you.
          </p>
        </div>

        <button
          onClick={() => setShowAddMemory(true)}
          className="flex items-center justify-center gap-2 rounded-xl bg-[#0f3e3a] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#0c312e]"
        >
          <Plus size={17} />
          Add Memory
        </button>
      </div>

      {/* FEEDBACK STATUS BANNER */}
      {feedbackMessage && (
        <div
          className={`flex items-center gap-3 rounded-2xl p-4 text-xs font-bold transition shadow-sm ${
            feedbackMessage.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : feedbackMessage.type === "pending"
              ? "bg-amber-50 text-amber-800 border border-amber-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {feedbackMessage.type === "success" && (
            <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
          )}
          {feedbackMessage.type === "pending" && (
            <WifiOff size={18} className="text-amber-600 shrink-0" />
          )}
          {feedbackMessage.type === "error" && (
            <AlertCircle size={18} className="text-red-600 shrink-0" />
          )}
          <span className="flex-1">{feedbackMessage.text}</span>
          <button
            type="button"
            onClick={() => setFeedbackMessage(null)}
            className="text-gray-400 hover:text-gray-700 p-1 rounded-lg"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* MEMORY OF THE DAY */}
      <section className="overflow-hidden rounded-3xl border border-teal-100 bg-gradient-to-r from-teal-50 to-white p-6">
        <div className="grid gap-6 md:grid-cols-[1fr_220px] md:items-center">
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#0f3e3a]">
              <Sparkles size={15} />
              Memory of the Day
            </div>

            <h2 className="text-2xl font-black text-gray-900">
              {memoryOfTheDay.title}
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              {memoryOfTheDay.subtitle}
            </p>

            <p className="mt-4 max-w-xl text-sm leading-6 text-gray-600">
              {memoryOfTheDay.description}
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                onClick={() =>
                  speak(
                    `${memoryOfTheDay.title}. ${memoryOfTheDay.description}`
                  )
                }
                className="flex items-center gap-2 rounded-xl bg-[#0f3e3a] px-4 py-2.5 text-xs font-bold text-white"
              >
                <Volume2 size={15} />
                Listen
              </button>

              <button
                onClick={() => setSelectedMemory(memoryOfTheDay)}
                className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-50"
              >
                View Memory
              </button>
            </div>
          </div>

          <ImageSlot
            image={memoryOfTheDay.image}
            large
            isUploading={uploadingId === memoryOfTheDay.id}
            onUpload={(file) =>
              updateMemoryImage(memoryOfTheDay.id, file)
            }
          />
        </div>
      </section>

      {/* CATEGORY FILTER */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={`rounded-full px-4 py-2 text-xs font-bold transition ${
              activeCategory === category
                ? "bg-[#0f3e3a] text-white"
                : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* MEMORY CARDS */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-gray-900">
              Your Memories
            </h2>

            <p className="text-xs text-gray-400">
              Add real photos to make memories more meaningful.
            </p>
          </div>

          <div className="text-xs font-semibold text-gray-400">
            {filteredMemories.length} memories
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredMemories.map((memory) => (
            <div
              key={memory.id}
              className="group overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <ImageSlot
                image={memory.image}
                isUploading={uploadingId === memory.id}
                onUpload={(file) =>
                  updateMemoryImage(memory.id, file)
                }
              />

              <div className="space-y-3 p-5">
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-black text-gray-900">
                      {memory.title}
                    </h3>

                    <span className="rounded-full bg-teal-50 px-2.5 py-1 text-[10px] font-bold text-[#0f3e3a]">
                      {memory.category}
                    </span>
                  </div>

                  <p className="mt-1 text-xs text-gray-400">
                    {memory.subtitle}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedMemory(memory)}
                    className="flex-1 rounded-xl bg-[#0f3e3a] py-2.5 text-xs font-bold text-white"
                  >
                    Open Memory
                  </button>

                  <button
                    onClick={() => toggleFavorite(memory.id)}
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 hover:bg-gray-50"
                    aria-label="Favorite memory"
                  >
                    <Star
                      size={16}
                      className={
                        memory.favorite
                          ? "text-amber-500"
                          : "text-gray-400"
                      }
                      fill={
                        memory.favorite
                          ? "currentColor"
                          : "none"
                      }
                    />
                  </button>

                  <button
                    onClick={() =>
                      speak(
                        `${memory.title}. ${memory.description}`
                      )
                    }
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 text-[#0f3e3a] hover:bg-gray-50"
                  >
                    <Volume2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAVORITES + TIMELINE */}
      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-3xl border border-gray-200 bg-white p-6">
          <div className="mb-5 flex items-center gap-2">
            <Star size={18} className="text-amber-500" />

            <h2 className="font-black text-gray-900">
              Favorite Memories
            </h2>
          </div>

          <div className="space-y-3">
            {favoriteMemories.length > 0 ? (
              favoriteMemories.map((memory) => (
                <button
                  key={memory.id}
                  onClick={() => setSelectedMemory(memory)}
                  className="flex w-full items-center gap-3 rounded-2xl bg-gray-50 p-3 text-left hover:bg-gray-100"
                >
                  <div className="h-12 w-12 overflow-hidden rounded-xl bg-white">
                    {memory.image ? (
                      <img
                        src={memory.image}
                        alt={memory.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <ImagePlus
                          size={19}
                          className="text-[#0f3e3a]"
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <p className="text-sm font-bold text-gray-800">
                      {memory.title}
                    </p>

                    <p className="text-xs text-gray-400">
                      {memory.subtitle}
                    </p>
                  </div>
                </button>
              ))
            ) : (
              <p className="text-sm text-gray-400">
                Mark memories as favorites to see them here.
              </p>
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-gray-200 bg-white p-6">
          <div className="mb-5 flex items-center gap-2">
            <Calendar size={18} className="text-[#0f3e3a]" />

            <h2 className="font-black text-gray-900">
              Memory Timeline
            </h2>
          </div>

          <div className="space-y-4">
            {memories.slice(0, 4).map((memory) => (
              <div
                key={memory.id}
                className="flex gap-3"
              >
                <div className="flex flex-col items-center">
                  <div className="h-3 w-3 rounded-full bg-[#0f3e3a]" />
                  <div className="h-full w-px bg-gray-200" />
                </div>

                <button
                  onClick={() => setSelectedMemory(memory)}
                  className="pb-3 text-left"
                >
                  <p className="text-xs font-bold text-[#0f3e3a]">
                    {memory.year}
                  </p>

                  <p className="mt-1 text-sm font-bold text-gray-800">
                    {memory.title}
                  </p>
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* RECALL GAME */}
      <section className="rounded-3xl border border-teal-100 bg-teal-50/60 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Users size={19} className="text-[#0f3e3a]" />

              <h2 className="font-black text-[#0f3e3a]">
                Who is this?
              </h2>
            </div>

            <p className="mt-1 text-xs text-gray-500">
              A gentle memory recall activity using familiar people.
            </p>
          </div>

          <button
            onClick={startRecallGame}
            className="flex items-center justify-center gap-2 rounded-xl bg-[#0f3e3a] px-5 py-3 text-xs font-bold text-white"
          >
            <Play size={15} />
            Start Activity
          </button>
        </div>

        {recallMemory && (
          <div className="mt-6 rounded-2xl bg-white p-5">
            <div className="mb-5">
              <ImageSlot
                image={recallMemory.image}
                large
                isUploading={uploadingId === recallMemory.id}
                onUpload={(file) =>
                  updateMemoryImage(recallMemory.id, file)
                }
              />
            </div>

            <p className="mb-3 text-center text-sm font-bold text-gray-800">
              Who is this person?
            </p>

            <div className="grid gap-2 sm:grid-cols-3">
              {recallOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => setSelectedAnswer(option)}
                  className={`rounded-xl border p-3 text-sm font-semibold ${
                    selectedAnswer === option
                      ? "border-[#0f3e3a] bg-teal-50 text-[#0f3e3a]"
                      : "border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <button
                onClick={handleVoiceAnswer}
                className="flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-xs font-bold"
              >
                <Mic size={15} />

                {isListening
                  ? "Listening..."
                  : "Answer by Voice"}
              </button>

              <button
                onClick={checkRecallAnswer}
                className="rounded-xl bg-[#0f3e3a] px-5 py-2.5 text-xs font-bold text-white"
              >
                Check Answer
              </button>

              <button
                onClick={startRecallGame}
                className="flex items-center gap-1 rounded-xl border border-gray-200 px-4 py-2.5 text-xs font-bold"
              >
                <RotateCcw size={14} />
                New
              </button>
            </div>

            {recallResult === "correct" && (
              <div className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-emerald-50 p-3 text-sm font-bold text-emerald-700">
                <CheckCircle2 size={17} />
                Great job! That's correct.
              </div>
            )}

            {recallResult === "wrong" && (
              <div className="mt-4 rounded-xl bg-amber-50 p-3 text-center text-sm font-semibold text-amber-700">
                That's okay. The correct answer is{" "}
                <strong>{recallMemory.title}</strong>.
              </div>
            )}
          </div>
        )}
      </section>

      {/* MEMORY MODAL */}
      {selectedMemory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-7 shadow-2xl">
            <button
  type="button"
  onClick={() => setSelectedMemory(null)}
  className="absolute right-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-2xl font-bold text-gray-700 shadow-md hover:bg-gray-200"
  aria-label="Close memory"
>
  ×
</button>

            <ImageSlot
              image={selectedMemory.image}
              large
              isUploading={uploadingId === selectedMemory.id}
              onUpload={(file) =>
                updateMemoryImage(selectedMemory.id, file)
              }
            />

            <div className="mt-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-2xl font-black text-gray-900">
                  {selectedMemory.title}
                </h2>

                <button
                  onClick={() =>
                    toggleFavorite(selectedMemory.id)
                  }
                >
                  <Star
                    size={21}
                    className={
                      selectedMemory.favorite
                        ? "text-amber-500"
                        : "text-gray-400"
                    }
                    fill={
                      selectedMemory.favorite
                        ? "currentColor"
                        : "none"
                    }
                  />
                </button>
              </div>

              <p className="mt-1 text-sm text-gray-400">
                {selectedMemory.subtitle}
              </p>

              <p className="mt-5 text-sm leading-7 text-gray-600">
                {selectedMemory.description}
              </p>

              <div className="mt-5 space-y-2">
                <button
                  onClick={() =>
                    speak(
                      `${selectedMemory.title}. ${selectedMemory.description}`
                    )
                  }
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0f3e3a] py-3 text-sm font-bold text-white transition hover:bg-[#0c312e]"
                >
                  <Volume2 size={17} />
                  Listen to Memory
                </button>

                <button
                  type="button"
                  onClick={() => handleDeleteMemory(selectedMemory.id)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50/70 py-2.5 text-xs font-bold text-red-600 transition hover:bg-red-100"
                >
                  <Trash2 size={15} />
                  Delete Memory
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADD MEMORY MODAL */}
      {showAddMemory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <form
            onSubmit={addMemory}
            className="relative w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl"
          >
            <button
              type="button"
              onClick={() => setShowAddMemory(false)}
              className="absolute right-5 top-5"
            >
              <X size={19} />
            </button>

            <h2 className="text-xl font-black text-[#0f3e3a]">
              Add a Memory
            </h2>

            <p className="mt-1 text-xs text-gray-400">
              Add a photo and details for a familiar memory.
            </p>

            <div className="mt-6 space-y-4">
              <ImageSlot
                image={newMemoryImage}
                large
                isUploading={isSubmittingNew}
                onUpload={handleNewMemoryImage}
              />

              <input
                value={newMemoryTitle}
                onChange={(e) =>
                  setNewMemoryTitle(e.target.value)
                }
                placeholder="Memory title"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#0f3e3a]"
              />

              <input
                value={newMemorySubtitle}
                onChange={(e) =>
                  setNewMemorySubtitle(e.target.value)
                }
                placeholder="Relationship or short description"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#0f3e3a]"
              />

              <select
                value={newMemoryCategory}
                onChange={(e) =>
                  setNewMemoryCategory(e.target.value)
                }
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none"
              >
                {categories
                  .filter((category) => category !== "All")
                  .map((category) => (
                    <option key={category}>
                      {category}
                    </option>
                  ))}
              </select>

              <button
                type="submit"
                disabled={isSubmittingNew}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0f3e3a] py-3.5 text-sm font-bold text-white transition hover:bg-[#0c312e] disabled:opacity-50"
              >
                {isSubmittingNew ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Saving Memory...
                  </>
                ) : (
                  "Save Memory"
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}