import { motion } from "framer-motion";
import { AnalysisData } from "./VoiceRecorder";

interface CompareAnalysisProps {
  sessions: AnalysisData[];
}

const referencePatients = [
  { name: "Patient A", status: "Stable", riskScore: 22, csi: 78 },
  { name: "Patient B", status: "Worsening", riskScore: 68, csi: 35 },
  { name: "Patient C", status: "Recovery", riskScore: 38, csi: 62 },
];

const CompareAnalysis = ({ sessions }: CompareAnalysisProps) => {
  if (sessions.length === 0) return null;

  const latest = sessions[sessions.length - 1];
  const selected = referencePatients[0];
  const riskDelta = latest.riskScore - selected.riskScore;
  const csiDelta = latest.complexity - selected.csi;

  return (
    <section className="py-24 px-6">
      <div className="container mx-auto max-w-5xl">
        <p className="text-center text-xs tracking-widest text-primary uppercase font-medium mb-3">
          Side-by-Side Analysis
        </p>
        <h2 className="font-heading text-3xl md:text-4xl font-bold text-center mb-2">
          Your Analysis vs Reference Patients
        </h2>
        <p className="text-center text-muted-foreground mb-12">
          Compare your recorded cognitive biomarkers against clinical reference profiles.
        </p>

        {/* Reference selector */}
        <div className="flex flex-wrap justify-center gap-3 mb-10">
          {referencePatients.map((p, i) => (
            <div
              key={p.name}
              className={`rounded-lg px-5 py-3 text-sm font-medium border transition-colors ${
                i === 0
                  ? "bg-secondary border-primary/30 text-foreground"
                  : "border-border text-muted-foreground hover:text-foreground cursor-pointer"
              }`}
            >
              {p.name} — {p.status}
            </div>
          ))}
        </div>

        {/* Comparison cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="rounded-xl bg-card border border-border p-5 text-center">
            <p className="text-xs text-muted-foreground mb-1">Your Risk Score</p>
            <p className="font-heading text-3xl font-bold">{latest.riskScore}</p>
            <p className="text-xs text-muted-foreground">out of 100</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="rounded-xl bg-card border border-border p-5 text-center">
            <p className="text-xs text-muted-foreground mb-1">Reference Score</p>
            <p className="font-heading text-3xl font-bold text-primary">{selected.riskScore}</p>
            <p className="text-xs text-muted-foreground">{selected.name}</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className="rounded-xl bg-card border border-border p-5 text-center">
            <p className="text-xs text-muted-foreground mb-1">CSI Delta</p>
            <p className={`font-heading text-3xl font-bold ${csiDelta >= 0 ? "text-primary" : "text-destructive"}`}>
              {csiDelta >= 0 ? "+" : ""}{csiDelta}
            </p>
            <p className="text-xs text-muted-foreground">Difference</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }} className="rounded-xl bg-card border border-border p-5 text-center">
            <p className="text-xs text-muted-foreground mb-1">Risk Delta</p>
            <p className={`font-heading text-3xl font-bold ${riskDelta <= 0 ? "text-primary" : "text-destructive"}`}>
              {riskDelta >= 0 ? "+" : ""}{riskDelta}
            </p>
            <p className="text-xs text-muted-foreground">Difference</p>
          </motion.div>
        </div>

        {/* Side by side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl bg-card border border-border p-6">
            <h4 className="font-heading font-semibold mb-1">You</h4>
            <p className="text-xs text-muted-foreground mb-4">Live Recording Analysis</p>
            <p className="text-sm text-foreground leading-relaxed line-clamp-4">
              {latest.transcript || "No transcript available."}
            </p>
          </div>
          <div className="rounded-xl bg-card border border-border p-6">
            <h4 className="font-heading font-semibold mb-1">{selected.name}</h4>
            <p className="text-xs text-muted-foreground mb-4">Reference Profile · {selected.status}</p>
            <p className="text-sm text-muted-foreground italic">
              Reference patient data is anonymized. Speech patterns show stable cognitive baseline with minimal deviation.
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-10">
          Not a clinical diagnosis · For investigational use only
        </p>
      </div>
    </section>
  );
};

export default CompareAnalysis;
