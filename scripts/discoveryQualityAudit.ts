import { categoryLabels } from "../src/data/catalog";
import {
  createDefaultEventProvider,
  readPublicDiscoveryConfig
} from "../src/services/eventProviderFactory";
import { getMarketDiscoverySummary } from "../src/services/discoveryFacets";
import { getSafeTicketUrl } from "../src/services/ticketLinks";
import type { Show, ShowCategory, ShowSearchFilters } from "../src/types";
import { loadLocalEnv } from "./env";

const defaultVisibleResultLimit = 120;

async function main() {
  loadLocalEnv();

  const areaId = "nyc";
  const referenceNow = new Date().toISOString();
  const config = readPublicDiscoveryConfig();
  const provider = createDefaultEventProvider(config);
  const filters: ShowSearchFilters = {
    areaId,
    categories: [],
    query: "",
    onlyDeals: false,
    dateWindow: "all",
    sortMode: "soonest",
    referenceNow,
    resultLimit: defaultVisibleResultLimit
  };
  const shows = await provider.listShows(filters);
  const categories = Object.keys(categoryLabels) as ShowCategory[];
  const summary = getMarketDiscoverySummary(shows, categories);

  console.log("NYC default discovery quality audit");
  console.log(`Live Ticketmaster: ${config.ticketmasterApiKey?.trim() ? "enabled" : "not configured"}`);
  console.log(`Visible results: ${shows.length}/${defaultVisibleResultLimit}`);
  console.log(`Ticket links: ${summary.ticketLinkCount}/${summary.showCount}`);
  console.log(`Active categories: ${summary.activeCategoryCount}`);
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
    console.log(
      `- ${formatAuditShow(show)}`
    );
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
