import { useState, useCallback, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import BottomNav, { Tab } from "@/components/BottomNav";
import HomeScreen from "@/components/HomeScreen";
import RecordScreen from "@/components/RecordScreen";
import DashboardScreen from "@/components/DashboardScreen";
import ProfileScreen from "@/components/ProfileScreen";
import OnboardingScreen from "@/components/OnboardingScreen";
import Auth from "@/pages/Auth";
import { useAuth } from "@/hooks/useAuth";
import { getStoredUserId, setStoredUserId, checkHealth, getDashboard, DashboardResponse } from "@/services/cognivaraApi";
import { Loader2 } from "lucide-react";

const Index = () => {
  const { user, loading, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [sessionCount, setSessionCount] = useState(0);
  const [cognivaraUserId, setCognivaraUserId] = useState<string | null>(null);
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [backendReady, setBackendReady] = useState(false);
  const [checkingBackend, setCheckingBackend] = useState(true);

  // Check backend health + restore stored user_id on mount
  useEffect(() => {
    const init = async () => {
      try {
        await checkHealth();
        setBackendReady(true);
      } catch {
        console.warn("Backend health check failed, continuing anyway");
        setBackendReady(true); // don't block the app
      }
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

  const handleSessionUploaded = useCallback(async () => {
    const newCount = sessionCount + 1;
    setSessionCount(newCount);

    // After 3 sessions, fetch dashboard
    if (newCount >= 3 && cognivaraUserId) {
      try {
        const data = await getDashboard(cognivaraUserId);
        setDashboard(data);
        setActiveTab("insights");
      } catch (err) {
        console.error("Failed to fetch dashboard:", err);
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

  // Show onboarding if no cognivara user_id
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
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.15 }}
        >
          {activeTab === "home" && (
            <HomeScreen
              onStartRecording={handleStartRecording}
              dashboard={dashboard}
              sessionCount={sessionCount}
            />
          )}
          {activeTab === "record" && (
            <RecordScreen
              userId={cognivaraUserId}
              sessionCount={sessionCount}
              onSessionUploaded={handleSessionUploaded}
            />
          )}
          {activeTab === "insights" && (
            <DashboardScreen
              dashboard={dashboard}
              userId={cognivaraUserId}
              onRefresh={handleRefreshDashboard}
            />
          )}
          {activeTab === "profile" && <ProfileScreen onSignOut={signOut} />}
        </motion.div>
      </AnimatePresence>
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default Index;
