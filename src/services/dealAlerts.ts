import { getBestOffer, isWithinDateWindow } from "./eventCatalog";
import type { DateWindow, DealAlert, DealAlertMatch, Show, ShowCategory } from "../types";

export type DealAlertInput = {
  areaId: string;
  categories: ShowCategory[];
  dateWindow: DateWindow;
  maxPriceCents?: number;
};

export function createDealAlert(input: DealAlertInput, now = new Date().toISOString()): DealAlert {
  const normalizedCategories = [...new Set(input.categories)].sort();
  const maxPriceKey = input.maxPriceCents ? `under-${input.maxPriceCents}` : "any-price";

  return {
    id: `deal-alert-${input.areaId}-${input.dateWindow}-${normalizedCategories.join("-") || "all"}-${maxPriceKey}`,
    areaId: input.areaId,
    categories: normalizedCategories,
    dateWindow: input.dateWindow,
    maxPriceCents: input.maxPriceCents,
    status: "active",
    createdAt: now,
    updatedAt: now
  };
}

export function toggleDealAlertStatus(alert: DealAlert, now = new Date().toISOString()): DealAlert {
  return {
    ...alert,
    status: alert.status === "active" ? "paused" : "active",
    updatedAt: now
  };
}

export function getDealAlertMatches(
  alerts: DealAlert[],
  shows: Show[],
  referenceNow = new Date().toISOString()
): DealAlertMatch[] {
  return alerts
    .filter((alert) => alert.status === "active")
    .flatMap((alert) =>
      shows
        .filter((show) => showMatchesAlert(show, alert, referenceNow))
        .map((show) => {
          const offer = getBestOffer(show);

          if (!offer?.deal) {
            return undefined;
          }

          return {
            alert,
            show,
            offer,
            savingsCents: Math.max(0, (offer.listPriceCents ?? offer.priceCents) - offer.priceCents)
          };
        })
        .filter((match): match is DealAlertMatch => Boolean(match))
    )
    .sort((first, second) => second.savingsCents - first.savingsCents);
}

function showMatchesAlert(show: Show, alert: DealAlert, referenceNow: string): boolean {
  const offer = getBestOffer(show);

  if (!offer?.deal) {
    return false;
  }

  if (show.areaId !== alert.areaId) {
    return false;
  }

  if (alert.categories.length && !alert.categories.includes(show.category)) {
    return false;
  }

  if (alert.maxPriceCents && offer.priceCents > alert.maxPriceCents) {
    return false;
  }

  return isWithinDateWindow(show.startsAt, alert.dateWindow, referenceNow);
}
