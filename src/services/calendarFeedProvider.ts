import {
  localCalendarEvents,
  type LocalCalendarEvent
} from "../data/localCalendarFeeds";
import type { Deal, Show, TicketOffer } from "../types";
import { normalizeCategory } from "./feedProvider";

export function normalizeCalendarEvent(event: LocalCalendarEvent): Show {
  return {
    id: `calendar-${event.calendarId}-${event.externalId}`,
    title: event.title,
    artistOrCompany: event.presenter,
    category: normalizeCategory(event.taxonomy),
    startsAt: event.startsAt,
    venue: event.venueName,
    neighborhood: event.neighborhood,
    areaId: event.areaId,
    distanceMiles: event.distanceMiles,
    vibe: event.tags,
    description: event.description,
    ticketOffers: createCalendarOffers(event),
    source: "calendar-feed",
    imageTone: event.imageTone,
    recommendationSignals: event.recommendationSignals
  };
}

function createCalendarOffers(event: LocalCalendarEvent): TicketOffer[] {
  if (event.priceCents === undefined) {
    return [];
  }

  return [
    {
      id: "calendar-listing",
      label: "Calendar listing",
      priceCents: event.priceCents,
      listPriceCents: event.listPriceCents,
      currency: "USD",
      remaining: event.remainingEstimate ?? 10,
      maxQuantity: event.maxQuantity ?? 4,
      access: "external-transfer",
      source: "calendar-feed",
      externalUrl: event.ticketUrl,
      deal: createCalendarDeal(event),
      perks: [`${getSourceKindLabel(event.sourceKind)} source`]
    }
  ];
}

function createCalendarDeal(event: LocalCalendarEvent): Deal | undefined {
  if (!event.dealLabel) {
    return undefined;
  }

  return {
    id: `deal-calendar-${event.calendarId}-${event.externalId}`,
    label: event.dealLabel,
    description: event.dealDescription ?? event.dealLabel,
    expiresAt: event.dealExpiresAt ?? event.startsAt,
    amountOffCents: event.amountOffCents
  };
}

function getSourceKindLabel(sourceKind: LocalCalendarEvent["sourceKind"]): string {
  if (sourceKind === "ics") {
    return "ICS calendar";
  }

  if (sourceKind === "rss") {
    return "RSS calendar";
  }

  if (sourceKind === "html-calendar") {
    return "Calendar";
  }

  return "Manual import";
}

export const normalizedLocalCalendarShows = localCalendarEvents.map(normalizeCalendarEvent);
