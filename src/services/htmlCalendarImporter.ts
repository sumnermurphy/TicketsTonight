import type {
  LocalCalendarEvent,
  LocalCalendarParserMode,
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
  mode?: LocalCalendarParserMode;
  defaultVenueName?: string;
  defaultNeighborhood?: string;
  defaultDistanceMiles?: number;
  defaultImageTone?: string;
  defaultTags?: string[];
  defaultTaxonomy?: string[];
  externalIdPrefix?: string;
  linkBaseUrl?: string;
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
  const resolvedOptions = resolveImportOptions(source, options);

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

  const mode = resolvedOptions.mode ?? "json-ld";
  const jsonLdExtraction =
    mode === "json-ld" || mode === "auto"
      ? extractJsonLdEvents(html)
      : { events: [], skippedReasons: [] };
  const listExtraction =
    mode === "event-list" || mode === "auto"
      ? extractListPageEvents(html, source, resolvedOptions)
      : { events: [], skippedReasons: [], rawEventCount: 0 };
  const skippedReasons = [
    ...jsonLdExtraction.skippedReasons,
    ...listExtraction.skippedReasons
  ];
  const events: LocalCalendarEvent[] = [];

  for (const jsonLdEvent of jsonLdExtraction.events) {
    const importedEvent = normalizeJsonLdEvent(jsonLdEvent, source, resolvedOptions);

    if ("event" in importedEvent) {
      events.push(importedEvent.event);
    } else {
      skippedReasons.push({ reason: importedEvent.reason, count: 1 });
    }
  }

  events.push(...listExtraction.events);

  return {
    sourceId: source.id,
    sourceUrl: source.sourceUrl,
    importedAt,
    rawEventCount: jsonLdExtraction.events.length + listExtraction.rawEventCount,
    importedEventCount: events.length,
    skippedEventCount: skippedReasons.reduce((total, reason) => total + reason.count, 0),
    skippedReasons: aggregateSkippedReasons(skippedReasons),
    events
  };
}

