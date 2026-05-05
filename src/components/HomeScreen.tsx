import { motion } from "framer-motion";
import { Sparkles, Activity, Zap, Shield, Users, ArrowRight } from "lucide-react";
import { DashboardResponse, getCsiScore, getRiskLevel } from "@/services/cognivaraApi";
import type { LatestUploadData } from "@/components/DashboardScreen";

interface HomeScreenProps {
  onStartRecording: () => void;
  dashboard: DashboardResponse | null;
  latestUpload?: LatestUploadData | null;
  sessionCount: number;
  recordingsCompleted: number;
}

const DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

const HomeScreen = ({ onStartRecording, dashboard, latestUpload, sessionCount, recordingsCompleted }: HomeScreenProps) => {
  const baselineReady = recordingsCompleted >= 3;
  const csiRaw = baselineReady ? (latestUpload?.csi ?? getCsiScore(dashboard?.latest_csi)) : null;
  const cognitiveScore = csiRaw != null ? Math.round(csiRaw) : 0;
  const hasData = baselineReady && csiRaw != null;
  const weeklyData = dashboard?.trends?.map((t) => t.csi) || [];
  const circumference = 2 * Math.PI * 70;
  const offset = circumference - (cognitiveScore / 100) * circumference;
  const riskScore = hasData ? cognitiveScore : 0;
  const stabilityScore = hasData ? 100 - cognitiveScore : 0;
  const scoreLabel = cognitiveScore <= 30 ? "STABLE" : cognitiveScore <= 60 ? "MODERATE" : "AT RISK";
  const sessionsRemaining = Math.max(0, 3 - recordingsCompleted);
  const riskLevel = getRiskLevel(latestUpload?.csi ?? null, dashboard?.latest_risk_level);

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-foreground">System Diagnostic</h1>
        <div className="flex items-center gap-2 mt-1">
          <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />
          <span className="text-xs text-muted-foreground">
            Neural Link Active — Processing biological telemetry
          </span>
        </div>
      </div>

      {/* Top Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 mb-6">
        {/* Morning Baseline / CSI Score Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-gradient-card border border-border p-6 shadow-card"
        >
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-medium mb-1">
            Cognitive Stress Index
          </p>
          <p className="text-[10px] text-muted-foreground mb-4">Lower = more stable</p>

          {hasData ? (
            <div className="flex flex-col items-center">
              <div className="relative mb-4">
                <svg width="180" height="180" viewBox="0 0 180 180" className="score-ring">
                  <circle cx="90" cy="90" r="70" fill="none" stroke="hsl(222, 18%, 16%)" strokeWidth="10" />
                  <circle
                    cx="90" cy="90" r="70" fill="none"
                    stroke="url(#scoreGradientHome)" strokeWidth="10" strokeLinecap="round"
                    strokeDasharray={circumference} strokeDashoffset={offset}
                    transform="rotate(-90 90 90)" className="transition-all duration-1000"
                  />
                  <defs>
                    <linearGradient id="scoreGradientHome" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="hsl(190, 80%, 50%)" />
                      <stop offset="100%" stopColor="hsl(190, 80%, 70%)" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-heading text-5xl font-bold text-foreground">{cognitiveScore}</span>
                  <span className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-medium">
                    {scoreLabel}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-8 mt-2">
                <div className="text-center">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Stress</p>
                  <p className="font-heading text-lg font-bold text-foreground">{riskScore}/100</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Stability</p>
                  <p className="font-heading text-lg font-bold text-foreground">{stabilityScore}/100</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-10 text-center">
              <p className="text-sm text-muted-foreground">
                Complete {sessionsRemaining} more recording{sessionsRemaining !== 1 ? "s" : ""} to unlock analysis.
              </p>
              <p className="text-xs text-muted-foreground mt-2">{recordingsCompleted}/3 sessions recorded</p>
            </div>
          )}
        </motion.div>

        {/* Start Voice Analysis Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl bg-card border border-border p-6 shadow-card flex flex-col justify-between"
        >
          <div>
            <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center mb-4">
              <Activity className="h-5 w-5 text-primary" />
            </div>
            <h2 className="font-heading text-2xl font-bold text-foreground mb-2">Start Voice Analysis</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Calibrate clinical markers through real-time acoustic phenotyping. Capture linguistic nuances to detect subtle neuro-cognitive shifts.
            </p>
          </div>
          <div className="flex items-center justify-between mt-6">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-gradient-primary flex items-center justify-center">
                <Users className="h-3.5 w-3.5 text-primary-foreground" />
              </div>
              <span className="text-xs text-muted-foreground font-medium">+{sessionCount}</span>
            </div>
            <button
              onClick={onStartRecording}
              className="flex items-center gap-2 bg-card border border-border px-5 py-2.5 rounded-xl font-heading font-semibold text-sm text-foreground hover:bg-secondary transition-colors"
            >
              Initialize Labs
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
        {/* Performance Trends */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 rounded-2xl bg-gradient-card border border-border p-5 shadow-card"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-heading text-base font-bold text-foreground">Performance Trends</h3>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">
                Rolling 7-Day Cognitive Variance
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] px-2.5 py-1 rounded bg-secondary text-foreground font-semibold">INDEX</span>
              <span className="text-[10px] px-2.5 py-1 rounded text-muted-foreground font-semibold">VELOCITY</span>
            </div>
          </div>
          <div className="flex items-end justify-between gap-3 h-32">
            {DAYS.map((day, i) => {
              const val = weeklyData[i] ?? 0;
              const isHighlighted = i === Math.min(weeklyData.length, 7) - 1;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex justify-center">
                    <div
                      className={`w-8 rounded-t-md transition-all ${isHighlighted ? "bg-primary" : "bg-secondary"}`}
                      style={{ height: `${Math.max(4, (val / 100) * 100)}px` }}
                    />
                  </div>
                  <span className={`text-[10px] font-semibold ${isHighlighted ? "text-foreground" : "text-muted-foreground"}`}>
                    {day}
                  </span>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Right Column Stats */}
        <div className="space-y-5">
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-2xl bg-gradient-card border border-border p-5 shadow-card"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] uppercase tracking-wider text-accent font-semibold">Neural Latency</p>
              <Zap className="h-4 w-4 text-accent" />
            </div>
            <p className="font-heading text-2xl font-bold text-foreground">24.2 <span className="text-sm text-muted-foreground font-normal">ms</span></p>
            <div className="flex gap-1 mt-3">
              {[60, 70, 80, 65, 90].map((v, i) => (
                <div key={i} className="flex-1 h-2 rounded-full" style={{ backgroundColor: `hsl(160, 60%, ${30 + v * 0.3}%)` }} />
              ))}
            </div>
            <p className="text-[10px] text-accent mt-2">↘ 12% BELOW MEDIAN</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="rounded-2xl bg-gradient-card border border-border p-5 shadow-card"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] uppercase tracking-wider text-primary font-semibold">Cognitive Focus</p>
              <Shield className="h-4 w-4 text-primary" />
            </div>
            <p className="font-heading text-2xl font-bold text-foreground">High</p>
            <div className="h-1.5 rounded-full bg-muted mt-3 overflow-hidden">
              <div className="h-full rounded-full bg-primary" style={{ width: "82%" }} />
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-[10px] text-muted-foreground">Attention Persistence</span>
              <span className="text-[10px] text-primary font-semibold">82%</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-8 pt-4 border-t border-border">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-1.5">
            <div className="h-1.5 w-1.5 rounded-full bg-accent" />
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Local Compute</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Encrypted Link</span>
          </div>
        </div>
        <span className="text-[10px] text-muted-foreground">
          LAST SYNC: {new Date().toLocaleTimeString()} GMT-7
        </span>
      </div>
    </div>
  );
};

export default HomeScreen;
