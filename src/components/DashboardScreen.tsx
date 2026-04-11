import { useState } from "react";
import { motion } from "framer-motion";
import { Mic, Activity as WaveIcon, TrendingDown, BookText, Activity, Loader2, RefreshCw } from "lucide-react";
import { DashboardResponse } from "@/services/cognivaraApi";

interface DashboardScreenProps {
  dashboard: DashboardResponse | null;
  userId: string;
  onRefresh: () => void;
}

const DashboardScreen = ({ dashboard, onRefresh }: DashboardScreenProps) => {
  const [loading, setLoading] = useState(false);

  const handleRefresh = async () => {
    setLoading(true);
    await onRefresh();
    setLoading(false);
  };

  if (!dashboard) {
    return (
      <div className="px-5 pt-12 pb-28 flex flex-col items-center justify-center min-h-screen">
        <WaveIcon className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="font-heading text-xl font-bold mb-2">No Insights Yet</h2>
        <p className="text-sm text-muted-foreground text-center mb-6">
          Complete 3 voice recordings to see your neural analysis.
        </p>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="flex items-center gap-2 py-3 px-6 rounded-2xl bg-gradient-cta text-primary-foreground font-heading font-semibold text-sm"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Refresh
        </button>
      </div>
    );
  }

  const score = dashboard.cognitive_score ?? (dashboard.risk_score != null ? Math.max(0, 100 - dashboard.risk_score) : 0);
  const biomarkers = dashboard.biomarkers || {};
  const biomarkerEntries = Object.entries(biomarkers);

  const iconMap = [Mic, WaveIcon, TrendingDown, BookText];
  const colorPalette = [
    "hsl(190, 80%, 50%)",
    "hsl(160, 60%, 45%)",
    "hsl(210, 90%, 55%)",
    "hsl(280, 60%, 55%)",
  ];

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
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : (
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
      </div>

      {/* Title */}
      <p className="text-[10px] uppercase tracking-[0.2em] text-accent font-semibold mb-1">
        Analysis Complete
      </p>
      <h1 className="font-heading text-3xl font-bold text-foreground leading-tight mb-4">
        Neural<br />Snapshot
      </h1>

      {/* Summary */}
      {dashboard.summary && (
        <p className="text-sm text-muted-foreground leading-relaxed mb-6">{dashboard.summary}</p>
      )}

      {/* Aggregated Score */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-2xl bg-gradient-card border border-border p-8 mb-6 text-center shadow-card"
      >
        <span className="font-heading text-5xl font-bold text-foreground">{score}%</span>
        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-medium mt-2">
          Cognitive Score
        </p>
        {dashboard.risk_level && (
          <p className={`text-xs font-semibold mt-2 uppercase tracking-wider ${
            dashboard.risk_level === "low" ? "text-accent" : dashboard.risk_level === "elevated" ? "text-primary" : "text-yellow-400"
          }`}>
            Risk: {dashboard.risk_level}
          </p>
        )}
      </motion.div>

      {/* Biomarker Cards */}
      {biomarkerEntries.length > 0 && (
        <div className="space-y-3 mb-8">
          {biomarkerEntries.map(([key, value], i) => {
            const Icon = iconMap[i % iconMap.length];
            const color = colorPalette[i % colorPalette.length];
            const numValue = typeof value === "number" ? value : 0;

            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.08 }}
                className="rounded-2xl bg-gradient-card border border-border p-5 shadow-card"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-heading text-base font-semibold text-foreground capitalize">
                      {key.replace(/_/g, " ")}
                    </h3>
                  </div>
                  <Icon className="h-5 w-5 text-primary/60" />
                </div>

                <div className="flex items-end justify-between mb-3">
                  <span className="font-heading text-2xl font-bold text-foreground">
                    {typeof numValue === "number" ? `${Math.round(numValue)}%` : String(value)}
                  </span>
                </div>

                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, Math.round(numValue))}%` }}
                    transition={{ duration: 1, delay: 0.2 + i * 0.1 }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: color }}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Raw dashboard data fallback — show any extra keys */}
      {biomarkerEntries.length === 0 && (
        <div className="rounded-2xl bg-gradient-card border border-border p-5 mb-6 shadow-card">
          <p className="text-xs text-muted-foreground">
            No biomarker breakdown available. Score: {score}%
          </p>
        </div>
      )}

      <p className="text-center text-[10px] text-muted-foreground mt-6">
        Not a clinical diagnosis · For investigational use only
      </p>
    </div>
  );
};

export default DashboardScreen;
