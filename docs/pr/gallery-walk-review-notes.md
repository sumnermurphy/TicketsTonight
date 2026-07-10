# Walker Review Notes

## What This Branch Proves
- Walker is a gallery and cultural-walk companion with verified gallery inventory, route planning, route stop swapping, active-walk state, taste personalization, beta-preview actions, route usability warnings, a premium mobile web shell, source trust labels, and local persistence.
- NYC is the primary market for verified inventory depth: the beta target is now at least 60 imported/manual official-page records. Hudson has at least 5 imported/manual Hudson-market records, while Warren Street remains clearly labeled as the smaller walking test. LA remains secondary coverage.
- The app intentionally distinguishes manually verified official-page inventory from fixture/demo, submitted, stale, and needs-review records.

## Demo Path
- Start the app on web and choose NYC.
- Confirm desktop still shows the visual hero, first-run choices, beta task checklist, resume-walk path when applicable, verified inventory counts, personalized modules, and a freshness queue.
- On mobile web, confirm the first viewport is a Walker app shell with the compass/wordmark, location/date context, visual featured recommendation, one primary walk CTA, compact trust row, Open Now feed, and bottom tabs for Tonight, Walk/Walking, For You, and Journal.
- Switch route modes across quick loop, 2-hour walk, opening-night, last-chance, and For you.
- Use a route "Swap" action from the route preview or stop list and confirm a nearby verified/source-backed replacement updates the draft or active route.
- Start a NYC walk, mark a stop visited, and confirm the route map updates current/next/visited state.
- Open an exhibition detail sheet and confirm the place-confidence card, source receipt, checked date, and official gallery link are visible when available.
- Save a beta feedback note, copy or email the generated report, and confirm the feedback count and beta task progress persist after refresh.
- Use the beta preview actions: Try a NYC walk, Try For You, Check Hudson, Send feedback, and Copy beta report.
- Switch to Hudson and confirm the app stays honest about thinner verified supply.

## Current Trust Model
- `Official page checked ...` means the exhibition is backed by checked-in manually verified official gallery metadata.
- `Needs review` means a source or record exists but should not be featured as current verified inventory without a manual re-check.
- `Fixture/demo` means seeded demo inventory and must not be treated as live exhibition supply.
- Source receipts are derived from local metadata only; the app does not scrape gallery pages at runtime.

## Route Map Behavior
- The route preview uses existing stop coordinates to draw a static map-like canvas with projected pins, route line, walking-time labels, and current/next/visited/skipped states.
- Route confidence is a deterministic local score based on verified stops, open/timing usability, distance, source-review risk, and route readiness.
- Route usability reports now add explicit open-now confidence, best-start reasoning, closed/closing-soon warnings, long-walk warnings, and "not enough verified stops" fallback copy.
- Pin taps focus a stop in the planner. Focused stops and stop rows expose ranked swap candidates with reasons such as closer, open now, verified source, better taste match, and avoids repeat gallery.
- Draft route swaps do not overwrite an active walk. Active-walk swaps update ordered stops while preserving visited/skipped progress when possible.
- The explicit map buttons remain the external navigation handoff.
- Full-route Google Maps links can now include the selected start point: first route stop, market center, neighborhood anchor, custom address, or browser coordinates when available.
- The route preview surfaces the selected start point, route confidence chips, and a map badge so testers can see what will be handed to external maps before opening them.
- Browser location is optional and falls back to the first route stop if coordinates are unavailable or permission is not granted.
- This branch does not add a map SDK, live geolocation, backend routing, auth, checkout, Spotify, concerts/ticketing, native packaging, or the ops console.

## Beta Preview + Mobile Web
- The first-run and beta preview surfaces now behave like a guided beta path instead of a feature wall: users can find a walk, take the taste quiz, resume an active walk, try NYC/Hudson/For You paths, or step through seven focused beta tasks.
- Beta tasks are local-only and persist with the rest of gallery app state: find a walk, take quiz, start route, swap stop, mark visited, check Hudson, and send feedback.
- The beta feedback panel stores notes locally, shows field-test context chips, and can generate a Walker review report with route mode, market, selected start point, current/next stop, active-walk state, verified/demo counts, route warnings, quick field tags, and tester notes, without introducing analytics, auth, or backend sync.
- Mobile web now has a fixed bottom command surface for the highest-frequency actions. It is a PWA-readiness step, not native packaging.
- `app.json` and `public/manifest.json` now use Walker web name, short name, display mode, theme/background colors, and square icon metadata so the project is closer to an installable mobile-web shell later.
- Checked-in gallery images and inventory continue to support an offline-friendly preview stance. Static web export now registers a lightweight Walker service worker for the app shell/local assets after first load.
- Walker image roles now separate city, neighborhood, gallery, and exhibit banners while labeling generated visuals as editorial placeholders rather than official gallery photography.

## Known Limitations
- Route confidence does not use live location, transit disruptions, weather, or real-time gallery capacity.
- Source receipts are evidence labels from checked-in verified metadata, not live page fetches.
- The map preview is intentionally schematic; Google Maps remains the source of truth for turn-by-turn walking.
- Route editing is a practical swap flow, not drag-and-drop route editing or full optimization.
- Beta feedback is stored only in local browser state; there is no team inbox or remote issue pipeline yet.
- PWA readiness is metadata, square icons, checked-in image/data assumptions, mobile shell polish, and a lightweight exported-web service worker. Official links, Google Maps, live hours verification, push notifications, and install prompts are still outside this branch.
- Static export is available with `npm run export:web`; preview deployment should use the checked-in source state and generated web export.

## Validation Checklist
- `npm run typecheck`
- `npm run test:services`
- `npm run audit:galleries`
- Browser smoke on localhost: first-run actions, NYC inventory/trust labels, route modes, route swap, active walk progress after refresh, source receipts, map-like route preview, Hudson thin-market fallback, and no console errors.
- Browser smoke on mobile viewport: beta preview actions, learning summary, persistent reset demo action, feedback save/report actions, bottom command bar, and no console errors.
- Static web export: `npm run export:web`.
