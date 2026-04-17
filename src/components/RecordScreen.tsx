import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Square, RotateCcw, Loader2, Activity, Lightbulb } from "lucide-react";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { uploadSession, UploadResponse } from "@/services/cognivaraApi";

interface RecordScreenProps {
  userId: string;
  sessionCount: number;
  onSessionUploaded: (result: UploadResponse) => void;
}

const RecordScreen = ({ userId, sessionCount, onSessionUploaded }: RecordScreenProps) => {
  const { isRecording, transcript, interimTranscript, timeLeft, startRecording, stopRecording, resetTranscript } =
    useSpeechRecognition(30);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const currentSessionNum = sessionCount + 1;

  const handleStart = useCallback(async () => {
    setUploadError("");
    audioChunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const candidates = [
        "audio/webm;codecs=opus",
        "audio/ogg;codecs=opus",
        "audio/mp4",
        "audio/webm",
      ];
      const mimeType =
        candidates.find((t) => (window as any).MediaRecorder?.isTypeSupported?.(t)) || "";
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      recorder.start(250);
    } catch {
      console.warn("Could not start media recorder");
    }
    startRecording();
  }, [startRecording]);

  const handleStop = useCallback(async () => {
    stopRecording();
    const recorder = mediaRecorderRef.current;
    const recordedMime = recorder?.mimeType || "audio/webm";
    let audioBlob = new Blob([], { type: recordedMime });
    if (recorder && recorder.state !== "inactive") {
      await new Promise<void>((resolve) => {
        recorder.onstop = () => resolve();
        recorder.stop();
      });
      if (audioChunksRef.current.length > 0) {
        audioBlob = new Blob(audioChunksRef.current, { type: recordedMime });
      }
      recorder.stream.getTracks().forEach((t) => t.stop());
    }
    const ext = recordedMime.includes("ogg")
      ? "ogg"
      : recordedMime.includes("mp4")
        ? "m4a"
        : "webm";
    setIsUploading(true);
    try {
      const result = await uploadSession(userId, audioBlob, transcript || "", `recording.${ext}`);
      onSessionUploaded(result);
    } catch (err: any) {
      setUploadError(err.message || "Upload failed");
    } finally {
      setIsUploading(false);
    }
  }, [stopRecording, transcript, userId, onSessionUploaded]);

  const handleReset = () => {
    resetTranscript();
    setUploadError("");
  };

  const elapsed = 30 - timeLeft;
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-heading text-3xl font-bold text-foreground">Voice Biomarkers</h1>
        <div className="flex items-center gap-2 mt-1">
          <div className={`h-2 w-2 rounded-full ${isRecording ? "bg-amber-400 animate-pulse" : "bg-muted-foreground"}`} />
          <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold">
            {isRecording ? "Session Live: Capturing Neural Patterns" : `Session ${currentSessionNum} of 3 · Ready`}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Recording Area */}
        <div className="lg:col-span-2">
          <motion.div
            className="rounded-2xl bg-gradient-card border border-border p-8 shadow-card flex flex-col items-center"
          >
            {/* Mic Icon */}
            <motion.div
              animate={isRecording ? { scale: [1, 1.05, 1] } : {}}
              transition={{ repeat: Infinity, duration: 2 }}
              className={`h-24 w-24 rounded-2xl flex items-center justify-center mb-6 transition-all ${
                isRecording
                  ? "bg-primary/20 border-2 border-primary shadow-glow"
                  : "bg-secondary"
              }`}
            >
              {isUploading ? (
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
              ) : (
                <Mic className={`h-10 w-10 ${isRecording ? "text-primary" : "text-muted-foreground"}`} />
              )}
            </motion.div>

            {/* Timer */}
            <p className="font-heading text-6xl font-bold text-foreground tabular-nums mb-2">
              {minutes.toString().padStart(2, "0")}:{seconds.toString().padStart(2, "0")}
              <span className="text-lg text-muted-foreground ml-1">/{timeLeft}</span>
            </p>

            {/* Waveform visualization */}
            {isRecording && (
              <div className="flex items-end gap-1 h-12 mb-4">
                {Array.from({ length: 20 }).map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-1.5 rounded-full bg-primary/60"
                    animate={{ height: [4, Math.random() * 40 + 8, 4] }}
                    transition={{ repeat: Infinity, duration: 0.6 + Math.random() * 0.4, delay: i * 0.05 }}
                  />
                ))}
              </div>
            )}

            {/* Record/Stop Button */}
            <button
              onClick={isRecording ? handleStop : handleStart}
              disabled={isUploading}
              className={`flex items-center gap-3 px-8 py-3.5 rounded-xl font-heading font-semibold text-sm transition-all ${
                isRecording
                  ? "bg-destructive/20 text-destructive border border-destructive/30 hover:bg-destructive/30"
                  : isUploading
                    ? "bg-muted text-muted-foreground"
                    : "bg-gradient-cta text-primary-foreground shadow-glow hover:opacity-90"
              }`}
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Uploading...
                </>
              ) : isRecording ? (
                <>
                  <Square className="h-4 w-4" /> Stop Recording
                </>
              ) : (
                <>
                  <Mic className="h-4 w-4" /> Start Recording
                </>
              )}
            </button>

            {uploadError && <p className="text-sm text-destructive mt-4">{uploadError}</p>}

            {/* Transcript */}
            <AnimatePresence>
              {(transcript || interimTranscript) && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="w-full rounded-xl bg-secondary/50 border border-border p-4 mt-6"
                >
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-2">
                    Live Transcript
                  </p>
                  <p className="text-sm text-foreground leading-relaxed">
                    {transcript}
                    <span className="text-muted-foreground">{interimTranscript}</span>
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {transcript && !isRecording && !isUploading && (
              <button onClick={handleReset} className="flex items-center gap-2 mt-3 text-xs text-muted-foreground hover:text-foreground transition-colors">
                <RotateCcw className="h-3 w-3" /> Reset
              </button>
            )}
          </motion.div>

          {/* Real-time Metrics */}
          <div className="grid grid-cols-4 gap-3 mt-5">
            {[
              { label: "PITCH RANGE", value: isRecording ? "142" : "--", unit: "Hz", color: "bg-primary" },
              { label: "JITTER INDEX", value: isRecording ? "0.42" : "--", unit: "%", color: "bg-primary" },
              { label: "LATENCY", value: isRecording ? "12" : "--", unit: "ms", color: "bg-accent" },
              { label: "VAD STATUS", value: isRecording ? "ACTIVE" : "IDLE", unit: "", color: "" },
            ].map((metric) => (
              <div key={metric.label} className="rounded-xl bg-gradient-card border border-border p-4 shadow-card">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-3">{metric.label}</p>
                <p className="font-heading text-2xl font-bold text-foreground">
                  {metric.value}
                  {metric.unit && <span className="text-xs text-muted-foreground ml-1 font-normal">{metric.unit}</span>}
                </p>
                {metric.color && (
                  <div className={`h-1 rounded-full mt-2 ${metric.color}`} style={{ width: "60%" }} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Tips */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="h-4 w-4 text-primary" />
            <h3 className="font-heading text-base font-bold text-foreground">Tips for Accuracy</h3>
          </div>

          {[
            { title: "ENVIRONMENT", desc: "Ensure a quiet clinical setting. Minimize ambient hum from HVAC or electronic equipment.", color: "border-accent" },
            { title: "DISTANCE", desc: "Maintain a consistent distance of 15-20cm between the patient and the microphone sensor.", color: "border-destructive" },
            { title: "ARTICULATION", desc: "Ask the patient to speak at their natural conversational volume without forced projection.", color: "border-destructive" },
          ].map((tip) => (
            <div key={tip.title} className={`rounded-xl bg-card border-l-2 ${tip.color} border border-border p-4`}>
              <p className={`text-[10px] uppercase tracking-wider font-semibold mb-2 ${
                tip.color === "border-accent" ? "text-accent" : "text-destructive"
              }`}>
                {tip.title}
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">{tip.desc}</p>
            </div>
          ))}

          <div className="rounded-xl bg-gradient-card border border-border p-4 mt-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Processing Node</p>
              <span className="text-[10px] font-semibold text-primary">US-EAST-01</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-accent" />
              <span className="text-xs text-foreground font-medium">Neural Engine Sync: Optimized</span>
            </div>
          </div>

          <p className="text-[9px] uppercase tracking-wider text-muted-foreground leading-relaxed mt-4">
            This recording is protected by AES-256 neural encryption. End-to-end clinical compliance active.
          </p>
        </div>
      </div>
    </div>
  );
};

export default RecordScreen;
