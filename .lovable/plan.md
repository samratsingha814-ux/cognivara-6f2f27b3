## Issue 1 — Edge function 504 `IDLE_TIMEOUT` on upload

### Root cause
`supabase/functions/cognivara-proxy` opens a fetch to Render and `await`s the full response. Supabase edge functions have a hard **150s idle timeout**; when Render is cold-starting, audio analysis takes longer than 150s and the proxy is killed before Render replies. The current retry on the client just repeats the same 150s wait.

### Fix
Two complementary changes:

1. **Aggressive warmup before upload** (`src/services/cognivaraApi.ts`)
   - New `ensureBackendWarm()`: polls `proxyUrl("health")` every 2s for up to 45s, resolves as soon as health returns `{ status: "healthy" }` (or similar 200).
   - `RecordScreen` calls it on mount AND `uploadSession` awaits it before the first POST. This means by the time the user finishes a 30s recording, Render is already warm, so analysis fits inside 150s.
   - Keep the one-time retry, but only retry after another `ensureBackendWarm()` succeeds.

2. **Skip the proxy for `/upload`** when possible (`src/services/cognivaraApi.ts`)
   - The Render backend already returns permissive CORS for `/api/upload` (verified via the dashboard/sessions calls that work directly). Send the multipart POST straight to `https://cognivara-backend-service.onrender.com/api/upload`, bypassing the 150s edge function ceiling entirely. Render itself allows long requests.
   - Keep the proxy as a fallback if the direct call fails with a network/CORS error.

(No edge-function code change needed — the proxy stays for non-upload calls.)

## Issue 2 — Mobile: 2nd recording fails with "could not be prepared for upload"

### Root cause
On iOS Safari, the second `MediaRecorder` cycle frequently emits a single tiny `ondataavailable` chunk that lacks the container header (because the first cycle's `AudioContext` left the audio worklet in a bad state and `decodeAudioData` rejects). Our fallback in `convertAudioBlobToWav` returns the original blob on decode failure, but the blob from iOS sometimes is `<1 KB` of orphaned media data that the backend rejects with a 400 — surfaced in the UI as the same "could not be prepared" message that's wrapped around the upload error.

Additionally, `recorder.requestData()` followed immediately by `recorder.stop()` on iOS sometimes fires `onstop` before the requested chunk arrives, so the final segment is dropped.

### Fix (`src/components/RecordScreen.tsx` + `src/lib/audio.ts`)

1. **Wait for the final chunk explicitly** — in `handleStop`, instead of relying on `onstop`, attach a `ondataavailable` handler and resolve only when we receive a chunk *after* `stop()`. Add a 1.5s safety timeout.
2. **Drop tiny blobs early** — in `RecordScreen`, after assembling `recordedBlob`, if `size < 2048` bytes show "Recording too short or no audio captured — please try again" instead of attempting upload.
3. **Force a fresh `AudioContext` per call** — already done, but also ensure the previous context's `close()` actually awaits before the next cycle. Add `await new Promise(r => setTimeout(r, 150))` after track cleanup on iOS to let Safari release the mic hardware.
4. **Reset MIME priority on retry** — if the second recording's blob is invalid, reinitialize `MediaRecorder` without a `mimeType` argument (let Safari pick its native default) on the next attempt.

## Files to change

- `src/services/cognivaraApi.ts` — add `ensureBackendWarm()`, switch `uploadSession` to direct backend URL with proxy fallback.
- `src/components/RecordScreen.tsx` — robust stop sequence, tiny-blob guard, iOS settle delay, MIME fallback on retry.
- `src/lib/audio.ts` — keep graceful decode fallback; no functional change beyond what's already there.

No backend or edge-function changes.
