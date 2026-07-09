import { areas, categoryLabels } from "../src/data/catalog";
import {
  createDefaultEventProvider,
  readPublicDiscoveryConfig
} from "../src/services/eventProviderFactory";
import {
  createDiscoveryQualityAudit,
  getDiscoveryQualityAuditStatusCopy
} from "../src/services/discoveryQualityAudit";
import { getSafeTicketUrl } from "../src/services/ticketLinks";
import type { Show, ShowSearchFilters } from "../src/types";
import { loadLocalEnv } from "./env";

const defaultVisibleResultLimit = 60;

async function main() {
  loadLocalEnv();

  const referenceNow = new Date().toISOString();
  const config = readPublicDiscoveryConfig();
  const provider = createDefaultEventProvider(config);
  console.log(`Live Ticketmaster: ${config.ticketmasterApiKey?.trim() ? "enabled" : "not configured"}`);

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
    const audit = createDiscoveryQualityAudit(shows, {
      areaId: area.id,
      referenceNow,
      visibleCount: defaultVisibleResultLimit
    });

    console.log(`${area.name}, ${area.region} default discovery quality audit`);
    console.log(`Status: ${getDiscoveryQualityAuditStatusCopy(audit)}`);
    console.log(`Market expectation: ${audit.marketExpectationCopy}`);
    console.log(`Raw events: ${audit.rawEventCount}`);
    console.log(`Curated unique runs: ${audit.curatedUniqueRunCount}`);
    console.log(
      `Repeated-run density: ${audit.repeatedPerformanceCount} repeated performances (${audit.duplicateDensityPercent}%)`
    );
    console.log(`First page: ${audit.visibleEventCount}/${defaultVisibleResultLimit}`);
    console.log(`Ticket links: ${audit.ticketLinkCount}/${audit.rawEventCount} (${audit.ticketLinkCoveragePercent}%)`);
    console.log(`Active categories: ${audit.activeCategoryCount}`);
    console.log(`Weak lanes: ${audit.weakCategoryGroups.map((group) => group.label).join(", ") || "none"}`);
    console.log(`Spotify-matchable inventory: ${audit.spotifyMatchableCount}/${audit.rawEventCount}`);
    console.log(
      `Resident Advisor: ${audit.residentAdvisorReadiness.status} · ${audit.residentAdvisorReadiness.recommendation}`
    );
    console.log(`RA feasibility: ${audit.residentAdvisorReadiness.legalPartnerPath}`);
    console.log("First-page source mix:");

    for (const sourceCount of audit.firstPageSourceCounts) {
      console.log(`- ${sourceCount.label}: ${sourceCount.count}`);
    }

    console.log("First-page category mix:");

    for (const categoryCount of audit.firstPageCategoryCounts) {
      console.log(`- ${categoryCount.label}: ${categoryCount.count}`);
    }

    console.log("Curated first-page sample:");

    for (const show of audit.firstPageShows.slice(0, 12)) {
      console.log(`- ${formatAuditShow(show)}`);
    }

    console.log("");
  }
}

function formatAuditShow(show: Show): string {
  const hasTicketLink = show.ticketOffers.some((offer) =>
    Boolean(getSafeTicketUrl(offer.externalUrl))
  );

  return `${show.startsAt.slice(0, 10)} · ${categoryLabels[show.category]} · ${show.title} · ${show.source}${hasTicketLink ? " · link" : ""}`;
}

main().catch((error: unknown) => {
  console.error(error);
  throw error;
});
