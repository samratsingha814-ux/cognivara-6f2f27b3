import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, RotateCcw, Loader2, Bell, Activity, Lightbulb } from "lucide-react";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { uploadSession } from "@/services/cognivaraApi";

interface RecordScreenProps {
  userId: string;
  sessionCount: number;
  onSessionUploaded: () => void;
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
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.start(250); // collect chunks every 250ms
    } catch {
      console.warn("Could not start media recorder, will upload empty audio");
    }

    startRecording();
  }, [startRecording]);

  const handleStop = useCallback(async () => {
    stopRecording();

    // Stop media recorder
    const recorder = mediaRecorderRef.current;
    let audioBlob = new Blob([], { type: "audio/webm" });

    if (recorder && recorder.state !== "inactive") {
      await new Promise<void>((resolve) => {
        recorder.onstop = () => resolve();
        recorder.stop();
      });
      if (audioChunksRef.current.length > 0) {
        audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
      }
      // Stop all tracks
      recorder.stream.getTracks().forEach((t) => t.stop());
    }

    setIsUploading(true);
    try {
      // Upload with whatever transcript we have (may be empty)
      await uploadSession(userId, audioBlob, currentSessionNum, transcript || "");
      onSessionUploaded();
    } catch (err: any) {
      setUploadError(err.message || "Upload failed");
    } finally {
      setIsUploading(false);
    }
  }, [stopRecording, transcript, userId, currentSessionNum, onSessionUploaded]);

  const handleReset = () => {
    resetTranscript();
    setUploadError("");
  };

  const elapsed = 30 - timeLeft;
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;

  return (
    <div className="px-5 pt-12 pb-28 flex flex-col min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <Activity className="h-4 w-4 text-primary" />
          </div>
          <span className="font-heading text-lg font-bold tracking-tight">COGNIVARA</span>
        </div>
        <button className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center">
          <Bell className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      {/* Title */}
      <div className="mb-6">
        <p className="text-[10px] uppercase tracking-[0.2em] text-accent font-semibold mb-1">
          Session {currentSessionNum} of 3
        </p>
        <h1 className="font-heading text-3xl font-bold text-foreground leading-tight">
          Voice Biomarkers
        </h1>
        <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
          Speak naturally for 30 seconds. Describe your morning routine or a recent memory.
        </p>
      </div>

      {/* Mic Area */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <motion.div
          className="relative mb-6"
          animate={isRecording ? { scale: [1, 1.02, 1] } : {}}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          {isRecording && (
            <div className="absolute -left-8 top-1/2 -translate-y-1/2 flex flex-col gap-1">
              {[3, 5, 8, 5, 3].map((h, i) => (
                <motion.div
                  key={i}
                  className="w-1 rounded-full bg-primary/40"
                  animate={{ height: [h * 3, h * 6, h * 3] }}
                  transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.1 }}
                />
              ))}
            </div>
          )}
          {isRecording && (
            <div className="absolute -right-8 top-1/2 -translate-y-1/2 flex flex-col gap-1">
              {[3, 5, 8, 5, 3].map((h, i) => (
                <motion.div
                  key={i}
                  className="w-1 rounded-full bg-primary/40"
                  animate={{ height: [h * 3, h * 6, h * 3] }}
                  transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }}
                />
              ))}
            </div>
          )}

          <div className="rounded-2xl bg-gradient-card border border-border p-8 shadow-card">
            <motion.button
              whileTap={{ scale: 0.93 }}
              onClick={isRecording ? handleStop : handleStart}
              disabled={isUploading}
              className={`h-20 w-20 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-all ${
                isRecording
                  ? "bg-primary/20 border-2 border-primary shadow-glow"
                  : isUploading
                  ? "bg-muted"
                  : "bg-secondary hover:bg-secondary/80"
              }`}
            >
              {isUploading ? (
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              ) : isRecording ? (
                <MicOff className="h-7 w-7 text-primary" />
              ) : (
                <Mic className="h-7 w-7 text-primary" />
              )}
            </motion.button>

            <p className="font-heading text-4xl font-bold text-foreground text-center tabular-nums">
              {minutes.toString().padStart(2, "0")}:{seconds.toString().padStart(2, "0")}
            </p>
          </div>
        </motion.div>

        {/* Stop / Start Button */}
        <button
          onClick={isRecording ? handleStop : handleStart}
          disabled={isUploading}
          className={`w-full py-4 rounded-2xl font-heading font-semibold text-base transition-all ${
            isRecording
              ? "bg-gradient-cta text-primary-foreground shadow-glow"
              : isUploading
              ? "bg-muted text-muted-foreground"
              : "bg-gradient-primary text-primary-foreground shadow-glow"
          }`}
        >
          {isUploading ? "Uploading..." : isRecording ? "Stop Recording" : "Start Recording"}
        </button>

        {/* Upload Status */}
        {isUploading && (
          <div className="flex items-center gap-2 mt-3">
            <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />
            <span className="text-sm text-accent font-medium">Uploading to backend...</span>
          </div>
        )}

        {uploadError && (
          <p className="text-sm text-red-400 mt-3">{uploadError}</p>
        )}
      </div>

      {/* Tips Card */}
      <AnimatePresence>
        {!isRecording && !isUploading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-2xl bg-gradient-card border border-border p-4 mt-4 flex items-start gap-3"
          >
            <div className="h-9 w-9 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Lightbulb className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Tips for better accuracy</p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Keep a consistent distance of 15cm from the microphone and avoid rooms with significant echo.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Transcript */}
      <AnimatePresence>
        {(transcript || interimTranscript) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-2xl bg-gradient-card border border-border p-4 mt-3"
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
        <button
          onClick={handleReset}
          className="flex items-center justify-center gap-2 mt-3 text-xs text-muted-foreground"
        >
          <RotateCcw className="h-3 w-3" /> Reset
        </button>
      )}
    </div>
  );
};

export default RecordScreen;