function resolveImportOptions(
  source: LocalCalendarSource,
  options: HtmlCalendarImportOptions
): HtmlCalendarImportOptions {
  const profile = source.parserProfile;

  return {
    mode: options.mode ?? profile?.mode,
    defaultVenueName: options.defaultVenueName ?? profile?.defaultVenueName,
    defaultNeighborhood: options.defaultNeighborhood ?? profile?.defaultNeighborhood,
    defaultDistanceMiles: options.defaultDistanceMiles ?? profile?.defaultDistanceMiles,
    defaultImageTone: options.defaultImageTone ?? profile?.defaultImageTone,
    defaultTags: options.defaultTags ?? profile?.defaultTags,
    defaultTaxonomy: options.defaultTaxonomy ?? profile?.defaultTaxonomy,
    externalIdPrefix: options.externalIdPrefix ?? profile?.externalIdPrefix,
    linkBaseUrl: options.linkBaseUrl ?? profile?.linkBaseUrl ?? source.sourceUrl,
    importedAt: options.importedAt
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

function extractListPageEvents(
  html: string,
  source: LocalCalendarSource,
  options: HtmlCalendarImportOptions
): {
  events: LocalCalendarEvent[];
  rawEventCount: number;
  skippedReasons: HtmlCalendarImportSkippedCount[];
} {
  const candidates = extractEventBlocks(html);
  const events: LocalCalendarEvent[] = [];
  const skippedReasons: HtmlCalendarImportSkippedCount[] = [];

  for (const block of candidates) {
    const importedEvent = normalizeListPageEvent(block, source, options);

    if ("event" in importedEvent) {
      events.push(importedEvent.event);
    } else {
      skippedReasons.push({ reason: importedEvent.reason, count: 1 });
    }
  }

  return { events, rawEventCount: candidates.length, skippedReasons };
}

function extractEventBlocks(html: string): string[] {
  const blocks: string[] = [];
  const blockPattern =
    /<(article|li|div)\b([^>]*(?:data-calendar-event|class=["'][^"']*(?:event|calendar)[^"']*)[^>]*)>([\s\S]*?)<\/\1>/gi;
  let match: RegExpExecArray | null;

  while ((match = blockPattern.exec(html)) !== null) {
    blocks.push(`<${match[1]}${match[2] ?? ""}>${match[3] ?? ""}</${match[1]}>`);
  }

  return blocks;
}

function normalizeListPageEvent(
  block: string,
  source: LocalCalendarSource,
  options: HtmlCalendarImportOptions
):
  | { event: LocalCalendarEvent }
  | { reason: Exclude<HtmlCalendarImportSkippedReason, "invalid-json" | "unsupported-source-kind"> } {
  const title = getAttribute(block, "data-title") ?? getHeadingText(block) ?? getFirstLinkText(block);
  const startsAt =
    getAttribute(block, "data-start") ??
    getAttribute(block, "datetime") ??
    getAttribute(block, "data-date");

  if (!title) {
    return { reason: "missing-title" };
  }

  if (!startsAt) {
    return { reason: "missing-start" };
  }

  const eventUrl = resolveUrl(
    getAttribute(block, "data-url") ?? getFirstLinkHref(block),
    options.linkBaseUrl ?? source.sourceUrl
  );
  const ticketUrl =
    resolveUrl(getAttribute(block, "data-ticket-url"), options.linkBaseUrl ?? source.sourceUrl) ??
    getTicketLinkFromBlock(block, options.linkBaseUrl ?? source.sourceUrl) ??
    eventUrl;
  const taxonomy = uniqueValues([
    ...splitListValue(getAttribute(block, "data-taxonomy")),
    ...(options.defaultTaxonomy ?? [])
  ]);
  const category = normalizeCategory(taxonomy);
  const venueName =
    getAttribute(block, "data-venue") ??
    getLabeledText(block, "data-venue") ??
    options.defaultVenueName ??
    source.label.replace(/\s+calendar$/i, "");
  const neighborhood =
    getAttribute(block, "data-neighborhood") ??
    options.defaultNeighborhood ??
    venueName;
  const presenter = getAttribute(block, "data-presenter") ?? source.label.replace(/\s+calendar$/i, "");
  const description =
    getAttribute(block, "data-description") ??
    `${title} imported from ${source.label}.`;
  const tags = uniqueValues([
    ...(options.defaultTags ?? []),
    ...taxonomy
  ])
    .map((tag) => tag.toLowerCase())
    .slice(0, 5);

  return {
    event: {
      calendarId: source.id,
      sourceKind: "html-calendar",
      sourceUrl: source.sourceUrl,
      externalId: createExternalId(eventUrl ?? title, startsAt, options.externalIdPrefix),
      title,
      presenter,
      taxonomy,
      startsAt,
      venueName,
      neighborhood,
      areaId: source.areaId,
      distanceMiles: options.defaultDistanceMiles ?? 0,
      description,
      tags: tags.length ? tags : [category],
      imageTone: options.defaultImageTone ?? "#4A6B5F",
      ticketUrl,
      priceCents: getBlockPriceCents(block),
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

function getAttribute(html: string, name: string): string | undefined {
  const pattern = new RegExp(`${escapeRegExp(name)}=["']([^"']+)["']`, "i");
  const match = pattern.exec(html);

  return match ? decodeHtmlEntities(match[1] ?? "") : undefined;
}

function getHeadingText(html: string): string | undefined {
  const match = /<h[1-6]\b[^>]*>([\s\S]*?)<\/h[1-6]>/i.exec(html);

  return match ? stripHtml(match[1] ?? "") : undefined;
}

function getFirstLinkText(html: string): string | undefined {
  const match = /<a\b[^>]*>([\s\S]*?)<\/a>/i.exec(html);

  return match ? stripHtml(match[1] ?? "") : undefined;
}

function getFirstLinkHref(html: string): string | undefined {
  const match = /<a\b[^>]*href=["']([^"']+)["'][^>]*>/i.exec(html);

  return match ? decodeHtmlEntities(match[1] ?? "") : undefined;
}

function getLabeledText(html: string, attribute: string): string | undefined {
  const pattern = new RegExp(
    `<[^>]+${escapeRegExp(attribute)}(?:=["'][^"']*["'])?[^>]*>([\\s\\S]*?)<\\/[^>]+>`,
    "i"
  );
  const match = pattern.exec(html);

  return match ? stripHtml(match[1] ?? "") : undefined;
}

function getTicketLinkFromBlock(html: string, baseUrl: string): string | undefined {
  const linkPattern = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
  let match: RegExpExecArray | null;

  while ((match = linkPattern.exec(html)) !== null) {
    const attributes = match[1] ?? "";
    const label = (stripHtml(match[2] ?? "") ?? "").toLowerCase();
    const href = getAttribute(attributes, "href");

    if (href && /(buy|ticket|tickets|reserve)/i.test(label)) {
      return resolveUrl(href, baseUrl);
    }
  }

  return undefined;
}

function getBlockPriceCents(html: string): number | undefined {
  const dataPrice = getAttribute(html, "data-price");
  const rawPrice =
    dataPrice ?? /\$\s*([0-9]+(?:\.[0-9]{1,2})?)/.exec(stripHtml(html) ?? "")?.[1];
  const price = rawPrice ? Number(rawPrice) : NaN;

  return Number.isFinite(price) ? Math.round(price * 100) : undefined;
}

function splitListValue(value: string | undefined): string[] {
  return value ? value.split(",").map((item) => item.trim()).filter(Boolean) : [];
}

function resolveUrl(value: string | undefined, baseUrl: string): string | undefined {
  if (!value) {
    return undefined;
  }

  try {
    return new URL(value, baseUrl).toString();
  } catch {
    return value;
  }
}

function stripHtml(value: string): string | undefined {
  const text = decodeHtmlEntities(value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " "));

  return text || undefined;
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
    .replace(/&#8217;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#34;/g, "\"")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .trim();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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
