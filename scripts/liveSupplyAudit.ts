import { areas } from "../src/data/catalog";
import {
  createDefaultEventProvider,
  readPublicDiscoveryConfig
} from "../src/services/eventProviderFactory";
import {
  createLiveSupplyAudit,
  getLiveSupplyAuditActionCopy,
  getLiveSupplyAuditStatusCopy
} from "../src/services/liveSupplyAudit";
import type { ShowSearchFilters } from "../src/types";
import { loadLocalEnv } from "./env";

async function main() {
  loadLocalEnv();

  const referenceNow = new Date().toISOString();
  const config = readPublicDiscoveryConfig();
  const liveTicketmasterEnabled = Boolean(config.ticketmasterApiKey?.trim());
  const provider = createDefaultEventProvider(config);
  console.log(`Live Ticketmaster: ${liveTicketmasterEnabled ? "enabled" : "not configured"}`);

  if (!liveTicketmasterEnabled) {
    console.log("Set EXPO_PUBLIC_TICKETMASTER_API_KEY in .env.local or your shell for live supply.");
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
    const shows = await provider.listShows(filters);
    const audit = createLiveSupplyAudit(shows, {
      areaId: area.id,
      referenceNow
    });

    console.log(`${area.name}, ${area.region} live supply audit`);
    console.log(`Events: ${audit.eventCount}/${audit.targetEventCount} (${audit.eventProgressPercent}%)`);
    console.log(
      `Ticket links: ${audit.ticketLinkCount}/${audit.eventCount} (${audit.ticketLinkCoveragePercent}%, target ${audit.targetTicketLinkCoveragePercent}%)`
    );
    console.log(
      `Ticket offers: ${audit.pricedOfferCount} priced, ${audit.linkOnlyOfferCount} link-only`
    );
    console.log(`Active categories: ${audit.activeCategoryCount}`);
    console.log(`Spotify-matchable inventory: ${audit.spotifyMatchableCount}/${audit.eventCount}`);
    console.log(`Status: ${getLiveSupplyAuditStatusCopy(audit)}`);
    console.log(`Next action: ${getLiveSupplyAuditActionCopy(audit)}`);
    console.log("Category lanes:");

    for (const group of audit.categoryGroupCounts) {
      console.log(`- ${group.label}: ${group.count}`);
    }

    console.log("");
  }
}

main().catch((error: unknown) => {
  console.error(error);
  throw error;
});
