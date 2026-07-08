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

function getDealCount(shows: Show[]): number {
  return shows.filter((show) => show.ticketOffers.some((offer) => Boolean(offer.deal))).length;
}
