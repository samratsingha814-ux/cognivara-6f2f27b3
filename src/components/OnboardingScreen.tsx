import { useState } from "react";
import { motion } from "framer-motion";
import { Activity, Loader2 } from "lucide-react";
import { createUser } from "@/services/cognivaraApi";
import { useAuth } from "@/hooks/useAuth";

interface OnboardingScreenProps {
  onComplete: (userId: string) => void;
}

const OnboardingScreen = ({ onComplete }: OnboardingScreenProps) => {
  const { user } = useAuth();
  const [name, setName] = useState(user?.user_metadata?.display_name || "");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("male");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const email = user?.email || "";

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const result = await createUser({
        name: name.trim(),
        email,
        age: age ? parseInt(age, 10) : undefined,
        gender: gender || undefined,
      });
      onComplete(String(result.user_id));
    } catch (err: any) {
      setError(err.message || "Failed to create profile. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-5 pt-16 pb-28 flex flex-col min-h-screen">
      <div className="flex items-center gap-2.5 mb-10">
        <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
          <Activity className="h-4 w-4 text-primary" />
        </div>
        <span className="font-heading text-lg font-bold tracking-tight">COGNIVARA</span>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-[10px] uppercase tracking-[0.2em] text-accent font-semibold mb-1">
          Setup Required
        </p>
        <h1 className="font-heading text-3xl font-bold text-foreground leading-tight mb-2">
          Create Your<br />Neural Profile
        </h1>
        <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
          We need a few details to calibrate the cognitive analysis engine for you.
        </p>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1.5 block">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="w-full rounded-xl bg-secondary border border-border px-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1.5 block">
              Email
            </label>
            <input
              type="email"
              value={email}
              disabled
              className="w-full rounded-xl bg-secondary/50 border border-border px-4 py-3.5 text-sm text-muted-foreground"
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1.5 block">
              Age <span className="text-muted-foreground/60">(optional)</span>
            </label>
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="e.g. 34"
              className="w-full rounded-xl bg-secondary border border-border px-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1.5 block">
              Gender <span className="text-muted-foreground/60">(optional)</span>
            </label>
            <div className="flex gap-3">
              {["male", "female", "other"].map((g) => (
                <button
                  key={g}
                  onClick={() => setGender(g)}
                  className={`flex-1 py-3 rounded-xl text-sm font-medium capitalize transition-all ${
                    gender === g
                      ? "bg-primary/20 border border-primary text-primary"
                      : "bg-secondary border border-border text-muted-foreground"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && <p className="text-sm text-destructive mt-4">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full mt-8 py-4 rounded-2xl bg-gradient-cta text-primary-foreground font-heading font-semibold text-sm shadow-glow flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Creating...
            </>
          ) : (
            "Create Profile"
          )}
        </button>
      </motion.div>
    </div>
  );
};

export default OnboardingScreen;
