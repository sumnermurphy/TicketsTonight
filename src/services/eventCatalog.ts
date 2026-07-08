import { shows } from "../data/catalog";
import { normalizedLocalCalendarShows } from "./calendarFeedProvider";
import { normalizedPartnerFeedShows } from "./feedProvider";
import type {
  DateWindow,
  EventProvider,
  Recommendation,
  RecommendationContext,
  Show,
  ShowSearchFilters
} from "../types";

const normalize = (value: string) => value.trim().toLowerCase().replace(/[-_]+/g, " ");
const baseShows = [...shows, ...normalizedPartnerFeedShows, ...normalizedLocalCalendarShows];
const runtimeShows = new Map<string, Show>();

export function rememberShows(candidates: Show[]): Show[] {
  for (const show of candidates) {
    runtimeShows.set(show.id, show);
  }

  return candidates;
}

export function getCatalogShows(): Show[] {
  return dedupeShows([...baseShows, ...runtimeShows.values()]);
}

export function filterShows(candidates: Show[], filters: ShowSearchFilters): Show[] {
  const query = normalize(filters.query);

  return candidates
    .filter((show) => show.areaId === filters.areaId)
    .filter((show) => isWithinDateWindow(show.startsAt, filters.dateWindow, filters.referenceNow))
    .filter((show) =>
      filters.onlyDeals ? show.ticketOffers.some((offer) => Boolean(offer.deal)) : true
    )
    .filter((show) =>
      filters.categories.length === 0 ? true : filters.categories.includes(show.category)
    )
    .filter((show) => {
      if (!query) {
        return true;
      }

      const searchableText = [
        show.title,
        show.artistOrCompany,
        show.venue,
        show.neighborhood,
        show.category,
        ...show.vibe
      ]
        .join(" ")
        .toLowerCase();

      return normalize(searchableText).includes(query);
    })
    .sort((first, second) => {
      const dateDelta =
        new Date(first.startsAt).getTime() - new Date(second.startsAt).getTime();

      return dateDelta === 0 ? first.distanceMiles - second.distanceMiles : dateDelta;
    });
}

export function searchShows(filters: ShowSearchFilters): Show[] {
  return filterShows(getCatalogShows(), filters);
}

export function getRecommendedShows(context: RecommendationContext): Recommendation[] {
  return getRecommendedShowsFromCatalog(getCatalogShows(), context);
}

export function getRecommendedShowsFromCatalog(
  candidates: Show[],
  context: RecommendationContext
): Recommendation[] {
  const genreSignals = new Set(
    [...(context.spotifyTopGenres ?? []), ...(context.followedArtists ?? [])].map(normalize)
  );
  const recentCategories = new Set(context.recentCategories ?? []);

  return candidates
    .filter((show) => show.areaId === context.areaId)
    .map((show) => {
      const categoryScore = recentCategories.has(show.category) ? 2 : 0;
      const signalScore = (show.recommendationSignals ?? []).filter((signal) => {
        const [, rawValue = signal] = signal.split(":");
        return genreSignals.has(normalize(rawValue));
      }).length;

      const reason =
        signalScore > 0
          ? "Matches your listening taste"
          : categoryScore > 0
            ? `Because you browse ${show.category}`
            : "";

      return { show, score: categoryScore + signalScore, reason };
    })
    .filter(({ score }) => score > 0)
    .sort((first, second) => second.score - first.score)
}

export function getShowById(showId: string): Show | undefined {
  return baseShows.find((show) => show.id === showId) ?? runtimeShows.get(showId);
}

export function getBestOffer(show: Show) {
  return show.ticketOffers.reduce(
    (best, offer) => {
      if (!best) {
        return offer;
      }

      if (Boolean(offer.deal) && !best.deal) {
        return offer;
      }

      return offer.priceCents < best.priceCents ? offer : best;
    },
    undefined as Show["ticketOffers"][number] | undefined
  );
}

export function getDealShows(areaId: string): Show[] {
  return searchShows({ areaId, categories: [], query: "", onlyDeals: true, dateWindow: "all" });
}

export function isWithinDateWindow(
  startsAt: string,
  dateWindow: DateWindow,
  referenceNow = new Date().toISOString()
): boolean {
  const showTime = new Date(startsAt).getTime();
  const now = new Date(referenceNow).getTime();

  if (showTime < now) {
    return false;
  }

  if (dateWindow === "all") {
    return true;
  }

  if (dateWindow === "tonight") {
    return showTime <= now + 18 * 60 * 60 * 1000;
  }

  if (dateWindow === "week") {
    return showTime <= now + 7 * 24 * 60 * 60 * 1000;
  }

  const localEventDay = getLocalDatePartDay(startsAt);
  const isWeekendDay = localEventDay === 5 || localEventDay === 6 || localEventDay === 0;

  return isWeekendDay && showTime <= now + 7 * 24 * 60 * 60 * 1000;
}

function getLocalDatePartDay(value: string): number {
  const datePart = value.slice(0, 10);

  return new Date(`${datePart}T12:00:00Z`).getUTCDay();
}

export class LocalCatalogProvider implements EventProvider {
  id = "local-catalog";
  label = "Local seed catalog";

  async listShows(filters: ShowSearchFilters): Promise<Show[]> {
    return filterShows(shows, filters);
  }

  async getShow(showId: string): Promise<Show | undefined> {
    return shows.find((show) => show.id === showId);
  }
}

export class PartnerFeedProvider implements EventProvider {
  id = "partner-feed";
  label = "Normalized partner feeds";

  async listShows(filters: ShowSearchFilters): Promise<Show[]> {
    return filterShows(normalizedPartnerFeedShows, filters);
  }

  async getShow(showId: string): Promise<Show | undefined> {
    return normalizedPartnerFeedShows.find((show) => show.id === showId);
  }
}

export class CalendarFeedProvider implements EventProvider {
  id = "calendar-feed";
  label = "Normalized local calendar feeds";

  async listShows(filters: ShowSearchFilters): Promise<Show[]> {
    return filterShows(normalizedLocalCalendarShows, filters);
  }

  async getShow(showId: string): Promise<Show | undefined> {
    return normalizedLocalCalendarShows.find((show) => show.id === showId);
  }
}

export class CompositeEventProvider implements EventProvider {
  id = "composite-events";
  label = "Composite event catalog";

  constructor(private readonly providers: EventProvider[]) {}

  async listShows(filters: ShowSearchFilters): Promise<Show[]> {
    const providerResults = await Promise.allSettled(
      this.providers.map((provider) => provider.listShows(filters))
    );
    const successfulResults = providerResults
      .filter((result): result is PromiseFulfilledResult<Show[]> => result.status === "fulfilled")
      .map((result) => result.value);

    if (successfulResults.length === 0) {
      const firstError = providerResults.find(
        (result): result is PromiseRejectedResult => result.status === "rejected"
      );

      throw firstError?.reason instanceof Error
        ? firstError.reason
        : new Error("Unable to load event inventory.");
    }

    const uniqueShows = dedupeShows(successfulResults.flat());

    rememberShows(uniqueShows);

    return filterShows(uniqueShows, filters);
  }

  async getShow(showId: string): Promise<Show | undefined> {
    for (const provider of this.providers) {
      const show = await provider.getShow(showId);

      if (show) {
        rememberShows([show]);
        return show;
      }
    }

    return undefined;
  }
}

function dedupeShows(candidates: Show[]): Show[] {
  return Array.from(new Map(candidates.map((show) => [show.id, show])).values());
}
