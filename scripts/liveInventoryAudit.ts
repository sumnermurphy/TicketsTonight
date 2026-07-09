import { areas, categoryLabels, shows as seedShows } from "../src/data/catalog";
import {
  normalizeCalendarEvent,
  normalizedLocalCalendarShows
} from "../src/services/calendarFeedProvider";
import {
  getImportedCalendarEvents,
  runConfiguredCalendarImports,
  type CalendarImportRun
} from "../src/services/calendarImportPipeline";
import {
  createCoverageAudit,
  getCoverageAuditActionCopy
} from "../src/services/coverageAudit";
import { filterShows, rememberShows } from "../src/services/eventCatalog";
import { readPublicDiscoveryConfig } from "../src/services/eventProviderFactory";
import { normalizedPartnerFeedShows } from "../src/services/feedProvider";
import {
  createLiveSupplyAudit,
  getLiveSupplyAuditActionCopy,
  getLiveSupplyAuditStatusCopy
} from "../src/services/liveSupplyAudit";
import { createTicketmasterProviderDiagnostics } from "../src/services/providerDiagnostics";
import { createSourceInventorySummaries } from "../src/services/sourceInventoryAudit";
import { FetchTicketmasterDiscoveryClient } from "../src/services/ticketmasterProvider";
import type { Show, ShowSearchFilters } from "../src/types";
import { loadLocalEnv } from "./env";

async function main() {
  loadLocalEnv();

  const referenceNow = new Date().toISOString();
  const config = readPublicDiscoveryConfig();
  const apiKey = config.ticketmasterApiKey?.trim();
  const liveTicketmasterEnabled = Boolean(apiKey);
  const calendarImportRuns = runConfiguredCalendarImports({ importedAt: referenceNow });

  console.log("Live inventory audit");
  console.log(`Live Ticketmaster: ${liveTicketmasterEnabled ? "enabled" : "not configured"}`);

  if (!liveTicketmasterEnabled) {
    console.log(
      "No-key mode: fixture, feed, and calendar-parser supply are measured; Ticketmaster requests are skipped."
    );
    console.log("Set EXPO_PUBLIC_TICKETMASTER_API_KEY in .env.local for live broad-provider inventory.");
  }

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
    const appFacingShows = createAppFacingAuditShows(
      filters,
      parsedCalendarEvents.map(normalizeCalendarEvent),
      ticketmasterDiagnostics?.filteredShows ?? []
    );
    const audit = createLiveSupplyAudit(appFacingShows, {
      areaId: area.id,
      referenceNow
    });
    const coverageAudit = createCoverageAudit(appFacingShows, {
      areaId: area.id,
      referenceNow,
      windowDays: 30
    });
    const sourceSummaries = createSourceInventorySummaries({
      areaId: area.id,
      referenceNow,
      parsedCalendarEvents,
      parsedCalendarImportedAt: getLatestCalendarImportTimestamp(areaCalendarImportRuns),
      ticketmasterConfigured: liveTicketmasterEnabled,
      ticketmasterDiagnostics,
      ticketmasterError
    });

    console.log(`${area.name}, ${area.region} live inventory`);
    console.log(`App-facing events: ${appFacingShows.length}`);
    console.log(`30-day live target: ${audit.eventCount}/${audit.targetEventCount}`);
    console.log(
      `Ticket links: ${audit.ticketLinkCount}/${audit.eventCount} (${audit.ticketLinkCoveragePercent}%, target ${audit.targetTicketLinkCoveragePercent}%)`
    );
    console.log(`Readiness thresholds: ${getReadinessThresholdCopy(audit)}`);
    console.log(`Status: ${getLiveSupplyAuditStatusCopy(audit)}`);
    console.log(`Next action: ${getLiveSupplyAuditActionCopy(audit)}`);
    console.log("Provider/source inventory:");

    for (const sourceSummary of sourceSummaries) {
      console.log(
        `- ${sourceSummary.label} [${sourceSummary.importMode}/${sourceSummary.status}]: ${sourceSummary.eventCount} events, ${sourceSummary.ticketLinkCount} links, ${sourceSummary.activeCategoryCount} categories, ${sourceSummary.freshnessLabel}`
      );
    }

    console.log("Category mix:");

    for (const [category, label] of Object.entries(categoryLabels)) {
      const count = appFacingShows.filter((show) => show.category === category).length;

      if (count > 0) {
        console.log(`- ${label}: ${count}`);
      }
    }

    console.log("Weak lanes:");

    if (coverageAudit.weakCategoryGroups.length) {
      for (const group of coverageAudit.weakCategoryGroups) {
        console.log(`- ${group.label}: ${group.count}/${group.targetCount}`);
      }
    } else {
      console.log(`- none (${getCoverageAuditActionCopy(coverageAudit)})`);
    }

    if (ticketmasterDiagnostics) {
      console.log(
        `Ticketmaster: ${ticketmasterDiagnostics.filteredShowCount} filtered shows, ${ticketmasterDiagnostics.ticketLinkCoveragePercent}% link coverage, ${ticketmasterDiagnostics.duplicateRatePercent}% duplicate rate, ${ticketmasterDiagnostics.discardedEventCount} discarded`
      );
    } else if (ticketmasterError) {
      console.log(`Ticketmaster: provider error (${ticketmasterError}); local fallback still showing`);
    } else {
      console.log("Ticketmaster: not configured");
    }

    if (areaCalendarImportRuns.length) {
      console.log("HTML calendar pilots:");

      for (const run of areaCalendarImportRuns) {
        console.log(
          `- ${run.source.label}: ${run.health.importedEventCount}/${run.health.rawEventCount} imported, ${run.health.ticketLinkCoveragePercent}% links, ${run.health.duplicateRatePercent}% duplicate rate, ${run.health.skippedEventCount} skipped`
        );
      }
    }

    console.log("");
  }
}

main().catch((error: unknown) => {
  console.error(error);
  throw error;
});

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

function getReadinessThresholdCopy(summary: ReturnType<typeof createLiveSupplyAudit>): string {
  const eventStatus = summary.eventCount >= summary.targetEventCount ? "pass" : "gap";
  const linkStatus =
    summary.ticketLinkCoveragePercent >= summary.targetTicketLinkCoveragePercent ? "pass" : "gap";

  return `${eventStatus} ${summary.eventCount}/${summary.targetEventCount} events, ${linkStatus} ${summary.ticketLinkCoveragePercent}/${summary.targetTicketLinkCoveragePercent}% link coverage`;
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
