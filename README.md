# Tickets Tonight

Mobile discovery starter for curated local shows: concerts, DJ sets, dance, ballet, opera, plays, theater, comedy, variety, and adjacent live events. The active MVP is discovery, discount tracking, external ticket links, and Spotify-powered recommendations; checkout remains deferred.

## What is built

- Expo React Native app with provider-backed local-area event discovery.
- City selector, near-me area resolution, search, category filters, neighborhood filters, budget filters, sort controls, date windows, deal-only filtering, active-filter summary/reset, grouped result sections, event cards, and a show-detail sheet.
- First-class category coverage for concerts, DJ sets, dance, ballet, opera, plays, theater, comedy, and variety/adjacent live events.
- Deal-aware ticket inventory with list prices, savings, access method, inventory source, max quantities, and link-ready market snapshots.
- Best-bets ranking that lifts urgent deals, local-source picks, nearby shows, and weekend options above the full chronological list.
- Discount discovery ranking that prioritizes stronger savings and urgent deal windows before checkout is active.
- Deal alerts can track the current area/category/date filters with optional under-$35, under-$50, or under-$75 price thresholds.
- External ticket links can be opened from provider-backed offers while in-app checkout remains deferred, including link-only provider listings when live sources do not expose prices.
- NYC coverage audit targets 200 events over 30 days with 70% ticket-link coverage, exposed through a service, CLI script, and compact app summary with priced-vs-link-only counts.
- Checkout groundwork remains behind services, but purchase UI, account sign-in, and wallet are out of the active MVP for now.
- Saved shows, deal alerts, in-app deal notifications, and persisted discovery preferences through a replaceable repository layer.
- Spotify PKCE auth can connect a listener with `user-top-read`, pull top artists, tracks, and genres, and rank provider-backed recommendations in-app.
- Explicit discovery source plans for New York, Los Angeles, and Hudson so provider work stays focused.
- Source planning separates broad event APIs from reusable local pipelines, so small venues can fill gaps without turning every venue into a bespoke integration.
- Broad API acquisition planning ranks next candidate sources before any bespoke local venue work.
- Category-level coverage planning flags where broad APIs are enough for baseline discovery and where local pipelines add meaningful depth.
- Ticketmaster Discovery-shaped adapter for paginated live event ingestion plus normalizing real provider events, classifications, venues, price ranges, link-only ticket pages, and cached detail lookup.
- Ticketmaster unfiltered area loads fan out across music/nightlife, stage/comedy, performing arts, and adjacent-live lanes to improve broad discovery coverage before bespoke local work.
- Async event-provider pipeline with cross-source dedupe powering visible results, area inventory, deal rails, alerts, saved shows, and provider-fed future checkout groundwork.
- Typed service boundaries for replacing seed data with real event feeds, taste providers, and ticket providers.

## Alpha Markets

- New York, NY: primary alpha market for the densest mix of theater, dance, opera, concerts, DJ sets, and last-minute discounts.
- Los Angeles, CA: secondary validation market for West Coast concerts, DJ sets, opera, and venue-direct inventory.
- Hudson, NY: arts-town test market for regional performing arts, weekend trips, and smaller-market discovery behavior.

## Run it

Requires Node.js `20.19.4` or newer.

```bash
npm install
npm run web
```

Optional live Ticketmaster Discovery inventory can be enabled with public Expo env vars:

```bash
EXPO_PUBLIC_TICKETMASTER_API_KEY=your_key npm run web
```

For local CLI audits, copy `.env.example` to `.env.local` and set `EXPO_PUBLIC_TICKETMASTER_API_KEY` there. Local `.env` files are ignored by git.

The adapter defaults to 100 results per page and up to 3 pages. Override the live fetch breadth with:

```bash
EXPO_PUBLIC_TICKETMASTER_PAGE_SIZE=100 EXPO_PUBLIC_TICKETMASTER_MAX_PAGES=5 npm run web
```

