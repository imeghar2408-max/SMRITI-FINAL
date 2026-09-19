import React, { useEffect, useRef, useState } from "react";
import * as faceapi from "@vladmandic/face-api";

const MODEL_URL =
  "https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.15/model";

const STORAGE_KEY = "anvesha-known-people";

export default function WhoIsAtMyDoor() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [result, setResult] = useState(null);
  const [cameraOpen, setCameraOpen] = useState(false);

  const [knownPeople, setKnownPeople] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  });

  // Load face recognition models
  useEffect(() => {
    const loadModels = async () => {
      try {
        setLoading(true);

        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);

        setModelsLoaded(true);
        setMessage("Ready to check who is at the door.");
      } catch (error) {
        console.error(error);
        setMessage("Could not load the face recognition system.");
      } finally {
        setLoading(false);
      }
    };

    loadModels();
  }, []);

  // Save known people
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(knownPeople));
  }, [knownPeople]);

  // Stop camera when page is closed
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    setCameraOpen(false);
  };

  const startCamera = async () => {
    try {
      setResult(null);
      setSelectedImage(null);
      setMessage("Opening camera...");

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setCameraOpen(true);
      setMessage("Camera is ready. Take a photo of the visitor.");
    } catch (error) {
      console.error(error);
      setMessage(
        "Camera access was not allowed. You can upload a photo instead."
      );
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;

    const canvas = document.createElement("canvas");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext("2d");

    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageUrl = canvas.toDataURL("image/jpeg");

    setSelectedImage(imageUrl);
    setResult(null);

    stopCamera();

    checkVisitor(imageUrl);
  };

  const handleUpload = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const imageUrl = URL.createObjectURL(file);

    setSelectedImage(imageUrl);
    setResult(null);

    checkVisitor(imageUrl);
  };

  const getFaceDescriptor = async (imageSource) => {
    const image = await faceapi.fetchImage(imageSource);

    const detections = await faceapi
      .detectAllFaces(
        image,
        new faceapi.TinyFaceDetectorOptions({
          inputSize: 320,
          scoreThreshold: 0.5,
        })
      )
      .withFaceLandmarks()
      .withFaceDescriptors();

    return detections;
  };

  const checkVisitor = async (imageSource) => {
    if (!modelsLoaded) {
      setMessage("Face recognition is still loading. Please wait.");
      return;
    }

    try {
      setMessage("Checking the visitor...");
      setResult(null);

      const detections = await getFaceDescriptor(imageSource);

      if (detections.length === 0) {
        setMessage("No face detected. Please try another photo.");
        return;
      }

      if (detections.length > 1) {
        setMessage(
          "More than one face detected. Please use a photo with only the visitor."
        );
        return;
      }

      if (knownPeople.length === 0) {
        setResult({
          type: "unknown",
          title: "No Known People Added",
          description:
            "Ask your caregiver to add family members and caregivers first.",
        });

        setMessage("No registered people are available for comparison.");
        return;
      }

      const labeledDescriptors = knownPeople.map(
        (person) =>
          new faceapi.LabeledFaceDescriptors(person.name, [
            new Float32Array(person.descriptor),
          ])
      );

      const faceMatcher = new faceapi.FaceMatcher(
        labeledDescriptors,
        0.6
      );

      const bestMatch = faceMatcher.findBestMatch(
        detections[0].descriptor
      );

      if (bestMatch.label === "unknown") {
        setResult({
          type: "unknown",
          title: "Person Not Recognized",
          description:
            "We don't recognize this person. Please contact your caregiver before opening the door.",
        });

        setMessage("The visitor could not be matched with a known person.");
        return;
      }

      const matchedPerson = knownPeople.find(
        (person) => person.name === bestMatch.label
      );

      setResult({
        type: "match",
        title: "Possible Match Found",
        name: matchedPerson?.name || bestMatch.label,
        relation: matchedPerson?.relation || "Known person",
        description:
          "This person looks similar to someone registered by your caregiver. Please verify before opening the door.",
      });

      setMessage("Possible match found.");
    } catch (error) {
      console.error(error);

      setMessage(
        "Something went wrong while checking the visitor. Please try again."
      );
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center">
            <span className="text-2xl">🚪</span>
          </div>

          <div>
            <h1 className="text-3xl font-bold text-slate-800">
              Who Is At My Door?
            </h1>

            <p className="text-slate-500">
              Check if a visitor is someone you know.
            </p>
          </div>
        </div>
      </div>

      {/* Status */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-6">
        <div className="flex items-center gap-3">
          <div
            className={`w-3 h-3 rounded-full ${
              modelsLoaded ? "bg-green-500" : "bg-yellow-500"
            }`}
          />

          <div>
            <p className="font-semibold text-slate-800">
              {loading
                ? "Preparing face recognition..."
                : modelsLoaded
                ? "Face recognition ready"
                : "Face recognition unavailable"}
            </p>

            <p className="text-sm text-slate-500">{message}</p>
          </div>
        </div>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 md:p-8">
          <h2 className="text-xl font-bold text-slate-800 mb-2">
            Is someone at the door?
          </h2>

          <p className="text-slate-500 mb-6">
            Take a photo of the visitor or upload a photo to check for a
            possible match.
          </p>

          {/* Camera */}
          {cameraOpen && (
            <div className="mb-6">
              <div className="rounded-2xl overflow-hidden bg-black">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full max-h-[450px] object-cover"
                />
              </div>

              <div className="flex gap-3 mt-4">
                <button
                  onClick={capturePhoto}
                  className="px-5 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700"
                >
                  📸 Take Photo
                </button>

                <button
                  onClick={stopCamera}
                  className="px-5 py-3 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Selected Image */}
          {selectedImage && !cameraOpen && (
            <div className="mb-6">
              <img
                src={selectedImage}
                alt="Visitor"
                className="w-full max-h-[400px] object-contain rounded-2xl bg-slate-100"
              />
            </div>
          )}

          {/* Buttons */}
          {!cameraOpen && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={startCamera}
                disabled={!modelsLoaded}
                className="p-5 rounded-2xl border-2 border-indigo-200 bg-indigo-50 hover:bg-indigo-100 transition text-left disabled:opacity-50"
              >
                <div className="text-3xl mb-3">📷</div>

                <p className="font-bold text-slate-800">
                  Take Photo
                </p>

                <p className="text-sm text-slate-500 mt-1">
                  Use the camera to take a photo of the visitor.
                </p>
              </button>

              <label
                className={`p-5 rounded-2xl border-2 border-slate-200 bg-slate-50 hover:bg-slate-100 transition cursor-pointer ${
                  !modelsLoaded ? "opacity-50 pointer-events-none" : ""
                }`}
              >
                <div className="text-3xl mb-3">🖼️</div>

                <p className="font-bold text-slate-800">
                  Upload Photo
                </p>

                <p className="text-sm text-slate-500 mt-1">
                  Choose a photo of the visitor from your device.
                </p>

                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleUpload}
                />
              </label>
            </div>
          )}

          {/* Result */}
          {result && (
            <div
              className={`mt-8 rounded-2xl p-6 border ${
                result.type === "match"
                  ? "bg-green-50 border-green-200"
                  : "bg-red-50 border-red-200"
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="text-4xl">
                  {result.type === "match" ? "👤" : "⚠️"}
                </div>

                <div>
                  <h3 className="text-xl font-bold text-slate-800">
                    {result.title}
                  </h3>

                  {result.name && (
                    <p className="text-lg font-semibold text-slate-700 mt-2">
                      {result.name}
                    </p>
                  )}

                  {result.relation && (
                    <p className="text-slate-500">
                      {result.relation}
                    </p>
                  )}

                  <p className="text-slate-600 mt-3">
                    {result.description}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Safety Note */}
          <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
            <p className="text-sm text-amber-800">
              <strong>Safety reminder:</strong> A possible match is not proof
              of identity. Always verify the visitor before opening the door.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}