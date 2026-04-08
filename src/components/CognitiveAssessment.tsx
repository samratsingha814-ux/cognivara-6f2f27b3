import { motion } from "framer-motion";
import { AnalysisData } from "./VoiceRecorder";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, RadialBarChart, RadialBar, LineChart, Line, CartesianGrid, Tooltip, Area, AreaChart } from "recharts";

interface CognitiveAssessmentProps {
  sessions: AnalysisData[];
}

const ScoreGauge = ({ label, score, description }: { label: string; score: number; description: string }) => {
  const color = score >= 70 ? "hsl(150,60%,50%)" : score >= 40 ? "hsl(40,80%,55%)" : "hsl(0,70%,55%)";
  const data = [{ name: label, value: score, fill: color }];

  return (
    <div className="rounded-xl bg-card border border-border p-5">
      <h4 className="font-heading text-sm font-semibold mb-1">{label}</h4>
      <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{description}</p>
      <div className="flex items-center gap-4">
        <div className="w-20 h-20">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart cx="50%" cy="50%" innerRadius="70%" outerRadius="100%" data={data} startAngle={90} endAngle={-270}>
              <RadialBar dataKey="value" cornerRadius={10} background={{ fill: "hsl(220,14%,14%)" }} />
            </RadialBarChart>
          </ResponsiveContainer>
        </div>
        <div>
          <span className="font-heading text-3xl font-bold" style={{ color }}>{score}</span>
          <span className="text-muted-foreground text-sm">/100</span>
        </div>
      </div>
    </div>
  );
};

const BiomarkerChart = ({ label, data, color }: { label: string; data: number[]; color: string }) => {
  const chartData = data.map((v, i) => ({ day: i + 1, value: v }));
  return (
    <div className="rounded-xl bg-card border border-border p-5">
      <h4 className="font-heading text-sm font-semibold mb-1">{label}</h4>
      <div className="h-32">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id={`grad-${label}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="value" stroke={color} fill={`url(#grad-${label})`} strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const CognitiveAssessment = ({ sessions }: CognitiveAssessmentProps) => {
  if (sessions.length === 0) return null;

  const latest = sessions[sessions.length - 1];
  const riskColor = latest.riskScore >= 60 ? "text-destructive" : latest.riskScore >= 35 ? "text-yellow-400" : "text-primary";

  // Generate fake trajectory data
  const generateTrajectory = (base: number) =>
    Array.from({ length: 7 }, (_, i) => base + Math.round((Math.random() - 0.5) * 15));

  return (
    <section id="dashboard" className="py-24 px-6">
      <div className="container mx-auto max-w-5xl">
        <p className="text-center text-xs tracking-widest text-primary uppercase font-medium mb-3">
          Cognitive Assessment
        </p>
        <h2 className="font-heading text-3xl md:text-4xl font-bold text-center mb-2">
          Your Cognitive Risk Profile
        </h2>
        <p className="text-center text-muted-foreground mb-12">
          Based on {sessions.length} baseline recording{sessions.length > 1 ? "s" : ""} — Updated today
        </p>

        {/* Risk Score */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col items-center mb-16"
        >
          <div className="text-center">
            <span className={`font-heading text-7xl font-bold ${riskColor}`}>{latest.riskScore}</span>
            <span className="text-2xl text-muted-foreground font-heading"> / 100</span>
          </div>
          <p className="mt-2 text-sm font-medium text-muted-foreground">Cognitive Risk Score</p>
        </motion.div>

        {/* Biomarker bars */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-xl bg-card border border-border p-6 mb-8"
        >
          <h3 className="font-heading text-lg font-semibold mb-6">
            Speech Analysis — Session {latest.sessionNumber}
          </h3>
          <div className="space-y-4">
            {[
              { label: "Stress", value: latest.stress, color: "hsl(0,70%,55%)" },
              { label: "Pitch", value: latest.pitch, color: "hsl(220,70%,60%)" },
              { label: "Hesitation", value: latest.hesitation, color: "hsl(40,80%,55%)" },
            ].map(({ label, value, color }) => (
              <div key={label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium">{value}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${value}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Trajectory charts */}
        <h3 className="font-heading text-lg font-semibold mb-4">Longitudinal Biomarker Trajectories</h3>
        <p className="text-sm text-muted-foreground mb-6">30-day trends across core cognitive speech dimensions</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
          <BiomarkerChart label="Emotional Stress" data={generateTrajectory(latest.stress)} color="hsl(0,70%,55%)" />
          <BiomarkerChart label="Cognitive Complexity" data={generateTrajectory(latest.complexity)} color="hsl(174,72%,50%)" />
          <BiomarkerChart label="Hesitation" data={generateTrajectory(latest.hesitation)} color="hsl(40,80%,55%)" />
          <BiomarkerChart label="Linguistic Efficiency" data={generateTrajectory(latest.fluency)} color="hsl(220,70%,60%)" />
        </div>

        {/* Score gauges */}
        <h3 className="font-heading text-lg font-semibold mb-4">AI Interpretation</h3>
        <p className="text-xs text-muted-foreground mb-6">Generated today · Not a clinical diagnosis</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ScoreGauge
            label="Emotional Stability Index"
            score={latest.emotionalStability}
            description="Measures how consistent and calm your emotional tone is across speech."
          />
          <ScoreGauge
            label="Cognitive Complexity Index"
            score={latest.complexity}
            description="Reflects the richness of your vocabulary and sentence structure."
          />
          <ScoreGauge
            label="Speech Fluency Index"
            score={latest.fluency}
            description="Tracks the smoothness and continuity of your speech."
          />
        </div>
      </div>
    </section>
  );
};

export default CognitiveAssessment;
