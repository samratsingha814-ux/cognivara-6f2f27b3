## Problem

Creating a neural profile hangs forever and eventually fails with `IDLE_TIMEOUT`. Root cause: `createUser` (and `getDashboard`, `getSessions`, `analyzeText`) still go through the `cognivara-proxy` edge function. When the Render backend is cold (sleeping after inactivity), the request sits inside the edge function past its 150s ceiling and the user sees a 504 / spinner-forever. Only `uploadSession` and health currently bypass the proxy.

## Fix (frontend only — `src/services/cognivaraApi.ts`)

1. **Generic direct-first request helper** `requestBackend(path, init)`:
   - Try `directUrl(path)` first.
   - On network/CORS error or 5xx, fall back to `proxyUrl(path)` once.
   - On 504 / `IDLE_TIMEOUT` text, run `ensureBackendWarm(60_000)` and retry the direct call once.
   - Returns the parsed JSON or throws a friendly error.

2. **`createUser`**:
   - Call `ensureBackendWarm()` before POSTing (so cold start happens before the user's click finishes).
   - Use the new helper instead of `proxyUrl("user")`.
   - Replace timeout errors with a clear "Server is waking up, please try again in ~30 seconds" message.

3. **`getDashboard`, `getSessions`, `analyzeText`**:
   - Switch to the new helper so they no longer get killed by the edge timeout.

4. **`uploadSession`**:
   - Refactor to reuse the same helper for consistency (keep current 2-attempt warm-then-retry behaviour).

5. **Onboarding UX (`src/components/OnboardingScreen.tsx`)**:
   - On mount, fire `warmupBackend()` so Render is already starting while the user fills the form.
   - Surface the friendlier error string from the API service unchanged.

6. **Home/Dashboard screens**: no logic change — they already call the API methods, which now route through the helper.

No backend, edge function, or schema changes. No UI redesign.

## Files touched

- `src/services/cognivaraApi.ts` — add `requestBackend`, refactor `createUser` / `getDashboard` / `getSessions` / `analyzeText` / `uploadSession`.
- `src/components/OnboardingScreen.tsx` — fire `warmupBackend()` from a `useEffect` on mount.
