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
      className={`relative flex cursor-pointer items-center justify-center overflow-hidden border-2 border-dashed border-[#EAEBF4] dark:border-[#2B2E42] bg-[#F7F7FC] dark:bg-[#11121C] transition hover:border-[#6366D8] ${
        large ? "h-48 rounded-2xl" : "h-44 rounded-3xl"
      }`}
    >
      {isUploading ? (
        <div className="flex flex-col items-center justify-center text-center text-[#6366D8] dark:text-[#8B8FE8] p-4">
          <Loader2 size={32} className="animate-spin mb-2 text-[#6366D8]" />
          <p className="text-xs font-bold">Saving photo...</p>
          <p className="text-[11px] text-[#6B6E85] dark:text-[#9A9DB5] mt-0.5">Uploading to vault</p>
        </div>
      ) : image ? (
        <img
          src={image}
          alt="Memory"
          className="h-full w-full object-cover"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      ) : (
        <div className="flex flex-col items-center justify-center text-center text-[#6B6E85] dark:text-[#9A9DB5]">
          <ImagePlus size={36} className="mb-2 text-[#6366D8] dark:text-[#8B8FE8]" />
          <p className="text-sm font-bold text-[#202238] dark:text-white">
            Add Memory Photo
          </p>
          <p className="mt-1 text-xs text-[#6B6E85] dark:text-[#9A9DB5]">
            Click to upload an image
          </p>
        </div>
      )}

      {!isUploading && (
        <div className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-white dark:bg-[#1B1D2A] shadow-soft">
          <Upload size={16} className="text-[#6366D8] dark:text-[#8B8FE8]" />
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
    return memories.filter((memory) => memory.category === activeCategory);
  }, [memories, activeCategory]);

  const favoriteMemories = memories.filter((memory) => memory.favorite);
  const memoryOfTheDay = memories[0] || initialMemories[0];

  const toggleFavorite = async (id) => {
    const currentMemory = memories.find((m) => String(m.id) === String(id));
    const newFavorite = currentMemory ? !currentMemory.favorite : true;

    setMemories((current) =>
      current.map((memory) =>
        String(memory.id) === String(id) ? { ...memory, favorite: newFavorite } : memory
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
        text: "Please select a valid image file (JPEG, PNG, WebP).",
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
      setFeedbackMessage({
        type: "error",
        text: error.message || "Unable to upload this image. Please try again.",
      });
    } finally {
      setUploadingId(null);
    }
  };

  const handleNewMemoryImage = (file) => {
    if (!file) return;
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

        if (!response.ok) throw new Error("Failed to save memory with image");
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

        if (!response.ok) throw new Error("Failed to save memory");
        const created = await response.json();
        setMemories((current) => [created, ...current]);
      }

      setShowAddMemory(false);
      setNewMemoryTitle("");
      setNewMemorySubtitle("");
      setNewMemoryImage("");
      setNewMemoryFile(null);
    } catch (error) {
      setFeedbackMessage({
        type: "error",
        text: error.message || "Failed to add memory.",
      });
    } finally {
      setIsSubmittingNew(false);
    }
  };

  const handleDeleteMemory = async (id) => {
    setMemories((current) => current.filter((m) => String(m.id) !== String(id)));
    setSelectedMemory(null);
    try {
      await fetch(`/api/memories/${id}`, { method: "DELETE" });
    } catch (e) {
      console.warn("Failed to delete memory on server:", e);
    }
  };

  const startRecallGame = () => {
    const personMemories = memories.filter((memory) => memory.category === "People");
    if (!personMemories.length) return;
    const randomMemory =
      personMemories[Math.floor(Math.random() * personMemories.length)];
    setRecallMemory(randomMemory);
    setSelectedAnswer("");
    setRecallResult(null);
  };

  const checkRecallAnswer = () => {
    if (!selectedAnswer || !recallMemory) return;

    if (selectedAnswer === recallMemory.title) {
      setRecallResult("correct");
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
    if ("SpeechRecognition" in window || "webkitSpeechRecognition" in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = "en-IN";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognition.start();

      recognition.onresult = (event) => {
        const spokenText = event.results[0][0].transcript.toLowerCase();
        const matchedOption = recallOptions.find((option) =>
          spokenText.includes(option.toLowerCase())
        );
        if (matchedOption) {
          setSelectedAnswer(matchedOption);
        }
        setIsListening(false);
      };

      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
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
            <Heart size={26} className="text-[#E98B9B]" fill="currentColor" />
            <h1 className="text-3xl font-extrabold text-[#202238] dark:text-white">
              Family Memories &amp; Vault
            </h1>
          </div>
          <p className="mt-1 text-sm text-[#6B6E85] dark:text-[#9A9DB5]">
            Familiar faces, places and life milestones that matter to you.
          </p>
        </div>

        <button
          onClick={() => setShowAddMemory(true)}
          className="flex items-center justify-center gap-2 rounded-2xl bg-[#6366D8] hover:bg-[#5255C5] px-5 py-3 text-sm font-bold text-white transition shadow-soft cursor-pointer"
        >
          <Plus size={17} />
          <span>Add Memory</span>
        </button>
      </div>

      {/* FEEDBACK STATUS BANNER */}
      {feedbackMessage && (
        <div
          className={`flex items-center gap-3 rounded-2xl p-4 text-xs font-bold transition shadow-xs ${
            feedbackMessage.type === "success"
              ? "bg-[#78CFA3]/15 text-[#2E7D56] dark:text-[#78CFA3] border border-[#78CFA3]/30"
              : feedbackMessage.type === "pending"
              ? "bg-[#F3B562]/15 text-[#9C6119] dark:text-[#F3B562] border border-[#F3B562]/30"
              : "bg-[#E98B9B]/15 text-[#C7485E] dark:text-[#E98B9B] border border-[#E98B9B]/30"
          }`}
        >
          {feedbackMessage.type === "success" && (
            <CheckCircle2 size={18} className="text-[#78CFA3] shrink-0" />
          )}
          {feedbackMessage.type === "pending" && (
            <WifiOff size={18} className="text-[#F3B562] shrink-0" />
          )}
          {feedbackMessage.type === "error" && (
            <AlertCircle size={18} className="text-[#E98B9B] shrink-0" />
          )}
          <span className="flex-1">{feedbackMessage.text}</span>
          <button
            type="button"
            onClick={() => setFeedbackMessage(null)}
            className="text-gray-400 hover:text-gray-700 dark:hover:text-white p-1 rounded-lg"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* MEMORY OF THE DAY */}
      <section className="overflow-hidden rounded-3xl border border-[#6366D8]/20 bg-gradient-to-r from-[#E8E8FA]/50 to-white dark:from-[#25283C]/50 dark:to-[#1B1D2A] p-7 shadow-soft">
        <div className="grid gap-6 md:grid-cols-[1fr_220px] md:items-center">
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#6366D8] dark:text-[#8B8FE8]">
              <Sparkles size={15} />
              <span>Memory of the Day</span>
            </div>

            <h2 className="text-2xl md:text-3xl font-bold text-[#202238] dark:text-white">
              {memoryOfTheDay.title}
            </h2>

            <p className="mt-1 text-sm text-[#6B6E85] dark:text-[#9A9DB5]">
              {memoryOfTheDay.subtitle}
            </p>

            <p className="mt-3 max-w-xl text-sm leading-6 text-[#202238] dark:text-[#EDEFFF]">
              {memoryOfTheDay.description}
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                onClick={() => speak(`${memoryOfTheDay.title}. ${memoryOfTheDay.description}`)}
                className="flex items-center gap-2 rounded-xl bg-[#6366D8] hover:bg-[#5255C5] px-4 py-2.5 text-xs font-bold text-white transition shadow-soft cursor-pointer"
              >
                <Volume2 size={15} />
                <span>Listen Aloud</span>
              </button>

              <button
                onClick={() => setSelectedMemory(memoryOfTheDay)}
                className="rounded-xl border border-[#EAEBF4] dark:border-[#2B2E42] bg-white dark:bg-[#1B1D2A] px-4 py-2.5 text-xs font-bold text-[#202238] dark:text-white hover:border-[#6366D8] transition cursor-pointer"
              >
                View Memory
              </button>
            </div>
          </div>

          <ImageSlot
            image={memoryOfTheDay.image}
            large
            isUploading={uploadingId === memoryOfTheDay.id}
            onUpload={(file) => updateMemoryImage(memoryOfTheDay.id, file)}
          />
        </div>
      </section>

      {/* CATEGORY FILTER */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={`rounded-full px-4 py-2 text-xs font-bold transition cursor-pointer ${
              activeCategory === category
                ? "bg-[#6366D8] text-white shadow-soft"
                : "border border-[#EAEBF4] dark:border-[#2B2E42] bg-white dark:bg-[#1B1D2A] text-[#6B6E85] dark:text-[#9A9DB5] hover:border-[#6366D8]/50"
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
            <h2 className="text-lg font-bold text-[#202238] dark:text-white">
              Your Memories
            </h2>
            <p className="text-xs text-[#6B6E85] dark:text-[#9A9DB5]">
              Real family photos keep memories vivid and reassuring.
            </p>
          </div>
          <div className="text-xs font-semibold text-[#6B6E85] dark:text-[#9A9DB5]">
            {filteredMemories.length} memories
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredMemories.map((memory) => (
            <div
              key={memory.id}
              className="group overflow-hidden rounded-3xl border border-[#EAEBF4] dark:border-[#2B2E42] bg-white dark:bg-[#1B1D2A] shadow-soft transition hover:-translate-y-1 hover:shadow-soft-lg flex flex-col justify-between"
            >
              <ImageSlot
                image={memory.image}
                isUploading={uploadingId === memory.id}
                onUpload={(file) => updateMemoryImage(memory.id, file)}
              />

              <div className="space-y-3 p-5">
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-bold text-[#202238] dark:text-white group-hover:text-[#6366D8] dark:group-hover:text-[#8B8FE8] transition-colors">
                      {memory.title}
                    </h3>

                    <span className="rounded-full bg-[#E8E8FA] dark:bg-[#25283C] px-2.5 py-0.5 text-[10px] font-bold text-[#6366D8] dark:text-[#8B8FE8]">
                      {memory.category}
                    </span>
                  </div>

                  <p className="mt-1 text-xs text-[#6B6E85] dark:text-[#9A9DB5]">
                    {memory.subtitle}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedMemory(memory)}
                    className="flex-1 rounded-xl bg-[#6366D8] hover:bg-[#5255C5] py-2.5 text-xs font-bold text-white transition shadow-soft cursor-pointer"
                  >
                    Open Memory
                  </button>

                  <button
                    onClick={() => toggleFavorite(memory.id)}
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#EAEBF4] dark:border-[#2B2E42] hover:bg-[#F7F7FC] dark:hover:bg-[#25283C] cursor-pointer"
                    aria-label="Favorite memory"
                  >
                    <Star
                      size={16}
                      className={
                        memory.favorite ? "text-[#F3B562]" : "text-gray-400"
                      }
                      fill={memory.favorite ? "currentColor" : "none"}
                    />
                  </button>

                  <button
                    onClick={() => speak(`${memory.title}. ${memory.description}`)}
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#EAEBF4] dark:border-[#2B2E42] text-[#6366D8] dark:text-[#8B8FE8] hover:bg-[#F7F7FC] dark:hover:bg-[#25283C] cursor-pointer"
                  >
                    <Volume2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* RECALL ACTIVITY */}
      <section className="rounded-3xl border border-[#6366D8]/20 bg-[#E8E8FA]/40 dark:bg-[#25283C]/40 p-7 shadow-soft">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Users size={19} className="text-[#6366D8] dark:text-[#8B8FE8]" />
              <h2 className="font-bold text-lg text-[#202238] dark:text-white">
                Who is this familiar person?
              </h2>
            </div>
            <p className="mt-1 text-xs text-[#6B6E85] dark:text-[#9A9DB5]">
              A gentle memory recall exercise using familiar family members.
            </p>
          </div>

          <button
            onClick={startRecallGame}
            className="flex items-center justify-center gap-2 rounded-2xl bg-[#6366D8] hover:bg-[#5255C5] px-5 py-3 text-xs font-bold text-white transition shadow-soft cursor-pointer"
          >
            <Play size={15} />
            <span>Start Activity</span>
          </button>
        </div>

        {recallMemory && (
          <div className="mt-6 rounded-2xl bg-white dark:bg-[#1B1D2A] border border-[#EAEBF4] dark:border-[#2B2E42] p-5 shadow-soft">
            <div className="mb-5">
              <ImageSlot
                image={recallMemory.image}
                large
                isUploading={uploadingId === recallMemory.id}
                onUpload={(file) => updateMemoryImage(recallMemory.id, file)}
              />
            </div>

            <p className="mb-3 text-center text-sm font-bold text-[#202238] dark:text-white">
              Who is this person?
            </p>

            <div className="grid gap-2 sm:grid-cols-3">
              {recallOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => setSelectedAnswer(option)}
                  className={`rounded-xl border p-3 text-sm font-semibold transition cursor-pointer ${
                    selectedAnswer === option
                      ? "border-[#6366D8] bg-[#E8E8FA] dark:bg-[#25283C] text-[#6366D8] dark:text-[#8B8FE8]"
                      : "border-[#EAEBF4] dark:border-[#2B2E42] bg-[#F7F7FC] dark:bg-[#11121C] text-[#202238] dark:text-white hover:border-[#6366D8]"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <button
                onClick={handleVoiceAnswer}
                className="flex items-center gap-2 rounded-xl border border-[#EAEBF4] dark:border-[#2B2E42] px-4 py-2.5 text-xs font-bold text-[#6366D8] dark:text-[#8B8FE8] hover:bg-[#E8E8FA]/30 cursor-pointer"
              >
                <Mic size={15} />
                <span>{isListening ? "Listening..." : "Answer by Voice"}</span>
              </button>

              <button
                onClick={checkRecallAnswer}
                className="rounded-xl bg-[#6366D8] hover:bg-[#5255C5] px-5 py-2.5 text-xs font-bold text-white transition shadow-soft cursor-pointer"
              >
                Check Answer
              </button>

              <button
                onClick={startRecallGame}
                className="flex items-center gap-1 rounded-xl border border-[#EAEBF4] dark:border-[#2B2E42] px-4 py-2.5 text-xs font-bold text-[#6B6E85] dark:text-[#9A9DB5] hover:bg-[#F7F7FC] dark:hover:bg-[#25283C] cursor-pointer"
              >
                <RotateCcw size={14} />
                <span>New</span>
              </button>
            </div>

            {recallResult === "correct" && (
              <div className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-[#78CFA3]/20 p-3 text-sm font-bold text-[#2E7D56] dark:text-[#78CFA3]">
                <CheckCircle2 size={17} />
                <span>Great job! That is correct.</span>
              </div>
            )}

            {recallResult === "wrong" && (
              <div className="mt-4 rounded-xl bg-[#F3B562]/20 p-3 text-center text-sm font-semibold text-[#9C6119] dark:text-[#F3B562]">
                That is okay! The correct answer is <strong>{recallMemory.title}</strong>.
              </div>
            )}
          </div>
        )}
      </section>

      {/* MEMORY MODAL */}
      {selectedMemory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white dark:bg-[#1B1D2A] border border-[#EAEBF4] dark:border-[#2B2E42] p-7 shadow-soft-lg animate-in fade-in zoom-in-95">
            <button
              type="button"
              onClick={() => setSelectedMemory(null)}
              className="absolute right-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-[#F7F7FC] dark:bg-[#25283C] text-lg font-bold text-[#6B6E85] hover:text-[#202238] dark:hover:text-white"
              aria-label="Close memory"
            >
              <X size={20} />
            </button>

            <ImageSlot
              image={selectedMemory.image}
              large
              isUploading={uploadingId === selectedMemory.id}
              onUpload={(file) => updateMemoryImage(selectedMemory.id, file)}
            />

            <div className="mt-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-2xl font-bold text-[#202238] dark:text-white">
                  {selectedMemory.title}
                </h2>

                <button onClick={() => toggleFavorite(selectedMemory.id)}>
                  <Star
                    size={21}
                    className={
                      selectedMemory.favorite ? "text-[#F3B562]" : "text-gray-400"
                    }
                    fill={selectedMemory.favorite ? "currentColor" : "none"}
                  />
                </button>
              </div>

              <p className="mt-1 text-sm text-[#6B6E85] dark:text-[#9A9DB5]">
                {selectedMemory.subtitle}
              </p>

              <p className="mt-4 text-sm leading-7 text-[#202238] dark:text-[#EDEFFF]">
                {selectedMemory.description}
              </p>

              <div className="mt-5 space-y-2">
                <button
                  onClick={() => speak(`${selectedMemory.title}. ${selectedMemory.description}`)}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#6366D8] hover:bg-[#5255C5] py-3.5 text-sm font-bold text-white transition shadow-soft cursor-pointer"
                >
                  <Volume2 size={17} />
                  <span>Listen to Memory</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDeleteMemory(selectedMemory.id)}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#E98B9B]/30 bg-[#E98B9B]/10 py-2.5 text-xs font-bold text-[#C7485E] dark:text-[#E98B9B] hover:bg-[#E98B9B]/20 transition cursor-pointer"
                >
                  <Trash2 size={15} />
                  <span>Delete Memory</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADD MEMORY MODAL */}
      {showAddMemory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <form
            onSubmit={addMemory}
            className="relative w-full max-w-md rounded-3xl bg-white dark:bg-[#1B1D2A] border border-[#EAEBF4] dark:border-[#2B2E42] p-7 shadow-soft-lg animate-in fade-in zoom-in-95"
          >
            <button
              type="button"
              onClick={() => setShowAddMemory(false)}
              className="absolute right-5 top-5 text-[#6B6E85] hover:text-[#202238] dark:hover:text-white"
            >
              <X size={19} />
            </button>

            <h2 className="text-xl font-bold text-[#202238] dark:text-white">
              Add a Family Memory
            </h2>

            <p className="mt-1 text-xs text-[#6B6E85] dark:text-[#9A9DB5]">
              Upload a photo and details to cherish in the memory vault.
            </p>

            <div className="mt-5 space-y-4">
              <ImageSlot
                image={newMemoryImage}
                large
                isUploading={isSubmittingNew}
                onUpload={handleNewMemoryImage}
              />

              <input
                value={newMemoryTitle}
                onChange={(e) => setNewMemoryTitle(e.target.value)}
                placeholder="Memory title (e.g. Priya)"
                className="w-full rounded-xl border border-[#EAEBF4] dark:border-[#2B2E42] bg-[#F7F7FC] dark:bg-[#11121C] text-[#202238] dark:text-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#6366D8]"
                required
              />

              <input
                value={newMemorySubtitle}
                onChange={(e) => setNewMemorySubtitle(e.target.value)}
                placeholder="Relationship or short note"
                className="w-full rounded-xl border border-[#EAEBF4] dark:border-[#2B2E42] bg-[#F7F7FC] dark:bg-[#11121C] text-[#202238] dark:text-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#6366D8]"
              />

              <select
                value={newMemoryCategory}
                onChange={(e) => setNewMemoryCategory(e.target.value)}
                className="w-full rounded-xl border border-[#EAEBF4] dark:border-[#2B2E42] bg-[#F7F7FC] dark:bg-[#11121C] text-[#202238] dark:text-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#6366D8]"
              >
                {categories
                  .filter((c) => c !== "All")
                  .map((c) => (
                    <option key={c}>{c}</option>
                  ))}
              </select>

              <button
                type="submit"
                disabled={isSubmittingNew}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#6366D8] hover:bg-[#5255C5] py-3.5 text-sm font-bold text-white transition shadow-soft cursor-pointer disabled:opacity-50"
              >
                {isSubmittingNew ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Saving Memory...</span>
                  </>
                ) : (
                  <span>Save Memory</span>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
