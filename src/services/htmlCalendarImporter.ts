import type {
  LocalCalendarEvent,
  LocalCalendarSource
} from "../data/localCalendarFeeds";
import { normalizeCategory } from "./feedProvider";

type JsonLdValue = {
  [key: string]: unknown;
};

export type HtmlCalendarImportSkippedReason =
  | "invalid-json"
  | "missing-start"
  | "missing-title"
  | "unsupported-source-kind";

export type HtmlCalendarImportSkippedCount = {
  reason: HtmlCalendarImportSkippedReason;
  count: number;
};

export type HtmlCalendarImportOptions = {
  importedAt?: string;
  defaultVenueName?: string;
  defaultNeighborhood?: string;
  defaultDistanceMiles?: number;
  defaultImageTone?: string;
  defaultTags?: string[];
  externalIdPrefix?: string;
};

export type HtmlCalendarImportResult = {
  sourceId: string;
  sourceUrl: string;
  importedAt: string;
  rawEventCount: number;
  importedEventCount: number;
  skippedEventCount: number;
  skippedReasons: HtmlCalendarImportSkippedCount[];
  events: LocalCalendarEvent[];
};

export function importHtmlCalendarEvents(
  html: string,
  source: LocalCalendarSource,
  options: HtmlCalendarImportOptions = {}
): HtmlCalendarImportResult {
  const importedAt = options.importedAt ?? new Date().toISOString();

  if (source.sourceKind !== "html-calendar") {
    return {
      sourceId: source.id,
      sourceUrl: source.sourceUrl,
      importedAt,
      rawEventCount: 0,
      importedEventCount: 0,
      skippedEventCount: 1,
      skippedReasons: [{ reason: "unsupported-source-kind", count: 1 }],
      events: []
    };
  }

  const extraction = extractJsonLdEvents(html);
  const skippedReasons = [...extraction.skippedReasons];
  const events: LocalCalendarEvent[] = [];

  for (const jsonLdEvent of extraction.events) {
    const importedEvent = normalizeJsonLdEvent(jsonLdEvent, source, options);

    if ("event" in importedEvent) {
      events.push(importedEvent.event);
    } else {
      skippedReasons.push({ reason: importedEvent.reason, count: 1 });
    }
  }

  return {
    sourceId: source.id,
    sourceUrl: source.sourceUrl,
    importedAt,
    rawEventCount: extraction.events.length,
    importedEventCount: events.length,
    skippedEventCount: skippedReasons.reduce((total, reason) => total + reason.count, 0),
    skippedReasons: aggregateSkippedReasons(skippedReasons),
    events
  };
}

function extractJsonLdEvents(html: string): {
  events: JsonLdValue[];
  skippedReasons: HtmlCalendarImportSkippedCount[];
} {
  const events: JsonLdValue[] = [];
  const skippedReasons: HtmlCalendarImportSkippedCount[] = [];
  const scriptPattern =
    /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;

  while ((match = scriptPattern.exec(html)) !== null) {
    try {
      const parsedValue = JSON.parse(decodeHtmlEntities(match[1] ?? "")) as unknown;

      events.push(...flattenJsonLdEvents(parsedValue));
    } catch {
      skippedReasons.push({ reason: "invalid-json", count: 1 });
    }
  }

  return { events, skippedReasons };
}

function flattenJsonLdEvents(value: unknown): JsonLdValue[] {
  if (Array.isArray(value)) {
    return value.flatMap(flattenJsonLdEvents);
  }

  if (!isJsonLdValue(value)) {
    return [];
  }

  const graph = value["@graph"];

  if (Array.isArray(graph)) {
    return graph.flatMap(flattenJsonLdEvents);
  }

  return isJsonLdEvent(value) ? [value] : [];
}

