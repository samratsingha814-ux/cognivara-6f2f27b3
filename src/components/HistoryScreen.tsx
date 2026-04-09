import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Clock, Loader2, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface SessionRecord {
  id: string;
  session_date: string;
  duration: number;
  transcript: string;
  word_count: number;
  risk_score: number;
  stress: number;
  pitch: number;
  hesitation: number;
  complexity: number;
  fluency: number;
  emotional_stability: number;
}

const HistoryScreen = () => {
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchSessions = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("recording_sessions")
      .select("*")
      .order("session_date", { ascending: false });
    setSessions((data as SessionRecord[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchSessions(); }, []);

  const handleDelete = async (id: string) => {
    await supabase.from("recording_sessions").delete().eq("id", id);
    setSessions((prev) => prev.filter((s) => s.id !== id));
  };

  if (loading) {
    return (
      <div className="px-5 pt-14 pb-24 flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="px-5 pt-14 pb-24 flex flex-col items-center justify-center min-h-screen">
        <Clock className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="font-heading text-xl font-bold mb-2">No History Yet</h2>
        <p className="text-sm text-muted-foreground text-center">
          Complete voice recordings to build your history.
        </p>
      </div>
    );
  }

  return (
    <div className="px-5 pt-14 pb-24">
      <h1 className="font-heading text-2xl font-bold mb-1">History</h1>
      <p className="text-xs text-muted-foreground mb-6">
        {sessions.length} recording{sessions.length !== 1 ? "s" : ""} total
      </p>

      <div className="space-y-3">
        {sessions.map((s) => {
          const expanded = expandedId === s.id;
          const riskColor = s.risk_score >= 60 ? "hsl(0,70%,55%)" : s.risk_score >= 35 ? "hsl(40,80%,55%)" : "hsl(174,72%,50%)";
          return (
            <motion.div
              key={s.id}
              layout
              className="rounded-xl bg-card border border-border overflow-hidden"
            >
              <button
                onClick={() => setExpandedId(expanded ? null : s.id)}
                className="w-full p-4 flex items-center justify-between text-left"
              >
                <div>
                  <p className="text-sm font-medium">
                    {new Date(s.session_date).toLocaleDateString(undefined, {
                      weekday: "short", month: "short", day: "numeric",
                    })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {s.word_count} words · {s.duration}s
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-heading font-bold text-lg" style={{ color: riskColor }}>
                    {s.risk_score}
                  </p>
                  <p className="text-[10px] text-muted-foreground">risk</p>
                </div>
              </button>

              {expanded && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="px-4 pb-4 space-y-3"
                >
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: "Stress", value: s.stress },
                      { label: "Pitch", value: s.pitch },
                      { label: "Hesitation", value: s.hesitation },
                      { label: "Complexity", value: s.complexity },
                      { label: "Fluency", value: s.fluency },
                      { label: "Stability", value: s.emotional_stability },
                    ].map((m) => (
                      <div key={m.label} className="rounded-lg bg-muted p-2 text-center">
                        <p className="font-heading text-sm font-bold">{m.value}</p>
                        <p className="text-[9px] text-muted-foreground">{m.label}</p>
                      </div>
                    ))}
                  </div>

                  {s.transcript && (
                    <div className="rounded-lg bg-muted p-3">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1">Transcript</p>
                      <p className="text-xs text-foreground">{s.transcript}</p>
                    </div>
                  )}

                  <button
                    onClick={() => handleDelete(s.id)}
                    className="flex items-center gap-1.5 text-xs text-destructive"
                  >
                    <Trash2 className="h-3 w-3" /> Delete
                  </button>
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default HistoryScreen;
