import { useState, useCallback } from "react";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import VoiceRecorder from "@/components/VoiceRecorder";
import CognitiveAssessment from "@/components/CognitiveAssessment";
import CompareAnalysis from "@/components/CompareAnalysis";
import { AnalysisData } from "@/components/VoiceRecorder";

const Index = () => {
  const [activeSection, setActiveSection] = useState("home");
  const [sessions, setSessions] = useState<AnalysisData[]>([]);

  const handleNavigate = (section: string) => {
    setActiveSection(section);
    const el = document.getElementById(section === "home" ? "hero" : section);
    el?.scrollIntoView({ behavior: "smooth" });
  };

  const handleStartRecording = () => {
    const el = document.getElementById("record");
    el?.scrollIntoView({ behavior: "smooth" });
  };

  const handleAnalysisComplete = useCallback((data: AnalysisData) => {
    setSessions((prev) => [...prev, data]);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar activeSection={activeSection} onNavigate={handleNavigate} />
      <div id="hero">
        <HeroSection onStartRecording={handleStartRecording} />
      </div>
      <VoiceRecorder onAnalysisComplete={handleAnalysisComplete} />
      <CognitiveAssessment sessions={sessions} />
      <CompareAnalysis sessions={sessions} />
    </div>
  );
};

export default Index;
