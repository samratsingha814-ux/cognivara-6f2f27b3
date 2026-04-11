import { useState, useCallback, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import BottomNav, { Tab } from "@/components/BottomNav";
import HomeScreen from "@/components/HomeScreen";
import RecordScreen from "@/components/RecordScreen";
import DashboardScreen, { LatestUploadData } from "@/components/DashboardScreen";
import ProfileScreen from "@/components/ProfileScreen";
import OnboardingScreen from "@/components/OnboardingScreen";
import Auth from "@/pages/Auth";
import { useAuth } from "@/hooks/useAuth";
import {
  getStoredUserId, setStoredUserId, checkHealth,
  getDashboard, DashboardResponse, UploadResponse,
} from "@/services/cognivaraApi";
import { Loader2 } from "lucide-react";

const Index = () => {
  const { user, loading, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [sessionCount, setSessionCount] = useState(0);
  const [cognivaraUserId, setCognivaraUserId] = useState<string | null>(null);
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [latestUpload, setLatestUpload] = useState<LatestUploadData | null>(null);
  const [checkingBackend, setCheckingBackend] = useState(true);

  useEffect(() => {
    const init = async () => {
      try { await checkHealth(); } catch { console.warn("Backend health check failed"); }
      const stored = getStoredUserId();
      if (stored) setCognivaraUserId(stored);
      setCheckingBackend(false);
    };
    init();
  }, []);

  const handleOnboardingComplete = useCallback((userId: string) => {
    setStoredUserId(userId);
    setCognivaraUserId(userId);
  }, []);

  const handleSessionUploaded = useCallback(async (result: UploadResponse) => {
    const newCount = result.user_total_sessions ?? sessionCount + 1;
    setSessionCount(newCount);

    // Store latest upload features for dashboard cards
    const mergedFeatures = {
      ...(result.acoustic_features || {}),
      ...(result.temporal_features || {}),
      ...(result.linguistic_features || {}),
    };
    setLatestUpload({
      csi: result.csi,
      drift: result.drift,
      features: mergedFeatures,
    });

    // After baseline (3 sessions), auto-fetch dashboard
    if (result.baseline_ready && cognivaraUserId) {
      try {
        const data = await getDashboard(cognivaraUserId);
        setDashboard(data);
        setActiveTab("insights");
      } catch (err) {
        console.error("Failed to fetch dashboard:", err);
        // Still go to insights — we have upload data
        setActiveTab("insights");
      }
    }
  }, [sessionCount, cognivaraUserId]);

  const handleStartRecording = () => setActiveTab("record");

  const handleRefreshDashboard = useCallback(async () => {
    if (!cognivaraUserId) return;
    try {
      const data = await getDashboard(cognivaraUserId);
      setDashboard(data);
    } catch (err) {
      console.error("Failed to refresh dashboard:", err);
    }
  }, [cognivaraUserId]);

  if (loading || checkingBackend) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Auth />;

  if (!cognivaraUserId) {
    return (
      <div className="min-h-screen bg-background max-w-lg mx-auto relative">
        <OnboardingScreen onComplete={handleOnboardingComplete} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto relative">
      <AnimatePresence mode="wait">
        <motion.div key={activeTab}
          initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.15 }}
        >
          {activeTab === "home" && (
            <HomeScreen onStartRecording={handleStartRecording} dashboard={dashboard} sessionCount={sessionCount} />
          )}
          {activeTab === "record" && (
            <RecordScreen userId={cognivaraUserId} sessionCount={sessionCount} onSessionUploaded={handleSessionUploaded} />
          )}
          {activeTab === "insights" && (
            <DashboardScreen dashboard={dashboard} latestUpload={latestUpload} onRefresh={handleRefreshDashboard} />
          )}
          {activeTab === "profile" && <ProfileScreen onSignOut={signOut} />}
        </motion.div>
      </AnimatePresence>
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default Index;
