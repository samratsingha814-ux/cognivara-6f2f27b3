/**
 * COGNIVARA API Service
 * 
 * Replace BASE_URL with your actual COGNIVARA backend URL.
 * All methods return mock data for now — swap with real fetch calls.
 */

const BASE_URL = "https://cognivara-backend.onrender.com/api/v1";

export interface RecordingSession {
  id: string;
  date: string;
  duration: number;
  transcript: string;
  wordCount: number;
  riskScore: number;
  stress: number;
  pitch: number;
  hesitation: number;
  complexity: number;
  fluency: number;
  emotionalStability: number;
}

export interface CognitiveProfile {
  riskScore: number;
  riskLevel: "low" | "moderate" | "elevated";
  emotionalStability: number;
  cognitiveComplexity: number;
  speechFluency: number;
  totalRecordings: number;
  baselineEstablished: boolean;
  trends: { day: string; score: number }[];
}

export interface ReferencePatient {
  id: string;
  name: string;
  status: string;
  riskScore: number;
  csi: number;
}

// --- Mock helpers ---
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

const mockSession = (transcript: string, sessionNum: number): RecordingSession => ({
  id: crypto.randomUUID(),
  date: new Date().toISOString(),
  duration: 30,
  transcript,
  wordCount: transcript.split(/\s+/).filter(Boolean).length,
  riskScore: Math.round(15 + Math.random() * 50),
  stress: Math.round(20 + Math.random() * 40),
  pitch: Math.round(30 + Math.random() * 50),
  hesitation: Math.round(10 + Math.random() * 35),
  complexity: Math.round(40 + Math.random() * 45),
  fluency: Math.round(50 + Math.random() * 40),
  emotionalStability: Math.round(55 + Math.random() * 35),
});

// --- API Methods ---

/** Submit a voice recording for analysis */
export async function submitRecording(audioBlob: Blob, transcript: string): Promise<RecordingSession> {
  // TODO: Replace with real API call
  // const formData = new FormData();
  // formData.append("audio", audioBlob);
  // formData.append("transcript", transcript);
  // const res = await fetch(`${BASE_URL}/recordings`, { method: "POST", body: formData });
  // return res.json();
  
  await delay(2000);
  return mockSession(transcript, 1);
}

/** Fetch the user's cognitive profile */
export async function getCognitiveProfile(): Promise<CognitiveProfile> {
  // TODO: const res = await fetch(`${BASE_URL}/profile`); return res.json();
  
  await delay(800);
  return {
    riskScore: Math.round(20 + Math.random() * 40),
    riskLevel: "low",
    emotionalStability: Math.round(60 + Math.random() * 30),
    cognitiveComplexity: Math.round(50 + Math.random() * 40),
    speechFluency: Math.round(55 + Math.random() * 35),
    totalRecordings: 3,
    baselineEstablished: true,
    trends: Array.from({ length: 7 }, (_, i) => ({
      day: `Day ${i + 1}`,
      score: Math.round(25 + Math.random() * 35),
    })),
  };
}

/** Fetch recording history */
export async function getRecordingHistory(): Promise<RecordingSession[]> {
  // TODO: const res = await fetch(`${BASE_URL}/recordings`); return res.json();
  
  await delay(600);
  return Array.from({ length: 5 }, (_, i) => ({
    ...mockSession(`Session ${i + 1} transcript placeholder text.`, i + 1),
    date: new Date(Date.now() - i * 86400000).toISOString(),
  }));
}

/** Fetch reference patients for comparison */
export async function getReferencePatients(): Promise<ReferencePatient[]> {
  await delay(400);
  return [
    { id: "a", name: "Patient A", status: "Stable", riskScore: 22, csi: 78 },
    { id: "b", name: "Patient B", status: "Worsening", riskScore: 68, csi: 35 },
    { id: "c", name: "Patient C", status: "Recovery", riskScore: 38, csi: 62 },
  ];
}
