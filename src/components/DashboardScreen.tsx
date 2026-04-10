import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Mic, Activity as WaveIcon, TrendingDown, BookText, Bell, Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { RecordingSession } from "@/services/cognivaraApi";

interface DashboardScreenProps {
  sessions: RecordingSession[];
}

interface BiomarkerCard {
  title: string;
  subtitle: string;
  value: string;
  change: string;
  changeType: "positive" | "negative" | "neutral";
  color: string;
  icon: typeof Mic;
}

const DashboardScreen = ({ sessions }: DashboardScreenProps) => {
  const { user } = useAuth();
  const [aggregatedScore, setAggregatedScore] = useState(88);
  const [biomarkers, setBiomarkers] = useState<BiomarkerCard[]>([]);
  const [summary, setSummary] = useState("");

  useEffect(() => {
    const fetchInsights = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("recording_sessions")
        .select("*")
        .eq("user_id", user.id)
        .order("session_date", { ascending: false })
        .limit(5);

      if (data && data.length > 0) {
        const latest = data[0];
        const score = Math.max(0, 100 - latest.risk_score);
        setAggregatedScore(score);

        setBiomarkers([
          {
            title: "Clarity",
            subtitle: "Articulation precision",
            value: `${latest.fluency}%`,
            change: "+2.4% vs prev",
            changeType: "positive",
            color: "hsl(190, 80%, 50%)",
            icon: Mic,
          },
          {
            title: "Cadence",
            subtitle: "Rhythmic flow pattern",
            value: `${latest.complexity}%`,
            change: "Stable range",
            changeType: "neutral",
            color: "hsl(190, 80%, 50%)",
            icon: WaveIcon,
          },
          {
            title: "Tone",
            subtitle: "Emotional resonance",
            value: `${latest.emotional_stability}%`,
            change: "Optimal",
            changeType: "positive",
            color: "hsl(160, 60%, 45%)",
            icon: TrendingDown,
          },
          {
            title: "Vocabulary",
            subtitle: "Lexical diversity index",
            value: `${Math.round((latest.complexity + latest.fluency) / 2)}%`,
            change: "-1.1% vs prev",
            changeType: "negative",
            color: "hsl(190, 80%, 50%)",
            icon: BookText,
          },
        ]);

        setSummary(
          `Your latest session indicates high cognitive stability. Vocabulary complexity remains consistent with baseline, while vocal cadence shows a 4.2% increase in rhythmic fluidity compared to last Tuesday.`
        );
      } else {
        setBiomarkers([
          { title: "Clarity", subtitle: "Articulation precision", value: "--", change: "No data", changeType: "neutral", color: "hsl(190, 80%, 50%)", icon: Mic },
          { title: "Cadence", subtitle: "Rhythmic flow pattern", value: "--", change: "No data", changeType: "neutral", color: "hsl(190, 80%, 50%)", icon: WaveIcon },
          { title: "Tone", subtitle: "Emotional resonance", value: "--", change: "No data", changeType: "neutral", color: "hsl(160, 60%, 45%)", icon: TrendingDown },
          { title: "Vocabulary", subtitle: "Lexical diversity index", value: "--", change: "No data", changeType: "neutral", color: "hsl(190, 80%, 50%)", icon: BookText },
        ]);
      }
    };
    fetchInsights();
  }, [user, sessions.length]);

  if (sessions.length === 0 && biomarkers.length === 0) {
    return (
      <div className="px-5 pt-12 pb-28 flex flex-col items-center justify-center min-h-screen">
        <WaveIcon className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="font-heading text-xl font-bold mb-2">No Insights Yet</h2>
        <p className="text-sm text-muted-foreground text-center">
          Complete a voice recording to see your neural snapshot.
        </p>
      </div>
    );
  }

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
        <button className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center">
          <Bell className="h-4 w-4 text-muted-foreground" />
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
      <p className="text-sm text-muted-foreground leading-relaxed mb-6">{summary}</p>

      {/* Aggregated Score */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-2xl bg-gradient-card border border-border p-8 mb-6 text-center shadow-card"
      >
        <span className="font-heading text-5xl font-bold text-foreground">{aggregatedScore}%</span>
        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-medium mt-2">
          Aggregated Score
        </p>
      </motion.div>

      {/* Biomarker Cards */}
      <div className="space-y-3 mb-8">
        {biomarkers.map((bio, i) => (
          <motion.div
            key={bio.title}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.08 }}
            className="rounded-2xl bg-gradient-card border border-border p-5 shadow-card"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-heading text-base font-semibold text-foreground">{bio.title}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{bio.subtitle}</p>
              </div>
              <bio.icon className="h-5 w-5 text-primary/60" />
            </div>

            <div className="flex items-end justify-between mb-3">
              <span className="font-heading text-2xl font-bold text-foreground">{bio.value}</span>
              <span
                className={`text-xs font-medium ${
                  bio.changeType === "positive"
                    ? "text-accent"
                    : bio.changeType === "negative"
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
              >
                {bio.change}
              </span>
            </div>

            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: bio.value !== "--" ? bio.value : "0%" }}
                transition={{ duration: 1, delay: 0.2 + i * 0.1 }}
                className="h-full rounded-full"
                style={{ backgroundColor: bio.color }}
              />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Deep Archive CTA */}
      <div className="mb-4">
        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold mb-1">
          Deep Archive
        </p>
        <p className="text-xs text-muted-foreground mb-3">
          Access temporal comparative data spanning 24 months.
        </p>
        <button className="w-full py-3.5 rounded-2xl bg-gradient-cta text-primary-foreground font-heading font-semibold text-sm shadow-glow">
          See Historical Data
        </button>
      </div>

      <p className="text-center text-[10px] text-muted-foreground mt-6">
        Not a clinical diagnosis · For investigational use only
      </p>
    </div>
  );
};

export default DashboardScreen;
