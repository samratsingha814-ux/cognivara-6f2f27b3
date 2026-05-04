import { useState } from "react";
import { motion } from "framer-motion";
import { Mic, Activity as WaveIcon, TrendingDown, BookText, Brain, Heart, Activity, Loader2, RefreshCw } from "lucide-react";
import { DashboardResponse, getCsiScore, getRiskLevel, mapFeaturesToCards } from "@/services/cognivaraApi";

interface DashboardScreenProps {
  dashboard: DashboardResponse | null;
  latestUpload: LatestUploadData | null;
  recordingsCompleted: number;
  onRefresh: () => void;
}

export interface LatestUploadData {
  csi: number | null;
  riskLevel: string | null;
  drift: Record<string, unknown> | null;
  features: Record<string, number>;
}

const CARD_META = [
  { key: "stress", label: "Stress", subtitle: "Derived from CSI & drift", icon: Brain, color: "hsl(0, 70%, 55%)" },
  { key: "pitch", label: "Pitch", subtitle: "Mean vocal frequency", icon: WaveIcon, color: "hsl(190, 80%, 50%)" },
  { key: "hesitation", label: "Hesitation", subtitle: "Pauses & response latency", icon: Mic, color: "hsl(40, 80%, 55%)" },
  { key: "complexity", label: "Complexity", subtitle: "Syntax & vocabulary richness", icon: BookText, color: "hsl(260, 60%, 55%)" },
  { key: "fluency", label: "Fluency", subtitle: "Speech rate & rhythm", icon: Activity, color: "hsl(160, 60%, 45%)" },
  { key: "emotionalStability", label: "Emotional Stability", subtitle: "Overall stability index", icon: Heart, color: "hsl(210, 90%, 55%)" },
] as const;

const DashboardScreen = ({ dashboard, latestUpload, recordingsCompleted, onRefresh }: DashboardScreenProps) => {
  const [loading, setLoading] = useState(false);

  const handleRefresh = async () => {
    setLoading(true);
    await onRefresh();
    setLoading(false);
  };

  const baselineReady = recordingsCompleted >= 3;
  const features = latestUpload?.features || dashboard?.feature_summary || {};
  const csi = baselineReady ? (latestUpload?.csi ?? getCsiScore(dashboard?.latest_csi)) : null;
  const drift = baselineReady ? (latestUpload?.drift ?? null) : null;
  const riskLevel = baselineReady ? (latestUpload?.riskLevel ?? getRiskLevel(null, dashboard?.latest_risk_level)) : null;
  const cards = mapFeaturesToCards(features, csi, drift);
  const score = csi != null ? Math.round(csi) : 0;

  if (!baselineReady) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh]">
        <WaveIcon className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="font-heading text-xl font-bold mb-2">Calibration in Progress</h2>
        <p className="text-sm text-muted-foreground text-center mb-6">
          Complete 3 voice recordings before IM Voice Labs shows any results.
        </p>
        <div className="w-full max-w-sm mb-6">
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.min(100, (recordingsCompleted / 3) * 100)}%` }} />
          </div>
          <p className="text-xs text-center text-muted-foreground mt-2">{recordingsCompleted}/3 recordings complete</p>
        </div>
        <button onClick={handleRefresh} disabled={loading}
          className="flex items-center gap-2 py-3 px-6 rounded-xl bg-gradient-cta text-primary-foreground font-heading font-semibold text-sm"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-accent font-semibold mb-1">
            {dashboard.baseline_ready ? "Analysis Complete" : `Calibrating · ${dashboard.session_count}/3 sessions`}
          </p>
          <h1 className="font-heading text-3xl font-bold text-foreground">Neural Snapshot</h1>
        </div>
        <button onClick={handleRefresh} disabled={loading}
          className="h-9 w-9 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : <RefreshCw className="h-4 w-4 text-muted-foreground" />}
        </button>
      </div>

      {/* CSI Score + Flagged */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="rounded-2xl bg-gradient-card border border-border p-8 text-center shadow-card"
        >
          <span className="font-heading text-6xl font-bold text-foreground">{score}</span>
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-medium mt-2">CSI Score</p>
          {typeof riskLevel === "string" && (
            <p className={`text-xs font-semibold mt-2 uppercase tracking-wider ${
              riskLevel === "low" ? "text-accent"
              : riskLevel === "elevated" ? "text-destructive"
              : "text-yellow-400"
            }`}>
              Risk: {riskLevel}
            </p>
          )}
        </motion.div>

        {Array.isArray(dashboard.flagged_features) && dashboard.flagged_features.length > 0 && (
          <div className="rounded-2xl bg-destructive/10 border border-destructive/30 p-5">
            <p className="text-xs font-semibold text-destructive uppercase tracking-wider mb-3">Flagged Features</p>
            <div className="flex flex-wrap gap-2">
              {dashboard.flagged_features
                .filter((f): f is string => typeof f === "string")
                .map((f) => (
                  <span key={f} className="text-xs bg-destructive/20 text-destructive px-2.5 py-1 rounded-lg">
                    {f.replace(/_/g, " ")}
                  </span>
                ))}
            </div>
          </div>
        )}

        {/* Trends mini */}
        {Array.isArray(dashboard.trends) && dashboard.trends.length > 0 && (
          <div className="rounded-2xl bg-gradient-card border border-border p-5 shadow-card">
            <h3 className="font-heading text-sm font-semibold text-foreground mb-3">CSI Trends</h3>
            <div className="flex items-end justify-between gap-2 h-24">
              {dashboard.trends.map((t, i) => {
                const isLatest = i === dashboard.trends.length - 1;
                const csiVal = typeof t?.csi === "number" ? t.csi : 0;
                const sessionNum = typeof t?.session_number === "number" || typeof t?.session_number === "string" ? t.session_number : i + 1;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full flex justify-center">
                      <div className={`w-4 rounded-t-md ${isLatest ? "bg-primary" : "bg-secondary"}`}
                        style={{ height: `${(csiVal / 100) * 70}px` }}
                      />
                    </div>
                    <span className="text-[9px] text-muted-foreground font-medium">S{sessionNum}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 6 Biomarker Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {CARD_META.map((meta, i) => {
          const value = cards[meta.key as keyof typeof cards] ?? 0;
          const Icon = meta.icon;
          return (
            <motion.div key={meta.key}
              initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.06 }}
              className="rounded-2xl bg-gradient-card border border-border p-5 shadow-card"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-heading text-sm font-semibold text-foreground">{meta.label}</h3>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{meta.subtitle}</p>
                </div>
                <Icon className="h-4 w-4 text-primary/60" />
              </div>
              <div className="flex items-end justify-between mb-3">
                <span className="font-heading text-2xl font-bold text-foreground">{value}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, value)}%` }}
                  transition={{ duration: 1, delay: 0.2 + i * 0.08 }}
                  className="h-full rounded-full" style={{ backgroundColor: meta.color }}
                />
              </div>
            </motion.div>
          );
        })}
      </div>

      <p className="text-center text-[10px] text-muted-foreground">
        Not a clinical diagnosis · For investigational use only
      </p>
    </div>
  );
};

export default DashboardScreen;
