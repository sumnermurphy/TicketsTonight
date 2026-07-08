import { areas } from "../src/data/catalog";
import { discoveryMarketPlans } from "../src/data/discoveryPlans";
import { partnerFeedEvents } from "../src/data/partnerFeeds";
import { ticketmasterDiscoveryFixture } from "../src/data/ticketmasterFixtures";
import {
  createDealAlert,
  getDealAlertMatches,
  toggleDealAlertStatus
} from "../src/services/dealAlerts";
import { checkoutBackend } from "../src/services/checkoutBackend";
import {
  getDiscoveryMarketPlan,
  getDiscoveryMarketPlans,
  getDiscountLeversForMarket,
  getMarketDiscoveryGaps,
  getPrimaryDiscoveryMarketPlan,
  getReadyDiscoverySources
} from "../src/services/discoveryPlanning";
import {
  CompositeEventProvider,
  getDealShows,
  getRecommendedShows,
  getRecommendedShowsFromCatalog,
  getShowById,
  LocalCatalogProvider,
  searchShows
} from "../src/services/eventCatalog";
import {
  createDefaultEventProvider,
  createEventProviders,
  eventProvider
} from "../src/services/eventProviderFactory";
import { normalizeFeedEvent } from "../src/services/feedProvider";
import {
  findNearestArea,
  getDistanceBetweenCoordinates,
  locationProvider
} from "../src/services/location";
import {
  markNotificationRead,
  mergeNotifications,
  notificationProvider
} from "../src/services/notifications";
import { tasteProfileProvider } from "../src/services/personalization";
import { AppRepository, MemoryStorageAdapter } from "../src/services/storage";
import { authProvider } from "../src/services/auth";
import { mockCardPaymentMethod, paymentProvider } from "../src/services/payments";
import { ticketingProvider } from "../src/services/ticketing";
import {
  buildTicketmasterDiscoveryUrl,
  normalizeTicketmasterEvent,
  TicketmasterDiscoveryProvider,
  type TicketmasterDiscoveryClient
} from "../src/services/ticketmasterProvider";
import type { EventProvider } from "../src/types";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function assertRejects(action: () => Promise<unknown>, message: string) {
  try {
    await action();
  } catch {
    return;
  }

  throw new Error(message);
}

