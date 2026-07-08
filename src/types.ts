export type ShowCategory =
  | "concert"
  | "dj"
  | "dance"
  | "ballet"
  | "opera"
  | "play"
  | "theater"
  | "comedy"
  | "variety";

export type DateWindow = "all" | "tonight" | "week" | "weekend";

export type Coordinates = {
  latitude: number;
  longitude: number;
};

export type Area = {
  id: string;
  name: string;
  region: string;
  timezone: string;
  coordinates: Coordinates;
  discoveryRole: "primary" | "secondary" | "test";
  discoveryLabel: string;
  discoveryNote: string;
};

export type InventorySource =
  | "calendar-feed"
  | "venue-direct"
  | "promoter"
  | "partner-feed"
  | "primary-marketplace"
  | "verified-resale";

export type OfferAccess = "mobile-entry" | "will-call" | "external-transfer";

export type Deal = {
  id: string;
  label: string;
  description: string;
  code?: string;
  discountPercent?: number;
  amountOffCents?: number;
  expiresAt: string;
};

export type TicketOffer = {
  id: string;
  label: string;
  priceCents: number;
  listPriceCents?: number;
  currency: "USD";
  remaining: number;
  maxQuantity: number;
  access: OfferAccess;
  source: InventorySource;
  externalUrl?: string;
  deal?: Deal;
  perks?: string[];
};

export type Show = {
  id: string;
  title: string;
  artistOrCompany: string;
  category: ShowCategory;
  startsAt: string;
  venue: string;
  neighborhood: string;
  areaId: string;
  distanceMiles: number;
  vibe: string[];
  description: string;
  ticketOffers: TicketOffer[];
  source: InventorySource;
  imageTone: string;
  recommendationSignals?: string[];
};

export type ShowSearchFilters = {
  areaId: string;
  categories: ShowCategory[];
  neighborhoods?: string[];
  query: string;
  onlyDeals: boolean;
  dateWindow: DateWindow;
  referenceNow?: string;
};

export type TicketHoldRequest = {
  showId: string;
  offerId: string;
  quantity: number;
  dealId?: string;
};

export type TicketHold = {
  id: string;
  showId: string;
  offerId: string;
  quantity: number;
  discountCents: number;
  subtotalCents: number;
  feesCents: number;
  totalCents: number;
  expiresAt: string;
  appliedDeal?: Deal;
};

export type CheckoutSession = {
  id: string;
  holdId: string;
  provider: "mock-checkout" | "stripe-payment-sheet" | "provider-native";
  status: "ready" | "payment_pending" | "paid";
  paymentIntentId?: string;
  confirmationCode?: string;
};

export type PaymentMethod = {
  id: string;
  type: "card" | "apple-pay" | "google-pay" | "provider-wallet";
  label: string;
  last4?: string;
};

export type PaymentIntent = {
  id: string;
  holdId: string;
  checkoutSessionId: string;
  provider: CheckoutSession["provider"];
  amountCents: number;
  currency: "USD";
  status: "requires_payment_method" | "processing" | "succeeded" | "failed";
  clientSecret?: string;
  paymentMethod?: PaymentMethod;
  createdAt: string;
  confirmedAt?: string;
  failureReason?: string;
};

export type UserSession = {
  userId: string;
  displayName: string;
  email: string;
  status: "signed_in" | "signed_out";
  createdAt: string;
  updatedAt: string;
};

export type PurchasedTicket = {
  id: string;
  orderId: string;
  showId: string;
  offerId: string;
  status: "active" | "used" | "transferred";
  holderName: string;
  barcodePayload: string;
};

export type TicketOrder = {
  id: string;
  showId: string;
  offerId: string;
  quantity: number;
  confirmationCode: string;
  purchasedAt: string;
  subtotalCents: number;
  discountCents: number;
  feesCents: number;
  totalCents: number;
  delivery: OfferAccess;
  buyerUserId: string;
  buyerName: string;
  tickets: PurchasedTicket[];
};

export type UserPreferences = {
  selectedAreaId: string;
  selectedCategories: ShowCategory[];
  selectedNeighborhoods: string[];
  dateWindow: DateWindow;
  onlyDeals: boolean;
  dealAlertMaxPriceCents?: number;
  tasteEnabled: boolean;
  savedShowIds: string[];
  dealAlerts: DealAlert[];
  notifications: NotificationMessage[];
  userSession?: UserSession | null;
  musicConnection?: MusicAccountConnection | null;
  locationStatus: string;
  updatedAt: string;
};

export type DealAlert = {
  id: string;
  areaId: string;
  categories: ShowCategory[];
  dateWindow: DateWindow;
  maxPriceCents?: number;
  status: "active" | "paused";
  createdAt: string;
  updatedAt: string;
};

export type DealAlertMatch = {
  alert: DealAlert;
  show: Show;
  offer: TicketOffer;
  savingsCents: number;
};

export type NotificationChannel = "in-app" | "push" | "email";

export type NotificationMessage = {
  id: string;
  type: "deal_alert_match";
  status: "unread" | "read" | "archived";
  title: string;
  body: string;
  showId: string;
  offerId: string;
  alertId: string;
  channels: NotificationChannel[];
  createdAt: string;
};

export type MusicService = "spotify";

export type MusicAccountConnection = {
  id: string;
  service: MusicService;
  displayName: string;
  status: "connected" | "disconnected";
  connectedAt: string;
  topArtists: string[];
  topGenres: string[];
  updatedAt: string;
};

export type RecommendationContext = {
  areaId: string;
  followedArtists?: string[];
  spotifyTopGenres?: string[];
  recentCategories?: ShowCategory[];
};

export type Recommendation = {
  show: Show;
  score: number;
  reason: string;
};

export type EventProvider = {
  id: string;
  label: string;
  listShows(filters: ShowSearchFilters): Promise<Show[]>;
  getShow(showId: string): Promise<Show | undefined>;
};

export type LocationFix = {
  coordinates: Coordinates;
  source: "demo" | "device" | "manual";
  accuracyMeters?: number;
  resolvedAt: string;
};

export type LocationProvider = {
  id: string;
  label: string;
  getCurrentLocation(): Promise<LocationFix>;
};

export type DiscoverySourceType =
  | "seed-catalog"
  | "marketplace-api"
  | "venue-direct"
  | "promoter-feed"
  | "partner-feed"
  | "calendar-feed";

export type DiscoverySourceLane = "broad-api" | "local-pipeline" | "seed-fixture";

export type DiscoverySourceStatus =
  | "active-fixture"
  | "integration-ready"
  | "partner-needed"
  | "deferred";

export type DiscoverySourcePlan = {
  id: string;
  label: string;
  sourceType: DiscoverySourceType;
  lane: DiscoverySourceLane;
  status: DiscoverySourceStatus;
  categories: ShowCategory[];
  notes: string;
};

export type DiscoveryMarketPlan = {
  areaId: string;
  priority: number;
  categoryFocus: ShowCategory[];
  discountLevers: string[];
  sources: DiscoverySourcePlan[];
};
