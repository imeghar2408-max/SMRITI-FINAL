import React, { useEffect, useRef, useState } from "react";
import {
  Send,
  Bot,
  User,
  Loader2,
  Trash2,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Radio,
  CheckCircle2,
  Sparkles,
  Globe,
  Heart,
  ChevronDown,
} from "lucide-react";
import { LANGUAGE_REGISTRY, DEFAULT_LOCALE } from "../utils/languageRegistry";
import patientData from "../data/patientData";

const base64ToBlob = (base64Audio, contentType) => {
  const bytes = atob(base64Audio.replace(/^data:.*;base64,/, ""));
  const byteArray = new Uint8Array(bytes.length);
  for (let index = 0; index < bytes.length; index += 1) {
    byteArray[index] = bytes.charCodeAt(index);
  }
  return new Blob([byteArray], { type: contentType });
};

const AnveshaChat = () => {
  const [selectedLocale, setSelectedLocale] = useState(DEFAULT_LOCALE);
  const [availableLocales, setAvailableLocales] = useState(LANGUAGE_REGISTRY);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "নমস্কাৰ আশা বাইদেউ! মই অন্বেষা। আপোনাৰ সহায়ৰ বাবে সদায় সাজু আছো। আজি আপুনি কেনে অনুভৱ কৰিছে? 🌸",
      languageCode: "as-IN",
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentlyPlayingMessage, setCurrentlyPlayingMessage] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [voiceError, setVoiceError] = useState("");
  const [autoVoiceReply, setAutoVoiceReply] = useState(true);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);

  // Live WebSocket state
  const [liveVoiceActive, setLiveVoiceActive] = useState(false);
  const [liveStatusText, setLiveStatusText] = useState("");

  const currentAudioRef = useRef(null);
  const currentAudioUrlRef = useRef(null);
  const speechRequestRef = useRef(0);
  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recognitionRef = useRef(null);
  const liveWsRef = useRef(null);
  const isMountedRef = useRef(true);

  // Load language registry dynamically from server if available
  useEffect(() => {
    fetch("/api/ai/locales")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.locales) {
          setAvailableLocales(data.locales);
        }
      })
      .catch((err) => console.warn("Locale fetch fallback to client registry:", err));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;

      if (mediaRecorderRef.current?.state === "recording") {
        mediaRecorderRef.current.stop();
      }
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());

      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (_) {}
      }

      if (liveWsRef.current) {
        liveWsRef.current.close();
      }

      stopCurrentAudio();
    };
  }, []);

  const stopCurrentAudio = () => {
    speechRequestRef.current += 1;

    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.onended = null;
      currentAudioRef.current.onerror = null;
      currentAudioRef.current = null;
    }

    if (currentAudioUrlRef.current) {
      URL.revokeObjectURL(currentAudioUrlRef.current);
      currentAudioUrlRef.current = null;
    }

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    setCurrentlyPlayingMessage(null);
  };

  // Speaks assistant response back to patient using Gemini TTS -> Sarvam -> Browser SpeechSynthesis
  const speakMessage = async (message, messageIndex) => {
    if (currentlyPlayingMessage === messageIndex) {
      stopCurrentAudio();
      return;
    }

    stopCurrentAudio();
    const requestId = speechRequestRef.current + 1;
    speechRequestRef.current = requestId;
    setCurrentlyPlayingMessage(messageIndex);

    const langCode = message.languageCode || selectedLocale;

    try {
      const response = await fetch("/api/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: message.content,
          language_code: langCode,
        }),
      });

      const data = await response.json();

      // Development logging for TTS verification
      console.log(
        `[TTS Client Audit] Language: ${langCode} | Provider: ${data?.provider || "none"} | Model: ${data?.model || "none"} | Voice: ${data?.voice || "none"} | Fallback: ${data?.fallback || "none"}`
      );

      if (data?.audio) {
        if (!isMountedRef.current || speechRequestRef.current !== requestId) return;

        const audioBlob = base64ToBlob(data.audio, data.contentType || "audio/wav");
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);

        currentAudioUrlRef.current = audioUrl;
        currentAudioRef.current = audio;

        audio.onended = () => {
          if (speechRequestRef.current === requestId) {
            setCurrentlyPlayingMessage(null);
            stopCurrentAudio();
          }
        };

        audio.onerror = () => {
          console.warn("[TTS Client] Audio playback error, checking browser voice fallback");
          fallbackBrowserSpeech(message.content, langCode);
        };

        await audio.play();
        return;
      }

      // Graceful text-only fallback when native voice output is unavailable (e.g. Assamese)
      if (data?.fallback === "text_only") {
        console.log(
          `[TTS Client Audit] Native voice output unavailable for ${langCode}. Gracefully displaying readable text.`
        );
        setCurrentlyPlayingMessage(null);
        return;
      }

      // Browser SpeechSynthesis fallback when cloud voice is offline
      if (data?.fallbackToBrowser) {
        fallbackBrowserSpeech(message.content, langCode);
      } else {
        setCurrentlyPlayingMessage(null);
      }
    } catch (error) {
      console.warn("[TTS Client Audit] Server TTS unreachable, checking on-device voice:", error);
      fallbackBrowserSpeech(message.content, langCode);
    }
  };

  const fallbackBrowserSpeech = (text, langCode) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setCurrentlyPlayingMessage(null);
      return;
    }

    window.speechSynthesis.cancel();
    const voices = window.speechSynthesis.getVoices() || [];
    const target = (langCode || "hi-IN").toLowerCase();
    const baseCode = target.split("-")[0];

    // Find authentic regional voice
    const matchedVoice =
      voices.find((v) => (v.lang || "").toLowerCase().replace("_", "-") === target) ||
      voices.find((v) => {
        const vl = (v.lang || "").toLowerCase();
        return vl.startsWith(baseCode) && (vl.includes("in") || v.name.toLowerCase().includes("india"));
      }) ||
      (baseCode !== "as" ? voices.find((v) => (v.lang || "").toLowerCase().startsWith(baseCode)) : null);

    // If language is Assamese and browser has no native Assamese voice:
    // Do NOT pronounce Assamese using an English or mismatched voice. Fall back gracefully to text.
    if (baseCode === "as" && !matchedVoice) {
      console.log(
        `[TTS Client Audit] No native Assamese voice installed in browser SpeechSynthesis. Gracefully falling back to text.`
      );
      setCurrentlyPlayingMessage(null);
      return;
    }

    if (!matchedVoice && target.includes("in")) {
      console.log(
        `[TTS Client Audit] No matching regional voice found for ${langCode} in browser. Gracefully falling back to text.`
      );
      setCurrentlyPlayingMessage(null);
      return;
    }

    console.log(
      `[TTS Client Audit] Browser SpeechSynthesis active: Voice="${matchedVoice?.name || "default"}" (${matchedVoice?.lang || target})`
    );

    const utterance = new SpeechSynthesisUtterance(text);
    if (matchedVoice) {
      utterance.voice = matchedVoice;
      utterance.lang = matchedVoice.lang;
    } else {
      utterance.lang = langCode;
    }
    utterance.rate = 0.88; // Gentle speed for elderly users
    utterance.onend = () => setCurrentlyPlayingMessage(null);
    utterance.onerror = () => setCurrentlyPlayingMessage(null);
    window.speechSynthesis.speak(utterance);
  };

  const sendMessage = async (overrideText = null, meta = {}) => {
    const messageText = (overrideText ?? input).trim();
    if (!messageText || loading) return;

    stopCurrentAudio();
    setVoiceError("");

    const targetLangCode = meta.languageCode || selectedLocale;

    const userMessage = {
      role: "user",
      content: messageText,
      languageCode: targetLangCode,
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    if (!overrideText) setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          patientContext: {
            patient: patientData[0] || { name: "Asha", language: targetLangCode },
            language: targetLangCode,
          },
          language_code: targetLangCode,
        }),
      });

      const data = await response.json();

      const assistantMessage = {
        role: "assistant",
        content: data.reply || "মই আপোনাৰ কাষতেই আছো। আজি আপুনি কেনে অনুভৱ কৰিছে? 🌸",
        languageCode: data.language_code || targetLangCode,
        source: data.source,
      };

      const updatedMessages = [...newMessages, assistantMessage];
      setMessages(updatedMessages);

      // Auto-vocalize response if user spoke via voice or auto-voice is active
      if (meta.fromVoice || autoVoiceReply) {
        speakMessage(assistantMessage, updatedMessages.length - 1);
      }
    } catch (error) {
      console.error("Anvesha chat error:", error);
      const fallbackMsg = {
        role: "assistant",
        content: "নমস্কাৰ, মই আপোনাৰ কথা বুজি পাইছো। মই অন্বেষা, আপোনাৰ কাষতেই আছো। আজিৰ দিনটো শুভ হওক! ❤️",
        languageCode: targetLangCode,
        source: "offline_fallback",
      };
      setMessages((prev) => [...prev, fallbackMsg]);
      if (autoVoiceReply) {
        speakMessage(fallbackMsg, newMessages.length);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Switch patient preferred language with context awareness
  const handleLocaleSelect = (localeKey) => {
    setSelectedLocale(localeKey);
    setShowLanguageDropdown(false);
    stopCurrentAudio();

    const meta = availableLocales[localeKey];
    if (meta) {
      const greetingMsg = {
        role: "assistant",
        content: `${meta.greeting}! ${meta.name} ভাষা নিৰ্বাচিত হৈছে। মই আপোনাৰ সহায়ৰ বাবে প্ৰস্তুত। 🌸`,
        languageCode: localeKey,
      };
      setMessages((prev) => [...prev, greetingMsg]);
      if (autoVoiceReply && meta.ttsSupported) {
        speakMessage(greetingMsg, messages.length);
      }
    }
  };

  // Real-time Speech-to-Text with browser WebSpeech + Server audio blob upload
  const startRecording = async () => {
    setVoiceError("");
    stopCurrentAudio();

    // Check if Browser Web Speech API is supported for live transcription
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.lang = selectedLocale;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;
        recognition.continuous = false;

        recognition.onstart = () => {
          setIsRecording(true);
        };

        recognition.onresult = (event) => {
          const transcript = Array.from(event.results)
            .map((result) => result[0].transcript)
            .join("");
          if (transcript) {
            setInput(transcript);
          }
        };

        recognition.onerror = (event) => {
          console.warn("Web Speech API error, falling back to audio recording:", event.error);
        };

        recognition.onend = () => {
          setIsRecording(false);
          if (input.trim()) {
            sendMessage(input.trim(), { fromVoice: true, languageCode: selectedLocale });
          }
        };

        recognitionRef.current = recognition;
        recognition.start();
        return;
      } catch (err) {
        console.warn("Could not start Web Speech, fallback to MediaRecorder:", err);
      }
    }

    // MediaRecorder Audio Upload Fallback
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      mediaStreamRef.current = stream;
      audioChunksRef.current = [];

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        if (audioBlob.size > 0) {
          await transcribeAudioBlob(audioBlob);
        }
      };

      recorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Microphone error:", err);
      setVoiceError("Microphone access is required for voice conversation.");
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
    }
    if (mediaRecorderRef.current?.state === "recording") {
      setIsRecording(false);
      setIsTranscribing(true);
      mediaRecorderRef.current.stop();
    }
  };

  const transcribeAudioBlob = async (audioBlob) => {
    try {
      setIsTranscribing(true);
      const formData = new FormData();
      formData.append("audio", audioBlob, "patient-voice.webm");
      formData.append("language_code", selectedLocale);

      const res = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data?.transcript) {
        await sendMessage(data.transcript, {
          fromVoice: true,
          languageCode: data.language_code || selectedLocale,
        });
      } else {
        setVoiceError("Could not clearly hear your voice. Please try again or type below.");
      }
    } catch (err) {
      console.error("Transcription error:", err);
      setVoiceError("Audio processing error. You can type below directly.");
    } finally {
      setIsTranscribing(false);
    }
  };

  // Toggle live streaming voice session
  const toggleLiveVoice = () => {
    if (liveVoiceActive) {
      if (liveWsRef.current) liveWsRef.current.close();
      setLiveVoiceActive(false);
      setLiveStatusText("");
      return;
    }

    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/api/live-voice`;
      const ws = new WebSocket(wsUrl);
      liveWsRef.current = ws;

      ws.onopen = () => {
        setLiveVoiceActive(true);
        setLiveStatusText("Live voice session connected with Anvesha");
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "status") {
            setLiveStatusText(data.message || "");
          }
          if (data.type === "audio" && data.audio) {
            const blob = base64ToBlob(data.audio, "audio/wav");
            const audioUrl = URL.createObjectURL(blob);
            const a = new Audio(audioUrl);
            a.play();
          }
        } catch (_) {}
      };

      ws.onerror = () => {
        setLiveStatusText("Live voice stream unavailable. Using audio message mode.");
        setLiveVoiceActive(false);
      };

      ws.onclose = () => {
        setLiveVoiceActive(false);
      };
    } catch (e) {
      setLiveStatusText("Live connection could not be opened.");
    }
  };

  const clearChat = () => {
    stopCurrentAudio();
    const meta = availableLocales[selectedLocale] || availableLocales[DEFAULT_LOCALE];
    setMessages([
      {
        role: "assistant",
        content: `${meta.greeting} আশা বাইদেউ! মই অন্বেষা। আপোনাৰ সহায়ৰ বাবে সদায় সাজু আছো। 🌸`,
        languageCode: selectedLocale,
      },
    ]);
  };

  const currentMeta = availableLocales[selectedLocale] || availableLocales[DEFAULT_LOCALE];

  return (
    <div className="min-h-[calc(100vh-73px)] flex justify-center px-4 py-6 transition-colors">
      <div className="w-full max-w-4xl bg-white dark:bg-[#1B1D2A] rounded-3xl border border-stone-200/80 dark:border-stone-800/80 shadow-soft overflow-hidden flex flex-col min-h-[700px]">
        {/* HEADER & LANGUAGE SELECTION STRIP */}
        <div className="px-6 py-5 border-b border-stone-100 dark:border-stone-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#E8E8FA] dark:bg-[#25283C] flex items-center justify-center text-[#6366D8] dark:text-[#8B8FE8] shadow-soft">
              <Bot size={26} />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-[#202238] dark:text-[#F3F4F6]">
                  Talk to Anvesha
                </h1>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#78CFA3]/15 text-[#78CFA3] border border-[#78CFA3]/30">
                  Grounded Eldercare AI
                </span>
              </div>
              <p className="text-xs text-[#6B6E85] dark:text-[#9A9DB5]">
                Context-aware companion · Reminders, Memories &amp; Voice Interaction
              </p>
            </div>
          </div>

          {/* Action buttons & Language Switcher */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Language Selector Dropdown with true capabilities */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-[#11121C] text-xs font-bold text-[#202238] dark:text-[#F3F4F6] hover:border-[#6366D8] transition shadow-xs"
              >
                <Globe size={14} className="text-[#6366D8]" />
                <span>{currentMeta.nativeName} ({currentMeta.name})</span>
                <ChevronDown size={14} />
              </button>

              {showLanguageDropdown && (
                <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-white dark:bg-[#1B1D2A] border border-stone-200 dark:border-stone-800 shadow-2xl z-50 p-2 max-h-96 overflow-y-auto">
                  <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-[#6B6E85] dark:text-[#9A9DB5] border-b border-stone-100 dark:border-stone-800">
                    NER &amp; National Languages
                  </div>

                  {Object.values(availableLocales).map((item) => (
                    <button
                      key={item.code}
                      onClick={() => handleLocaleSelect(item.code)}
                      className={`w-full text-left p-3 rounded-xl transition flex flex-col gap-1.5 ${
                        selectedLocale === item.code
                          ? "bg-[#E8E8FA] dark:bg-[#25283C] text-[#6366D8] dark:text-[#8B8FE8]"
                          : "hover:bg-stone-50 dark:hover:bg-stone-800/80 text-[#202238] dark:text-[#F3F4F6]"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm">
                          {item.nativeName} ({item.name})
                        </span>
                        {selectedLocale === item.code && (
                          <CheckCircle2 size={16} className="text-[#6366D8]" />
                        )}
                      </div>

                      {/* Genuine Capability Badges */}
                      <div className="flex flex-wrap gap-1 text-[9px] font-bold">
                        {item.textSupported && (
                          <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400">
                            TEXT
                          </span>
                        )}
                        {item.sttSupported ? (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            VOICE IN
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded bg-stone-500/10 text-stone-500">
                            AUDIO ONLY
                          </span>
                        )}
                        {item.ttsSupported ? (
                          <span className="px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400">
                            VOICE OUT
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded bg-stone-500/10 text-stone-500">
                            TEXT FALLBACK
                          </span>
                        )}
                        {item.liveVoiceSupported && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400">
                            LIVE VOICE
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Auto-Speech Toggle */}
            <button
              type="button"
              onClick={() => setAutoVoiceReply(!autoVoiceReply)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition ${
                autoVoiceReply
                  ? "border-[#6366D8]/30 bg-[#E8E8FA]/60 dark:bg-[#25283C]/60 text-[#6366D8] dark:text-[#8B8FE8]"
                  : "border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-[#11121C] text-[#6B6E85]"
              }`}
              title="Toggle automatic spoken responses"
            >
              {autoVoiceReply ? <Volume2 size={15} /> : <VolumeX size={15} />}
              <span>{autoVoiceReply ? "Spoken AI: ON" : "Spoken AI: OFF"}</span>
            </button>

            {/* Live Voice API Button */}
            <button
              type="button"
              onClick={toggleLiveVoice}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition ${
                liveVoiceActive
                  ? "bg-[#E98B9B] text-white border-[#E98B9B] animate-pulse"
                  : "border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-[#11121C] text-[#6B6E85] dark:text-[#C5C8D8] hover:border-[#6366D8]"
              }`}
              title="Connect Gemini Live streaming voice API"
            >
              <Radio size={14} className={liveVoiceActive ? "animate-spin" : ""} />
              <span>{liveVoiceActive ? "Live Stream Active" : "Live API"}</span>
            </button>

            <button
              onClick={clearChat}
              className="p-2 rounded-xl text-[#6B6E85] hover:bg-stone-100 dark:hover:bg-stone-800 transition"
              title="Clear conversation"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        {/* ACTIVE CONTEXT GROUNDING PILL */}
        <div className="bg-[#F7F7FC] dark:bg-[#11121C] px-6 py-2.5 border-b border-stone-100 dark:border-stone-800 flex flex-wrap items-center justify-between text-xs text-[#6B6E85] dark:text-[#9A9DB5] gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#78CFA3]" />
            <span className="font-semibold text-[#202238] dark:text-[#F3F4F6]">
              Asha (Room 402) Context Active
            </span>
            <span>•</span>
            <span>Language: {currentMeta.name}</span>
          </div>

          <div className="flex items-center gap-3 text-[11px]">
            <span>Routine: Stable</span>
            <span>•</span>
            <span>Non-Diagnostic Guardrails Active</span>
          </div>
        </div>

        {liveStatusText && (
          <div className="bg-[#E8E8FA]/60 dark:bg-[#25283C]/60 px-6 py-1.5 text-xs text-[#6366D8] dark:text-[#8B8FE8] font-semibold text-center border-b border-[#6366D8]/20">
            {liveStatusText}
          </div>
        )}

        {/* MESSAGES VIEW */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
          {messages.map((message, index) => {
            const isUser = message.role === "user";

            return (
              <div
                key={index}
                className={`flex items-start gap-3 ${
                  isUser ? "justify-end" : "justify-start"
                }`}
              >
                {!isUser && (
                  <div className="w-9 h-9 shrink-0 rounded-2xl bg-[#E8E8FA] dark:bg-[#25283C] flex items-center justify-center text-[#6366D8] dark:text-[#8B8FE8] shadow-xs">
                    <Bot size={18} />
                  </div>
                )}

                <div className="flex items-end gap-2 max-w-[85%]">
                  <div
                    className={`px-5 py-3.5 rounded-3xl text-sm leading-relaxed shadow-soft ${
                      isUser
                        ? "bg-[#6366D8] text-white rounded-br-xs"
                        : "bg-[#F7F7FC] dark:bg-[#11121C] text-[#202238] dark:text-[#F3F4F6] rounded-bl-xs border border-stone-200/80 dark:border-stone-800/80"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>

                    {!isUser && message.source && (
                      <span className="mt-1.5 inline-block text-[10px] text-[#6B6E85] dark:text-[#9A9DB5] opacity-75">
                        {message.source === "gemini-3.8-flash"
                          ? "Grounded with Gemini 3.8"
                          : message.source === "offline_heuristic_engine"
                          ? "Offline Heuristic Routine Engine"
                          : "ANVESHA Context Intelligence"}
                      </span>
                    )}
                  </div>

                  {!isUser && (
                    <button
                      type="button"
                      onClick={() => speakMessage(message, index)}
                      disabled={currentlyPlayingMessage === index}
                      className="w-10 h-10 shrink-0 rounded-2xl bg-[#E8E8FA] dark:bg-[#25283C] text-[#6366D8] dark:text-[#8B8FE8] flex items-center justify-center hover:bg-[#6366D8]/20 disabled:opacity-60 transition shadow-xs"
                      title="Listen to spoken response"
                      aria-label="Listen to spoken response"
                    >
                      {currentlyPlayingMessage === index ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <Volume2 size={18} />
                      )}
                    </button>
                  )}
                </div>

                {isUser && (
                  <div className="w-9 h-9 shrink-0 rounded-2xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-[#6B6E85] dark:text-[#9A9DB5]">
                    <User size={18} />
                  </div>
                )}
              </div>
            );
          })}

          {loading && (
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 shrink-0 rounded-2xl bg-[#E8E8FA] dark:bg-[#25283C] flex items-center justify-center text-[#6366D8] dark:text-[#8B8FE8]">
                <Bot size={18} />
              </div>
              <div className="bg-[#F7F7FC] dark:bg-[#11121C] border border-stone-200/80 dark:border-stone-800/80 px-4 py-3 rounded-2xl flex items-center gap-2 text-[#6B6E85] dark:text-[#9A9DB5] text-xs">
                <Loader2 size={16} className="animate-spin text-[#6366D8]" />
                <span>Anvesha is listening and thinking in {currentMeta.name}...</span>
              </div>
            </div>
          )}
        </div>

        {/* INPUT BAR WITH VOICE INPUT & REAL-TIME CONTROLS */}
        <div className="border-t border-stone-100 dark:border-stone-800 p-4 bg-white dark:bg-[#1B1D2A]">
          <div className="flex items-end gap-3 bg-[#F7F7FC] dark:bg-[#11121C] border border-stone-200 dark:border-stone-700 rounded-3xl px-4 py-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Ask Anvesha about routine, medicine, or memories in ${currentMeta.name}...`}
              rows={1}
              disabled={loading || isRecording || isTranscribing}
              className="flex-1 resize-none bg-transparent outline-none text-sm text-[#202238] dark:text-[#F3F4F6] placeholder:text-[#6B6E85] disabled:opacity-60"
            />

            {/* Large elderly-friendly Voice Input Microphone Button */}
            <button
              type="button"
              onClick={isRecording ? stopRecording : startRecording}
              disabled={loading || isTranscribing}
              className={`w-12 h-12 shrink-0 rounded-2xl text-white flex items-center justify-center shadow-soft transition ${
                isRecording
                  ? "bg-[#E98B9B] animate-pulse scale-105"
                  : "bg-[#6366D8] hover:bg-[#5255C5]"
              }`}
              title={isRecording ? "Tap to finish speaking" : "Speak to Anvesha"}
              aria-label={isRecording ? "Tap to finish speaking" : "Speak to Anvesha"}
            >
              {isRecording ? <MicOff size={22} /> : <Mic size={22} />}
            </button>

            {/* Send Text Button */}
            <button
              type="button"
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading || isRecording || isTranscribing}
              className="w-12 h-12 shrink-0 rounded-2xl bg-[#6366D8] hover:bg-[#5255C5] text-white flex items-center justify-center disabled:opacity-40 transition shadow-soft"
              title="Send message"
            >
              <Send size={18} />
            </button>
          </div>

          {isRecording && (
            <div className="flex items-center justify-center gap-2 mt-2.5 text-xs text-[#E98B9B] font-bold animate-pulse">
              <span className="w-2.5 h-2.5 rounded-full bg-[#E98B9B]" />
              <span>Listening to you in {currentMeta.name}... Tap the microphone button when finished.</span>
            </div>
          )}

          {isTranscribing && (
            <div className="flex items-center justify-center gap-2 mt-2.5 text-xs text-[#6366D8] dark:text-[#8B8FE8] font-bold">
              <Loader2 size={14} className="animate-spin" />
              <span>Transcribing your speech with Gemini Speech Recognition...</span>
            </div>
          )}

          {voiceError && (
            <p className="text-xs text-[#E98B9B] text-center mt-2 font-medium">{voiceError}</p>
          )}

          {/* Non-Diagnostic Guardrail Footer */}
          <p className="text-[11px] text-[#6B6E85] dark:text-[#9A9DB5] text-center mt-2.5">
            ANVESHA provides gentle cognitive companionship grounded in daily routine. Observational only, not medical diagnosis.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AnveshaChat;
