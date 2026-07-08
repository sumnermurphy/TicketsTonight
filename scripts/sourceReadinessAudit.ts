import { areas } from "../src/data/catalog";
import { hudsonHallHtmlCalendarFixture } from "../src/data/htmlCalendarFixtures";
import { localCalendarSources } from "../src/data/localCalendarFeeds";
import { normalizeCalendarEvent } from "../src/services/calendarFeedProvider";
import { importHtmlCalendarEvents } from "../src/services/htmlCalendarImporter";
import { createLiveSupplyAudit } from "../src/services/liveSupplyAudit";
import { createTicketmasterProviderDiagnostics } from "../src/services/providerDiagnostics";
import {
  createSourceInventorySummaries,
  type SourceInventorySummary
} from "../src/services/sourceInventoryAudit";
import {
  createSourceReadinessAudit,
  type SourceReadinessCandidate
} from "../src/services/sourceReadinessAudit";
import { FetchTicketmasterDiscoveryClient } from "../src/services/ticketmasterProvider";
import { filterShows, rememberShows } from "../src/services/eventCatalog";
import { shows as seedShows } from "../src/data/catalog";
import { normalizedLocalCalendarShows } from "../src/services/calendarFeedProvider";
import { normalizedPartnerFeedShows } from "../src/services/feedProvider";
import { readPublicDiscoveryConfig } from "../src/services/eventProviderFactory";
import type { Show, ShowSearchFilters } from "../src/types";
import { loadLocalEnv } from "./env";

const topCandidateCount = 6;

async function main() {
  loadLocalEnv();

  const referenceNow = new Date().toISOString();
  const config = readPublicDiscoveryConfig();
  const apiKey = config.ticketmasterApiKey?.trim();
  const liveTicketmasterEnabled = Boolean(apiKey);
  const parsedHudsonCalendar = createParsedHudsonCalendar(referenceNow);

  console.log("Source readiness audit");
  console.log(`Live Ticketmaster: ${liveTicketmasterEnabled ? "enabled" : "not configured"}`);
  console.log(
    "Resident Advisor: partner/API candidate only; no scraping or unauthorized ingestion."
  );
  console.log("");

  for (const area of areas) {
    const filters: ShowSearchFilters = {
      areaId: area.id,
      categories: [],
      query: "",
      onlyDeals: false,
      dateWindow: "all",
      sortMode: "soonest",
      referenceNow
    };
    const ticketmasterDiagnostics =
      apiKey
        ? await createTicketmasterProviderDiagnostics(filters, {
            apiKey,
            client: config.ticketmasterClient ?? new FetchTicketmasterDiscoveryClient(),
            endpoint: config.ticketmasterEndpoint,
            radiusMiles: config.ticketmasterRadiusMiles,
            pageSize: config.ticketmasterPageSize,
            maxPages: config.ticketmasterMaxPages,
            now: config.now
          })
        : undefined;
    const parsedCalendarEvents =
      area.id === "hudson" && parsedHudsonCalendar ? parsedHudsonCalendar.events : [];
    const sourceSummaries = createSourceInventorySummaries({
      areaId: area.id,
      referenceNow,
      parsedCalendarEvents,
      parsedCalendarImportedAt: parsedHudsonCalendar?.importedAt,
      ticketmasterConfigured: liveTicketmasterEnabled,
      ticketmasterDiagnostics
    });
    const appFacingShows = createAppFacingAuditShows(
      filters,
      parsedCalendarEvents.map(normalizeCalendarEvent),
      ticketmasterDiagnostics?.filteredShows ?? []
    );
    const liveSupplyAudit = createLiveSupplyAudit(appFacingShows, {
      areaId: area.id,
      referenceNow
    });
    const readinessAudit = createSourceReadinessAudit({
      areaId: area.id,
      referenceNow,
      sourceSummaries,
      parsedCalendarEvents,
      ticketmasterConfigured: liveTicketmasterEnabled
    });

    printMarketReadiness({
      areaLabel: `${area.name}, ${area.region}`,
      eventCount: liveSupplyAudit.eventCount,
      ticketLinkCoveragePercent: liveSupplyAudit.ticketLinkCoveragePercent,
      sourceSummaries,
      rankedCandidates: readinessAudit.rankedCandidates
    });
    console.log(`Recommended next action: ${readinessAudit.recommendedNextAction}`);
    console.log(
      `RA decision: ${readinessAudit.residentAdvisorDecision.legalStatus}, ${readinessAudit.residentAdvisorDecision.marketLift} lift - ${readinessAudit.residentAdvisorDecision.recommendedNextAction}`
    );
    console.log("");
  }
}

function createParsedHudsonCalendar(referenceNow: string) {
  const hudsonCalendarSource = localCalendarSources.find(
    (source) => source.id === "hudson-arts-calendar"
  );

  return hudsonCalendarSource
    ? importHtmlCalendarEvents(hudsonHallHtmlCalendarFixture, hudsonCalendarSource, {
        importedAt: referenceNow,
        defaultVenueName: "Hudson Hall",
        defaultNeighborhood: "Warren Street",
        defaultDistanceMiles: 0.4,
        defaultImageTone: "#4A6B5F",
        defaultTags: ["regional calendar"],
        externalIdPrefix: "hudsonhall"
      })
    : undefined;
}

function printMarketReadiness({
  areaLabel,
  eventCount,
  ticketLinkCoveragePercent,
  sourceSummaries,
  rankedCandidates
}: {
  areaLabel: string;
  eventCount: number;
  ticketLinkCoveragePercent: number;
  sourceSummaries: SourceInventorySummary[];
  rankedCandidates: SourceReadinessCandidate[];
}) {
  console.log(`${areaLabel} source readiness`);
  console.log(`App-facing events: ${eventCount}`);
  console.log(`Ticket-link coverage: ${ticketLinkCoveragePercent}%`);
  console.log("Current source quality:");

  for (const summary of sourceSummaries) {
    console.log(
      `- ${summary.label}: ${summary.eventCount} events, ${summary.ticketLinkCount} links, ${summary.activeCategoryCount} categories, duplicate rate ${summary.duplicateRatePercent ?? 0}%`
    );
  }

  console.log("Ranked next sources:");

  for (const candidate of rankedCandidates.slice(0, topCandidateCount)) {
    console.log(
      `- ${candidate.label} [${candidate.kind}/${candidate.legalStatus}/${candidate.integrationEffort}]: score ${candidate.readinessScore}, events +${candidate.eventCountAdded}, links ${candidate.ticketLinkCoveragePercent}%, duplicate ${candidate.duplicateRatePercent}%, category lift ${candidate.categoryLift.join(", ") || "none"}, market lift ${candidate.marketLift}. ${candidate.recommendedNextAction}`
    );
  }
}

function createAppFacingAuditShows(
  filters: ShowSearchFilters,
  parsedCalendarShows: Show[],
  ticketmasterShows: Show[]
): Show[] {
  return filterShows(
    rememberShows([
      ...seedShows,
      ...normalizedPartnerFeedShows,
      ...normalizedLocalCalendarShows,
      ...parsedCalendarShows,
      ...ticketmasterShows
    ]),
    filters
  );
}

main().catch((error: unknown) => {
  console.error(error);
  throw error;
});
