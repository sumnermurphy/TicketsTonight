import { areas } from "../data/catalog";
import type {
  Area,
  EventProvider,
  Show,
  ShowCategory,
  ShowSearchFilters,
  TicketOffer
} from "../types";
import { filterShows } from "./eventCatalog";
import { normalizeCategory } from "./feedProvider";
import { getDistanceBetweenCoordinates } from "./location";

const DEFAULT_ENDPOINT = "https://app.ticketmaster.com/discovery/v2/events.json";
const DEFAULT_RADIUS_MILES = 35;
const DEFAULT_WINDOW_DAYS = 90;

type TicketmasterNamedValue = {
  name?: string;
};

export type TicketmasterDiscoveryEvent = {
  id: string;
  name: string;
  url?: string;
  info?: string;
  pleaseNote?: string;
  promoter?: TicketmasterNamedValue;
  dates?: {
    start?: {
      dateTime?: string;
      localDate?: string;
      localTime?: string;
    };
  };
  classifications?: Array<{
    segment?: TicketmasterNamedValue;
    genre?: TicketmasterNamedValue;
    subGenre?: TicketmasterNamedValue;
    type?: TicketmasterNamedValue;
    subType?: TicketmasterNamedValue;
  }>;
  priceRanges?: Array<{
    currency?: string;
    min?: number;
    max?: number;
    type?: string;
  }>;
  _embedded?: {
    attractions?: TicketmasterNamedValue[];
    venues?: Array<{
      name?: string;
      city?: TicketmasterNamedValue;
      state?: {
        name?: string;
        stateCode?: string;
      };
      location?: {
        latitude?: string;
        longitude?: string;
      };
    }>;
  };
};

export type TicketmasterDiscoveryResponse = {
  _embedded?: {
    events?: TicketmasterDiscoveryEvent[];
  };
  page?: {
    totalElements?: number;
  };
};

type TicketmasterVenue = NonNullable<
  NonNullable<TicketmasterDiscoveryEvent["_embedded"]>["venues"]
>[number];

export type TicketmasterDiscoveryClient = {
  listEvents(url: string): Promise<TicketmasterDiscoveryResponse>;
  getEvent?(url: string): Promise<TicketmasterDiscoveryEvent | undefined>;
};

export type TicketmasterDiscoveryProviderOptions = {
  apiKey: string;
  client: TicketmasterDiscoveryClient;
  endpoint?: string;
  radiusMiles?: number;
  now?: () => Date;
};

export class FetchTicketmasterDiscoveryClient implements TicketmasterDiscoveryClient {
  async listEvents(url: string): Promise<TicketmasterDiscoveryResponse> {
    return fetchTicketmasterJson<TicketmasterDiscoveryResponse>(url);
  }

  async getEvent(url: string): Promise<TicketmasterDiscoveryEvent | undefined> {
    return fetchTicketmasterJson<TicketmasterDiscoveryEvent>(url);
  }
}

export class TicketmasterDiscoveryProvider implements EventProvider {
  id = "ticketmaster-discovery";
  label = "Ticketmaster Discovery";

  private readonly cache = new Map<string, Show>();

  constructor(private readonly options: TicketmasterDiscoveryProviderOptions) {}

  async listShows(filters: ShowSearchFilters): Promise<Show[]> {
    const url = buildTicketmasterDiscoveryUrl(filters, this.options);
    const response = await this.options.client.listEvents(url);
    const shows = (response._embedded?.events ?? [])
      .map((event) => normalizeTicketmasterEvent(event, filters.areaId))
      .filter((show): show is Show => Boolean(show));

    for (const show of shows) {
      this.cache.set(show.id, show);
    }

    return filterShows(shows, filters);
  }

  async getShow(showId: string): Promise<Show | undefined> {
    const cachedShow = this.cache.get(showId);

    if (cachedShow || !this.options.client.getEvent) {
      return cachedShow;
    }

    const externalId = showId.startsWith("tm-") ? showId.slice(3) : showId;
    const event = await this.options.client.getEvent(
      buildTicketmasterEventUrl(externalId, this.options)
    );
    const show = event ? normalizeTicketmasterEvent(event) : undefined;

    if (show) {
      this.cache.set(show.id, show);
    }

    return show;
  }
}

