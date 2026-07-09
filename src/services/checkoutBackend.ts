import { mockCardPaymentMethod, paymentProvider, type PaymentProvider } from "./payments";
import { ticketingProvider, type TicketingProvider } from "./ticketing";
import type {
  CheckoutSession,
  PaymentIntent,
  PaymentMethod,
  TicketHold,
  TicketHoldRequest,
  TicketOrder,
  UserSession
} from "../types";

export type PreparedCheckout = {
  hold: TicketHold;
  session: CheckoutSession;
  paymentIntent: PaymentIntent;
  paymentMethod: PaymentMethod;
};

export type CompletedCheckout = {
  session: CheckoutSession;
  paymentIntent: PaymentIntent;
  order: TicketOrder;
  paymentMethod: PaymentMethod;
};

export type CompleteCheckoutRequest = {
  hold: TicketHold;
  session: CheckoutSession;
  paymentIntent: PaymentIntent;
  buyer: UserSession;
  paymentMethod?: PaymentMethod;
};

export interface CheckoutBackend {
  id: string;
  label: string;
  prepareCheckout(request: TicketHoldRequest): Promise<PreparedCheckout>;
  completeCheckout(request: CompleteCheckoutRequest): Promise<CompletedCheckout>;
}

type MockCheckoutBackendOptions = {
  ticketing: TicketingProvider;
  payments: PaymentProvider;
  defaultPaymentMethod: PaymentMethod;
};

export class MockCheckoutBackend implements CheckoutBackend {
  id = "mock-checkout-backend";
  label = "Mock backend checkout";

  constructor(private readonly options: MockCheckoutBackendOptions) {}

  async prepareCheckout(request: TicketHoldRequest): Promise<PreparedCheckout> {
    const hold = await this.options.ticketing.createHold(request);
    const session = await this.options.ticketing.createCheckoutSession(hold);
    const paymentIntent = await this.options.payments.createPaymentIntent(hold, session);
    const payableSession = await this.options.ticketing.attachPaymentIntent(session, paymentIntent);

    return {
      hold,
      session: payableSession,
      paymentIntent,
      paymentMethod: this.options.defaultPaymentMethod
    };
  }

  async completeCheckout(request: CompleteCheckoutRequest): Promise<CompletedCheckout> {
    const paymentMethod = request.paymentMethod ?? this.options.defaultPaymentMethod;
    const paymentIntent = await this.options.payments.confirmPayment(
      request.paymentIntent,
      paymentMethod
    );
    const session = await this.options.ticketing.markPaid(request.session, paymentIntent);
    const order = await this.options.ticketing.createOrder(request.hold, session, request.buyer);

    return {
      session,
      paymentIntent,
      order,
      paymentMethod
    };
  }
}

export const checkoutBackend = new MockCheckoutBackend({
  ticketing: ticketingProvider,
  payments: paymentProvider,
  defaultPaymentMethod: mockCardPaymentMethod
});
