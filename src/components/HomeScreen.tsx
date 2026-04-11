import { motion } from "framer-motion";
import { Bell, Sparkles, Activity, Zap, Shield } from "lucide-react";
import { DashboardResponse } from "@/services/cognivaraApi";

interface HomeScreenProps {
  onStartRecording: () => void;
  dashboard: DashboardResponse | null;
  sessionCount: number;
}

const DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

const HomeScreen = ({ onStartRecording, dashboard, sessionCount }: HomeScreenProps) => {
  const cognitiveScore = dashboard?.latest_csi != null ? Math.round(dashboard.latest_csi) : 0;
  const hasData = dashboard != null;

  const weeklyData = dashboard?.trends?.map((t) => t.csi) || [0, 0, 0, 0, 0, 0, 0];

  const circumference = 2 * Math.PI * 70;
  const offset = circumference - (cognitiveScore / 100) * circumference;
  const scoreLabel = cognitiveScore >= 70 ? "OPTIMAL" : cognitiveScore >= 40 ? "MODERATE" : "LOW";

  const sessionsRemaining = Math.max(0, 3 - sessionCount);

  return (
    <div className="px-5 pt-12 pb-28">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <Activity className="h-4 w-4 text-primary" />
          </div>
          <span className="font-heading text-lg font-bold tracking-tight text-foreground">
            COGNIVARA
          </span>
        </div>
        <button className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center">
          <Bell className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      {/* Cognitive Score Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-gradient-card border border-border p-6 mb-6 shadow-card"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-medium">
              {hasData ? "Latest Analysis" : "Getting Started"}
            </p>
            <h2 className="font-heading text-xl font-bold text-foreground mt-1">Cognitive Score</h2>
          </div>
          <Sparkles className="h-5 w-5 text-accent" />
        </div>

        {hasData ? (
          <div className="flex justify-center py-4">
            <div className="relative">
              <svg width="180" height="180" viewBox="0 0 180 180" className="score-ring">
                <circle cx="90" cy="90" r="70" fill="none" stroke="hsl(222, 18%, 16%)" strokeWidth="10" />
                <circle
                  cx="90" cy="90" r="70" fill="none"
                  stroke="url(#scoreGradient)" strokeWidth="10" strokeLinecap="round"
                  strokeDasharray={circumference} strokeDashoffset={offset}
                  transform="rotate(-90 90 90)" className="transition-all duration-1000"
                />
                <defs>
                  <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="hsl(190, 80%, 50%)" />
                    <stop offset="100%" stopColor="hsl(210, 90%, 55%)" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-heading text-4xl font-bold text-foreground">{cognitiveScore}</span>
                <span className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-medium">
                  {scoreLabel}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center">
            <p className="text-sm text-muted-foreground">
              Complete {sessionsRemaining} more recording{sessionsRemaining !== 1 ? "s" : ""} to unlock your analysis.
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              {sessionCount}/3 sessions recorded
            </p>
          </div>
        )}
      </motion.div>

      {/* Quick Actions */}
      <h3 className="font-heading text-sm font-semibold text-foreground mb-3">Quick Actions</h3>
      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        onClick={onStartRecording}
        className="w-full rounded-2xl bg-gradient-cta p-5 mb-6 flex items-center gap-4 text-left shadow-glow"
      >
        <div className="h-12 w-12 rounded-xl bg-background/20 flex items-center justify-center flex-shrink-0">
          <Activity className="h-6 w-6 text-primary-foreground" />
        </div>
        <div>
          <h3 className="font-heading text-base font-bold text-primary-foreground uppercase tracking-wide">
            {sessionCount >= 3 ? "Record New Session" : `Record Session ${sessionCount + 1}`}
          </h3>
          <p className="text-xs text-primary-foreground/70 mt-0.5">
            {sessionCount >= 3
              ? "Add more data to improve accuracy"
              : `${sessionsRemaining} session${sessionsRemaining !== 1 ? "s" : ""} remaining for analysis`}
          </p>
        </div>
      </motion.button>

      {/* Performance Trends */}
      {hasData && (
        <>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-heading text-sm font-semibold text-foreground">Performance Trends</h3>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
              Last 7 Days
            </span>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl bg-gradient-card border border-border p-5 mb-5 shadow-card"
          >
            <div className="flex items-end justify-between gap-2 h-28">
              {weeklyData.slice(0, 7).map((val, i) => {
                const isToday = i === Math.min(weeklyData.length, 7) - 1;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2">
                    {isToday && (
                      <span className="text-[9px] bg-primary/20 text-primary px-1.5 py-0.5 rounded font-medium">
                        Today
                      </span>
                    )}
                    <div className="w-full flex justify-center">
                      <div
                        className={`w-5 rounded-t-md transition-all ${isToday ? "bg-gradient-primary" : "bg-secondary"}`}
                        style={{ height: `${(val / 100) * 80}px` }}
                      />
                    </div>
                    <span className="text-[9px] text-muted-foreground font-medium">{DAYS[i] || ""}</span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3">
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl bg-gradient-card border border-border p-4 shadow-card"
        >
          <div className="h-9 w-9 rounded-lg bg-primary/15 flex items-center justify-center mb-3">
            <Zap className="h-4 w-4 text-primary" />
          </div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Sessions</p>
          <p className="font-heading text-xl font-bold text-foreground">{sessionCount}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.35 }}
          className="rounded-2xl bg-gradient-card border border-border p-4 shadow-card"
        >
          <div className="h-9 w-9 rounded-lg bg-accent/15 flex items-center justify-center mb-3">
            <Shield className="h-4 w-4 text-accent" />
          </div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Status</p>
          <p className="font-heading text-xl font-bold text-accent">
            {sessionCount >= 3 ? "Ready" : "Calibrating"}
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default HomeScreen;
