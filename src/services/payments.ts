import type { CheckoutSession, PaymentIntent, PaymentMethod, TicketHold } from "../types";

export interface PaymentProvider {
  id: CheckoutSession["provider"];
  label: string;
  createPaymentIntent(hold: TicketHold, session: CheckoutSession): Promise<PaymentIntent>;
  confirmPayment(intent: PaymentIntent, method: PaymentMethod): Promise<PaymentIntent>;
}

export const mockCardPaymentMethod: PaymentMethod = {
  id: "pm_mock_visa",
  type: "card",
  label: "Visa",
  last4: "4242"
};

export class MockPaymentProvider implements PaymentProvider {
  id: CheckoutSession["provider"] = "mock-checkout";
  label = "Mock payment processor";

  async createPaymentIntent(hold: TicketHold, session: CheckoutSession): Promise<PaymentIntent> {
    return {
      id: `pi-${hold.id}`,
      holdId: hold.id,
      checkoutSessionId: session.id,
      provider: this.id,
      amountCents: hold.totalCents,
      currency: "USD",
      status: "requires_payment_method",
      clientSecret: `secret-${hold.id}`,
      createdAt: new Date().toISOString()
    };
  }

  async confirmPayment(intent: PaymentIntent, method: PaymentMethod): Promise<PaymentIntent> {
    if (intent.status === "failed") {
      throw new Error(intent.failureReason ?? "Payment intent failed.");
    }

    return {
      ...intent,
      status: "succeeded",
      paymentMethod: method,
      confirmedAt: new Date().toISOString()
    };
  }
}

export const paymentProvider = new MockPaymentProvider();
