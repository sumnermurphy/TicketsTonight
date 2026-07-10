# Gallery Walk Review Notes

## What This Branch Proves
- TicketsTonight is refocused into a gallery-walk discovery app with verified gallery inventory, route planning, route stop swapping, active-walk state, Taste Passport personalization, beta-preview tasks, a professional mobile web shell, source trust labels, and local persistence.
- NYC is the primary market for verified inventory depth: the current audit reports 62 NYC exhibitions with 50 imported/manual official-page records. Hudson Warren Street remains the small-market honesty test with 10 exhibitions and 2 imported/manual records. LA remains secondary coverage.
- The app intentionally distinguishes manually verified official-page inventory from fixture/demo, submitted, stale, and needs-review records.

## Demo Path
- Start the app on web and choose NYC.
- Confirm desktop still shows the visual hero, first-run choices, beta task checklist, resume-walk path when applicable, verified inventory counts, personalized modules, and a freshness queue.
- On mobile web, confirm the first viewport is a polished app shell with location/date, visual featured recommendation, one primary walk CTA, compact trust row, useful-tonight feed, and bottom tabs for Tonight, Walk/Walking, For You, and Passport.
- Switch route modes across quick loop, 2-hour walk, opening-night, last-chance, and For you.
- Use a route "Swap" action from the route preview or stop list and confirm a nearby verified/source-backed replacement updates the draft or active route.
- Start a NYC walk, mark a stop visited, and confirm the route map updates current/next/visited state.
- Open an exhibition detail sheet and confirm the source receipt shows the official evidence label, checked date, and official gallery link when available.
- Save a beta feedback note, copy or email the generated report, and confirm the feedback count and beta task progress persist after refresh.
- Switch to Hudson and confirm the app stays honest about thinner verified supply.

## Current Trust Model
- `Official page checked ...` means the exhibition is backed by checked-in manually verified official gallery metadata.
- `Needs review` means a source or record exists but should not be featured as current verified inventory without a manual re-check.
- `Fixture/demo` means seeded demo inventory and must not be treated as live exhibition supply.
- Source receipts are derived from local metadata only; the app does not scrape gallery pages at runtime.

## Route Map Behavior
- The route preview uses existing stop coordinates to draw a static map-like canvas with projected pins, route line, walking-time labels, and current/next/visited/skipped states.
- Route confidence is a deterministic local score based on verified stops, open/timing usability, distance, source-review risk, and route readiness.
- Pin taps focus a stop in the planner. Focused stops and stop rows expose ranked swap candidates with reasons such as closer, open now, verified source, better taste match, and avoids repeat gallery.
- Draft route swaps do not overwrite an active walk. Active-walk swaps update ordered stops while preserving visited/skipped progress when possible.
- The explicit map buttons remain the external navigation handoff.
- External Google Maps links remain the navigation handoff for the full route and each stop.
- This branch does not add a map SDK, live geolocation, backend routing, auth, checkout, Spotify, concerts/ticketing, native packaging, or the ops console.

## Beta Preview + Mobile Web
- The first-run surface now behaves like a beta preview path instead of a feature wall: users can find a walk, take the taste quiz, resume an active walk, or step through seven focused beta tasks.
- Beta tasks are local-only and persist with the rest of gallery app state: find a walk, take quiz, start route, swap stop, mark visited, check Hudson, and send feedback.
- The beta feedback panel stores notes locally and can generate a compact report for review, without introducing analytics, auth, or backend sync.
- Mobile web now has a fixed bottom command surface for the highest-frequency actions. It is a PWA-readiness step, not native packaging.
- `app.json` now includes web name, short name, theme color, background color, and square icon metadata so the project is closer to an installable mobile-web shell later.
- Checked-in gallery images and inventory continue to support an offline-friendly preview stance without adding a service worker.

## Known Limitations
- Route confidence does not use live location, transit disruptions, weather, or real-time gallery capacity.
- Source receipts are evidence labels from checked-in verified metadata, not live page fetches.
- The map preview is intentionally schematic; Google Maps remains the source of truth for turn-by-turn walking.
- Route editing is a practical swap flow, not drag-and-drop route editing or full optimization.
- Beta feedback is stored only in local browser state; there is no team inbox or remote issue pipeline yet.
- PWA readiness is metadata, square icons, checked-in image/data assumptions, and mobile shell polish only; no service worker, offline cache, push notifications, or install prompt has been added.

## Validation Checklist
- `npm run typecheck`
- `npm run test:services`
- `npm run audit:galleries`
- Browser smoke on localhost: first-run actions, NYC inventory/trust labels, route modes, route swap, active walk progress after refresh, source receipts, map-like route preview, Hudson thin-market fallback, and no console errors.
- Browser smoke on mobile viewport: beta task checklist, persistent reset demo action, feedback save/report actions, bottom command bar, and no console errors.
