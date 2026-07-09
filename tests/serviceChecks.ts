import { areas, categoryLabels } from "../src/data/catalog";
import {
  galleryAreas,
  galleryExhibitions,
  galleryNeighborhoods
} from "../src/data/galleryCatalog";
import { discoveryMarketPlans } from "../src/data/discoveryPlans";
import { localSourceCandidates } from "../src/data/localSourceCandidates";
import {
  localCalendarEvents,
  localCalendarSources
} from "../src/data/localCalendarFeeds";
import {
  basilicaHudsonHtmlCalendarFixture,
  fisherCenterHtmlCalendarFixture,
  hudsonHallHtmlCalendarFixture
} from "../src/data/htmlCalendarFixtures";
import { partnerFeedEvents } from "../src/data/partnerFeeds";
import { ticketmasterDiscoveryFixture } from "../src/data/ticketmasterFixtures";
import { parseEnvFile } from "../scripts/env";
import { normalizeCalendarEvent } from "../src/services/calendarFeedProvider";
import { createCalendarImportHealthSummary } from "../src/services/calendarImportHealth";
import {
  getImportedCalendarEvents,
  runConfiguredCalendarImports
} from "../src/services/calendarImportPipeline";
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
import {
  createCoverageAudit,
  getCoverageAuditActionCopy,
  getCoverageAuditStatusCopy
} from "../src/services/coverageAudit";
import { importHtmlCalendarEvents } from "../src/services/htmlCalendarImporter";
import {
  createGallerySourceTrustSummary,
  createGallerySubmissionDraft,
  createGalleryWalkPlan,
  createNeighborhoodIntelligence,
  filterGalleryExhibitions,
  getDaysUntilGalleryCloses,
  getGalleryVisitStatus,
  getGalleryWhyGoReasons,
  getLastChanceGalleryAlerts,
  getSavedGalleryIdsFromLog,
  upsertGalleryLogEntry
} from "../src/services/galleryDiscovery";
import { createTicketmasterProviderDiagnostics } from "../src/services/providerDiagnostics";
import { checkoutBackend } from "../src/services/checkoutBackend";
import {
  getCategoryFacets,
  getDateWindowFacets,
  getMarketDiscoverySummary,
  getNeighborhoodFacets
} from "../src/services/discoveryFacets";
import { createDiscoveryQualityAudit } from "../src/services/discoveryQualityAudit";
import {
  getCuratedDiscoveryResult,
  getDiscoverySeriesSummaryCopy,
  shouldCurateDefaultDiscovery
} from "../src/services/discoveryCuration";
import { getDiscoveryFilterSummary } from "../src/services/discoveryFilterSummary";
import {
  discoveryVisibleIncrement,
  getDiscoveryInventoryStatus,
  getDiscoveryResultCountCopy,
  getNextVisibleDiscoveryCount,
  getPagedDiscoveryResults,
  getRemainingDiscoveryCount,
  initialDiscoveryVisibleCount
} from "../src/services/discoveryVisibility";
import {
  getDealInsights,
  getDealSummary,
  getOfferSavings,
  getSavingsPercent
} from "../src/services/dealDiscovery";
import { getDiscoveryPicks } from "../src/services/discoveryRanking";
import { getDiscoveryResultSections } from "../src/services/discoveryResultSections";
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
  createLocalSourceDirectorySummary,
  createLocalSourceOnboardingChecklist,
  getLocalSourceBuildStages,
  getLocalSourceCandidates,
  getRankedLocalSourceCandidates
} from "../src/services/localSourcePlanning";
import {
  CompositeEventProvider,
  getBestOffer,
  getDealShows,
  getRecommendedShows,
  getRecommendedShowsFromCatalog,
  getShowById,
  getSpotifyMatchableShows,
  LocalCatalogProvider,
  rememberShows,
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
  createLiveSupplyAudit,
  getLiveSupplyAuditActionCopy,
  getLiveSupplyAuditStatusCopy
} from "../src/services/liveSupplyAudit";
import {
  markNotificationRead,
  mergeNotifications,
  notificationProvider
} from "../src/services/notifications";
import {
  DemoSpotifyTasteProvider,
  SpotifyTasteProfileProvider,
  spotifyScopes,
  type SpotifyApiClient,
  type SpotifyAuthAdapter,
  type SpotifyAuthorizationRequest,
  type SpotifyCodeExchangeRequest
} from "../src/services/personalization";
import { createSpotifyConfigAudit } from "../src/services/spotifyConfigAudit";
import { createSourceInventorySummaries } from "../src/services/sourceInventoryAudit";
import { createSourceReadinessAudit } from "../src/services/sourceReadinessAudit";
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
  type TicketmasterDiscoveryClient,
  type TicketmasterDiscoveryEvent
} from "../src/services/ticketmasterProvider";
import type { EventProvider, Show, ShowSearchFilters } from "../src/types";

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

function createSyntheticShow(
  overrides: Partial<Show> & Pick<Show, "id" | "title" | "startsAt">
): Show {
  return {
    id: overrides.id,
    title: overrides.title,
    artistOrCompany: overrides.artistOrCompany ?? overrides.title,
    category: overrides.category ?? "dj",
    startsAt: overrides.startsAt,
    venue: overrides.venue ?? "Synthetic Room",
    neighborhood: overrides.neighborhood ?? "Test District",
    areaId: overrides.areaId ?? "nyc",
    distanceMiles: overrides.distanceMiles ?? 1.2,
    vibe: overrides.vibe ?? ["house", "late night"],
    description: overrides.description ?? "Synthetic discovery event for service checks.",
    ticketOffers:
      overrides.ticketOffers ??
      [
        {
          id: "entry",
          label: "Entry",
          priceCents: 2800,
          currency: "USD",
          remaining: 20,
          maxQuantity: 6,
          access: "mobile-entry",
          source: overrides.source ?? "primary-marketplace",
          externalUrl: "https://example.com/tickets"
        }
      ],
    source: overrides.source ?? "primary-marketplace",
    imageTone: overrides.imageTone ?? "#314E66",
    recommendationSignals: overrides.recommendationSignals ?? ["spotify:house"]
  };
}

