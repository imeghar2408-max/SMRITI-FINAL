/**
 * ANVESHA Centralized Multilingual Language Registry
 * 
 * Accurately tracks capabilities across Northeast Indian & National languages.
 * Distinguishes:
 * - textSupported
 * - sttSupported (Speech-to-Text)
 * - ttsSupported (Text-to-Speech)
 * - liveVoiceSupported (Real-time live streaming voice)
 * - aiContextSupported (Cognitive routine grounding & memory retention)
 */

export const LANGUAGE_REGISTRY = {
  "as-IN": {
    code: "as-IN",
    name: "Assamese",
    nativeName: "অসমীয়া",
    script: "Bengali/Assamese (অসমীয়া লিপি)",
    region: "Assam, Northeast India",
    greeting: "নমস্কাৰ",
    textSupported: true,
    sttSupported: true,
    ttsSupported: false,
    liveVoiceSupported: false,
    aiContextSupported: true,
    ttsVoice: "None (Closed Beta)",
    ttsFallback: "text_only",
    description: "Full contextual text and audio speech-to-text (STT) support. Voice response falls back to accessible text pending native Assamese voice engine access.",
  },
  "bn-IN": {
    code: "bn-IN",
    name: "Bengali",
    nativeName: "বাংলা",
    script: "Bengali (বাংলা লিপি)",
    region: "West Bengal, Tripura, Assam",
    greeting: "নমস্কার",
    textSupported: true,
    sttSupported: true,
    ttsSupported: true,
    liveVoiceSupported: true,
    aiContextSupported: true,
    ttsVoice: "priya (Sarvam bulbul:v3 - Natural Bengali)",
    ttsFallback: "browser_speech_synthesis",
    description: "Full conversational, voice recognition, and natural Bengali spoken voice support.",
  },
  "hi-IN": {
    code: "hi-IN",
    name: "Hindi",
    nativeName: "हिन्दी",
    script: "Devanagari (देवनागरी)",
    region: "Pan-India National",
    greeting: "नमस्ते",
    textSupported: true,
    sttSupported: true,
    ttsSupported: true,
    liveVoiceSupported: true,
    aiContextSupported: true,
    ttsVoice: "priya (Sarvam bulbul:v3 - Natural Indian Hindi)",
    ttsFallback: "browser_speech_synthesis",
    description: "Complete natural voice, transcription, and contextual intelligence support.",
  },
  "en-IN": {
    code: "en-IN",
    name: "English (India)",
    nativeName: "English",
    script: "Latin",
    region: "Pan-India & International",
    greeting: "Hello",
    textSupported: true,
    sttSupported: true,
    ttsSupported: true,
    liveVoiceSupported: true,
    aiContextSupported: true,
    ttsVoice: "priya (Sarvam bulbul:v3 - Natural Indian English)",
    ttsFallback: "browser_speech_synthesis",
    description: "Full natural language, audio transcription, and natural Indian English voice support.",
  },
  "ne-NP": {
    code: "ne-NP",
    name: "Nepali",
    nativeName: "नेपाली",
    script: "Devanagari",
    region: "Sikkim, Assam, North Bengal",
    greeting: "नमस्ते",
    textSupported: true,
    sttSupported: true,
    ttsSupported: true,
    liveVoiceSupported: true,
    aiContextSupported: true,
    description: "Full text and voice synthesis support widely spoken across Northeast India.",
  },
  "brx-IN": {
    code: "brx-IN",
    name: "Bodo",
    nativeName: "बड़ो",
    script: "Devanagari",
    region: "Bodoland Territorial Region, Assam",
    greeting: "खुमুলিয়া",
    textSupported: true,
    sttSupported: false,
    ttsSupported: false,
    liveVoiceSupported: false,
    aiContextSupported: true,
    description: "Text and patient context understanding supported; audio transcription via multimodal audio. Native TTS voice not yet available in browser engines.",
  },
  "mni-IN": {
    code: "mni-IN",
    name: "Manipuri (Meitei)",
    nativeName: "ꯃꯩꯇꯩꯂꯣꯟ",
    script: "Meitei Mayek / Bengali",
    region: "Manipur, Assam",
    greeting: "ꯈꯨꯔꯨꯝꯖꯔꯤ",
    textSupported: true,
    sttSupported: false,
    ttsSupported: false,
    liveVoiceSupported: false,
    aiContextSupported: true,
    description: "Text and patient context reasoning supported. Direct voice synthesis not yet supported by standard browser speech engines.",
  },
  "lus-IN": {
    code: "lus-IN",
    name: "Mizo",
    nativeName: "Mizo ṭawng",
    script: "Latin",
    region: "Mizoram, Northeast India",
    greeting: "Chibai",
    textSupported: true,
    sttSupported: false,
    ttsSupported: false,
    liveVoiceSupported: false,
    aiContextSupported: true,
    description: "Text reasoning and patient routine context supported with Latin script.",
  },
};

export const DEFAULT_LOCALE = "as-IN";

export function getLanguageMetadata(code) {
  return LANGUAGE_REGISTRY[code] || LANGUAGE_REGISTRY[DEFAULT_LOCALE];
}

export function getAllLanguages() {
  return Object.values(LANGUAGE_REGISTRY);
}

export default {
  LANGUAGE_REGISTRY,
  DEFAULT_LOCALE,
  getLanguageMetadata,
  getAllLanguages,
};
