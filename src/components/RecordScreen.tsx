import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, RotateCcw, CheckCircle2, Loader2 } from "lucide-react";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { submitRecording, RecordingSession } from "@/services/cognivaraApi";

interface RecordScreenProps {
  onSessionComplete: (session: RecordingSession) => void;
}

const prompts = [
  "How was your day?",
  "Describe your favorite memory.",
  "What are you looking forward to?",
];

const RecordScreen = ({ onSessionComplete }: RecordScreenProps) => {
  const { isRecording, transcript, interimTranscript, timeLeft, startRecording, stopRecording, resetTranscript } =
    useSpeechRecognition(30);
  const [currentSession, setCurrentSession] = useState(1);
  const [completedSessions, setCompletedSessions] = useState<number[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleStop = useCallback(async () => {
    stopRecording();
    if (!transcript.trim()) return;

    setIsAnalyzing(true);
    try {
      const session = await submitRecording(new Blob(), transcript);
      setCompletedSessions((prev) => [...prev, currentSession]);
      onSessionComplete(session);
      if (currentSession < 3) {
        setCurrentSession((prev) => prev + 1);
        resetTranscript();
      }
    } finally {
      setIsAnalyzing(false);
    }
  }, [stopRecording, transcript, currentSession, onSessionComplete, resetTranscript]);

  const handleReset = () => {
    setCompletedSessions([]);
    setCurrentSession(1);
    resetTranscript();
  };

  const allDone = completedSessions.length >= 3;

  return (
    <div className="px-5 pt-14 pb-24 flex flex-col min-h-screen">
      <h1 className="font-heading text-2xl font-bold mb-1">Voice Recording</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Complete 3 recordings to establish your baseline.
      </p>

      {/* Session pills */}
      <div className="flex gap-2 mb-8">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
              completedSessions.includes(s)
                ? "bg-primary/20 text-primary"
                : s === currentSession
                ? "bg-secondary text-foreground"
                : "text-muted-foreground bg-muted"
            }`}
          >
            {completedSessions.includes(s) && <CheckCircle2 className="h-3 w-3" />}
            {s}/3
          </div>
        ))}
      </div>

      {/* Record button area */}
      <div className="flex-1 flex flex-col items-center justify-center">
        {!allDone && !isAnalyzing && (
          <p className="text-sm text-primary italic mb-6 text-center">
            "{prompts[(currentSession - 1) % prompts.length]}"
          </p>
        )}

        <div className="relative mb-4">
          {isRecording && (
            <>
              <span className="absolute inset-0 rounded-full bg-primary/30 animate-pulse-ring" />
              <span className="absolute inset-0 rounded-full bg-primary/20 animate-pulse-ring [animation-delay:0.5s]" />
            </>
          )}
          <motion.button
            whileTap={{ scale: 0.93 }}
            onClick={isRecording ? handleStop : startRecording}
            disabled={isAnalyzing || allDone}
            className={`relative z-10 h-24 w-24 rounded-full flex items-center justify-center transition-all ${
              isRecording
                ? "bg-destructive text-destructive-foreground"
                : allDone
                ? "bg-muted text-muted-foreground"
                : "bg-gradient-primary text-primary-foreground shadow-glow"
            }`}
          >
            {isAnalyzing ? (
              <Loader2 className="h-8 w-8 animate-spin" />
            ) : isRecording ? (
              <MicOff className="h-7 w-7" />
            ) : (
              <Mic className="h-7 w-7" />
            )}
          </motion.button>
        </div>

        <p className="font-heading text-3xl font-bold tabular-nums mb-1">
          0:{timeLeft.toString().padStart(2, "0")}
        </p>
        <p className="text-xs text-muted-foreground">
          {isRecording ? "Recording... tap to stop" : isAnalyzing ? "Analyzing speech..." : allDone ? "All sessions complete!" : "Tap to record"}
        </p>
      </div>

      {/* Transcript */}
      <AnimatePresence>
        {(transcript || interimTranscript) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-xl bg-card border border-border p-4 mt-4"
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

      {completedSessions.length > 0 && !isRecording && !isAnalyzing && (
        <button onClick={handleReset} className="flex items-center justify-center gap-2 mt-4 text-xs text-muted-foreground">
          <RotateCcw className="h-3 w-3" /> Redo Recordings
        </button>
      )}
    </div>
  );
};

export default RecordScreen;
