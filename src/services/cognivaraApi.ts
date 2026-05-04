/**
 * COGNIVARA API Service — Real Backend
 * All requests are proxied through an edge function to avoid CORS issues.
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const PROXY_BASE = `${SUPABASE_URL}/functions/v1/cognivara-proxy`;

function proxyUrl(path: string): string {
  return `${PROXY_BASE}?path=${encodeURIComponent(path)}`;
}

// ─── Response Types ───

export interface CreateUserResponse {
  user_id: number;
  name: string;
  email: string;
  age: number | null;
  gender: string | null;
  latest_csi_score: number | null;
  total_sessions: number;
  last_session_at: string | null;
  status: string;
}

export interface UploadResponse {
  session_id: number;
  session_number: number;
  user_id: number;
  user_latest_csi_score: number | null;
  user_total_sessions: number;
  preprocessing: Record<string, unknown>;
  acoustic_features: Record<string, number>;
  temporal_features: Record<string, number>;
  linguistic_features: Record<string, number>;
  baseline_ready: boolean;
  z_scores: Record<string, number> | null;
  drift: Record<string, number> | null;
  csi: number | null;
  analysis_mode: string;
}

export interface DashboardUser {
  user_id: number;
  name: string;
  email: string;
  latest_csi_score: number | null;
  total_sessions: number;
}

export interface DashboardResponse {
  user: DashboardUser;
  session_count: number;
  baseline_ready: boolean;
  baseline_sessions: number;
  latest_csi: number | null;
  latest_risk_level: string | null;
  flagged_features: string[];
  feature_summary: Record<string, number>;
  trends: { session_number: number; csi: number; created_at: string }[];
}

export interface SessionEntry {
  id: number;
  session_number: number;
  transcript: string | null;
  acoustic_features: Record<string, number>;
  temporal_features: Record<string, number>;
  linguistic_features: Record<string, number>;
  z_scores: Record<string, number> | null;
  csi_score: number | null;
  created_at: string;
}

export interface SessionsResponse {
  user_id: number;
  session_count: number;
  sessions: SessionEntry[];
}

export interface AnalyzeResponse {
  linguistic_features: Record<string, number>;
  baseline_ready: boolean;
  z_scores: Record<string, number> | null;
  drift: Record<string, number> | null;
  csi: number | null;
}

export interface HealthResponse {
  status: string;
  [key: string]: unknown;
}

// ─── Local user_id storage ───

const USER_ID_KEY = "cognivara_user_id";

export function getStoredUserId(): string | null {
  return localStorage.getItem(USER_ID_KEY);
}

export function setStoredUserId(userId: string | number) {
  localStorage.setItem(USER_ID_KEY, String(userId));
}

export function clearStoredUserId() {
  localStorage.removeItem(USER_ID_KEY);
}

// ─── API Methods ───

export async function checkHealth(): Promise<HealthResponse> {
  const res = await fetch(proxyUrl("health"));
  if (!res.ok) throw new Error(`Health check failed: ${res.status}`);
  return res.json();
}

/** POST /api/user — multipart/form-data */
export async function createUser(data: {
  name: string;
  email: string;
  age?: number;
  gender?: string;
  password?: string;
}): Promise<CreateUserResponse> {
  const formData = new FormData();
  formData.append("name", data.name);
  formData.append("email", data.email);
  if (data.age != null) formData.append("age", String(data.age));
  if (data.gender) formData.append("gender", data.gender);
  if (data.password) formData.append("password", data.password);

  const res = await fetch(proxyUrl("user"), {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`User creation failed (${res.status}): ${text}`);
  }
  const result: CreateUserResponse = await res.json();
  if (result.user_id != null) {
    setStoredUserId(result.user_id);
  }
  return result;
}

/** POST /api/upload — multipart/form-data */
export async function uploadSession(
  userId: string,
  audioBlob: Blob,
  transcript: string = "",
  filename: string = "recording.webm"
): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("user_id", userId);
  formData.append("audio", audioBlob, filename);
  if (transcript) formData.append("transcript", transcript);

  // Retry once on cold-start timeout (Render backend sleeps after inactivity)
  for (let attempt = 0; attempt < 2; attempt++) {
    const res = await fetch(proxyUrl("upload"), { method: "POST", body: formData });
    if (res.ok) return res.json();

    const text = await res.text().catch(() => "");
    const isTimeout = res.status === 504 || text.includes("IDLE_TIMEOUT");
    if (isTimeout && attempt === 0) {
      // Warm up the backend then retry
      try { await fetch(proxyUrl("health")); } catch {}
      await new Promise((r) => setTimeout(r, 1500));
      continue;
    }
    throw new Error(
      isTimeout
        ? "The analysis server is waking up from sleep. Please try recording again in 30 seconds."
        : `Upload failed (${res.status}): ${text}`
    );
  }
  throw new Error("Upload failed after retry");
}

/** Ping backend to wake it from cold-start sleep. Fire-and-forget. */
export function warmupBackend(): void {
  fetch(proxyUrl("health")).catch(() => {});
}

/** GET /api/dashboard/{user_id} */
export async function getDashboard(userId: string): Promise<DashboardResponse> {
  const res = await fetch(proxyUrl(`dashboard/${userId}`));
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Dashboard fetch failed (${res.status}): ${text}`);
  }
  return res.json();
}

/** GET /api/sessions/{user_id} */
export async function getSessions(userId: string): Promise<SessionsResponse> {
  const res = await fetch(proxyUrl(`sessions/${userId}`));
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Sessions fetch failed (${res.status}): ${text}`);
  }
  return res.json();
}