function normalizeJsonLdEvent(
  event: JsonLdValue,
  source: LocalCalendarSource,
  options: HtmlCalendarImportOptions
):
  | { event: LocalCalendarEvent }
  | { reason: Exclude<HtmlCalendarImportSkippedReason, "invalid-json" | "unsupported-source-kind"> } {
  const title = getString(event.name);
  const startsAt = getString(event.startDate);

  if (!title) {
    return { reason: "missing-title" };
  }

  if (!startsAt) {
    return { reason: "missing-start" };
  }

  const eventUrl = getString(event.url);
  const offer = getFirstOffer(event.offers);
  const ticketUrl = getString(offer?.url) ?? eventUrl;
  const taxonomy = getTaxonomy(event);
  const category = normalizeCategory(taxonomy);
  const priceCents = getOfferPriceCents(offer);
  const performer = getName(event.performer) ?? getName(event.organizer) ?? source.label;
  const location = event.location;
  const venueName =
    getName(location) ?? options.defaultVenueName ?? source.label.replace(/\s+calendar$/i, "");
  const neighborhood =
    getAddressLocality(location) ?? options.defaultNeighborhood ?? venueName;
  const tags = uniqueValues([...(options.defaultTags ?? []), ...taxonomy])
    .map((tag) => tag.toLowerCase())
    .slice(0, 5);

  return {
    event: {
      calendarId: source.id,
      sourceKind: "html-calendar",
      sourceUrl: source.sourceUrl,
      externalId: createExternalId(eventUrl ?? title, startsAt, options.externalIdPrefix),
      title,
      presenter: performer,
      taxonomy,
      startsAt,
      venueName,
      neighborhood,
      areaId: source.areaId,
      distanceMiles: options.defaultDistanceMiles ?? 0,
      description:
        getString(event.description) ??
        `${title} imported from ${source.label}.`,
      tags: tags.length ? tags : [category],
      imageTone: options.defaultImageTone ?? "#4A6B5F",
      ticketUrl,
      priceCents,
      remainingEstimate: 12,
      maxQuantity: 4,
      recommendationSignals: uniqueValues([
        `category:${category}`,
        ...taxonomy.map((value) => `spotify:${value.toLowerCase().replace(/\s+/g, "-")}`)
      ])
    }
  };
}

function getTaxonomy(event: JsonLdValue): string[] {
  const values = [
    ...getStringArray(event.genre),
    ...getStringArray(event.keywords),
    ...getStringArray(event.category),
    ...getStringArray(event.eventType)
  ];

  return uniqueValues(values.map((value) => value.trim()).filter(Boolean));
}

function getFirstOffer(value: unknown): JsonLdValue | undefined {
  if (Array.isArray(value)) {
    return value.find(isJsonLdValue);
  }

  return isJsonLdValue(value) ? value : undefined;
}

function getOfferPriceCents(offer: JsonLdValue | undefined): number | undefined {
  if (!offer || getString(offer.priceCurrency) !== "USD") {
    return undefined;
  }

  const price = Number(getString(offer.price));

  return Number.isFinite(price) ? Math.round(price * 100) : undefined;
}

function getAddressLocality(value: unknown): string | undefined {
  if (!isJsonLdValue(value)) {
    return undefined;
  }

  const address = value.address;

  if (isJsonLdValue(address)) {
    return getString(address.addressLocality);
  }

  return undefined;
}

function getName(value: unknown): string | undefined {
  if (typeof value === "string") {
    return value.trim() || undefined;
  }

  if (Array.isArray(value)) {
    return value.map(getName).find(Boolean);
  }

  if (isJsonLdValue(value)) {
    return getString(value.name);
  }

  return undefined;
}

function getString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function getStringArray(value: unknown): string[] {
  if (typeof value === "string") {
    return value.split(",").map((item) => item.trim()).filter(Boolean);
  }

  if (Array.isArray(value)) {
    return value.flatMap(getStringArray);
  }

  return [];
}

function isJsonLdValue(value: unknown): value is JsonLdValue {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function isJsonLdEvent(value: JsonLdValue): boolean {
  const type = value["@type"];
  const values = Array.isArray(type) ? type : [type];

  return values.some((candidate) => getString(candidate)?.toLowerCase() === "event");
}

function createExternalId(value: string, startsAt: string, prefix = "html"): string {
  const sourceValue = value.split("/").filter(Boolean).pop() ?? value;
  const slug = sourceValue
    .toLowerCase()
    .replace(/https?:/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
  const datePart = startsAt.slice(0, 10);

  return `${prefix}-${slug || "event"}-${datePart}`;
}

function aggregateSkippedReasons(
  reasons: HtmlCalendarImportSkippedCount[]
): HtmlCalendarImportSkippedCount[] {
  const counts = new Map<HtmlCalendarImportSkippedReason, number>();

  for (const reason of reasons) {
    counts.set(reason.reason, (counts.get(reason.reason) ?? 0) + reason.count);
  }

  return Array.from(counts.entries()).map(([reason, count]) => ({ reason, count }));
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&quot;/g, "\"")
    .replace(/&#34;/g, "\"")
    .replace(/&amp;/g, "&")
    .trim();
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
