import { createTicketmasterProviderDiagnostics } from "../src/services/providerDiagnostics";
import {
  readPublicDiscoveryConfig
} from "../src/services/eventProviderFactory";
import { FetchTicketmasterDiscoveryClient } from "../src/services/ticketmasterProvider";
import type { ShowSearchFilters } from "../src/types";
import { loadLocalEnv } from "./env";

async function main() {
  loadLocalEnv();

  const config = readPublicDiscoveryConfig();
  const apiKey = config.ticketmasterApiKey?.trim();

  if (!apiKey) {
    console.log("Ticketmaster provider diagnostics skipped.");
    console.log("Set EXPO_PUBLIC_TICKETMASTER_API_KEY to measure live provider supply.");
    return;
  }

  const referenceNow = new Date().toISOString();
  const filters: ShowSearchFilters = {
    areaId: "nyc",
    categories: [],
    query: "",
    onlyDeals: false,
    dateWindow: "all",
    sortMode: "soonest",
    referenceNow
  };
  const diagnostics = await createTicketmasterProviderDiagnostics(filters, {
    apiKey,
    client: config.ticketmasterClient ?? new FetchTicketmasterDiscoveryClient(),
    endpoint: config.ticketmasterEndpoint,
    radiusMiles: config.ticketmasterRadiusMiles,
    pageSize: config.ticketmasterPageSize,
    maxPages: config.ticketmasterMaxPages,
    now: config.now
  });

  console.log(`Ticketmaster diagnostics - ${diagnostics.areaId.toUpperCase()}`);
  console.log(`Requested: ${diagnostics.requestedAt}`);
  console.log(`Requests: ${diagnostics.requestCount}`);
  console.log(`Raw events: ${diagnostics.rawEventCount}`);
  console.log(
    `Normalized: ${diagnostics.normalizedShowCount} (${diagnostics.duplicateShowCount} duplicates, ${diagnostics.filteredShowCount} after filters)`
  );
  console.log(
    `Ticket links: ${diagnostics.ticketLinkCount} shows; ${diagnostics.pricedOfferCount} priced offers, ${diagnostics.linkOnlyOfferCount} link-only offers`
  );

  if (diagnostics.discardReasons.length) {
    console.log("Discard reasons:");

    for (const reason of diagnostics.discardReasons) {
      console.log(`- ${reason.label}: ${reason.count}`);
    }
  }

  console.log("Categories:");

  for (const category of diagnostics.categoryCounts) {
    console.log(`- ${category.label}: ${category.count}`);
  }

  console.log("Requests:");

  for (const request of diagnostics.requests) {
    console.log(
      `- ${request.laneLabel} page ${request.page}: ${request.rawEventCount} events (${request.url})`
    );
  }
}

main().catch((error: unknown) => {
  console.error(error);
  throw error;
});
