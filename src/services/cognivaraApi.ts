/**
 * COGNIVARA API Service — Real Backend
 */

const BASE_URL = "https://cognivara-backend-service.onrender.com/api";

// --- Response Types ---

export interface HealthResponse {
  status: string;
  [key: string]: unknown;
}

export interface CreateUserRequest {
  name: string;
  age: number;
  gender: string;
}

export interface CreateUserResponse {
  user_id: string;
  [key: string]: unknown;
}

export interface UploadResponse {
  session_id?: string;
  message?: string;
  [key: string]: unknown;
}

export interface DashboardResponse {
  user_id?: string;
  sessions_completed?: number;
  cognitive_score?: number;
  risk_score?: number;
  risk_level?: string;
  biomarkers?: Record<string, number>;
  summary?: string;
  trends?: { day: string; score: number }[];
  [key: string]: unknown;
}

export interface SessionResponse {
  id?: string;
  session_date?: string;
  duration?: number;
  transcript?: string;
  [key: string]: unknown;
}

// --- Local user_id storage ---

const USER_ID_KEY = "cognivara_user_id";

export function getStoredUserId(): string | null {
  return localStorage.getItem(USER_ID_KEY);
}

export function setStoredUserId(userId: string) {
  localStorage.setItem(USER_ID_KEY, userId);
}

export function clearStoredUserId() {
  localStorage.removeItem(USER_ID_KEY);
}

// --- API Methods ---

export async function checkHealth(): Promise<HealthResponse> {
  const res = await fetch(`${BASE_URL}/health`);
  if (!res.ok) throw new Error(`Health check failed: ${res.status}`);
  return res.json();
}

export async function createUser(data: CreateUserRequest): Promise<CreateUserResponse> {
  const res = await fetch(`${BASE_URL}/user`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`User creation failed: ${res.status}`);
  const result = await res.json();
  if (result.user_id) {
    setStoredUserId(result.user_id);
  }
  return result;
}

export async function uploadSession(
  userId: string,
  audioBlob: Blob,
  sessionNumber: number,
  transcript: string = ""
): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("user_id", userId);
  formData.append("session_number", String(sessionNumber));
  formData.append("audio", audioBlob, `session_${sessionNumber}.webm`);
  if (transcript) {
    formData.append("transcript", transcript);
  }

  const res = await fetch(`${BASE_URL}/upload`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
  return res.json();
}

export async function getDashboard(userId: string): Promise<DashboardResponse> {
  const res = await fetch(`${BASE_URL}/dashboard/${userId}`);
  if (!res.ok) throw new Error(`Dashboard fetch failed: ${res.status}`);
  return res.json();
}

export async function getSessions(userId: string): Promise<SessionResponse[]> {
  const res = await fetch(`${BASE_URL}/sessions/${userId}`);
  if (!res.ok) throw new Error(`Sessions fetch failed: ${res.status}`);
  return res.json();
}
