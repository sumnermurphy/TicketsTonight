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
export type DiscoverySortMode = "soonest" | "cheapest" | "nearby";

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
  priceCents?: number;
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
  maxPriceCents?: number;
  dateWindow: DateWindow;
  sortMode?: DiscoverySortMode;
  referenceNow?: string;
  resultLimit?: number;
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
  maxPriceCents?: number;
  discoverySortMode: DiscoverySortMode;
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
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: string;
  scope?: string;
  topArtists: string[];
  topTracks: string[];
  topGenres: string[];
  updatedAt: string;
};

export type RecommendationContext = {
  areaId: string;
  followedArtists?: string[];
  spotifyTopTracks?: string[];
  spotifyTopGenres?: string[];
  recentCategories?: ShowCategory[];
};

export type RecommendationMatchKind = "artist" | "track" | "genre" | "category";

export type RecommendationMatch = {
  kind: RecommendationMatchKind;
  value: string;
};

export type Recommendation = {
  show: Show;
  score: number;
  reason: string;
  matches?: RecommendationMatch[];
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

export type GalleryAreaId = "nyc" | "la" | "hudson";

export type GalleryMedium =
  | "painting"
  | "photography"
  | "sculpture"
  | "installation"
  | "video"
  | "performance"
  | "design"
  | "prints"
  | "mixed-media";

export type GalleryKind =
  | "blue-chip"
  | "emerging"
  | "nonprofit"
  | "artist-run"
  | "project-space"
  | "museum";

export type GalleryEventKind =
  | "opening-reception"
  | "artist-talk"
  | "walkthrough"
  | "rsvp-preview"
  | "closing-party";

export type GallerySourceLegalStatus =
  | "official-public-page"
  | "partner-submission"
  | "permission-required"
  | "do-not-ingest";

export type GallerySourceFreshness = "fresh" | "needs-review" | "stale-risk";

export type GallerySourceCandidateType =
  | "commercial-gallery"
  | "nonprofit"
  | "artist-run"
  | "project-space"
  | "museum"
  | "partner-submission";

export type GalleryImportLane = "manual-seed" | "partner-submission" | "official-page-ready";

export type GalleryImportRecordKind = "manual-seed" | "partner-submission";

export type GallerySubmissionReviewStatus =
  | "needs-review"
  | "approved"
  | "rejected"
  | "needs-more-info";

export type GalleryHoursInterval = {
  day: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  opens: string;
  closes: string;
};

export type GallerySpecialEvent = {
  id: string;
  kind: GalleryEventKind;
  title: string;
  startsAt: string;
  endsAt?: string;
  rsvpUrl?: string;
};

export type GalleryArea = {
  id: GalleryAreaId;
  name: string;
  region: string;
  timezone: string;
  role: "primary" | "secondary" | "arts-town-test";
  description: string;
};

export type GalleryNeighborhood = {
  id: string;
  areaId: GalleryAreaId;
  name: string;
  walkLabel: string;
  anchor: Coordinates;
};

export type GalleryExhibition = {
  id: string;
  sourceCandidateId?: string;
  importRecordId?: string;
  title: string;
  artists: string[];
  galleryName: string;
  galleryKind: GalleryKind;
  areaId: GalleryAreaId;
  neighborhood: string;
  address: string;
  coordinates: Coordinates;
  distanceMiles: number;
  mediums: GalleryMedium[];
  opensAt: string;
  closesAt: string;
  receptionAt?: string;
  specialEvents: GallerySpecialEvent[];
  hours: GalleryHoursInterval[];
  externalUrl: string;
  rsvpUrl?: string;
  imageTone: string;
  source: "seed-fixture" | "official-page" | "gallery-submission" | "manual-review";
  sourceLegalStatus: GallerySourceLegalStatus;
  sourceFreshness: GallerySourceFreshness;
  sourceUpdatedAt: string;
  description: string;
  whyGoSignals: string[];
};

export type GalleryLogStatus = "saved" | "want-to-see" | "visited" | "skipped";

export type GalleryLogEntry = {
  exhibitionId: string;
  status: GalleryLogStatus;
  note?: string;
  updatedAt: string;
};

export type GallerySubmissionDraft = {
  id: string;
  galleryName: string;
  areaId: GalleryAreaId;
  title: string;
  artists: string[];
  opensAt: string;
  closesAt: string;
  receptionAt?: string;
  externalUrl: string;
  submitterEmail?: string;
  notes?: string;
  sourceLegalStatus: "partner-submission";
  status: "ready-for-review" | "needs-required-fields";
  createdAt: string;
};

export type GallerySourceCandidate = {
  id: string;
  galleryName: string;
  galleryKind: GalleryKind;
  areaId: GalleryAreaId;
  neighborhood: string;
  city: string;
  address: string;
  coordinates: Coordinates;
  websiteUrl: string;
  exhibitionsUrl: string;
  hoursUrl?: string;
  submissionUrl?: string;
  contactUrl?: string;
  sourceType: GallerySourceCandidateType;
  preferredImportLane: GalleryImportLane;
  sourceLegalStatus: GallerySourceLegalStatus;
  sourceFreshness: GallerySourceFreshness;
  lastCheckedAt: string;
  confidence: number;
  defaultHours: GalleryHoursInterval[];
  notes: string;
};

export type GalleryImportPayload = {
  title: string;
  artists: string[];
  mediums: GalleryMedium[];
  opensAt: string;
  closesAt: string;
  receptionAt?: string;
  externalUrl: string;
  description: string;
  imageTone?: string;
};

export type GalleryImportRecord = {
  id: string;
  sourceCandidateId: string;
  kind: GalleryImportRecordKind;
  sourceUrl: string;
  sourceCheckedAt: string;
  sourceFreshness: GallerySourceFreshness;
  sourceLegalStatus: GallerySourceLegalStatus;
  confidence: number;
  payload: GalleryImportPayload;
  normalizedExhibitionId?: string;
  errors: string[];
};

export type GallerySubmissionQueueItem = {
  id: string;
  draft: GallerySubmissionDraft;
  sourceCandidateId?: string;
  status: GallerySubmissionReviewStatus;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewNotes?: string;
  approvedImportRecordId?: string;
  approvedExhibitionId?: string;
};
