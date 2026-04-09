import { useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import BottomNav, { Tab } from "@/components/BottomNav";
import HomeScreen from "@/components/HomeScreen";
import RecordScreen from "@/components/RecordScreen";
import DashboardScreen from "@/components/DashboardScreen";
import HistoryScreen from "@/components/HistoryScreen";
import ProfileScreen from "@/components/ProfileScreen";
import Auth from "@/pages/Auth";
import { useAuth } from "@/hooks/useAuth";
import { RecordingSession } from "@/services/cognivaraApi";
import { Loader2 } from "lucide-react";

const Index = () => {
  const { user, loading, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [sessions, setSessions] = useState<RecordingSession[]>([]);

  const handleSessionComplete = useCallback((session: RecordingSession) => {
    setSessions((prev) => [...prev, session]);
  }, []);

  const handleStartRecording = () => setActiveTab("record");

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto relative">
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.15 }}
        >
          {activeTab === "home" && <HomeScreen onStartRecording={handleStartRecording} />}
          {activeTab === "record" && <RecordScreen onSessionComplete={handleSessionComplete} />}
          {activeTab === "dashboard" && <DashboardScreen sessions={sessions} />}
          {activeTab === "history" && <HistoryScreen />}
          {activeTab === "profile" && <ProfileScreen onSignOut={signOut} />}
        </motion.div>
      </AnimatePresence>
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default Index;
