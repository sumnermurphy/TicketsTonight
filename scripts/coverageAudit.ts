import { areas } from "../src/data/catalog";
import { createCoverageAudit, getCoverageAuditActionCopy, getCoverageAuditStatusCopy } from "../src/services/coverageAudit";
import {
  createDefaultEventProvider,
  readPublicDiscoveryConfig
} from "../src/services/eventProviderFactory";
import type { ShowSearchFilters } from "../src/types";
import { loadLocalEnv } from "./env";

async function main() {
  loadLocalEnv();

  const referenceNow = new Date().toISOString();
  const provider = createDefaultEventProvider(readPublicDiscoveryConfig());

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
    const audit = createCoverageAudit(shows, {
      areaId: area.id,
      referenceNow,
      windowDays: 30
    });

    console.log(`Coverage audit - ${area.name}, ${area.region} (${area.discoveryLabel})`);
    console.log(`Events: ${audit.eventCount}/${audit.targetEventCount} (${audit.eventProgressPercent}%)`);
    console.log(
      `Ticket links: ${audit.ticketLinkCount}/${audit.eventCount} (${audit.ticketLinkCoveragePercent}%, target ${audit.targetTicketLinkCoveragePercent}%)`
    );
    console.log(
      `Ticket offers: ${audit.pricedOfferCount} priced, ${audit.linkOnlyOfferCount} link-only`
    );
    console.log(`Active categories: ${audit.activeCategoryCount}`);
    console.log(`Spotify-matchable inventory: ${audit.spotifyMatchableCount}/${audit.eventCount}`);
    console.log(`Status: ${getCoverageAuditStatusCopy(audit)}`);
    console.log(`Next action: ${getCoverageAuditActionCopy(audit)}`);
    console.log("Category lanes:");

    for (const group of audit.categoryGroupCounts) {
      console.log(
        `- ${group.label}: ${group.count}/${group.targetCount}${group.passes ? " ok" : " gap"}`
      );
    }

    console.log("Sources:");

    for (const sourceCount of audit.sourceCounts) {
      console.log(`- ${sourceCount.source}: ${sourceCount.count}`);
    }

    console.log("");
  }
}

main().catch((error: unknown) => {
  console.error(error);
  throw error;
});
