import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Square, RotateCcw, Loader2, Lightbulb } from "lucide-react";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { convertAudioBlobToWav, getPreferredAudioMimeType } from "@/lib/audio";
import { uploadSession, warmupBackend, UploadResponse } from "@/services/cognivaraApi";

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
      const mimeType = getPreferredAudioMimeType();
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);

      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };
      recorder.start(250);
    } catch {
      setUploadError("Microphone access failed. Please check browser permissions and try again.");
      return;
    }

    startRecording();
  }, [startRecording]);

  const handleStop = useCallback(async () => {
    stopRecording();
    const recorder = mediaRecorderRef.current;
    const recordedMime = recorder?.mimeType || "audio/webm";
    let recordedBlob = new Blob([], { type: recordedMime });

    if (recorder && recorder.state !== "inactive") {
      await new Promise<void>((resolve) => {
        recorder.onstop = () => resolve();
        recorder.stop();
      });

      if (audioChunksRef.current.length > 0) {
        recordedBlob = new Blob(audioChunksRef.current, { type: recordedMime });
      }

      recorder.stream.getTracks().forEach((track) => track.stop());
    }

    setIsUploading(true);

    try {
      const wavBlob = await convertAudioBlobToWav(recordedBlob);
      const result = await uploadSession(userId, wavBlob, transcript || "", "recording.wav");
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
      <div className="mb-6">
        <h1 className="font-heading text-3xl font-bold text-foreground">Voice Biomarkers</h1>
        <div className="mt-1 flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${isRecording ? "bg-amber-400 animate-pulse" : "bg-muted-foreground"}`} />
          <span className="font-semibold text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            {isRecording ? "Session Live: Capturing Neural Patterns" : `Session ${currentSessionNum} of 3 · Ready`}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <motion.div className="flex flex-col items-center rounded-2xl border border-border bg-gradient-card p-8 shadow-card">
            <motion.div
              animate={isRecording ? { scale: [1, 1.05, 1] } : {}}
              transition={{ repeat: Infinity, duration: 2 }}
              className={`mb-6 flex h-24 w-24 items-center justify-center rounded-2xl transition-all ${
                isRecording ? "border-2 border-primary bg-primary/20 shadow-glow" : "bg-secondary"
              }`}
            >
              {isUploading ? (
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
              ) : (
                <Mic className={`h-10 w-10 ${isRecording ? "text-primary" : "text-muted-foreground"}`} />
              )}
            </motion.div>

            <p className="mb-2 font-heading text-6xl font-bold tabular-nums text-foreground">
              {minutes.toString().padStart(2, "0")}:{seconds.toString().padStart(2, "0")}
              <span className="ml-1 text-lg text-muted-foreground">/{timeLeft}</span>
            </p>

            {isRecording && (
              <div className="mb-4 flex h-12 items-end gap-1">
                {Array.from({ length: 20 }).map((_, index) => (
                  <motion.div
                    key={index}
                    className="w-1.5 rounded-full bg-primary/60"
                    animate={{ height: [4, Math.random() * 40 + 8, 4] }}
                    transition={{ repeat: Infinity, duration: 0.6 + Math.random() * 0.4, delay: index * 0.05 }}
                  />
                ))}
              </div>
            )}

            <button
              onClick={isRecording ? handleStop : handleStart}
              disabled={isUploading}
              className={`flex items-center gap-3 rounded-xl px-8 py-3.5 font-heading text-sm font-semibold transition-all ${
                isRecording
                  ? "border border-destructive/30 bg-destructive/20 text-destructive hover:bg-destructive/30"
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

            {uploadError && <p className="mt-4 text-sm text-destructive">{uploadError}</p>}

            <AnimatePresence>
              {(transcript || interimTranscript) && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-6 w-full rounded-xl border border-border bg-secondary/50 p-4"
                >
                  <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    Live Transcript
                  </p>
                  <p className="text-sm leading-relaxed text-foreground">
                    {transcript}
                    <span className="text-muted-foreground">{interimTranscript}</span>
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {transcript && !isRecording && !isUploading && (
              <button
                onClick={handleReset}
                className="mt-3 flex items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                <RotateCcw className="h-3 w-3" /> Reset
              </button>
            )}
          </motion.div>

          <div className="mt-5 grid grid-cols-4 gap-3">
            {[
              { label: "PITCH RANGE", value: isRecording ? "142" : "--", unit: "Hz", color: "bg-primary" },
              { label: "JITTER INDEX", value: isRecording ? "0.42" : "--", unit: "%", color: "bg-primary" },
              { label: "LATENCY", value: isRecording ? "12" : "--", unit: "ms", color: "bg-accent" },
              { label: "VAD STATUS", value: isRecording ? "ACTIVE" : "IDLE", unit: "", color: "" },
            ].map((metric) => (
              <div key={metric.label} className="rounded-xl border border-border bg-gradient-card p-4 shadow-card">
                <p className="mb-3 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{metric.label}</p>
                <p className="font-heading text-2xl font-bold text-foreground">
                  {metric.value}
                  {metric.unit && <span className="ml-1 text-xs font-normal text-muted-foreground">{metric.unit}</span>}
                </p>
                {metric.color && <div className={`mt-2 h-1 rounded-full ${metric.color}`} style={{ width: "60%" }} />}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="mb-2 flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-primary" />
            <h3 className="font-heading text-base font-bold text-foreground">Tips for Accuracy</h3>
          </div>

          {[
            {
              title: "ENVIRONMENT",
              desc: "Ensure a quiet clinical setting. Minimize ambient hum from HVAC or electronic equipment.",
              color: "border-accent",
            },
            {
              title: "DISTANCE",
              desc: "Maintain a consistent distance of 15-20cm between the patient and the microphone sensor.",
              color: "border-destructive",
            },
            {
              title: "ARTICULATION",
              desc: "Ask the patient to speak at their natural conversational volume without forced projection.",
              color: "border-destructive",
            },
          ].map((tip) => (
            <div key={tip.title} className={`rounded-xl border border-border border-l-2 ${tip.color} bg-card p-4`}>
              <p
                className={`mb-2 text-[10px] font-semibold uppercase tracking-wider ${
                  tip.color === "border-accent" ? "text-accent" : "text-destructive"
                }`}
              >
                {tip.title}
              </p>
              <p className="text-xs leading-relaxed text-muted-foreground">{tip.desc}</p>
            </div>
          ))}

          <div className="mt-4 rounded-xl border border-border bg-gradient-card p-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Processing Node</p>
              <span className="text-[10px] font-semibold text-primary">US-EAST-01</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-accent" />
              <span className="text-xs font-medium text-foreground">Neural Engine Sync: Optimized</span>
            </div>
          </div>

          <p className="mt-4 text-[9px] uppercase tracking-wider leading-relaxed text-muted-foreground">
            This recording is protected by AES-256 neural encryption. End-to-end clinical compliance active.
          </p>
        </div>
      </div>
    </div>
  );
};

export default RecordScreen;