/** POST /api/analyze — JSON body */
export async function analyzeText(userId: string, text: string): Promise<AnalyzeResponse> {
  const res = await fetch(proxyUrl("analyze"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: Number(userId), text }),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Analyze failed (${res.status}): ${txt}`);
  }
  return res.json();
}

// ─── Biomarker mapping helpers ───

/**
 * Map 30 raw backend features into 6 UI cards.
 * Accepts merged acoustic + temporal + linguistic features.
 */
export function mapFeaturesToCards(features: Record<string, unknown>, csi?: number | null, drift?: Record<string, number> | null) {
  const safe = (key: string): number | null => {
    const v = features?.[key];
    return typeof v === "number" && Number.isFinite(v) ? v : null;
  };

  return {
    stress: deriveStress(csi, drift),
    pitch: derivePitch(safe("pitch_mean"), safe("pitch_var")),
    hesitation: deriveHesitation(safe("pause_variability"), safe("pause_count"), safe("response_latency")),
    complexity: deriveComplexity(safe("syntactic_complexity"), safe("sentence_length_mean"), safe("vocabulary_richness")),
    fluency: deriveFluency(safe("speech_rate"), safe("speech_ratio"), safe("rhythm_consistency")),
    emotionalStability: deriveEmotionalStability(csi, drift),
  };
}

function safeDriftMag(drift?: Record<string, unknown> | null): number {
  if (!drift || typeof drift !== "object") return 0;
  const d = drift as Record<string, unknown>;

  // Backend shape: { per_feature: {...}, overall_drift_score: number, ... }
  if (typeof d.overall_drift_score === "number" && Number.isFinite(d.overall_drift_score)) {
    return Math.min(1, Math.abs(d.overall_drift_score as number));
  }

  // Fallback: average |current_z| across per_feature entries
  const perFeature = d.per_feature as Record<string, { current_z?: unknown }> | undefined;
  if (perFeature && typeof perFeature === "object") {
    const zs = Object.values(perFeature)
      .map((f) => (f && typeof f.current_z === "number" ? f.current_z : NaN))
      .filter((v) => Number.isFinite(v))
      .map((v) => Math.abs(v as number));
    if (zs.length > 0) {
      const mean = zs.reduce((a, b) => a + b, 0) / zs.length;
      // z-scores typically 0–3; normalize to ~0–1 by dividing by 3
      return Math.min(1, mean / 3);
    }
  }

  // Legacy flat shape: average finite numeric values
  const finite = Object.values(d).filter((v): v is number => typeof v === "number" && Number.isFinite(v));
  if (finite.length === 0) return 0;
  const mag = Math.abs(finite.reduce((a, b) => a + b, 0) / finite.length);
  return Number.isFinite(mag) ? Math.min(1, mag) : 0;
}

function deriveStress(csi?: number | null, drift?: Record<string, number> | null): number {
  if (csi == null || !Number.isFinite(csi)) return 0;
  const driftMag = safeDriftMag(drift);
  const result = Math.round(Math.min(100, Math.max(0, (100 - csi) * 0.6 + driftMag * 40)));
  return Number.isFinite(result) ? result : 0;
}

function derivePitch(mean: number | null, variance: number | null): number {
  if (mean == null) return 0;
  // Normalize pitch_mean (typical 80-300 Hz) to 0-100
  const normalized = Math.min(100, Math.max(0, ((mean - 80) / 220) * 100));
  return Math.round(normalized);
}

function deriveHesitation(pauseVar: number | null, pauseCount: number | null, latency: number | null): number {
  let score = 0;
  let factors = 0;
  if (pauseVar != null) { score += Math.min(100, pauseVar * 100); factors++; }
  if (pauseCount != null) { score += Math.min(100, pauseCount * 5); factors++; }
  if (latency != null) { score += Math.min(100, latency * 50); factors++; }
  return factors > 0 ? Math.round(score / factors) : 0;
}

function deriveComplexity(syntactic: number | null, sentLen: number | null, vocabRich: number | null): number {
  let score = 0;
  let factors = 0;
  if (syntactic != null) { score += Math.min(100, syntactic * 20); factors++; }
  if (sentLen != null) { score += Math.min(100, sentLen * 5); factors++; }
  if (vocabRich != null) { score += Math.min(100, vocabRich * 100); factors++; }
  return factors > 0 ? Math.round(score / factors) : 0;
}

function deriveFluency(rate: number | null, ratio: number | null, rhythm: number | null): number {
  let score = 0;
  let factors = 0;
  if (rate != null) { score += Math.min(100, rate * 25); factors++; }
  if (ratio != null) { score += Math.min(100, ratio * 100); factors++; }
  if (rhythm != null) { score += Math.min(100, rhythm * 100); factors++; }
  return factors > 0 ? Math.round(score / factors) : 0;
}

function deriveEmotionalStability(csi?: number | null, drift?: Record<string, number> | null): number {
  if (csi == null || !Number.isFinite(csi)) return 0;
  const driftMag = safeDriftMag(drift);
  const result = Math.round(Math.min(100, Math.max(0, csi * 0.7 + (1 - Math.min(1, driftMag)) * 30)));
  return Number.isFinite(result) ? result : 0;
}
