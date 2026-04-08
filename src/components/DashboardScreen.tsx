import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { RecordingSession, getCognitiveProfile, CognitiveProfile } from "@/services/cognivaraApi";
import { AreaChart, Area, ResponsiveContainer, RadialBarChart, RadialBar } from "recharts";
import { AlertTriangle, TrendingDown, Activity } from "lucide-react";

interface DashboardScreenProps {
  sessions: RecordingSession[];
}

const ScoreRing = ({ score, label, color }: { score: number; label: string; color: string }) => {
  const data = [{ value: score, fill: color }];
  return (
    <div className="flex flex-col items-center">
      <div className="w-16 h-16">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart cx="50%" cy="50%" innerRadius="70%" outerRadius="100%" data={data} startAngle={90} endAngle={-270}>
            <RadialBar dataKey="value" cornerRadius={10} background={{ fill: "hsl(220,14%,14%)" }} />
          </RadialBarChart>
        </ResponsiveContainer>
      </div>
      <span className="font-heading text-lg font-bold mt-1" style={{ color }}>{score}</span>
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
  );
};

const DashboardScreen = ({ sessions }: DashboardScreenProps) => {
  const [profile, setProfile] = useState<CognitiveProfile | null>(null);

  useEffect(() => {
    getCognitiveProfile().then(setProfile);
  }, [sessions.length]);

  if (sessions.length === 0) {
    return (
      <div className="px-5 pt-14 pb-24 flex flex-col items-center justify-center min-h-screen">
        <Activity className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="font-heading text-xl font-bold mb-2">No Results Yet</h2>
        <p className="text-sm text-muted-foreground text-center">
          Complete at least one voice recording to see your cognitive analysis.
        </p>
      </div>
    );
  }

  const latest = sessions[sessions.length - 1];
  const riskColor = latest.riskScore >= 60 ? "hsl(0,70%,55%)" : latest.riskScore >= 35 ? "hsl(40,80%,55%)" : "hsl(174,72%,50%)";

  return (
    <div className="px-5 pt-14 pb-24">
      <h1 className="font-heading text-2xl font-bold mb-1">Results</h1>
      <p className="text-xs text-muted-foreground mb-6">
        Based on {sessions.length} recording{sessions.length > 1 ? "s" : ""} · Updated today
      </p>

      {/* Risk Score */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-2xl bg-card border border-border p-6 mb-5 text-center"
      >
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Cognitive Risk Score</p>
        <span className="font-heading text-5xl font-bold" style={{ color: riskColor }}>
          {latest.riskScore}
        </span>
        <span className="text-xl text-muted-foreground font-heading">/100</span>
      </motion.div>

      {/* Biomarker bars */}
      <div className="rounded-xl bg-card border border-border p-4 mb-5">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          Speech Biomarkers
        </p>
        {[
          { label: "Stress", value: latest.stress, color: "hsl(0,70%,55%)" },
          { label: "Pitch Variance", value: latest.pitch, color: "hsl(220,70%,60%)" },
          { label: "Hesitation", value: latest.hesitation, color: "hsl(40,80%,55%)" },
        ].map(({ label, value, color }) => (
          <div key={label} className="mb-3 last:mb-0">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-muted-foreground">{label}</span>
              <span className="font-medium">{value}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${value}%` }}
                transition={{ duration: 1 }}
                className="h-full rounded-full"
                style={{ backgroundColor: color }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Score rings */}
      <div className="grid grid-cols-3 gap-2 mb-5">
        <div className="rounded-xl bg-card border border-border p-3">
          <ScoreRing score={latest.emotionalStability} label="Stability" color={latest.emotionalStability >= 60 ? "hsl(174,72%,50%)" : "hsl(40,80%,55%)"} />
        </div>
        <div className="rounded-xl bg-card border border-border p-3">
          <ScoreRing score={latest.complexity} label="Complexity" color={latest.complexity >= 60 ? "hsl(174,72%,50%)" : "hsl(40,80%,55%)"} />
        </div>
        <div className="rounded-xl bg-card border border-border p-3">
          <ScoreRing score={latest.fluency} label="Fluency" color={latest.fluency >= 60 ? "hsl(174,72%,50%)" : "hsl(40,80%,55%)"} />
        </div>
      </div>

      {/* Trend chart */}
      {profile && (
        <div className="rounded-xl bg-card border border-border p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Risk Trend
          </p>
          <div className="h-28">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={profile.trends}>
                <defs>
                  <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(174,72%,50%)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(174,72%,50%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="score" stroke="hsl(174,72%,50%)" fill="url(#trendGrad)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Session history */}
      <h2 className="font-heading text-lg font-semibold mt-6 mb-3">Recent Sessions</h2>
      <div className="space-y-2">
        {sessions.slice().reverse().map((s) => (
          <div key={s.id} className="rounded-xl bg-card border border-border p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{new Date(s.date).toLocaleDateString()}</p>
              <p className="text-xs text-muted-foreground">{s.wordCount} words · {s.duration}s</p>
            </div>
            <div className="text-right">
              <p className="font-heading font-bold text-lg" style={{ color: s.riskScore >= 50 ? "hsl(0,70%,55%)" : "hsl(174,72%,50%)" }}>
                {s.riskScore}
              </p>
              <p className="text-[10px] text-muted-foreground">risk</p>
            </div>
          </div>
        ))}
      </div>

      <p className="text-center text-[10px] text-muted-foreground mt-6">
        Not a clinical diagnosis · For investigational use only
      </p>
    </div>
  );
};

export default DashboardScreen;
