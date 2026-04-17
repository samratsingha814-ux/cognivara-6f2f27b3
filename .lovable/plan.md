
The user wants two things:

1. **Mobile-optimized layout / collapsible sidebar**: Convert the fixed `w-56` sidebar into a slide-in/out drawer using shadcn's Sidebar primitives (or a Sheet). On mobile it should be hidden by default with a hamburger trigger; on desktop it should be collapsible to an icon-rail. The main content should fill width without being awkwardly wide.

2. **Fix CSI score showing no result**: The CSI ring on HomeScreen / DashboardScreen isn't displaying a value. I need to check how CSI is currently being read. Looking at `Index.tsx`: `dashboard` only gets fetched after `baseline_ready` (3 sessions). Before that, `latestUpload.csi` exists but HomeScreen only receives `dashboard`. The pre-UI-redesign behavior likely showed the latest CSI from any upload. I'll wire `latestUpload.csi` as a fallback so the score shows after every recording, not just session 3+.

## Plan

### 1. Responsive collapsible sidebar
- Refactor `AppSidebar.tsx` to use shadcn `Sidebar` primitives (`Sidebar`, `SidebarProvider`, `SidebarTrigger`) with `collapsible="offcanvas"` on mobile and `collapsible="icon"` on desktop.
- Wrap the app shell in `Index.tsx` with `SidebarProvider` and a `min-h-screen flex w-full` container.
- Add a persistent `SidebarTrigger` (hamburger) inside `TopBar.tsx` so users can always slide the sidebar in/out.
- Make `TopBar.tsx` mobile-friendly: hide the search/sub-tabs on small screens, keep only logo + trigger + sync + avatar.
- Tighten main content padding for narrow viewports so the app feels phone-appropriate (`px-4 sm:px-6`), and let `HomeScreen`/`DashboardScreen` grids stack to single column on mobile (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`).

### 2. Fix CSI score on Home/Dashboard
- In `Index.tsx`, pass `latestUpload` to `HomeScreen` as well.
- In `HomeScreen.tsx`, compute the displayed CSI as `dashboard?.latest_csi ?? latestUpload?.csi ?? null` so the ring populates immediately after the first recording (matching pre-redesign behavior).
- Same fallback in `DashboardScreen.tsx` for the headline CSI number.
- If CSI is `null`, show a clear "Awaiting first recording" placeholder instead of an empty ring.

### Files to change
- `src/components/AppSidebar.tsx` — rewrite using shadcn Sidebar primitives, responsive collapsible.
- `src/components/TopBar.tsx` — add `SidebarTrigger`, hide non-essential elements on mobile.
- `src/pages/Index.tsx` — wrap in `SidebarProvider`, pass `latestUpload` to HomeScreen, tighten main padding.
- `src/components/HomeScreen.tsx` — accept `latestUpload`, fall back CSI value, responsive grid.
- `src/components/DashboardScreen.tsx` — same CSI fallback, responsive grid for biomarker cards.

No backend or API changes required.
