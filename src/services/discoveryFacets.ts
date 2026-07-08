import type { Show, ShowCategory } from "../types";

export type CategoryFacet = {
  category: ShowCategory;
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
