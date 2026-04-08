import { motion } from "framer-motion";
import { Brain, Mic, Shield, TrendingUp } from "lucide-react";

interface HomeScreenProps {
  onStartRecording: () => void;
}

const features = [
  { icon: Mic, title: "Voice Analysis", desc: "30-second recording to detect cognitive biomarkers" },
  { icon: Shield, title: "94.2% Accuracy", desc: "Clinical-grade detection backed by research" },
  { icon: TrendingUp, title: "6-Month Early Detection", desc: "Spot patterns before visible symptoms" },
];

const HomeScreen = ({ onStartRecording }: HomeScreenProps) => {
  return (
    <div className="px-5 pt-14 pb-24">
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-8">
        <Brain className="h-7 w-7 text-primary" />
        <span className="font-heading text-xl font-bold tracking-tight">COGNIVARA</span>
      </div>

      {/* Hero card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-gradient-primary p-6 mb-8"
      >
        <h1 className="font-heading text-2xl font-bold text-primary-foreground leading-tight mb-2">
          Monitor Your Cognitive Health
        </h1>
        <p className="text-sm text-primary-foreground/80 mb-5 leading-relaxed">
          Analyze speech biomarkers to detect subtle cognitive strain patterns early.
        </p>
        <button
          onClick={onStartRecording}
          className="flex items-center gap-2 bg-background text-foreground px-5 py-3 rounded-xl font-heading font-semibold text-sm"
        >
          <Mic className="h-4 w-4" />
          Start Recording
        </button>
      </motion.div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {[
          { val: "30s", label: "Analysis" },
          { val: "6mo", label: "Early Detect" },
          { val: "2.4K+", label: "Participants" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl bg-card border border-border p-3 text-center">
            <p className="font-heading text-lg font-bold">{s.val}</p>
            <p className="text-[10px] text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Features */}
      <h2 className="font-heading text-lg font-semibold mb-4">How It Works</h2>
      <div className="space-y-3">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 + i * 0.1 }}
            className="flex items-start gap-4 rounded-xl bg-card border border-border p-4"
          >
            <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <f.icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-heading text-sm font-semibold">{f.title}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{f.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default HomeScreen;
