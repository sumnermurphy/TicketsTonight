import { shows } from "../data/catalog";
import { normalizedLocalCalendarShows } from "./calendarFeedProvider";
import { normalizedPartnerFeedShows } from "./feedProvider";
import type {
  DateWindow,
  EventProvider,
  InventorySource,
  Recommendation,
  RecommendationContext,
  Show,
  ShowSearchFilters,
  TicketOffer
} from "../types";

const normalize = (value: string) => value.trim().toLowerCase().replace(/[-_]+/g, " ");
const baseShows = [...shows, ...normalizedPartnerFeedShows, ...normalizedLocalCalendarShows];
const runtimeShows = new Map<string, Show>();
const sourceDisplayPriority: Record<InventorySource, number> = {
  "venue-direct": 60,
  "calendar-feed": 55,
  "partner-feed": 50,
  promoter: 45,
  "primary-marketplace": 35,
  "verified-resale": 20
};

export function rememberShows(candidates: Show[]): Show[] {
  const mergedShows = dedupeShows(candidates);
  const mergedByKey = new Map(mergedShows.map((show) => [getShowDedupeKey(show), show]));

  for (const candidate of candidates) {
    runtimeShows.set(candidate.id, mergedByKey.get(getShowDedupeKey(candidate)) ?? candidate);
  }

  for (const show of mergedShows) {
    runtimeShows.set(show.id, show);
  }

  return mergedShows;
}

export function getCatalogShows(): Show[] {
  return dedupeShows([...baseShows, ...runtimeShows.values()]);
}

export function filterShows(candidates: Show[], filters: ShowSearchFilters): Show[] {
  const query = normalize(filters.query);
  const neighborhoods = new Set((filters.neighborhoods ?? []).map(normalize));
  const maxPriceCents = filters.maxPriceCents;

  return candidates
    .filter((show) => show.areaId === filters.areaId)
    .filter((show) => isWithinDateWindow(show.startsAt, filters.dateWindow, filters.referenceNow))
    .filter((show) =>
      filters.onlyDeals ? show.ticketOffers.some((offer) => Boolean(offer.deal)) : true
    )
    .filter((show) =>
      maxPriceCents === undefined
        ? true
        : show.ticketOffers.some((offer) => offer.priceCents <= maxPriceCents)
    )
    .filter((show) =>
      filters.categories.length === 0 ? true : filters.categories.includes(show.category)
    )
    .filter((show) =>
      neighborhoods.size === 0 ? true : neighborhoods.has(normalize(show.neighborhood))
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
    .sort((first, second) => compareShows(first, second, filters.sortMode ?? "soonest"));
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
  return runtimeShows.get(showId) ?? getCatalogShows().find((show) => show.id === showId);
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

function compareShows(
  first: Show,
  second: Show,
  sortMode: NonNullable<ShowSearchFilters["sortMode"]>
): number {
  const dateDelta = getStartTime(first) - getStartTime(second);

  if (sortMode === "cheapest") {
    const priceDelta = getLowestOfferPrice(first) - getLowestOfferPrice(second);

    return priceDelta || dateDelta || first.distanceMiles - second.distanceMiles;
  }

  if (sortMode === "nearby") {
    return first.distanceMiles - second.distanceMiles || dateDelta;
  }

  return dateDelta || first.distanceMiles - second.distanceMiles;
}

function getLowestOfferPrice(show: Show): number {
  const prices = show.ticketOffers.map((offer) => offer.priceCents);

  return prices.length ? Math.min(...prices) : Number.MAX_SAFE_INTEGER;
}

function getStartTime(show: Show): number {
  return new Date(show.startsAt).getTime();
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

    const uniqueShows = rememberShows(successfulResults.flat());

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
  const dedupedShows = new Map<string, Show>();

  for (const show of candidates) {
    const key = getShowDedupeKey(show);
    const existingShow = dedupedShows.get(key);

    dedupedShows.set(key, existingShow ? mergeDuplicateShows(existingShow, show) : show);
  }

  return Array.from(dedupedShows.values());
}

function mergeDuplicateShows(first: Show, second: Show): Show {
  const displayShow =
    getShowDisplayScore(second) > getShowDisplayScore(first) ? second : first;
  const otherShow = displayShow.id === first.id ? second : first;

  return {
    ...displayShow,
    description: getRicherText(displayShow.description, otherShow.description),
    distanceMiles: Math.min(displayShow.distanceMiles, otherShow.distanceMiles),
    vibe: uniqueValues([...displayShow.vibe, ...otherShow.vibe]),
    ticketOffers: mergeTicketOffers(displayShow.ticketOffers, otherShow.ticketOffers),
    recommendationSignals: uniqueValues([
      ...(displayShow.recommendationSignals ?? []),
      ...(otherShow.recommendationSignals ?? [])
    ])
  };
}

function mergeTicketOffers(first: TicketOffer[], second: TicketOffer[]): TicketOffer[] {
  const offers = new Map<string, TicketOffer>();

  for (const offer of [...first, ...second]) {
    const key = `${offer.source}:${offer.id}`;
    const existingOffer = offers.get(key);

    if (!existingOffer || getOfferDisplayScore(offer) > getOfferDisplayScore(existingOffer)) {
      offers.set(key, offer);
    }
  }

  return Array.from(offers.values()).sort(
    (firstOffer, secondOffer) =>
      getOfferDisplayScore(secondOffer) - getOfferDisplayScore(firstOffer) ||
      firstOffer.priceCents - secondOffer.priceCents
  );
}

function getShowDedupeKey(show: Show): string {
  return [
    show.areaId,
    normalizeForDedupe(show.title),
    normalizeForDedupe(show.venue),
    getCanonicalStartMinute(show.startsAt)
  ].join("|");
}

function getShowDisplayScore(show: Show): number {
  const hasDeal = show.ticketOffers.some((offer) => Boolean(offer.deal));

  return (
    sourceDisplayPriority[show.source] +
    (hasDeal ? 100 : 0) +
    show.ticketOffers.length * 4 +
    Math.min(12, Math.round(show.description.length / 60))
  );
}

function getOfferDisplayScore(offer: TicketOffer): number {
  const discountScore = offer.deal ? 100 : 0;
  const priceScore = Math.max(0, 50 - Math.round(offer.priceCents / 1000));

  return sourceDisplayPriority[offer.source] + discountScore + priceScore;
}

function getRicherText(first: string, second: string): string {
  return second.length > first.length ? second : first;
}

function normalizeForDedupe(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function getCanonicalStartMinute(startsAt: string): string {
  const parsedTime = new Date(startsAt).getTime();

  if (!Number.isFinite(parsedTime)) {
    return startsAt.slice(0, 16);
  }

  return new Date(parsedTime).toISOString().slice(0, 16);
}

function uniqueValues(values: string[]): string[] {
  const seen = new Set<string>();
  const unique: string[] = [];

  for (const value of values) {
    const normalizedValue = value.trim();
    const key = normalizedValue.toLowerCase();

    if (!normalizedValue || seen.has(key)) {
      continue;
    }

    seen.add(key);
    unique.push(normalizedValue);
  }

  return unique;
}