function getRollingWindowShows(candidates: Show[], referenceNow: string, windowDays: number): Show[] {
  const now = new Date(referenceNow).getTime();
  const cutoff = now + windowDays * 24 * 60 * 60 * 1000;

  return candidates.filter((show) => {
    const startsAt = new Date(show.startsAt).getTime();

    return startsAt >= now && startsAt <= cutoff;
  });
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

  const galleryReferenceNow = "2026-07-09T15:30:00-04:00";
  const galleryAreaIds = galleryAreas.map((area) => area.id);

  assert(
    galleryAreaIds.join("|") === "nyc|la|hudson",
    "Gallery discovery should stay scoped to New York, Los Angeles, and Hudson."
  );

  for (const [areaId, expectedNeighborhoods] of [
    ["nyc", ["Chelsea", "Tribeca", "Lower East Side", "Chinatown", "Brooklyn/Bushwick"]],
    ["la", ["Culver City", "Hollywood/Sycamore", "DTLA", "Chinatown", "West Hollywood"]],
    ["hudson", ["Warren Street", "Kingston", "Beacon"]]
  ] as const) {
    const marketNeighborhoods = galleryNeighborhoods
      .filter((neighborhood) => neighborhood.areaId === areaId)
      .map((neighborhood) => neighborhood.name);

    for (const expectedNeighborhood of expectedNeighborhoods) {
      assert(
        marketNeighborhoods.includes(expectedNeighborhood),
        `Gallery neighborhoods should include ${expectedNeighborhood} for ${areaId}.`
      );
    }
  }

  const nycTrust = createGallerySourceTrustSummary("nyc", galleryExhibitions, galleryReferenceNow);
  const laTrust = createGallerySourceTrustSummary("la", galleryExhibitions, galleryReferenceNow);
  const hudsonTrust = createGallerySourceTrustSummary(
    "hudson",
    galleryExhibitions,
    galleryReferenceNow
  );

  assert(
    nycTrust.exhibitionCount >= 10 && laTrust.exhibitionCount >= 8 && hudsonTrust.exhibitionCount >= 6,
    "Gallery source trust should report enough market inventory for NYC, LA, and Hudson."
  );
  assert(
    nycTrust.openingCount >= 3 && laTrust.openingCount >= 1 && hudsonTrust.openingCount >= 1,
    "Gallery source trust should count opening-night/social supply by market."
  );
  assert(
    nycTrust.hoursCoveragePercent === 100 &&
      nycTrust.addressCoveragePercent === 100 &&
      nycTrust.externalLinkCoveragePercent === 100,
    "Gallery source trust should audit hours, address, and external-link coverage."
  );
  assert(
    nycTrust.staleSourceRiskCount > 0 && laTrust.staleSourceRiskCount > 0 && hudsonTrust.staleSourceRiskCount > 0,
    "Gallery source trust should expose stale-source risk instead of hiding it."
  );

  const galleryStatuses = new Set(
    galleryExhibitions.map((exhibition) => getGalleryVisitStatus(exhibition, galleryReferenceNow))
  );

  assert(galleryStatuses.has("open-now"), "Gallery discovery should identify open-now shows.");
  assert(galleryStatuses.has("opens-later"), "Gallery discovery should identify opens-later shows.");
  assert(galleryStatuses.has("closed-today"), "Gallery discovery should identify closed-today shows.");

  const nycOpeningTonight = filterGalleryExhibitions(galleryExhibitions, {
    areaId: "nyc",
    openingOnly: true,
    referenceNow: galleryReferenceNow
  });
  const nycAllOnView = filterGalleryExhibitions(galleryExhibitions, {
    areaId: "nyc",
    referenceNow: galleryReferenceNow
  });

  assert(
    nycOpeningTonight.length > 0 && nycOpeningTonight.length < nycAllOnView.length,
    "Opening Night Radar should separate social events tonight from exhibitions simply on view."
  );

  const nycOpenNow = filterGalleryExhibitions(galleryExhibitions, {
    areaId: "nyc",
    openOnly: true,
    referenceNow: galleryReferenceNow
  });

  assert(
    nycOpenNow.every(
      (exhibition) => getGalleryVisitStatus(exhibition, galleryReferenceNow) === "open-now"
    ),
    "Open-now filtering should be based on gallery hours."
  );

  const chelseaWalk = createGalleryWalkPlan({
    areaId: "nyc",
    mode: "quick-loop",
    neighborhood: "Chelsea",
    savedIds: ["nyc-afterimage-index", "nyc-material-weather"],
    referenceNow: galleryReferenceNow
  });
  const nycOpeningWalk = createGalleryWalkPlan({
    areaId: "nyc",
    mode: "opening-night",
    referenceNow: galleryReferenceNow
  });
  const nycLastChanceWalk = createGalleryWalkPlan({
    areaId: "nyc",
    mode: "last-chance",
    referenceNow: galleryReferenceNow
  });
  const hudsonWalk = createGalleryWalkPlan({
    areaId: "hudson",
    mode: "two-hour",
    neighborhood: "Warren Street",
    referenceNow: galleryReferenceNow
  });

  assert(
    chelseaWalk.stops.length === 2 &&
      chelseaWalk.totalMinutes <= 45 &&
      chelseaWalk.savedStopCount === 2,
    "Gallery Walk Builder should create a 45-minute route from saved exhibitions."
  );
  assert(
    nycOpeningWalk.stops.length > 0 &&
      nycOpeningWalk.stops.every((stop) =>
        filterGalleryExhibitions(galleryExhibitions, {
          areaId: "nyc",
          openingOnly: true,
          referenceNow: galleryReferenceNow
        })
          .map((exhibition) => exhibition.id)
          .includes(stop.exhibition.id)
      ),
    "Opening-night walk mode should route through social events tonight."
  );
  assert(
    nycLastChanceWalk.stops.every(
      (stop) => getDaysUntilGalleryCloses(stop.exhibition, galleryReferenceNow) <= 14
    ),
    "Last-chance walk mode should prioritize exhibitions closing soon."
  );
  assert(
    hudsonWalk.stops.length >= 3 && hudsonWalk.neighborhood === "Warren Street",
    "Hudson should support a Warren Street gallery walk while remaining an arts-town test."
  );

  const neighborhoodReadiness = createNeighborhoodIntelligence(
    "nyc",
    galleryExhibitions,
    galleryReferenceNow
  );
  const laReadiness = createNeighborhoodIntelligence("la", galleryExhibitions, galleryReferenceNow);
  const hudsonReadiness = createNeighborhoodIntelligence(
    "hudson",
    galleryExhibitions,
    galleryReferenceNow
  );

  assert(
    neighborhoodReadiness.some(
      (neighborhood) => neighborhood.neighborhood === "Chelsea" && neighborhood.canSupportWalk
    ),
    "Neighborhood intelligence should prove Chelsea can support a walk."
  );
  assert(
    laReadiness.some((neighborhood) => neighborhood.canSupportWalk),
    "Neighborhood intelligence should identify at least one LA walk-ready cluster."
  );
  assert(
    hudsonReadiness.some(
      (neighborhood) =>
        neighborhood.neighborhood === "Warren Street" && neighborhood.canSupportWalk
    ),
    "Neighborhood intelligence should prove Warren Street can support a Hudson walk."
  );

  const whyGoReasons = getGalleryWhyGoReasons(
    galleryExhibitions.find((exhibition) => exhibition.id === "nyc-afterimage-index") ??
      galleryExhibitions[0],
    galleryExhibitions,
    galleryReferenceNow,
    ["nyc-material-weather", "nyc-soft-systems", "nyc-blue-notes"]
  );

  assert(
    whyGoReasons.includes("Good first stop") &&
      whyGoReasons.includes("Opening reception tonight") &&
      whyGoReasons.includes("Closing this weekend") &&
      whyGoReasons.includes("Strong photography show"),
    "Why Go cards should explain first-stop, opening, closing, and medium reasons."
  );
  assert(
    whyGoReasons.includes("Near three other saved shows"),
    "Why Go cards should identify shows near three other saved exhibitions."
  );

  const lastChanceAlerts = getLastChanceGalleryAlerts(galleryExhibitions, {
    areaId: "nyc",
    days: 7,
    neighborhoods: ["Chelsea"],
    mediums: ["sculpture"],
    referenceNow: galleryReferenceNow
  });

  assert(
    lastChanceAlerts.some((alert) => alert.matchedSignals.includes("saved medium")),
    "Last-chance alerts should match saved artists, galleries, neighborhoods, and media lanes."
  );

  const artLog = upsertGalleryLogEntry([], "nyc-afterimage-index", "saved", "Bring a friend.");
  const visitedLog = upsertGalleryLogEntry(
    artLog,
    "nyc-afterimage-index",
    "visited",
    "Strong projection room."
  );

  assert(
    getSavedGalleryIdsFromLog(artLog).join("|") === "nyc-afterimage-index" &&
      getSavedGalleryIdsFromLog(visitedLog).length === 0 &&
      visitedLog[0]?.note === "Strong projection room.",
    "Personal Art Log should track saved, visited, and private note state."
  );

  const readySubmission = createGallerySubmissionDraft({
    galleryName: "Future Gallery",
    areaId: "nyc",
    title: "Submitted Show",
    artists: ["Test Artist"],
    opensAt: "2026-08-01T10:00:00-04:00",
    closesAt: "2026-08-30T18:00:00-04:00",
    externalUrl: "https://example.org/future-gallery/submitted-show",
    createdAt: galleryReferenceNow
  });
  const incompleteSubmission = createGallerySubmissionDraft({
    galleryName: "Future Gallery",
    createdAt: galleryReferenceNow
  });

  assert(
    readySubmission.errors.length === 0 &&
      readySubmission.draft.sourceLegalStatus === "partner-submission" &&
      readySubmission.draft.status === "ready-for-review",
    "Gallery submission drafts should create a partner-safe show update shape."
  );
  assert(
    incompleteSubmission.errors.length > 0 &&
      incompleteSubmission.draft.status === "needs-required-fields",
    "Gallery submission drafts should report missing required fields."
  );

  const visibilityShows = Array.from({ length: 130 }, (_, index): Show => ({
    id: `visibility-${index}`,
    title: `Visibility Show ${index}`,
    artistOrCompany: "Visibility Fixture",
    category: "concert",
    startsAt: `2026-07-${String(10 + Math.floor(index / 10)).padStart(2, "0")}T20:00:00-04:00`,
    venue: "Visibility Room",
    neighborhood: "New York",
    areaId: "nyc",
    distanceMiles: 1,
    vibe: ["live"],
    description: "Synthetic show for discovery visibility paging.",
    ticketOffers: [],
    source: "venue-direct",
    imageTone: "#314E66",
    recommendationSignals: ["category:concert"]
  }));
  const visibilityFirstPage = getPagedDiscoveryResults(
    visibilityShows,
    initialDiscoveryVisibleCount
  );

  assert(
    visibilityFirstPage.length === 60 && visibilityShows.length === 130,
    "Discovery visibility should keep total filtered inventory separate from the visible page."
  );
  assert(
    getNextVisibleDiscoveryCount(
      initialDiscoveryVisibleCount,
      visibilityShows.length,
      discoveryVisibleIncrement
    ) === 120 &&
      getNextVisibleDiscoveryCount(120, visibilityShows.length, discoveryVisibleIncrement) === 130,
    "Discovery visibility should load more in bounded increments without exceeding total count."
  );
  assert(
    getRemainingDiscoveryCount(visibilityShows.length, visibilityFirstPage.length) === 70,
    "Discovery visibility should report remaining filtered inventory after the visible page."
  );
  assert(
    getDiscoveryResultCountCopy({
      loading: false,
      totalCount: visibilityShows.length,
      visibleCount: visibilityFirstPage.length,
      dateWindowLabel: "All"
    }) === "Showing 60 of 130 shows · All",
    "Discovery result copy should show visible and total counts when more inventory is available."
  );
  assert(
    getPagedDiscoveryResults(visibilityShows.slice(0, 15), initialDiscoveryVisibleCount).length === 15,
    "Discovery visibility should tolerate filter resets when the filtered total is below the initial page size."
  );
  const primaryVisibilityShow: Show = {
    ...visibilityShows[0]!,
    id: "visibility-primary",
    source: "primary-marketplace",
    ticketOffers: [
      {
        id: "ticketmaster-link",
        label: "Ticket page",
        currency: "USD",
        remaining: 10,
        maxQuantity: 4,
        access: "external-transfer",
        source: "primary-marketplace",
        externalUrl: "https://example.com/tickets"
      }
    ]
  };

  assert(
    getDiscoveryInventoryStatus({
      areaId: "nyc",
      shows: [primaryVisibilityShow],
      ticketmasterConfigured: true
    }).copy === "Live inventory loaded · Primary links available",
    "Discovery status should identify live primary-marketplace inventory with ticket links."
  );
  assert(
    getDiscoveryInventoryStatus({
      areaId: "nyc",
      shows: visibilityShows.slice(0, 1),
      ticketmasterConfigured: false
    }).copy === "Local fallback inventory · Add provider key for live events",
    "Discovery status should explain fixture fallback when live provider config is missing."
  );
  assert(
    getDiscoveryInventoryStatus({
      areaId: "hudson",
      shows: [{ ...visibilityShows[0]!, areaId: "hudson", source: "calendar-feed" }],
      ticketmasterConfigured: true
    }).copy === "Local calendar coverage · Broad provider is limited in Hudson",
    "Discovery status should keep Hudson positioned as a local-calendar-led market."
  );
  assert(
    getDiscoveryInventoryStatus({
      areaId: "nyc",
      shows: visibilityShows.slice(0, 1),
      ticketmasterConfigured: true,
      inventoryError: "Provider failed"
    }).copy === "Local fallback inventory · Provider refresh failed",
    "Discovery status should make provider failures compatible with local fallback inventory."
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
    nycDanceCoverage?.coverageLevel === "ready-local" &&
      nycDanceCoverage.readyLocalPipelineSourceIds.includes("nyc-performing-arts-calendar") &&
      !nycDanceCoverage.needsLocalPipeline,
    "New York dance should now have reusable local calendar-feed depth before venue-direct work."
  );
  assert(
    !getLocalPipelinePriorityCategories("nyc").includes("dance"),
    "Local pipeline priorities should stop flagging NYC dance once the reusable calendar path covers it."
  );
  assert(
    (getDiscoverySourceStrategy("nyc")?.localPipelineSourceCount ?? 0) >= 3,
    "New York source strategy should keep selective local pipelines available after broad APIs."
  );
  assert(
    getNextLocalDiscoverySources("nyc")[0]?.id === "nyc-performing-arts-calendar",
    "New York's next local pipeline should be the reusable performing-arts calendar before bespoke venue work."
  );
  assert(
    getReadyDiscoverySources("la").some((source) => source.id === "la-partner-feed"),
    "Los Angeles should have an active partner-feed fixture for secondary-market validation."
  );
  assert(
    getNextLocalDiscoverySources("la")[0]?.id === "la-performing-arts-calendar" &&
      getLocalPipelinePriorityCategories("la").includes("dance"),
    "Los Angeles should prioritize reusable performing-arts calendars before venue-direct adapters for weak lanes."
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
    getNextLocalDiscoverySources("hudson").some(
      (source) => source.id === "hudson-fisher-center-calendar"
    ) &&
      getNextLocalDiscoverySources("hudson").some(
        (source) => source.id === "hudson-basilica-calendar"
      ),
    "Hudson source planning should include Fisher Center and Basilica as reusable calendar candidates."
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
      nycAcquisitionPlan.nextLocalPipelineSourceIds[0] === "nyc-performing-arts-calendar" &&
      nycAcquisitionPlan.shouldDelayBespokeVenueWork,
    "New York acquisition planning should start with broad APIs, then use reusable local feeds before bespoke venue work."
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
  const localSourceAreaIds = new Set(localSourceCandidates.map((candidate) => candidate.areaId));
  const sourceBuildStageIds = getLocalSourceBuildStages().map((stage) => stage.id);
  const newMarketSourceChecklist = createLocalSourceOnboardingChecklist("chicago");
  const nycSourceDirectorySummary = createLocalSourceDirectorySummary("nyc");
  const laSourceDirectorySummary = createLocalSourceDirectorySummary("la");
  const hudsonSourceDirectorySummary = createLocalSourceDirectorySummary("hudson");
  const nycRankedLocalSources = getRankedLocalSourceCandidates("nyc");
  const hudsonRankedLocalSources = getRankedLocalSourceCandidates("hudson");

  assert(
    areaIds.every((areaId) => localSourceAreaIds.has(areaId)) &&
      localSourceCandidates.length >= 30,
    "The local source directory should seed every supported market with enough venue, calendar, and partner leads."
  );
  assert(
    sourceBuildStageIds.join("|") ===
      "discover|register|sample|terms-review|normalize|dedupe|promote|monitor",
    "Local source onboarding should use a repeatable discover-to-monitor process."
  );
  assert(
    newMarketSourceChecklist.requiredFields.includes("sourceUrl") &&
      newMarketSourceChecklist.requiredFields.includes("termsPosture") &&
      newMarketSourceChecklist.sourceMixTargets.some(
        (target) => target.intakeKind === "html-calendar" && target.minimumCandidateCount === 5
      ),
    "New geography onboarding should make source URLs, terms posture, and calendar coverage mandatory."
  );
  assert(
    nycSourceDirectorySummary.candidateCount >= 12 &&
      nycSourceDirectorySummary.categoriesCovered.includes("dj") &&
      nycSourceDirectorySummary.categoriesCovered.includes("comedy") &&
      nycSourceDirectorySummary.permissionRequiredCount >= 3,
    "New York source directory should combine small venues, hidden-gem newsletters, and permission-gated leads."
  );
  assert(
    getLocalSourceCandidates("nyc").some((candidate) => candidate.id === "nyc-babys-all-right") &&
      nycRankedLocalSources
        .slice(0, 5)
        .some((candidate) => candidate.id === "nyc-performing-arts-calendar") &&
      nycRankedLocalSources.slice(0, 5).some((candidate) => candidate.id === "nyc-babys-all-right"),
    "New York local source ranking should keep proven calendars and small-room venue candidates near the top."
  );
  assert(
    laSourceDirectorySummary.topCandidateIds.includes("la-zebulon") &&
      laSourceDirectorySummary.categoriesCovered.includes("comedy") &&
      laSourceDirectorySummary.ticketLinkCandidateCount >= 9,
    "Los Angeles source directory should seed repeatable venue-calendar candidates beyond broad APIs."
  );
  assert(
    hudsonSourceDirectorySummary.readyCandidateCount >= 3 &&
      hudsonSourceDirectorySummary.topCandidateIds[0] === "hudson-arts-calendar" &&
      hudsonSourceDirectorySummary.recommendedNextAction.includes("Hudson regional arts calendar") &&
      hudsonRankedLocalSources.some((candidate) => candidate.id === "hudson-tubbys-kingston"),
    "Hudson source directory should preserve the regional calendar proof path while adding nearby small rooms."
  );
  assert(
    nycRankedLocalSources.find((candidate) => candidate.id === "nyc-resident-advisor-partner-lead")
      ?.requiresPermission,
    "Permission-gated nightlife leads should stay explicit instead of becoming scrape targets."
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
  const nycCoverageInventory = getRollingWindowShows(nycAreaInventory, referenceNow, 30);
  const nycCoverageMarketSummary = getMarketDiscoverySummary(
    nycCoverageInventory,
    Object.keys(categoryLabels) as Array<keyof typeof categoryLabels>
  );
  const nycCoverageAudit = createCoverageAudit(nycAreaInventory, {
    areaId: "nyc",
    referenceNow,
    windowDays: 30
  });
  const laAreaInventory = searchShows({
    areaId: "la",
    categories: [],
    query: "",
    onlyDeals: false,
    dateWindow: "all",
    referenceNow
  });
  const hudsonAreaInventory = searchShows({
    areaId: "hudson",
    categories: [],
    query: "",
    onlyDeals: false,
    dateWindow: "all",
    referenceNow
  });
  const laCoverageAudit = createCoverageAudit(laAreaInventory, {
    areaId: "la",
    referenceNow,
    windowDays: 30
  });
  const hudsonCoverageAudit = createCoverageAudit(hudsonAreaInventory, {
    areaId: "hudson",
    referenceNow,
    windowDays: 30
  });
  const nycLiveSupplyAudit = createLiveSupplyAudit(nycAreaInventory, {
    areaId: "nyc",
    referenceNow,
    targetEventCount: 50
  });
  const hudsonLiveSupplyAudit = createLiveSupplyAudit(hudsonAreaInventory, {
    areaId: "hudson",
    referenceNow
  });
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
  const limitedDefaultNycShows = searchShows({
    areaId: "nyc",
    categories: [],
    query: "",
    onlyDeals: false,
    dateWindow: "all",
    sortMode: "soonest",
    referenceNow,
    resultLimit: 4
  });
  const nycDiscoveryPicks = getDiscoveryPicks(nycAreaInventory, referenceNow, 4);
  const repeatedRunInventory = [
    createSyntheticShow({
      id: "synthetic-residency-1",
      title: "Night Bloom Residency",
      startsAt: "2026-07-10T22:00:00-04:00",
      venue: "Synthetic Room"
    }),
    createSyntheticShow({
      id: "synthetic-residency-2",
      title: "Night Bloom Residency",
      startsAt: "2026-07-11T22:00:00-04:00",
      venue: "Synthetic Room"
    }),
    createSyntheticShow({
      id: "synthetic-residency-3",
      title: "Night Bloom Residency",
      startsAt: "2026-07-17T22:00:00-04:00",
      venue: "Synthetic Room"
    }),
    createSyntheticShow({
      id: "synthetic-opera-oneoff",
      title: "Harbor Opera Night",
      category: "opera",
      startsAt: "2026-07-12T19:00:00-04:00",
      venue: "Harbor Stage",
      source: "calendar-feed",
      recommendationSignals: ["category:opera", "spotify:opera"]
    })
  ];
  const syntheticDefaultFilters: ShowSearchFilters = {
    areaId: "nyc",
    categories: [],
    query: "",
    onlyDeals: false,
    dateWindow: "all",
    sortMode: "soonest",
    referenceNow
  };
  const syntheticCuratedFirstPage = getCuratedDiscoveryResult(repeatedRunInventory, {
    filters: syntheticDefaultFilters,
    visibleCount: 2,
    referenceNow
  });
  const syntheticCuratedExpanded = getCuratedDiscoveryResult(repeatedRunInventory, {
    filters: syntheticDefaultFilters,
    visibleCount: 4,
    referenceNow
  });
  const syntheticCategoryFiltered = getCuratedDiscoveryResult(repeatedRunInventory, {
    filters: {
      ...syntheticDefaultFilters,
      categories: ["dj"]
    },
    visibleCount: 2,
    referenceNow
  });
  const syntheticQualityAudit = createDiscoveryQualityAudit(repeatedRunInventory, {
    areaId: "nyc",
    referenceNow,
    visibleCount: 2
  });
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
    nycMarketSummary.dealCount ===
      nycAreaInventory.filter((show) =>
        show.ticketOffers.some((offer) => Boolean(offer.deal))
      ).length,
    "Market summary should expose selected-area deal count."
  );
  assert(
    nycMarketSummary.ticketLinkCount >= 5,
    "Market summary should expose improved link-ready NYC inventory after calendar-feed expansion."
  );
  assert(
    nycCoverageAudit.targetEventCount === 200 &&
      nycCoverageAudit.targetTicketLinkCoveragePercent === 70,
    "New York coverage audit should encode the 200-event and 70-percent link targets."
  );
  assert(
    nycCoverageAudit.eventCount === nycCoverageInventory.length &&
      nycCoverageAudit.ticketLinkCount === nycCoverageMarketSummary.ticketLinkCount,
    "Coverage audit should measure the selected-area 30-day inventory and ticket-link readiness."
  );
  assert(
    nycCoverageAudit.status === "needs-events" &&
      getCoverageAuditStatusCopy(nycCoverageAudit) === "Needs supply",
    "Fixture-backed New York coverage should clearly show the current supply gap."
  );
  assert(
    getCoverageAuditActionCopy(nycCoverageAudit).includes("more events needed") &&
      nycCoverageAudit.weakCategoryGroups.some((group) => group.id === "performing-arts"),
    "Coverage audit should expose actionable event and category-depth gaps."
  );
  assert(
    nycCoverageAudit.sourceCounts.length === nycCoverageMarketSummary.sourceCount,
    "Coverage audit should report source breadth for provider expansion checks."
  );
  assert(
    nycCoverageAudit.activeCategoryCount === nycCoverageMarketSummary.activeCategoryCount &&
      nycCoverageAudit.spotifyMatchableCount === getSpotifyMatchableShows(nycCoverageInventory).length,
    "Coverage audit should report active categories and Spotify-matchable inventory."
  );
  assert(
    laCoverageAudit.targetEventCount === 100 &&
      laCoverageAudit.activeCategoryCount >= 3 &&
      laCoverageAudit.spotifyMatchableCount > 0,
    "Los Angeles coverage audit should expose secondary-market readiness and Spotify-matchable supply."
  );
  assert(
    hudsonCoverageAudit.targetEventCount === 30 &&
      hudsonCoverageAudit.targetTicketLinkCoveragePercent === 60 &&
      hudsonCoverageAudit.activeCategoryCount >= 4 &&
      hudsonCoverageAudit.spotifyMatchableCount > 0,
    "Hudson coverage audit should expose smaller-market readiness targets and Spotify-matchable supply."
  );
  assert(
    nycLiveSupplyAudit.eventCount === nycCoverageInventory.length &&
      nycLiveSupplyAudit.targetEventCount === 50 &&
      nycLiveSupplyAudit.eventGapCount ===
        Math.max(0, nycLiveSupplyAudit.targetEventCount - nycCoverageInventory.length) &&
      nycLiveSupplyAudit.status === "needs-events",
    "Live supply audit should track the 50-event NYC target separately from the broader coverage target."
  );
  assert(
    getLiveSupplyAuditStatusCopy(nycLiveSupplyAudit) === "Needs more live events" &&
      getLiveSupplyAuditActionCopy(nycLiveSupplyAudit).includes(
        `${nycLiveSupplyAudit.eventGapCount} more NYC events`
      ),
    "Live supply audit copy should make the next NYC event gap explicit."
  );
  assert(
    hudsonLiveSupplyAudit.targetEventCount === 30 &&
      getLiveSupplyAuditActionCopy(hudsonLiveSupplyAudit).includes("HUDSON events"),
    "Live supply audit should use the smaller Hudson market target by default."
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
      under35Shows.every((show) =>
        show.ticketOffers.some(
          (offer) => offer.priceCents !== undefined && offer.priceCents <= 3500
        )
      ),
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
  assert(
    limitedDefaultNycShows.length === 4 &&
      new Set(limitedDefaultNycShows.map((show) => show.category)).size >= 3,
    "Default discovery result shaping should limit visible inventory while keeping category variety."
  );
  assert(
    new Set(limitedDefaultNycShows.map((show) => show.source)).size >= 2,
    "Default discovery result shaping should keep visible inventory source-diverse when multiple sources are available."
  );
  assert(
    shouldCurateDefaultDiscovery(syntheticDefaultFilters) &&
      !shouldCurateDefaultDiscovery({ ...syntheticDefaultFilters, dateWindow: "week" }),
    "Default discovery curation should only run for the broad all-upcoming soonest view."
  );
  assert(
    syntheticCuratedFirstPage.rawCount === 4 &&
      syntheticCuratedFirstPage.curatedCount === 2 &&
      syntheticCuratedFirstPage.repeatedRunCount === 1 &&
      syntheticCuratedFirstPage.repeatedPerformanceCount === 2,
    "Discovery curation should measure raw inventory separately from curated repeated-run inventory."
  );
  assert(
    new Set(
      syntheticCuratedFirstPage.shows.map(
        (show) => syntheticCuratedFirstPage.seriesByShowId.get(show.id)?.key
      )
    ).size === syntheticCuratedFirstPage.shows.length,
    "Default discovery curation should show one representative per repeated run before repeats."
  );
  assert(
    getDiscoverySeriesSummaryCopy(
      syntheticCuratedFirstPage.seriesByShowId.get("synthetic-residency-1")
    ) === "3 upcoming dates",
    "Repeated-run representatives should expose upcoming-date copy for cards."
  );
  assert(
    syntheticCuratedExpanded.shows.length === 4 &&
      syntheticCuratedExpanded.shows.some((show) => show.id === "synthetic-residency-2"),
    "Load-more depth should still expose additional performances from repeated runs."
  );
  assert(
    !syntheticCategoryFiltered.defaultCurated &&
      syntheticCategoryFiltered.shows.map((show) => show.id).join("|") ===
        repeatedRunInventory.slice(0, 2).map((show) => show.id).join("|"),
    "Active filters should preserve individual matching performances instead of collapsing runs."
  );
  assert(
    syntheticQualityAudit.rawEventCount === 4 &&
      syntheticQualityAudit.curatedUniqueRunCount === 2 &&
      syntheticQualityAudit.duplicateDensityPercent === 50 &&
      syntheticQualityAudit.residentAdvisorReadiness.status === "strong-candidate",
    "Discovery quality audit should report raw count, curated count, duplicate density, and RA readiness."
  );
  assert(
    createDiscoveryQualityAudit(
      repeatedRunInventory.map((show) => ({ ...show, areaId: "hudson", source: "calendar-feed" })),
      { areaId: "hudson", referenceNow, visibleCount: 2 }
    ).marketExpectationCopy.includes("local-calendar-led"),
    "Hudson discovery quality audit should keep local-calendar expectations explicit."
  );
  const soonestResultSections = getDiscoveryResultSections(nycAreaInventory, {
    sortMode: "soonest",
    referenceNow
  });
  const curatedResultSections = getDiscoveryResultSections(nycAreaInventory, {
    sortMode: "soonest",
    referenceNow,
    includeBestPicks: true
  });
  const cheapestResultSections = getDiscoveryResultSections(cheapestNycShows, {
    sortMode: "cheapest",
    referenceNow
  });

  assert(
    soonestResultSections[0]?.title === "Tonight" &&
      soonestResultSections[0].showCount === 2 &&
      soonestResultSections[1]?.title === "Tomorrow",
    "Soonest discovery results should be grouped into scan-friendly date sections."
  );
  assert(
    soonestResultSections.some(
      (section) => section.title === "This weekend" && section.showCount >= 2
    ),
    "Date sections should group upcoming weekend shows into a scan-friendly weekend section."
  );
  assert(
    curatedResultSections[0]?.title === "Best live picks" &&
      !curatedResultSections
        .slice(1)
        .flatMap((section) => section.shows)
        .some((show) => curatedResultSections[0]!.shows.some((pick) => pick.id === show.id)),
    "Curated result sections should lead with best live picks without duplicating them below."
  );
  assert(
    curatedResultSections.some((section) => section.title === "This weekend"),
    "Curated result sections should group upcoming weekend inventory for scanning."
  );
  assert(
    cheapestResultSections.length === 1 &&
      cheapestResultSections[0]?.title === "Cheapest first" &&
      cheapestResultSections[0].shows.map((show) => show.id).join("|") ===
        cheapestNycShows.map((show) => show.id).join("|"),
    "Non-date sort modes should keep one sorted result section in the requested order."
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
  const parsedEnv = parseEnvFile(`
    # local provider config
    EXPO_PUBLIC_TICKETMASTER_API_KEY="tm-key"
    EXPO_PUBLIC_TICKETMASTER_MAX_PAGES=5 # wider live audit
  `);

  assert(
    parsedEnv.EXPO_PUBLIC_TICKETMASTER_API_KEY === "tm-key" &&
      parsedEnv.EXPO_PUBLIC_TICKETMASTER_MAX_PAGES === "5",
    "Local env parsing should support quoted provider keys and inline comments."
  );
  assert(nycDiscoveryPicks.length === 4, "Discovery picks should return a bounded best-bets rail.");
  assert(
    nycDiscoveryPicks[0]?.signal === "tonight-deal" &&
      nycDiscoveryPicks[0].label === "Tonight deal",
    "NYC discovery picks should prioritize urgent discounted shows."
  );
  assert(
    getDiscoveryPicks(repeatedRunInventory, referenceNow, 2).some(
      (pick) => pick.signal === "spotify-match" || pick.signal === "ticket-link"
    ),
    "Discovery picks should account for ticket links and Spotify-matchable inventory."
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
    danceFacet?.showCount && danceFacet.showCount > 0 && danceFacet.dealCount === 0,
    "Category facets should show NYC dance availability after the performing-arts calendar feed expansion."
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
  const nycCalendarSource = localCalendarSources.find(
    (source) => source.id === "nyc-performing-arts-calendar"
  );
  const hudsonCalendarSource = localCalendarSources.find(
    (source) => source.id === "hudson-arts-calendar"
  );
  const hudsonFisherCalendarSource = localCalendarSources.find(
    (source) => source.id === "hudson-fisher-center-calendar"
  );
  const hudsonBasilicaCalendarSource = localCalendarSources.find(
    (source) => source.id === "hudson-basilica-calendar"
  );
  const hudsonConcertCalendarEvent = localCalendarEvents.find(
    (event) => event.calendarId === "hudson-arts-calendar" && event.externalId === "hac-101"
  );
  const hudsonFisherOperaEvent = localCalendarEvents.find(
    (event) =>
      event.calendarId === "hudson-fisher-center-calendar" &&
      event.externalId === "fisher-2026-egyptian-helen"
  );
  const hudsonBasilicaElectronicEvent = localCalendarEvents.find(
    (event) =>
      event.calendarId === "hudson-basilica-calendar" &&
      event.externalId === "basilica-2026-boy-harsher"
  );
  const hudsonBasilicaSugarEvent = localCalendarEvents.find(
    (event) =>
      event.calendarId === "hudson-basilica-calendar" &&
      event.externalId === "basilica-2026-sugar"
  );
  const linkOnlyCalendarEvent = localCalendarEvents.find(
    (event) => event.calendarId === "nyc-performing-arts-calendar" && event.externalId === "nyc-pa-104"
  );

  assert(
    nycCalendarSource?.status === "fixture-backed" &&
      nycCalendarSource.categories.includes("dance") &&
      nycCalendarSource.categories.includes("ballet") &&
      nycCalendarSource.categories.includes("opera"),
    "NYC should define a reusable performing-arts calendar source for dance, ballet, and opera depth."
  );
  assert(
    hudsonCalendarSource?.categories.join("|") === "concert|dance|opera|play|theater|variety" &&
      hudsonCalendarSource.status === "parser-ready" &&
      hudsonCalendarSource.parserProfile?.mode === "auto",
    "Hudson should define a category-complete reusable regional calendar parser source."
  );
  assert(
    hudsonFisherCalendarSource?.categories.includes("opera") &&
      hudsonFisherCalendarSource.categories.includes("concert") &&
      hudsonFisherCalendarSource.sourceUrl === "https://fishercenter.bard.edu/whats-on/" &&
      hudsonFisherCalendarSource.status === "parser-ready" &&
      hudsonFisherCalendarSource.parserProfile?.mode === "event-list",
    "Hudson should add Fisher Center as a reusable performing-arts calendar source."
  );
  assert(
    hudsonBasilicaCalendarSource?.categories.includes("concert") &&
      hudsonBasilicaCalendarSource.categories.includes("dj") &&
      hudsonBasilicaCalendarSource.sourceUrl === "https://basilicahudson.org/events/" &&
      hudsonBasilicaCalendarSource.status === "parser-ready" &&
      hudsonBasilicaCalendarSource.parserProfile?.mode === "event-list",
    "Hudson should add Basilica Hudson as a reusable music and electronic-adjacent calendar source."
  );
  assert(hudsonConcertCalendarEvent, "Hudson calendar fixtures should include a concert listing.");
  assert(hudsonFisherOperaEvent, "Hudson Fisher Center fixtures should include an opera listing.");
  assert(
    hudsonBasilicaElectronicEvent,
    "Hudson Basilica fixtures should include an electronic-adjacent listing."
  );
  assert(hudsonBasilicaSugarEvent, "Hudson Basilica fixtures should include additional future concerts.");
  assert(linkOnlyCalendarEvent, "NYC calendar fixtures should include a link-only listing.");
  assert(hudsonCalendarSource, "Hudson calendar source should be available for importer tests.");
  assert(hudsonFisherCalendarSource, "Fisher source should be available for importer tests.");
  assert(hudsonBasilicaCalendarSource, "Basilica source should be available for importer tests.");

  const normalizedCalendarShow = normalizeCalendarEvent(hudsonConcertCalendarEvent);
  const normalizedFisherOperaShow = normalizeCalendarEvent(hudsonFisherOperaEvent);
  const normalizedBasilicaElectronicShow = normalizeCalendarEvent(hudsonBasilicaElectronicEvent);
  const normalizedBasilicaSugarShow = normalizeCalendarEvent(hudsonBasilicaSugarEvent);
  const normalizedLinkOnlyCalendarShow = normalizeCalendarEvent(linkOnlyCalendarEvent);
  const hudsonHtmlCalendarImport = importHtmlCalendarEvents(
    hudsonHallHtmlCalendarFixture,
    hudsonCalendarSource,
    { importedAt: referenceNow }
  );
  const fisherHtmlCalendarImport = importHtmlCalendarEvents(
    fisherCenterHtmlCalendarFixture,
    hudsonFisherCalendarSource,
    { importedAt: referenceNow }
  );
  const basilicaHtmlCalendarImport = importHtmlCalendarEvents(
    basilicaHudsonHtmlCalendarFixture,
    hudsonBasilicaCalendarSource,
    { importedAt: referenceNow }
  );
  const importedRuckusEvent = hudsonHtmlCalendarImport.events.find((event) =>
    event.title.includes("Ruckus")
  );
  const importedFisherOperaEvent = fisherHtmlCalendarImport.events.find(
    (event) => event.title === "The Egyptian Helen"
  );
  const importedBasilicaSugarEvent = basilicaHtmlCalendarImport.events.find(
    (event) => event.title === "SUGAR"
  );
  const normalizedImportedRuckusShow = importedRuckusEvent
    ? normalizeCalendarEvent(importedRuckusEvent)
    : undefined;

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
      "https://hudsonhall.org/event/ruckus/",
    "Calendar ticket links should be preserved as offer metadata without adding checkout UI."
  );
  assert(
    normalizedCalendarShow.ticketOffers[0]?.deal?.label === "Free concert",
    "Calendar feed deal metadata should map onto ticket offers."
  );
  assert(
    normalizedFisherOperaShow.category === "opera" &&
      normalizedFisherOperaShow.ticketOffers[0]?.externalUrl ===
        "https://fishercenter.bard.edu/series/the-egyptian-helen/",
    "Fisher Center fixtures should preserve opera taxonomy and real event links."
  );
  assert(
    normalizedBasilicaElectronicShow.category === "dj" &&
      normalizedBasilicaElectronicShow.ticketOffers[0]?.externalUrl ===
        "https://basilicahudson.org/events/soundscape-presents-boy-harsher/",
    "Basilica fixtures should add electronic-adjacent Hudson inventory with a real event link."
  );
  assert(
    normalizedBasilicaSugarShow.category === "concert" &&
      normalizedBasilicaSugarShow.ticketOffers[0]?.externalUrl ===
        "https://basilicahudson.org/events/sugar/",
    "Basilica fixtures should add future Hudson concerts with real event links."
  );
  const calendarTicketLink = getBestTicketLinkIntent(normalizedCalendarShow);
  const linkOnlyCalendarTicketLink = getBestTicketLinkIntent(normalizedLinkOnlyCalendarShow);

  assert(
    calendarTicketLink?.url === "https://hudsonhall.org/event/ruckus/" &&
      calendarTicketLink.offerId === "calendar-listing",
    "Calendar ticket URLs should become safe external ticket-link intents."
  );
  assert(
    normalizedLinkOnlyCalendarShow.ticketOffers[0]?.priceCents === undefined &&
      linkOnlyCalendarTicketLink?.url ===
        "https://www.nycballet.com/season-and-tickets/fall-2026/jewels",
    "Calendar feed events with ticket URLs but no price should still expose link-only external offers."
  );
  assert(
    hudsonHtmlCalendarImport.importedEventCount === 2 &&
      hudsonHtmlCalendarImport.skippedReasons.some((reason) => reason.reason === "invalid-json"),
    "HTML calendar importer should parse JSON-LD Event blocks and report malformed source blocks."
  );
  assert(
    fisherHtmlCalendarImport.importedEventCount === 3 &&
      fisherHtmlCalendarImport.skippedReasons.some((reason) => reason.reason === "missing-start") &&
      importedFisherOperaEvent?.ticketUrl ===
        "https://fishercenter.bard.edu/series/the-egyptian-helen/",
    "HTML calendar importer should parse Fisher Center event-list cards and preserve ticket links."
  );
  assert(
    basilicaHtmlCalendarImport.importedEventCount === 5 &&
      basilicaHtmlCalendarImport.skippedReasons.some((reason) => reason.reason === "missing-title") &&
      importedBasilicaSugarEvent?.ticketUrl === "https://basilicahudson.org/events/sugar/",
    "HTML calendar importer should parse Basilica event-list cards and preserve future concert links."
  );
  assert(
    importedRuckusEvent?.ticketUrl === "https://hudsonhall.org/event/ruckus/" &&
      importedRuckusEvent.priceCents === 0 &&
      normalizedImportedRuckusShow?.source === "calendar-feed",
    "Imported HTML calendar events should preserve real ticket links and normalize into calendar-feed shows."
  );
  const fisherImportHealth = createCalendarImportHealthSummary(
    hudsonFisherCalendarSource,
    fisherHtmlCalendarImport
  );
  const basilicaImportHealth = createCalendarImportHealthSummary(
    hudsonBasilicaCalendarSource,
    basilicaHtmlCalendarImport
  );
  const configuredHudsonCalendarRuns = runConfiguredCalendarImports({
    areaId: "hudson",
    importedAt: referenceNow
  });
  const configuredHudsonParsedEvents = getImportedCalendarEvents(configuredHudsonCalendarRuns);
  const parsedWithFixtures = rememberShows([
    ...searchShows({
      areaId: "hudson",
      categories: [],
      query: "",
      onlyDeals: false,
      dateWindow: "all",
      referenceNow
    }),
    ...configuredHudsonParsedEvents.map(normalizeCalendarEvent)
  ]);

  assert(
    fisherImportHealth.ticketLinkCoveragePercent === 100 &&
      fisherImportHealth.duplicateRatePercent === 0 &&
      fisherImportHealth.issueCounts.some((issue) => issue.issue === "missing-start") &&
      fisherImportHealth.categoryLift.includes("opera"),
    "Calendar import health should report Fisher import counts, links, duplicates, issues, and category lift."
  );
  assert(
    basilicaImportHealth.importedEventCount === 5 &&
      basilicaImportHealth.ticketLinkCoveragePercent === 100 &&
      basilicaImportHealth.categoryLift.includes("dj") &&
      basilicaImportHealth.issueCounts.some((issue) => issue.issue === "missing-title") &&
      basilicaImportHealth.recommendedNextAction.includes("required-field extraction"),
    "Calendar import health should report Basilica import lift and next action."
  );
  assert(
    configuredHudsonCalendarRuns.length >= 3 &&
      configuredHudsonParsedEvents.length >= 10 &&
      parsedWithFixtures.filter((show) => show.areaId === "hudson").length ===
        searchShows({
          areaId: "hudson",
          categories: [],
          query: "",
          onlyDeals: false,
          dateWindow: "all",
          referenceNow
        }).length,
    "Configured calendar imports should dedupe cleanly against checked-in Hudson calendar fixtures."
  );
  const hudsonNoKeySourceSummaries = createSourceInventorySummaries({
    areaId: "hudson",
    referenceNow,
    parsedCalendarEvents: configuredHudsonParsedEvents,
    parsedCalendarImportedAt: referenceNow,
    ticketmasterConfigured: false
  });
  const hudsonParsedCalendarSummary = hudsonNoKeySourceSummaries.find(
    (summary) => summary.importMode === "calendar-html-import"
  );
  const hudsonTicketmasterNoKeySummary = hudsonNoKeySourceSummaries.find(
    (summary) => summary.id === "hudson-ticketmaster-discovery"
  );
  const hudsonFailedProviderSourceSummaries = createSourceInventorySummaries({
    areaId: "hudson",
    referenceNow,
    ticketmasterConfigured: true,
    ticketmasterError: "Ticketmaster request failed with 429"
  });
  const hudsonTicketmasterFailedSummary = hudsonFailedProviderSourceSummaries.find(
    (summary) => summary.id === "hudson-ticketmaster-discovery"
  );

  assert(
    hudsonParsedCalendarSummary?.status === "parsed" &&
      hudsonParsedCalendarSummary.eventCount >= 10 &&
      hudsonParsedCalendarSummary.ticketLinkCount === hudsonParsedCalendarSummary.eventCount &&
      hudsonParsedCalendarSummary.freshnessLabel === "parser sample import",
    "Source inventory summaries should distinguish multi-source parsed HTML calendar imports from checked-in fixtures."
  );
  assert(
    hudsonTicketmasterNoKeySummary?.status === "not-configured" &&
      hudsonTicketmasterNoKeySummary.importMode === "live-api" &&
      hudsonTicketmasterNoKeySummary.eventCount === 0,
    "Source inventory summaries should report Ticketmaster live API readiness in no-key mode without fetching."
  );
  assert(
    hudsonTicketmasterFailedSummary?.status === "failed" &&
      hudsonTicketmasterFailedSummary.freshnessLabel === "provider error" &&
      hudsonTicketmasterFailedSummary.notes.includes("local fallback inventory remains available"),
    "Source inventory summaries should keep configured provider errors distinct from missing keys."
  );
  const hudsonSourceReadinessAudit = createSourceReadinessAudit({
    areaId: "hudson",
    referenceNow,
    sourceSummaries: hudsonNoKeySourceSummaries,
    parsedCalendarEvents: hudsonHtmlCalendarImport.events,
    ticketmasterConfigured: false
  });
  const hudsonFisherReadiness = hudsonSourceReadinessAudit.rankedCandidates.find(
    (candidate) => candidate.id === "hudson-fisher-center-calendar"
  );
  const hudsonBasilicaReadiness = hudsonSourceReadinessAudit.rankedCandidates.find(
    (candidate) => candidate.id === "hudson-basilica-calendar"
  );
  const hudsonResidentAdvisorReadiness = hudsonSourceReadinessAudit.rankedCandidates.find(
    (candidate) => candidate.id === "resident-advisor"
  );
  const losAngelesSourceReadinessAudit = createSourceReadinessAudit({
    areaId: "la",
    referenceNow,
    ticketmasterConfigured: false
  });
  const losAngelesResidentAdvisorReadiness =
    losAngelesSourceReadinessAudit.rankedCandidates.find(
      (candidate) => candidate.id === "resident-advisor"
    );
  const losAngelesPerformingArtsReadiness =
    losAngelesSourceReadinessAudit.rankedCandidates.find(
      (candidate) => candidate.id === "la-performing-arts-calendar"
    );

  assert(
    hudsonFisherReadiness?.eventCountAdded === 3 &&
      hudsonFisherReadiness.ticketLinkCoveragePercent === 100 &&
      hudsonFisherReadiness.legalStatus === "public-calendar-review" &&
      hudsonFisherReadiness.categoryLift.includes("opera"),
    "Source readiness should measure Fisher Center event lift, ticket links, legal review state, and category lift."
  );
  assert(
    hudsonBasilicaReadiness !== undefined &&
      hudsonBasilicaReadiness.eventCountAdded >= 5 &&
      hudsonBasilicaReadiness.ticketLinkCoveragePercent === 100 &&
      hudsonBasilicaReadiness.categoryLift.includes("dj") &&
      hudsonBasilicaReadiness.recommendedNextAction.includes("Hudson"),
    "Source readiness should measure Basilica's Hudson music and electronic-adjacent lift."
  );
  assert(
    hudsonResidentAdvisorReadiness?.eventCountAdded === 0 &&
      hudsonResidentAdvisorReadiness.legalStatus === "partner-or-api-required" &&
      hudsonResidentAdvisorReadiness.marketLift === "none" &&
      hudsonResidentAdvisorReadiness.recommendedNextAction.includes("Do not use RA"),
    "Hudson RA readiness should stay low-fit and should not ingest unauthorized RA events."
  );
  assert(
    losAngelesResidentAdvisorReadiness?.eventCountAdded === 0 &&
      losAngelesResidentAdvisorReadiness.legalStatus === "partner-or-api-required" &&
      losAngelesResidentAdvisorReadiness.marketLift === "medium" &&
      losAngelesResidentAdvisorReadiness.recommendedNextAction.includes("partner/API"),
    "LA RA readiness should capture meaningful nightlife fit while requiring partner/API access."
  );
  assert(
    losAngelesPerformingArtsReadiness?.legalStatus === "public-calendar-review" &&
      losAngelesPerformingArtsReadiness.categoryLift.includes("dance") &&
      losAngelesPerformingArtsReadiness.categoryLift.includes("theater") &&
      losAngelesPerformingArtsReadiness.recommendedNextAction.includes("fixture-backed parser sample"),
    "LA source readiness should include a reusable performing-arts calendar candidate for weak lanes."
  );
  assert(
    hudsonSourceReadinessAudit.sourceInventoryEventCount >= 14 &&
      hudsonSourceReadinessAudit.sourceInventoryTicketLinkCoveragePercent >= 80,
    "Source readiness should report source-level event counts and ticket-link coverage for Hudson."
  );
  assert(
    hudsonSourceReadinessAudit.recommendedNextAction.includes("regional calendars"),
    "Hudson source readiness should recommend reusable local calendars rather than treating fixtures as the next product move."
  );
  assert(
    createSourceReadinessAudit({
      areaId: "hudson",
      referenceNow,
      sourceSummaries: hudsonFailedProviderSourceSummaries,
      ticketmasterConfigured: true
    }).rankedCandidates.some(
      (candidate) =>
        candidate.id === "ticketmaster-discovery" &&
        candidate.legalStatus === "adapter-ready" &&
        candidate.recommendedNextAction.includes("local fallback visible")
    ),
    "Source readiness should make provider failures compatible with local fallback inventory."
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
    query: "Ruckus",
    onlyDeals: true,
    dateWindow: "all",
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
    10
  );
  const hudsonCalendarPick = hudsonDiscoveryPicks.find(
    (pick) => pick.show.id === "calendar-hudson-arts-calendar-hac-101"
  );

  assert(
    hudsonCalendarPick?.signal === "calendar-deal" &&
      hudsonCalendarPick.reason.includes("Local calendar"),
    "Hudson discovery picks should recognize reusable calendar-feed deals."
  );
  const hudsonCalendarCategories = new Set(
    searchShows({
      areaId: "hudson",
      categories: [],
      query: "",
      onlyDeals: false,
      dateWindow: "all",
      referenceNow
    })
      .filter((show) => show.source === "calendar-feed")
      .map((show) => show.category)
  );

  assert(
    ["concert", "dance", "opera", "play", "theater", "variety"].every((category) =>
      hudsonCalendarCategories.has(category as keyof typeof categoryLabels)
    ),
    "Hudson calendar-feed inventory should cover concerts, dance, opera, plays, theater, and variety."
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
  assert(ticketmasterUrl.searchParams.get("size") === "100", "Ticketmaster requests should request full pages.");
  assert(ticketmasterUrl.searchParams.get("page") === "0", "Ticketmaster requests should start on page zero.");
  assert(
    ticketmasterUrl.searchParams.get("classificationName") === "theatre",
    "Ticketmaster requests should map app categories into provider classifications."
  );
  const ticketmasterDefaultUrl = new URL(
    buildTicketmasterDiscoveryUrl(
      {
        areaId: "nyc",
        categories: [],
        query: "",
        onlyDeals: false,
        dateWindow: "week",
        referenceNow
      },
      {
        apiKey: "test-key",
        now: () => new Date(referenceNow)
      }
    )
  );
  const defaultTicketmasterClassifications =
    ticketmasterDefaultUrl.searchParams.get("classificationName")?.split(",") ?? [];

  assert(
    defaultTicketmasterClassifications.includes("music") &&
      defaultTicketmasterClassifications.includes("theatre") &&
      defaultTicketmasterClassifications.includes("opera") &&
      !defaultTicketmasterClassifications.includes("sports"),
    "Unfiltered Ticketmaster requests should still stay scoped to app discovery classifications."
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
  const normalizedPhantomTicketmasterEvent = normalizeTicketmasterEvent(
    {
      ...rawTicketmasterEvent,
      id: "tm-nyc-phantom",
      name: "Phantom Of The Opera",
      classifications: [
        {
          segment: { name: "Arts & Theatre" },
          genre: { name: "Theatre" },
          subGenre: { name: "Musical" }
        }
      ]
    },
    "nyc"
  );
  assert(
    normalizedPhantomTicketmasterEvent?.category === "theater",
    "Ticketmaster Arts & Theatre taxonomy should beat opera title hints for musicals."
  );
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
  const linkOnlyTicketmasterEvent: TicketmasterDiscoveryEvent = {
    id: "tm-nyc-902",
    name: "Ailey II: New Works",
    url: "https://example.com/ticketmaster/ailey-ii",
    info: "A provider event with an external ticket page but no public price range.",
    dates: {
      start: {
        dateTime: "2026-07-12T19:00:00Z",
        localDate: "2026-07-12",
        localTime: "15:00:00"
      }
    },
    classifications: [
      {
        segment: { name: "Arts & Theatre" },
        genre: { name: "Dance" }
      }
    ],
    _embedded: {
      attractions: [{ name: "Ailey II" }],
      venues: [
        {
          name: "The Joyce Theater",
          city: { name: "New York" },
          state: { stateCode: "NY" },
          location: {
            latitude: "40.7427",
            longitude: "-74.0009"
          }
        }
      ]
    }
  };
  const normalizedLinkOnlyTicketmasterEvent = normalizeTicketmasterEvent(
    linkOnlyTicketmasterEvent,
    "nyc"
  );
  const linkOnlyTicketmasterTicketLink = normalizedLinkOnlyTicketmasterEvent
    ? getBestTicketLinkIntent(normalizedLinkOnlyTicketmasterEvent)
    : undefined;

  assert(
    normalizedLinkOnlyTicketmasterEvent?.ticketOffers[0]?.id === "ticketmaster-link" &&
      normalizedLinkOnlyTicketmasterEvent.ticketOffers[0].priceCents === undefined,
    "Ticketmaster events without price ranges should still expose link-only ticket offers."
  );
  assert(
    linkOnlyTicketmasterTicketLink?.url === "https://example.com/ticketmaster/ailey-ii" &&
      linkOnlyTicketmasterTicketLink.priceCents === undefined,
    "Link-only Ticketmaster offers should create external intents without inventing prices."
  );
  assert(
    normalizedLinkOnlyTicketmasterEvent?.category === "dance",
    "Ticketmaster Arts & Theatre dance taxonomy should normalize separately from DJ events."
  );
  assert(
    normalizeTicketmasterEvent(
      {
        ...linkOnlyTicketmasterEvent,
        id: "tm-nyc-903",
        name: "American Ballet Theatre",
        classifications: [
          {
            segment: { name: "Arts & Theatre" },
            genre: { name: "Dance" },
            subGenre: { name: "Ballet" }
          }
        ]
      },
      "nyc"
    )?.category === "ballet",
    "Ticketmaster ballet subgenres should normalize to ballet."
  );
  assert(
    normalizeTicketmasterEvent(
      {
        ...linkOnlyTicketmasterEvent,
        id: "tm-nyc-904",
        name: "Met Opera",
        classifications: [
          {
            segment: { name: "Arts & Theatre" },
            genre: { name: "Opera" },
            subGenre: { name: "Opera" }
          }
        ]
      },
      "nyc"
    )?.category === "opera",
    "Ticketmaster opera taxonomy should normalize to opera."
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
  const cachedTicketmasterClient: TicketmasterDiscoveryClient & { requestedUrls: string[] } = {
    requestedUrls: [],
    async listEvents(url: string) {
      this.requestedUrls.push(url);
      return ticketmasterDiscoveryFixture;
    }
  };
  const cachedTicketmasterProvider = new TicketmasterDiscoveryProvider({
    apiKey: "test-key",
    client: cachedTicketmasterClient,
    now: () => new Date(referenceNow)
  });

  await Promise.all([
    cachedTicketmasterProvider.listShows({
      areaId: "nyc",
      categories: [],
      query: "",
      onlyDeals: false,
      dateWindow: "week",
      sortMode: "soonest",
      resultLimit: 1,
      referenceNow
    }),
    cachedTicketmasterProvider.listShows({
      areaId: "nyc",
      categories: [],
      query: "",
      onlyDeals: false,
      dateWindow: "week",
      sortMode: "soonest",
      referenceNow
    })
  ]);

  assert(
    cachedTicketmasterClient.requestedUrls.length === 4,
    "Ticketmaster provider should share in-flight live inventory across equivalent visible and market-summary loads."
  );
  const fanoutTicketmasterClient: TicketmasterDiscoveryClient & { requestedUrls: string[] } = {
    requestedUrls: [],
    async listEvents(url: string) {
      this.requestedUrls.push(url);

      return {
        _embedded: {
          events: []
        },
        page: {
          totalElements: 0
        }
      };
    }
  };
  const fanoutTicketmasterProvider = new TicketmasterDiscoveryProvider({
    apiKey: "test-key",
    client: fanoutTicketmasterClient,
    now: () => new Date(referenceNow)
  });

  await fanoutTicketmasterProvider.listShows({
    areaId: "nyc",
    categories: [],
    query: "",
    onlyDeals: false,
    dateWindow: "week",
    referenceNow
  });

  const fanoutUrls = fanoutTicketmasterClient.requestedUrls.map((url) => new URL(url));
  const musicFanoutUrl = fanoutUrls.find(
    (url) => url.searchParams.get("classificationName") === "music"
  );
  const stageFanoutUrl = fanoutUrls.find((url) =>
    url.searchParams.get("genreId")?.includes("KnvZfZ7v7l1")
  );
  const performingArtsFanoutUrl = fanoutUrls.find((url) =>
    url.searchParams.get("genreId")?.includes("KnvZfZ7v7nI")
  );
  const adjacentLiveFanoutUrl = fanoutUrls.find((url) =>
    url.searchParams.get("genreId")?.includes("KnvZfZ7v7lJ")
  );

  assert(
    fanoutTicketmasterClient.requestedUrls.length === 4 &&
      musicFanoutUrl &&
      stageFanoutUrl?.searchParams.get("segmentId") === "KZFzniwnSyZfZ7v7na" &&
      performingArtsFanoutUrl?.searchParams.get("segmentId") === "KZFzniwnSyZfZ7v7na" &&
      adjacentLiveFanoutUrl?.searchParams.get("segmentId") === "KZFzniwnSyZfZ7v7na" &&
      performingArtsFanoutUrl.searchParams.get("classificationName") === null,
    "Unfiltered Ticketmaster provider loads should fan out with exact Arts & Theatre provider ids where names are ambiguous."
  );
  const pagedTicketmasterEvents = ticketmasterDiscoveryFixture._embedded?.events?.slice(0, 2) ?? [];

  assert(pagedTicketmasterEvents.length === 2, "Ticketmaster fixture should include paged NYC events.");

  const pagedTicketmasterClient: TicketmasterDiscoveryClient & { requestedUrls: string[] } = {
    requestedUrls: [],
    async listEvents(url: string) {
      this.requestedUrls.push(url);
      const page = Number(new URL(url).searchParams.get("page") ?? "0");
      const event = pagedTicketmasterEvents[page];

      return {
        _embedded: {
          events: event ? [event] : []
        },
        page: {
          number: page,
          size: 1,
          totalElements: pagedTicketmasterEvents.length
        }
      };
    }
  };
  const pagedTicketmasterProvider = new TicketmasterDiscoveryProvider({
    apiKey: "test-key",
    client: pagedTicketmasterClient,
    pageSize: 1,
    maxPages: 3,
    now: () => new Date(referenceNow)
  });
  const pagedTicketmasterShows = await pagedTicketmasterProvider.listShows({
    areaId: "nyc",
    categories: ["theater", "dj"],
    query: "",
    onlyDeals: false,
    dateWindow: "week",
    referenceNow
  });

  assert(
    pagedTicketmasterClient.requestedUrls.length === 2 &&
      new URL(pagedTicketmasterClient.requestedUrls[0]!).searchParams.get("page") === "0" &&
      new URL(pagedTicketmasterClient.requestedUrls[1]!).searchParams.get("page") === "1",
    "Ticketmaster provider should page through live inventory until the reported result total is reached."
  );
  assert(
    pagedTicketmasterShows.some((show) => show.id === "tm-tm-nyc-900") &&
      pagedTicketmasterShows.some((show) => show.id === "tm-tm-nyc-901"),
    "Ticketmaster pagination should merge normalized shows from multiple pages."
  );
  const diagnosticsTicketmasterClient: TicketmasterDiscoveryClient = {
    async listEvents() {
      return {
        _embedded: {
          events: [rawTicketmasterEvent, linkOnlyTicketmasterEvent]
        },
        page: {
          totalElements: 2
        }
      };
    }
  };
  const ticketmasterDiagnostics = await createTicketmasterProviderDiagnostics(
    {
      areaId: "nyc",
      categories: [],
      query: "",
      onlyDeals: false,
      dateWindow: "week",
      referenceNow
    },
    {
      apiKey: "diagnostic-key",
      client: diagnosticsTicketmasterClient,
      now: () => new Date(referenceNow)
    }
  );

  assert(
    ticketmasterDiagnostics.requestCount === 4 &&
      ticketmasterDiagnostics.rawEventCount === 8 &&
      ticketmasterDiagnostics.filteredShowCount === 2 &&
      ticketmasterDiagnostics.filteredShows.length === 2 &&
      ticketmasterDiagnostics.duplicateShowCount === 6 &&
      ticketmasterDiagnostics.duplicateRatePercent === 75 &&
      ticketmasterDiagnostics.discardedEventCount === 0,
    "Provider diagnostics should measure lane fan-out volume, duplicate rate, and discarded provider events."
  );
  assert(
    ticketmasterDiagnostics.pricedOfferCount === 1 &&
      ticketmasterDiagnostics.linkOnlyOfferCount === 1 &&
      ticketmasterDiagnostics.ticketLinkCount === 2 &&
      ticketmasterDiagnostics.ticketLinkCoveragePercent === 100,
    "Provider diagnostics should separate priced inventory from link-only ticket coverage."
  );
  const nycLiveSourceSummaries = createSourceInventorySummaries({
    areaId: "nyc",
    referenceNow,
    ticketmasterConfigured: true,
    ticketmasterDiagnostics
  });
  const nycTicketmasterLiveSource = nycLiveSourceSummaries.find(
    (summary) => summary.id === "nyc-ticketmaster-discovery"
  );

  assert(
    nycTicketmasterLiveSource?.status === "live" &&
      nycTicketmasterLiveSource.eventCount === ticketmasterDiagnostics.filteredShowCount &&
      nycTicketmasterLiveSource.duplicateRatePercent === 75 &&
      nycTicketmasterLiveSource.discardedEventCount === 0,
    "Source inventory summaries should distinguish keyed Ticketmaster live API imports from fixtures."
  );
  const discardOnlyTicketmasterClient: TicketmasterDiscoveryClient = {
    async listEvents() {
      return {
        _embedded: {
          events: [
            {
              ...linkOnlyTicketmasterEvent,
              id: "tm-discard-missing-start",
              dates: undefined
            }
          ]
        },
        page: {
          totalElements: 1
        }
      };
    }
  };
  const discardDiagnostics = await createTicketmasterProviderDiagnostics(
    {
      areaId: "nyc",
      categories: ["dance"],
      query: "",
      onlyDeals: false,
      dateWindow: "week",
      referenceNow
    },
    {
      apiKey: "diagnostic-key",
      client: discardOnlyTicketmasterClient,
      now: () => new Date(referenceNow)
    }
  );

  assert(
    discardDiagnostics.discardedEventCount === 1 &&
      discardDiagnostics.discardReasons[0]?.id === "missing-start",
    "Provider diagnostics should expose discarded Ticketmaster events and their reasons."
  );
  assert(
    ticketmasterDiagnostics.requests.every(
      (request) => request.url.includes("apikey=REDACTED") && !request.url.includes("diagnostic-key")
    ),
    "Provider diagnostics should redact Ticketmaster API keys from request URLs."
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
  const linkOnlyCompositeShows = await new CompositeEventProvider([
    new TicketmasterDiscoveryProvider({
      apiKey: "test-key",
      client: {
        async listEvents() {
          return {
            _embedded: {
              events: [linkOnlyTicketmasterEvent]
            },
            page: {
              totalElements: 1
            }
          };
        }
      },
      now: () => new Date(referenceNow)
    })
  ]).listShows({
    areaId: "nyc",
    categories: ["dance"],
    query: "",
    onlyDeals: false,
    dateWindow: "week",
    referenceNow
  });
  const linkOnlyCompositeShow = linkOnlyCompositeShows[0];

  assert(
    linkOnlyCompositeShow?.id === "tm-tm-nyc-902" &&
      getBestTicketLinkIntent(linkOnlyCompositeShow)?.offerId === "ticketmaster-link",
    "Composite discovery should preserve provider-fed link-only ticket offers."
  );
  await assertRejects(
    () =>
      ticketingProvider.createHold({
        showId: "tm-tm-nyc-902",
        offerId: "ticketmaster-link",
        quantity: 1
      }),
    "Link-only provider offers should stay outside the mocked in-app checkout path."
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
      maxPriceAlertMatches.every(
        (match) => match.offer.priceCents !== undefined && match.offer.priceCents <= 3500
      ),
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
  assert(
    recommendations[0]?.reason && (recommendations[0].matches?.length ?? 0) > 0,
    "Recommendations should explain why they were selected and expose structured match signals."
  );

  const demoTasteProfileProvider = new DemoSpotifyTasteProvider();
  const musicConnection = await demoTasteProfileProvider.connectAccount();
  const musicContext = await demoTasteProfileProvider.getRecommendationContext("nyc", musicConnection);
  const laMusicContext = await demoTasteProfileProvider.getRecommendationContext("la", musicConnection);

  assert(musicConnection.status === "connected", "Music provider should create a connected account.");
  assert(
    musicContext.spotifyTopGenres?.includes("indie pop"),
    "Connected music account should contribute Spotify top genres."
  );

  const musicRecommendations = getRecommendedShows(musicContext);
  const laMusicRecommendations = getRecommendedShowsFromCatalog(laAreaInventory, laMusicContext);
  const hudsonClassicalRecommendations = getRecommendedShowsFromCatalog(hudsonAreaInventory, {
    areaId: "hudson",
    spotifyTopGenres: ["classical"],
    recentCategories: ["opera", "ballet"]
  });
  const alinaRecommendation = musicRecommendations.find(
    (recommendation) => recommendation.show.id === "show-alina-ives"
  );

  assert(
    alinaRecommendation?.reason === "Because you listen to Alina Ives" &&
      alinaRecommendation.matches?.some((match) => match.kind === "artist"),
    "Spotify artist matches should produce stronger explainable recommendation reasons."
  );
  assert(
    musicRecommendations.some((recommendation) =>
      recommendation.matches?.some((match) => match.kind === "genre" && match.value === "indie pop")
    ),
    "Spotify genres with spaces should match catalog signals with hyphens."
  );
  assert(
    laMusicRecommendations.length > 0 &&
      laMusicRecommendations.every((recommendation) => recommendation.show.areaId === "la"),
    "Spotify recommendations should stay scoped to the active Los Angeles market."
  );
  assert(
    hudsonClassicalRecommendations.some(
      (recommendation) => recommendation.show.id === "show-hudson-opera-lab"
    ) &&
      hudsonClassicalRecommendations.every((recommendation) => recommendation.show.areaId === "hudson"),
    "Spotify recommendations should stay scoped to Hudson and lift classical/performing-arts matches."
  );

  const disconnectedMusicConnection = await demoTasteProfileProvider.disconnectAccount(musicConnection);
  const disconnectedContext = await demoTasteProfileProvider.getRecommendationContext(
    "nyc",
    disconnectedMusicConnection
  );

  assert(
    disconnectedContext.spotifyTopGenres?.length === 0,
    "Disconnected music account should stop contributing Spotify genres."
  );
  const missingSpotifyConfigAudit = createSpotifyConfigAudit({});
  const readySpotifyConfigAudit = createSpotifyConfigAudit({
    clientId: "spotify-public-client-id",
    redirectUri: "ticketstonight://spotify-auth"
  });
  const secretSpotifyConfigAudit = createSpotifyConfigAudit(
    {
      clientId: "spotify-public-client-id"
    },
    {
      clientSecret: "do-not-commit"
    }
  );

  assert(
    missingSpotifyConfigAudit.status === "missing-client-id" &&
      missingSpotifyConfigAudit.redirectUri === "ticketstonight://spotify-auth",
    "Spotify config audit should report a missing public client id and the default native redirect."
  );
  assert(
    readySpotifyConfigAudit.status === "ready" &&
      readySpotifyConfigAudit.redirectUriConfigured &&
      readySpotifyConfigAudit.scopes.includes("user-top-read"),
    "Spotify config audit should report public-client readiness without requiring a secret."
  );
  assert(
    secretSpotifyConfigAudit.status === "client-secret-present" &&
      secretSpotifyConfigAudit.action.includes("Remove Spotify client secrets"),
    "Spotify config audit should flag client secrets as unsafe for app env."
  );
  const spotifyAuthorizationRequests: SpotifyAuthorizationRequest[] = [];
  const spotifyCodeExchangeRequests: SpotifyCodeExchangeRequest[] = [];
  const fakeSpotifyAuthAdapter: SpotifyAuthAdapter = {
    async authorize(request) {
      spotifyAuthorizationRequests.push(request);

      return {
        code: "spotify-auth-code",
        codeVerifier: "spotify-code-verifier",
        redirectUri: request.redirectUri ?? "ticketstonight://spotify-auth"
      };
    },
    async exchangeCode(request) {
      spotifyCodeExchangeRequests.push(request);

      return {
        accessToken: "spotify-access-token",
        refreshToken: "spotify-refresh-token",
        expiresIn: 3600,
        scope: spotifyScopes.join(" ")
      };
    }
  };
  const fakeSpotifyApiClient: SpotifyApiClient = {
    async getCurrentUser(accessToken) {
      assert(accessToken === "spotify-access-token", "Spotify profile requests should use the exchanged token.");

      return {
        id: "spotify-real-listener",
        display_name: "Real Spotify Listener"
      };
    },
    async getTopArtists(accessToken) {
      assert(accessToken === "spotify-access-token", "Spotify artist requests should use the exchanged token.");

      return [
        {
          id: "artist-alina",
          name: "Alina Ives",
          genres: ["indie pop", "synth pop"]
        },
        {
          id: "artist-paloma",
          name: "DJ Paloma",
          genres: ["house", "electronic"]
        }
      ];
    },
    async getTopTracks(accessToken) {
      assert(accessToken === "spotify-access-token", "Spotify track requests should use the exchanged token.");

      return [
        {
          id: "track-electric-room",
          name: "Electric Room",
          artists: [{ name: "Alina Ives" }]
        }
      ];
    }
  };
  const spotifyTasteProfileProvider = new SpotifyTasteProfileProvider(
    {
      clientId: "spotify-client-id",
      redirectUri: "ticketstonight://spotify-auth",
      now: () => new Date("2026-07-08T16:00:00.000Z")
    },
    {
      authAdapter: fakeSpotifyAuthAdapter,
      apiClient: fakeSpotifyApiClient
    }
  );
  const realSpotifyConnection = await spotifyTasteProfileProvider.connectAccount();
  const realSpotifyContext = await spotifyTasteProfileProvider.getRecommendationContext(
    "nyc",
    realSpotifyConnection
  );
  const realSpotifyRecommendations = getRecommendedShowsFromCatalog(nycAreaInventory, realSpotifyContext);
  const firstSpotifyAuthorizationRequest = spotifyAuthorizationRequests[0];
  const firstSpotifyCodeExchangeRequest = spotifyCodeExchangeRequests[0];

  assert(spotifyTasteProfileProvider.isConfigured(), "Spotify provider should report configured clients.");
  assert(
    firstSpotifyAuthorizationRequest?.scopes.includes("user-top-read") &&
      firstSpotifyAuthorizationRequest.clientId === "spotify-client-id",
    "Spotify authorization should request user-top-read with the configured public client id."
  );
  assert(
    firstSpotifyCodeExchangeRequest?.codeVerifier === "spotify-code-verifier" &&
      firstSpotifyCodeExchangeRequest.redirectUri === "ticketstonight://spotify-auth",
    "Spotify token exchange should preserve the PKCE verifier and exact redirect URI."
  );
  assert(
    realSpotifyConnection.accessToken === "spotify-access-token" &&
      realSpotifyConnection.refreshToken === "spotify-refresh-token" &&
      realSpotifyConnection.expiresAt === "2026-07-08T17:00:00.000Z",
    "Spotify connection should store the exchanged token metadata for recommendation refresh groundwork."
  );
  assert(
    realSpotifyConnection.topArtists.includes("Alina Ives") &&
      realSpotifyConnection.topTracks.includes("Electric Room") &&
      realSpotifyConnection.topGenres.includes("indie pop"),
    "Spotify connection should pull top artists, tracks, and genres from the Web API."
  );
  assert(
    realSpotifyContext.spotifyTopTracks?.includes("Electric Room") &&
      realSpotifyContext.recentCategories?.includes("dj"),
    "Spotify recommendation context should expose tracks and genre-derived category signals."
  );
  assert(
    realSpotifyRecommendations[0]?.show.id === "show-alina-ives" &&
      realSpotifyRecommendations[0].reason.includes("Alina Ives"),
    "Spotify-powered ranking should lift direct artist matches with an explainable reason."
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
    showId: "calendar-hudson-arts-calendar-hac-102",
    offerId: "calendar-listing",
    quantity: 1
  });

  assert(calendarHold.subtotalCents === 4200, "Ticketing should accept priced normalized calendar feed inventory.");
  assert(calendarHold.discountCents === 0, "Calendar holds should not invent discounts when the feed only has price data.");
  await assertRejects(
    () =>
      ticketingProvider.createHold({
        showId: "calendar-nyc-performing-arts-calendar-nyc-pa-104",
        offerId: "calendar-listing",
        quantity: 1
      }),
    "Link-only calendar offers should stay outside the mocked in-app checkout path."
  );

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
