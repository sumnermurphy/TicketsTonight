import { areas, categoryLabels } from "../src/data/catalog";
import { discoveryMarketPlans } from "../src/data/discoveryPlans";
import { localCalendarEvents } from "../src/data/localCalendarFeeds";
import { partnerFeedEvents } from "../src/data/partnerFeeds";
import { ticketmasterDiscoveryFixture } from "../src/data/ticketmasterFixtures";
import { normalizeCalendarEvent } from "../src/services/calendarFeedProvider";
import {
  getBroadApiCoverageGaps,
  getDiscoveryAcquisitionPlan,
  getRecommendedBroadApiCandidates
} from "../src/services/discoveryAcquisition";
import {
  createDealAlert,
  getDealAlertMatches,
  toggleDealAlertStatus
} from "../src/services/dealAlerts";
import { checkoutBackend } from "../src/services/checkoutBackend";
import {
  getCategoryFacets,
  getDateWindowFacets,
  getMarketDiscoverySummary,
  getNeighborhoodFacets
} from "../src/services/discoveryFacets";
import { getDiscoveryFilterSummary } from "../src/services/discoveryFilterSummary";
import {
  getDealInsights,
  getDealSummary,
  getOfferSavings,
  getSavingsPercent
} from "../src/services/dealDiscovery";
import { getDiscoveryPicks } from "../src/services/discoveryRanking";
import {
  getDiscoveryCategoryCoverage,
  getDiscoveryMarketPlan,
  getDiscoveryMarketPlans,
  getDiscoverySourceStrategy,
  getDiscountLeversForMarket,
  getLocalPipelinePriorityCategories,
  getMarketDiscoveryGaps,
  getNextLocalDiscoverySources,
  getPrimaryDiscoveryMarketPlan,
  getReadyDiscoverySources
} from "../src/services/discoveryPlanning";
import {
  CompositeEventProvider,
  getBestOffer,
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
  getBestTicketLinkIntent,
  getSafeTicketUrl,
  getTicketLinkIntent
} from "../src/services/ticketLinks";
import {
  buildTicketmasterDiscoveryUrl,
  normalizeTicketmasterEvent,
  TicketmasterDiscoveryProvider,
  type TicketmasterDiscoveryClient
} from "../src/services/ticketmasterProvider";
import type { EventProvider, Show } from "../src/types";

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
  assert(
    (Object.keys(categoryLabels) as string[]).join("|") ===
      "concert|dj|dance|ballet|opera|play|theater|comedy|variety",
    "Discovery categories should cover concerts, DJ sets, dance, ballet, opera, plays, theater, comedy, and adjacent live events."
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
      (source) =>
        source.id === "ticketmaster-discovery" &&
        source.lane === "broad-api" &&
        source.status === "integration-ready"
    ),
    "New York should keep Ticketmaster Discovery marked as the first real provider adapter."
  );
  assert(
    getDiscoverySourceStrategy("nyc")?.readyBroadApiSourceCount === 1,
    "New York source strategy should start with a ready broad API lane."
  );
  const nycCoverage = getDiscoveryCategoryCoverage("nyc");
  const nycPlayCoverage = nycCoverage.find((coverage) => coverage.category === "play");
  const nycDanceCoverage = nycCoverage.find((coverage) => coverage.category === "dance");

  assert(
    nycCoverage.length === getDiscoveryMarketPlan("nyc")?.categoryFocus.length,
    "New York category coverage should describe every priority category."
  );
  assert(
    nycPlayCoverage?.coverageLevel === "ready-local" &&
      nycPlayCoverage.readyLocalPipelineSourceIds.includes("nyc-partner-feed") &&
      !nycPlayCoverage.needsLocalPipeline,
    "New York plays should already have ready local pipeline coverage."
  );
  assert(
    nycDanceCoverage?.coverageLevel === "broad-api-ready" &&
      nycDanceCoverage.needsLocalPipeline &&
      nycDanceCoverage.partnerNeededLocalPipelineSourceIds.includes("nyc-venue-direct"),
    "New York dance should be broad-API covered while still needing a local pipeline partner."
  );
  assert(
    getLocalPipelinePriorityCategories("nyc").includes("dance"),
    "Local pipeline priorities should identify broad-API-covered categories that still need local depth."
  );
  assert(
    (getDiscoverySourceStrategy("nyc")?.localPipelineSourceCount ?? 0) >= 3,
    "New York source strategy should keep selective local pipelines available after broad APIs."
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
      (source) => source.sourceType === "calendar-feed" && source.lane === "local-pipeline"
    ),
    "Hudson should include a regional-calendar path for smaller-market discovery."
  );
  assert(
    getDiscoverySourceStrategy("hudson")?.readyBroadApiSourceCount === 1,
    "Hudson should still run broad marketplace APIs before local gap filling."
  );
  const hudsonConcertCoverage = getDiscoveryCategoryCoverage("hudson").find(
    (coverage) => coverage.category === "concert"
  );

  assert(
    hudsonConcertCoverage?.coverageLevel === "ready-local" &&
      hudsonConcertCoverage.readyLocalPipelineSourceIds.includes("hudson-calendar-feed"),
    "Hudson concerts should be covered by the reusable local calendar pipeline."
  );
  assert(
    !getLocalPipelinePriorityCategories("hudson").includes("concert"),
    "Hudson concerts should not be prioritized for bespoke local work once the calendar feed covers them."
  );
  assert(
    getNextLocalDiscoverySources("hudson")[0]?.id === "hudson-calendar-feed",
    "Hudson's next local pipeline should be the reusable regional calendar source before bespoke venue work."
  );
  assert(
    getDiscountLeversForMarket("hudson").includes("regional preview allocations"),
    "Hudson should keep a regional discount lever for later experiments."
  );
  assert(
    createEventProviders({ ticketmasterApiKey: "" }).map((provider) => provider.id).join("|") ===
      "local-catalog|partner-feed|calendar-feed",
    "Default discovery providers should stay fixture and calendar backed until a marketplace key is configured."
  );
  const nycBroadApiRecommendations = getRecommendedBroadApiCandidates("nyc");
  const nycAcquisitionPlan = getDiscoveryAcquisitionPlan("nyc");
  const hudsonAcquisitionPlan = getDiscoveryAcquisitionPlan("hudson");

  assert(
    nycBroadApiRecommendations
      .slice(0, 3)
      .map((candidate) => candidate.id)
      .join("|") === "ticketmaster-discovery|eventbrite-marketplace|seatgeek-platform",
    "Broad API candidates should keep Ticketmaster first, then ticket-link/community marketplaces before local bespoke work."
  );
  assert(
    nycBroadApiRecommendations[0]?.status === "adapter-ready" &&
      nycBroadApiRecommendations[0].matchingCategories.length ===
        getDiscoveryMarketPlan("nyc")?.categoryFocus.length,
    "The first broad API candidate should be adapter-ready and cover the full New York category focus."
  );
  assert(
    nycAcquisitionPlan?.firstBroadApiCandidateId === "ticketmaster-discovery" &&
      nycAcquisitionPlan.broadApiCoverageGapCategories.length === 0 &&
      nycAcquisitionPlan.localPipelineTriggerCategories.includes("dance") &&
      nycAcquisitionPlan.shouldDelayBespokeVenueWork,
    "New York acquisition planning should start with broad APIs and defer bespoke local work until depth gaps are measured."
  );
  assert(
    hudsonAcquisitionPlan?.firstBroadApiCandidateId === "ticketmaster-discovery" &&
      hudsonAcquisitionPlan.nextLocalPipelineSourceIds[0] === "hudson-calendar-feed",
    "Hudson acquisition planning should still run broad APIs before the reusable calendar pipeline."
  );
  assert(
    getBroadApiCoverageGaps("hudson", ["ticketmaster-discovery"]).length === 0,
    "Broad API planning should distinguish baseline category coverage from local depth work."
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
  const nycAreaInventory = searchShows({
    areaId: "nyc",
    categories: [],
    query: "",
    onlyDeals: false,
    dateWindow: "all",
    referenceNow
  });
  const nycCategoryFacets = getCategoryFacets(
    nycAreaInventory,
    Object.keys(categoryLabels) as Array<keyof typeof categoryLabels>
  );
  const nycMarketSummary = getMarketDiscoverySummary(
    nycAreaInventory,
    Object.keys(categoryLabels) as Array<keyof typeof categoryLabels>
  );
  const nycNeighborhoodFacets = getNeighborhoodFacets(nycAreaInventory);
  const lowerEastSideFacet = nycNeighborhoodFacets.find(
    (facet) => facet.neighborhood === "Lower East Side"
  );
  const lowerEastSideShows = searchShows({
    areaId: "nyc",
    categories: [],
    neighborhoods: ["Lower East Side"],
    query: "",
    onlyDeals: false,
    dateWindow: "all",
    referenceNow
  });
  const under35Shows = searchShows({
    areaId: "nyc",
    categories: [],
    query: "",
    onlyDeals: false,
    maxPriceCents: 3500,
    dateWindow: "all",
    referenceNow
  });
  const cheapestNycShows = searchShows({
    areaId: "nyc",
    categories: [],
    query: "",
    onlyDeals: false,
    dateWindow: "all",
    sortMode: "cheapest",
    referenceNow
  });
  const nearbyNycShows = searchShows({
    areaId: "nyc",
    categories: [],
    query: "",
    onlyDeals: false,
    dateWindow: "all",
    sortMode: "nearby",
    referenceNow
  });
  const nycDiscoveryPicks = getDiscoveryPicks(nycAreaInventory, referenceNow, 4);
  const comedyFacet = nycCategoryFacets.find((facet) => facet.category === "comedy");
  const danceFacet = nycCategoryFacets.find((facet) => facet.category === "dance");
  const nycDateWindowFacets = getDateWindowFacets(
    nycAreaInventory,
    ["tonight", "week", "weekend"],
    referenceNow
  );
  const tonightFacet = nycDateWindowFacets.find((facet) => facet.dateWindow === "tonight");
  const weekendFacet = nycDateWindowFacets.find((facet) => facet.dateWindow === "weekend");
  const comedyDateWindowFacets = getDateWindowFacets(
    nycAreaInventory.filter((show) => show.category === "comedy"),
    ["weekend"],
    referenceNow
  );

  assert(
    nycCategoryFacets.length === Object.keys(categoryLabels).length,
    "Category facets should cover every browse category."
  );
  assert(
    nycMarketSummary.showCount === nycAreaInventory.length,
    "Market summary should expose selected-area inventory count."
  );
  assert(
    nycMarketSummary.dealCount === dealShows.length,
    "Market summary should expose selected-area deal count."
  );
  assert(
    nycMarketSummary.ticketLinkCount === 1,
    "Market summary should expose link-ready shows in the selected-area inventory."
  );
  assert(
    nycMarketSummary.activeCategoryCount ===
      nycCategoryFacets.filter((facet) => facet.showCount > 0).length,
    "Market summary should expose active category breadth."
  );
  assert(
    nycMarketSummary.sourceCount >= 3,
    "Market summary should expose inventory-source diversity for the selected area."
  );
  assert(
    nycMarketSummary.nextStartsAt === "2026-07-08T20:00:00-04:00",
    "Market summary should expose the next upcoming show time."
  );
  assert(
    lowerEastSideFacet?.showCount === 2 && lowerEastSideFacet.dealCount === 2,
    "Neighborhood facets should expose local show and deal counts."
  );
  assert(
    lowerEastSideShows.length === 2 &&
      lowerEastSideShows.every((show) => show.neighborhood === "Lower East Side"),
    "Neighborhood filters should narrow discovery within the selected market."
  );
  assert(
    under35Shows.length > 0 &&
      under35Shows.every((show) => show.ticketOffers.some((offer) => offer.priceCents <= 3500)),
    "Max-price filters should only return shows with an offer under the selected budget."
  );
  assert(
    !under35Shows.some((show) => show.id === "show-midtown-revue"),
    "Max-price filters should exclude shows whose cheapest offer is above the selected budget."
  );
  assert(
    getBestOffer(cheapestNycShows[0]!)?.priceCents ===
      Math.min(...cheapestNycShows.map((show) => getBestOffer(show)?.priceCents ?? Number.MAX_SAFE_INTEGER)),
    "Cheapest sort should put the lowest available offer first."
  );
  assert(
    nearbyNycShows.every(
      (show, index, shows) => index === 0 || shows[index - 1]!.distanceMiles <= show.distanceMiles
    ),
    "Nearby sort should order shows by distance."
  );
  const defaultFilterSummary = getDiscoveryFilterSummary({
    categories: [],
    neighborhoods: [],
    query: "",
    onlyDeals: false,
    dateWindow: "all",
    sortMode: "soonest"
  });
  const activeFilterSummary = getDiscoveryFilterSummary({
    categories: ["concert", "dj"],
    neighborhoods: ["Lower East Side"],
    query: "Alina",
    onlyDeals: true,
    maxPriceCents: 3500,
    dateWindow: "tonight",
    sortMode: "cheapest"
  });

  assert(
    defaultFilterSummary.activeCount === 0 && !defaultFilterSummary.hasActiveFilters,
    "Default discovery filters should not produce active summary chips."
  );
  assert(
    activeFilterSummary.activeCount === 7 &&
      activeFilterSummary.labels.join("|") ===
        '2 types|Lower East Side|Search "Alina"|Deals only|Under $35|Tonight|Cheapest first',
    "Active discovery filters should produce a compact summary for visible reset state."
  );
  assert(nycDiscoveryPicks.length === 4, "Discovery picks should return a bounded best-bets rail.");
  assert(
    nycDiscoveryPicks[0]?.signal === "tonight-deal" &&
      nycDiscoveryPicks[0].label === "Tonight deal",
    "NYC discovery picks should prioritize urgent discounted shows."
  );
  assert(
    nycDiscoveryPicks.every(
      (pick, index, picks) => index === 0 || picks[index - 1]!.score >= pick.score
    ),
    "Discovery picks should be sorted by score."
  );
  assert(
    comedyFacet?.showCount === 1 && comedyFacet.dealCount === 1,
    "Category facets should expose show and deal counts for discounted comedy."
  );
  assert(
    danceFacet?.showCount === 0 && danceFacet.dealCount === 0,
    "Category facets should preserve zero-count categories so users can see availability gaps."
  );
  assert(
    tonightFacet?.showCount === 2 && tonightFacet.dealCount === 2,
    "Date-window facets should expose tonight availability and deal counts."
  );
  assert(
    weekendFacet && weekendFacet.showCount > tonightFacet!.showCount && weekendFacet.dealCount > 0,
    "Date-window facets should expose broader weekend availability."
  );
  assert(
    comedyDateWindowFacets[0]?.showCount === 1 && comedyDateWindowFacets[0].dealCount === 1,
    "Date-window facets should support category-filtered inventory."
  );
  const dealInsights = getDealInsights(dealShows, referenceNow);
  const dealSummary = getDealSummary(dealShows, referenceNow);
  const comedyDeal = dealInsights.find((insight) => insight.show.id === "show-canal-comedy");

  assert(dealInsights.length === dealShows.length, "Every deal-backed show should produce a deal insight.");
  assert(
    dealInsights.every((insight, index, insights) => index === 0 || insights[index - 1]!.score >= insight.score),
    "Deal insights should be ranked by discount strength and urgency."
  );
  assert(dealSummary.strongestDeal?.show.id === dealInsights[0]?.show.id, "Deal summary should expose the top deal.");
  assert(dealSummary.topSavingsCents >= 1000, "NYC deal summary should expose meaningful top savings.");
  assert(
    comedyDeal?.strength === "best" && comedyDeal.savingsPercent === 25,
    "High-percent comedy discounts should be labeled as best deals."
  );
  assert(
    getOfferSavings(comedyDeal?.offer) === 800 && getSavingsPercent(comedyDeal?.offer) === 25,
    "Deal math should expose savings in cents and percent."
  );

  const normalizedPlay = normalizeFeedEvent(partnerFeedEvents[0]!);
  assert(normalizedPlay.category === "play", "Partner taxonomy should normalize plays separately from theater.");
  assert(
    normalizedPlay.ticketOffers[0]?.deal?.label === "Preview price",
    "Partner feed deal metadata should map onto ticket offers."
  );
  assert(
    normalizedPlay.ticketOffers[0]?.externalUrl === "https://example.com/venuecloud/vc-1001" &&
      getBestTicketLinkIntent(normalizedPlay)?.offerId === "standard",
    "Partner feed ticket URLs should map into link-ready offers."
  );
  const normalizedCalendarShow = normalizeCalendarEvent(localCalendarEvents[0]!);

  assert(
    normalizedCalendarShow.id === "calendar-hudson-arts-calendar-hac-101",
    "Calendar feed events should receive stable normalized ids."
  );
  assert(
    normalizedCalendarShow.category === "concert" &&
      normalizedCalendarShow.source === "calendar-feed",
    "Calendar taxonomy should normalize into the shared discovery model."
  );
  assert(
    normalizedCalendarShow.ticketOffers[0]?.externalUrl ===
      "https://example.com/hudson-arts-calendar/hac-101",
    "Calendar ticket links should be preserved as offer metadata without adding checkout UI."
  );
  assert(
    normalizedCalendarShow.ticketOffers[0]?.deal?.label === "Calendar preview",
    "Calendar feed deal metadata should map onto ticket offers."
  );
  const calendarTicketLink = getBestTicketLinkIntent(normalizedCalendarShow);

  assert(
    calendarTicketLink?.url === "https://example.com/hudson-arts-calendar/hac-101" &&
      calendarTicketLink.offerId === "calendar-listing",
    "Calendar ticket URLs should become safe external ticket-link intents."
  );
  assert(
    getSafeTicketUrl("javascript:alert(1)") === undefined &&
      getSafeTicketUrl("not a url") === undefined,
    "Ticket-link safety should reject unsafe or malformed URLs."
  );
  assert(
    getTicketLinkIntent(normalizedCalendarShow, {
      ...normalizedCalendarShow.ticketOffers[0]!,
      externalUrl: "mailto:tickets@example.com"
    }) === undefined,
    "Ticket-link intents should only allow HTTP or HTTPS offer URLs."
  );

  const feedSearch = searchShows({
    areaId: "nyc",
    categories: ["play"],
    query: "Small Hours",
    onlyDeals: true,
    dateWindow: "week",
    referenceNow
  });

  assert(
    feedSearch.some((show) => show.id === "feed-venuecloud-vc-1001"),
    "Search should include normalized partner feed events."
  );

  const comedySearch = searchShows({
    areaId: "nyc",
    categories: ["comedy"],
    query: "stand-up",
    onlyDeals: true,
    dateWindow: "weekend",
    referenceNow
  });

  assert(
    comedySearch.some((show) => show.id === "show-canal-comedy"),
    "NYC primary discovery should include discounted comedy inventory."
  );

  const theaterSearch = searchShows({
    areaId: "nyc",
    categories: ["theater"],
    query: "musical",
    onlyDeals: true,
    dateWindow: "week",
    referenceNow
  });

  assert(
    theaterSearch.some((show) => show.id === "show-midtown-revue"),
    "NYC primary discovery should include theater inventory separately from plays."
  );

  const varietySearch = searchShows({
    areaId: "nyc",
    categories: ["variety"],
    query: "cabaret",
    onlyDeals: true,
    dateWindow: "weekend",
    referenceNow
  });

  assert(
    varietySearch.some((show) => show.id === "show-midnight-salon"),
    "NYC primary discovery should include adjacent live variety inventory."
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
    categories: ["play"],
    query: "Orchard",
    onlyDeals: true,
    dateWindow: "week",
    referenceNow
  });

  assert(
    hudsonFeedResults.some((show) => show.id === "feed-artswire-aw-550"),
    "Composite provider should merge normalized Hudson partner-feed events."
  );
  const hudsonCalendarResults = await eventProvider.listShows({
    areaId: "hudson",
    categories: ["concert"],
    query: "Riverside",
    onlyDeals: true,
    dateWindow: "weekend",
    referenceNow
  });

  assert(
    hudsonCalendarResults.some(
      (show) =>
        show.id === "calendar-hudson-arts-calendar-hac-101" &&
        show.source === "calendar-feed"
    ),
    "Composite provider should merge reusable Hudson calendar-feed events."
  );
  const hudsonDiscoveryPicks = getDiscoveryPicks(
    searchShows({
      areaId: "hudson",
      categories: [],
      query: "",
      onlyDeals: false,
      dateWindow: "all",
      referenceNow
    }),
    referenceNow,
    5
  );
  const hudsonCalendarPick = hudsonDiscoveryPicks.find(
    (pick) => pick.show.id === "calendar-hudson-arts-calendar-hac-101"
  );

  assert(
    hudsonCalendarPick?.signal === "calendar-deal" &&
      hudsonCalendarPick.reason.includes("Local calendar"),
    "Hudson discovery picks should recognize reusable calendar-feed deals."
  );

  const hudsonVarietyShows = searchShows({
    areaId: "hudson",
    categories: ["variety"],
    query: "story cabaret",
    onlyDeals: true,
    dateWindow: "weekend",
    referenceNow
  });

  assert(
    hudsonVarietyShows.some((show) => show.id === "show-hudson-story-cabaret"),
    "Hudson discovery should include adjacent live events for the arts-town test market."
  );

  assert(
    normalizeFeedEvent({
      ...partnerFeedEvents[0]!,
      providerId: "taxonomy-check",
      externalId: "variety-1",
      taxonomy: ["spoken word", "cabaret"]
    }).category === "variety",
    "Provider taxonomy should normalize adjacent live formats into variety."
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
  const ticketmasterPlayUrl = new URL(
    buildTicketmasterDiscoveryUrl(
      {
        areaId: "nyc",
        categories: ["play"],
        query: "",
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

  assert(
    ticketmasterPlayUrl.searchParams.get("classificationName") === "theatre",
    "Ticketmaster play requests should use the theatre provider classification."
  );
  const ticketmasterVarietyUrl = new URL(
    buildTicketmasterDiscoveryUrl(
      {
        areaId: "nyc",
        categories: ["variety"],
        query: "",
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

  assert(
    ticketmasterVarietyUrl.searchParams.get("classificationName") === "miscellaneous,theatre",
    "Ticketmaster variety requests should cover adjacent live provider classifications."
  );

  const rawTicketmasterEvent = ticketmasterDiscoveryFixture._embedded?.events?.[0];
  assert(rawTicketmasterEvent, "Ticketmaster fixture should include events.");

  const normalizedTicketmasterEvent = normalizeTicketmasterEvent(rawTicketmasterEvent, "nyc");
  assert(normalizedTicketmasterEvent?.category === "theater", "Ticketmaster theatre taxonomy should normalize.");
  assert(
    normalizedTicketmasterEvent.ticketOffers[0]?.priceCents === 4950,
    "Ticketmaster price ranges should become cents-based ticket offers."
  );
  assert(
    normalizedTicketmasterEvent.ticketOffers[0]?.externalUrl ===
      "https://example.com/ticketmaster/hadestown",
    "Ticketmaster ticket links should be preserved as offer metadata."
  );
  const ticketmasterTicketLink = getBestTicketLinkIntent(normalizedTicketmasterEvent);

  assert(
    ticketmasterTicketLink?.url === "https://example.com/ticketmaster/hadestown" &&
      ticketmasterTicketLink.source === "primary-marketplace",
    "Ticketmaster-normalized offers should expose an external ticket-link intent without enabling checkout UI."
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
  const alinaSeedShow = getShowById("show-alina-ives");
  assert(alinaSeedShow, "Seed catalog should include the Alina Ives show.");

  const duplicateMarketplaceShow: Show = {
    ...alinaSeedShow,
    id: "tm-duplicate-alina-ives",
    description: "Primary-marketplace duplicate with an extra ticket source.",
    source: "primary-marketplace",
    ticketOffers: [
      {
        id: "marketplace-standard",
        label: "Marketplace standard",
        priceCents: 3600,
        currency: "USD",
        remaining: 80,
        maxQuantity: 8,
        access: "external-transfer",
        source: "primary-marketplace",
        externalUrl: "https://example.com/marketplace/alina-ives"
      }
    ]
  };
  const duplicateMarketplaceProvider: EventProvider = {
    id: "duplicate-marketplace",
    label: "Duplicate marketplace",
    async listShows() {
      return [duplicateMarketplaceShow];
    },
    async getShow(showId: string) {
      return showId === duplicateMarketplaceShow.id ? duplicateMarketplaceShow : undefined;
    }
  };
  const mergedCompositeShows = await new CompositeEventProvider([
    new LocalCatalogProvider(),
    duplicateMarketplaceProvider
  ]).listShows({
    areaId: "nyc",
    categories: ["concert"],
    query: "Alina",
    onlyDeals: false,
    dateWindow: "all",
    referenceNow
  });
  const mergedAlinaShows = mergedCompositeShows.filter((show) => show.title === alinaSeedShow.title);
  const mergedAlinaShow = mergedAlinaShows[0];

  assert(mergedAlinaShows.length === 1, "Composite discovery should collapse duplicate cross-source events.");
  assert(
    mergedAlinaShow?.id === "show-alina-ives",
    "Duplicate merging should keep the richer local/deal-backed show as the display record."
  );
  assert(
    mergedAlinaShow.ticketOffers.some((offer) => offer.id === "ga") &&
      mergedAlinaShow.ticketOffers.some((offer) => offer.id === "marketplace-standard"),
    "Duplicate merging should preserve ticket offers from each source."
  );
  assert(
    getShowById("tm-duplicate-alina-ives")?.id === "show-alina-ives",
    "Duplicate provider ids should resolve to the merged show after composite discovery."
  );
  assert(
    getShowById("show-alina-ives")?.ticketOffers.some(
      (offer) => offer.id === "marketplace-standard"
    ),
    "Display ids should resolve to the runtime merged show after cross-source dedupe."
  );
  const mergedMarketplaceHold = await ticketingProvider.createHold({
    showId: "show-alina-ives",
    offerId: "marketplace-standard",
    quantity: 1
  });

  assert(
    mergedMarketplaceHold.subtotalCents === 3600,
    "Ticketing holds should accept offers merged into the display show id."
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
  const maxPriceDealAlert = createDealAlert(
    {
      areaId: "nyc",
      categories: [],
      dateWindow: "weekend",
      maxPriceCents: 3500
    },
    "2026-07-08T12:00:00.000Z"
  );
  const maxPriceAlertMatches = getDealAlertMatches([maxPriceDealAlert], dealShows, referenceNow);

  assert(
    maxPriceDealAlert.id.endsWith("under-3500"),
    "Max-price deal alerts should carry the price rule in their id."
  );
  assert(
    maxPriceAlertMatches.length > 0 &&
      maxPriceAlertMatches.every((match) => match.offer.priceCents <= 3500),
    "Max-price deal alerts should only match offers under the selected price."
  );
  assert(
    !maxPriceAlertMatches.some((match) => match.show.id === "show-midtown-revue"),
    "Max-price deal alerts should exclude higher-priced discounted shows."
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
  const calendarHold = await ticketingProvider.createHold({
    showId: "calendar-hudson-arts-calendar-hac-101",
    offerId: "calendar-listing",
    quantity: 1
  });

  assert(calendarHold.subtotalCents === 2800, "Ticketing should accept normalized calendar feed inventory.");
  assert(calendarHold.discountCents === 700, "Calendar-originated deals should apply to ticket holds.");

  const repository = new AppRepository(new MemoryStorageAdapter());

  await repository.saveOrders([order]);
  const storedOrders = await repository.loadOrders();

  assert(storedOrders.length === 1, "Repository should persist ticket orders.");
  assert(storedOrders[0]?.tickets.length === 2, "Persisted order should include minted tickets.");

  await repository.savePreferences({
    selectedAreaId: "nyc",
    selectedCategories: ["concert"],
    selectedNeighborhoods: ["Lower East Side"],
    dateWindow: "tonight",
    discoverySortMode: "cheapest",
    onlyDeals: true,
    maxPriceCents: 5000,
    dealAlertMaxPriceCents: 3500,
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
  assert(
    storedPreferences.dealAlertMaxPriceCents === 3500,
    "Repository should persist deal alert max-price preference."
  );
  assert(storedPreferences.dateWindow === "tonight", "Repository should persist date window preference.");
  assert(
    storedPreferences.discoverySortMode === "cheapest",
    "Repository should persist discovery sort preference."
  );
  assert(storedPreferences.maxPriceCents === 5000, "Repository should persist discovery max-price preference.");
  assert(
    storedPreferences.savedShowIds.includes("show-alina-ives"),
    "Repository should persist saved shows."
  );
  assert(
    storedPreferences.selectedNeighborhoods.includes("Lower East Side"),
    "Repository should persist selected neighborhoods."
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
