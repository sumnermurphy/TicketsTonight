import { getShowById } from "./eventCatalog";
import type {
  CheckoutSession,
  PaymentIntent,
  TicketHold,
  TicketHoldRequest,
  TicketOrder,
  UserSession
} from "../types";

const SERVICE_FEE_RATE = 0.11;

export interface TicketingProvider {
  createHold(request: TicketHoldRequest): Promise<TicketHold>;
  createCheckoutSession(hold: TicketHold): Promise<CheckoutSession>;
  attachPaymentIntent(session: CheckoutSession, intent: PaymentIntent): Promise<CheckoutSession>;
  markPaid(session: CheckoutSession, intent: PaymentIntent): Promise<CheckoutSession>;
  createOrder(hold: TicketHold, session: CheckoutSession, buyer: UserSession): Promise<TicketOrder>;
}

export class MockTicketingProvider implements TicketingProvider {
  async createHold(request: TicketHoldRequest): Promise<TicketHold> {
    const show = getShowById(request.showId);
    const offer = show?.ticketOffers.find((candidate) => candidate.id === request.offerId);

    if (!show || !offer) {
      throw new Error("That ticket offer is no longer available.");
    }

    const maxAllowed = Math.min(offer.remaining, offer.maxQuantity);

    if (request.quantity < 1 || request.quantity > maxAllowed) {
      throw new Error("Choose a quantity that is currently available.");
    }

    const subtotalCents = offer.priceCents * request.quantity;
    const listSubtotalCents = (offer.listPriceCents ?? offer.priceCents) * request.quantity;
    const discountCents = Math.max(0, listSubtotalCents - subtotalCents);
    const feesCents = Math.round(subtotalCents * SERVICE_FEE_RATE);

    return {
      id: `hold-${request.showId}-${Date.now()}`,
      showId: request.showId,
      offerId: request.offerId,
      quantity: request.quantity,
      discountCents,
      subtotalCents,
      feesCents,
      totalCents: subtotalCents + feesCents,
      expiresAt: new Date(Date.now() + 8 * 60 * 1000).toISOString(),
      appliedDeal: offer.deal
    };
  }

  async createCheckoutSession(hold: TicketHold): Promise<CheckoutSession> {
    return {
      id: `checkout-${hold.id}`,
      holdId: hold.id,
      provider: "mock-checkout",
      status: "ready"
    };
  }

  async attachPaymentIntent(session: CheckoutSession, intent: PaymentIntent): Promise<CheckoutSession> {
    if (session.holdId !== intent.holdId) {
      throw new Error("Payment intent does not match this checkout session.");
    }

    return {
      ...session,
      paymentIntentId: intent.id,
      status: "payment_pending"
    };
  }

  async markPaid(session: CheckoutSession, intent: PaymentIntent): Promise<CheckoutSession> {
    if (session.paymentIntentId !== intent.id || intent.status !== "succeeded") {
      throw new Error("Checkout session cannot be marked paid until payment succeeds.");
    }

    return {
      ...session,
      status: "paid",
      confirmationCode: `TT-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
    };
  }

  async createOrder(hold: TicketHold, session: CheckoutSession, buyer: UserSession): Promise<TicketOrder> {
    const show = getShowById(hold.showId);
    const offer = show?.ticketOffers.find((candidate) => candidate.id === hold.offerId);

    if (!show || !offer || session.status !== "paid" || !session.confirmationCode) {
      throw new Error("Paid ticket order could not be created.");
    }

    if (buyer.status !== "signed_in") {
      throw new Error("Sign in before creating a ticket order.");
    }

    const orderId = `order-${session.confirmationCode.toLowerCase()}`;

    return {
      id: orderId,
      showId: hold.showId,
      offerId: hold.offerId,
      quantity: hold.quantity,
      confirmationCode: session.confirmationCode,
      purchasedAt: new Date().toISOString(),
      subtotalCents: hold.subtotalCents,
      discountCents: hold.discountCents,
      feesCents: hold.feesCents,
      totalCents: hold.totalCents,
      delivery: offer.access,
      buyerUserId: buyer.userId,
      buyerName: buyer.displayName,
      tickets: Array.from({ length: hold.quantity }, (_, index) => ({
        id: `${orderId}-ticket-${index + 1}`,
        orderId,
        showId: hold.showId,
        offerId: hold.offerId,
        status: "active",
        holderName: buyer.displayName,
        barcodePayload: `${session.confirmationCode}-${hold.showId}-${index + 1}`
      }))
    };
  }
}

export const ticketingProvider = new MockTicketingProvider();
