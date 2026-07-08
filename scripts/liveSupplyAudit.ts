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

  const areaId = "nyc";
  const referenceNow = new Date().toISOString();
  const config = readPublicDiscoveryConfig();
  const liveTicketmasterEnabled = Boolean(config.ticketmasterApiKey?.trim());
  const provider = createDefaultEventProvider(config);
  const filters: ShowSearchFilters = {
    areaId,
    categories: [],
    query: "",
    onlyDeals: false,
    dateWindow: "all",
    sortMode: "soonest",
    referenceNow
  };
  const shows = await provider.listShows(filters);
  const audit = createLiveSupplyAudit(shows, {
    areaId,
    referenceNow,
    targetEventCount: 50
  });

  console.log(`NYC live supply audit`);
  console.log(`Live Ticketmaster: ${liveTicketmasterEnabled ? "enabled" : "not configured"}`);
  console.log(`Events: ${audit.eventCount}/${audit.targetEventCount} (${audit.eventProgressPercent}%)`);
  console.log(
    `Ticket links: ${audit.ticketLinkCount}/${audit.eventCount} (${audit.ticketLinkCoveragePercent}%, target ${audit.targetTicketLinkCoveragePercent}%)`
  );
  console.log(
    `Ticket offers: ${audit.pricedOfferCount} priced, ${audit.linkOnlyOfferCount} link-only`
  );
  console.log(`Status: ${getLiveSupplyAuditStatusCopy(audit)}`);
  console.log(`Next action: ${getLiveSupplyAuditActionCopy(audit)}`);
  console.log("Category lanes:");

  for (const group of audit.categoryGroupCounts) {
    console.log(`- ${group.label}: ${group.count}`);
  }

  if (!liveTicketmasterEnabled) {
    console.log("Set EXPO_PUBLIC_TICKETMASTER_API_KEY in .env.local or your shell for live supply.");
  }
}

main().catch((error: unknown) => {
  console.error(error);
  throw error;
});
