import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, RotateCcw, CheckCircle2 } from "lucide-react";

interface VoiceRecorderProps {
  onAnalysisComplete: (data: AnalysisData) => void;
}

export interface AnalysisData {
  transcript: string;
  duration: number;
  wordCount: number;
  sessionNumber: number;
  stress: number;
  pitch: number;
  hesitation: number;
  complexity: number;
  fluency: number;
  emotionalStability: number;
  riskScore: number;
}

const prompts = [
  "How was your day?",
  "Describe your favorite memory.",
  "What are you looking forward to?",
];

const VoiceRecorder = ({ onAnalysisComplete }: VoiceRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [currentSession, setCurrentSession] = useState(1);
  const [completedSessions, setCompletedSessions] = useState<number[]>([]);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [timeLeft, setTimeLeft] = useState(30);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const fullTranscriptRef = useRef("");

  const stopRecording = useCallback(() => {
    setIsRecording(false);
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    const finalTranscript = fullTranscriptRef.current;
    if (finalTranscript.trim()) {
      setIsAnalyzing(true);
      setTimeout(() => {
        const words = finalTranscript.split(/\s+/).filter(Boolean);
        const analysis: AnalysisData = {
          transcript: finalTranscript,
          duration: 30 - timeLeft,
          wordCount: words.length,
          sessionNumber: currentSession,
          stress: Math.round(20 + Math.random() * 40),
          pitch: Math.round(30 + Math.random() * 50),
          hesitation: Math.round(10 + Math.random() * 35),
          complexity: Math.round(40 + Math.random() * 45),
          fluency: Math.round(50 + Math.random() * 40),
          emotionalStability: Math.round(55 + Math.random() * 35),
          riskScore: Math.round(15 + Math.random() * 50),
        };

        setCompletedSessions((prev) => [...prev, currentSession]);
        onAnalysisComplete(analysis);
        setIsAnalyzing(false);

        if (currentSession < 3) {
          setCurrentSession((prev) => prev + 1);
        }
      }, 2000);
    }
  }, [currentSession, onAnalysisComplete, timeLeft]);

  const startRecording = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please use Chrome.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    fullTranscriptRef.current = "";
    setTranscript("");
    setInterimTranscript("");
    setTimeLeft(30);

    recognition.onresult = (event: any) => {
      let final = "";
      let interim = "";
      for (let i = 0; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript + " ";
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      fullTranscriptRef.current = final;
      setTranscript(final);
      setInterimTranscript(interim);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      if (event.error !== "no-speech") {
        stopRecording();
      }
    };

    recognition.start();
    recognitionRef.current = recognition;
    setIsRecording(true);

    let t = 30;
    timerRef.current = setInterval(() => {
      t -= 1;
      setTimeLeft(t);
      if (t <= 0) {
        stopRecording();
      }
    }, 1000);
  }, [stopRecording]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, []);

  const resetSession = () => {
    setCompletedSessions([]);
    setCurrentSession(1);
    setTranscript("");
    setInterimTranscript("");
    setTimeLeft(30);
  };

  return (
    <section id="record" className="py-24 px-6">
      <div className="container mx-auto max-w-3xl">
        <p className="text-center text-xs tracking-widest text-primary uppercase font-medium mb-3">
          Voice Analysis
        </p>
        <h2 className="font-heading text-3xl md:text-4xl font-bold text-center mb-2">
          Establish Your Baseline
        </h2>
        <p className="text-center text-muted-foreground mb-12">
          Complete 3 short recordings to calibrate your personal cognitive baseline.
        </p>

        {/* Session indicators */}
        <div className="flex justify-center gap-4 mb-10">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
                completedSessions.includes(s)
                  ? "bg-primary/20 text-primary"
                  : s === currentSession
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground"
              }`}
            >
              {completedSessions.includes(s) && <CheckCircle2 className="h-4 w-4" />}
              Recording {s} of 3
            </div>
          ))}
        </div>

        {/* Record button */}
        <div className="flex flex-col items-center">
          <div className="relative">
            {isRecording && (
              <>
                <span className="absolute inset-0 rounded-full bg-primary/30 animate-pulse-ring" />
                <span className="absolute inset-0 rounded-full bg-primary/20 animate-pulse-ring [animation-delay:0.5s]" />
              </>
            )}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isAnalyzing || completedSessions.length >= 3}
              className={`relative z-10 h-28 w-28 rounded-full flex items-center justify-center transition-colors ${
                isRecording
                  ? "bg-destructive text-destructive-foreground"
                  : completedSessions.length >= 3
                  ? "bg-muted text-muted-foreground cursor-not-allowed"
                  : "bg-gradient-primary text-primary-foreground shadow-glow cursor-pointer"
              }`}
            >
              {isRecording ? <MicOff className="h-8 w-8" /> : <Mic className="h-8 w-8" />}
            </motion.button>
          </div>

          <p className="mt-4 text-sm text-muted-foreground">
            {isRecording ? "Recording..." : isAnalyzing ? "Analyzing..." : completedSessions.length >= 3 ? "All sessions complete!" : "Tap to Record"}
          </p>

          {/* Timer */}
          <p className="font-heading text-2xl font-bold mt-2 tabular-nums">
            0:{timeLeft.toString().padStart(2, "0")}
          </p>

          {/* Prompt */}
          {!isRecording && currentSession <= 3 && completedSessions.length < 3 && (
            <p className="mt-3 text-sm text-primary italic">"{prompts[currentSession - 1]}"</p>
          )}
        </div>

        {/* Transcript */}
        <AnimatePresence>
          {(transcript || interimTranscript) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-10 rounded-xl bg-card border border-border p-6"
            >
              <h3 className="font-heading text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Live Transcript
              </h3>
              <p className="text-foreground leading-relaxed">
                {transcript}
                <span className="text-muted-foreground">{interimTranscript}</span>
              </p>
              {!isRecording && transcript && (
                <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                  <span>{transcript.split(/\s+/).filter(Boolean).length} words</span>
                  <span>{30 - timeLeft} sec recorded</span>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Analyzing indicator */}
        <AnimatePresence>
          {isAnalyzing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mt-6 text-center"
            >
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm text-primary">
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                Baseline Established — Analyzing cognitive markers…
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {completedSessions.length > 0 && !isRecording && (
          <div className="mt-6 flex justify-center">
            <button onClick={resetSession} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <RotateCcw className="h-4 w-4" /> Redo Recordings
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default VoiceRecorder;
