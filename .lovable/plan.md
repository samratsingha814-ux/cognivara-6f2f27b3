Two issues to address.

## Issue 1 — Mobile: "recorded audio could not be prepared for upload" on 2nd recording

### Root cause
`convertAudioBlobToWav` in `src/lib/audio.ts` throws a generic error whenever `decodeAudioData` fails. On mobile (iOS Safari especially) the failure on the **second** recording is caused by:
1. `getPreferredAudioMimeType()` picks `audio/webm;codecs=opus` first — iOS Safari reports `isTypeSupported` true for `audio/mp4` but actually produces broken webm chunks on subsequent recordings.
2. In `RecordScreen.handleStop`, we wait for `recorder.onstop` but never call `recorder.requestData()` first, so on the second cycle `audioChunksRef.current` can be empty/short → `decodeAudioData` rejects.
3. The previous `MediaStream` tracks are only stopped inside the `if (recorder.state !== "inactive")` block — if the recorder already auto-stopped (timer/track-ended) the mic stream stays half-open, which on iOS causes the next `getUserMedia` call to return a degraded stream.

### Fix (3 small changes)
1. **`src/lib/audio.ts`** — reorder MIME candidates to prefer `audio/mp4` on Safari, and add a graceful fallback: if `decodeAudioData` fails but the blob has bytes, return the original blob (backend already accepts webm/mp4). Only throw when the blob is truly empty.
2. **`src/components/RecordScreen.tsx` — `handleStop`**:
   - Call `recorder.requestData()` before `recorder.stop()` so the final chunk is always emitted.
   - Always stop all stream tracks in a `finally`-style block, not only when recorder was active.
   - Guard: if `audioChunksRef.current` is empty after stop, show "No audio captured — please try again" instead of attempting conversion.
   - Null out `mediaRecorderRef.current` and `audioChunksRef.current = []` at the end of every cycle.
3. **`src/lib/audio.ts` — `getPreferredAudioMimeType`**: detect Safari/iOS via `navigator.userAgent` and prefer `audio/mp4` first on those platforms.

No backend changes.

## Issue 2 — "Higher CSI means worse, you're calculating it wrong"

### What the backend actually returns
From the latest upload responses for user 7:

```
session 69: csi_score 53, risk_level "low", interpretation "...CSI 53/100, risk level low"
session 70: csi_score 68, risk_level "low"
session 71: csi_score 77, risk_level "low"
biomarker_interpretation: "Cognitive speech patterns appear stable..."
raw_csi_score (pre-penalty) 79 → csi_score 53 after drift_penalty
```

The backend's convention is **higher CSI = more stable / healthier** (it subtracts a `drift_penalty` from `raw_csi_score`, so a lower final CSI means more drift was detected). The label "low risk" is reported at both 53 and 77 because `risk_level` is bucketed separately from the score itself.

So the current frontend math (`stress = (100 - csi) * 0.6 + drift * 40`, treating high CSI as good) **matches the backend**. However the user expects the opposite convention (a "Cognitive Stress Index" where higher = worse), which is the more common clinical reading.

### Fix — show both, and label clearly
Rather than fight the backend, surface the score in the direction the user expects while keeping backend semantics intact:

1. **Add helper `getRiskScore(csi) = 100 - csi`** in `src/services/cognivaraApi.ts`. Risk score: higher = worse.
2. **`HomeScreen.tsx` "Morning Baseline" ring**: keep showing CSI but relabel from "OPTIMAL/MODERATE/LOW" to explicit `Stability {csi}/100 · Risk {100-csi}/100` so direction is unambiguous, and invert the threshold colors (green when CSI ≥ 70, red when CSI < 40).
3. **`DashboardScreen.tsx` CSI Score card**: rename header to "Cognitive Stability Index (CSI)" and add a sub-line "Higher = more stable. Risk score: {100 - csi}". Keep the numeric `csi` so it still matches backend logs.
4. **`mapFeaturesToCards` "Stress" card**: already uses `(100 - csi)` correctly — confirm the label tooltip reads "Higher = more stress" so a 23% stress reading at CSI 77 makes sense to the user.

No change to the backend score, no change to the math driving the 6 biomarker cards — only labels, colors, and an added risk-score readout so the user can read either direction.

## Files to change
- `src/lib/audio.ts` — MIME priority + graceful decode fallback
- `src/components/RecordScreen.tsx` — `requestData()`, track cleanup, empty-chunk guard
- `src/services/cognivaraApi.ts` — add `getRiskScore` helper
- `src/components/HomeScreen.tsx` — relabel CSI ring with explicit direction
- `src/components/DashboardScreen.tsx` — relabel CSI card with "higher = more stable" + risk-score sub-line
