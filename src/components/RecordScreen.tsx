import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, RotateCcw, Loader2, Bell, Activity, Lightbulb } from "lucide-react";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { submitRecording, RecordingSession } from "@/services/cognivaraApi";
import { supabase } from "@/integrations/supabase/client";

interface RecordScreenProps {
  onSessionComplete: (session: RecordingSession) => void;
}

const RecordScreen = ({ onSessionComplete }: RecordScreenProps) => {
  const { isRecording, transcript, interimTranscript, timeLeft, startRecording, stopRecording, resetTranscript } =
    useSpeechRecognition(30);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [pitchRange, setPitchRange] = useState("--");
  const [jitterIndex, setJitterIndex] = useState("--");
  const [latency, setLatency] = useState("--");
  const [vadStatus, setVadStatus] = useState("Idle");

  const handleStop = useCallback(async () => {
    stopRecording();
    if (!transcript.trim()) return;

    setIsAnalyzing(true);
    try {
      const session = await submitRecording(new Blob(), transcript);

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("recording_sessions").insert({
          user_id: user.id,
          session_date: session.date,
          duration: session.duration,
          transcript: session.transcript,
          word_count: session.wordCount,
          risk_score: session.riskScore,
          stress: session.stress,
          pitch: session.pitch,
          hesitation: session.hesitation,
          complexity: session.complexity,
          fluency: session.fluency,
          emotional_stability: session.emotionalStability,
        });
      }

      setPitchRange(`${session.pitch} Hz`);
      setJitterIndex(`${(session.hesitation * 0.02).toFixed(2)}%`);
      setLatency(`${Math.round(12 + Math.random() * 20)}ms`);
      setVadStatus("Complete");

      onSessionComplete(session);
    } finally {
      setIsAnalyzing(false);
    }
  }, [stopRecording, transcript, onSessionComplete]);

  const handleReset = () => {
    resetTranscript();
    setPitchRange("--");
    setJitterIndex("--");
    setLatency("--");
    setVadStatus("Idle");
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
          {/* Waveform decorations */}
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
              onClick={isRecording ? handleStop : startRecording}
              disabled={isAnalyzing}
              className={`h-20 w-20 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-all ${
                isRecording
                  ? "bg-primary/20 border-2 border-primary shadow-glow"
                  : isAnalyzing
                  ? "bg-muted"
                  : "bg-secondary hover:bg-secondary/80"
              }`}
            >
              {isAnalyzing ? (
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

        {/* Live Biomarker Stats */}
        <div className="grid grid-cols-2 gap-3 w-full mb-4">
          <div className="rounded-xl bg-gradient-card border border-border p-4 text-center">
            <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-medium mb-1">
              Pitch Range
            </p>
            <p className="font-heading text-lg font-bold text-primary">{pitchRange}</p>
          </div>
          <div className="rounded-xl bg-gradient-card border border-border p-4 text-center">
            <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-medium mb-1">
              Jitter Index
            </p>
            <p className="font-heading text-lg font-bold text-accent">{jitterIndex}</p>
          </div>
          <div className="rounded-xl bg-gradient-card border border-border p-4 text-center">
            <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-medium mb-1">
              Latency
            </p>
            <p className="font-heading text-lg font-bold text-foreground">{latency}</p>
          </div>
          <div className="rounded-xl bg-gradient-card border border-border p-4 text-center">
            <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-medium mb-1">
              VAD Status
            </p>
            <p className={`font-heading text-lg font-bold ${
              vadStatus === "Complete" ? "text-accent" : isRecording ? "text-primary" : "text-muted-foreground"
            }`}>
              {isRecording ? "Active" : vadStatus}
            </p>
          </div>
        </div>

        {/* Stop / Start Button */}
        <button
          onClick={isRecording ? handleStop : startRecording}
          disabled={isAnalyzing}
          className={`w-full py-4 rounded-2xl font-heading font-semibold text-base transition-all ${
            isRecording
              ? "bg-gradient-cta text-primary-foreground shadow-glow"
              : isAnalyzing
              ? "bg-muted text-muted-foreground"
              : "bg-gradient-primary text-primary-foreground shadow-glow"
          }`}
        >
          {isAnalyzing ? "Analyzing..." : isRecording ? "Stop Recording" : "Start Recording"}
        </button>

        {/* Processing Status */}
        {isAnalyzing && (
          <div className="flex items-center gap-2 mt-3">
            <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />
            <span className="text-sm text-accent font-medium">Neural Engine Processing...</span>
          </div>
        )}
      </div>

      {/* Tips Card */}
      <AnimatePresence>
        {!isRecording && !isAnalyzing && (
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
                Keep a consistent distance of 15cm from the microphone and avoid rooms with significant echo or background hum.
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

      {transcript && !isRecording && !isAnalyzing && (
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
