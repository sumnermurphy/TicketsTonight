import { partnerFeedEvents, type PartnerFeedEvent, type PartnerFeedOffer } from "../data/partnerFeeds";
import type { Show, ShowCategory, TicketOffer } from "../types";

const categoryAliases: Record<string, ShowCategory> = {
  "arts & theatre": "theater",
  ballet: "ballet",
  cabaret: "variety",
  classical: "opera",
  "club dance": "dj",
  comedy: "comedy",
  concert: "concert",
  dance: "dance",
  "dance/electronic": "dj",
  dj: "dj",
  electronic: "dj",
  house: "dj",
  immersive: "variety",
  magic: "variety",
  miscellaneous: "variety",
  musical: "theater",
  music: "concert",
  "new writing": "play",
  opera: "opera",
  pop: "concert",
  play: "play",
  plays: "play",
  drama: "play",
  rock: "concert",
  "special events": "variety",
  "spoken word": "variety",
  storytelling: "variety",
  theatre: "theater",
  theater: "theater",
  variety: "variety"
};

const categoryPriority: ShowCategory[] = [
  "ballet",
  "opera",
  "dance",
  "dj",
  "play",
  "comedy",
  "variety",
  "theater",
  "concert"
];

export function normalizeFeedEvent(event: PartnerFeedEvent): Show {
  return {
    id: `feed-${event.providerId}-${event.externalId}`,
    title: event.title,
    artistOrCompany: event.performer,
    category: normalizeCategory(event.taxonomy),
    startsAt: event.startsAt,
    venue: event.venueName,
    neighborhood: event.neighborhood,
    areaId: event.areaId,
    distanceMiles: event.distanceMiles,
    vibe: event.tags,
    description: event.description,
    ticketOffers: event.offers.map((offer) => normalizeFeedOffer(event, offer)),
    source: event.source,
    imageTone: event.imageTone,
    recommendationSignals: event.recommendationSignals
  };
}

export function normalizeCategory(taxonomy: Array<string | undefined>): ShowCategory {
  const matches = new Set<ShowCategory>();

  for (const value of taxonomy) {
    const category = value ? categoryAliases[value.trim().toLowerCase()] : undefined;

    if (category) {
      matches.add(category);
    }
  }

  return categoryPriority.find((category) => matches.has(category)) ?? "concert";
}

function normalizeFeedOffer(event: PartnerFeedEvent, offer: PartnerFeedOffer): TicketOffer {
  return {
    id: offer.id,
    label: offer.name,
    priceCents: offer.priceCents,
    listPriceCents: offer.faceValueCents,
    currency: "USD",
    remaining: offer.remaining,
    maxQuantity: offer.maxQuantity,
    access: offer.access,
    source: offer.source,
    deal: offer.dealLabel
      ? {
          id: `deal-${event.providerId}-${event.externalId}-${offer.id}`,
          label: offer.dealLabel,
          description: offer.dealDescription ?? offer.dealLabel,
          expiresAt: offer.dealExpiresAt ?? event.startsAt,
          amountOffCents: offer.amountOffCents,
          discountPercent: offer.discountPercent
        }
      : undefined,
    perks: offer.perks
  };
}

export const normalizedPartnerFeedShows = partnerFeedEvents.map(normalizeFeedEvent);
