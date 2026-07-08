import { createCoverageAudit, getCoverageAuditActionCopy, getCoverageAuditStatusCopy } from "../src/services/coverageAudit";
import {
  createDefaultEventProvider,
  readPublicDiscoveryConfig
} from "../src/services/eventProviderFactory";
import type { ShowSearchFilters } from "../src/types";

async function main() {
  const areaId = "nyc";
  const referenceNow = new Date().toISOString();
  const provider = createDefaultEventProvider(readPublicDiscoveryConfig());
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
  const audit = createCoverageAudit(shows, {
    areaId,
    referenceNow,
    windowDays: 30
  });

  console.log(`Coverage audit - ${areaId.toUpperCase()}`);
  console.log(`Events: ${audit.eventCount}/${audit.targetEventCount} (${audit.eventProgressPercent}%)`);
  console.log(
    `Ticket links: ${audit.ticketLinkCount}/${audit.eventCount} (${audit.ticketLinkCoveragePercent}%, target ${audit.targetTicketLinkCoveragePercent}%)`
  );
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
}

main().catch((error: unknown) => {
  console.error(error);
  throw error;
});