Without that key, the app stays on the checked-in seed catalog, partner-feed fixtures, and reusable local calendar fixtures.

Optional Spotify recommendations can be enabled with a public Spotify app client id:

```bash
EXPO_PUBLIC_SPOTIFY_CLIENT_ID=your_spotify_client_id npm run web
```

Register the exact redirect URI in Spotify. Native builds use `ticketstonight://spotify-auth`; web builds can set `EXPO_PUBLIC_SPOTIFY_REDIRECT_URI` to the allowed local or production callback.

Run focused service checks:

```bash
npm run test:services
```

Run the NYC coverage audit:

```bash
npm run audit:coverage
```

Run the NYC live supply audit against the current 50-event discovery target:

```bash
npm run audit:live-supply
```

Run live Ticketmaster provider diagnostics:

```bash
EXPO_PUBLIC_TICKETMASTER_API_KEY=your_key npm run audit:providers
```

The provider diagnostics command redacts API keys from printed request URLs and separates priced offers from link-only ticket pages.

For native preview, use:

```bash
npm run ios
npm run android
```

## Architecture

- `src/data/catalog.ts`: alpha-market areas, categories, and seed event inventory.
- `src/data/broadApiCandidates.ts`: ranked broad API candidates for baseline event coverage, ticket links, price inventory, and coverage-gap auditing.
- `src/data/discoveryPlans.ts`: market-by-market discovery source strategy for New York, Los Angeles, and Hudson.
- `src/data/localCalendarFeeds.ts`: reusable small-market calendar fixtures for local gap filling without venue-specific adapters.
- `src/data/partnerFeeds.ts`: raw partner feed fixtures that mimic external inventory in the supported alpha markets.
- `src/data/ticketmasterFixtures.ts`: Ticketmaster Discovery-shaped fixture payload for adapter tests.
- `src/services/auth.ts`: dormant auth provider groundwork for future checkout/account features.
- `src/services/checkoutBackend.ts`: dormant backend-style checkout groundwork for future purchase flow.
- `src/services/calendarFeedProvider.ts`: generic local calendar feed normalizer for ICS/RSS/HTML/manual-import style listings.
- `src/services/coverageAudit.ts`: 30-day market coverage audit for event-count, ticket-link, priced-offer, link-only-offer, category-lane, date-window, and source-breadth targets.
- `src/services/dealAlerts.ts`: alert creation and discounted-ticket matching.
- `src/services/discoveryAcquisition.ts`: broad API recommendation and local-pipeline trigger planning so provider work starts with scalable sources.
- `src/services/discoveryFacets.ts`: market summaries, source diversity, link-ready show counts, neighborhood facets, category facets, and date-window availability with discounted-count signals for the selected market.
- `src/services/discoveryFilterSummary.ts`: compact active-filter labels and reset affordance state for the discovery UI.
- `src/services/dealDiscovery.ts`: discount insight scoring, savings math, urgency labels, and area deal summaries.
- `src/services/discoveryPlanning.ts`: helper layer for broad-API/local-pipeline lanes, category coverage, source readiness, category gaps, primary-market ordering, and discount levers.
- `src/services/discoveryRanking.ts`: best-bets scoring for urgent deals, local-source inventory, timing, and distance.
- `src/services/discoveryResultSections.ts`: scan-friendly result grouping for soonest discovery while preserving cheapest/nearby sort order.
- `src/services/feedProvider.ts`: feed normalization from provider taxonomy/inventory into the app `Show` model.
- `src/services/eventCatalog.ts`: discovery search, date-window filtering, deal search, recommendation scoring, composite event providers, cross-source event dedupe, calendar-feed inventory, and runtime caching for provider-fed shows.
- `src/services/eventProviderFactory.ts`: default provider stack that keeps fixtures active and adds Ticketmaster Discovery when public Expo config is present.
- `src/services/location.ts`: location provider interface, demo location provider, distance calculation, and nearest-area resolution.
- `src/services/liveSupplyAudit.ts`: focused NYC live-supply target audit for the current 50-event provider sprint.
- `src/services/notifications.ts`: in-app notification provider for deal-alert matches, with read-state merge helpers for future push/email channels.
- `src/services/payments.ts`: dormant payment provider groundwork shaped for future Stripe/provider-native checkout.
- `src/services/personalization.ts`: Spotify PKCE auth, token exchange, top artists/tracks/genres fetches, demo taste provider, and recommendation-context creation.
- `src/services/storage.ts`: repository for preferences and orders, backed by browser storage on web and memory fallback elsewhere.
- `src/services/ticketLinks.ts`: safe external ticket-link intent selection for provider-backed offers while checkout is deferred.
- `src/services/providerDiagnostics.ts`: live provider diagnostics for Ticketmaster fan-out, duplicate events, category mix, priced offers, link-only ticket pages, and redacted request URLs.
- `src/services/ticketmasterProvider.ts`: Ticketmaster Discovery request builder, lane fan-out fetcher, fetch client, event normalizer, and `EventProvider` implementation.
- `src/services/ticketing.ts`: ticketing provider interface plus a mock provider.
- `src/types.ts`: shared app, ticketing, and recommendation types.
- `src/App.tsx`: provider-backed mobile discovery, detail, saved-show, discount alert, inbox, and preference UI.
- `scripts/env.ts`: local `.env.local` loader for audit scripts without committing provider keys.
- `tests/serviceChecks.ts`: discovery, market scope, feed normalization, provider adapters, deal filtering, discount alerts, and dormant checkout groundwork checks.

