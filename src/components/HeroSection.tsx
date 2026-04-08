import { motion } from "framer-motion";
import { Mic } from "lucide-react";

const stats = [
  { value: "94.2%", label: "Detection Accuracy" },
  { value: "30s", label: "Analysis Time" },
  { value: "6mo", label: "Early Detection" },
  { value: "2,400+", label: "Study Participants" },
];

const HeroSection = ({ onStartRecording }: { onStartRecording: () => void }) => {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-20">
      {/* Badge */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-8 flex items-center gap-2 rounded-full border border-border px-4 py-1.5"
      >
        <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
        <span className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
          Clinical-Grade Voice Analysis
        </span>
      </motion.div>

      {/* Headline */}
      <motion.h1
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="font-heading text-5xl md:text-7xl font-bold text-center leading-tight max-w-4xl"
      >
        Monitor Your{" "}
        <span className="text-gradient">Cognitive Health</span>
        <br />
        Through Voice
      </motion.h1>

      {/* Subtitle */}
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-6 max-w-xl text-center text-muted-foreground leading-relaxed"
      >
        COGNIVARA analyzes speech biomarkers to detect subtle cognitive strain patterns
        up to 6 months before visible symptoms appear.
      </motion.p>

      {/* CTA */}
      <motion.button
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.7 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.97 }}
        onClick={onStartRecording}
        className="mt-10 flex items-center gap-3 bg-gradient-primary px-8 py-4 rounded-xl font-heading font-semibold text-primary-foreground shadow-glow transition-shadow hover:shadow-[0_0_40px_hsl(174_72%_50%/0.35)]"
      >
        <Mic className="h-5 w-5" />
        Start 30-Second Recording
      </motion.button>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="mt-16 flex flex-wrap justify-center gap-0 rounded-2xl bg-card border border-border overflow-hidden"
      >
        {stats.map((stat, i) => (
          <div
            key={stat.label}
            className={`flex flex-col items-center px-8 py-5 ${
              i < stats.length - 1 ? "border-r border-border" : ""
            }`}
          >
            <span className="font-heading text-2xl font-bold text-foreground">{stat.value}</span>
            <span className="text-xs text-muted-foreground mt-1">{stat.label}</span>
          </div>
        ))}
      </motion.div>
    </section>
  );
};

export default HeroSection;
