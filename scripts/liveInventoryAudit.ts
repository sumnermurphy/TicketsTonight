import { areas, categoryLabels } from "../src/data/catalog";
import { hudsonHallHtmlCalendarFixture } from "../src/data/htmlCalendarFixtures";
import { localCalendarSources } from "../src/data/localCalendarFeeds";
import {
  createCoverageAudit,
  getCoverageAuditActionCopy
} from "../src/services/coverageAudit";
import {
  createDefaultEventProvider,
  readPublicDiscoveryConfig
} from "../src/services/eventProviderFactory";
import { importHtmlCalendarEvents } from "../src/services/htmlCalendarImporter";
import {
  createLiveSupplyAudit,
  getLiveSupplyAuditActionCopy,
  getLiveSupplyAuditStatusCopy
} from "../src/services/liveSupplyAudit";
import { createTicketmasterProviderDiagnostics } from "../src/services/providerDiagnostics";
import { createSourceInventorySummaries } from "../src/services/sourceInventoryAudit";
import { FetchTicketmasterDiscoveryClient } from "../src/services/ticketmasterProvider";
import type { ShowSearchFilters } from "../src/types";
import { loadLocalEnv } from "./env";

async function main() {
  loadLocalEnv();

  const referenceNow = new Date().toISOString();
  const config = readPublicDiscoveryConfig();
  const apiKey = config.ticketmasterApiKey?.trim();
  const liveTicketmasterEnabled = Boolean(apiKey);
  const provider = createDefaultEventProvider(config);
  const hudsonCalendarSource = localCalendarSources.find(
    (source) => source.id === "hudson-arts-calendar"
  );
  const parsedHudsonCalendar = hudsonCalendarSource
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
    const shows = await provider.listShows(filters);
    const audit = createLiveSupplyAudit(shows, {
      areaId: area.id,
      referenceNow
    });
    const coverageAudit = createCoverageAudit(shows, {
      areaId: area.id,
      referenceNow,
      windowDays: 30
    });
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

    console.log(`${area.name}, ${area.region} live inventory`);
    console.log(`App-facing events: ${shows.length}`);
    console.log(`30-day live target: ${audit.eventCount}/${audit.targetEventCount}`);
    console.log(
      `Ticket links: ${audit.ticketLinkCount}/${audit.eventCount} (${audit.ticketLinkCoveragePercent}%, target ${audit.targetTicketLinkCoveragePercent}%)`
    );
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
      const count = shows.filter((show) => show.category === category).length;

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
    } else {
      console.log("Ticketmaster: not configured");
    }

    if (area.id === "hudson" && parsedHudsonCalendar) {
      console.log(
        `HTML calendar pilot: ${parsedHudsonCalendar.importedEventCount}/${parsedHudsonCalendar.rawEventCount} imported, ${parsedHudsonCalendar.skippedEventCount} skipped`
      );
    }

    console.log("");
  }
}

main().catch((error: unknown) => {
  console.error(error);
  throw error;
});
