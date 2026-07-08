import type { Show, TicketOffer } from "../types";

export type DealStrength = "standard" | "strong" | "best";

export type DealInsight = {
  show: Show;
  offer: TicketOffer;
  savingsCents: number;
  savingsPercent: number;
  score: number;
  strength: DealStrength;
  strengthLabel: string;
  urgencyLabel: string;
};

export type DealSummary = {
  dealCount: number;
  topSavingsCents: number;
  topSavingsPercent: number;
  strongestDeal?: DealInsight;
};

export function getOfferSavings(offer: TicketOffer | undefined): number {
  if (!offer?.listPriceCents || offer.priceCents === undefined) {
    return 0;
  }

  return Math.max(0, offer.listPriceCents - offer.priceCents);
}

export function getSavingsPercent(offer: TicketOffer | undefined): number {
  if (!offer?.listPriceCents || offer.listPriceCents <= 0 || offer.priceCents === undefined) {
    return offer?.deal?.discountPercent ?? 0;
  }

  return Math.round((getOfferSavings(offer) / offer.listPriceCents) * 100);
}

export function getDealInsights(
  shows: Show[],
  referenceNow = new Date().toISOString()
): DealInsight[] {
  return shows
    .map((show) => createDealInsight(show, referenceNow))
    .filter((insight): insight is DealInsight => Boolean(insight))
    .sort(
      (first, second) =>
        second.score - first.score || first.show.startsAt.localeCompare(second.show.startsAt)
    );
}

export function getDealSummary(shows: Show[], referenceNow = new Date().toISOString()): DealSummary {
  const insights = getDealInsights(shows, referenceNow);
  const strongestDeal = insights[0];

  return {
    dealCount: insights.length,
    topSavingsCents: strongestDeal?.savingsCents ?? 0,
    topSavingsPercent: strongestDeal?.savingsPercent ?? 0,
    strongestDeal
  };
}

function createDealInsight(show: Show, referenceNow: string): DealInsight | undefined {
  const offer = getBestDiscountedOffer(show);

  if (!offer) {
    return undefined;
  }

  const savingsCents = getOfferSavings(offer);
  const savingsPercent = getSavingsPercent(offer);
  const urgencyScore = getUrgencyScore(show, offer, referenceNow);
  const score = savingsPercent * 100 + Math.round(savingsCents / 100) + urgencyScore;
  const strength = getDealStrength(savingsCents, savingsPercent);

  return {
    show,
    offer,
    savingsCents,
    savingsPercent,
    score,
    strength,
    strengthLabel: getDealStrengthLabel(strength),
    urgencyLabel: getUrgencyLabel(show, offer, referenceNow)
  };
}

function getBestDiscountedOffer(show: Show): TicketOffer | undefined {
  return show.ticketOffers
    .filter((offer) => Boolean(offer.deal))
    .sort((first, second) => {
      const percentDelta = getSavingsPercent(second) - getSavingsPercent(first);
      const savingsDelta = getOfferSavings(second) - getOfferSavings(first);

      return percentDelta || savingsDelta || getDealOfferPrice(first) - getDealOfferPrice(second);
    })[0];
}

function getDealOfferPrice(offer: TicketOffer): number {
  return offer.priceCents ?? Number.MAX_SAFE_INTEGER;
}

function getDealStrength(savingsCents: number, savingsPercent: number): DealStrength {
  if (savingsPercent >= 25 || savingsCents >= 2000) {
    return "best";
  }

  if (savingsPercent >= 15 || savingsCents >= 1000) {
    return "strong";
  }

  return "standard";
}

function getDealStrengthLabel(strength: DealStrength): string {
  if (strength === "best") {
    return "Best deal";
  }

  if (strength === "strong") {
    return "Strong deal";
  }

  return "Deal";
}

function getUrgencyScore(show: Show, offer: TicketOffer, referenceNow: string): number {
  const now = new Date(referenceNow).getTime();
  const startsAt = new Date(show.startsAt).getTime();
  const expiresAt = offer.deal?.expiresAt ? new Date(offer.deal.expiresAt).getTime() : startsAt;
  const expiresWithinHours = (expiresAt - now) / (60 * 60 * 1000);
  const startsWithinHours = (startsAt - now) / (60 * 60 * 1000);

  if (expiresWithinHours >= 0 && expiresWithinHours <= 12) {
    return 25;
  }

  if (expiresWithinHours >= 0 && expiresWithinHours <= 24) {
    return 15;
  }

  if (startsWithinHours >= 0 && startsWithinHours <= 48) {
    return 8;
  }

  return 0;
}

function getUrgencyLabel(show: Show, offer: TicketOffer, referenceNow: string): string {
  const now = new Date(referenceNow).getTime();
  const startsAt = new Date(show.startsAt).getTime();
  const expiresAt = offer.deal?.expiresAt ? new Date(offer.deal.expiresAt).getTime() : startsAt;
  const expiresWithinHours = (expiresAt - now) / (60 * 60 * 1000);
  const startsWithinHours = (startsAt - now) / (60 * 60 * 1000);

  if (expiresWithinHours >= 0 && expiresWithinHours <= 12) {
    return "Expires soon";
  }

  if (startsWithinHours >= 0 && startsWithinHours <= 24) {
    return "Tonight";
  }

  if (startsWithinHours >= 0 && startsWithinHours <= 72) {
    return "This weekend";
  }

  return "Upcoming";
}
