
Two changes:

1. **Enforce 3 recordings before showing CSI/dashboard insights**: Currently after 1 recording, `latestUpload.csi` falls back into HomeScreen/DashboardScreen and shows a score. Backend only sets `baseline_ready=true` after 3 sessions and returns `csi: null` until then — but we should also gate the UI explicitly so users see calibration progress (e.g. "1/3", "2/3") rather than a pre-baseline score that may briefly appear. Remove the `latestUpload.csi` fallback in HomeScreen/DashboardScreen so CSI only shows once `dashboard.baseline_ready` is true. Show a clear "X of 3 recordings complete" calibration card instead.

2. **Recording history view**: Add a new "History" screen that calls `getSessions(userId)` and lists each past session with: session number, date, transcript snippet, CSI score (if available), and a few key features. Add it to the bottom nav / sidebar.

## Plan

### Files to change
- `src/components/HomeScreen.tsx` — remove `latestUpload.csi` fallback for the score; only show CSI when `dashboard?.baseline_ready` is true. Otherwise show calibration progress (`session_count / 3`).
- `src/components/DashboardScreen.tsx` — same: gate CSI display behind `baseline_ready`. Show calibration prompt with progress bar otherwise.
- `src/components/HistoryScreen.tsx` — **new file**. Fetches sessions via `getSessions(userId)`, lists them in cards with session #, date, CSI badge, transcript preview, expandable feature details.
- `src/components/BottomNav.tsx` — add "History" tab (icon: `History` from lucide).
- `src/components/AppSidebar.tsx` — add "History" nav item.
- `src/pages/Index.tsx` — add `"history"` to active tab union, render `<HistoryScreen userId={userId} />` when active.

No backend / DB changes — `getSessions` endpoint already exists in `cognivaraApi.ts`.
