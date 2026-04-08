import { useState, useRef, useCallback } from "react";

interface UseSpeechRecognitionReturn {
  isRecording: boolean;
  transcript: string;
  interimTranscript: string;
  timeLeft: number;
  startRecording: () => void;
  stopRecording: () => void;
  resetTranscript: () => void;
}

export function useSpeechRecognition(durationSeconds = 30): UseSpeechRecognitionReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [timeLeft, setTimeLeft] = useState(durationSeconds);

  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const fullTranscriptRef = useRef("");

  const stopRecording = useCallback(() => {
    setIsRecording(false);
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setInterimTranscript("");
  }, []);

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
    setTimeLeft(durationSeconds);

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

    let t = durationSeconds;
    timerRef.current = setInterval(() => {
      t -= 1;
      setTimeLeft(t);
      if (t <= 0) {
        stopRecording();
      }
    }, 1000);
  }, [durationSeconds, stopRecording]);

  const resetTranscript = useCallback(() => {
    fullTranscriptRef.current = "";
    setTranscript("");
    setInterimTranscript("");
    setTimeLeft(durationSeconds);
  }, [durationSeconds]);

  return { isRecording, transcript, interimTranscript, timeLeft, startRecording, stopRecording, resetTranscript };
}
