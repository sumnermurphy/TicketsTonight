# Gallery Walk Review Notes

## What This Branch Proves
- TicketsTonight is refocused into a gallery-walk discovery app with verified gallery inventory, route planning, active-walk state, Taste Passport personalization, source trust labels, and local persistence.
- NYC is the primary market for verified inventory depth. Hudson Warren Street remains the small-market honesty test. LA remains secondary coverage.
- The app intentionally distinguishes manually verified official-page inventory from fixture/demo, submitted, stale, and needs-review records.

## Demo Path
- Start the app on web and choose NYC.
- Confirm the first screen shows modern discovery UI, verified inventory counts, personalized modules, and a freshness queue.
- Switch route modes across quick loop, 2-hour walk, opening-night, last-chance, and For you.
- Start a NYC walk, mark a stop visited, and confirm the route map updates current/next/visited state.
- Open an exhibition detail sheet and confirm the source receipt shows the official evidence label, checked date, and official gallery link when available.
- Switch to Hudson and confirm the app stays honest about thinner verified supply.

## Current Trust Model
- `Official page checked ...` means the exhibition is backed by checked-in manually verified official gallery metadata.
- `Needs review` means a source or record exists but should not be featured as current verified inventory without a manual re-check.
- `Fixture/demo` means seeded demo inventory and must not be treated as live exhibition supply.
- Source receipts are derived from local metadata only; the app does not scrape gallery pages at runtime.

## Route Map Behavior
- The route preview uses existing stop coordinates to draw a static map-like canvas with projected pins, route line, walking-time labels, and current/next/visited/skipped states.
- External Google Maps links remain the navigation handoff for the full route and each stop.
- This branch does not add a map SDK, live geolocation, backend routing, auth, checkout, Spotify, concerts/ticketing, native packaging, or the ops console.

## Validation Checklist
- `npm run typecheck`
- `npm run test:services`
- `npm run audit:galleries`
- Browser smoke on localhost: NYC inventory/trust labels, route modes, active walk progress, source receipts, map-like route preview, Hudson thin-market fallback, and no console errors.