async function main() {
  const referenceNow = "2026-07-08T12:00:00-04:00";
  const areaIds = areas.map((area) => area.id);

  assert(
    areaIds.join("|") === "nyc|la|hudson",
    "Discovery markets should be narrowed to New York, Los Angeles, and Hudson."
  );
  assert(areas[0]?.discoveryRole === "primary", "New York should be the primary alpha market.");
  assert(
    areas.find((area) => area.id === "hudson")?.discoveryRole === "test",
    "Hudson should be marked as the arts-town test market."
  );
  assert(
    discoveryMarketPlans.length === areas.length,
    "Every supported discovery market should have a source plan."
  );
  assert(
    getDiscoveryMarketPlans().map((plan) => plan.areaId).join("|") === areaIds.join("|"),
    "Discovery source plans should follow the supported market order."
  );
  assert(
    getPrimaryDiscoveryMarketPlan()?.areaId === "nyc",
    "New York should remain the first discovery integration target."
  );
  assert(
    getDiscoveryMarketPlan("nyc")?.sources.some(
      (source) => source.id === "ticketmaster-discovery" && source.status === "integration-ready"
    ),
    "New York should keep Ticketmaster Discovery marked as the first real provider adapter."
  );
  assert(
    getReadyDiscoverySources("la").some((source) => source.id === "la-partner-feed"),
    "Los Angeles should have an active partner-feed fixture for secondary-market validation."
  );
  assert(
    getMarketDiscoveryGaps("nyc").length === 0,
    "New York source planning should cover the primary category focus."
  );
  assert(
    getMarketDiscoveryGaps("hudson").length === 0,
    "Hudson source planning should cover the arts-town category focus."
  );
  assert(
    getDiscoveryMarketPlan("hudson")?.sources.some(
      (source) => source.sourceType === "calendar-feed"
    ),
    "Hudson should include a regional-calendar path for smaller-market discovery."
  );
  assert(
    getDiscountLeversForMarket("hudson").includes("regional preview allocations"),
    "Hudson should keep a regional discount lever for later experiments."
  );
  assert(
    createEventProviders({ ticketmasterApiKey: "" }).map((provider) => provider.id).join("|") ===
      "local-catalog|partner-feed",
    "Default discovery providers should stay fixture-backed until a marketplace key is configured."
  );

  const nycShows = searchShows({
    areaId: "nyc",
    categories: ["concert", "dj"],
    query: "",
    onlyDeals: false,
    dateWindow: "all",
    referenceNow
  });

  assert(nycShows.length >= 2, "NYC category discovery should return concert and DJ events.");
  assert(
    nycShows.every((show) => show.areaId === "nyc"),
    "Area search should not leak events from other cities."
  );

  const dealShows = getDealShows("nyc");
  assert(dealShows.length > 0, "NYC should have deal inventory.");
  assert(
    dealShows.every((show) => show.ticketOffers.some((offer) => offer.deal)),
    "Deal search should only return shows with deal-backed offers."
  );

  const normalizedPlay = normalizeFeedEvent(partnerFeedEvents[0]!);
  assert(normalizedPlay.category === "theater", "Partner taxonomy should normalize theatre/play to theater.");
  assert(
    normalizedPlay.ticketOffers[0]?.deal?.label === "Preview price",
    "Partner feed deal metadata should map onto ticket offers."
  );

  const feedSearch = searchShows({
    areaId: "nyc",
    categories: ["theater"],
    query: "Small Hours",
    onlyDeals: true,
    dateWindow: "week",
    referenceNow
  });

  assert(
    feedSearch.some((show) => show.id === "feed-venuecloud-vc-1001"),
    "Search should include normalized partner feed events."
  );

  const compositeResults = await eventProvider.listShows({
    areaId: "la",
    categories: ["dj"],
    query: "rooftop",
    onlyDeals: true,
    dateWindow: "weekend",
    referenceNow: "2026-07-08T12:00:00-07:00"
  });

  assert(
    compositeResults.some((show) => show.id === "feed-nightlist-nl-774"),
    "Composite provider should merge normalized feed events."
  );

  const hudsonShows = searchShows({
    areaId: "hudson",
    categories: ["dance", "opera"],
    query: "",
    onlyDeals: true,
    dateWindow: "week",
    referenceNow
  });

  assert(
    hudsonShows.some((show) => show.id === "show-hudson-rhythm-map"),
    "Hudson discovery should include dance inventory for the arts-town test market."
  );
  assert(
    hudsonShows.some((show) => show.id === "show-hudson-opera-lab"),
    "Hudson discovery should include opera inventory for the arts-town test market."
  );

  const hudsonFeedResults = await eventProvider.listShows({
    areaId: "hudson",
    categories: ["theater"],
    query: "Orchard",
    onlyDeals: true,
    dateWindow: "week",
    referenceNow
  });

  assert(
    hudsonFeedResults.some((show) => show.id === "feed-artswire-aw-550"),
    "Composite provider should merge normalized Hudson partner-feed events."
  );

  const ticketmasterUrl = new URL(
    buildTicketmasterDiscoveryUrl(
      {
        areaId: "nyc",
        categories: ["theater"],
        query: "Hadestown",
        onlyDeals: false,
        dateWindow: "week",
        referenceNow
      },
      {
        apiKey: "test-key",
        now: () => new Date(referenceNow),
        radiusMiles: 20
      }
    )
  );

  assert(ticketmasterUrl.searchParams.get("city") === "New York", "Ticketmaster requests should target city.");
  assert(ticketmasterUrl.searchParams.get("stateCode") === "NY", "Ticketmaster requests should target state.");
  assert(ticketmasterUrl.searchParams.get("keyword") === "Hadestown", "Ticketmaster requests should pass query.");
  assert(
    ticketmasterUrl.searchParams.get("classificationName") === "theatre",
    "Ticketmaster requests should map app categories into provider classifications."
  );

  const rawTicketmasterEvent = ticketmasterDiscoveryFixture._embedded?.events?.[0];
  assert(rawTicketmasterEvent, "Ticketmaster fixture should include events.");

  const normalizedTicketmasterEvent = normalizeTicketmasterEvent(rawTicketmasterEvent, "nyc");
  assert(normalizedTicketmasterEvent?.category === "theater", "Ticketmaster theatre taxonomy should normalize.");
  assert(
    normalizedTicketmasterEvent.ticketOffers[0]?.priceCents === 4950,
    "Ticketmaster price ranges should become cents-based ticket offers."
  );

  const fixtureTicketmasterClient: TicketmasterDiscoveryClient & { requestedUrls: string[] } = {
    requestedUrls: [],
    async listEvents(url: string) {
      this.requestedUrls.push(url);
      return ticketmasterDiscoveryFixture;
    }
  };
  const ticketmasterProvider = new TicketmasterDiscoveryProvider({
    apiKey: "test-key",
    client: fixtureTicketmasterClient,
    now: () => new Date(referenceNow)
  });
  const ticketmasterShows = await ticketmasterProvider.listShows({
    areaId: "nyc",
    categories: ["theater"],
    query: "Hadestown",
    onlyDeals: false,
    dateWindow: "week",
    referenceNow
  });

  assert(
    fixtureTicketmasterClient.requestedUrls.length === 1,
    "Ticketmaster provider should request external inventory once per list call."
  );
  assert(
    ticketmasterShows.length === 1 && ticketmasterShows[0]?.id === "tm-tm-nyc-900",
    "Ticketmaster provider should return matching normalized events."
  );
  assert(
    (await ticketmasterProvider.getShow("tm-tm-nyc-900"))?.title === "Hadestown",
    "Ticketmaster provider should cache normalized shows for detail lookup."
  );

  const ticketmasterDjShows = await ticketmasterProvider.listShows({
    areaId: "nyc",
    categories: ["dj"],
    query: "",
    onlyDeals: false,
    dateWindow: "week",
    referenceNow
  });

  assert(
    ticketmasterDjShows.some((show) => show.id === "tm-tm-nyc-901" && show.areaId === "nyc"),
    "Ticketmaster provider should resolve nearby borough venues into the selected area."
  );

  const factoryTicketmasterClient: TicketmasterDiscoveryClient & { requestedUrls: string[] } = {
    requestedUrls: [],
    async listEvents(url: string) {
      this.requestedUrls.push(url);
      return ticketmasterDiscoveryFixture;
    }
  };
  const configuredProviders = createEventProviders({
    ticketmasterApiKey: "test-key",
    ticketmasterClient: factoryTicketmasterClient,
    now: () => new Date(referenceNow)
  });
  const configuredCompositeProvider = createDefaultEventProvider({
    ticketmasterApiKey: "test-key",
    ticketmasterClient: factoryTicketmasterClient,
    now: () => new Date(referenceNow)
  });
  const configuredCompositeShows = await configuredCompositeProvider.listShows({
    areaId: "nyc",
    categories: ["theater"],
    query: "Hadestown",
    onlyDeals: false,
    dateWindow: "week",
    referenceNow
  });

  assert(
    configuredProviders.map((provider) => provider.id).includes("ticketmaster-discovery"),
    "Configured discovery providers should include Ticketmaster when an API key is present."
  );
  assert(
    factoryTicketmasterClient.requestedUrls.length === 1,
    "Factory-backed Ticketmaster providers should make external discovery requests."
  );
  assert(
    configuredCompositeShows.some((show) => show.id === "tm-tm-nyc-900"),
    "Factory-backed composite discovery should merge configured marketplace inventory."
  );

  const externalCompositeProvider = new CompositeEventProvider([ticketmasterProvider]);
  const externalCompositeShows = await externalCompositeProvider.listShows({
    areaId: "nyc",
    categories: ["theater"],
    query: "Hadestown",
    onlyDeals: false,
    dateWindow: "week",
    referenceNow
  });

  assert(
    externalCompositeShows.some((show) => show.id === "tm-tm-nyc-900"),
    "Composite provider should accept external event providers."
  );
  assert(
    getShowById("tm-tm-nyc-900")?.title === "Hadestown",
    "Composite provider results should be available to shared show lookup."
  );

  const externalRecommendations = getRecommendedShowsFromCatalog(externalCompositeShows, {
    areaId: "nyc",
    recentCategories: ["theater"]
  });

  assert(
    externalRecommendations.some((recommendation) => recommendation.show.id === "tm-tm-nyc-900"),
    "Provider-fed shows should be rankable by the recommendation engine."
  );

  const failingExternalProvider: EventProvider = {
    id: "failing-marketplace",
    label: "Failing marketplace",
    async listShows() {
      throw new Error("Marketplace temporarily unavailable.");
    },
    async getShow() {
      return undefined;
    }
  };
  const resilientCompositeShows = await new CompositeEventProvider([
    new LocalCatalogProvider(),
    failingExternalProvider
  ]).listShows({
    areaId: "nyc",
    categories: ["concert"],
    query: "",
    onlyDeals: false,
    dateWindow: "all",
    referenceNow
  });

  assert(
    resilientCompositeShows.some((show) => show.id === "show-alina-ives"),
    "Composite discovery should keep usable local results when an external provider fails."
  );

  const externalProviderHold = await ticketingProvider.createHold({
    showId: "tm-tm-nyc-900",
    offerId: "ticketmaster-standard",
    quantity: 2
  });

  assert(
    externalProviderHold.subtotalCents === 9900,
    "Ticketing holds should work for provider-fed external inventory."
  );

  const tonightShows = searchShows({
    areaId: "nyc",
    categories: [],
    query: "",
    onlyDeals: false,
    dateWindow: "tonight",
    referenceNow
  });

  assert(
    tonightShows.some((show) => show.id === "show-alina-ives"),
    "Tonight window should include same-night shows."
  );
  assert(
    !tonightShows.some((show) => show.id === "show-giselle"),
    "Tonight window should exclude later-week shows."
  );

  const weekendShows = searchShows({
    areaId: "nyc",
    categories: [],
    query: "",
    onlyDeals: false,
    dateWindow: "weekend",
    referenceNow
  });

  assert(
    weekendShows.some((show) => show.id === "show-othello"),
    "Weekend window should include Friday through Sunday events."
  );
  assert(
    !weekendShows.some((show) => show.id === "show-alina-ives"),
    "Weekend window should exclude midweek events."
  );

  const dealAlert = createDealAlert(
    {
      areaId: "nyc",
      categories: ["concert"],
      dateWindow: "tonight"
    },
    "2026-07-08T12:00:00.000Z"
  );
  const alertMatches = getDealAlertMatches([dealAlert], nycShows, referenceNow);

  assert(dealAlert.status === "active", "Created deal alerts should be active by default.");
  assert(
    alertMatches.some((match) => match.show.id === "show-alina-ives"),
    "Deal alerts should match discounted events in the selected area/category/window."
  );

  const pausedAlert = toggleDealAlertStatus(dealAlert, "2026-07-08T12:01:00.000Z");
  assert(pausedAlert.status === "paused", "Deal alert toggle should pause active alerts.");
  assert(
    getDealAlertMatches([pausedAlert], nycShows, referenceNow).length === 0,
    "Paused deal alerts should not produce matches."
  );

  const alertNotifications = await notificationProvider.createDealAlertNotifications(
    alertMatches,
    "2026-07-08T12:02:00.000Z"
  );

  assert(alertNotifications.length > 0, "Deal alert matches should create in-app notifications.");
  assert(alertNotifications[0]?.status === "unread", "New deal notifications should start unread.");

  const readNotifications = markNotificationRead(alertNotifications, alertNotifications[0]!.id);
  assert(readNotifications[0]?.status === "read", "Notifications should be markable as read.");

  const mergedNotifications = mergeNotifications(readNotifications, alertNotifications);
  assert(
    mergedNotifications[0]?.status === "read",
    "Notification merges should preserve the user's read state."
  );

  const recommendations = getRecommendedShows({
    areaId: "nyc",
    spotifyTopGenres: ["house", "indie pop"],
    recentCategories: ["concert"]
  });

  assert(recommendations.length > 0, "Taste profile should produce recommendations.");
  assert(recommendations[0]?.reason, "Recommendations should explain why they were selected.");

  const musicConnection = await tasteProfileProvider.connectAccount();
  const musicContext = await tasteProfileProvider.getRecommendationContext("nyc", musicConnection);

  assert(musicConnection.status === "connected", "Music provider should create a connected account.");
  assert(
    musicContext.spotifyTopGenres?.includes("indie pop"),
    "Connected music account should contribute Spotify top genres."
  );

  const musicRecommendations = getRecommendedShows(musicContext);
  assert(
    musicRecommendations.some((recommendation) => recommendation.show.id === "show-alina-ives"),
    "Spotify genres with spaces should match catalog signals with hyphens."
  );

  const disconnectedMusicConnection = await tasteProfileProvider.disconnectAccount(musicConnection);
  const disconnectedContext = await tasteProfileProvider.getRecommendationContext(
    "nyc",
    disconnectedMusicConnection
  );

  assert(
    disconnectedContext.spotifyTopGenres?.length === 0,
    "Disconnected music account should stop contributing Spotify genres."
  );

  const hudsonDistance = getDistanceBetweenCoordinates(
    { latitude: 42.2529, longitude: -73.7909 },
    { latitude: 42.2529, longitude: -73.7909 }
  );

  assert(hudsonDistance === 0, "Identical coordinates should have zero distance.");

  const locationFix = await locationProvider.getCurrentLocation();
  const nearestArea = findNearestArea(locationFix.coordinates);

  assert(nearestArea?.area.id === "nyc", "Demo location should resolve to the NYC area.");
  assert(nearestArea.distanceMiles < 10, "Demo location should be close enough to NYC for local discovery.");

  const hold = await ticketingProvider.createHold({
    showId: "show-alina-ives",
    offerId: "ga",
    quantity: 2
  });

  assert(hold.subtotalCents === 6800, "Hold subtotal should use deal ticket price.");
  assert(hold.discountCents === 1600, "Hold should expose savings against list price.");
  assert(hold.totalCents === 7548, "Hold total should include service fees.");

  await assertRejects(
    () =>
      ticketingProvider.createHold({
        showId: "show-giselle",
        offerId: "orchestra",
        quantity: 5
      }),
    "Hold should reject quantities above offer max quantity."
  );

  const session = await ticketingProvider.createCheckoutSession(hold);
  const paymentIntent = await paymentProvider.createPaymentIntent(hold, session);
  const payableSession = await ticketingProvider.attachPaymentIntent(session, paymentIntent);

  assert(
    payableSession.status === "payment_pending",
    "Checkout session should wait for payment after attaching a payment intent."
  );

  await assertRejects(
    () => ticketingProvider.markPaid(payableSession, paymentIntent),
    "Checkout should not be marked paid before payment succeeds."
  );

  const paidIntent = await paymentProvider.confirmPayment(paymentIntent, mockCardPaymentMethod);
  const paidSession = await ticketingProvider.markPaid(payableSession, paidIntent);
  const userSession = await authProvider.signIn();
  const signedOutSession = await authProvider.signOut(userSession);

  assert(userSession.status === "signed_in", "Auth provider should create a signed-in user session.");

  await assertRejects(
    () => ticketingProvider.createOrder(hold, paidSession, signedOutSession),
    "Signed-out sessions should not be allowed to create ticket orders."
  );

  const order = await ticketingProvider.createOrder(hold, paidSession, userSession);

  assert(paidIntent.status === "succeeded", "Payment provider should confirm mock payments.");
  assert(order.tickets.length === 2, "Paid order should mint one mobile ticket per quantity.");
  assert(order.confirmationCode.startsWith("TT-"), "Paid order should carry a confirmation code.");
  assert(order.totalCents === hold.totalCents, "Order total should match the paid hold.");
  assert(order.buyerUserId === userSession.userId, "Order should retain the buyer user id.");
  assert(
    order.tickets.every((ticket) => ticket.holderName === userSession.displayName),
    "Minted tickets should use the signed-in user's display name."
  );

  const backendPreparedCheckout = await checkoutBackend.prepareCheckout({
    showId: "tm-tm-nyc-900",
    offerId: "ticketmaster-standard",
    quantity: 1
  });

  assert(
    backendPreparedCheckout.session.status === "payment_pending",
    "Checkout backend should prepare a payable session."
  );
  assert(
    backendPreparedCheckout.paymentIntent.status === "requires_payment_method",
    "Checkout backend should prepare a payment intent before confirmation."
  );
  assert(
    backendPreparedCheckout.paymentMethod.last4 === "4242",
    "Checkout backend should expose the selected payment method to the client."
  );

  const backendCompletedCheckout = await checkoutBackend.completeCheckout({
    ...backendPreparedCheckout,
    buyer: userSession
  });

  assert(
    backendCompletedCheckout.session.status === "paid",
    "Checkout backend should mark the session paid after payment succeeds."
  );
  assert(
    backendCompletedCheckout.order.showId === "tm-tm-nyc-900",
    "Checkout backend should mint orders for provider-fed external inventory."
  );
  assert(
    backendCompletedCheckout.order.totalCents === backendPreparedCheckout.hold.totalCents,
    "Checkout backend order total should match the prepared hold."
  );

  const feedHold = await ticketingProvider.createHold({
    showId: "feed-venuecloud-vc-1001",
    offerId: "standard",
    quantity: 1
  });

  assert(feedHold.subtotalCents === 3800, "Ticketing should accept normalized partner feed inventory.");
  assert(feedHold.discountCents === 1000, "Feed-originated deals should apply to ticket holds.");

  const repository = new AppRepository(new MemoryStorageAdapter());

  await repository.saveOrders([order]);
  const storedOrders = await repository.loadOrders();

  assert(storedOrders.length === 1, "Repository should persist ticket orders.");
  assert(storedOrders[0]?.tickets.length === 2, "Persisted order should include minted tickets.");

  await repository.savePreferences({
    selectedAreaId: "nyc",
    selectedCategories: ["concert"],
    dateWindow: "tonight",
    onlyDeals: true,
    tasteEnabled: true,
    savedShowIds: ["show-alina-ives"],
    dealAlerts: [dealAlert],
    notifications: mergedNotifications,
    userSession,
    musicConnection,
    locationStatus: "Manual area",
    updatedAt: "2026-07-08T00:00:00.000Z"
  });

  const storedPreferences = await repository.loadPreferences();

  assert(storedPreferences?.onlyDeals === true, "Repository should persist deal preference.");
  assert(storedPreferences.dateWindow === "tonight", "Repository should persist date window preference.");
  assert(
    storedPreferences.savedShowIds.includes("show-alina-ives"),
    "Repository should persist saved shows."
  );
  assert(storedPreferences.dealAlerts.length === 1, "Repository should persist deal alerts.");
  assert(
    storedPreferences.notifications[0]?.status === "read",
    "Repository should persist notification read state."
  );
  assert(
    storedPreferences.musicConnection?.status === "connected",
    "Repository should persist connected music account state."
  );
  assert(
    storedPreferences.userSession?.status === "signed_in",
    "Repository should persist signed-in user session state."
  );

  await repository.clear();

  assert((await repository.loadOrders()).length === 0, "Repository clear should remove orders.");
  assert((await repository.loadPreferences()) === null, "Repository clear should remove preferences.");
}

main()
  .then(() => {
    console.log("Service checks passed.");
  })
  .catch((error: unknown) => {
    console.error(error);
    throw error;
  });
