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

- Gallery Walk Builder with quick loop, 2-hour walk, opening crawl, and last-chance route modes.
- Map-like route planner with ordered stops, walking distance/time, route reasons, grouped same-gallery stops, and external Google Maps links.
- Opening-night routing that prefers upcoming or active receptions and explains timing.
- Last-chance and closing-soon signals.
- Neighborhood Intelligence for walkable clusters.
- Why Go cards, personal art-log controls, saved/visited/skipped states, and private notes.
- Trust labels for `Verified as of`, `Official gallery link`, `Fixture/demo`, `Needs review`, and submitted/partner inventory.
- Verified NYC gallery inventory depth above the initial fixture count.
- Hudson Warren Street coverage kept honest as a smaller market.

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

The screenshots should show the "Tonight in New York" discovery surface, the trust signal grid, and the route planner.

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
- The top "Tonight in New York" surface explains open-now, verified, demo/review, walkable, opening, and closing-soon supply.
- Route modes switch between 45-minute loop, 2-hour walk, opening crawl, and last chance.
- Grouped same-gallery stops still render compactly with show titles preserved.
- Trust labels and official links are visible on cards and stops.
- Hudson Warren Street renders as a smaller, honest market.
- Desktop and mobile layouts have no obvious overlap or cramped controls.
- Browser console has no errors.

## Architecture Guide

- `src/GalleryApp.tsx`: active gallery-walk discovery UI.
- `src/data/galleryCatalog.ts`: gallery areas, neighborhoods, fixture/demo inventory, and imported verified inventory composition.
- `src/data/verifiedGalleryInventory.ts`: manually verified official-page gallery exhibition records.
- `src/data/gallerySources.ts`: official gallery source directory and review/freshness status.
- `src/services/galleryDiscovery.ts`: filtering, trust labels, walk planning, route grouping, opening timing, last-chance alerts, and route map URLs.
- `src/services/galleryDataFoundation.ts`: import records, source audits, submission review queue, and market data audit helpers.
- `scripts/galleryDiscoveryAudit.ts`: market-level gallery inventory and route-readiness audit.
- `tests/serviceChecks.ts`: focused service checks for gallery inventory, route behavior, map links, trust labels, and legacy service seams.

## PR Notes

This PR is intentionally large because it moves the repo from an old native TicketsTonight codebase to a modern Expo-based gallery-walk discovery app. Review should focus on:

- Whether replacing the legacy app tree is the accepted direction.
- Whether the gallery-walk product surface is understandable and useful enough for the next iteration.
- Whether fixture/demo and verified inventory distinctions remain honest.
- Whether route planning is practical without pretending to be a full native map product.

The next product iteration should probably be inventory confidence and preview deployment, not ops tooling.
