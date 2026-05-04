import { useState, useCallback, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import AppSidebar, { NavSection } from "@/components/AppSidebar";
import TopBar from "@/components/TopBar";
import { SidebarProvider } from "@/components/ui/sidebar";
import HomeScreen from "@/components/HomeScreen";
import RecordScreen from "@/components/RecordScreen";
import DashboardScreen, { LatestUploadData } from "@/components/DashboardScreen";
import ProfileScreen from "@/components/ProfileScreen";
import HistoryScreen from "@/components/HistoryScreen";
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
  const [activeSection, setActiveSection] = useState<NavSection>("overview");
  const [topTab, setTopTab] = useState<"dashboard" | "analytics" | "patients">("dashboard");
  const [sessionCount, setSessionCount] = useState(0);
  const [cognivaraUserId, setCognivaraUserId] = useState<string | null>(null);
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [latestUpload, setLatestUpload] = useState<LatestUploadData | null>(null);
  const [checkingBackend, setCheckingBackend] = useState(true);
  const [showProfile, setShowProfile] = useState(false);

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

    if (result.baseline_ready && cognivaraUserId) {
      try {
        const data = await getDashboard(cognivaraUserId);
        setDashboard(data);
        setActiveSection("reports");
      } catch (err) {
        console.error("Failed to fetch dashboard:", err);
        setActiveSection("reports");
      }
    }
  }, [sessionCount, cognivaraUserId]);

  const handleStartRecording = () => {
    setActiveSection("voiceLabs");
    setShowProfile(false);
  };

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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-full max-w-md">
          <OnboardingScreen onComplete={handleOnboardingComplete} />
        </div>
      </div>
    );
  }

  const renderContent = () => {
    if (showProfile) {
      return <ProfileScreen onSignOut={signOut} />;
    }
    switch (activeSection) {
      case "overview":
        return <HomeScreen onStartRecording={handleStartRecording} dashboard={dashboard} latestUpload={latestUpload} sessionCount={sessionCount} />;
      case "voiceLabs":
        return <RecordScreen userId={cognivaraUserId} sessionCount={sessionCount} onSessionUploaded={handleSessionUploaded} />;
      case "reports":
        return <DashboardScreen dashboard={dashboard} latestUpload={latestUpload} onRefresh={handleRefreshDashboard} />;
      case "history":
        return <HistoryScreen userId={cognivaraUserId} />;
      case "patients":
        return (
          <div className="p-6 flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <h2 className="font-heading text-xl font-bold text-foreground mb-2">Patient Data</h2>
              <p className="text-sm text-muted-foreground">Coming soon — multi-patient management.</p>
            </div>
          </div>
        );
      case "health":
        return (
          <div className="p-6 flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <h2 className="font-heading text-xl font-bold text-foreground mb-2">System Health</h2>
              <p className="text-sm text-muted-foreground">Backend status monitoring coming soon.</p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-background flex w-full">
        <AppSidebar
          activeSection={activeSection}
          onSectionChange={(s) => { setActiveSection(s); setShowProfile(false); }}
          onNewRecording={handleStartRecording}
          onAccountClick={() => setShowProfile(true)}
        />
        <div className="flex-1 flex flex-col min-h-screen min-w-0">
          <TopBar
            activeTab={topTab}
            onTabChange={setTopTab}
            onSync={handleRefreshDashboard}
          />
          <main className="flex-1 overflow-y-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={showProfile ? "profile" : activeSection}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
              >
                {renderContent()}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Index;
