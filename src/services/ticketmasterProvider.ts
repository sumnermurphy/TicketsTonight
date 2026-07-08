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
const DEFAULT_PAGE_SIZE = 100;
const DEFAULT_MAX_PAGES = 3;
const TICKETMASTER_DEEP_PAGE_LIMIT = 1000;
const supportedTicketmasterCategories: ShowCategory[] = [
  "concert",
  "dj",
  "dance",
  "ballet",
  "opera",
  "play",
  "theater",
  "comedy",
  "variety"
];
export type TicketmasterDiscoveryLane = {
  id: string;
  label: string;
  categories: ShowCategory[];
};

export const ticketmasterDiscoveryLanes: TicketmasterDiscoveryLane[] = [
  {
    id: "music-nightlife",
    label: "Music and nightlife",
    categories: ["concert", "dj"]
  },
  {
    id: "stage-comedy",
    label: "Stage and comedy",
    categories: ["play", "theater", "comedy"]
  },
  {
    id: "performing-arts",
    label: "Performing arts",
    categories: ["dance", "ballet", "opera"]
  },
  {
    id: "adjacent-live",
    label: "Adjacent live",
    categories: ["variety"]
  }
];

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
    number?: number;
    size?: number;
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
  pageSize?: number;
  maxPages?: number;
  now?: () => Date;
};

type TicketmasterDiscoveryUrlOptions = Pick<
  TicketmasterDiscoveryProviderOptions,
  "apiKey" | "endpoint" | "radiusMiles" | "now" | "pageSize"
> & {
  categories?: ShowCategory[];
  page?: number;
};

export type TicketmasterDiscoveryFetchRequest = {
  laneId: string;
  laneLabel: string;
  page: number;
  url: string;
  rawEventCount: number;
  totalElements?: number;
};

export type TicketmasterDiscoveryFetchResult = {
  events: TicketmasterDiscoveryEvent[];
  requests: TicketmasterDiscoveryFetchRequest[];
};

export type TicketmasterDiscardReason = "missing-area" | "missing-start";

export type TicketmasterNormalizationResult = {
  show?: Show;
  discardReason?: TicketmasterDiscardReason;
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
    const { events } = await fetchTicketmasterDiscoveryEvents(filters, this.options);

    const shows = events
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
  options: TicketmasterDiscoveryUrlOptions
): string {
  const area = findArea(filters.areaId);
  const now = options.now?.() ?? new Date(filters.referenceNow ?? Date.now());
  const url = new URL(options.endpoint ?? DEFAULT_ENDPOINT);
  const endDate = getDiscoveryEndDate(now, filters.dateWindow);
  const classificationNames = getClassificationNames(
    options.categories ?? (filters.categories.length ? filters.categories : supportedTicketmasterCategories)
  );

  url.searchParams.set("apikey", options.apiKey);
  url.searchParams.set("countryCode", "US");
  url.searchParams.set("city", area.name);
  url.searchParams.set("stateCode", area.region);
  url.searchParams.set("radius", String(options.radiusMiles ?? DEFAULT_RADIUS_MILES));
  url.searchParams.set("unit", "miles");
  url.searchParams.set("sort", "date,asc");
  url.searchParams.set("startDateTime", formatDiscoveryDate(now));
  url.searchParams.set("endDateTime", formatDiscoveryDate(endDate));
  url.searchParams.set(
    "size",
    String(normalizePositiveInteger(options.pageSize, DEFAULT_PAGE_SIZE))
  );
  url.searchParams.set("page", String(options.page ?? 0));

  if (filters.query.trim()) {
    url.searchParams.set("keyword", filters.query.trim());
  }

  if (classificationNames.length) {
    url.searchParams.set("classificationName", classificationNames.join(","));
  }

  return url.toString();
}

export async function fetchTicketmasterDiscoveryEvents(
  filters: ShowSearchFilters,
  options: TicketmasterDiscoveryProviderOptions
): Promise<TicketmasterDiscoveryFetchResult> {
  const pageSize = normalizePositiveInteger(options.pageSize, DEFAULT_PAGE_SIZE);
  const maxPages = normalizePositiveInteger(options.maxPages, DEFAULT_MAX_PAGES);
  const lanes = getTicketmasterDiscoveryLanes(filters);
  const events: TicketmasterDiscoveryEvent[] = [];
  const requests: TicketmasterDiscoveryFetchRequest[] = [];

  for (const lane of lanes) {
    let laneEventCount = 0;
    let expectedTotal: number | undefined;

    for (let page = 0; page < maxPages; page += 1) {
      const url = buildTicketmasterDiscoveryUrl(filters, {
        ...options,
        categories: lane.categories,
        page,
        pageSize
      });
      const response = await options.client.listEvents(url);
      const pageEvents = response._embedded?.events ?? [];

      events.push(...pageEvents);
      laneEventCount += pageEvents.length;
      expectedTotal = response.page?.totalElements ?? expectedTotal;
      requests.push({
        laneId: lane.id,
        laneLabel: lane.label,
        page,
        url,
        rawEventCount: pageEvents.length,
        totalElements: response.page?.totalElements
      });

      if (
        pageEvents.length === 0 ||
        pageEvents.length < pageSize ||
        (expectedTotal !== undefined && laneEventCount >= expectedTotal) ||
        (page + 1) * pageSize >= TICKETMASTER_DEEP_PAGE_LIMIT
      ) {
        break;
      }
    }
  }

  return { events, requests };
}

export function getTicketmasterDiscoveryLanes(
  filters: ShowSearchFilters
): TicketmasterDiscoveryLane[] {
  if (!filters.query.trim() && filters.categories.length === 0) {
    return ticketmasterDiscoveryLanes;
  }

  return [
    {
      id: "filtered",
      label: "Filtered request",
      categories: filters.categories.length ? filters.categories : supportedTicketmasterCategories
    }
  ];
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
  return normalizeTicketmasterEventWithDiagnostics(event, fallbackAreaId).show;
}

export function normalizeTicketmasterEventWithDiagnostics(
  event: TicketmasterDiscoveryEvent,
  fallbackAreaId?: string
): TicketmasterNormalizationResult {
  const area = resolveArea(event, fallbackAreaId);
  const startsAt = getStartDate(event);

  if (!area) {
    return { discardReason: "missing-area" };
  }

  if (!startsAt) {
    return { discardReason: "missing-start" };
  }

  const venue = event._embedded?.venues?.[0];
  const category = normalizeTicketmasterCategory(event);
  const location = getVenueCoordinates(venue);
  const priceRange = event.priceRanges?.find((range) => range.currency === "USD");
  const offer =
    priceRange?.min !== undefined && Number.isFinite(priceRange.min)
      ? createTicketmasterOffer(event, priceRange.min)
      : event.url
        ? createTicketmasterLinkOffer(event)
        : undefined;

  return {
    show: {
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
    }
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

function createTicketmasterLinkOffer(event: TicketmasterDiscoveryEvent): TicketOffer {
  return {
    id: "ticketmaster-link",
    label: "Ticket page",
    currency: "USD",
    remaining: 1,
    maxQuantity: 8,
    access: "external-transfer",
    source: "primary-marketplace",
    externalUrl: event.url,
    perks: ["Provider checkout available"]
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

function normalizePositiveInteger(value: number | undefined, fallback: number): number {
  if (!Number.isFinite(value) || value === undefined) {
    return fallback;
  }

  return Math.max(1, Math.floor(value));
}
