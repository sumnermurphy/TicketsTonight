import type { InventorySource, Show, TicketOffer } from "../types";
import { getBestOffer } from "./eventCatalog";

export type TicketLinkIntent = {
  showId: string;
  offerId: string;
  label: string;
  url: string;
  source: InventorySource;
  priceCents: number;
  dealLabel?: string;
};

export function getSafeTicketUrl(url: string | undefined): string | undefined {
  if (!url?.trim()) {
    return undefined;
  }

  try {
    const parsedUrl = new URL(url.trim());

    return parsedUrl.protocol === "https:" || parsedUrl.protocol === "http:"
      ? parsedUrl.toString()
      : undefined;
  } catch {
    return undefined;
  }
}

export function getTicketLinkIntent(show: Show, offer: TicketOffer): TicketLinkIntent | undefined {
  const url = getSafeTicketUrl(offer.externalUrl);

  if (!url) {
    return undefined;
  }

  return {
    showId: show.id,
    offerId: offer.id,
    label: offer.label,
    url,
    source: offer.source,
    priceCents: offer.priceCents,
    dealLabel: offer.deal?.label
  };
}

export function getBestTicketLinkIntent(show: Show): TicketLinkIntent | undefined {
  const bestOffer = getBestOffer(show);
  const orderedOffers = bestOffer
    ? [bestOffer, ...show.ticketOffers.filter((offer) => offer.id !== bestOffer.id)]
    : show.ticketOffers;

  for (const offer of orderedOffers) {
    const intent = getTicketLinkIntent(show, offer);

    if (intent) {
      return intent;
    }
  }

  return undefined;
}
