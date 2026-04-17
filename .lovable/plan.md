
The Stress and Emotional Stability cards show `NaN%` because both `deriveStress` and `deriveEmotionalStability` in `src/services/cognivaraApi.ts` use `csi` directly in math (`(100 - csi) * 0.6 + ...` and `csi * 0.7 + ...`). When `csi` is `null` or `undefined` (which happens before baseline_ready, i.e. before 3 sessions), the early `return 0` only triggers on `csi == null`, but if `csi` is passed as `undefined` from `cards[meta.key]` chain it's fine — the real culprit is the `drift` math: `Object.values(drift).reduce(...) / Math.max(Object.keys(drift).length, 1)` returns `NaN` when drift values contain non-numbers, and `Math.abs(NaN)` stays `NaN`, poisoning the result.

Additionally, `mapFeaturesToCards` is called with `csi` that could be `null`, and the guard `if (csi == null) return 0` works — but in `DashboardScreen` the call is `mapFeaturesToCards(features, csi, drift)` where `drift` might be an object with nested non-numeric values from the backend, causing `reduce((a,b) => a+b)` to produce `NaN`.

## Fix

Update `src/services/cognivaraApi.ts`:

1. **`deriveStress`** and **`deriveEmotionalStability`**: sanitize drift values — filter to finite numbers only before reducing. Fall back to `0` when no valid drift entries exist. Wrap final result in `Number.isFinite()` check, return `0` if NaN.

2. Add a small `safeDriftMag(drift)` helper that:
   - Returns `0` if drift is null/undefined/empty
   - Filters `Object.values(drift)` to only finite numbers
   - Returns `0` if no finite values remain
   - Otherwise returns `Math.abs(sum / count)`

3. Apply final `Number.isFinite(result) ? result : 0` guard in both derive functions.

### Files to change
- `src/services/cognivaraApi.ts` — harden `deriveStress` and `deriveEmotionalStability` against non-numeric drift values and NaN propagation.

No UI or backend changes needed.
