import type { DateWindow, Show, ShowCategory } from "../types";
import { isWithinDateWindow } from "./eventCatalog";

export type CategoryFacet = {
  category: ShowCategory;
  showCount: number;
  dealCount: number;
};

export type DateWindowFacet = {
  dateWindow: DateWindow;
  showCount: number;
  dealCount: number;
};

export type MarketDiscoverySummary = {
  showCount: number;
  dealCount: number;
  activeCategoryCount: number;
  sourceCount: number;
  nextStartsAt?: string;
};

export function getCategoryFacets(
  shows: Show[],
  categories: ShowCategory[]
): CategoryFacet[] {
  return categories.map((category) => {
    const categoryShows = shows.filter((show) => show.category === category);

    return {
      category,
      showCount: categoryShows.length,
      dealCount: categoryShows.filter((show) =>
        show.ticketOffers.some((offer) => Boolean(offer.deal))
      ).length
    };
  });
}

export function getDateWindowFacets(
  shows: Show[],
  dateWindows: DateWindow[],
  referenceNow = new Date().toISOString()
): DateWindowFacet[] {
  return dateWindows.map((dateWindow) => {
    const dateWindowShows = shows.filter((show) =>
      isWithinDateWindow(show.startsAt, dateWindow, referenceNow)
    );

    return {
      dateWindow,
      showCount: dateWindowShows.length,
      dealCount: getDealCount(dateWindowShows)
    };
  });
}

export function getMarketDiscoverySummary(
  shows: Show[],
  categories: ShowCategory[]
): MarketDiscoverySummary {
  const sortedShows = [...shows].sort((first, second) =>
    first.startsAt.localeCompare(second.startsAt)
  );
  const categoryFacets = getCategoryFacets(shows, categories);

  return {
    showCount: shows.length,
    dealCount: getDealCount(shows),
    activeCategoryCount: categoryFacets.filter((facet) => facet.showCount > 0).length,
    sourceCount: new Set(shows.map((show) => show.source)).size,
    nextStartsAt: sortedShows[0]?.startsAt
  };
}

function getDealCount(shows: Show[]): number {
  return shows.filter((show) => show.ticketOffers.some((offer) => Boolean(offer.deal))).length;
}
