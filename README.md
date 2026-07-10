# TicketsTonight Gallery Walk

TicketsTonight is currently focused as a gallery-walk discovery app. The active review surface helps a user decide what is worth seeing tonight, which galleries are open, which neighborhoods can support a walk, and which listings are verified versus fixture/demo inventory.

This branch intentionally replaces the legacy iOS-era TicketsTonight app tree with a modern Expo React Native app. The older concerts, ticketing, checkout, and Spotify seams remain present in services for future reuse, but they are not the active product surface in this PR.

## Review Snapshot

- Active app: `src/GalleryApp.tsx`, mounted from `src/App.tsx`.
- Primary market: New York gallery walks, with Chelsea, Tribeca, Lower East Side, Upper East Side, and Chinatown route support.
- Small-market test: Hudson Warren Street.
- Secondary market: Los Angeles remains covered but lower priority.
- Current data stance: verified/manual official-page inventory is clearly separated from fixture/demo, partner/submitted, and needs-review inventory.
- Draft PR: this branch is meant for review, not merge, until the repo replacement is accepted.

## What Is Built

- Gallery Walk Builder with quick loop, 2-hour walk, opening crawl, last-chance, and For you route modes.
- Map-like route planner with ordered stops, walking distance/time, route reasons, grouped same-gallery stops, stop swapping, and external Google Maps links.
- Active-walk companion state with start/resume, current/next stop progress, visited/skipped actions, completed recap, and local persistence.
- First-run choice surface for finding a walk, taking the taste quiz, or resuming an active walk.
- Professional mobile web shell with a location/date bar, visual featured recommendation, useful-tonight feed, compact trust strip, and bottom tabs for Tonight, Walk, For You, and Passport.
- Taste Passport personalization with quiz responses, behavior signals, personalized picks, quests, badges, and stamps.
- Opening-night routing that prefers upcoming or active receptions and explains timing.
- Last-chance and closing-soon signals.
- Neighborhood Intelligence for walkable clusters.
- Why Go cards, personal art-log controls, saved/visited/skipped states, and private notes.
- Trust labels for `Verified as of`, `Official gallery link`, `Fixture/demo`, `Needs review`, and submitted/partner inventory.
- PWA-readiness metadata with manifest/static icon assets while keeping the app local-first and offline-friendly through checked-in images/data.
- Compact beta preview path with "Try a NYC walk", "Try For You", "Check Hudson", feedback capture, and copyable beta review report.
- Route usability signals for open-now confidence, timing risk, best-start reasoning, closed/closing-soon warnings, and thin verified-route fallback copy.
- Verified NYC gallery inventory depth above the initial fixture count, currently targeted at 72+ NYC exhibitions with 60+ imported/manual official-page records.
- Hudson coverage kept honest as a smaller market: Warren Street remains the walk test, while nearby Hudson Valley official-page records add context without being presented as Warren Street stops.

## What Is Deliberately Out Of Scope

- Ops console
- Checkout
- Spotify/music recommendations
- Concert/ticketing UI
- Native iOS packaging
- Full native map stack
- Aggressive scraping

## Screenshots

Review screenshots are checked in here:

- Desktop: `docs/pr/gallery-walk-desktop.png`
- Mobile: `docs/pr/gallery-walk-mobile.png`

The screenshots should show the mobile-first Tonight shell, trust signals, useful route actions, personalization, and the route-first planning surface.

## Local Setup

Requires Node.js `20.19.4` or newer.

```bash
npm install
npm run web
```

Open the Expo web app at the URL printed by Expo. In this workspace the running local preview is usually:

```text
http://localhost:19006
```

On this Codex desktop workspace, the shell can resolve an older Node. Prefix checks with the bundled Node 20 runtime when needed:

```bash
PATH=/Users/s/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH npm run typecheck
PATH=/Users/s/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH npm run test:services
PATH=/Users/s/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH npm run audit:galleries
```

To validate a static web preview build locally:

```bash
PATH=/Users/s/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH npm run export:web
```

## Validation

Run the required gates:

```bash
npm run typecheck
npm run test:services
npm run audit:galleries
```

Useful additional audits remain available:

```bash
npm run audit:coverage
npm run audit:live-inventory
npm run audit:sources
npm run audit:source-directory
```

## Browser Smoke Checklist

- NYC shows materially more than 12 exhibitions.
- The top "Tonight in New York" surface explains first-run choices plus open-now, verified, demo/review, walkable, opening, and closing-soon supply.
- Route modes switch between 45-minute loop, 2-hour walk, opening crawl, last chance, and For you.
- Route swap works from the route preview or stop list without silently overwriting a preserved active walk.
- Active walk progress survives refresh after marking a stop visited.
- Grouped same-gallery stops still render compactly with show titles preserved.
- Trust labels and official links are visible on cards and stops.
- Hudson Warren Street renders as a smaller, honest market.
- The beta preview surface can copy a report with market, route mode, active-walk status, verified/demo counts, route warnings, and tester notes.
- Desktop and mobile layouts have no obvious overlap or cramped controls.
- Browser console has no errors.

## Beta Test Path

1. Open the preview.
2. Tap "Try a NYC walk" and confirm the route has verified/open stops and map links.
3. Tap "Try For You", save or skip a recommendation, and confirm the visible learning copy changes.
4. Tap "Check Hudson" and confirm Warren Street remains labeled as a smaller/thinner walk.
5. Add a tester note, copy the beta review report, and attach it to PR feedback.

Known limitations: no service worker/offline cache yet, no auth/backend sync, no push notifications, no native packaging, no map SDK, and no automated scraping. The preview relies on checked-in inventory, quiz metadata, and generated image assets.

## Architecture Guide

- `src/GalleryApp.tsx`: active gallery-walk discovery UI.
- `src/data/galleryCatalog.ts`: gallery areas, neighborhoods, fixture/demo inventory, and imported verified inventory composition.
- `src/data/verifiedGalleryInventory.ts`: manually verified official-page gallery exhibition records.
- `src/data/gallerySources.ts`: official gallery source directory and review/freshness status.
- `src/services/galleryDiscovery.ts`: filtering, trust labels, walk planning, route grouping, opening timing, last-chance alerts, and route map URLs.
- `src/services/galleryWalkSession.ts`: active walk sessions, progress, replacement-safe stop swaps, and recaps.
- `src/services/galleryAppPersistence.ts`: local persistence for walk state, art log, filters, alerts, personalization, saved walks, and first-run state.
- `src/services/galleryTastePassport.ts`: quiz/behavior taste signals, personalized ranking, For you routes, quests, badges, and stamps.
- `src/services/galleryDataFoundation.ts`: import records, source audits, submission review queue, and market data audit helpers.
- `scripts/galleryDiscoveryAudit.ts`: market-level gallery inventory and route-readiness audit.
- `tests/serviceChecks.ts`: focused service checks for gallery inventory, route behavior, map links, trust labels, and legacy service seams.

## PR Notes

This PR is intentionally large because it moves the repo from an old native TicketsTonight codebase to a modern Expo-based gallery-walk discovery app. Review should focus on:

- Whether replacing the legacy app tree is the accepted direction.
- Whether the gallery-walk product surface is understandable and useful enough for the next iteration.
- Whether fixture/demo and verified inventory distinctions remain honest.
- Whether route planning, active-walk state, and swap-stop editing are practical without pretending to be a full native map product.

The next product iteration should probably be beta tester feedback triage, deeper official-page inventory, and eventual map/PWA hardening, not ops tooling.
