import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, RefreshCw, Calendar, FileAudio, ChevronDown, ChevronUp } from "lucide-react";
import { getSessions, SessionEntry } from "@/services/cognivaraApi";

interface HistoryScreenProps {
  userId: string;
}

const formatDate = (iso: string) => {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return iso;
  }
};

const HistoryScreen = ({ userId }: HistoryScreenProps) => {
  const [sessions, setSessions] = useState<SessionEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getSessions(userId);
      const sorted = [...(res.sessions || [])].sort(
        (a, b) => (b.session_number ?? 0) - (a.session_number ?? 0),
      );
      setSessions(sorted);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-accent font-semibold mb-1">
            Recording Archive
          </p>
          <h1 className="font-heading text-3xl font-bold text-foreground">Session History</h1>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="h-9 w-9 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
          title="Refresh"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : (
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
      </div>

      {loading && sessions.length === 0 && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}

      {error && (
        <div className="rounded-2xl bg-destructive/10 border border-destructive/30 p-5 text-sm text-destructive">
          {error}
        </div>
      )}

      {!loading && !error && sessions.length === 0 && (
        <div className="rounded-2xl bg-gradient-card border border-border p-10 text-center">
          <FileAudio className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-heading text-lg font-semibold text-foreground mb-1">No recordings yet</p>
          <p className="text-sm text-muted-foreground">
            Your past voice sessions will appear here.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {sessions.map((s, i) => {
          const isOpen = expanded[s.id] ?? false;
          const csi = typeof s.csi_score === "number" ? Math.round(s.csi_score) : null;
          const transcript = (s.transcript || "").trim();
          const snippet = transcript.length > 160 ? transcript.slice(0, 160) + "…" : transcript;
          const allFeatures = {
            ...(s.acoustic_features || {}),
            ...(s.temporal_features || {}),
            ...(s.linguistic_features || {}),
          };
          const featureEntries = Object.entries(allFeatures).filter(
            ([, v]) => typeof v === "number" && Number.isFinite(v),
          );

          return (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.04, 0.3) }}
              className="rounded-2xl bg-gradient-card border border-border shadow-card overflow-hidden"
            >
              <div className="p-5">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] uppercase tracking-wider text-primary font-semibold">
                        Session #{s.session_number}
                      </span>
                      {csi != null && (
                        <span className="text-[10px] bg-primary/15 text-primary px-2 py-0.5 rounded-full font-semibold">
                          CSI {csi}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {formatDate(s.created_at)}
                    </div>
                  </div>
                  <button
                    onClick={() => setExpanded((p) => ({ ...p, [s.id]: !isOpen }))}
                    className="h-8 px-3 rounded-lg bg-secondary text-xs font-semibold text-foreground hover:bg-secondary/80 flex items-center gap-1"
                  >
                    {isOpen ? (
                      <>
                        Hide <ChevronUp className="h-3 w-3" />
                      </>
                    ) : (
                      <>
                        Details <ChevronDown className="h-3 w-3" />
                      </>
                    )}
                  </button>
                </div>

                {snippet ? (
                  <p className="text-sm text-foreground/80 leading-relaxed line-clamp-2">
                    "{snippet}"
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground italic">No transcript available.</p>
                )}

                {isOpen && (
                  <div className="mt-4 pt-4 border-t border-border space-y-3">
                    {transcript && transcript.length > 160 && (
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">
                          Full transcript
                        </p>
                        <p className="text-sm text-foreground/80 leading-relaxed">{transcript}</p>
                      </div>
                    )}
                    {featureEntries.length > 0 && (
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">
                          Features ({featureEntries.length})
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                          {featureEntries.map(([k, v]) => (
                            <div
                              key={k}
                              className="flex items-center justify-between text-xs py-1 border-b border-border/40"
                            >
                              <span className="text-muted-foreground truncate mr-2">
                                {k.replace(/_/g, " ")}
                              </span>
                              <span className="font-mono text-foreground">
                                {(v as number).toFixed(3)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default HistoryScreen;