export function buildTicketmasterDiscoveryUrl(
  filters: ShowSearchFilters,
  options: Pick<TicketmasterDiscoveryProviderOptions, "apiKey" | "endpoint" | "radiusMiles" | "now">
): string {
  const area = findArea(filters.areaId);
  const now = options.now?.() ?? new Date(filters.referenceNow ?? Date.now());
  const url = new URL(options.endpoint ?? DEFAULT_ENDPOINT);
  const endDate = getDiscoveryEndDate(now, filters.dateWindow);
  const classificationNames = getClassificationNames(filters.categories);

  url.searchParams.set("apikey", options.apiKey);
  url.searchParams.set("countryCode", "US");
  url.searchParams.set("city", area.name);
  url.searchParams.set("stateCode", area.region);
  url.searchParams.set("radius", String(options.radiusMiles ?? DEFAULT_RADIUS_MILES));
  url.searchParams.set("unit", "miles");
  url.searchParams.set("sort", "date,asc");
  url.searchParams.set("startDateTime", formatDiscoveryDate(now));
  url.searchParams.set("endDateTime", formatDiscoveryDate(endDate));

  if (filters.query.trim()) {
    url.searchParams.set("keyword", filters.query.trim());
  }

  if (classificationNames.length) {
    url.searchParams.set("classificationName", classificationNames.join(","));
  }

  return url.toString();
}

export function buildTicketmasterEventUrl(
  externalId: string,
  options: Pick<TicketmasterDiscoveryProviderOptions, "apiKey" | "endpoint">
): string {
  const endpoint = options.endpoint ?? DEFAULT_ENDPOINT;
  const baseUrl = endpoint.endsWith("/events.json")
    ? endpoint.replace("/events.json", `/events/${externalId}.json`)
    : `${endpoint.replace(/\/$/, "")}/${externalId}.json`;
  const url = new URL(baseUrl);

  url.searchParams.set("apikey", options.apiKey);

  return url.toString();
}

export function normalizeTicketmasterEvent(
  event: TicketmasterDiscoveryEvent,
  fallbackAreaId?: string
): Show | undefined {
  const area = resolveArea(event, fallbackAreaId);
  const startsAt = getStartDate(event);

  if (!area || !startsAt) {
    return undefined;
  }

  const venue = event._embedded?.venues?.[0];
  const category = normalizeTicketmasterCategory(event);
  const location = getVenueCoordinates(venue);
  const priceRange = event.priceRanges?.find((range) => range.currency === "USD");
  const offer = priceRange?.min ? createTicketmasterOffer(event, priceRange.min) : undefined;

  return {
    id: `tm-${event.id}`,
    title: event.name,
    artistOrCompany:
      event._embedded?.attractions?.[0]?.name ?? event.promoter?.name ?? "Ticketmaster event",
    category,
    startsAt,
    venue: venue?.name ?? "Venue TBA",
    neighborhood: venue?.city?.name ?? area.name,
    areaId: area.id,
    distanceMiles: location
      ? getDistanceBetweenCoordinates(area.coordinates, location)
      : 0,
    vibe: getTicketmasterVibes(event),
    description:
      event.info ?? event.pleaseNote ?? `${event.name} at ${venue?.name ?? area.name}.`,
    ticketOffers: offer ? [offer] : [],
    source: "primary-marketplace",
    imageTone: getCategoryTone(category),
    recommendationSignals: getRecommendationSignals(event, category)
  };
}

function createTicketmasterOffer(
  event: TicketmasterDiscoveryEvent,
  minPrice: number
): TicketOffer {
  return {
    id: "ticketmaster-standard",
    label: "Primary ticket",
    priceCents: Math.round(minPrice * 100),
    currency: "USD",
    remaining: 20,
    maxQuantity: 6,
    access: "external-transfer",
    source: "primary-marketplace",
    externalUrl: event.url,
    perks: event.url ? ["Partner checkout available"] : undefined
  };
}