## Provider seams

- `EventProvider`: replace or extend `CompositeEventProvider` with `TicketmasterDiscoveryProvider`, Eventbrite, venue-direct, and promoter feed providers.
- `AuthProvider`: replace `MockAuthProvider` with email/password, passkeys, OAuth, or a backend identity session.
- `TicketingProvider`: dormant seam for Stripe Payment Sheet, provider-native checkout, or venue-direct order creation later.
- `PaymentProvider`: dormant seam for Stripe Payment Sheet, Apple Pay/Google Pay, or provider-native payment confirmation later.
- `CheckoutBackend`: dormant seam for future HTTPS endpoints so holds, payment intents, order creation, inventory checks, and seller-of-record logic stay server-side.
- `TasteProfileProvider`: Spotify OAuth, saved auth token metadata, top artists/tracks/genres, and recommendation-context refresh groundwork.
- `LocationProvider`: replace `DemoLocationProvider` with Expo Location or native permissions when device geolocation is ready.
- `AppRepository`: replace browser/memory storage with AsyncStorage, SQLite, or authenticated backend sync.
- `NotificationProvider`: extend in-app deal notifications to push notifications or email once notification permissions and backend delivery are added.

## Next integrations

- Event inventory: follow the checked-in discovery source plans: New York first, Los Angeles second, Hudson as the smaller-market arts-town test.
- Data strategy: use broad APIs for baseline coverage, validate Eventbrite/SeatGeek-style ticket-link breadth next, use event-intelligence sources for coverage audits, then add reusable local calendar/feed/direct-source pipelines only where measured gaps matter.
- Local-source prioritization: use category coverage to pick local pipeline work only when it adds depth beyond broad API coverage.
- Hudson local pipeline: start with the generic calendar-feed path before bespoke venue adapters.
- Discounts: partner-funded promo codes, unsold inventory drops, preview allocations, early-arrival prices, matinee value, and simple last-minute deals.
- Later checkout: Stripe Payment Sheet or provider-native checkout once seller-of-record and payout flow are decided.
- Recommendations: deepen Spotify ranking with saved shows, clicked events, followed venues, and artist follow alerts.
- Location: Expo Location for nearby search, plus explicit city selection for planning trips.
