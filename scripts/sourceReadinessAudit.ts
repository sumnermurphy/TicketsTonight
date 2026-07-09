import { areas } from "../src/data/catalog";
import { normalizeCalendarEvent } from "../src/services/calendarFeedProvider";
import {
  getImportedCalendarEvents,
  runConfiguredCalendarImports,
  type CalendarImportRun
} from "../src/services/calendarImportPipeline";
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
  const calendarImportRuns = runConfiguredCalendarImports({ importedAt: referenceNow });

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
    let ticketmasterError: string | undefined;
    const ticketmasterDiagnostics = apiKey
      ? await createTicketmasterProviderDiagnostics(filters, {
          apiKey,
          client: config.ticketmasterClient ?? new FetchTicketmasterDiscoveryClient(),
          endpoint: config.ticketmasterEndpoint,
          radiusMiles: config.ticketmasterRadiusMiles,
          pageSize: config.ticketmasterPageSize,
          maxPages: config.ticketmasterMaxPages,
          now: config.now
        }).catch((error: unknown) => {
          ticketmasterError = getErrorMessage(error);
          return undefined;
        })
      : undefined;
    const areaCalendarImportRuns = calendarImportRuns.filter(
      (run) => run.source.areaId === area.id
    );
    const parsedCalendarEvents = getImportedCalendarEvents(areaCalendarImportRuns);
    const sourceSummaries = createSourceInventorySummaries({
      areaId: area.id,
      referenceNow,
      parsedCalendarEvents,
      parsedCalendarImportedAt: getLatestCalendarImportTimestamp(areaCalendarImportRuns),
      ticketmasterConfigured: liveTicketmasterEnabled,
      ticketmasterDiagnostics,
      ticketmasterError
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
      calendarImportRuns: areaCalendarImportRuns,
      rankedCandidates: readinessAudit.rankedCandidates
    });
    console.log(`Recommended next action: ${readinessAudit.recommendedNextAction}`);
    console.log(
      `RA decision: ${readinessAudit.residentAdvisorDecision.legalStatus}, ${readinessAudit.residentAdvisorDecision.marketLift} lift - ${readinessAudit.residentAdvisorDecision.recommendedNextAction}`
    );
    console.log("");
  }
}

function printMarketReadiness({
  areaLabel,
  eventCount,
  ticketLinkCoveragePercent,
  sourceSummaries,
  calendarImportRuns,
  rankedCandidates
}: {
  areaLabel: string;
  eventCount: number;
  ticketLinkCoveragePercent: number;
  sourceSummaries: SourceInventorySummary[];
  calendarImportRuns: CalendarImportRun[];
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

  if (calendarImportRuns.length) {
    console.log("Calendar import health:");

    for (const run of calendarImportRuns) {
      const issueCopy = run.health.issueCounts
        .map((issue) => `${issue.issue}:${issue.count}`)
        .join(", ") || "none";

      console.log(
        `- ${run.source.label}: ${run.health.importedEventCount}/${run.health.rawEventCount} imported, ${run.health.skippedEventCount} skipped, ${run.health.ticketLinkCoveragePercent}% links, ${run.health.duplicateRatePercent}% duplicates, category lift ${run.health.categoryLift.join(", ") || "none"}, issues ${issueCopy}. ${run.health.recommendedNextAction}`
      );
    }
  }

  console.log("Ranked next sources:");

  for (const candidate of rankedCandidates.slice(0, topCandidateCount)) {
    console.log(
      `- ${candidate.label} [${candidate.kind}/${candidate.legalStatus}/${candidate.integrationEffort}]: score ${candidate.readinessScore}, events +${candidate.eventCountAdded}, links ${candidate.ticketLinkCoveragePercent}%, duplicate ${candidate.duplicateRatePercent}%, category lift ${candidate.categoryLift.join(", ") || "none"}, market lift ${candidate.marketLift}. ${candidate.recommendedNextAction}`
    );
  }

  const plannedLocalCandidates = rankedCandidates.filter(
    (candidate) => candidate.kind === "planned-local-pipeline"
  );

  if (plannedLocalCandidates.length) {
    console.log("Planned local-pipeline candidates:");

    for (const candidate of plannedLocalCandidates.slice(0, 4)) {
      console.log(
        `- ${candidate.label}: ${candidate.legalStatus}, ${candidate.integrationEffort} effort, category lift ${candidate.categoryLift.join(", ") || "none"}. ${candidate.recommendedNextAction}`
      );
    }
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

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function getLatestCalendarImportTimestamp(runs: CalendarImportRun[]): string | undefined {
  return runs
    .map((run) => run.result.importedAt)
    .sort()
    .at(-1);
}

main().catch((error: unknown) => {
  console.error(error);
  throw error;
});