async function fetchTicketmasterJson<T>(url: string): Promise<T> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Ticketmaster request failed with ${response.status}`);
  }

  return response.json() as Promise<T>;
}

function findArea(areaId: string): Area {
  return areas.find((area) => area.id === areaId) ?? areas[0]!;
}

function resolveArea(
  event: TicketmasterDiscoveryEvent,
  fallbackAreaId?: string
): Area | undefined {
  const fallbackArea = fallbackAreaId ? areas.find((area) => area.id === fallbackAreaId) : undefined;
  const venue = event._embedded?.venues?.[0];
  const city = venue?.city?.name?.toLowerCase();
  const stateCode = venue?.state?.stateCode?.toLowerCase();

  return (
    areas.find(
      (area) =>
        area.name.toLowerCase() === city && area.region.toLowerCase() === stateCode
    ) ??
    findNearestSupportedArea(venue) ??
    fallbackArea
  );
}

function findNearestSupportedArea(venue?: TicketmasterVenue): Area | undefined {
  const coordinates = getVenueCoordinates(venue);

  if (!coordinates) {
    return undefined;
  }

  return [...areas]
    .map((area) => ({
      area,
      distanceMiles: getDistanceBetweenCoordinates(area.coordinates, coordinates)
    }))
    .sort((first, second) => first.distanceMiles - second.distanceMiles)[0]?.area;
}

function getVenueCoordinates(venue?: TicketmasterVenue) {
  const latitude = Number(venue?.location?.latitude);
  const longitude = Number(venue?.location?.longitude);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return undefined;
  }

  return { latitude, longitude };
}

function getStartDate(event: TicketmasterDiscoveryEvent): string | undefined {
  const start = event.dates?.start;

  if (start?.dateTime) {
    return start.dateTime;
  }

  if (start?.localDate && start.localTime) {
    return `${start.localDate}T${start.localTime}`;
  }

  return start?.localDate ? `${start.localDate}T00:00:00` : undefined;
}

function normalizeTicketmasterCategory(event: TicketmasterDiscoveryEvent): ShowCategory {
  return normalizeCategory(
    (event.classifications ?? []).flatMap((classification) => [
      classification.genre?.name,
      classification.subGenre?.name,
      classification.segment?.name,
      classification.type?.name,
      classification.subType?.name
    ])
  );
}

function getTicketmasterVibes(event: TicketmasterDiscoveryEvent): string[] {
  const values = (event.classifications ?? []).flatMap((classification) => [
    classification.genre?.name,
    classification.subGenre?.name,
    classification.type?.name
  ]);

  return uniqueStrings(values)
    .map((value) => value.toLowerCase())
    .slice(0, 4);
}

function getRecommendationSignals(
  event: TicketmasterDiscoveryEvent,
  category: ShowCategory
): string[] {
  return [
    `category:${category}`,
    ...getTicketmasterVibes(event).map((vibe) => `spotify:${vibe.replace(/\s+/g, "-")}`)
  ];
}

function getCategoryTone(category: ShowCategory): string {
  const tones: Record<ShowCategory, string> = {
    concert: "#BA4A32",
    dj: "#5C496A",
    dance: "#28706D",
    ballet: "#0D7C75",
    opera: "#D9A441",
    play: "#314E66",
    theater: "#314E66",
    comedy: "#B73A26",
    variety: "#7B5B2E"
  };

  return tones[category];
}

function getClassificationNames(categories: ShowCategory[]): string[] {
  const values: Record<ShowCategory, string[]> = {
    concert: ["music"],
    dj: ["music"],
    dance: ["dance"],
    ballet: ["ballet"],
    opera: ["opera"],
    play: ["theatre"],
    theater: ["theatre"],
    comedy: ["comedy"],
    variety: ["miscellaneous", "theatre"]
  };

  return uniqueStrings(categories.flatMap((category) => values[category]));
}

function getDiscoveryEndDate(now: Date, dateWindow: ShowSearchFilters["dateWindow"]): Date {
  const hoursByWindow: Record<ShowSearchFilters["dateWindow"], number> = {
    all: DEFAULT_WINDOW_DAYS * 24,
    tonight: 18,
    week: 7 * 24,
    weekend: 7 * 24
  };

  return new Date(now.getTime() + hoursByWindow[dateWindow] * 60 * 60 * 1000);
}

function formatDiscoveryDate(date: Date): string {
  return date.toISOString().replace(/\.\d{3}Z$/, "Z");
}

function uniqueStrings(values: Array<string | undefined>): string[] {
  const seen = new Set<string>();
  const uniqueValues: string[] = [];

  for (const value of values) {
    const normalizedValue = value?.trim();

    if (!normalizedValue || seen.has(normalizedValue.toLowerCase())) {
      continue;
    }

    seen.add(normalizedValue.toLowerCase());
    uniqueValues.push(normalizedValue);
  }

  return uniqueValues;
}
