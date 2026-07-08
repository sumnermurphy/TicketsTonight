# Tickets Tonight

Mobile discovery starter for curated local shows: concerts, DJ sets, dance, ballet, opera, plays, theater, comedy, variety, and adjacent live events. The active MVP is discovery plus discount tracking; checkout and Spotify personalization are intentionally deferred.

## What is built

- Expo React Native app with provider-backed local-area event discovery.
- City selector, near-me area resolution, search, category filters, neighborhood filters, budget filters, sort controls, date windows, deal-only filtering, active-filter summary/reset, event cards, and a show-detail sheet.
- First-class category coverage for concerts, DJ sets, dance, ballet, opera, plays, theater, comedy, and variety/adjacent live events.
- Deal-aware ticket inventory with list prices, savings, access method, inventory source, and max quantities.
- Best-bets ranking that lifts urgent deals, local-source picks, nearby shows, and weekend options above the full chronological list.
- Discount discovery ranking that prioritizes stronger savings and urgent deal windows before checkout is active.
- Deal alerts can track the current area/category/date filters with optional under-$35, under-$50, or under-$75 price thresholds.
- Checkout groundwork remains behind services, but purchase UI, account sign-in, and wallet are out of the active MVP for now.
- Saved shows, deal alerts, in-app deal notifications, and persisted discovery preferences through a replaceable repository layer.
- Spotify-shaped taste-provider groundwork remains in services, but Spotify connection and taste-pick UI are out of the active MVP for now.
- Explicit discovery source plans for New York, Los Angeles, and Hudson so provider work stays focused.
- Source planning separates broad event APIs from reusable local pipelines, so small venues can fill gaps without turning every venue into a bespoke integration.
- Broad API acquisition planning ranks next candidate sources before any bespoke local venue work.
- Category-level coverage planning flags where broad APIs are enough for baseline discovery and where local pipelines add meaningful depth.
- Ticketmaster Discovery-shaped adapter for normalizing real provider events, classifications, venues, price ranges, and cached detail lookup.
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

Without that key, the app stays on the checked-in seed catalog, partner-feed fixtures, and reusable local calendar fixtures.

Run focused service checks:

```bash
npm run test:services
```

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
- `src/services/dealAlerts.ts`: alert creation and discounted-ticket matching.
- `src/services/discoveryAcquisition.ts`: broad API recommendation and local-pipeline trigger planning so provider work starts with scalable sources.
- `src/services/discoveryFacets.ts`: market summaries, source diversity, neighborhood facets, category facets, and date-window availability with discounted-count signals for the selected market.
- `src/services/discoveryFilterSummary.ts`: compact active-filter labels and reset affordance state for the discovery UI.
- `src/services/dealDiscovery.ts`: discount insight scoring, savings math, urgency labels, and area deal summaries.
- `src/services/discoveryPlanning.ts`: helper layer for broad-API/local-pipeline lanes, category coverage, source readiness, category gaps, primary-market ordering, and discount levers.
- `src/services/discoveryRanking.ts`: best-bets scoring for urgent deals, local-source inventory, timing, and distance.
- `src/services/feedProvider.ts`: feed normalization from provider taxonomy/inventory into the app `Show` model.
- `src/services/eventCatalog.ts`: discovery search, date-window filtering, deal search, recommendation scoring, composite event providers, cross-source event dedupe, calendar-feed inventory, and runtime caching for provider-fed shows.
- `src/services/eventProviderFactory.ts`: default provider stack that keeps fixtures active and adds Ticketmaster Discovery when public Expo config is present.
- `src/services/location.ts`: location provider interface, demo location provider, distance calculation, and nearest-area resolution.
- `src/services/notifications.ts`: in-app notification provider for deal-alert matches, with read-state merge helpers for future push/email channels.
- `src/services/payments.ts`: dormant payment provider groundwork shaped for future Stripe/provider-native checkout.
- `src/services/personalization.ts`: dormant taste profile provider groundwork for future Spotify/personalization work.
- `src/services/storage.ts`: repository for preferences and orders, backed by browser storage on web and memory fallback elsewhere.
- `src/services/ticketmasterProvider.ts`: Ticketmaster Discovery request builder, fetch client, event normalizer, and `EventProvider` implementation.
- `src/services/ticketing.ts`: ticketing provider interface plus a mock provider.
- `src/types.ts`: shared app, ticketing, and recommendation types.
- `src/App.tsx`: provider-backed mobile discovery, detail, saved-show, discount alert, inbox, and preference UI.
- `tests/serviceChecks.ts`: discovery, market scope, feed normalization, provider adapters, deal filtering, discount alerts, and dormant checkout groundwork checks.

## Provider seams

- `EventProvider`: replace or extend `CompositeEventProvider` with `TicketmasterDiscoveryProvider`, Eventbrite, venue-direct, and promoter feed providers.
- `AuthProvider`: replace `MockAuthProvider` with email/password, passkeys, OAuth, or a backend identity session.
- `TicketingProvider`: dormant seam for Stripe Payment Sheet, provider-native checkout, or venue-direct order creation later.
- `PaymentProvider`: dormant seam for Stripe Payment Sheet, Apple Pay/Google Pay, or provider-native payment confirmation later.
- `CheckoutBackend`: dormant seam for future HTTPS endpoints so holds, payment intents, order creation, inventory checks, and seller-of-record logic stay server-side.
- `TasteProfileProvider`: dormant seam for Spotify OAuth, saved auth tokens, and top artists/genres when personalization is ready.
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
- Later recommendations: saved shows, clicked events, followed venues, and eventually Spotify top artists/genres.
- Location: Expo Location for nearby search, plus explicit city selection for planning trips.
