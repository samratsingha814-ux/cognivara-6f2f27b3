import { useState } from "react";
import { motion } from "framer-motion";
import { Mic, Activity as WaveIcon, TrendingDown, BookText, Brain, Heart, Activity, Loader2, RefreshCw } from "lucide-react";
import { DashboardResponse, mapFeaturesToCards } from "@/services/cognivaraApi";

interface DashboardScreenProps {
  dashboard: DashboardResponse | null;
  latestUpload: LatestUploadData | null;
  onRefresh: () => void;
}

export interface LatestUploadData {
  csi: number | null;
  drift: Record<string, number> | null;
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

const DashboardScreen = ({ dashboard, latestUpload, onRefresh }: DashboardScreenProps) => {
  const [loading, setLoading] = useState(false);

  const handleRefresh = async () => {
    setLoading(true);
    await onRefresh();
    setLoading(false);
  };

  // Derive card values from latest upload or dashboard feature_summary
  const features = latestUpload?.features || dashboard?.feature_summary || {};
  const csi = latestUpload?.csi ?? dashboard?.latest_csi ?? null;
  const drift = latestUpload?.drift ?? null;
  const cards = mapFeaturesToCards(features, csi, drift);

  if (!dashboard) {
    return (
      <div className="px-5 pt-12 pb-28 flex flex-col items-center justify-center min-h-screen">
        <WaveIcon className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="font-heading text-xl font-bold mb-2">No Insights Yet</h2>
        <p className="text-sm text-muted-foreground text-center mb-6">
          Complete 3 voice recordings to unlock your neural analysis.
        </p>
        <button onClick={handleRefresh} disabled={loading}
          className="flex items-center gap-2 py-3 px-6 rounded-2xl bg-gradient-cta text-primary-foreground font-heading font-semibold text-sm"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Refresh
        </button>
      </div>
    );
  }

  const score = csi != null ? Math.round(csi) : 0;

  return (
    <div className="px-5 pt-12 pb-28">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <Activity className="h-4 w-4 text-primary" />
          </div>
          <span className="font-heading text-lg font-bold tracking-tight">COGNIVARA</span>
        </div>
        <button onClick={handleRefresh} disabled={loading}
          className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : <RefreshCw className="h-4 w-4 text-muted-foreground" />}
        </button>
      </div>

      <p className="text-[10px] uppercase tracking-[0.2em] text-accent font-semibold mb-1">
        {dashboard.baseline_ready ? "Analysis Complete" : `Calibrating · ${dashboard.session_count}/3 sessions`}
      </p>
      <h1 className="font-heading text-3xl font-bold text-foreground leading-tight mb-4">
        Neural<br />Snapshot
      </h1>

      {/* CSI Score */}
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="rounded-2xl bg-gradient-card border border-border p-8 mb-6 text-center shadow-card"
      >
        <span className="font-heading text-5xl font-bold text-foreground">{score}</span>
        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-medium mt-2">
          CSI Score
        </p>
        {dashboard.latest_risk_level && (
          <p className={`text-xs font-semibold mt-2 uppercase tracking-wider ${
            dashboard.latest_risk_level === "low" ? "text-accent"
            : dashboard.latest_risk_level === "elevated" ? "text-destructive"
            : "text-yellow-400"
          }`}>
            Risk: {dashboard.latest_risk_level}
          </p>
        )}
      </motion.div>

      {/* Flagged Features */}
      {dashboard.flagged_features && dashboard.flagged_features.length > 0 && (
        <div className="rounded-2xl bg-destructive/10 border border-destructive/30 p-4 mb-6">
          <p className="text-xs font-semibold text-destructive uppercase tracking-wider mb-2">Flagged Features</p>
          <div className="flex flex-wrap gap-2">
            {dashboard.flagged_features.map((f) => (
              <span key={f} className="text-xs bg-destructive/20 text-destructive px-2 py-1 rounded-lg">
                {f.replace(/_/g, " ")}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 6 Biomarker Cards */}
      <div className="space-y-3 mb-8">
        {CARD_META.map((meta, i) => {
          const value = cards[meta.key as keyof typeof cards] ?? 0;
          const Icon = meta.icon;

          return (
            <motion.div key={meta.key}
              initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.08 }}
              className="rounded-2xl bg-gradient-card border border-border p-5 shadow-card"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-heading text-base font-semibold text-foreground">{meta.label}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{meta.subtitle}</p>
                </div>
                <Icon className="h-5 w-5 text-primary/60" />
              </div>
              <div className="flex items-end justify-between mb-3">
                <span className="font-heading text-2xl font-bold text-foreground">{value}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, value)}%` }}
                  transition={{ duration: 1, delay: 0.2 + i * 0.1 }}
                  className="h-full rounded-full" style={{ backgroundColor: meta.color }}
                />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Trends */}
      {dashboard.trends && dashboard.trends.length > 0 && (
        <div className="mb-6">
          <h3 className="font-heading text-sm font-semibold text-foreground mb-3">CSI Trends</h3>
          <div className="rounded-2xl bg-gradient-card border border-border p-5 shadow-card">
            <div className="flex items-end justify-between gap-2 h-28">
              {dashboard.trends.map((t, i) => {
                const isLatest = i === dashboard.trends.length - 1;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2">
                    {isLatest && (
                      <span className="text-[9px] bg-primary/20 text-primary px-1.5 py-0.5 rounded font-medium">Latest</span>
                    )}
                    <div className="w-full flex justify-center">
                      <div className={`w-5 rounded-t-md ${isLatest ? "bg-gradient-primary" : "bg-secondary"}`}
                        style={{ height: `${((t.csi ?? 0) / 100) * 80}px` }}
                      />
                    </div>
                    <span className="text-[9px] text-muted-foreground font-medium">S{t.session_number}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <p className="text-center text-[10px] text-muted-foreground mt-6">
        Not a clinical diagnosis · For investigational use only
      </p>
    </div>
  );
};

export default DashboardScreen;
