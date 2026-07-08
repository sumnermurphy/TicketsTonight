import { areas, categoryLabels } from "../src/data/catalog";
import {
  createDefaultEventProvider,
  readPublicDiscoveryConfig
} from "../src/services/eventProviderFactory";
import { createCoverageAudit } from "../src/services/coverageAudit";
import { getMarketDiscoverySummary } from "../src/services/discoveryFacets";
import { getSpotifyMatchableShows } from "../src/services/eventCatalog";
import { getSafeTicketUrl } from "../src/services/ticketLinks";
import type { Show, ShowCategory, ShowSearchFilters } from "../src/types";
import { loadLocalEnv } from "./env";

const defaultVisibleResultLimit = 120;

async function main() {
  loadLocalEnv();

  const referenceNow = new Date().toISOString();
  const config = readPublicDiscoveryConfig();
  const provider = createDefaultEventProvider(config);
  const categories = Object.keys(categoryLabels) as ShowCategory[];
  console.log(`Live Ticketmaster: ${config.ticketmasterApiKey?.trim() ? "enabled" : "not configured"}`);

  for (const area of areas) {
    const filters: ShowSearchFilters = {
      areaId: area.id,
      categories: [],
      query: "",
      onlyDeals: false,
      dateWindow: "all",
      sortMode: "soonest",
      referenceNow,
      resultLimit: defaultVisibleResultLimit
    };
    const shows = await provider.listShows(filters);
    const summary = getMarketDiscoverySummary(shows, categories);
    const coverage = createCoverageAudit(shows, {
      areaId: area.id,
      referenceNow,
      windowDays: 30
    });

    console.log(`${area.name}, ${area.region} default discovery quality audit`);
    console.log(`Visible results: ${shows.length}/${defaultVisibleResultLimit}`);
    console.log(`Ticket links: ${summary.ticketLinkCount}/${summary.showCount}`);
    console.log(`Active categories: ${summary.activeCategoryCount}`);
    console.log(`Weak lanes: ${coverage.weakCategoryGroups.map((group) => group.label).join(", ") || "none"}`);
    console.log(`Spotify-matchable inventory: ${getSpotifyMatchableShows(shows).length}/${shows.length}`);
    console.log("Source mix:");

    for (const sourceCount of coverage.sourceCounts) {
      console.log(`- ${sourceCount.source}: ${sourceCount.count}`);
    }

    console.log("Category mix:");

    for (const category of categories) {
      const categoryShows = shows.filter((show) => show.category === category);

      if (!categoryShows.length) {
        continue;
      }

      console.log(`- ${categoryLabels[category]}: ${categoryShows.length}`);
    }

    console.log("First 12:");

    for (const show of shows.slice(0, 12)) {
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
