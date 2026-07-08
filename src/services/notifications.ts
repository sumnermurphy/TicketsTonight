import type { DealAlertMatch, NotificationMessage } from "../types";
import { formatMoney } from "../utils/format";

export interface NotificationProvider {
  id: string;
  label: string;
  createDealAlertNotifications(
    matches: DealAlertMatch[],
    now?: string
  ): Promise<NotificationMessage[]>;
}

export class InAppNotificationProvider implements NotificationProvider {
  id = "in-app-notifications";
  label = "In-app notifications";

  async createDealAlertNotifications(
    matches: DealAlertMatch[],
    now = new Date().toISOString()
  ): Promise<NotificationMessage[]> {
    return matches.map((match) => ({
      id: `notification-${match.alert.id}-${match.show.id}-${match.offer.id}`,
      type: "deal_alert_match",
      status: "unread",
      title: `${match.offer.deal?.label ?? "Deal"} for ${match.show.title}`,
      body:
        match.savingsCents > 0
          ? `${formatOfferPrice(match.offer.priceCents)} now, save ${formatMoney(match.savingsCents)}.`
          : `${formatOfferPrice(match.offer.priceCents)} is available now.`,
      showId: match.show.id,
      offerId: match.offer.id,
      alertId: match.alert.id,
      channels: ["in-app"],
      createdAt: now
    }));
  }
}

function formatOfferPrice(priceCents: number | undefined): string {
  return priceCents === undefined ? "Provider price" : formatMoney(priceCents);
}

export function mergeNotifications(
  existing: NotificationMessage[],
  incoming: NotificationMessage[]
): NotificationMessage[] {
  const byId = new Map(existing.map((notification) => [notification.id, notification]));

  for (const notification of incoming) {
    const current = byId.get(notification.id);
    byId.set(notification.id, current ? { ...notification, status: current.status } : notification);
  }

  return Array.from(byId.values()).sort(
    (first, second) => new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime()
  );
}

export function markNotificationRead(
  notifications: NotificationMessage[],
  notificationId: string
): NotificationMessage[] {
  return notifications.map((notification) =>
    notification.id === notificationId ? { ...notification, status: "read" } : notification
  );
}

export const notificationProvider = new InAppNotificationProvider();
